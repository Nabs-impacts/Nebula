import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.base import get_db
from app.models.entreprise import Entreprise
from app.models.reponse_recue import ReponseRecue
from app.schemas.reponse import ReponseRecueItem, ReponseRecueOut, ReponseResumeOut, VerificationResultatOut
from app.services import reception_service

router = APIRouter(prefix="/api/reponses", tags=["reponses"])

# Throttle de 60 secondes pour la vérification manuelle
_DERNIER_DECLENCHEMENT_VERIF: datetime | None = None
_DERNIER_NB_NOUVELLES: int = 0


class MarquerLuesPayload(BaseModel):
    entreprise_id: Optional[uuid.UUID] = None


@router.get("/resume", response_model=ReponseResumeOut)
def obtenir_resume_reponses(
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    """Fournit un résumé léger pour la navigation et les notifications du frontend."""
    imap_actif = bool(settings.imap_enabled and settings.imap_user and settings.imap_password)

    non_lues = (
        db.query(func.count(ReponseRecue.id))
        .filter(ReponseRecue.lu == False)  # noqa: E712
        .scalar()
        or 0
    )

    lignes_recentes = (
        db.query(ReponseRecue, Entreprise.nom)
        .join(Entreprise, ReponseRecue.entreprise_id == Entreprise.id)
        .order_by(ReponseRecue.recu_le.desc())
        .limit(5)
        .all()
    )

    recentes = [
        ReponseRecueItem(
            id=reponse.id,
            entreprise_id=reponse.entreprise_id,
            nom_entreprise=nom_entreprise,
            extrait=reponse.extrait,
            objet=reponse.objet,
            recu_le=reponse.recu_le,
            lu=reponse.lu,
        )
        for reponse, nom_entreprise in lignes_recentes
    ]

    return ReponseResumeOut(
        imap_actif=imap_actif,
        non_lues=non_lues,
        derniere_verification=reception_service.obtenir_derniere_date_verification(),
        recentes=recentes,
    )


@router.get("", response_model=list[ReponseRecueOut])
def lister_reponses(
    entreprise_id: Optional[uuid.UUID] = Query(None),
    non_lues: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    """Liste les réponses reçues avec filtres optionnels."""
    requete = (
        db.query(ReponseRecue, Entreprise.nom)
        .join(Entreprise, ReponseRecue.entreprise_id == Entreprise.id)
    )

    if entreprise_id:
        requete = requete.filter(ReponseRecue.entreprise_id == entreprise_id)
    if non_lues is not None:
        requete = requete.filter(ReponseRecue.lu == (not non_lues))

    resultats = requete.order_by(ReponseRecue.recu_le.desc()).limit(limit).all()

    sorties = []
    for reponse, nom_ent in resultats:
        sortie = ReponseRecueOut.model_validate(reponse)
        sortie.nom_entreprise = nom_ent
        sorties.append(sortie)
    return sorties


@router.post("/{reponse_id}/lue", response_model=ReponseRecueOut)
def marquer_reponse_comme_lue(
    reponse_id: uuid.UUID,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    """Marque une réponse spécifique comme lue."""
    reponse = db.query(ReponseRecue).filter(ReponseRecue.id == reponse_id).first()
    if not reponse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Réponse introuvable")

    reponse.lu = True
    db.commit()
    db.refresh(reponse)

    nom_ent = db.query(Entreprise.nom).filter(Entreprise.id == reponse.entreprise_id).scalar()
    sortie = ReponseRecueOut.model_validate(reponse)
    sortie.nom_entreprise = nom_ent
    return sortie


@router.post("/marquer-lues")
def marquer_plusieurs_reponses_comme_lues(
    payload: Optional[MarquerLuesPayload] = None,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    """Marque toutes les réponses (ou celles d'une entreprise) comme lues."""
    requete = db.query(ReponseRecue).filter(ReponseRecue.lu == False)  # noqa: E712
    if payload and payload.entreprise_id:
        requete = requete.filter(ReponseRecue.entreprise_id == payload.entreprise_id)

    nb_modifiees = requete.update({"lu": True}, synchronize_session=False)
    db.commit()
    return {"modifiees": nb_modifiees}


@router.post("/verifier", response_model=VerificationResultatOut)
def declencher_verification_immediate(
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    """Déclenche une vérification IMAP immédiate (limitée à une fois toutes les 60 secondes)."""
    global _DERNIER_DECLENCHEMENT_VERIF, _DERNIER_NB_NOUVELLES
    maintenant = datetime.now(timezone.utc)

    # Throttling de 60s
    if _DERNIER_DECLENCHEMENT_VERIF:
        secondes_ecoulees = (maintenant - _DERNIER_DECLENCHEMENT_VERIF).total_seconds()
        if secondes_ecoulees < 60:
            return VerificationResultatOut(
                nouvelles_reponses=_DERNIER_NB_NOUVELLES,
                derniere_verification=reception_service.obtenir_derniere_date_verification() or _DERNIER_DECLENCHEMENT_VERIF,
                limitation_active=True,
            )

    nouvelles = reception_service.verifier_nouvelles_reponses(db)
    _DERNIER_DECLENCHEMENT_VERIF = maintenant
    _DERNIER_NB_NOUVELLES = nouvelles

    return VerificationResultatOut(
        nouvelles_reponses=nouvelles,
        derniere_verification=reception_service.obtenir_derniere_date_verification() or maintenant,
        limitation_active=False,
    )
