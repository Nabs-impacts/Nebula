"""message source generation et prototypes optionnels

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-10-29 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Colonne source_generation sur messages
    op.add_column("messages", sa.Column("source_generation", sa.String(length=50), nullable=True))
    op.create_index("ix_messages_source_generation", "messages", ["source_generation"], unique=False)

    # 2. Rendre prototype_a_presenter et description_prototype optionnels sur entreprises
    op.alter_column("entreprises", "prototype_a_presenter", existing_type=sa.String(length=255), nullable=True)
    op.alter_column("entreprises", "description_prototype", existing_type=sa.Text(), nullable=True)


def downgrade() -> None:
    op.alter_column("entreprises", "description_prototype", existing_type=sa.Text(), nullable=False)
    op.alter_column("entreprises", "prototype_a_presenter", existing_type=sa.String(length=255), nullable=False)

    op.drop_index("ix_messages_source_generation", table_name="messages")
    op.drop_column("messages", "source_generation")
