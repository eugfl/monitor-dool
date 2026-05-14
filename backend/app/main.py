import asyncio
import sys
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import settings
from app.services.pipeline import PipelineService
from app.api.v1.api import api_router
from app.tasks.scheduler import iniciar_scheduler, parar_scheduler


# =========================================================
# LOGGING — Interceptar stdlib logging e redirecionar ao Loguru
# =========================================================

class InterceptHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = sys._getframe(6), 6
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


logger.remove()
logger.add(sys.stderr, level="INFO")
logger.add(
    settings.logs_dir / "app.log",
    rotation="10 MB",
    level="DEBUG" if settings.debug else "INFO",
)

# Redirecionar logs do SQLAlchemy para o Loguru
logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


# =========================================================
# LIFESPAN — Startup e shutdown da aplicação
# =========================================================

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Gerencia ciclo de vida: inicia scheduler no startup e para no shutdown."""
    logger.info("🚀 Iniciando Monitor DOOL API...")
    iniciar_scheduler()
    yield
    logger.info("🛑 Encerrando Monitor DOOL API...")
    parar_scheduler()


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="API para monitoramento do Diário Oficial Online da Bahia",
    lifespan=lifespan,
)

# CORS — origens configuráveis via CORS_ORIGINS no .env
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


# =========================================================
# ENDPOINTS RAIZ
# =========================================================

@app.get("/", tags=["Health"])
async def root() -> dict:
    return {"message": "Monitor DOOL API está online", "env": settings.app_env}


@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Health check para Docker e load balancers."""
    return {"status": "ok", "version": "1.0.0"}


@app.post("/pipeline/run/{data}", tags=["Pipeline"])
async def run_pipeline(data: str, background_tasks: BackgroundTasks) -> dict:
    """
    Inicia o processamento de uma data específica em background.
    Formato da data: YYYY-MM-DD
    """
    service = PipelineService()
    background_tasks.add_task(service.processar_dia, data)
    return {"message": f"Processamento para {data} iniciado em background"}


# =========================================================
# ENTRY POINT CLI
# =========================================================

async def cli_run(data: str) -> None:
    service = PipelineService()
    await service.processar_dia(data)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        data_alvo = sys.argv[1]
        asyncio.run(cli_run(data_alvo))
    else:
        import uvicorn
        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
