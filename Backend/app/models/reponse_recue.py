import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ReponseRecue(Base):
    __tablename__ = "reponses_recues"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    entreprise_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entreprises.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    message_id_imap: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    expediteur: Mapped[str] = mapped_column(String(255), nullable=False)
    objet: Mapped[str | None] = mapped_column(String(500), nullable=True)
    extrait: Mapped[str | None] = mapped_column(Text, nullable=True)
    recu_le: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    lu: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    entreprise = relationship("Entreprise", back_populates="reponses")

    __table_args__ = (
        Index("ix_reponses_recues_entreprise_id_recu_le", "entreprise_id", "recu_le"),
    )

    def __repr__(self) -> str:
        return f"<ReponseRecue {self.expediteur} -> {self.entreprise_id} (lu={self.lu})>"
