from sqlalchemy.orm import Session

from app.core.logging import logger
from app.integrations.email.brevo_client import envoyer_email
from app.integrations.whatsapp.meta_cloud_client import envoyer_message_texte
from app.models.entreprise import Entreprise, StatutProspection
from app.models.message import Message, CanalMessage
from app.services import message_service


def envoyer_message(db: Session, message: Message, entreprise: Entreprise) -> Message:
    """Envoie le message via le canal choisi et met à jour son statut en base.

    Utilise contenu_final s'il a été relu/modifié manuellement, sinon contenu_genere.
    """
    contenu_a_envoyer = message.contenu_final or message.contenu_genere

    try:
        if message.canal == CanalMessage.EMAIL:
            if not entreprise.email:
                raise ValueError("Cette entreprise n'a pas d'adresse email enregistrée")
            envoyer_email(
                destinataire_email=entreprise.email,
                sujet=f"Proposition de collaboration — {entreprise.nom}",
                contenu_html=_texte_vers_html(contenu_a_envoyer),
                contenu_texte=contenu_a_envoyer,
            )
        elif message.canal == CanalMessage.WHATSAPP:
            if not entreprise.whatsapp:
                raise ValueError("Cette entreprise n'a pas de numéro WhatsApp enregistré")
            envoyer_message_texte(entreprise.whatsapp, contenu_a_envoyer)
        else:
            raise ValueError(f"Canal non supporté : {message.canal}")

        message_service.marquer_comme_envoye(db, message)
        _mettre_a_jour_statut_entreprise(db, entreprise, StatutProspection.ENVOYE)

    except Exception as erreur:
        logger.error(f"Échec de l'envoi du message {message.id} : {erreur}")
        message_service.marquer_comme_echec(db, message)
        raise

    return message


def _mettre_a_jour_statut_entreprise(db: Session, entreprise: Entreprise, statut: StatutProspection) -> None:
    entreprise.statut = statut
    db.commit()


def _texte_vers_html(texte: str) -> str:
    """Conversion simple du texte brut en HTML (paragraphes séparés par des sauts de ligne)."""
    paragraphes = texte.strip().split("\n\n")
    return "".join(f"<p>{p.replace(chr(10), '<br>')}</p>" for p in paragraphes)
