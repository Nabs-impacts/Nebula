import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.message import CanalMessage, StatutEnvoi


class MessageGenerationRequest(BaseModel):
    entreprise_id: uuid.UUID
    canal: CanalMessage = CanalMessage.EMAIL
    angle_code: str | None = None
    service_a_proposer: str | None = None
    consigne_supplementaire: str | None = None
    ton: str | None = "professionnel"


class MessageCreate(BaseModel):
    entreprise_id: uuid.UUID
    canal: CanalMessage
    sujet: str | None = None
    angle: str | None = None
    contenu_genere: str
    source_generation: str | None = None
    est_relance: bool = False


class MessageUpdate(BaseModel):
    sujet: str | None = None
    contenu_final: str | None = None
    statut_envoi: StatutEnvoi | None = None


class MessageOut(BaseModel):
    id: uuid.UUID
    entreprise_id: uuid.UUID
    canal: CanalMessage
    sujet: str | None
    angle: str | None
    contenu_genere: str
    contenu_final: str | None
    source_generation: str | None = None
    est_relance: bool
    statut_envoi: StatutEnvoi
    date_generation: datetime
    date_envoi: datetime | None

    class Config:
        from_attributes = True
