from app.db.base import Base, engine

# Import explicite de tous les modèles pour qu'ils soient enregistrés
# sur Base.metadata avant la création des tables.
from app.models.entreprise import Entreprise  # noqa: F401
from app.models.utilisateur import Utilisateur  # noqa: F401
from app.models.message import Message  # noqa: F401


def init_db() -> None:
    """Crée toutes les tables si elles n'existent pas déjà.

    À utiliser uniquement en développement rapide.
    En production, préférer les migrations Alembic (alembic upgrade head).
    """
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Base de données initialisée.")
