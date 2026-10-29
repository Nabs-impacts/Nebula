import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.base import get_db
from app.schemas.note import NoteCreate, NoteOut
from app.services import entreprise_service, note_service

router = APIRouter(prefix="/api", tags=["notes"])


@router.get("/entreprises/{entreprise_id}/notes", response_model=list[NoteOut])
def lister_notes(
    entreprise_id: uuid.UUID,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    if entreprise_service.obtenir_entreprise(db, entreprise_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entreprise introuvable")
    return note_service.lister_notes(db, entreprise_id)


@router.post(
    "/entreprises/{entreprise_id}/notes",
    response_model=NoteOut,
    status_code=status.HTTP_201_CREATED,
)
def creer_note(
    entreprise_id: uuid.UUID,
    donnees: NoteCreate,
    db: Session = Depends(get_db),
    utilisateur=Depends(get_current_user),
):
    if entreprise_service.obtenir_entreprise(db, entreprise_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entreprise introuvable")
    return note_service.creer_note(db, entreprise_id, utilisateur.id, donnees)


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_note(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    note = note_service.obtenir_note(db, note_id)
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note introuvable")
    note_service.supprimer_note(db, note)
