from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class EdicaoResumo(BaseModel):
    """Schema resumido de edição para listagem/timeline."""

    id: int = Field(..., description="ID interno da edição")
    numero: int = Field(..., description="Número da edição no DOOL")
    data: date = Field(..., description="Data de publicação")
    tipo: Optional[str] = Field(None, description="Tipo da edição (Executivo, Municipal, etc.)")
    total_materias: int = Field(0, description="Total de matérias processadas")
    created_at: datetime = Field(..., description="Data de processamento pelo sistema")

    model_config = {"from_attributes": True}


class EdicaoResponse(EdicaoResumo):
    """Schema completo de edição incluindo URL original."""

    url_original: Optional[str] = Field(None, description="URL do HTML original no DOOL")
    updated_at: Optional[datetime] = Field(None, description="Última atualização")

    model_config = {"from_attributes": True}
