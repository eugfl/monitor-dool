from typing import Any

from fastapi import APIRouter, HTTPException

from app.tasks.scheduler import executar_job_agora, listar_jobs

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
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' não encontrado no scheduler")

    return {"message": f"Job '{job_id}' agendado para execução imediata"}
