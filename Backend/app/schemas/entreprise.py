import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.entreprise import (
    PresenceWeb,
    PrioriteProspection,
    StatutProspection,
    TypeEntreprise,
)


class EntrepriseBase(BaseModel):
    nom: str
    email: EmailStr | None = None
    whatsapp: str | None = None
    contact_nom: str | None = None
    ville: str | None = None
    site_web: str | None = None
    presence_web: PresenceWeb = PresenceWeb.INCONNU
    note_google: float | None = Field(default=None, ge=0, le=5)
    autres_observations: str | None = None
    priorite: PrioriteProspection = PrioriteProspection.NORMALE
    tags: list[str] = Field(default_factory=list)
    type_entreprise: TypeEntreprise = TypeEntreprise.AUTRE
    prototype_a_presenter: str | None = None
    description_prototype: str | None = None

    @field_validator("whatsapp")
    @classmethod
    def valider_whatsapp(cls, valeur: str | None) -> str | None:
        if valeur is None or valeur == "":
            return valeur or None
        nettoye = valeur.strip().replace(" ", "")
        if not nettoye.startswith("+"):
            raise ValueError("Le numéro WhatsApp doit être au format international, ex : +22790000000")
        return nettoye

    @field_validator("tags", mode="before")
    @classmethod
    def normaliser_tags(cls, valeur):
        if valeur is None:
            return []
        if isinstance(valeur, str):
            return [tag.strip() for tag in valeur.split(",") if tag.strip()]
        return valeur


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
    contact_nom: str | None = None
    ville: str | None = None
    site_web: str | None = None
    presence_web: PresenceWeb | None = None
    note_google: float | None = Field(default=None, ge=0, le=5)
    autres_observations: str | None = None
    priorite: PrioriteProspection | None = None
    tags: list[str] | None = None
    type_entreprise: TypeEntreprise | None = None
    prototype_a_presenter: str | None = None
    description_prototype: str | None = None
    statut: StatutProspection | None = None
    assigne_a_id: uuid.UUID | None = None

    @field_validator("whatsapp")
    @classmethod
    def valider_whatsapp(cls, valeur: str | None) -> str | None:
        if valeur is None or valeur == "":
            return valeur or None
        nettoye = valeur.strip().replace(" ", "")
        if not nettoye.startswith("+"):
            raise ValueError("Le numéro WhatsApp doit être au format international, ex : +22790000000")
        return nettoye

    @field_validator("tags", mode="before")
    @classmethod
    def normaliser_tags(cls, valeur):
        if valeur is None:
            return valeur
        if isinstance(valeur, str):
            return [tag.strip() for tag in valeur.split(",") if tag.strip()]
        return valeur


class EntrepriseOut(EntrepriseBase):
    id: uuid.UUID
    statut: StatutProspection
    assigne_a_id: uuid.UUID | None
    date_creation: datetime
    date_mise_a_jour: datetime

    class Config:
        from_attributes = True
