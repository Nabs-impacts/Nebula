import httpx

from app.core.config import settings
from app.core.logging import logger

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def generer_texte(
    prompt_systeme: str,
    prompt_utilisateur: str,
    temperature: float = 0.6,
    max_tokens: int = 900,
) -> str:
    """Appelle l'API Groq (compatible OpenAI) pour générer un texte.

    Lève une exception si l'appel échoue — à catcher dans generation_service.py
    pour retenter avec Mistral en secours si besoin.
    """
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": prompt_systeme},
            {"role": "user", "content": prompt_utilisateur},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            reponse = client.post(GROQ_API_URL, headers=headers, json=payload)
            reponse.raise_for_status()
            donnees = reponse.json()
            return donnees["choices"][0]["message"]["content"].strip()
    except httpx.HTTPStatusError as erreur:
        logger.error(f"Erreur Groq API ({erreur.response.status_code}): {erreur.response.text}")
        raise
    except httpx.RequestError as erreur:
        logger.error(f"Erreur réseau lors de l'appel à Groq : {erreur}")
        raise
