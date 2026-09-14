from app.core.logging import logger
from app.db.base import SessionLocal
from app.services import relance_service


def tache_generer_relances() -> None:
    """Tâche exécutée périodiquement (via rq-scheduler ou un cron appelant ce script)
    pour détecter les entreprises sans réponse depuis DELAI_RELANCE_JOURS
    et générer automatiquement leur message de relance.

    Ne fait QUE générer le message — l'envoi est ensuite fait manuellement
    (validation humaine) ou via tasks_envoi.py si l'automatisation complète est activée.
    """
    db = SessionLocal()
    try:
        entreprises_a_relancer = relance_service.trouver_entreprises_a_relancer(db)
        logger.info(f"{len(entreprises_a_relancer)} entreprise(s) à relancer")

        for entreprise in entreprises_a_relancer:
            try:
                relance_service.generer_relance_pour_entreprise(db, entreprise)
                logger.info(f"Relance générée pour {entreprise.nom}")
            except Exception as erreur:
                logger.error(f"Échec de génération de relance pour {entreprise.nom} : {erreur}")

    finally:
        db.close()


if __name__ == "__main__":
    tache_generer_relances()
