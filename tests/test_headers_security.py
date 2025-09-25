import os
import sys
import importlib.machinery
import importlib.util
from pathlib import Path
from fastapi.testclient import TestClient

os.environ.setdefault("DASHBOARD_API_KEY", "test-key")

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

dashboard_path = ROOT / "inventario-retail" / "web_dashboard" / "dashboard_app.py"
spec_name = "dashboard_app_dynamic_headers"
loader = importlib.machinery.SourceFileLoader(spec_name, str(dashboard_path))
spec = importlib.util.spec_from_loader(spec_name, loader)
module = importlib.util.module_from_spec(spec)  # type: ignore
loader.exec_module(module)  # type: ignore
app = getattr(module, "app")
client = TestClient(app)


def test_security_headers_present():
    r = client.get("/")
    headers = r.headers
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("referrer-policy") == "no-referrer"
    assert "geolocation=" in headers.get("permissions-policy", "")


def test_csp_header_consistency_partial():
    r = client.get("/")
    csp = headers = r.headers.get("content-security-policy")
    assert csp is not None
    # Chequeos parciales por robustez
    for directive in ["default-src 'self'", "script-src 'self' https://cdn.jsdelivr.net", "object-src 'none'"]:
        assert directive in csp
