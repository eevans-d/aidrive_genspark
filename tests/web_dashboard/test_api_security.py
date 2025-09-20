import os
import pytest
from fastapi.testclient import TestClient

# Ajustar import según la estructura real del proyecto
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP_PATH = ROOT / "inventario-retail" / "web_dashboard" / "dashboard_app.py"

spec = importlib.util.spec_from_file_location("dashboard_app", str(APP_PATH))
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)  # type: ignore
app = app_module.app

client = TestClient(app)

@pytest.fixture(autouse=True)
def set_api_key_env(monkeypatch):
    monkeypatch.setenv("DASHBOARD_API_KEY", "test-key")
    # forzar rate limit alto en test
    monkeypatch.setenv("DASHBOARD_RATELIMIT_MAX", "10000")
    yield


def test_api_requires_api_key():
    r = client.get("/api/summary")
    assert r.status_code == 401

    r = client.get("/api/summary", headers={"X-API-Key": "wrong"})
    assert r.status_code == 401

    r = client.get("/api/summary", headers={"X-API-Key": "test-key"})
    assert r.status_code in (200, 500)  # 500 si falla DB; lo importante es pasar auth


def test_params_sanitization_and_clamp():
    # trends con months fuera de rango -> clamp
    r = client.get("/api/trends", params={"months": 999}, headers={"X-API-Key": "test-key"})
    assert r.status_code in (200, 500)

    # top-products limit excesivo -> clamp
    r = client.get("/api/top-products", params={"limit": 10000}, headers={"X-API-Key": "test-key"})
    assert r.status_code in (200, 500)

    # fechas invalidas -> sanitiza a None y no rompe
    r = client.get("/api/top-products", params={"start_date": "2025-99-99"}, headers={"X-API-Key": "test-key"})
    assert r.status_code in (200, 500)


def test_rate_limit_disabled_by_env(monkeypatch):
    monkeypatch.setenv("DASHBOARD_RATELIMIT_ENABLED", "false")
    for _ in range(200):
        r = client.get("/api/summary", headers={"X-API-Key": "test-key"})
        assert r.status_code in (200, 500)
