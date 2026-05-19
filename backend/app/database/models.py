from sqlalchemy import Index, Column, Integer, String, Date, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR

Base = declarative_base()


class Edicao(Base):
    """Edição do Diário Oficial"""

    __tablename__ = "edicoes"

    id = Column(Integer, primary_key=True, index=True)

    # Identificação da edição
    numero = Column(Integer, nullable=False)
    data = Column(Date, nullable=False, index=True)
    tipo = Column(String(100))  # Ex: "Executivo", "Municipal"

    # URLs e metadados
    url_original = Column(String(500))
    hash_conteudo = Column(String(64), unique=True)  # SHA256 do HTML

    # Estatísticas
    total_materias = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relacionamento
    materias = relationship(
        "Materia", back_populates="edicao", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Edicao(id={self.id}, data={self.data}, numero={self.numero})>"


class Materia(Base):
    """Matéria/Publicação do diário oficial"""

    __tablename__ = "materias"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign Key
    edicao_id = Column(
        Integer, ForeignKey("edicoes.id", ondelete="CASCADE"), index=True
    )

    # Identificação original
    materia_id_original = Column(
        String(100), unique=True, index=True
    )  # ID do DOOL

    # Conteúdo
    titulo = Column(Text, nullable=False)
    texto = Column(Text, nullable=False)
    conteudo_html = Column(Text)

    # Metadados extraídos
    orgao = Column(String(200), index=True)
    tipo_documental = Column(String(100), index=True)

    # Entidades extraídas (JSONB para performance em queries)
    entidades = Column(JSONB)

    # Coluna para busca Full-Text (Português)
    search_vector = Column(TSVECTOR)

    # URL original
    url = Column(String(500))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relacionamento
    edicao = relationship("Edicao", back_populates="materias")

    @property
    def edicao_data(self):
        return self.edicao.data if self.edicao else None

    @property
    def edicao_numero(self):
        return self.edicao.numero if self.edicao else None

    __table_args__ = (
        Index("idx_materia_edicao_tipo", "edicao_id", "tipo_documental"),
        Index("idx_materia_edicao_orgao", "edicao_id", "orgao"),
        Index(
            "idx_materia_search_vector",
            "search_vector",
            postgresql_using="gin",
        ),
    )

    def __repr__(self) -> str:
        return f"<Materia(id={self.id}, tipo={self.tipo_documental}, orgao={self.orgao})>"
