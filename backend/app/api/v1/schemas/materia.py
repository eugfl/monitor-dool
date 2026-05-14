from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class MateriaResumo(BaseModel):
    """Schema resumido de matéria para listagem/timeline (sem texto completo)."""

    id: int = Field(..., description="ID interno da matéria")
    materia_id_original: str = Field(..., description="ID original do DOOL")
    titulo: str = Field(..., description="Título da matéria")
    orgao: Optional[str] = Field(None, description="Órgão publicador detectado")
    tipo_documental: str = Field(..., description="Tipo documental classificado")
    url: Optional[str] = Field(None, description="URL da matéria no DOOL")
    created_at: datetime = Field(..., description="Data de processamento pelo sistema")

    model_config = {"from_attributes": True}


class MateriaResponse(MateriaResumo):
    """Schema completo de matéria incluindo texto e entidades extraídas."""

    edicao_id: int = Field(..., description="ID da edição à qual pertence")
    texto: str = Field(..., description="Texto completo da matéria")
    entidades: Optional[dict[str, Any]] = Field(
        None, description="Entidades extraídas (CPF, CNPJ, valores, etc.)"
    )
    updated_at: Optional[datetime] = Field(None, description="Última atualização")

    model_config = {"from_attributes": True}


class EstatisticaItem(BaseModel):
    """Item de estatística agregada (label + contagem)."""

    label: Optional[str] = Field(None, description="Nome do grupo (tipo ou órgão)")
    value: int = Field(..., description="Contagem de matérias")
