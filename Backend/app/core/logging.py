import logging
import sys

from app.core.config import settings


def configurer_logging() -> None:
    """Configure le logging de base de l'application.

    Niveau DEBUG en développement, INFO en production.
    """
    niveau = logging.DEBUG if settings.environment == "development" else logging.INFO

    logging.basicConfig(
        level=niveau,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    # Réduit le bruit des librairies tierces trop verbeuses
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


logger = logging.getLogger("nebula")
