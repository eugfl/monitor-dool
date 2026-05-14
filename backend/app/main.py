import asyncio
import sys
from fastapi import FastAPI, BackgroundTasks
from loguru import logger

from app.core.config import settings
from app.services.pipeline import PipelineService

import logging

# Interceptar logs do standard logging
class InterceptHandler(logging.Handler):
    def emit(self, record):
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = sys._getframe(6), 6
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())

# Configurar Loguru
logger.remove()
logger.add(sys.stderr, level="INFO")
logger.add(settings.logs_dir / "app.log", rotation="10 MB", level="DEBUG")

# Redirecionar logs do SQLAlchemy para o Loguru
logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING) # Apenas avisos/erros por padrão

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="API para monitoramento do Diário Oficial Online"
)


@app.get("/")
async def root():
    return {"message": "Monitor DOOL API está online", "env": settings.app_env}


@app.post("/pipeline/run/{data}")
async def run_pipeline(data: str, background_tasks: BackgroundTasks):
    """
    Inicia o processamento de uma data específica em background.
    Formato da data: YYYY-MM-DD
    """
    service = PipelineService()
    background_tasks.add_task(service.processar_dia, data)
    return {"message": f"Processamento para {data} iniciado em background"}


async def cli_run(data: str):
    service = PipelineService()
    await service.processar_dia(data)

if __name__ == "__main__":
    # Se rodar via: python -m app.main 2026-05-12
    if len(sys.argv) > 1:
        data_alvo = sys.argv[1]
        asyncio.run(cli_run(data_alvo))
    else:
        import uvicorn
        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
