from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class MateriaResumo(BaseModel):
    """Schema resumido de materia para listagem/timeline."""

    id: int = Field(..., description="ID interno da materia")
    materia_id_original: str = Field(..., description="ID original do DOOL")
    titulo: str = Field(..., description="Titulo da materia")
    orgao: Optional[str] = Field(None, description="Orgao publicador detectado")
    tipo_documental: str = Field(..., description="Tipo documental classificado")
    url: Optional[str] = Field(None, description="URL da materia no DOOL")
    edicao_data: Optional[date] = Field(None, description="Data de publicacao da edicao")
    edicao_numero: Optional[int] = Field(None, description="Numero da edicao no DOOL")
    created_at: datetime = Field(..., description="Data de processamento pelo sistema")

    model_config = {"from_attributes": True}


class MateriaResponse(MateriaResumo):
    """Schema completo de materia incluindo texto e entidades extraidas."""

    edicao_id: int = Field(..., description="ID da edicao a qual pertence")
    texto: str = Field(..., description="Texto completo da materia")
    conteudo_html: Optional[str] = Field(
        None, description="HTML preservado para exibicao rica da materia"
    )
    entidades: Optional[dict[str, Any]] = Field(
        None, description="Entidades extraidas (CPF, CNPJ, valores, etc.)"
    )
    pdf_disponivel: bool = Field(
        False, description="Indica se a materia possui arquivo PDF para download"
    )
    updated_at: Optional[datetime] = Field(None, description="Ultima atualizacao")

    model_config = {"from_attributes": True}


class FiltroOpcao(BaseModel):
    """Opcao normalizada para selects de filtro."""

    value: str = Field(..., description="Valor real enviado para a API")
    label: str = Field(..., description="Texto amigavel exibido na interface")


class MateriaFiltros(BaseModel):
    """Opcoes disponiveis para os filtros de materias."""

    orgaos: list[FiltroOpcao] = Field(default_factory=list)
    tipos: list[FiltroOpcao] = Field(default_factory=list)


class DashboardResumo(BaseModel):
    """Resumo consolidado para os cards principais da dashboard."""

    total_materias: int = Field(0, description="Total de materias processadas")
    total_edicoes: int = Field(0, description="Total de edicoes processadas")
    total_orgaos: int = Field(0, description="Total de orgaos identificados")
    ultima_edicao_data: Optional[date] = Field(None, description="Data da edicao mais recente")
    ultima_edicao_numero: Optional[int] = Field(None, description="Numero da edicao mais recente")
    ultima_coleta_em: Optional[datetime] = Field(
        None, description="Data/hora da ultima coleta registrada"
    )
