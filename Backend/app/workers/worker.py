from redis import Redis
from rq import Worker, Queue

from app.core.config import settings
from app.core.logging import configurer_logging, logger

NOM_QUEUE = "nebula-envois"

configurer_logging()

connexion_redis = Redis.from_url(settings.redis_url)
queue_envois = Queue(NOM_QUEUE, connection=connexion_redis)


def demarrer_worker() -> None:
    """Démarre le worker RQ qui traite la file d'envoi des messages.

    Lancement : python -m app.workers.worker
    (ou : rq worker nebula-envois --url $REDIS_URL)
    """
    logger.info(f"Démarrage du worker RQ sur la queue '{NOM_QUEUE}'")
    worker = Worker([queue_envois], connection=connexion_redis)
    worker.work()


if __name__ == "__main__":
    demarrer_worker()
