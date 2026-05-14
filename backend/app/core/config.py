from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações da aplicação carregadas do arquivo .env"""

    # App
    app_name: str = "Monitor DOOL"
    app_env: str = "development"
    debug: bool = True

    # Database
    postgres_user: str = "monitor_dool_user"
    postgres_password: str = "monitor_dool_password"
    postgres_db: str = "monitor_dool_db"
    postgres_host: str = "db"
    postgres_port: int = 5432

    @property
    def database_url(self) -> str:
        """Constrói a URL do banco de dados com driver asyncpg."""
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    # DOOL
    dool_base_url: str = "https://dool.egba.ba.gov.br"
    dool_timeout: int = 120
    dool_max_concurrency: int = 20

    # CORS — lista separada por vírgulas no .env
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Paths
    data_dir: Path = Path("data")
    logs_dir: Path = Path("logs")

    # HTTP
    user_agent: str = "Mozilla/5.0 (Monitor DOOL Bot)"

    # Pydantic v2: model_config substitui class Config (sem deprecation warning)
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache()
def get_settings() -> Settings:
    """Retorna singleton de configurações (cached)."""
    return Settings()


settings = get_settings()

# Criar diretórios necessários se não existirem
settings.data_dir.mkdir(exist_ok=True)
settings.logs_dir.mkdir(exist_ok=True)
