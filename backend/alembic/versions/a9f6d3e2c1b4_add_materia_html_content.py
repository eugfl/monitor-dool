"""add_materia_html_content

Revision ID: a9f6d3e2c1b4
Revises: 530b50947528
Create Date: 2026-05-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a9f6d3e2c1b4"
down_revision: Union[str, Sequence[str], None] = "530b50947528"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("materias", sa.Column("conteudo_html", sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("materias", "conteudo_html")
