import asyncio

import pytest
from fastapi import HTTPException

from app.core import security


def run_auth_check(api_key: str | None = None) -> None:
    asyncio.run(security.require_admin_api_key(api_key))


def test_admin_api_key_is_optional_in_development(monkeypatch):
    monkeypatch.setattr(security.settings, "app_env", "development")
    monkeypatch.setattr(security.settings, "admin_api_key", None)

    run_auth_check()


def test_admin_api_key_is_required_in_production(monkeypatch):
    monkeypatch.setattr(security.settings, "app_env", "production")
    monkeypatch.setattr(security.settings, "admin_api_key", None)

    with pytest.raises(HTTPException) as exc_info:
        run_auth_check()

    assert exc_info.value.status_code == 503
    assert "ADMIN_API_KEY" in exc_info.value.detail


def test_admin_api_key_rejects_missing_header(monkeypatch):
    monkeypatch.setattr(security.settings, "app_env", "production")
    monkeypatch.setattr(security.settings, "admin_api_key", "secret-key")

    with pytest.raises(HTTPException) as exc_info:
        run_auth_check()

    assert exc_info.value.status_code == 401


def test_admin_api_key_rejects_invalid_header(monkeypatch):
    monkeypatch.setattr(security.settings, "app_env", "production")
    monkeypatch.setattr(security.settings, "admin_api_key", "secret-key")

    with pytest.raises(HTTPException) as exc_info:
        run_auth_check("wrong-key")

    assert exc_info.value.status_code == 401


def test_admin_api_key_accepts_valid_header(monkeypatch):
    monkeypatch.setattr(security.settings, "app_env", "production")
    monkeypatch.setattr(security.settings, "admin_api_key", "secret-key")

    run_auth_check("secret-key")
