"""
Configuração do agendador de tarefas (APScheduler AsyncIOScheduler).
"""
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from loguru import logger

from app.tasks.jobs import job_coletar_hoje, job_atualizar_estatisticas

scheduler = AsyncIOScheduler(
    timezone="America/Bahia",
    job_defaults={
        "coalesce": True,
        "max_instances": 1,
        "misfire_grace_time": 300,  # Tolera até 5min de atraso
    },
)


def configurar_jobs() -> None:
    """
    Registra todos os jobs no scheduler.
    Chamado automaticamente no startup da aplicação.
    """

    # JOB 1: Coleta diária às 08:00 (horário em que o DOOL costuma publicar)
    scheduler.add_job(
        func=job_coletar_hoje,
        trigger=CronTrigger(hour=8, minute=0),
        id="coleta_diaria",
        name="Coletar edição do dia",
        replace_existing=True,
    )
    logger.info("✅ Job 'coleta_diaria' agendado para 08:00")

    # JOB 2: Coleta backup às 12:00 (caso a edição seja publicada tarde)
    scheduler.add_job(
        func=job_coletar_hoje,
        trigger=CronTrigger(hour=12, minute=0),
        id="coleta_diaria_backup",
        name="Coletar edição do dia (backup)",
        replace_existing=True,
    )
    logger.info("✅ Job 'coleta_diaria_backup' agendado para 12:00")

    # JOB 3: Atualizar estatísticas a cada 6 horas
    scheduler.add_job(
        func=job_atualizar_estatisticas,
        trigger=IntervalTrigger(hours=6),
        id="atualizar_stats",
        name="Atualizar estatísticas",
        replace_existing=True,
    )
    logger.info("✅ Job 'atualizar_stats' agendado a cada 6 horas")

    # JOB 4: Limpeza semanal(desabilitado por segurança — ativar manualmente se necessário)
    from app.tasks.jobs import limpar_dados_antigos
    scheduler.add_job(
        func=limpar_dados_antigos,
        trigger=CronTrigger(day_of_week="sun", hour=3, minute=0),
        id="limpeza_semanal",
        name="Limpar dados antigos",
        replace_existing=True,
    )
    logger.warning(
        "⚠️ Job 'limpeza_semanal' ativado (CUIDADO: deleta dados)")


def iniciar_scheduler() -> None:
    """Inicia o scheduler se ainda não estiver rodando."""
    if not scheduler.running:
        configurar_jobs()
        scheduler.start()
        logger.success("🚀 Scheduler iniciado com sucesso")
    else:
        logger.warning("⚠️ Scheduler já estava rodando")


def parar_scheduler() -> None:
    """Para o scheduler aguardando jobs em execução."""
    if scheduler.running:
        scheduler.shutdown(wait=True)
        logger.info("🛑 Scheduler parado")


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
    Agenda execução imediata de um job específico.
    Usa modify_job com next_run_time=now para acionar no próximo ciclo.

    Returns:
        True se o job foi encontrado e agendado, False caso contrário.
    """
    job = scheduler.get_job(job_id)
    if not job:
        logger.error(f"❌ Job '{job_id}' não encontrado")
        return False

    scheduler.modify_job(job_id, next_run_time=datetime.now(
        tz=job.next_run_time.tzinfo if job.next_run_time else None))
    logger.info(f"▶️ Job '{job_id}' agendado para execução imediata")
    return True
