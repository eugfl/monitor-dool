from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    """Configurações da aplicação"""

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
        """Constrói a URL do banco de dados"""
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    # DOOL
    dool_base_url: str = "https://dool.egba.ba.gov.br"
    dool_timeout: int = 120
    dool_max_concurrency: int = 20

    # Paths
    data_dir: Path = Path("data")
    logs_dir: Path = Path("logs")

    # HTTP
    user_agent: str = "Mozilla/5.0 (Monitor DOOL Bot)"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Singleton de settings"""
    return Settings()


settings = get_settings()

# Criar diretórios se não existirem
settings.data_dir.mkdir(exist_ok=True)
settings.logs_dir.mkdir(exist_ok=True)
