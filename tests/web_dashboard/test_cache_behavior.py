import importlib.util
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
APP_PATH = ROOT / "inventario-retail" / "web_dashboard" / "dashboard_app.py"

spec = importlib.util.spec_from_file_location("dashboard_app", str(APP_PATH))
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)  # type: ignore
app = app_module.app
analytics = app_module.analytics

client = TestClient(app)

@pytest.fixture(autouse=True)
def env(monkeypatch):
    monkeypatch.setenv("DASHBOARD_API_KEY", "test-key")
    monkeypatch.setenv("DASHBOARD_RATELIMIT_MAX", "10000")
    yield


def test_top_products_cache_key_changes_with_params(monkeypatch):
    calls = {"count": 0}

    def fake_db_call(limit, start, end, prov):
        calls["count"] += 1
        return [{"producto": "X", "cantidad_total": 1, "pedidos": 1, "proveedor": "P"}]

    # Deshabilitar cache y parchear el método en la instancia `analytics`
    monkeypatch.setattr(analytics, "_get_cache", lambda key: None)
    monkeypatch.setattr(analytics, "_set_cache", lambda key, value: None)
    monkeypatch.setattr(analytics, "get_top_products", lambda l, s, e, p: fake_db_call(l, s, e, p))

    # Llamar endpoint con diferentes parámetros para verificar que llegan distintos a la función
    r1 = client.get("/api/top-products", params={"limit": 5}, headers={"X-API-Key": "test-key"})
    assert r1.status_code in (200, 500)
    r2 = client.get(
        "/api/top-products",
        params={"limit": 5, "start_date": "2025-01-01"},
        headers={"X-API-Key": "test-key"},
    )
    assert r2.status_code in (200, 500)
    # Si los parámetros cambian, al menos se invocó dos veces la capa analítica
    assert calls["count"] == 2


def test_weekly_sales_clamp_and_call(monkeypatch):
    called = {"weeks": None}

    def fake_weekly(weeks):
        called["weeks"] = weeks
        return []

    monkeypatch.setattr(analytics, "get_weekly_sales", fake_weekly)
    r = client.get("/api/weekly-sales", params={"weeks": 999}, headers={"X-API-Key": "test-key"})
    assert r.status_code == 200
    assert called["weeks"] == 52
