import json
import re
import time
from dataclasses import dataclass
from typing import Any

from app.ai import angles, groq_client, mistral_client, prompts
from app.ai.exceptions import ErreurIA, LimiteDebitIAErreur, ReponseIACoupeeOuVide
from app.core.config import settings
from app.core.logging import logger

MOTS_INTERDITS = [
    "solutions innovantes",
    "solution innovante",
    "dans un monde de plus en plus digital",
    "dans un monde de plus en plus connecte",
    "n'hesitez pas a",
    "n'hésitez pas à",
    "leader",
    "imbattable",
    "garanti",
    "garantie",
    "garantissant",
    "retour sur investissement",
    "roi",
    "100 %",
    "100%",
]

EMOJI_PATTERN = re.compile(
    "["
    "\U0001f600-\U0001f64f"
    "\U0001f300-\U0001f5ff"
    "\U0001f680-\U0001f6ff"
    "\U0001f1e0-\U0001f1ff"
    "\U00002702-\U000027b0"
    "\U000024c2-\U0001f251"
    "]+",
    flags=re.UNICODE,
)


@dataclass
class MessageGenere:
    objet: str
    corps: str
    angle: str = ""
    source: str = "groq"
    qualite_ok: bool = True
    problemes: list[str] | None = None


def _nettoyer_json_brut(texte: str) -> str:
    nettoye = texte.strip()
    if nettoye.startswith("```"):
        nettoye = re.sub(r"^```(?:json)?\s*", "", nettoye, flags=re.IGNORECASE)
        nettoye = re.sub(r"\s*```$", "", nettoye)
    return nettoye.strip()


def extraire_json_robuste(texte: str) -> dict | None:
    """Extrait un JSON même entouré de texte ou réparable s'il est coupé en fin."""
    nettoye = _nettoyer_json_brut(texte)
    try:
        return json.loads(nettoye)
    except json.JSONDecodeError:
        pass

    debut = nettoye.find("{")
    if debut == -1:
        return None

    fin = nettoye.rfind("}")
    if fin > debut:
        sous_chaine = nettoye[debut : fin + 1]
        try:
            return json.loads(sous_chaine)
        except json.JSONDecodeError:
            pass

    # Tentative de réparation d'un JSON tronqué par max_tokens
    morceau = nettoye[debut:]
    # Clôture d'une chaîne non fermée
    guillemets = morceau.count('"') - morceau.count('\\"')
    if guillemets % 2 != 0:
        morceau += '"'
    if not morceau.endswith("}"):
        morceau += "}"

    try:
        return json.loads(morceau)
    except json.JSONDecodeError:
        return None


def controler_qualite(
    sujet: str | None,
    corps: str,
    nom_entreprise: str,
    canal: str = "email",
) -> list[str]:
    """Contrôle qualité automatique sans appel IA."""
    problemes: list[str] = []
    texte_total = f"{sujet or ''} {corps}".lower()
    mots = corps.split()
    nb_mots = len(mots)

    # 1. Présence de JSON brut ou accolades
    if "{" in corps or "}" in corps or '"objet"' in corps or '"corps"' in corps:
        problemes.append("Présence de syntaxe JSON ou d'accolades dans le corps du message")

    # 2. Longueur
    if canal == "whatsapp":
        if nb_mots < 35:
            problemes.append(f"Message WhatsApp trop court ({nb_mots} mots, min 35)")
        elif nb_mots > 105:
            problemes.append(f"Message WhatsApp trop long ({nb_mots} mots, max 100)")
    else:
        if nb_mots < 70:
            problemes.append(f"Email trop court ({nb_mots} mots, min 75)")
        elif nb_mots > 165:
            problemes.append(f"Email trop long ({nb_mots} mots, max 160)")

    # 3. Présence du nom de l'entreprise
    if nom_entreprise and nom_entreprise.strip().lower() not in texte_total:
        problemes.append(f"Le nom de l'entreprise '{nom_entreprise}' n'apparaît pas dans le message")

    # 4. Sujet de l'email
    if canal == "email":
        if not sujet or not sujet.strip():
            problemes.append("Objet de l'email manquant")
        elif len(sujet) > 65:
            problemes.append(f"Objet de l'email trop long ({len(sujet)} caractères, max 60)")

    # 5. Coordonnées téléphoniques fixes de l'agence
    t1 = settings.agence_telephone_1.replace(" ", "")
    t2 = settings.agence_telephone_2.replace(" ", "")
    corps_compact = corps.replace(" ", "")
    if t1 not in corps_compact or t2 not in corps_compact:
        problemes.append(
            f"Les coordonnées téléphoniques ({settings.agence_telephone_1} et {settings.agence_telephone_2}) sont absentes ou incomplètes"
        )

    # 6. Mots interdits et promesses
    for mot in MOTS_INTERDITS:
        if mot in texte_total:
            problemes.append(f"Expression interdite détectée : '{mot}'")

    # 7. Emojis et puces
    if EMOJI_PATTERN.search(corps) or (sujet and EMOJI_PATTERN.search(sujet)):
        problemes.append("Présence d'emojis interdits")
    if re.search(r"^\s*[-*•]\s+", corps, flags=re.MULTILINE):
        problemes.append("Présence de listes à puces interdites")

    return problemes


