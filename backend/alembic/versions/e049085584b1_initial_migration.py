"""initial_migration

Revision ID: e049085584b1
Revises: 
Create Date: 2026-05-13 23:12:59.701085

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e049085584b1'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "edicoes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("numero", sa.Integer(), nullable=False),
        sa.Column("data", sa.Date(), nullable=False),
        sa.Column("tipo", sa.String(length=100), nullable=True),
        sa.Column("url_original", sa.String(length=500), nullable=True),
        sa.Column("hash_conteudo", sa.String(length=64), nullable=True),
        sa.Column("total_materias", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("hash_conteudo"),
    )
    op.create_index(op.f("ix_edicoes_data"), "edicoes", ["data"], unique=False)
    op.create_index(op.f("ix_edicoes_id"), "edicoes", ["id"], unique=False)

    op.create_table(
        "materias",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("edicao_id", sa.Integer(), nullable=True),
        sa.Column("materia_id_original", sa.String(length=100), nullable=True),
        sa.Column("titulo", sa.Text(), nullable=False),
        sa.Column("texto", sa.Text(), nullable=False),
        sa.Column("orgao", sa.String(length=200), nullable=True),
        sa.Column("tipo_documental", sa.String(length=100), nullable=True),
        sa.Column("entidades", sa.JSON(), nullable=True),
        sa.Column("url", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["edicao_id"], ["edicoes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_materias_edicao_id"), "materias", ["edicao_id"], unique=False)
    op.create_index(op.f("ix_materias_id"), "materias", ["id"], unique=False)
    op.create_index(op.f("ix_materias_materia_id_original"), "materias", ["materia_id_original"], unique=True)
    op.create_index(op.f("ix_materias_orgao"), "materias", ["orgao"], unique=False)
    op.create_index(op.f("ix_materias_tipo_documental"), "materias", ["tipo_documental"], unique=False)
    op.create_index("idx_materia_edicao_tipo", "materias", ["edicao_id", "tipo_documental"], unique=False)
    op.create_index("idx_materia_edicao_orgao", "materias", ["edicao_id", "orgao"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("idx_materia_edicao_orgao", table_name="materias")
    op.drop_index("idx_materia_edicao_tipo", table_name="materias")
    op.drop_index(op.f("ix_materias_tipo_documental"), table_name="materias")
    op.drop_index(op.f("ix_materias_orgao"), table_name="materias")
    op.drop_index(op.f("ix_materias_materia_id_original"), table_name="materias")
    op.drop_index(op.f("ix_materias_id"), table_name="materias")
    op.drop_index(op.f("ix_materias_edicao_id"), table_name="materias")
    op.drop_table("materias")
    op.drop_index(op.f("ix_edicoes_id"), table_name="edicoes")
    op.drop_index(op.f("ix_edicoes_data"), table_name="edicoes")
    op.drop_table("edicoes")
