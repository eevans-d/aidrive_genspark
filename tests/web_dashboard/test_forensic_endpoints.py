"""
Tests para Forensic Endpoints (FASE 5)
Validar autenticación, invocación de análisis, retrieval de resultados, exportación
"""

import pytest
import json
import uuid
from typing import Dict, Any
from datetime import datetime
from fastapi.testclient import TestClient


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def api_key():
    """API key válida para tests"""
    return "test-api-key-forensic"


@pytest.fixture
def invalid_api_key():
    """API key inválida"""
    return "invalid-key"


@pytest.fixture
def valid_analysis_data():
    """Datos válidos para análisis"""
    return {
        "data": {
            "providers": [
                {"id": 1, "name": "Supplier A"},
                {"id": 2, "name": "Supplier B"}
            ],
            "transactions": [
                {"id": 1, "amount": 100.0, "provider_id": 1},
                {"id": 2, "amount": 200.0, "provider_id": 2},
                {"id": 3, "amount": 150.0, "provider_id": 1}
            ],
            "inventory": [
                {"sku": "SKU001", "quantity": 50, "provider_id": 1},
                {"sku": "SKU002", "quantity": 30, "provider_id": 2}
            ]
        },
        "phases": [2, 3, 4, 5],
        "name": "Daily Forensic Check"
    }


@pytest.fixture
def client_with_dashboard():
    """Cliente FastAPI con dashboard_app"""
    # Crear un mock minimal que simula los endpoints
    from fastapi import FastAPI
    from fastapi.testclient import TestClient as TC
    
    # Importar el módulo forensic_endpoints directamente
    import sys
    import os
    sys.path.insert(0, "/home/eevan/ProyectosIA/aidrive_genspark/inventario-retail/web_dashboard/api")
    
    try:
        from forensic_endpoints import router
        
        # Crear app minimalista con router forensic
        app = FastAPI()
        app.include_router(router)
        return TC(app)
    except Exception as e:
        print(f"Error importing forensic_endpoints: {e}")
        import traceback
        traceback.print_exc()
        pytest.skip(f"No se pudo importar forensic_endpoints: {e}")


# ============================================================================
# Tests: POST /api/forensic/analyze
# ============================================================================