def _finaliser_corps_texte(corps: str, canal: str) -> str:
    """Nettoyage de sécurité et ajout de la phrase de contact si absente."""
    corps_propre = re.sub(
        r"^(objet|subject)\s*:\s*.*\n+", "", corps.strip(), flags=re.IGNORECASE
    ).strip()

    for espace in ("[Prénom]", "[Nom]", "[Nom de l’agence]", "[Nom de l'agence]"):
        corps_propre = corps_propre.replace(espace, "")

    phrase_contact = (
        f"Si cela vous intéresse, contactez-nous au {settings.agence_telephone_1} "
        f"ou au {settings.agence_telephone_2}."
    )
    t1 = settings.agence_telephone_1.replace(" ", "")
    t2 = settings.agence_telephone_2.replace(" ", "")
    if t1 not in corps_propre.replace(" ", "") or t2 not in corps_propre.replace(" ", ""):
        corps_propre = f"{corps_propre.rstrip()}\n\n{phrase_contact}"

    return corps_propre.strip()


def _executer_appel_fournisseur(
    nom: str,
    fonction_appel: Any,
    prompt_utilisateur: str,
    temperature: float,
) -> tuple[dict | None, str | None]:
    """Exécute un appel à un fournisseur IA et retourne le JSON parsé ou une erreur."""
    if fonction_appel is None:
        return None, "Fournisseur non disponible"

    debut = time.time()
    for tentative in range(2):
        try:
            brut = fonction_appel(
                prompts.PROMPT_SYSTEME,
                prompt_utilisateur,
                temperature=temperature,
            )
            duree = round(time.time() - debut, 2)

            # Rejet immédiat si le texte brut ressemble à du JSON non extrait
            donnees = extraire_json_robuste(brut)
            if not donnees or not isinstance(donnees, dict):
                logger.warning(
                    f"Fournisseur {nom} tentative {tentative+1}: JSON illisible après {duree}s (longueur={len(brut)})"
                )
                continue

            return donnees, None
        except (ReponseIACoupeeOuVide, LimiteDebitIAErreur, ErreurIA, Exception) as err:
            duree = round(time.time() - debut, 2)
            logger.warning(
                f"Fournisseur {nom} tentative {tentative+1} échec après {duree}s: {type(err).__name__}"
            )
            time.sleep(0.5)

    return None, f"Échec fournisseur {nom} après 2 tentatives"


