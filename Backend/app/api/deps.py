import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decoder_access_token
from app.db.base import get_db
from app.models.utilisateur import Utilisateur

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Utilisateur:
    exception_auth = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decoder_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise exception_auth
    except JWTError:
        raise exception_auth

    utilisateur = db.get(Utilisateur, uuid.UUID(user_id))
    if utilisateur is None or not utilisateur.est_actif:
        raise exception_auth

    return utilisateur


def get_current_admin(
    utilisateur: Utilisateur = Depends(get_current_user),
) -> Utilisateur:
    if not utilisateur.est_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )
    return utilisateur
