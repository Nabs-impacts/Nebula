import uuid
from datetime import datetime

from pydantic import BaseModel


class ReponseRecueOut(BaseModel):
    id: uuid.UUID
    entreprise_id: uuid.UUID
    nom_entreprise: str | None = None
    message_id_imap: str
    expediteur: str
    objet: str | None = None
    extrait: str | None = None
    recu_le: datetime
    lu: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ReponseRecueItem(BaseModel):
    id: uuid.UUID
    entreprise_id: uuid.UUID
    nom_entreprise: str
    extrait: str | None = None
    objet: str | None = None
    recu_le: datetime
    lu: bool


class ReponseResumeOut(BaseModel):
    imap_actif: bool
    non_lues: int
    derniere_verification: datetime | None = None
    recentes: list[ReponseRecueItem]


class VerificationResultatOut(BaseModel):
    nouvelles_reponses: int
    derniere_verification: datetime | None = None
    limitation_active: bool = False
