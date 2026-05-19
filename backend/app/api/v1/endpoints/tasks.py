import asyncio
from datetime import date, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from loguru import logger

from app.core.security import require_admin_api_key
from app.services.pipeline import PipelineService
from app.tasks.scheduler import executar_job_agora, listar_jobs
from app.tasks.status import (
    CollectionStatus,
    create_collection_status,
    get_collection_status,
    get_latest_collection_status,
    mark_collection_finished,
    mark_collection_running,
)

router = APIRouter()

JOBS_PERMITIDOS = {"coleta_diaria", "coleta_diaria_backup", "atualizar_stats"}


@router.get("/jobs", tags=["Tasks"])
async def get_jobs() -> list[dict[str, Any]]:
    """Lista todos os jobs agendados com proxima execucao."""
    return listar_jobs()


@router.post("/jobs/{job_id}/run", tags=["Tasks"], dependencies=[Depends(require_admin_api_key)])
async def run_job_now(job_id: str) -> dict[str, str]:
    """
    Agenda execucao imediata de um job pelo ID.
    IDs disponiveis: coleta_diaria, coleta_diaria_backup, atualizar_stats
    """
    if job_id not in JOBS_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Job '{job_id}' invalido. Disponiveis: {sorted(JOBS_PERMITIDOS)}",
        )

    sucesso = executar_job_agora(job_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' nao encontrado no scheduler")

    return {"message": f"Job '{job_id}' agendado para execucao imediata"}


@router.get("/coleta/status/{job_id}", tags=["Tasks"])
async def obter_status_coleta(job_id: str) -> CollectionStatus:
    """Consulta o status de uma coleta pelo job_id retornado no disparo."""
    status = get_collection_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Status de coleta nao encontrado.")
    return status


@router.get("/coleta/status", tags=["Tasks"])
async def obter_ultimo_status_coleta(
    data: date = Query(..., description="Data inicial da coleta"),
    data_fim: date | None = Query(None, description="Data final da coleta em lote"),
) -> CollectionStatus:
    """Consulta o status mais recente para uma data ou periodo."""
    status = get_latest_collection_status(data, data_fim)
    if not status:
        raise HTTPException(status_code=404, detail="Nenhuma coleta encontrada para esse periodo.")
    return status


@router.post("/coleta/{data}", tags=["Tasks"], dependencies=[Depends(require_admin_api_key)])
async def disparar_coleta_data(data: date, data_fim: date | None = Query(None)) -> CollectionStatus:
    """
    Dispara a coleta/pipeline para uma data especifica ou um intervalo.
    Limites: maximo de 1 ano atras, sem datas futuras e intervalo maximo de 31 dias.
    """
    _validar_periodo_coleta(data, data_fim)

    status = create_collection_status(data, data_fim)
    asyncio.create_task(_executar_coleta_com_status(status["job_id"], data, data_fim))
    return status


def _validar_periodo_coleta(data: date, data_fim: date | None) -> None:
    hoje = date.today()
    um_ano_atras = hoje - timedelta(days=365)

    if data > hoje or (data_fim and data_fim > hoje):
        raise HTTPException(
            status_code=400,
            detail="Nao e possivel coletar edicoes de datas futuras.",
        )

    if data < um_ano_atras:
        raise HTTPException(
            status_code=400,
            detail="Limite de historico atingido. O sistema permite coleta de ate 1 ano atras.",
        )

    if not data_fim:
        return

    if data_fim < data:
        raise HTTPException(status_code=400, detail="Data fim nao pode ser anterior a data de inicio.")

    if (data_fim - data).days > 31:
        raise HTTPException(
            status_code=400,
            detail="O intervalo maximo permitido para coleta em lote e de 31 dias.",
        )


async def _executar_coleta_com_status(job_id: str, data: date, data_fim: date | None) -> None:
    mark_collection_running(job_id)

    try:
        service = PipelineService()

        if data_fim:
            await _executar_intervalo(service, data, data_fim)
            mark_collection_finished(
                job_id,
                "success",
                f"Coleta em lote de {data} ate {data_fim} concluida.",
            )
            return

        result = await service.processar_dia(data.isoformat())
        status_value = str(result["status"])
        mark_collection_finished(job_id, status_value, str(result["message"]))
    except Exception as exc:
        logger.exception(f"Erro na coleta {job_id}: {exc}")
        mark_collection_finished(job_id, "failed", "A coleta falhou. Verifique os logs do backend.")


async def _executar_intervalo(service: PipelineService, data_inicio: date, data_fim: date) -> None:
    data_atual = data_inicio
    while data_atual <= data_fim:
        await service.processar_dia(data_atual.isoformat())
        data_atual += timedelta(days=1)
        await asyncio.sleep(2)
