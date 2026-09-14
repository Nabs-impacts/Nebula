from app.ai import groq_client, mistral_client, prompts
from app.core.logging import logger


def generer_message_prospection(
    nom_entreprise: str,
    type_entreprise: str,
    prototype_a_presenter: str,
    description_prototype: str,
    service_a_proposer: str,
    canal: str,
    ton: str = "professionnel",
) -> str:
    """Génère un message de prospection personnalisé pour une entreprise.

    Essaie Groq en premier (gratuit, rapide). En cas d'échec, retente avec
    Mistral si sa fonction de génération est disponible (cf. mistral_client.py).
    """
    prompt_utilisateur = prompts.construire_prompt_generation(
        nom_entreprise=nom_entreprise,
        type_entreprise=type_entreprise,
        prototype_a_presenter=prototype_a_presenter,
        description_prototype=description_prototype,
        service_a_proposer=service_a_proposer,
        canal=canal,
        ton=ton,
    )

    try:
        return groq_client.generer_texte(prompts.PROMPT_SYSTEME, prompt_utilisateur)
    except Exception as erreur_groq:
        logger.warning(f"Échec de la génération via Groq, tentative de repli Mistral : {erreur_groq}")

        generer_avec_mistral = getattr(mistral_client, "generer_texte", None)
        if generer_avec_mistral is None:
            logger.error("Aucun repli Mistral disponible (mistral_client.py non implémenté)")
            raise

        return generer_avec_mistral(prompts.PROMPT_SYSTEME, prompt_utilisateur)


def generer_relance(nom_entreprise: str, contenu_precedent: str, canal: str) -> str:
    """Génère un message de relance pour une entreprise n'ayant pas répondu."""
    prompt_utilisateur = prompts.construire_prompt_relance(nom_entreprise, contenu_precedent, canal)

    try:
        return groq_client.generer_texte(prompts.PROMPT_SYSTEME, prompt_utilisateur)
    except Exception as erreur_groq:
        logger.warning(f"Échec de la génération de relance via Groq : {erreur_groq}")

        generer_avec_mistral = getattr(mistral_client, "generer_texte", None)
        if generer_avec_mistral is None:
            raise

        return generer_avec_mistral(prompts.PROMPT_SYSTEME, prompt_utilisateur)
