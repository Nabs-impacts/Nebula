import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    contenu: str = Field(min_length=1, max_length=5000)


class NoteOut(BaseModel):
    id: uuid.UUID
    entreprise_id: uuid.UUID
    auteur_id: uuid.UUID | None
    contenu: str
    date_creation: datetime

    class Config:
        from_attributes = True
