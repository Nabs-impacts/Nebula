import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.base import get_db
from app.schemas.entreprise import EntrepriseCreate, EntrepriseOut, EntrepriseUpdate
from app.services import entreprise_service

router = APIRouter(prefix="/api/entreprises", tags=["entreprises"])


@router.post("", response_model=EntrepriseOut, status_code=status.HTTP_201_CREATED)
def creer_entreprise(
    donnees: EntrepriseCreate,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    return entreprise_service.creer_entreprise(db, donnees)


@router.get("", response_model=list[EntrepriseOut])
def lister_entreprises(
    skip: int = 0,
    limit: int = 50,
    statut: str | None = None,
    type_entreprise: str | None = None,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    return entreprise_service.lister_entreprises(db, skip, limit, statut, type_entreprise)


@router.get("/{entreprise_id}", response_model=EntrepriseOut)
def obtenir_entreprise(
    entreprise_id: uuid.UUID,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    entreprise = entreprise_service.obtenir_entreprise(db, entreprise_id)
    if entreprise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entreprise introuvable")
    return entreprise


@router.patch("/{entreprise_id}", response_model=EntrepriseOut)
def mettre_a_jour_entreprise(
    entreprise_id: uuid.UUID,
    donnees: EntrepriseUpdate,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    entreprise = entreprise_service.obtenir_entreprise(db, entreprise_id)
    if entreprise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entreprise introuvable")
    return entreprise_service.mettre_a_jour_entreprise(db, entreprise, donnees)


@router.delete("/{entreprise_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_entreprise(
    entreprise_id: uuid.UUID,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    entreprise = entreprise_service.obtenir_entreprise(db, entreprise_id)
    if entreprise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entreprise introuvable")
    entreprise_service.supprimer_entreprise(db, entreprise)
