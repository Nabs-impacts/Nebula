import json
import re
from dataclasses import dataclass

from app.ai import groq_client, mistral_client, prompts
from app.core.config import settings
from app.core.logging import logger

TEMPERATURE_GENERATION = 0.5
TEMPERATURE_RELANCE = 0.6


@dataclass
class MessageGenere:
    objet: str
    corps: str
    angle: str = ""


def _extraire_json(texte: str) -> dict | None:
    """Extrait un objet JSON même si le modèle l'entoure de texte ou de balises."""
    nettoye = texte.strip()
    if nettoye.startswith("```"):
        nettoye = re.sub(r"^```(?:json)?\s*", "", nettoye, flags=re.IGNORECASE)
        nettoye = re.sub(r"\s*```$", "", nettoye)
    try:
        return json.loads(nettoye)
    except json.JSONDecodeError:
        pass

    debut = nettoye.find("{")
    fin = nettoye.rfind("}")
    if debut == -1 or fin == -1 or fin <= debut:
        return None
    try:
        return json.loads(nettoye[debut : fin + 1])
    except json.JSONDecodeError:
        return None


def _parser_reponse(brut: str, nom_entreprise: str) -> MessageGenere:
    donnees = _extraire_json(brut)
    if not donnees:
        logger.warning("Réponse IA non JSON, utilisation du texte brut comme corps du message")
        return MessageGenere(
            objet=f"Une idée pour {nom_entreprise}"[:60],
            corps=brut.strip(),
            angle="",
        )

    objet = str(donnees.get("objet") or donnees.get("subject") or "").strip()
    corps = str(
        donnees.get("corps")
        or donnees.get("message")
        or donnees.get("body")
        or donnees.get("contenu")
        or ""
    ).strip()
    angle = str(donnees.get("angle") or "").strip()

    if not corps:
        corps = brut.strip()
    if not objet:
        objet = f"Une idée pour {nom_entreprise}"

    return _finaliser_message(MessageGenere(objet=objet, corps=corps, angle=angle))


def _finaliser_message(message: MessageGenere) -> MessageGenere:
    """Nettoyage de sécurité après génération (indépendant du modèle utilisé)."""
    corps = re.sub(
        r"^(objet|subject)\s*:\s*.*\n+", "", message.corps.strip(), flags=re.IGNORECASE
    ).strip()

    for espace in ("[Prénom]", "[Nom]", "[Nom de l’agence]", "[Nom de l'agence]"):
        corps = corps.replace(espace, "")

    phrase_contact = (
        f"Si cela vous intéresse, contactez-nous au {settings.agence_telephone_1} "
        f"ou au {settings.agence_telephone_2}."
    )
    if "contactez-nous" not in corps.lower():
        corps = f"{corps.rstrip()}\n\n{phrase_contact}"

    objet = message.objet.strip()
    if len(objet) > 60:
        objet = objet[:57].rstrip() + "…"

    return MessageGenere(objet=objet[:255], corps=corps, angle=message.angle.strip())


def _appeler_ia(prompt_utilisateur: str, temperature: float) -> str:
    fournisseurs = [
        ("Groq", groq_client.generer_texte),
        ("Mistral", getattr(mistral_client, "generer_texte", None)),
    ]
    if settings.ia_prioritaire.lower() == "mistral":
        fournisseurs.reverse()

    derniere_erreur: Exception | None = None
    for nom, generer in fournisseurs:
        if generer is None:
            continue
        try:
            return generer(
                prompts.PROMPT_SYSTEME, prompt_utilisateur, temperature=temperature
            )
        except Exception as erreur:
            derniere_erreur = erreur
            logger.warning(f"Échec de la génération via {nom} : {erreur}")

    if derniere_erreur is not None:
        raise derniere_erreur
    raise RuntimeError("Aucun fournisseur IA disponible")


def generer_message_prospection(
    nom_entreprise: str,
    type_entreprise: str,
    prototype_a_presenter: str,
    description_prototype: str,
    service_a_proposer: str,
    canal: str,
    ton: str = "professionnel",
    contact_nom: str | None = None,
    ville: str | None = None,
    site_web: str | None = None,
    presence_web: str = "inconnu",
    note_google: float | None = None,
    autres_observations: str | None = None,
) -> MessageGenere:
    """Génère un message de prospection personnalisé (objet, corps, angle).

    Essaie Groq en premier (gratuit, rapide). En cas d'échec, retente avec
    Mistral si sa fonction de génération est disponible.
    """
    prompt_utilisateur = prompts.construire_prompt_generation(
        nom_entreprise=nom_entreprise,
        type_entreprise=type_entreprise,
        prototype_a_presenter=prototype_a_presenter,
        description_prototype=description_prototype,
        service_a_proposer=service_a_proposer,
        canal=canal,
        ton=ton,
        contact_nom=contact_nom,
        ville=ville,
        site_web=site_web,
        presence_web=presence_web,
        note_google=note_google,
        autres_observations=autres_observations,
    )

    brut = _appeler_ia(prompt_utilisateur, TEMPERATURE_GENERATION)
    return _parser_reponse(brut, nom_entreprise)


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
    """Génère un message de relance pour une entreprise n'ayant pas répondu."""
    prompt_utilisateur = prompts.construire_prompt_relance(
        nom_entreprise=nom_entreprise,
        contenu_precedent=contenu_precedent,
        canal=canal,
        sujet_precedent=sujet_precedent,
        jours_depuis_envoi=jours_depuis_envoi,
        contact_nom=contact_nom,
        ville=ville,
        type_entreprise=type_entreprise,
        autres_observations=autres_observations,
    )

    brut = _appeler_ia(prompt_utilisateur, TEMPERATURE_RELANCE)
    return _parser_reponse(brut, nom_entreprise)
