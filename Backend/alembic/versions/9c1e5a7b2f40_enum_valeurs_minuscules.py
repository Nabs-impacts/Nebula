"""harmonisation des valeurs d'enum en minuscules

Revision ID: 9c1e5a7b2f40
Revises: 7b2f4c9a1d3e
Create Date: 2026-10-29 09:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9c1e5a7b2f40"
down_revision: Union[str, None] = "7b2f4c9a1d3e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


RENOMMAGES = {
    "type_entreprise_enum": [
        ("COMMERCE", "commerce"),
        ("RESTAURATION", "restauration"),
        ("SANTE", "sante"),
        ("EDUCATION", "education"),
        ("FINANCE", "finance"),
        ("AGRICULTURE", "agriculture"),
        ("TRANSPORT", "transport"),
        ("AUTRE", "autre"),
    ],
    "statut_prospection_enum": [
        ("NOUVEAU", "nouveau"),
        ("MESSAGE_GENERE", "message_genere"),
        ("ENVOYE", "envoye"),
        ("EN_ATTENTE_REPONSE", "en_attente_reponse"),
        ("REPONDU", "repondu"),
        ("RELANCE_ENVOYEE", "relance_envoyee"),
        ("CONVERTI", "converti"),
        ("PERDU", "perdu"),
    ],
    "canal_message_enum": [("EMAIL", "email"), ("WHATSAPP", "whatsapp")],
    "statut_envoi_enum": [
        ("EN_ATTENTE", "en_attente"),
        ("ENVOYE", "envoye"),
        ("ECHEC", "echec"),
    ],
}


def _labels(bind, nom_type: str) -> set[str]:
    resultat = bind.execute(
        sa.text(
            """
            SELECT e.enumlabel
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = :nom_type
            """
        ),
        {"nom_type": nom_type},
    )
    return {ligne[0] for ligne in resultat}


def _renommer(bind, nom_type: str, ancien: str, nouveau: str) -> None:
    labels = _labels(bind, nom_type)
    if ancien in labels and nouveau not in labels:
        bind.execute(sa.text(f'ALTER TYPE "{nom_type}" RENAME VALUE \'{ancien}\' TO \'{nouveau}\''))


def upgrade() -> None:
    bind = op.get_bind()
    for nom_type, paires in RENOMMAGES.items():
        for ancien, nouveau in paires:
            _renommer(bind, nom_type, ancien, nouveau)


def downgrade() -> None:
    bind = op.get_bind()
    for nom_type, paires in RENOMMAGES.items():
        for ancien, nouveau in paires:
            _renommer(bind, nom_type, nouveau, ancien)
