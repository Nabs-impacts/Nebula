import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TypeEntreprise(str, enum.Enum):
    COMMERCE = "commerce"
    RESTAURATION = "restauration"
    SANTE = "sante"
    EDUCATION = "education"
    FINANCE = "finance"
    AGRICULTURE = "agriculture"
    TRANSPORT = "transport"
    AUTRE = "autre"


class StatutProspection(str, enum.Enum):
    NOUVEAU = "nouveau"
    MESSAGE_GENERE = "message_genere"
    ENVOYE = "envoye"
    EN_ATTENTE_REPONSE = "en_attente_reponse"
    REPONDU = "repondu"
    RELANCE_ENVOYEE = "relance_envoyee"
    CONVERTI = "converti"
    PERDU = "perdu"


class Entreprise(Base):
    __tablename__ = "entreprises"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    whatsapp: Mapped[str | None] = mapped_column(String(30), nullable=True)

    type_entreprise: Mapped[TypeEntreprise] = mapped_column(
        Enum(TypeEntreprise, name="type_entreprise_enum"), default=TypeEntreprise.AUTRE
    )
    prototype_a_presenter: Mapped[str] = mapped_column(String(255), nullable=False)
    description_prototype: Mapped[str] = mapped_column(Text, nullable=False)

    statut: Mapped[StatutProspection] = mapped_column(
        Enum(StatutProspection, name="statut_prospection_enum"), default=StatutProspection.NOUVEAU
    )

    assigne_a_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    date_creation: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    date_mise_a_jour: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    messages = relationship("Message", back_populates="entreprise", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Entreprise {self.nom} ({self.statut})>"
