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


def test_top_products_params_sanitized(monkeypatch):
    captured = {}
    def fake_get_top_products(limit, start_date, end_date, proveedor):
        captured["limit"] = limit
        captured["start_date"] = start_date
        captured["end_date"] = end_date
        captured["proveedor"] = proveedor
        return []

    monkeypatch.setattr(app_module.analytics, "get_top_products", fake_get_top_products)

    r = client.get(
        "/api/top-products",
        params={"limit": 10000, "start_date": "2025-99-99", "end_date": "2025-09-01", "proveedor": " Prov@# "},
        headers={"X-API-Key": "test-key"},
    )
    assert r.status_code == 200
    # Verifica clamp y sanitización
    assert captured["limit"] == 100  # clamp a 100
    assert captured["start_date"] is None  # fecha inválida
    assert captured["end_date"] == "2025-09-01"  # fecha válida
    assert captured["proveedor"] == "Prov"  # texto sanitizado


def test_trends_params_sanitized(monkeypatch):
    captured = {}
    def fake_get_trends(months, start_date, end_date, proveedor):
        captured["months"] = months
        captured["start_date"] = start_date
        captured["end_date"] = end_date
        captured["proveedor"] = proveedor
        return {"pedidos_mensuales": [], "movimientos_mensuales": []}

    monkeypatch.setattr(app_module.analytics, "get_monthly_trends", fake_get_trends)

    r = client.get(
        "/api/trends",
        params={"months": -5, "start_date": "2025-01-01", "end_date": "2025-13-01", "proveedor": " ..ACME.. "},
        headers={"X-API-Key": "test-key"},
    )
    assert r.status_code == 200
    assert captured["months"] == 1  # clamp mínimo
    assert captured["start_date"] == "2025-01-01"
    assert captured["end_date"] is None
    assert captured["proveedor"] == "..ACME.."  # puntos permitidos por regex
