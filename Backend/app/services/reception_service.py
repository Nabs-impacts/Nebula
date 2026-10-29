import email
import email.header
import email.utils
import html
import imaplib
import re
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.models.entreprise import Entreprise, StatutProspection
from app.models.message import Message
from app.models.reponse_recue import ReponseRecue

# État conservé en mémoire pour éviter de reparcourir toute la boîte à chaque cycle
_DERNIER_UID_TRAITE: int | None = None
_DATE_DERNIERE_VERIFICATION: datetime | None = None


def decoder_entete(entete: str | None) -> str:
    """Décode les en-têtes RFC 2047 (=?UTF-8?B?...?= ou =?ISO-8859-1?Q?...?=)."""
    if not entete:
        return ""
    fragments = []
    try:
        elements = email.header.decode_header(entete)
        for fragment, encodage in elements:
            if isinstance(fragment, bytes):
                enc = encodage or "utf-8"
                try:
                    fragments.append(fragment.decode(enc, errors="replace"))
                except (LookupError, UnicodeDecodeError):
                    fragments.append(fragment.decode("utf-8", errors="replace"))
            else:
                fragments.append(str(fragment))
        return " ".join(fragments).strip()
    except Exception:
        return str(entete).strip()


def _nettoyer_html(html_str: str) -> str:
    """Convertit du HTML en texte brut basique sans dépendance externe."""
    texte = re.sub(r"(?is)<style.*?>.*?</style>", "", html_str)
    texte = re.sub(r"(?is)<script.*?>.*?</script>", "", texte)
    texte = re.sub(r"(?i)<(br|/p|/div|/tr|/h[1-6])>", "\n", texte)
    texte = re.sub(r"<[^>]+>", " ", texte)
    texte = html.unescape(texte)
    return texte


def _retirer_citations_et_signatures(texte: str) -> str:
    """Supprime les citations d'anciens emails et signatures courantes."""
    lignes = texte.splitlines()
    lignes_propres: list[str] = []

    delimiteurs_citations = [
        re.compile(r"^\s*[-_]{2,}\s*original message\s*[-_]{2,}", re.IGNORECASE),
        re.compile(r"^\s*[-_]{2,}\s*message d['’]origine\s*[-_]{2,}", re.IGNORECASE),
        re.compile(r"^\s*(le|on)\s+.{5,80}\s+(a écrit|wrote)\s*:", re.IGNORECASE),
        re.compile(r"^\s*de\s*:\s*.+@.+", re.IGNORECASE),
        re.compile(r"^\s*from\s*:\s*.+@.+", re.IGNORECASE),
    ]

    delimiteurs_signatures = [
        re.compile(r"^\s*--\s*$"),
        re.compile(r"^\s*envoyé depuis mon (iphone|ipad|smartphone|android|galaxy)", re.IGNORECASE),
        re.compile(r"^\s*sent from my (iphone|ipad|galaxy|android)", re.IGNORECASE),
        re.compile(r"^\s*get outlook for (ios|android)", re.IGNORECASE),
    ]

    for ligne in lignes:
        # Ligne de citation commençant par '>'
        if re.match(r"^\s*>", ligne):
            continue

        # Détection d'un bloc de réponse imbriquée
        if any(motif.match(ligne) for motif in delimiteurs_citations):
            break

        # Détection du début d'une signature standard
        if any(motif.match(ligne) for motif in delimiteurs_signatures):
            break

        lignes_propres.append(ligne)

    resultat = "\n".join(lignes_propres)
    # Réduit les suites de lignes vides
    resultat = re.sub(r"\n{3,}", "\n\n", resultat).strip()
    return resultat[:4000]


