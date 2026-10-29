from sqlalchemy.orm import Session

from app.ai.generateur_message import generer_message_prospection
from app.models.entreprise import Entreprise, StatutProspection
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageGenerationRequest
from app.services import entreprise_service, message_service


def generer_et_enregistrer_message(db: Session, requete: MessageGenerationRequest) -> Message:
    """Récupère l'entreprise ciblée, génère un message via l'IA et l'enregistre en base.

    Le message est créé avec statut_envoi = EN_ATTENTE ; l'envoi effectif
    est géré séparément par envoi_service.py.
    """
    entreprise = entreprise_service.obtenir_entreprise(db, requete.entreprise_id)
    if entreprise is None:
        raise ValueError("Entreprise introuvable pour la génération du message")

    resultat = generer_message_prospection(
        nom_entreprise=entreprise.nom,
        type_entreprise=entreprise.type_entreprise.value,
        prototype_a_presenter=entreprise.prototype_a_presenter,
        description_prototype=entreprise.description_prototype,
        service_a_proposer=requete.service_a_proposer,
        canal=requete.canal.value,
        ton=requete.ton or "professionnel",
        contact_nom=entreprise.contact_nom,
        ville=entreprise.ville,
        site_web=entreprise.site_web,
        presence_web=entreprise.presence_web.value,
        note_google=entreprise.note_google,
        autres_observations=entreprise.autres_observations,
    )

    message_cree = message_service.creer_message(
        db,
        MessageCreate(
            entreprise_id=entreprise.id,
            canal=requete.canal,
            sujet=resultat.objet if requete.canal.value == "email" else None,
            angle=resultat.angle,
            contenu_genere=resultat.corps,
        ),
    )

    _marquer_entreprise_message_genere(db, entreprise)

    return message_cree


def _marquer_entreprise_message_genere(db: Session, entreprise: Entreprise) -> None:
    if entreprise.statut == StatutProspection.NOUVEAU:
        entreprise.statut = StatutProspection.MESSAGE_GENERE
        db.commit()
