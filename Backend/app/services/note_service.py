import uuid

from sqlalchemy.orm import Session

from app.models.note import Note
from app.schemas.note import NoteCreate


def lister_notes(db: Session, entreprise_id: uuid.UUID) -> list[Note]:
    return (
        db.query(Note)
        .filter(Note.entreprise_id == entreprise_id)
        .order_by(Note.date_creation.desc())
        .all()
    )


def creer_note(
    db: Session, entreprise_id: uuid.UUID, auteur_id: uuid.UUID | None, donnees: NoteCreate
) -> Note:
    note = Note(entreprise_id=entreprise_id, auteur_id=auteur_id, contenu=donnees.contenu.strip())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def obtenir_note(db: Session, note_id: uuid.UUID) -> Note | None:
    return db.get(Note, note_id)


def supprimer_note(db: Session, note: Note) -> None:
    db.delete(note)
    db.commit()
