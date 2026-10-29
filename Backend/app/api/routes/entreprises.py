import csv
import io
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.base import get_db
from app.schemas.entreprise import EntrepriseCreate, EntrepriseOut, EntrepriseUpdate
from app.services import entreprise_service

router = APIRouter(prefix="/api/entreprises", tags=["entreprises"])

COLONNES_EXPORT = [
    "nom",
    "email",
    "whatsapp",
    "contact_nom",
    "ville",
    "site_web",
    "presence_web",
    "note_google",
    "autres_observations",
    "type_entreprise",
    "prototype_a_presenter",
    "description_prototype",
    "priorite",
    "tags",
    "statut",
]


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
    q: str | None = None,
    ville: str | None = None,
    priorite: str | None = None,
    tag: str | None = None,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    return entreprise_service.lister_entreprises(
        db, skip, limit, statut, type_entreprise, q, ville, priorite, tag
    )


@router.get("/export/csv")
def exporter_entreprises(
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    entreprises = entreprise_service.lister_entreprises(db, skip=0, limit=5000)
    tampon = io.StringIO()
    ecrivain = csv.DictWriter(tampon, fieldnames=COLONNES_EXPORT, extrasaction="ignore")
    ecrivain.writeheader()
    for entreprise in entreprises:
        ecrivain.writerow(
            {
                "nom": entreprise.nom,
                "email": entreprise.email or "",
                "whatsapp": entreprise.whatsapp or "",
                "contact_nom": entreprise.contact_nom or "",
                "ville": entreprise.ville or "",
                "site_web": entreprise.site_web or "",
                "presence_web": entreprise.presence_web.value,
                "note_google": entreprise.note_google if entreprise.note_google is not None else "",
                "autres_observations": entreprise.autres_observations or "",
                "type_entreprise": entreprise.type_entreprise.value,
                "prototype_a_presenter": entreprise.prototype_a_presenter,
                "description_prototype": entreprise.description_prototype,
                "priorite": entreprise.priorite.value,
                "tags": ", ".join(entreprise.tags or []),
                "statut": entreprise.statut.value,
            }
        )

    contenu = "\ufeff" + tampon.getvalue()
    return Response(
        content=contenu,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="prospects-nebula.csv"'},
    )


@router.post("/import/csv")
async def importer_entreprises(
    fichier: UploadFile = File(...),
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    contenu = await fichier.read()
    try:
        texte = contenu.decode("utf-8-sig")
    except UnicodeDecodeError:
        texte = contenu.decode("latin-1")

    lecteur = csv.DictReader(io.StringIO(texte))
    if not lecteur.fieldnames or "nom" not in lecteur.fieldnames:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Le CSV doit contenir au minimum une colonne « nom ».",
        )

    crees = 0
    ignores = 0
    erreurs: list[dict] = []

    for numero, ligne in enumerate(lecteur, start=2):
        if not any((valeur or "").strip() for valeur in ligne.values() if valeur is not None):
            continue

        note_brute = (ligne.get("note_google") or "").replace(",", ".").strip()
        try:
            note_google = float(note_brute) if note_brute else None
        except ValueError:
            note_google = None
        donnees = {
            "nom": (ligne.get("nom") or "").strip(),
            "email": (ligne.get("email") or "").strip() or None,
            "whatsapp": (ligne.get("whatsapp") or "").strip() or None,
            "contact_nom": (ligne.get("contact_nom") or "").strip() or None,
            "ville": (ligne.get("ville") or "").strip() or None,
            "site_web": (ligne.get("site_web") or "").strip() or None,
            "presence_web": ((ligne.get("presence_web") or "inconnu").strip().lower() or "inconnu"),
            "note_google": note_google,
            "autres_observations": (ligne.get("autres_observations") or "").strip() or None,
            "type_entreprise": ((ligne.get("type_entreprise") or "autre").strip().lower() or "autre"),
            "prototype_a_presenter": (ligne.get("prototype_a_presenter") or "").strip(),
            "description_prototype": (ligne.get("description_prototype") or "").strip(),
            "priorite": ((ligne.get("priorite") or "normale").strip().lower() or "normale"),
            "tags": (ligne.get("tags") or "").strip(),
        }
        if not donnees["nom"]:
            ignores += 1
            continue
        if not donnees["prototype_a_presenter"]:
            donnees["prototype_a_presenter"] = "Site vitrine"
        if not donnees["description_prototype"]:
            donnees["description_prototype"] = "Site vitrine simple et rapide sur mobile."

        try:
            entreprise_service.creer_entreprise(db, EntrepriseCreate(**donnees))
            crees += 1
        except (ValidationError, ValueError) as erreur:
            db.rollback()
            ignores += 1
            erreurs.append({"ligne": numero, "detail": str(erreur)})

    return {"crees": crees, "ignores": ignores, "erreurs": erreurs[:20]}


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
