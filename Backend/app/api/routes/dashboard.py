from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.base import get_db
from app.models.entreprise import Entreprise, StatutProspection
from app.models.message import Message, CanalMessage, StatutEnvoi

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def obtenir_statistiques(
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    total_entreprises = db.query(func.count(Entreprise.id)).scalar()

    repartition_statuts = dict(
        db.query(Entreprise.statut, func.count(Entreprise.id)).group_by(Entreprise.statut).all()
    )

    messages_envoyes = (
        db.query(func.count(Message.id)).filter(Message.statut_envoi == StatutEnvoi.ENVOYE).scalar()
    )
    messages_echoues = (
        db.query(func.count(Message.id)).filter(Message.statut_envoi == StatutEnvoi.ECHEC).scalar()
    )

    repartition_canaux = dict(
        db.query(Message.canal, func.count(Message.id))
        .filter(Message.statut_envoi == StatutEnvoi.ENVOYE)
        .group_by(Message.canal)
        .all()
    )

    convertis = (
        db.query(func.count(Entreprise.id))
        .filter(Entreprise.statut == StatutProspection.CONVERTI)
        .scalar()
    )

    taux_conversion = (convertis / total_entreprises * 100) if total_entreprises else 0

    return {
        "total_entreprises": total_entreprises,
        "repartition_statuts": repartition_statuts,
        "messages_envoyes": messages_envoyes,
        "messages_echoues": messages_echoues,
        "repartition_canaux": repartition_canaux,
        "convertis": convertis,
        "taux_conversion_pourcent": round(taux_conversion, 2),
    }
