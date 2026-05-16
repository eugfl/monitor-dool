import asyncio
from datetime import date, timedelta
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.tasks.scheduler import executar_job_agora, listar_jobs
from app.tasks.jobs import coletar_edicao_data_especifica, coletar_intervalo_datas

router = APIRouter()

JOBS_PERMITIDOS = {"coleta_diaria", "coleta_diaria_backup", "atualizar_stats"}


@router.get("/jobs", tags=["Tasks"])
async def get_jobs() -> list[dict[str, Any]]:
    """Lista todos os jobs agendados com próxima execução."""
    return listar_jobs()


@router.post("/jobs/{job_id}/run", tags=["Tasks"])
async def run_job_now(job_id: str) -> dict[str, str]:
    """
    Agenda execução imediata de um job pelo ID.
    IDs disponíveis: coleta_diaria, coleta_diaria_backup, atualizar_stats
    """
    if job_id not in JOBS_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Job '{job_id}' inválido. Disponíveis: {sorted(JOBS_PERMITIDOS)}",
        )

    sucesso = executar_job_agora(job_id)
    if not sucesso:
        raise HTTPException(
            status_code=404, detail=f"Job '{job_id}' não encontrado no scheduler")

    return {"message": f"Job '{job_id}' agendado para execução imediata"}


@router.post("/coleta/{data}", tags=["Tasks"])
async def disparar_coleta_data(data: date, data_fim: date | None = Query(None)) -> dict[str, str]:
    """
    Dispara a coleta/pipeline para uma data específica ou um intervalo.
    Limites: Máximo de 1 ano atrás, não permite datas futuras. Intervalo máximo de 31 dias.
    """
    hoje = date.today()
    um_ano_atras = hoje - timedelta(days=365)

    if data > hoje or (data_fim and data_fim > hoje):
        raise HTTPException(
            status_code=400,
            detail="Não é possível coletar edições de datas futuras."
        )

    if data < um_ano_atras:
        raise HTTPException(
            status_code=400,
            detail="Limite de histórico atingido. O sistema permite coleta de até 1 ano atrás."
        )

    if data_fim:
        if data_fim < data:
            raise HTTPException(
                status_code=400, detail="Data fim não pode ser anterior à data de início.")
        if (data_fim - data).days > 31:
            raise HTTPException(
                status_code=400, detail="O intervalo máximo permitido para coleta em lote é de 31 dias.")

        asyncio.create_task(coletar_intervalo_datas(data, data_fim))
        return {
            "message": f"Coleta em lote de {data} até {data_fim} iniciada em segundo plano.",
            "status": "processing"
        }
    else:
        # Aviso opcional para fins de semana
        is_weekend = data.weekday() >= 5
        msg_weekend = " (Nota: Fins de semana geralmente não possuem publicações regulares)" if is_weekend else ""

        asyncio.create_task(coletar_edicao_data_especifica(data))
        return {
            "message": f"Coleta para a data {data} iniciada em segundo plano.{msg_weekend}",
            "status": "processing"
        }
