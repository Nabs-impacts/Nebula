import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.core.security import hash_mot_de_passe
from app.db.base import get_db
from app.models.utilisateur import Utilisateur
from app.schemas.utilisateur import UtilisateurCreate, UtilisateurOut, UtilisateurUpdate

router = APIRouter(prefix="/api/utilisateurs", tags=["utilisateurs"])


@router.get("/moi", response_model=UtilisateurOut)
def obtenir_profil_courant(utilisateur: Utilisateur = Depends(get_current_user)):
    return utilisateur


@router.post("", response_model=UtilisateurOut, status_code=status.HTTP_201_CREATED)
def creer_utilisateur(
    donnees: UtilisateurCreate,
    db: Session = Depends(get_db),
    _admin: Utilisateur = Depends(get_current_admin),
):
    existant = db.query(Utilisateur).filter(Utilisateur.email == donnees.email).first()
    if existant:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cet email est déjà utilisé")

    utilisateur = Utilisateur(
        nom=donnees.nom,
        email=donnees.email,
        mot_de_passe_hash=hash_mot_de_passe(donnees.mot_de_passe),
    )
    db.add(utilisateur)
    db.commit()
    db.refresh(utilisateur)
    return utilisateur


@router.get("", response_model=list[UtilisateurOut])
def lister_utilisateurs(
    db: Session = Depends(get_db),
    _admin: Utilisateur = Depends(get_current_admin),
):
    return db.query(Utilisateur).order_by(Utilisateur.date_creation.desc()).all()


@router.patch("/{utilisateur_id}", response_model=UtilisateurOut)
def mettre_a_jour_utilisateur(
    utilisateur_id: uuid.UUID,
    donnees: UtilisateurUpdate,
    db: Session = Depends(get_db),
    _admin: Utilisateur = Depends(get_current_admin),
):
    utilisateur = db.get(Utilisateur, utilisateur_id)
    if utilisateur is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

    changements = donnees.model_dump(exclude_unset=True)
    for champ, valeur in changements.items():
        setattr(utilisateur, champ, valeur)

    db.commit()
    db.refresh(utilisateur)
    return utilisateur
