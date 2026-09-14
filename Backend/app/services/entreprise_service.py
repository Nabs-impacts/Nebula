import uuid

from sqlalchemy.orm import Session

from app.models.entreprise import Entreprise
from app.schemas.entreprise import EntrepriseCreate, EntrepriseUpdate


def creer_entreprise(db: Session, donnees: EntrepriseCreate) -> Entreprise:
    entreprise = Entreprise(**donnees.model_dump())
    db.add(entreprise)
    db.commit()
    db.refresh(entreprise)
    return entreprise


def lister_entreprises(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    statut: str | None = None,
    type_entreprise: str | None = None,
) -> list[Entreprise]:
    query = db.query(Entreprise)

    if statut:
        query = query.filter(Entreprise.statut == statut)
    if type_entreprise:
        query = query.filter(Entreprise.type_entreprise == type_entreprise)

    return query.order_by(Entreprise.date_creation.desc()).offset(skip).limit(limit).all()


def obtenir_entreprise(db: Session, entreprise_id: uuid.UUID) -> Entreprise | None:
    return db.get(Entreprise, entreprise_id)


def mettre_a_jour_entreprise(
    db: Session, entreprise: Entreprise, donnees: EntrepriseUpdate
) -> Entreprise:
    changements = donnees.model_dump(exclude_unset=True)
    for champ, valeur in changements.items():
        setattr(entreprise, champ, valeur)

    db.commit()
    db.refresh(entreprise)
    return entreprise


def supprimer_entreprise(db: Session, entreprise: Entreprise) -> None:
    db.delete(entreprise)
    db.commit()
