from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    """Classe de base pour tous les modèles SQLAlchemy de Nebula."""
    pass


engine = create_engine(settings.database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dépendance FastAPI fournissant une session DB par requête."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
