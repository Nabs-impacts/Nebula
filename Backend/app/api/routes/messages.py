import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.base import get_db
from app.integrations.email.brevo_client import ErreurEnvoiEmail
from app.integrations.email.template_email import construire_email
from app.models.message import CanalMessage, StatutEnvoi
from app.schemas.message import (
    MessageCreate,
    MessageGenerationRequest,
    MessageOut,
    MessageUpdate,
)
from app.services import (
    entreprise_service,
    envoi_service,
    generation_service,
    message_service,
    relance_service,
)

router = APIRouter(prefix="/api/messages", tags=["messages"])


# ------------------------------------------------------------------
# CRUD de base
# ------------------------------------------------------------------

@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def creer_message(
    donnees: MessageCreate,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    return message_service.creer_message(db, donnees)


@router.get("/entreprise/{entreprise_id}", response_model=list[MessageOut])
def lister_messages_par_entreprise(
    entreprise_id: uuid.UUID,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    return message_service.lister_messages_par_entreprise(db, entreprise_id)


@router.get("/{message_id}", response_model=MessageOut)
def obtenir_message(
    message_id: uuid.UUID,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    message = message_service.obtenir_message(db, message_id)
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message introuvable")
    return message


@router.get("/{message_id}/apercu-email")
def apercu_email(
    message_id: uuid.UUID,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    """Renvoie le HTML rendu de l'email (même template que l'envoi Brevo)."""
    message = message_service.obtenir_message(db, message_id)
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message introuvable")
    if message.canal != CanalMessage.EMAIL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'aperçu email n'est disponible que pour le canal email",
        )

    entreprise = entreprise_service.obtenir_entreprise(db, message.entreprise_id)
    if entreprise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entreprise introuvable")

    sujet = message.sujet or f"Une idée pour {entreprise.nom}"
    html_email, texte_email = construire_email(
        sujet=sujet, corps=message.contenu_final or message.contenu_genere
    )
    return {"sujet": sujet, "html": html_email, "texte": texte_email}


@router.patch("/{message_id}", response_model=MessageOut)
def mettre_a_jour_message(
    message_id: uuid.UUID,
    donnees: MessageUpdate,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    """Utilisé notamment pour enregistrer contenu_final après relecture manuelle
    du message généré par l'IA, avant envoi (validation humaine)."""
    message = message_service.obtenir_message(db, message_id)
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message introuvable")
    return message_service.mettre_a_jour_message(db, message, donnees)


# ------------------------------------------------------------------
# Génération IA
# ------------------------------------------------------------------

@router.post("/generer", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def generer_message(
    requete: MessageGenerationRequest,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    """Génère une proposition/demande d'audition personnalisée via l'IA (Groq,
    repli Mistral) et l'enregistre en base avec statut_envoi = EN_ATTENTE.
    Le message n'est PAS envoyé automatiquement : à relire/valider via
    PATCH /api/messages/{id} avant d'appeler POST /api/messages/{id}/envoyer.
    """
    try:
        return generation_service.generer_et_enregistrer_message(db, requete)
    except ValueError as erreur:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erreur))
    except Exception as erreur:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Échec de la génération IA (Groq et Mistral indisponibles) : {erreur}",
        )


@router.post("/relance/{entreprise_id}", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def generer_relance_manuelle(
    entreprise_id: uuid.UUID,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    """Génère manuellement une relance pour une entreprise déjà contactée,
    sans attendre la tâche planifiée automatique (tasks_relance.py)."""
    entreprise = entreprise_service.obtenir_entreprise(db, entreprise_id)
    if entreprise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entreprise introuvable")

    message_relance = relance_service.generer_relance_pour_entreprise(db, entreprise)
    if message_relance is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun message précédent trouvé pour générer une relance",
        )
    return message_relance


# ------------------------------------------------------------------
# Envoi synchrone : l'erreur du fournisseur remonte à l'interface.
# ------------------------------------------------------------------
#
# À faible volume, l'envoi est fait directement dans la requête pour que
# l'utilisateur ait un retour fiable (succès ou échec) et un toast d'erreur.
# Si le volume augmente, `tache_envoyer_message` (app/workers/tasks_envoi.py)
# et le worker RQ restent disponibles pour passer en asynchrone avec polling.

@router.post("/{message_id}/envoyer", response_model=MessageOut)
def envoyer_message(
    message_id: uuid.UUID,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    """Envoie le message et retourne son état final (ENVOYE ou ECHEC).

    L'erreur du fournisseur (Brevo/WhatsApp) est renvoyée en 502 avec un
    message lisible, afin que le frontend puisse afficher une notification.
    """
    message = message_service.obtenir_message(db, message_id)
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message introuvable")

    if message.statut_envoi == StatutEnvoi.ENVOYE:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ce message a déjà été envoyé")

    entreprise = entreprise_service.obtenir_entreprise(db, message.entreprise_id)
    if entreprise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entreprise introuvable")

    if message.canal == CanalMessage.EMAIL and not entreprise.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette entreprise n'a pas d'adresse email enregistrée",
        )
    if message.canal == CanalMessage.WHATSAPP and not entreprise.whatsapp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette entreprise n'a pas de numéro WhatsApp enregistré",
        )

    try:
        envoi_service.envoyer_message(db, message, entreprise)
    except ErreurEnvoiEmail as erreur:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=erreur.message_utilisateur,
        ) from erreur
    except Exception as erreur:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Échec de l'envoi : {erreur}",
        ) from erreur

    return message
