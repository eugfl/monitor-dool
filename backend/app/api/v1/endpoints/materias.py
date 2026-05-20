from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.materia import (
    DashboardResumo,
    MateriaFiltros,
    MateriaResponse,
    MateriaResumo,
)
from app.core.config import settings
from app.database import crud
from app.database.database import get_db

router = APIRouter()

PDF_MARKERS = (b"%PDF-", b"endobj", b"xref", b"trailer", b"startxref", b"%%EOF")


def _parece_pdf(content: bytes, content_type: str = "") -> bool:
    sample = content[:5000]
    marker_count = sum(1 for marker in PDF_MARKERS if marker.lower() in sample.lower())
    return (
        "application/pdf" in content_type.lower()
        or sample.lstrip().startswith(b"%PDF-")
        or marker_count >= 3
    )


def _pdf_filename(materia_id: int, materia_id_original: str) -> str:
    safe_original_id = "".join(
        char if char.isalnum() or char in {"-", "_"} else "-"
        for char in materia_id_original
    ).strip("-")
    return f"materia-{safe_original_id or materia_id}.pdf"


@router.get("/", response_model=List[MateriaResumo])
async def listar_materias(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100, description="Maximo de registros retornados"),
    offset: int = Query(0, ge=0, description="Numero de registros a pular"),
) -> List[MateriaResumo]:
    """Feed de materias em ordem cronologica reversa."""
    return await crud.buscar_materias(db, limit=limit, offset=offset)


@router.get("/search/", response_model=List[MateriaResumo])
async def pesquisar_materias(
    q: Optional[str] = Query(None, description="Busca textual em titulo e conteudo"),
    orgao: Optional[str] = Query(None, description="Filtrar por orgao parcial"),
    tipo_documental: Optional[str] = Query(None, description="Filtrar por tipo documental exato"),
    data_inicio: Optional[date] = Query(None, description="Data inicial do periodo YYYY-MM-DD"),
    data_fim: Optional[date] = Query(None, description="Data final do periodo YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100, description="Maximo de registros retornados"),
    offset: int = Query(0, ge=0, description="Numero de registros a pular"),
) -> List[MateriaResumo]:
    """Busca avancada com filtros combinados por texto, tipo documental e periodo."""
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
    """Opcoes enxutas para filtros de materias."""
    return await crud.obter_opcoes_filtros(db)


@router.get("/{id}", response_model=MateriaResponse)
async def obter_materia(
    id: int,
    db: AsyncSession = Depends(get_db),
) -> MateriaResponse:
    """Visualizar materia completa com texto integral e entidades extraidas."""
    materia = await crud.buscar_materia_por_id(db, id)
    if not materia:
        raise HTTPException(status_code=404, detail="Materia nao encontrada")
    return materia


@router.get("/{id}/pdf")
async def baixar_pdf_materia(
    id: int,
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Baixar PDF original da materia quando o DOOL disponibiliza arquivo."""
    materia = await crud.buscar_materia_por_id(db, id)
    if not materia:
        raise HTTPException(status_code=404, detail="Materia nao encontrada")

    if not materia.url:
        raise HTTPException(status_code=404, detail="PDF nao disponivel para esta materia")

    try:
        async with httpx.AsyncClient(
            verify=False,
            follow_redirects=True,
            timeout=settings.dool_timeout,
            headers={"User-Agent": settings.user_agent},
        ) as client:
            response = await client.get(materia.url)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail="Nao foi possivel baixar o PDF original no DOOL",
        ) from exc

    content_type = response.headers.get("content-type", "")
    if not _parece_pdf(response.content, content_type):
        raise HTTPException(status_code=404, detail="PDF nao disponivel para esta materia")

    filename = _pdf_filename(materia.id, materia.materia_id_original)
    return Response(
        content=response.content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
