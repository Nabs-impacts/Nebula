import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PrototypeFichier(Base):
    __tablename__ = "prototype_fichiers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    entreprise_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("entreprises.id", ondelete="CASCADE"), nullable=False
    )

    nom_fichier: Mapped[str] = mapped_column(String(255), nullable=False)
    url_stockage: Mapped[str] = mapped_column(String(500), nullable=False)  # URL Cloudflare R2
    type_mime: Mapped[str] = mapped_column(String(100), nullable=False)

    date_upload: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    entreprise = relationship("Entreprise")

    def __repr__(self) -> str:
        return f"<PrototypeFichier {self.nom_fichier}>"
