# La configuration du moteur SQLAlchemy et de la session se trouve dans app/db/base.py
# (Base déclarative, engine, SessionLocal et get_db y sont définis ensemble).
# Ce fichier ne fait que ré-exporter pour permettre `from app.db.session import get_db`
# si vous préférez cet import ailleurs dans le code.

from app.db.base import engine, SessionLocal, get_db  # noqa: F401
