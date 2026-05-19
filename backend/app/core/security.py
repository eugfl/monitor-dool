from hmac import compare_digest

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from app.core.config import settings

admin_api_key_header = APIKeyHeader(name="X-Admin-API-Key", auto_error=False)


async def require_admin_api_key(api_key: str | None = Security(admin_api_key_header)) -> None:
    """Protege endpoints administrativos que disparam jobs ou coletas."""
    configured_key = settings.admin_api_key

    if not configured_key:
        if settings.app_env.lower() == "production":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="ADMIN_API_KEY precisa estar configurada em producao.",
            )
        return

    if not api_key or not compare_digest(api_key, configured_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Chave administrativa invalida ou ausente.",
        )
