from sqlalchemy.pool import AsyncAdaptedQueuePool, NullPool
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.database.models import Base

# Separar kwargs por tipo de pool para evitar conflito de parâmetros
_pool_kwargs: dict = {}
if settings.app_env == "test":
    _pool_kwargs["poolclass"] = NullPool
else:
    _pool_kwargs.update(
        poolclass=AsyncAdaptedQueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
    )

# Engine assíncrono
engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    **_pool_kwargs,
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    """Dependency para FastAPI"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
