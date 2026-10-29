from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.ai.generateur_message import generer_relance
from app.core.logging import logger
from app.models.entreprise import Entreprise, StatutProspection
from app.models.message import Message, StatutEnvoi
from app.schemas.message import MessageCreate
from app.services import message_service

DELAI_RELANCE_JOURS = 5


def _dernier_message_envoye(db: Session, entreprise_id) -> Message | None:
    return (
        db.query(Message)
        .filter(Message.entreprise_id == entreprise_id, Message.statut_envoi == StatutEnvoi.ENVOYE)
        .order_by(Message.date_envoi.desc())
        .first()
    )


def trouver_entreprises_a_relancer(db: Session) -> list[Entreprise]:
    """Retourne les entreprises contactées dont le dernier envoi date de plus de
    DELAI_RELANCE_JOURS jours, sans réponse et sans relance déjà partie.
    """
    seuil = datetime.now(timezone.utc) - timedelta(days=DELAI_RELANCE_JOURS)
    candidates = (
        db.query(Entreprise)
        .filter(
            Entreprise.statut.in_(
                [StatutProspection.ENVOYE, StatutProspection.EN_ATTENTE_REPONSE]
            )
        )
        .all()
    )

    resultat: list[Entreprise] = []
    for entreprise in candidates:
        dernier = _dernier_message_envoye(db, entreprise.id)
        if dernier is None or dernier.date_envoi is None:
            continue
        if dernier.est_relance:
            continue
        date_envoi = dernier.date_envoi
        if date_envoi.tzinfo is None:
            date_envoi = date_envoi.replace(tzinfo=timezone.utc)
        if date_envoi <= seuil:
            resultat.append(entreprise)
    return resultat


def generer_relance_pour_entreprise(db: Session, entreprise: Entreprise) -> Message | None:
    """Génère et enregistre un message de relance pour une entreprise donnée.

    Se base sur le dernier message envoyé pour construire la relance.
    """
    dernier_message = _dernier_message_envoye(db, entreprise.id)

    if dernier_message is None:
        logger.warning(f"Aucun message précédent trouvé pour la relance de {entreprise.nom}")
        return None

    jours = None
    if dernier_message.date_envoi:
        date_envoi = dernier_message.date_envoi
        if date_envoi.tzinfo is None:
            date_envoi = date_envoi.replace(tzinfo=timezone.utc)
        jours = max(0, (datetime.now(timezone.utc) - date_envoi).days)

    resultat = generer_relance(
        nom_entreprise=entreprise.nom,
        contenu_precedent=dernier_message.contenu_final or dernier_message.contenu_genere,
        canal=dernier_message.canal.value,
        sujet_precedent=dernier_message.sujet,
        jours_depuis_envoi=jours,
        contact_nom=entreprise.contact_nom,
        ville=entreprise.ville,
        type_entreprise=entreprise.type_entreprise.value,
        autres_observations=entreprise.autres_observations,
    )

    message_relance = message_service.creer_message(
        db,
        MessageCreate(
            entreprise_id=entreprise.id,
            canal=dernier_message.canal,
            sujet=resultat.objet if dernier_message.canal.value == "email" else None,
            angle=resultat.angle,
            contenu_genere=resultat.corps,
            est_relance=True,
        ),
    )

    return message_relance
