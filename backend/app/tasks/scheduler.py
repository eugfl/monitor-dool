"""
Configuracao do agendador de tarefas (APScheduler AsyncIOScheduler).
"""
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from loguru import logger

from app.tasks.jobs import job_atualizar_estatisticas, job_coletar_hoje

scheduler = AsyncIOScheduler(
    timezone="America/Bahia",
    job_defaults={
        "coalesce": True,
        "max_instances": 1,
        "misfire_grace_time": 300,
    },
)


def configurar_jobs() -> None:
    """
    Registra todos os jobs no scheduler.
    Chamado automaticamente no startup da aplicacao.
    """
    scheduler.add_job(
        func=job_coletar_hoje,
        trigger=CronTrigger(hour=8, minute=0),
        id="coleta_diaria",
        name="Coletar edicao do dia",
        replace_existing=True,
    )
    logger.info("Job 'coleta_diaria' agendado para 08:00")

    scheduler.add_job(
        func=job_coletar_hoje,
        trigger=CronTrigger(hour=12, minute=0),
        id="coleta_diaria_backup",
        name="Coletar edicao do dia (backup)",
        replace_existing=True,
    )
    logger.info("Job 'coleta_diaria_backup' agendado para 12:00")

    scheduler.add_job(
        func=job_atualizar_estatisticas,
        trigger=IntervalTrigger(hours=6),
        id="atualizar_stats",
        name="Atualizar estatisticas",
        replace_existing=True,
    )
    logger.info("Job 'atualizar_stats' agendado a cada 6 horas")

    logger.info("Job 'limpeza_semanal' desabilitado por seguranca")


def iniciar_scheduler() -> None:
    """Inicia o scheduler se ainda nao estiver rodando."""
    if not scheduler.running:
        configurar_jobs()
        scheduler.start()
        logger.success("Scheduler iniciado com sucesso")
    else:
        logger.warning("Scheduler ja estava rodando")


def parar_scheduler() -> None:
    """Para o scheduler aguardando jobs em execucao."""
    if scheduler.running:
        scheduler.shutdown(wait=True)
        logger.info("Scheduler parado")


def listar_jobs() -> list:
    """
    Retorna lista de dicts com info dos jobs agendados.
    Usado pelo endpoint GET /api/v1/tasks/jobs.
    """
    jobs = scheduler.get_jobs()
    return [
        {
            "id": job.id,
            "name": job.name,
            "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
            "trigger": str(job.trigger),
        }
        for job in jobs
    ]


def executar_job_agora(job_id: str) -> bool:
    """
    Agenda execucao imediata de um job especifico.

    Returns:
        True se o job foi encontrado e agendado, False caso contrario.
    """
    job = scheduler.get_job(job_id)
    if not job:
        logger.error(f"Job '{job_id}' nao encontrado")
        return False

    scheduler.modify_job(
        job_id,
        next_run_time=datetime.now(tz=job.next_run_time.tzinfo if job.next_run_time else None),
    )
    logger.info(f"Job '{job_id}' agendado para execucao imediata")
    return True