def analyser_message(contenu_brut: bytes | str) -> dict[str, Any]:
    """Fonction pure qui extrait et nettoie les métadonnées et le corps d'un email.

    Testable unitairement sans connexion réseau ni base de données.
    """
    if isinstance(contenu_brut, str):
        msg = email.message_from_string(contenu_brut)
    else:
        msg = email.message_from_bytes(contenu_brut)

    message_id = decoder_entete(msg.get("Message-ID", "")).strip()
    # Si le message_id est vide ou mal formé, on prend une chaîne de repli
    if not message_id:
        message_id = f"gen-{abs(hash(str(contenu_brut)[:100]))}"

    expediteur_brut = decoder_entete(msg.get("From", ""))
    _, adresse_expediteur = email.utils.parseaddr(expediteur_brut)
    adresse_expediteur = (adresse_expediteur or expediteur_brut).lower().strip()

    objet = decoder_entete(msg.get("Subject", "")).strip()

    date_str = msg.get("Date")
    date_recu = None
    if date_str:
        try:
            date_recu = email.utils.parsedate_to_datetime(date_str)
            if date_recu and date_recu.tzinfo is None:
                date_recu = date_recu.replace(tzinfo=timezone.utc)
        except Exception:
            date_recu = None
    if not date_recu:
        date_recu = datetime.now(timezone.utc)

    in_reply_to = decoder_entete(msg.get("In-Reply-To", "")).strip()
    references_brut = decoder_entete(msg.get("References", "")).strip()
    references = [r.strip() for r in re.findall(r"<[^>]+>", references_brut)] if references_brut else []
    if in_reply_to and in_reply_to not in references:
        references.append(in_reply_to)

    auto_submitted = (msg.get("Auto-Submitted") or "").lower().strip()
    precedence = (msg.get("Precedence") or "").lower().strip()

    # Extraction du corps texte
    corps_texte = ""
    corps_html = ""

    if msg.is_multipart():
        for partie in msg.walk():
            contenu_type = partie.get_content_type()
            disposition = str(partie.get("Content-Disposition", ""))
            if "attachment" in disposition.lower():
                continue

            charset = partie.get_content_charset() or "utf-8"
            payload = partie.get_payload(decode=True)
            if payload is None:
                continue

            try:
                texte_decode = payload.decode(charset, errors="replace")
            except (LookupError, UnicodeDecodeError):
                texte_decode = payload.decode("utf-8", errors="replace")

            if contenu_type == "text/plain" and not corps_texte:
                corps_texte = texte_decode
            elif contenu_type == "text/html" and not corps_html:
                corps_html = texte_decode
    else:
        charset = msg.get_content_charset() or "utf-8"
        payload = msg.get_payload(decode=True)
        texte_decode = ""
        if payload is not None:
            try:
                texte_decode = payload.decode(charset, errors="replace")
            except (LookupError, UnicodeDecodeError):
                texte_decode = payload.decode("utf-8", errors="replace")
        else:
            texte_decode = str(msg.get_payload() or "")

        if msg.get_content_type() == "text/html":
            corps_html = texte_decode
        else:
            corps_texte = texte_decode

    texte_brut = corps_texte if corps_texte.strip() else _nettoyer_html(corps_html)
    extrait = _retirer_citations_et_signatures(texte_brut)

    return {
        "message_id": message_id,
        "expediteur": expediteur_brut,
        "adresse_expediteur": adresse_expediteur,
        "objet": objet or "(Sans objet)",
        "extrait": extrait,
        "recu_le": date_recu,
        "in_reply_to": in_reply_to,
        "references": references,
        "auto_submitted": auto_submitted,
        "precedence": precedence,
    }


def _est_un_message_a_ignorer(infos_entete: dict[str, Any]) -> bool:
    """Détermine si un message doit être ignoré (rebond, notification auto, email interne)."""
    adresse = infos_entete.get("adresse_expediteur", "").lower()

    # Emails internes de l'agence
    adresses_internes = {
        (settings.brevo_sender_email or "").lower().strip(),
        (settings.brevo_reply_to or "").lower().strip(),
        (settings.imap_user or "").lower().strip(),
    }
    adresses_internes.discard("")

    if adresse in adresses_internes:
        return True

    # Bounces & serveurs automatiques
    if any(motif in adresse for motif in ["mailer-daemon", "postmaster", "no-reply", "noreply", "notifications"]):
        return True

    # En-têtes standards d'absence / répondeur auto
    auto_submitted = infos_entete.get("auto_submitted", "")
    if auto_submitted and auto_submitted != "no":
        return True

    precedence = infos_entete.get("precedence", "")
    if precedence in {"bulk", "junk", "auto_reply", "list"}:
        return True

    return False


