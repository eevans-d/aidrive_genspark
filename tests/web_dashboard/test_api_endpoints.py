import os
import pytest
from fastapi.testclient import TestClient

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
def env(monkeypatch):
    monkeypatch.setenv("DASHBOARD_API_KEY", "test-key")
    monkeypatch.setenv("DASHBOARD_RATELIMIT_MAX", "10000")
    yield


def test_health_ok():
    r = client.get("/health")
    assert r.status_code in (200, 503)


def test_protected_endpoints_auth():
    protected = [
        "/api/summary",
        "/api/providers",
        "/api/stock-timeline",
        "/api/top-products",
        "/api/trends",
        "/api/stock-by-provider",
        "/api/weekly-sales",
        "/api/export/summary.csv",
        "/api/export/providers.csv",
        "/api/export/top-products.csv",
    ]
    for url in protected:
        r = client.get(url)
        assert r.status_code == 401
        r = client.get(url, headers={"X-API-Key": "test-key"})
        assert r.status_code in (200, 500)
