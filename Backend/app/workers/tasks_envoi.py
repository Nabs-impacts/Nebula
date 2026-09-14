import uuid

from app.core.logging import logger
from app.db.base import SessionLocal
from app.services import entreprise_service, envoi_service, message_service


def tache_envoyer_message(message_id: str) -> None:
    """Tâche exécutée par le worker RQ : envoie un message déjà généré.

    Enfilée via app/workers/worker.py, ex :
        queue.enqueue(tache_envoyer_message, str(message.id))
    """
    db = SessionLocal()
    try:
        message = message_service.obtenir_message(db, uuid.UUID(message_id))
        if message is None:
            logger.error(f"Tâche d'envoi annulée : message {message_id} introuvable")
            return

        entreprise = entreprise_service.obtenir_entreprise(db, message.entreprise_id)
        if entreprise is None:
            logger.error(f"Tâche d'envoi annulée : entreprise introuvable pour le message {message_id}")
            return

        envoi_service.envoyer_message(db, message, entreprise)
        logger.info(f"Message {message_id} envoyé avec succès")

    except Exception as erreur:
        # RQ retente automatiquement selon la politique de retry configurée sur la queue.
        logger.error(f"Échec de la tâche d'envoi pour le message {message_id} : {erreur}")
        raise
    finally:
        db.close()
