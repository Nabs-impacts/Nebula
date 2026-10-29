"""enrichissement prospects, messages et notes

Revision ID: 7b2f4c9a1d3e
Revises: 095a6ce51df0
Create Date: 2026-10-29 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "7b2f4c9a1d3e"
down_revision: Union[str, None] = "095a6ce51df0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    presence_web = postgresql.ENUM(
        "aucun_site", "site_existant", "inconnu", name="presence_web_enum"
    )
    priorite = postgresql.ENUM("basse", "normale", "haute", name="priorite_prospection_enum")
    presence_web.create(bind, checkfirst=True)
    priorite.create(bind, checkfirst=True)

    op.add_column("entreprises", sa.Column("contact_nom", sa.String(length=255), nullable=True))
    op.add_column("entreprises", sa.Column("ville", sa.String(length=120), nullable=True))
    op.add_column("entreprises", sa.Column("site_web", sa.String(length=500), nullable=True))
    op.add_column(
        "entreprises",
        sa.Column("presence_web", presence_web, nullable=False, server_default="inconnu"),
    )
    op.add_column("entreprises", sa.Column("note_google", sa.Float(), nullable=True))
    op.add_column("entreprises", sa.Column("autres_observations", sa.Text(), nullable=True))
    op.add_column(
        "entreprises",
        sa.Column("priorite", priorite, nullable=False, server_default="normale"),
    )
    op.add_column(
        "entreprises",
        sa.Column(
            "tags",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default=sa.text("'{}'::varchar[]"),
        ),
    )

    op.add_column("messages", sa.Column("sujet", sa.String(length=255), nullable=True))
    op.add_column("messages", sa.Column("angle", sa.Text(), nullable=True))

    op.create_table(
        "notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("entreprise_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("auteur_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("contenu", sa.Text(), nullable=False),
        sa.Column(
            "date_creation",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["auteur_id"], ["utilisateurs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["entreprise_id"], ["entreprises.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("notes")
    op.drop_column("messages", "angle")
    op.drop_column("messages", "sujet")
    op.drop_column("entreprises", "tags")
    op.drop_column("entreprises", "priorite")
    op.drop_column("entreprises", "autres_observations")
    op.drop_column("entreprises", "note_google")
    op.drop_column("entreprises", "presence_web")
    op.drop_column("entreprises", "site_web")
    op.drop_column("entreprises", "ville")
    op.drop_column("entreprises", "contact_nom")

    bind = op.get_bind()
    postgresql.ENUM(name="priorite_prospection_enum").drop(bind, checkfirst=True)
    postgresql.ENUM(name="presence_web_enum").drop(bind, checkfirst=True)
