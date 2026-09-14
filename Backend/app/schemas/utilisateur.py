import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


class UtilisateurBase(BaseModel):
    nom: str
    email: EmailStr


class UtilisateurCreate(UtilisateurBase):
    mot_de_passe: str

    @field_validator("mot_de_passe")
    @classmethod
    def valider_longueur_mot_de_passe(cls, valeur: str) -> str:
        if len(valeur) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
        return valeur


class UtilisateurUpdate(BaseModel):
    nom: str | None = None
    email: EmailStr | None = None
    est_actif: bool | None = None


class UtilisateurOut(UtilisateurBase):
    id: uuid.UUID
    est_actif: bool
    est_admin: bool
    date_creation: datetime

    class Config:
        from_attributes = True
