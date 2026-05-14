"""
Jobs agendados para execução automática.
"""
from datetime import date, timedelta
from loguru import logger

from app.database.database import AsyncSessionLocal
from app.services.pipeline import PipelineService
from app.core.config import settings


# =========================================================
# JOB PRINCIPAL: COLETA DIÁRIA
# =========================================================

async def coletar_edicao_hoje() -> None:
    """
    Coleta a edição do DOOL da data atual.
    Executado automaticamente todos os dias (08:00 e 12:00).
    """
    try:
        data_hoje = date.today()
        logger.info(f"🤖 [JOB] Iniciando coleta automática para {data_hoje}")

        service = PipelineService()
        await service.processar_dia(str(data_hoje))

        logger.success(f"✅ [JOB] Coleta de {data_hoje} concluída")

    except Exception as e:
        logger.error(f"❌ [JOB] Erro na coleta automática: {e}")
        logger.exception(e)
        raise


# =========================================================
# JOB: COLETA DE DATA ESPECÍFICA
# =========================================================

async def coletar_edicao_data_especifica(data: date) -> None:
    """
    Coleta edição de uma data específica.
    Útil para reprocessamento ou coleta retroativa.

    Args:
        data: Data da edição a coletar (objeto date)
    """
    try:
        logger.info(f"🤖 [JOB] Iniciando coleta para data específica: {data}")

        service = PipelineService()
        await service.processar_dia(str(data))

        logger.success(f"✅ [JOB] Coleta de {data} concluída")

    except Exception as e:
        logger.error(f"❌ [JOB] Erro ao coletar {data}: {e}")
        raise


# =========================================================
# JOB: COLETA EM LOTE (INTERVALO DE DATAS)
# =========================================================

async def coletar_intervalo_datas(data_inicio: date, data_fim: date) -> None:
    """
    Coleta edições de um intervalo de datas sequencialmente.
    Útil para popular o banco com dados históricos.

    Args:
        data_inicio: Data inicial (inclusive)
        data_fim: Data final (inclusive)
    """
    import asyncio

    logger.info(
        f"🤖 [JOB] Iniciando coleta em lote: {data_inicio} até {data_fim}")

    data_atual = data_inicio
    total_sucesso = 0
    total_erro = 0

    while data_atual <= data_fim:
        try:
            await coletar_edicao_data_especifica(data_atual)
            total_sucesso += 1
        except Exception as e:
            logger.error(f"❌ Erro ao processar {data_atual}: {e}")
            total_erro += 1

        data_atual += timedelta(days=1)
        # Delay entre requisições (respeitar rate limit do DOOL)
        await asyncio.sleep(2)

    logger.success(
        f"✅ [JOB] Coleta em lote concluída: "
        f"{total_sucesso} sucessos, {total_erro} erros"
    )


# =========================================================
# JOB: ATUALIZAR ESTATÍSTICAS
# =========================================================

async def atualizar_estatisticas() -> None:
    """
    Atualiza e loga estatísticas agregadas do banco.
    Executado periodicamente (a cada 6 horas).
    """
    try:
        from sqlalchemy import select, func
        from app.database.models import Materia, Edicao

        logger.info("📊 [JOB] Atualizando estatísticas...")

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(func.count(Materia.id)))
            total_materias = result.scalar()

            result = await db.execute(select(func.count(Edicao.id)))
            total_edicoes = result.scalar()

            result = await db.execute(
                select(Materia.tipo_documental, func.count(Materia.id))
                .group_by(Materia.tipo_documental)
            )
            tipos = {row[0]: row[1] for row in result.all()}

        logger.success(
            f"✅ [JOB] Estatísticas: "
            f"{total_edicoes} edições, "
            f"{total_materias} matérias, "
            f"{len(tipos)} tipos documentais"
        )

    except Exception as e:
        logger.error(f"❌ [JOB] Erro ao atualizar estatísticas: {e}")
        raise


# =========================================================
# JOB: LIMPEZA
# =========================================================

async def limpar_dados_antigos(dias: int = 365) -> None:
    """
    Remove edições mais antigas que X dias.
    CUIDADO: Esta operação é irreversível!

    Args:
        dias: Número de dias de histórico a manter (padrão: 365)
    """
    from sqlalchemy import select, delete, func
    from app.database.models import Edicao

    data_limite = date.today() - timedelta(days=dias)

    logger.warning(
        f"🗑️ [JOB] Iniciando limpeza de dados anteriores a {data_limite}"
    )

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(func.count(Edicao.id)).where(Edicao.data < data_limite)
        )
        total = result.scalar()

        if total == 0:
            logger.info("ℹ️ [JOB] Nenhuma edição antiga para limpar")
            return

        await db.execute(delete(Edicao).where(Edicao.data < data_limite))
        await db.commit()

    logger.success(f"✅ [JOB] Limpeza concluída: {total} edições removidas")


# =========================================================
# ALIASES — nomes expostos para o scheduler
# =========================================================

# AsyncIOScheduler aceita coroutine functions diretamente.
# Não é necessário wrapper síncrono — use as funções async acima.
job_coletar_hoje = coletar_edicao_hoje
job_atualizar_estatisticas = atualizar_estatisticas
