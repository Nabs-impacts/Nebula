import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.base import get_db
from app.models.message import StatutEnvoi
from app.schemas.message import MessageCreate, MessageGenerationRequest, MessageOut, MessageUpdate
from app.services import entreprise_service, generation_service, message_service, relance_service
from app.workers.tasks_envoi import tache_envoyer_message

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
# Envoi (tâche de fond FastAPI — aucun worker séparé à lancer)
# ------------------------------------------------------------------
#
# À faible volume, l'envoi tourne en BackgroundTasks : dans le même
# processus qu'uvicorn, sans infra supplémentaire. Si le volume augmente
# un jour et qu'il faut des retries robustes / plusieurs workers, la
# tâche `tache_envoyer_message` (app/workers/tasks_envoi.py) et le worker
# RQ (app/workers/worker.py) sont déjà prêts : il suffira de remplacer
# `background_tasks.add_task(...)` ci-dessous par `queue_envois.enqueue(...)`.

@router.post("/{message_id}/envoyer", status_code=status.HTTP_202_ACCEPTED)
def envoyer_message(
    message_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _utilisateur=Depends(get_current_user),
):
    """Déclenche l'envoi du message (email ou WhatsApp selon son canal) en
    tâche de fond. Aucun processus supplémentaire à lancer : uvicorn suffit.

    Retourne 202 immédiatement ; l'envoi effectif se fait juste après la
    réponse HTTP. Consulter GET /api/messages/{id} pour connaître le
    statut_envoi final (ENVOYE ou ECHEC).
    """
    message = message_service.obtenir_message(db, message_id)
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message introuvable")

    if message.statut_envoi == StatutEnvoi.ENVOYE:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ce message a déjà été envoyé")

    entreprise = entreprise_service.obtenir_entreprise(db, message.entreprise_id)
    if entreprise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entreprise introuvable")

    if not entreprise.email and not entreprise.whatsapp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette entreprise n'a ni email ni numéro WhatsApp enregistré",
        )

    background_tasks.add_task(tache_envoyer_message, str(message.id))

    return {"detail": "Envoi du message lancé en tâche de fond"}
