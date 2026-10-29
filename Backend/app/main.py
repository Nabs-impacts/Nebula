import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, dashboard, entreprises, messages, notes, reponses, utilisateurs
from app.core.config import settings
from app.core.logging import configurer_logging, logger
from app.db.base import SessionLocal
from app.services.reception_service import verifier_nouvelles_reponses

configurer_logging()

_verrou_imap = asyncio.Lock()


async def _boucle_verification_imap():
    """Tâche de fond exécutant la relève IMAP périodique."""
    logger.info(
        f"Réception IMAP démarrée en tâche de fond (vérification toutes les {settings.imap_poll_minutes} min)"
    )
    # Pause initiale pour laisser l'application démarrer complètement
    await asyncio.sleep(5)
    while True:
        try:
            async with _verrou_imap:
                def _executer():
                    with SessionLocal() as db:
                        return verifier_nouvelles_reponses(db)

                await asyncio.to_thread(_executer)
        except asyncio.CancelledError:
            break
        except Exception as err:
            logger.error(f"Erreur lors du cycle de réception IMAP : {err}")

        try:
            await asyncio.sleep(max(1, settings.imap_poll_minutes) * 60)
        except asyncio.CancelledError:
            break


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Log clair au démarrage indiquant l'état IMAP (sans jamais exposer de mot de passe)
    imap_actif = bool(settings.imap_enabled and settings.imap_user and settings.imap_password)
    if imap_actif:
        logger.info(
            f"Réception IMAP : active (serveur={settings.imap_host}:{settings.imap_port}, "
            f"dossier={settings.imap_folder}, compte={settings.imap_user}, "
            f"intervalle={settings.imap_poll_minutes}m)"
        )
    else:
        raisons = []
        if not settings.imap_enabled:
            raisons.append("imap_enabled=False")
        if not settings.imap_user or not settings.imap_password:
            raisons.append("identifiants manquants")
        logger.info(f"Réception IMAP : désactivée ({', '.join(raisons)})")

    tache_fond = None
    if imap_actif:
        tache_fond = asyncio.create_task(_boucle_verification_imap())

    yield

    if tache_fond:
        tache_fond.cancel()
        try:
            await tache_fond
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="Nebula API",
    description="Panel de prospection B2B automatisé — entreprises, messages IA, envoi multicanal",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(entreprises.router)
app.include_router(messages.router)
app.include_router(utilisateurs.router)
app.include_router(dashboard.router)
app.include_router(notes.router)
app.include_router(reponses.router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "environment": settings.environment}
