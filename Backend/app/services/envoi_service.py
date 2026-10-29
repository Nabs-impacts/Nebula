from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.integrations.email.brevo_client import envoyer_email
from app.integrations.email.template_email import construire_email
from app.integrations.whatsapp.meta_cloud_client import envoyer_message_texte
from app.models.entreprise import Entreprise, StatutProspection
from app.models.message import CanalMessage, Message
from app.services import message_service


def envoyer_message(db: Session, message: Message, entreprise: Entreprise) -> Message:
    """Envoie le message via le canal choisi et met à jour son statut en base.

    Utilise contenu_final s'il a été relu/modifié manuellement, sinon contenu_genere.
    """
    contenu_brut = message.contenu_final or message.contenu_genere
    sujet = message.sujet or f"Une idée pour {entreprise.nom}"

    try:
        if message.canal == CanalMessage.EMAIL:
            if not entreprise.email:
                raise ValueError("Cette entreprise n'a pas d'adresse email enregistrée")
            html_email, texte_email = construire_email(sujet=sujet, corps=contenu_brut)
            envoyer_email(
                destinataire_email=entreprise.email,
                sujet=sujet,
                contenu_html=html_email,
                contenu_texte=texte_email,
            )
        elif message.canal == CanalMessage.WHATSAPP:
            if not entreprise.whatsapp:
                raise ValueError("Cette entreprise n'a pas de numéro WhatsApp enregistré")
            envoyer_message_texte(entreprise.whatsapp, _avec_signature(contenu_brut))
        else:
            raise ValueError(f"Canal non supporté : {message.canal}")

        message_service.marquer_comme_envoye(db, message)
        statut = (
            StatutProspection.RELANCE_ENVOYEE if message.est_relance else StatutProspection.EN_ATTENTE_REPONSE
        )
        _mettre_a_jour_statut_entreprise(db, entreprise, statut)

    except Exception as erreur:
        logger.error(f"Échec de l'envoi du message {message.id} : {erreur}")
        message_service.marquer_comme_echec(db, message)
        raise

    return message


def _mettre_a_jour_statut_entreprise(db: Session, entreprise: Entreprise, statut: StatutProspection) -> None:
    entreprise.statut = statut
    db.commit()


def _avec_signature(texte: str) -> str:
    """Ajoute la signature Tenora si le modèle ne l'a pas déjà fait."""
    if "cordialement" in texte.lower() or settings.agence_nom.lower() in texte.lower():
        return texte

    signature = [
        "Cordialement,",
        settings.agence_signature,
        f"{settings.agence_telephone_1} · {settings.agence_telephone_2}",
        settings.agence_site_web,
    ]
    return f"{texte.rstrip()}\n\n" + "\n".join(signature)

