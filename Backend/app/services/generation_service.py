from sqlalchemy.orm import Session

from app.ai.generateur_message import generer_message_prospection
from app.models.entreprise import Entreprise, StatutProspection
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageGenerationRequest
from app.services import entreprise_service, message_service, note_service


def generer_et_enregistrer_message(db: Session, requete: MessageGenerationRequest) -> Message:
    """Récupère l'entreprise, injecte l'historique de notes et génère le message."""
    entreprise = entreprise_service.obtenir_entreprise(db, requete.entreprise_id)
    if entreprise is None:
        raise ValueError("Entreprise introuvable pour la génération du message")

    notes_recents = [n.contenu for n in note_service.lister_notes(db, entreprise.id)[:3]]

    resultat = generer_message_prospection(
        entreprise=entreprise,
        canal=requete.canal.value,
        consigne_supplementaire=requete.consigne_supplementaire,
        angle_code=requete.angle_code,
        service_a_proposer=requete.service_a_proposer,
        notes_chronologie=notes_recents,
    )

    message_cree = message_service.creer_message(
        db,
        MessageCreate(
            entreprise_id=entreprise.id,
            canal=requete.canal,
            sujet=resultat.objet if requete.canal.value == "email" else None,
            angle=resultat.angle,
            contenu_genere=resultat.corps,
            source_generation=resultat.source,
        ),
    )

    # Sauvegarde la source de génération
    message_cree.source_generation = resultat.source
    db.commit()
    db.refresh(message_cree)

    _marquer_entreprise_message_genere(db, entreprise)

    return message_cree


def _marquer_entreprise_message_genere(db: Session, entreprise: Entreprise) -> None:
    if entreprise.statut == StatutProspection.NOUVEAU:
        entreprise.statut = StatutProspection.MESSAGE_GENERE
        db.commit()
