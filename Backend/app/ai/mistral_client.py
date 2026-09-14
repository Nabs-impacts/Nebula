import httpx

from app.core.config import settings
from app.core.logging import logger

MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"


def generer_texte(prompt_systeme: str, prompt_utilisateur: str, temperature: float = 0.7) -> str:
    """Appelle l'API Mistral (La Plateforme) pour générer un texte.

    Utilisé en repli par app/ai/generateur_message.py quand Groq échoue.
    Nécessite MISTRAL_API_KEY dans .env — si absente, lève une erreur explicite
    plutôt que d'échouer silencieusement.
    """
    if not settings.mistral_api_key:
        raise RuntimeError("MISTRAL_API_KEY non configurée — impossible d'utiliser le repli Mistral")

    headers = {
        "Authorization": f"Bearer {settings.mistral_api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": settings.mistral_model,
        "messages": [
            {"role": "system", "content": prompt_systeme},
            {"role": "user", "content": prompt_utilisateur},
        ],
        "temperature": temperature,
        "max_tokens": 500,
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            reponse = client.post(MISTRAL_API_URL, headers=headers, json=payload)
            reponse.raise_for_status()
            donnees = reponse.json()
            return donnees["choices"][0]["message"]["content"].strip()
    except httpx.HTTPStatusError as erreur:
        logger.error(f"Erreur Mistral API ({erreur.response.status_code}): {erreur.response.text}")
        raise
    except httpx.RequestError as erreur:
        logger.error(f"Erreur réseau lors de l'appel à Mistral : {erreur}")
        raise
