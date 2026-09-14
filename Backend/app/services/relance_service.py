from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.ai.generateur_message import generer_relance
from app.core.logging import logger
from app.models.entreprise import Entreprise, StatutProspection
from app.models.message import Message, StatutEnvoi
from app.schemas.message import MessageCreate
from app.services import message_service

DELAI_RELANCE_JOURS = 5


def trouver_entreprises_a_relancer(db: Session) -> list[Entreprise]:
    """Retourne les entreprises dont le dernier message envoyé date de plus de
    DELAI_RELANCE_JOURS jours et qui n'ont pas encore répondu ni été relancées trop récemment.
    """
    seuil = datetime.now(timezone.utc) - timedelta(days=DELAI_RELANCE_JOURS)

    return (
        db.query(Entreprise)
        .filter(Entreprise.statut == StatutProspection.ENVOYE)
        .join(Message, Message.entreprise_id == Entreprise.id)
        .filter(Message.statut_envoi == StatutEnvoi.ENVOYE)
        .filter(Message.date_envoi <= seuil)
        .distinct()
        .all()
    )


def generer_relance_pour_entreprise(db: Session, entreprise: Entreprise) -> Message | None:
    """Génère et enregistre un message de relance pour une entreprise donnée.

    Se base sur le dernier message envoyé pour construire la relance.
    """
    dernier_message = (
        db.query(Message)
        .filter(Message.entreprise_id == entreprise.id, Message.statut_envoi == StatutEnvoi.ENVOYE)
        .order_by(Message.date_envoi.desc())
        .first()
    )

    if dernier_message is None:
        logger.warning(f"Aucun message précédent trouvé pour la relance de {entreprise.nom}")
        return None

    contenu_relance = generer_relance(
        nom_entreprise=entreprise.nom,
        contenu_precedent=dernier_message.contenu_final or dernier_message.contenu_genere,
        canal=dernier_message.canal.value,
    )

    message_relance = message_service.creer_message(
        db,
        MessageCreate(
            entreprise_id=entreprise.id,
            canal=dernier_message.canal,
            contenu_genere=contenu_relance,
            est_relance=True,
        ),
    )

    entreprise.statut = StatutProspection.RELANCE_ENVOYEE
    db.commit()

    return message_relance
