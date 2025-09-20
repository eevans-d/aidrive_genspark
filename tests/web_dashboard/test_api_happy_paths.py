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

client = TestClient(app)

@pytest.fixture(autouse=True)
def env(monkeypatch):
    monkeypatch.setenv("DASHBOARD_API_KEY", "test-key")
    monkeypatch.setenv("DASHBOARD_RATELIMIT_MAX", "10000")
    yield


def test_summary_happy(monkeypatch):
    monkeypatch.setattr(
        app_module.analytics,
        "get_dashboard_summary",
        lambda: {"total_proveedores": 1, "total_pedidos": 2, "total_productos_pedidos": 3, "total_movimientos": 4, "facturas_procesadas": 0, "pedidos_mes": 1, "movimientos_semana": 1, "proveedor_top": {"nombre": "P", "pedidos": 1}},
    )
    r = client.get("/api/summary", headers={"X-API-Key": "test-key"})
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, dict)
    assert body["total_pedidos"] == 2


def test_providers_happy(monkeypatch):
    monkeypatch.setattr(
        app_module.analytics,
        "get_provider_stats",
        lambda: [
            {"codigo": "P01", "nombre": "Prov A", "total_pedidos": 5, "total_productos": 10, "pedidos_semana": 2, "pedidos_mes": 4}
        ],
    )
    r = client.get("/api/providers", headers={"X-API-Key": "test-key"})
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list) and body[0]["codigo"] == "P01"


def test_stock_timeline_happy(monkeypatch):
    monkeypatch.setattr(
        app_module.analytics,
        "get_stock_movements_timeline",
        lambda days: [
            {"fecha": "2025-09-01", "tipo": "ingreso", "movimientos": 3, "productos": 10}
        ],
    )
    r = client.get("/api/stock-timeline", params={"days": 7}, headers={"X-API-Key": "test-key"})
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list) and body[0]["tipo"] == "ingreso"


def test_top_products_happy(monkeypatch):
    monkeypatch.setattr(
        app_module.analytics,
        "get_top_products",
        lambda limit, start_date, end_date, proveedor: [
            {"producto": "Yerba", "cantidad_total": 30, "pedidos": 8, "proveedor": "P01"}
        ],
    )
    r = client.get("/api/top-products", params={"limit": 5}, headers={"X-API-Key": "test-key"})
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list) and body[0]["producto"] == "Yerba"


def test_trends_happy(monkeypatch):
    monkeypatch.setattr(
        app_module.analytics,
        "get_monthly_trends",
        lambda months, start_date, end_date, proveedor: {
            "pedidos_mensuales": [{"mes": "2025-08", "pedidos": 5, "proveedores_activos": 2}],
            "movimientos_mensuales": [{"mes": "2025-08", "tipo": "ingreso", "movimientos": 3, "productos": 9}],
        },
    )
    r = client.get("/api/trends", params={"months": 6}, headers={"X-API-Key": "test-key"})
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, dict) and "pedidos_mensuales" in body


def test_stock_by_provider_happy(monkeypatch):
    monkeypatch.setattr(
        app_module.analytics,
        "get_stock_by_provider",
        lambda limit: [
            {"codigo": "P01", "nombre": "Prov A", "stock_total": 100}
        ],
    )
    r = client.get("/api/stock-by-provider", params={"limit": 5}, headers={"X-API-Key": "test-key"})
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list) and body[0]["stock_total"] == 100


def test_weekly_sales_happy(monkeypatch):
    monkeypatch.setattr(
        app_module.analytics,
        "get_weekly_sales",
        lambda weeks: [
            {"semana": "2025-36", "pedidos": 7, "productos": 20}
        ],
    )
    r = client.get("/api/weekly-sales", params={"weeks": 8}, headers={"X-API-Key": "test-key"})
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list) and body[0]["semana"] == "2025-36"
