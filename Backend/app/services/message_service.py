import uuid

from sqlalchemy.orm import Session

from app.models.message import Message, StatutEnvoi
from app.schemas.message import MessageCreate, MessageUpdate


def creer_message(db: Session, donnees: MessageCreate) -> Message:
    message = Message(**donnees.model_dump())
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def lister_messages_par_entreprise(db: Session, entreprise_id: uuid.UUID) -> list[Message]:
    return (
        db.query(Message)
        .filter(Message.entreprise_id == entreprise_id)
        .order_by(Message.date_generation.desc())
        .all()
    )


def obtenir_message(db: Session, message_id: uuid.UUID) -> Message | None:
    return db.get(Message, message_id)


def mettre_a_jour_message(db: Session, message: Message, donnees: MessageUpdate) -> Message:
    changements = donnees.model_dump(exclude_unset=True)
    for champ, valeur in changements.items():
        setattr(message, champ, valeur)

    db.commit()
    db.refresh(message)
    return message


def marquer_comme_envoye(db: Session, message: Message) -> Message:
    from datetime import datetime, timezone

    message.statut_envoi = StatutEnvoi.ENVOYE
    message.date_envoi = datetime.now(timezone.utc)
    db.commit()
    db.refresh(message)
    return message


def marquer_comme_echec(db: Session, message: Message) -> Message:
    message.statut_envoi = StatutEnvoi.ECHEC
    db.commit()
    db.refresh(message)
    return message
