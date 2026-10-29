"""creation table reponses recues et identifiant externe message

Revision ID: d4e5f6a7b8c9
Revises: 9c1e5a7b2f40
Create Date: 2026-10-29 11:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "9c1e5a7b2f40"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "reponses_recues",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("entreprise_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("message_id_imap", sa.String(length=255), nullable=False),
        sa.Column("expediteur", sa.String(length=255), nullable=False),
        sa.Column("objet", sa.String(length=500), nullable=True),
        sa.Column("extrait", sa.Text(), nullable=True),
        sa.Column("recu_le", sa.DateTime(timezone=True), nullable=False),
        sa.Column("lu", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["entreprise_id"], ["entreprises.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_reponses_recues_entreprise_id", "reponses_recues", ["entreprise_id"], unique=False)
    op.create_index("ix_reponses_recues_message_id_imap", "reponses_recues", ["message_id_imap"], unique=True)
    op.create_index("ix_reponses_recues_lu", "reponses_recues", ["lu"], unique=False)
    op.create_index("ix_reponses_recues_entreprise_id_recu_le", "reponses_recues", ["entreprise_id", "recu_le"], unique=False)

    op.add_column("messages", sa.Column("identifiant_externe", sa.String(length=255), nullable=True))
    op.create_index("ix_messages_identifiant_externe", "messages", ["identifiant_externe"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_messages_identifiant_externe", table_name="messages")
    op.drop_column("messages", "identifiant_externe")

    op.drop_index("ix_reponses_recues_entreprise_id_recu_le", table_name="reponses_recues")
    op.drop_index("ix_reponses_recues_lu", table_name="reponses_recues")
    op.drop_index("ix_reponses_recues_message_id_imap", table_name="reponses_recues")
    op.drop_index("ix_reponses_recues_entreprise_id", table_name="reponses_recues")
    op.drop_table("reponses_recues")
