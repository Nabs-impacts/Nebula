import httpx

from app.core.config import settings
from app.core.logging import logger

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def envoyer_email(destinataire_email: str, sujet: str, contenu_html: str, contenu_texte: str | None = None) -> dict:
    """Envoie un email transactionnel via l'API Brevo.

    Retourne la réponse JSON de Brevo (contient notamment messageId).
    Lève une exception en cas d'échec — à catcher dans envoi_service.py
    pour marquer le message comme ECHEC en base.
    """
    headers = {
        "api-key": settings.brevo_api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    payload = {
        "sender": {"name": settings.brevo_sender_name, "email": settings.brevo_sender_email},
        "to": [{"email": destinataire_email}],
        "subject": sujet,
        "htmlContent": contenu_html,
    }

    if contenu_texte:
        payload["textContent"] = contenu_texte

    try:
        with httpx.Client(timeout=15.0) as client:
            reponse = client.post(BREVO_API_URL, headers=headers, json=payload)
            reponse.raise_for_status()
            logger.info(f"Email envoyé à {destinataire_email}")
            return reponse.json()
    except httpx.HTTPStatusError as erreur:
        logger.error(f"Erreur Brevo ({erreur.response.status_code}): {erreur.response.text}")
        raise
    except httpx.RequestError as erreur:
        logger.error(f"Erreur réseau lors de l'envoi Brevo : {erreur}")
        raise
