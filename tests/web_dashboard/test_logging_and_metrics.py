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
    monkeypatch.setenv("DASHBOARD_LOG_LEVEL", "INFO")
    yield


def test_request_id_header_and_metrics(monkeypatch):
    # Stub mínimo para summary para evitar dependencia de DB
    monkeypatch.setattr(
        app_module.analytics,
        "get_dashboard_summary",
        lambda: {"total_proveedores": 0, "total_pedidos": 0, "total_productos_pedidos": 0, "total_movimientos": 0, "facturas_procesadas": 0, "pedidos_mes": 0, "movimientos_semana": 0, "proveedor_top": {"nombre": "", "pedidos": 0}},
    )

    # Enviar request con un Request-ID custom
    headers = {"X-API-Key": "test-key", "X-Request-ID": "req-123"}
    r = client.get("/api/summary", headers=headers)
    assert r.status_code == 200
    # Respuesta debe incluir el mismo Request-ID
    assert r.headers.get("X-Request-ID") == "req-123"

    # Verificar que /metrics existe y requiere API key
    r2 = client.get("/metrics")
    assert r2.status_code == 401
    r3 = client.get("/metrics", headers={"X-API-Key": "test-key"})
    assert r3.status_code == 200
    body = r3.text
    assert "dashboard_requests_total" in body
    assert "dashboard_uptime_seconds" in body
    assert "dashboard_requests_by_path_total" in body
