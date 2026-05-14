from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.edicao import EdicaoResumo, EdicaoResponse
from app.database import crud
from app.database.database import get_db

router = APIRouter()


@router.get("/", response_model=List[EdicaoResumo])
async def listar_edicoes(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100, description="Máximo de registros retornados"),
    offset: int = Query(0, ge=0, description="Número de registros a pular"),
) -> List[EdicaoResumo]:
    """Retorna a timeline das últimas edições processadas."""
    return await crud.listar_edicoes(db, limit=limit, offset=offset)


@router.get("/data/{data}", response_model=EdicaoResponse)
async def buscar_edicao_por_data(
    data: date,
    db: AsyncSession = Depends(get_db),
) -> EdicaoResponse:
    """Busca uma edição pelo data de publicação (formato: YYYY-MM-DD)."""
    edicao = await crud.buscar_edicao_por_data(db, data)
    if not edicao:
        raise HTTPException(
            status_code=404, detail=f"Nenhuma edição encontrada para a data {data}"
        )
    return edicao


@router.get("/{id}", response_model=EdicaoResponse)
async def obter_edicao(
    id: int,
    db: AsyncSession = Depends(get_db),
) -> EdicaoResponse:
    """Retorna os detalhes completos de uma edição específica por ID."""
    edicao = await crud.buscar_edicao_por_id(db, id)
    if not edicao:
        raise HTTPException(status_code=404, detail="Edição não encontrada")
    return edicao