def generer_message_prospection(
    entreprise: Any,
    canal: str = "email",
    consigne_supplementaire: str | None = None,
    angle_code: str | None = None,
    service_a_proposer: str | None = None,
    notes_chronologie: list[str] | None = None,
) -> MessageGenere:
    """Génération résiliente avec bascule, validation qualité et secours garanti."""
    def _val(ch: str) -> Any:
        if isinstance(entreprise, dict):
            return entreprise.get(ch)
        return getattr(entreprise, ch, None)

    nom_entreprise = _val("nom") or "l'entreprise"
    angle_auto = angles.choisir_angle(entreprise)

    # Respect d'un angle ou service forcé par l'interface si fourni
    service_cible = service_a_proposer or angle_auto["service"]
    accroche_cible = angle_auto["accroche"]

    fournisseurs = [
        ("groq", groq_client.generer_texte),
        ("mistral", getattr(mistral_client, "generer_texte", None)),
    ]
    if settings.ia_prioritaire.lower() == "mistral":
        fournisseurs.reverse()

    problemes_qualite: list[str] = []

    for nom_fournisseur, appel in fournisseurs:
        for tour_generation in range(2):
            prompt = prompts.construire_prompt_generation(
                nom_entreprise=nom_entreprise,
                canal=canal,
                secteur=str(_val("type_entreprise") or "autre"),
                contact_nom=_val("contact_nom"),
                ville=_val("ville"),
                site_web=_val("site_web"),
                presence_web=str(_val("presence_web") or "inconnu"),
                note_google=_val("note_google"),
                autres_observations=_val("autres_observations"),
                tags=_val("tags") or [],
                notes_chronologie=notes_chronologie or [],
                angle_recommande=accroche_cible,
                service_recommande=service_cible,
                consigne_supplementaire=consigne_supplementaire,
                problemes_precedents=problemes_qualite if tour_generation > 0 else None,
            )

            donnees_json, _ = _executer_appel_fournisseur(
                nom_fournisseur, appel, prompt, temperature=0.5
            )

            if not donnees_json:
                break  # Passer au fournisseur suivant

            sujet = str(donnees_json.get("objet") or donnees_json.get("subject") or "").strip()
            corps = str(
                donnees_json.get("corps")
                or donnees_json.get("message")
                or donnees_json.get("contenu")
                or ""
            ).strip()
            angle_texte = str(donnees_json.get("angle") or accroche_cible).strip()

            if canal == "whatsapp":
                sujet = ""
            elif not sujet:
                sujet = f"Une idée pour {nom_entreprise}"[:58]

            corps_final = _finaliser_corps_texte(corps, canal)
            problemes = controler_qualite(sujet, corps_final, nom_entreprise, canal)

            if not problemes:
                return MessageGenere(
                    objet=sujet[:255],
                    corps=corps_final,
                    angle=angle_texte,
                    source=nom_fournisseur,
                    qualite_ok=True,
                    problemes=[],
                )

            # Problèmes détectés : on tente une seconde génération guidée
            logger.info(
                f"Contrôle qualité rejeté ({len(problemes)} pbs). Nouvelle tentative guidée."
            )
            problemes_qualite = problemes

    # Si tous les fournisseurs ont échoué ou produit une qualité invalide : message de secours
    logger.warning("Bascule vers le message de secours (fournisseurs IA épuisés)")
    secours = angles.message_de_secours(entreprise, canal)
    return MessageGenere(
        objet=secours["sujet"],
        corps=secours["corps"],
        angle=secours["angle"],
        source="secours",
        qualite_ok=True,
        problemes=[],
    )


def generer_relance(
    nom_entreprise: str,
    contenu_precedent: str,
    canal: str,
    sujet_precedent: str | None = None,
    jours_depuis_envoi: int | None = None,
    contact_nom: str | None = None,
    ville: str | None = None,
    type_entreprise: str = "autre",
    autres_observations: str | None = None,
) -> MessageGenere:
    """Génère une relance courte avec repli garanti."""
    prompt = prompts.construire_prompt_relance(
        nom_entreprise=nom_entreprise,
        contenu_precedent=contenu_precedent,
        canal=canal,
        sujet_precedent=sujet_precedent,
        jours_depuis_envoi=jours_depuis_envoi,
        contact_nom=contact_nom,
        ville=ville,
        secteur=type_entreprise,
        autres_observations=autres_observations,
    )

    fournisseurs = [
        ("groq", groq_client.generer_texte),
        ("mistral", getattr(mistral_client, "generer_texte", None)),
    ]
    if settings.ia_prioritaire.lower() == "mistral":
        fournisseurs.reverse()

    for nom, appel in fournisseurs:
        donnees_json, _ = _executer_appel_fournisseur(nom, appel, prompt, temperature=0.6)
        if donnees_json:
            sujet = str(donnees_json.get("objet") or sujet_precedent or f"Relance : {nom_entreprise}")
            corps = str(donnees_json.get("corps") or donnees_json.get("message") or "").strip()
            corps_final = _finaliser_corps_texte(corps, canal)
            return MessageGenere(
                objet=sujet[:255] if canal == "email" else "",
                corps=corps_final,
                angle="Relance",
                source=nom,
                qualite_ok=True,
                problemes=[],
            )

    # Secours relance
    salutation = f"Bonjour {contact_nom}," if contact_nom else "Bonjour,"
    phrase_contact = (
        f"Si cela vous intéresse, contactez-nous au {settings.agence_telephone_1} "
        f"ou au {settings.agence_telephone_2}."
    )
    corps_secours = (
        f"{salutation}\n\n"
        f"Je me permets de vous relancer concernant notre proposition pour {nom_entreprise}. "
        f"Nous pouvons vous concevoir une maquette d'aperçu gratuitement pour que vous puissiez voir le rendu.\n\n"
        f"{phrase_contact}"
    )
    return MessageGenere(
        objet=f"Relance : une idée pour {nom_entreprise}"[:58] if canal == "email" else "",
        corps=corps_secours,
        angle="Relance de courtoisie",
        source="secours",
        qualite_ok=True,
        problemes=[],
    )
