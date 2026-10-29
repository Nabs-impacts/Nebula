import re

import httpx

from app.core.config import settings
from app.core.logging import logger

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


class ErreurEnvoiEmail(Exception):
    """Erreur d'envoi Brevo avec un message affichable dans l'interface."""

    def __init__(self, message_utilisateur: str, *, status_code: int | None = None):
        super().__init__(message_utilisateur)
        self.message_utilisateur = message_utilisateur
        self.status_code = status_code


def _detail_erreur_brevo(reponse: httpx.Response) -> str:
    try:
        corps = reponse.json()
        message = corps.get("message") if isinstance(corps, dict) else None
    except ValueError:
        message = None

    if reponse.status_code == 401:
        if message and "IP address" in message:
            ip = re.search(r"IP address\s+([0-9a-fA-F:.]+)", message)
            adresse = f" {ip.group(1)}" if ip else ""
            return (
                f"Brevo refuse l'envoi : l'adresse IP{adresse} du serveur n'est pas autorisée. "
                "Ajoutez-la sur https://app.brevo.com/security/authorised_ips "
                "(ou désactivez la restriction d'IP), puis réessayez."
            )
        return "Brevo refuse l'envoi (401) : vérifiez la clé API BREVO_API_KEY."

    if reponse.status_code == 403:
        return "Brevo refuse l'envoi (403) : vérifiez les restrictions du compte Brevo."

    if message:
        return f"Brevo a refusé l'envoi ({reponse.status_code}) : {message}"

    return f"Brevo a refusé l'envoi (code {reponse.status_code})."


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

    adresse_reponse = settings.brevo_reply_to or settings.brevo_sender_email

    payload = {
        "sender": {"name": settings.brevo_sender_name, "email": settings.brevo_sender_email},
        "to": [{"email": destinataire_email}],
        "replyTo": {"name": settings.brevo_sender_name, "email": adresse_reponse},
        "subject": sujet,
        "htmlContent": contenu_html,
        # Lien de désinscription reconnu par Gmail/Outlook : réduit les plaintes « spam ».
        "headers": {"List-Unsubscribe": f"<mailto:{adresse_reponse}?subject=STOP>"},
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
        raise ErreurEnvoiEmail(
            _detail_erreur_brevo(erreur.response), status_code=erreur.response.status_code
        ) from erreur
    except httpx.RequestError as erreur:
        logger.error(f"Erreur réseau lors de l'envoi Brevo : {erreur}")
        raise ErreurEnvoiEmail(
            "Impossible de joindre Brevo. Vérifiez la connexion réseau du serveur, puis réessayez."
        ) from erreur
