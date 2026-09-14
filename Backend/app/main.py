from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import configurer_logging
from app.api.routes import auth, entreprises, messages, utilisateurs, dashboard

configurer_logging()

app = FastAPI(
    title="Nebula API",
    description="Panel de prospection B2B automatisé — entreprises, messages IA, envoi multicanal",
    version="0.1.0",
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


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "environment": settings.environment}
