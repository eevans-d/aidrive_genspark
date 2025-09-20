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
    # alto límite para evitar rate limit en pruebas
    monkeypatch.setenv("DASHBOARD_RATELIMIT_MAX", "10000")
    yield

def test_export_summary_csv_ok(monkeypatch):
    # Stubear datos determinísticos
    monkeypatch.setattr(
        app_module.analytics,
        "get_dashboard_summary",
        lambda: {
            "total_proveedores": 3,
            "total_pedidos": 10,
            "total_productos_pedidos": 42,
            "total_movimientos": 7,
            "facturas_procesadas": 5,
            "pedidos_mes": 4,
            "movimientos_semana": 2,
            "proveedor_top": {"nombre": "ProveedorX", "pedidos": 3},
        },
    )
    r = client.get("/api/export/summary.csv", headers={"X-API-Key": "test-key"})
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("text/csv")
    lines = r.text.strip().splitlines()
    assert lines[0] == (
        "total_proveedores,total_pedidos,total_productos_pedidos,total_movimientos," \
        "facturas_procesadas,pedidos_mes,movimientos_semana,proveedor_top_nombre,proveedor_top_pedidos"
    )
    assert "ProveedorX" in lines[1]


def test_export_providers_csv_ok(monkeypatch):
    monkeypatch.setattr(
        app_module.analytics,
        "get_provider_stats",
        lambda: [
            {
                "codigo": "P01",
                "nombre": "Prov A",
                "total_pedidos": 5,
                "total_productos": 20,
                "pedidos_semana": 2,
                "pedidos_mes": 3,
            },
            {
                "codigo": "P02",
                "nombre": "Prov B",
                "total_pedidos": 4,
                "total_productos": 15,
                "pedidos_semana": 1,
                "pedidos_mes": 2,
            },
        ],
    )
    r = client.get("/api/export/providers.csv", headers={"X-API-Key": "test-key"})
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("text/csv")
    lines = r.text.strip().splitlines()
    assert lines[0] == "codigo,nombre,total_pedidos,total_productos,pedidos_semana,pedidos_mes"
    assert lines[1].startswith("P01,Prov A,5,20,2,3")
    assert lines[2].startswith("P02,Prov B,4,15,1,2")


def test_export_top_products_csv_ok(monkeypatch):
    monkeypatch.setattr(
        app_module.analytics,
        "get_top_products",
        lambda limit, start_date, end_date, proveedor: [
            {"producto": "Yerba", "cantidad_total": 30, "pedidos": 8, "proveedor": "P01"},
            {"producto": "Leche", "cantidad_total": 25, "pedidos": 7, "proveedor": "P02"},
        ],
    )
    r = client.get(
        "/api/export/top-products.csv",
        params={"limit": 5, "start_date": "2025-01-01", "end_date": "2025-12-31", "proveedor": "Prov"},
        headers={"X-API-Key": "test-key"},
    )
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("text/csv")
    lines = r.text.strip().splitlines()
    assert lines[0] == "producto,cantidad_total,pedidos,proveedor"
    assert lines[1].startswith("Yerba,30,8,P01")
    assert lines[2].startswith("Leche,25,7,P02")