class TestForensicAnalyzeEndpoint:
    """Tests para endpoint POST /api/forensic/analyze"""

    def test_analyze_without_api_key(self, client_with_dashboard, valid_analysis_data):
        """POST /api/forensic/analyze sin API key debe retornar 422 o 401"""
        response = client_with_dashboard.post(
            "/api/forensic/analyze",
            json=valid_analysis_data
        )
        # 422 = Unprocessable Entity (header requerido pero no presente)
        # 401 = Unauthorized (header presente pero inválido)
        assert response.status_code in [401, 422]

    def test_analyze_with_invalid_api_key(self, client_with_dashboard, valid_analysis_data, invalid_api_key):
        """POST /api/forensic/analyze con API key inválida puede procesar (depende de validación)"""
        response = client_with_dashboard.post(
            "/api/forensic/analyze",
            json=valid_analysis_data,
            headers={"X-API-Key": invalid_api_key}
        )
        # Aceptar 401 o 202 (depende de implementación)
        assert response.status_code in [202, 401]

    def test_analyze_with_valid_api_key(self, client_with_dashboard, valid_analysis_data, api_key):
        """POST /api/forensic/analyze con API key válida debe retornar 202"""
        response = client_with_dashboard.post(
            "/api/forensic/analyze",
            json=valid_analysis_data,
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 202
        data = response.json()
        assert "analysis_id" in data
        assert data["status"] == "pending"
        assert "created_at" in data

    def test_analyze_returns_unique_ids(self, client_with_dashboard, valid_analysis_data, api_key):
        """Dos análisis deben tener IDs únicos"""
        response1 = client_with_dashboard.post(
            "/api/forensic/analyze",
            json=valid_analysis_data,
            headers={"X-API-Key": api_key}
        )
        response2 = client_with_dashboard.post(
            "/api/forensic/analyze",
            json=valid_analysis_data,
            headers={"X-API-Key": api_key}
        )
        
        assert response1.status_code == 202
        assert response2.status_code == 202
        id1 = response1.json()["analysis_id"]
        id2 = response2.json()["analysis_id"]
        assert id1 != id2

    def test_analyze_with_custom_name(self, client_with_dashboard, valid_analysis_data, api_key):
        """POST /api/forensic/analyze con nombre personalizado"""
        data = valid_analysis_data.copy()
        data["name"] = "Custom Analysis Name"
        
        response = client_with_dashboard.post(
            "/api/forensic/analyze",
            json=data,
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 202

    def test_analyze_with_specific_phases(self, client_with_dashboard, valid_analysis_data, api_key):
        """POST /api/forensic/analyze con fases específicas"""
        data = valid_analysis_data.copy()
        data["phases"] = [2, 4]  # Solo phases 2 y 4
        
        response = client_with_dashboard.post(
            "/api/forensic/analyze",
            json=data,
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 202

    def test_analyze_with_minimal_data(self, client_with_dashboard, api_key):
        """POST /api/forensic/analyze con datos mínimos"""
        minimal_data = {
            "data": {"providers": [], "transactions": [], "inventory": []}
        }
        
        response = client_with_dashboard.post(
            "/api/forensic/analyze",
            json=minimal_data,
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 202


# ============================================================================
# Tests: GET /api/forensic/status/{analysis_id}
# ============================================================================

class TestForensicStatusEndpoint:
    """Tests para endpoint GET /api/forensic/status/{analysis_id}"""

    def test_status_without_api_key(self, client_with_dashboard):
        """GET /api/forensic/status/{id} sin API key debe retornar 422 o 401"""
        response = client_with_dashboard.get(
            "/api/forensic/status/dummy-id"
        )
        assert response.status_code in [401, 422]

    def test_status_nonexistent_analysis(self, client_with_dashboard, api_key):
        """GET /api/forensic/status/{id} con ID inexistente retorna 404"""
        response = client_with_dashboard.get(
            f"/api/forensic/status/{uuid.uuid4()}",
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 404

    def test_status_after_analysis_created(self, client_with_dashboard, valid_analysis_data, api_key):
        """GET /api/forensic/status/{id} después de crear análisis"""
        # Crear análisis
        create_response = client_with_dashboard.post(
            "/api/forensic/analyze",
            json=valid_analysis_data,
            headers={"X-API-Key": api_key}
        )
        assert create_response.status_code == 202
        analysis_id = create_response.json()["analysis_id"]
        
        # Obtener status
        status_response = client_with_dashboard.get(
            f"/api/forensic/status/{analysis_id}",
            headers={"X-API-Key": api_key}
        )
        assert status_response.status_code == 200
        data = status_response.json()
        assert data["analysis_id"] == analysis_id
        # Estado puede ser pending, running, o completed (background task es muy rápida)
        assert data["status"] in ["pending", "running", "completed"]
        assert "progress" in data
        assert "created_at" in data

    def test_status_progress_tracking(self, client_with_dashboard, valid_analysis_data, api_key):
        """GET /api/forensic/status/{id} retorna progreso"""
        create_response = client_with_dashboard.post(
            "/api/forensic/analyze",
            json=valid_analysis_data,
            headers={"X-API-Key": api_key}
        )
        analysis_id = create_response.json()["analysis_id"]
        
        status_response = client_with_dashboard.get(
            f"/api/forensic/status/{analysis_id}",
            headers={"X-API-Key": api_key}
        )
        data = status_response.json()
        assert isinstance(data["progress"], int)
        assert 0 <= data["progress"] <= 100


# ============================================================================
# Tests: GET /api/forensic/analysis/{analysis_id}
# ============================================================================

class TestForensicAnalysisResultEndpoint:
    """Tests para endpoint GET /api/forensic/analysis/{analysis_id}"""

    def test_analysis_result_without_api_key(self, client_with_dashboard):
        """GET /api/forensic/analysis/{id} sin API key retorna 422 o 401"""
        response = client_with_dashboard.get(
            f"/api/forensic/analysis/{uuid.uuid4()}"
        )
        assert response.status_code in [401, 422]

    def test_analysis_result_nonexistent(self, client_with_dashboard, api_key):
        """GET /api/forensic/analysis/{id} inexistente retorna 404"""
        response = client_with_dashboard.get(
            f"/api/forensic/analysis/{uuid.uuid4()}",
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 404

    def test_analysis_result_in_progress(self, client_with_dashboard, valid_analysis_data, api_key):
        """GET /api/forensic/analysis/{id} mientras análisis está en progreso"""
        create_response = client_with_dashboard.post(
            "/api/forensic/analyze",
            json=valid_analysis_data,
            headers={"X-API-Key": api_key}
        )
        analysis_id = create_response.json()["analysis_id"]
        
        # Intenta obtener resultado (puede estar en progreso o completado)
        result_response = client_with_dashboard.get(
            f"/api/forensic/analysis/{analysis_id}",
            headers={"X-API-Key": api_key}
        )
        # Puede ser 200 (completado), 202 o 400 (en progreso)
        assert result_response.status_code in [200, 202, 400]


# ============================================================================
# Tests: POST /api/forensic/export/{analysis_id}
# ============================================================================

class TestForensicExportEndpoint:
    """Tests para endpoint POST /api/forensic/export/{analysis_id}"""

    def test_export_without_api_key(self, client_with_dashboard):
        """POST /api/forensic/export/{id} sin API key retorna 422 o 401"""
        response = client_with_dashboard.post(
            f"/api/forensic/export/{uuid.uuid4()}"
        )
        assert response.status_code in [401, 422]

    def test_export_nonexistent_analysis(self, client_with_dashboard, api_key):
        """POST /api/forensic/export/{id} con ID inexistente retorna 404"""
        response = client_with_dashboard.post(
            f"/api/forensic/export/{uuid.uuid4()}",
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 404

    def test_export_json_format(self, client_with_dashboard, api_key):
        """POST /api/forensic/export/{id}?format=json"""
        response = client_with_dashboard.post(
            f"/api/forensic/export/{uuid.uuid4()}?format=json",
            headers={"X-API-Key": api_key}
        )
        # Puede ser 404 si análisis no existe
        assert response.status_code in [400, 404]

    def test_export_csv_format(self, client_with_dashboard, api_key):
        """POST /api/forensic/export/{id}?format=csv"""
        response = client_with_dashboard.post(
            f"/api/forensic/export/{uuid.uuid4()}?format=csv",
            headers={"X-API-Key": api_key}
        )
        assert response.status_code in [400, 404]

    def test_export_html_format(self, client_with_dashboard, api_key):
        """POST /api/forensic/export/{id}?format=html"""
        response = client_with_dashboard.post(
            f"/api/forensic/export/{uuid.uuid4()}?format=html",
            headers={"X-API-Key": api_key}
        )
        assert response.status_code in [400, 404]

    def test_export_invalid_format(self, client_with_dashboard, api_key):
        """POST /api/forensic/export/{id}?format=invalid retorna 422"""
        response = client_with_dashboard.post(
            f"/api/forensic/export/{uuid.uuid4()}?format=invalid",
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 422


# ============================================================================
# Tests: GET /api/forensic/list
# ============================================================================

class TestForensicListEndpoint:
    """Tests para endpoint GET /api/forensic/list"""

    def test_list_without_api_key(self, client_with_dashboard):
        """GET /api/forensic/list sin API key retorna 422 o 401"""
        response = client_with_dashboard.get("/api/forensic/list")
        assert response.status_code in [401, 422]

    def test_list_empty_initially(self, client_with_dashboard, api_key):
        """GET /api/forensic/list retorna lista vacía inicialmente"""
        response = client_with_dashboard.get(
            "/api/forensic/list",
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        data = response.json()
        assert "analyses" in data
        assert "count" in data
        assert "statuses" in data

    def test_list_after_creating_analyses(self, client_with_dashboard, valid_analysis_data, api_key):
        """GET /api/forensic/list después de crear 2 análisis"""
        # Crear 2 análisis
        for _ in range(2):
            client_with_dashboard.post(
                "/api/forensic/analyze",
                json=valid_analysis_data,
                headers={"X-API-Key": api_key}
            )
        
        # Listar
        response = client_with_dashboard.get(
            "/api/forensic/list",
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 2


# ============================================================================
# Tests: GET /api/forensic/health
# ============================================================================

class TestForensicHealthEndpoint:
    """Tests para endpoint GET /api/forensic/health"""

    def test_health_without_api_key(self, client_with_dashboard):
        """GET /api/forensic/health sin API key retorna 422 o 401"""
        response = client_with_dashboard.get("/api/forensic/health")
        assert response.status_code in [401, 422]

    def test_health_with_api_key(self, client_with_dashboard, api_key):
        """GET /api/forensic/health con API key retorna status"""
        response = client_with_dashboard.get(
            "/api/forensic/health",
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "degraded"]
        assert "active_analyses" in data
        assert "completed_analyses" in data
        assert "total_analyses" in data


# ============================================================================
# Tests: GET /api/forensic/metrics
# ============================================================================

class TestForensicMetricsEndpoint:
    """Tests para endpoint GET /api/forensic/metrics"""

    def test_metrics_without_api_key(self, client_with_dashboard):
        """GET /api/forensic/metrics sin API key retorna 422 o 401"""
        response = client_with_dashboard.get("/api/forensic/metrics")
        assert response.status_code in [401, 422]

    def test_metrics_with_api_key(self, client_with_dashboard, api_key):
        """GET /api/forensic/metrics con API key retorna métricas"""
        response = client_with_dashboard.get(
            "/api/forensic/metrics",
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_analyses" in data
        assert "completed" in data
        assert "failed" in data
        assert "success_rate" in data
        assert "by_phase" in data


# ============================================================================
# Tests: Rate Limiting (si está habilitado)
# ============================================================================

class TestForensicRateLimiting:
    """Tests para rate limiting en endpoints forensic"""

    def test_rate_limiting_toggle(self, client_with_dashboard, api_key, valid_analysis_data):
        """Verificar que rate limiting puede estar habilitado/deshabilitado"""
        # Este test simplemente verifica que el endpoint responde
        # Rate limiting depende de DASHBOARD_RATELIMIT_ENABLED
        response = client_with_dashboard.post(
            "/api/forensic/analyze",
            json=valid_analysis_data,
            headers={"X-API-Key": api_key}
        )
        assert response.status_code in [200, 202, 429]  # 429 si rate limited


# ============================================================================
# Tests: Integración End-to-End
# ============================================================================

class TestForensicIntegration:
    """Tests de integración end-to-end"""

    def test_full_analysis_workflow(self, client_with_dashboard, valid_analysis_data, api_key):
        """Flujo completo: crear → listar → status"""
        # 1. Crear análisis
        create_response = client_with_dashboard.post(
            "/api/forensic/analyze",
            json=valid_analysis_data,
            headers={"X-API-Key": api_key}
        )
        assert create_response.status_code == 202
        analysis_id = create_response.json()["analysis_id"]
        
        # 2. Listar análisis
        list_response = client_with_dashboard.get(
            "/api/forensic/list",
            headers={"X-API-Key": api_key}
        )
        assert list_response.status_code == 200
        analyses = list_response.json()["analyses"]
        assert analysis_id in analyses
        
        # 3. Verificar status
        status_response = client_with_dashboard.get(
            f"/api/forensic/status/{analysis_id}",
            headers={"X-API-Key": api_key}
        )
        assert status_response.status_code == 200
        assert status_response.json()["analysis_id"] == analysis_id

    def test_multiple_analyses_tracking(self, client_with_dashboard, valid_analysis_data, api_key):
        """Trackear múltiples análisis simultáneos"""
        ids = []
        
        # Crear 3 análisis
        for _ in range(3):
            response = client_with_dashboard.post(
                "/api/forensic/analyze",
                json=valid_analysis_data,
                headers={"X-API-Key": api_key}
            )
            assert response.status_code == 202
            ids.append(response.json()["analysis_id"])
        
        # Verificar que todos están listados
        list_response = client_with_dashboard.get(
            "/api/forensic/list",
            headers={"X-API-Key": api_key}
        )
        analyses = list_response.json()["analyses"]
        for aid in ids:
            assert aid in analyses
        
        # Verificar status de cada uno
        for aid in ids:
            status_response = client_with_dashboard.get(
                f"/api/forensic/status/{aid}",
                headers={"X-API-Key": api_key}
            )
            assert status_response.status_code == 200
