import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _valeurs(enum_cls):
    return [membre.value for membre in enum_cls]


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


class PrioriteProspection(str, enum.Enum):
    BASSE = "basse"
    NORMALE = "normale"
    HAUTE = "haute"


class PresenceWeb(str, enum.Enum):
    AUCUN_SITE = "aucun_site"
    SITE_EXISTANT = "site_existant"
    INCONNU = "inconnu"


class Entreprise(Base):
    __tablename__ = "entreprises"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    whatsapp: Mapped[str | None] = mapped_column(String(30), nullable=True)

    contact_nom: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ville: Mapped[str | None] = mapped_column(String(120), nullable=True)
    site_web: Mapped[str | None] = mapped_column(String(500), nullable=True)
    presence_web: Mapped[PresenceWeb] = mapped_column(
        Enum(PresenceWeb, name="presence_web_enum", values_callable=_valeurs), default=PresenceWeb.INCONNU
    )
    note_google: Mapped[float | None] = mapped_column(Float, nullable=True)
    autres_observations: Mapped[str | None] = mapped_column(Text, nullable=True)
    priorite: Mapped[PrioriteProspection] = mapped_column(
        Enum(PrioriteProspection, name="priorite_prospection_enum", values_callable=_valeurs), default=PrioriteProspection.NORMALE
    )
    tags: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)

    type_entreprise: Mapped[TypeEntreprise] = mapped_column(
        Enum(TypeEntreprise, name="type_entreprise_enum", values_callable=_valeurs), default=TypeEntreprise.AUTRE
    )
    prototype_a_presenter: Mapped[str] = mapped_column(String(255), nullable=False)
    description_prototype: Mapped[str] = mapped_column(Text, nullable=False)

    statut: Mapped[StatutProspection] = mapped_column(
        Enum(StatutProspection, name="statut_prospection_enum", values_callable=_valeurs), default=StatutProspection.NOUVEAU
    )

    assigne_a_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    date_creation: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    date_mise_a_jour: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    messages = relationship("Message", back_populates="entreprise", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="entreprise", cascade="all, delete-orphan")
    reponses = relationship(
        "ReponseRecue",
        back_populates="entreprise",
        cascade="all, delete-orphan",
        order_by="desc(ReponseRecue.recu_le)",
    )

    def __repr__(self) -> str:
        return f"<Entreprise {self.nom} ({self.statut})>"
