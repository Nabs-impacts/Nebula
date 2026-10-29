from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.base import get_db
from app.models.entreprise import Entreprise, StatutProspection
from app.models.message import Message, StatutEnvoi
from app.models.reponse_recue import ReponseRecue
from app.services import relance_service

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
    brouillons = (
        db.query(func.count(Message.id)).filter(Message.statut_envoi == StatutEnvoi.EN_ATTENTE).scalar()
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
    reponses = (
        db.query(func.count(Entreprise.id))
        .filter(Entreprise.statut == StatutProspection.REPONDU)
        .scalar()
    )

    taux_conversion = (convertis / total_entreprises * 100) if total_entreprises else 0

    return {
        "total_entreprises": total_entreprises,
        "repartition_statuts": repartition_statuts,
        "messages_envoyes": messages_envoyes,
        "messages_echoues": messages_echoues,
        "brouillons": brouillons,
        "reponses": reponses,
        "a_relancer": len(relance_service.trouver_entreprises_a_relancer(db)),
        "repartition_canaux": repartition_canaux,
        "convertis": convertis,
        "taux_conversion_pourcent": round(taux_conversion, 2),
    }


@router.get("/actions")
def obtenir_actions(
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    maintenant = datetime.now(timezone.utc)

    a_relancer = []
    for entreprise in relance_service.trouver_entreprises_a_relancer(db):
        dernier = relance_service._dernier_message_envoye(db, entreprise.id)
        jours = None
        if dernier and dernier.date_envoi:
            date_envoi = dernier.date_envoi
            if date_envoi.tzinfo is None:
                date_envoi = date_envoi.replace(tzinfo=timezone.utc)
            jours = max(0, (maintenant - date_envoi).days)
        a_relancer.append(
            {
                "id": str(entreprise.id),
                "nom": entreprise.nom,
                "contact_nom": entreprise.contact_nom,
                "ville": entreprise.ville,
                "statut": entreprise.statut.value,
                "priorite": entreprise.priorite.value,
                "jours_depuis_envoi": jours,
            }
        )

    brouillons = (
        db.query(Message, Entreprise)
        .join(Entreprise, Message.entreprise_id == Entreprise.id)
        .filter(Message.statut_envoi == StatutEnvoi.EN_ATTENTE)
        .order_by(Message.date_generation.desc())
        .limit(10)
        .all()
    )

    reponses = (
        db.query(Entreprise)
        .filter(
            Entreprise.statut.in_(
                [StatutProspection.REPONDU, StatutProspection.CONVERTI]
            )
        )
        .order_by(Entreprise.date_mise_a_jour.desc())
        .limit(10)
        .all()
    )

    ids_entreprises = [e.id for e in reponses]
    dernieres_reponses: dict = {}
    if ids_entreprises:
        lignes_rep = (
            db.query(ReponseRecue)
            .filter(ReponseRecue.entreprise_id.in_(ids_entreprises))
            .order_by(ReponseRecue.recu_le.desc())
            .all()
        )
        for r in lignes_rep:
            if r.entreprise_id not in dernieres_reponses:
                dernieres_reponses[r.entreprise_id] = r

    return {
        "a_relancer": a_relancer,
        "brouillons": [
            {
                "message_id": str(message.id),
                "entreprise_id": str(entreprise.id),
                "nom": entreprise.nom,
                "canal": message.canal.value,
                "sujet": message.sujet,
                "date_generation": message.date_generation.isoformat(),
            }
            for message, entreprise in brouillons
        ],
        "reponses_recentes": [
            {
                "id": str(entreprise.id),
                "nom": entreprise.nom,
                "statut": entreprise.statut.value,
                "date_mise_a_jour": entreprise.date_mise_a_jour.isoformat(),
                "extrait": dernieres_reponses.get(entreprise.id).extrait if dernieres_reponses.get(entreprise.id) else None,
                "non_lu": not dernieres_reponses.get(entreprise.id).lu if dernieres_reponses.get(entreprise.id) else False,
            }
            for entreprise in reponses
        ],
    }
