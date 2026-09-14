import httpx

from app.core.config import settings
from app.core.logging import logger


def _url_envoi_messages() -> str:
    return (
        f"https://graph.facebook.com/{settings.whatsapp_api_version}/"
        f"{settings.whatsapp_phone_number_id}/messages"
    )


def envoyer_message_texte(destinataire_numero: str, contenu: str) -> dict:
    """Envoie un message WhatsApp texte via l'API Meta Cloud (WhatsApp Business Platform).

    destinataire_numero doit être au format international sans '+' (ex : "22790000000").
    Lève une exception en cas d'échec — à catcher dans envoi_service.py.
    """
    headers = {
        "Authorization": f"Bearer {settings.whatsapp_access_token}",
        "Content-Type": "application/json",
    }

    numero_nettoye = destinataire_numero.lstrip("+")

    payload = {
        "messaging_product": "whatsapp",
        "to": numero_nettoye,
        "type": "text",
        "text": {"body": contenu},
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            reponse = client.post(_url_envoi_messages(), headers=headers, json=payload)
            reponse.raise_for_status()
            logger.info(f"Message WhatsApp envoyé à {numero_nettoye}")
            return reponse.json()
    except httpx.HTTPStatusError as erreur:
        logger.error(f"Erreur WhatsApp API ({erreur.response.status_code}): {erreur.response.text}")
        raise
    except httpx.RequestError as erreur:
        logger.error(f"Erreur réseau lors de l'envoi WhatsApp : {erreur}")
        raise
