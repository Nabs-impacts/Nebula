import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _valeurs(enum_cls):
    return [membre.value for membre in enum_cls]


class CanalMessage(str, enum.Enum):
    EMAIL = "email"
    WHATSAPP = "whatsapp"


class StatutEnvoi(str, enum.Enum):
    EN_ATTENTE = "en_attente"
    ENVOYE = "envoye"
    ECHEC = "echec"


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    entreprise_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("entreprises.id", ondelete="CASCADE"), nullable=False
    )

    canal: Mapped[CanalMessage] = mapped_column(
        Enum(CanalMessage, name="canal_message_enum", values_callable=_valeurs), nullable=False
    )

    sujet: Mapped[str | None] = mapped_column(String(255), nullable=True)
    angle: Mapped[str | None] = mapped_column(Text, nullable=True)
    contenu_genere: Mapped[str] = mapped_column(Text, nullable=False)
    contenu_final: Mapped[str | None] = mapped_column(Text, nullable=True)

    identifiant_externe: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    source_generation: Mapped[str | None] = mapped_column(String(50), nullable=True)

    est_relance: Mapped[bool] = mapped_column(default=False)

    statut_envoi: Mapped[StatutEnvoi] = mapped_column(
        Enum(StatutEnvoi, name="statut_envoi_enum", values_callable=_valeurs), default=StatutEnvoi.EN_ATTENTE
    )

    date_generation: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    date_envoi: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    entreprise = relationship("Entreprise", back_populates="messages")

    def __repr__(self) -> str:
        return f"<Message {self.canal} - {self.statut_envoi}>"
