from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import creer_access_token, verifier_mot_de_passe
from app.db.base import get_db
from app.models.utilisateur import Utilisateur
from app.schemas.auth import LoginRequest, Token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    utilisateur = db.query(Utilisateur).filter(Utilisateur.email == payload.email).first()

    if not utilisateur or not verifier_mot_de_passe(payload.mot_de_passe, utilisateur.mot_de_passe_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    if not utilisateur.est_actif:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte est désactivé",
        )

    access_token = creer_access_token(sujet=str(utilisateur.id))
    return Token(access_token=access_token)
