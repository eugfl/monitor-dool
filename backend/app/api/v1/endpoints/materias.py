from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.materia import (
    DashboardResumo,
    EstatisticaItem,
    MateriaFiltros,
    MateriaResponse,
    MateriaResumo,
)
from app.database import crud
from app.database.database import get_db

router = APIRouter()


@router.get("/", response_model=List[MateriaResumo])
async def listar_materias(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100, description="Máximo de registros retornados"),
    offset: int = Query(0, ge=0, description="Número de registros a pular"),
) -> List[MateriaResumo]:
    """Feed de matérias — últimas publicações em ordem cronológica reversa."""
    return await crud.buscar_materias(db, limit=limit, offset=offset)


@router.get("/search/", response_model=List[MateriaResumo])
async def pesquisar_materias(
    q: Optional[str] = Query(None, description="Busca textual em título e conteúdo"),
    orgao: Optional[str] = Query(None, description="Filtrar por órgão (parcial)"),
    tipo_documental: Optional[str] = Query(None, description="Filtrar por tipo documental exato"),
    data_inicio: Optional[date] = Query(None, description="Data inicial do período (YYYY-MM-DD)"),
    data_fim: Optional[date] = Query(None, description="Data final do período (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100, description="Máximo de registros retornados"),
    offset: int = Query(0, ge=0, description="Número de registros a pular"),
) -> List[MateriaResumo]:
    """Busca avançada com filtros combinados por órgão, tipo documental e período."""
    return await crud.buscar_materias(
        db,
        q=q,
        orgao=orgao,
        tipo_documental=tipo_documental,
        data_inicio=data_inicio,
        data_fim=data_fim,
        limit=limit,
        offset=offset,
    )


@router.get("/estatisticas/tipos", response_model=List[EstatisticaItem])
async def estatisticas_por_tipo(
    db: AsyncSession = Depends(get_db),
) -> List[EstatisticaItem]:
    """Insights: distribuição de matérias por tipo documental."""
    return await crud.obter_estatisticas_tipos(db)


@router.get("/estatisticas/orgaos", response_model=List[EstatisticaItem])
async def estatisticas_por_orgao(
    limit: int = Query(10, ge=1, le=50, description="Top N órgãos a retornar"),
    db: AsyncSession = Depends(get_db),
) -> List[EstatisticaItem]:
    """Insights: top órgãos que mais publicam no DOOL."""
    return await crud.obter_estatisticas_orgaos(db, limit=limit)


@router.get("/estatisticas/resumo", response_model=DashboardResumo)
async def resumo_dashboard(
    db: AsyncSession = Depends(get_db),
) -> DashboardResumo:
    """Resumo consolidado para os cards principais da dashboard."""
    return await crud.obter_resumo_dashboard(db)


@router.get("/filtros", response_model=MateriaFiltros)
async def filtros_materias(
    db: AsyncSession = Depends(get_db),
) -> MateriaFiltros:
    """Opcoes normalizadas para filtros de materias."""
    return await crud.obter_opcoes_filtros(db)


@router.get("/{id}", response_model=MateriaResponse)
async def obter_materia(
    id: int,
    db: AsyncSession = Depends(get_db),
) -> MateriaResponse:
    """Visualizar matéria completa com texto integral e entidades extraídas."""
    materia = await crud.buscar_materia_por_id(db, id)
    if not materia:
        raise HTTPException(status_code=404, detail="Matéria não encontrada")
    return materia