def verifier_nouvelles_reponses(
    db: Session,
    lookback_days: int | None = None,
    limite_messages: int = 50,
) -> int:
    """Se connecte en IMAP, lit les en-têtes puis le corps des messages des prospects,

    enregistre les réponses dans `reponses_recues` et passe le statut à `REPONDU`.
    Retourne le nombre de nouvelles réponses enregistrées.
    """
    global _DERNIER_UID_TRAITE, _DATE_DERNIERE_VERIFICATION

    if not settings.imap_enabled:
        return 0
    if not settings.imap_user or not settings.imap_password:
        logger.warning("Vérification IMAP ignorée : identifiants IMAP non renseignés")
        return 0

    nombre_nouvelles_reponses = 0
    client: imaplib.IMAP4_SSL | None = None

    try:
        client = imaplib.IMAP4_SSL(settings.imap_host, settings.imap_port, timeout=15)
        client.login(settings.imap_user, settings.imap_password)
        statut_selection, _ = client.select(settings.imap_folder, readonly=True)
        if statut_selection != "OK":
            logger.error(f"Impossible d'ouvrir le dossier IMAP '{settings.imap_folder}'")
            return 0

        # Construction de la recherche IMAP
        if _DERNIER_UID_TRAITE is not None:
            critere = f"UID {_DERNIER_UID_TRAITE + 1}:*"
        else:
            jours = lookback_days or settings.imap_lookback_days
            depuis = (datetime.now(timezone.utc) - timedelta(days=jours)).strftime("%d-%b-%Y")
            critere = f'(SINCE "{depuis}")'

        typ, donnees_recherche = client.uid("search", None, critere)
        if typ != "OK" or not donnees_recherche or not donnees_recherche[0]:
            _DATE_DERNIERE_VERIFICATION = datetime.now(timezone.utc)
            return 0

        uids_bruts = donnees_recherche[0].split()
        uids = [int(u) for u in uids_bruts if u.isdigit()]

        if _DERNIER_UID_TRAITE is not None:
            uids = [u for u in uids if u > _DERNIER_UID_TRAITE]

        if not uids:
            _DATE_DERNIERE_VERIFICATION = datetime.now(timezone.utc)
            return 0

        # Traitement borné aux X messages les plus récents ou par lot
        uids_a_traiter = uids[:limite_messages]

        for uid_num in uids_a_traiter:
            uid_str = str(uid_num)

            # Étape 1 : Téléchargement PEEK des en-têtes uniquement
            typ_h, donnees_h = client.uid(
                "fetch",
                uid_str,
                "(BODY.PEEK[HEADER.FIELDS (FROM MESSAGE-ID IN-REPLY-TO REFERENCES SUBJECT DATE AUTO-SUBMITTED PRECEDENCE)])",
            )
            if typ_h != "OK" or not donnees_h or not isinstance(donnees_h[0], tuple):
                continue

            en_tetes_bytes = donnees_h[0][1]
            infos_h = analyser_message(en_tetes_bytes)

            if _est_un_message_a_ignorer(infos_h):
                continue

            msg_id = infos_h["message_id"]
            if not msg_id:
                continue

            # Déduplication en base par Message-ID unique
            existant = db.query(ReponseRecue.id).filter(ReponseRecue.message_id_imap == msg_id).first()
            if existant:
                continue

            # Matching avec une entreprise
            entreprise: Entreprise | None = None
            adresse = infos_h["adresse_expediteur"]

            if adresse:
                entreprise = (
                    db.query(Entreprise)
                    .filter(func.lower(Entreprise.email) == adresse)
                    .first()
                )

            # Matching bonus par In-Reply-To ou References si l'adresse email n'a pas matché
            if not entreprise and (infos_h["in_reply_to"] or infos_h["references"]):
                ids_a_chercher = [infos_h["in_reply_to"]] + infos_h["references"]
                ids_a_chercher = [clean.strip("<> \t\r\n") for clean in ids_a_chercher if clean]
                if ids_a_chercher:
                    message_envoye = (
                        db.query(Message)
                        .filter(Message.identifiant_externe.in_(ids_a_chercher))
                        .first()
                    )
                    if message_envoye:
                        entreprise = db.query(Entreprise).filter(Entreprise.id == message_envoye.entreprise_id).first()

            if not entreprise:
                continue

            # Étape 2 : L'entreprise est identifiée, téléchargement PEEK du corps complet
            typ_b, donnees_b = client.uid("fetch", uid_str, "(BODY.PEEK[])")
            if typ_b != "OK" or not donnees_b or not isinstance(donnees_b[0], tuple):
                continue

            corps_bytes = donnees_b[0][1]
            message_complet = analyser_message(corps_bytes)

            nouvelle_reponse = ReponseRecue(
                entreprise_id=entreprise.id,
                message_id_imap=message_complet["message_id"] or msg_id,
                expediteur=message_complet["expediteur"] or infos_h["expediteur"],
                objet=message_complet["objet"],
                extrait=message_complet["extrait"],
                recu_le=message_complet["recu_le"],
                lu=False,
            )
            db.add(nouvelle_reponse)

            # Mise à jour du statut uniquement si en attente ou relancé (ne jamais écraser CONVERTI ou PERDU)
            if entreprise.statut in (
                StatutProspection.ENVOYE,
                StatutProspection.EN_ATTENTE_REPONSE,
                StatutProspection.RELANCE_ENVOYEE,
            ):
                entreprise.statut = StatutProspection.REPONDU

            db.commit()
            nombre_nouvelles_reponses += 1
            logger.info(
                f"Réponse reçue pour {entreprise.nom} ({adresse}) - objet : {message_complet['objet']}"
            )

        if uids_a_traiter:
            _DERNIER_UID_TRAITE = max(uids_a_traiter)

    except imaplib.IMAP4.error as err_imap:
        logger.error(f"Erreur du protocole IMAP : {err_imap}")
    except Exception as err:
        logger.error(f"Erreur inattendue lors de la vérification IMAP : {err}")
    finally:
        _DATE_DERNIERE_VERIFICATION = datetime.now(timezone.utc)
        if client is not None:
            try:
                client.close()
            except Exception:
                pass
            try:
                client.logout()
            except Exception:
                pass

    return nombre_nouvelles_reponses


def obtenir_derniere_date_verification() -> datetime | None:
    return _DATE_DERNIERE_VERIFICATION
