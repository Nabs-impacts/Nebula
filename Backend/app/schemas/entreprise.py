import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator

from app.models.entreprise import TypeEntreprise, StatutProspection


class EntrepriseBase(BaseModel):
    nom: str
    email: EmailStr | None = None
    whatsapp: str | None = None
    type_entreprise: TypeEntreprise = TypeEntreprise.AUTRE
    prototype_a_presenter: str
    description_prototype: str

    @field_validator("whatsapp")
    @classmethod
    def valider_whatsapp(cls, valeur: str | None) -> str | None:
        if valeur is None:
            return valeur
        nettoye = valeur.strip().replace(" ", "")
        if not nettoye.startswith("+"):
            raise ValueError("Le numéro WhatsApp doit être au format international, ex : +22790000000")
        return nettoye

    @field_validator("email")
    @classmethod
    def au_moins_un_contact(cls, email, values):
        # Note : la vérification "email ou whatsapp obligatoire" est faite au niveau du schéma de création
        return email


class EntrepriseCreate(EntrepriseBase):
    assigne_a_id: uuid.UUID | None = None

    @field_validator("whatsapp")
    @classmethod
    def email_ou_whatsapp_requis(cls, whatsapp, info):
        email = info.data.get("email")
        if not email and not whatsapp:
            raise ValueError("Il faut renseigner au moins un email ou un numéro WhatsApp")
        return whatsapp


class EntrepriseUpdate(BaseModel):
    nom: str | None = None
    email: EmailStr | None = None
    whatsapp: str | None = None
    type_entreprise: TypeEntreprise | None = None
    prototype_a_presenter: str | None = None
    description_prototype: str | None = None
    statut: StatutProspection | None = None
    assigne_a_id: uuid.UUID | None = None


class EntrepriseOut(EntrepriseBase):
    id: uuid.UUID
    statut: StatutProspection
    assigne_a_id: uuid.UUID | None
    date_creation: datetime
    date_mise_a_jour: datetime

    class Config:
        from_attributes = True
