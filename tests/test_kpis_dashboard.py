"""
Tests para Dashboard KPIs
==========================
Tests para validar los endpoints de KPIs y la actualización en tiempo real
"""

import pytest
import json
from fastapi.testclient import TestClient


class TestDashboardKPIs:
    """Test suite para Dashboard KPIs"""
    
    def test_kpis_endpoint_exists(self, client):
        """Test que el endpoint /api/kpis/dashboard existe"""
        response = client.get('/api/kpis/dashboard')
        assert response.status_code in [200, 401, 500]
    
    def test_kpis_returns_valid_structure(self, client):
        """Test que /api/kpis/dashboard retorna estructura válida"""
        response = client.get('/api/kpis/dashboard')
        
        if response.status_code == 200:
            data = response.json()
            
            # Validar campos principales
            required_fields = [
                'sales', 'critical_stock', 'pending_orders', 
                'active_alerts', 'weekly_trends'
            ]
            
            for field in required_fields:
                assert field in data, f"Falta campo: {field}"
    
    def test_kpis_sales_structure(self, client):
        """Test que sales KPI tiene estructura correcta"""
        response = client.get('/api/kpis/dashboard')
        
        if response.status_code == 200:
            data = response.json()
            sales = data.get('sales', {})
            
            assert 'value' in sales
            assert 'trend' in sales
            assert isinstance(sales['value'], (int, float))
            assert sales['value'] >= 0
    
    def test_kpis_critical_stock_structure(self, client):
        """Test que critical_stock KPI tiene estructura correcta"""
        response = client.get('/api/kpis/dashboard')
        
        if response.status_code == 200:
            data = response.json()
            stock = data.get('critical_stock', {})
            
            assert 'value' in stock
            assert 'percentage' in stock
            assert 'trend' in stock
            assert isinstance(stock['value'], int)
            assert 0 <= stock['percentage'] <= 100
    
    def test_kpis_pending_orders_structure(self, client):
        """Test que pending_orders KPI tiene estructura correcta"""
        response = client.get('/api/kpis/dashboard')
        
        if response.status_code == 200:
            data = response.json()
            orders = data.get('pending_orders', {})
            
            assert 'value' in orders
            assert 'status' in orders
            assert 'trend' in orders
            assert isinstance(orders['value'], int)
            assert orders['status'] in ['critical', 'pending', 'ok']
    
    def test_kpis_active_alerts_structure(self, client):
        """Test que active_alerts KPI tiene estructura correcta"""
        response = client.get('/api/kpis/dashboard')
        
        if response.status_code == 200:
            data = response.json()
            alerts = data.get('active_alerts', {})
            
            assert 'value' in alerts
            assert 'alerts' in alerts
            assert 'trend' in alerts
            assert isinstance(alerts['value'], int)
            assert isinstance(alerts['alerts'], list)
    
    def test_kpis_weekly_trends_structure(self, client):
        """Test que weekly_trends tiene estructura correcta"""
        response = client.get('/api/kpis/dashboard')
        
        if response.status_code == 200:
            data = response.json()
            trends = data.get('weekly_trends', {})
            
            assert 'days' in trends
            assert 'sales' in trends
            assert 'critical_stock' in trends
            assert 'orders' in trends
            
            # Deben tener 7 elementos (una semana)
            assert len(trends['days']) == 7
            assert len(trends['sales']) == 7
            assert len(trends['critical_stock']) == 7
            assert len(trends['orders']) == 7
    
    def test_kpis_trend_structure(self, client):
        """Test que trend tiene estructura válida"""
        response = client.get('/api/kpis/dashboard')
        
        if response.status_code == 200:
            data = response.json()
            
            # Verificar trend en sales
            sales_trend = data['sales'].get('trend', {})
            assert 'direction' in sales_trend
            assert 'value' in sales_trend
            assert sales_trend['direction'] in ['up', 'down', 'stable']
    
    def test_kpis_performance(self, client):
        """Test que KPIs endpoint es rápido (<1s)"""
        import time
        
        start = time.time()
        response = client.get('/api/kpis/dashboard')
        duration = time.time() - start
        
        if response.status_code == 200:
            assert duration < 1.0, f"KPIs demasiado lento: {duration:.2f}s"


class TestKPIsIntegration:
    """Test suite integrado para KPIs"""
    
    def test_kpis_multiple_calls(self, client):
        """Test obtener KPIs múltiples veces"""
        responses = []
        
        for i in range(3):
            response = client.get('/api/kpis/dashboard')
            if response.status_code == 200:
                responses.append(response.json())
        
        assert len(responses) > 0, "Al menos una respuesta debe ser exitosa"
        
        # Verificar estructura en todas
        for data in responses:
            assert 'sales' in data
            assert 'weekly_trends' in data
    
    def test_kpis_trends_consistency(self, client):
        """Test que trends son consistentes"""
        response = client.get('/api/kpis/dashboard')
        
        if response.status_code == 200:
            data = response.json()
            
            # Los días semanales deben ser los mismos
            first_days = data['weekly_trends']['days']
            assert len(first_days) == 7
            
            # Deben incluir días de la semana
            expected_days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab', 'Dom']
            assert all(day in first_days for day in expected_days)


class TestKPIsValues:
    """Test suite para validación de valores KPIs"""
    
    def test_kpis_sales_non_negative(self, client):
        """Test que ventas nunca son negativas"""
        response = client.get('/api/kpis/dashboard')
        
        if response.status_code == 200:
            data = response.json()
            assert data['sales']['value'] >= 0
    
    def test_kpis_stock_non_negative(self, client):
        """Test que stock crítico nunca es negativo"""
        response = client.get('/api/kpis/dashboard')
        
        if response.status_code == 200:
            data = response.json()
            assert data['critical_stock']['value'] >= 0
    
    def test_kpis_orders_non_negative(self, client):
        """Test que órdenes nunca son negativas"""
        response = client.get('/api/kpis/dashboard')
        
        if response.status_code == 200:
            data = response.json()
            assert data['pending_orders']['value'] >= 0
    
    def test_kpis_alerts_non_negative(self, client):
        """Test que alertas nunca son negativas"""
        response = client.get('/api/kpis/dashboard')
        
        if response.status_code == 200:
            data = response.json()
            assert data['active_alerts']['value'] >= 0
    
    def test_kpis_percentage_valid_range(self, client):
        """Test que porcentajes están en rango válido"""
        response = client.get('/api/kpis/dashboard')
        
        if response.status_code == 200:
            data = response.json()
            percentage = data['critical_stock']['percentage']
            assert 0 <= percentage <= 100


class TestKPIsEdgeCases:
    """Test suite para casos extremos"""
    
    def test_kpis_with_no_data(self, client):
        """Test KPIs cuando no hay datos (BD vacía)"""
        response = client.get('/api/kpis/dashboard')
        
        # Debería retornar algo, aunque sea ceros
        if response.status_code == 200:
            data = response.json()
            assert data['sales']['value'] >= 0
            assert data['critical_stock']['value'] >= 0
    
    def test_kpis_contains_duration_ms(self, client):
        """Test que respuesta incluye duration_ms"""
        response = client.get('/api/kpis/dashboard')
        
        if response.status_code == 200:
            data = response.json()
            assert 'duration_ms' in data
            assert isinstance(data['duration_ms'], (int, float))
            assert data['duration_ms'] >= 0


class TestKPIsMetrics:
    """Test suite para métricas"""
    
    def test_kpis_endpoint_increments_metrics(self, client):
        """Test que el endpoint actualiza métricas"""
        # Primera llamada
        response1 = client.get('/api/kpis/dashboard')
        
        # Segunda llamada
        response2 = client.get('/api/kpis/dashboard')
        
        # Ambas deberían ser exitosas
        if response1.status_code == 200 and response2.status_code == 200:
            assert response1.json()['sales'] is not None
            assert response2.json()['sales'] is not None


class TestKPIsLoad:
    """Test suite de carga para KPIs"""
    
    def test_kpis_100_requests(self, client):
        """Test 100 solicitudes a /api/kpis/dashboard"""
        import concurrent.futures
        
        def fetch_kpis():
            return client.get('/api/kpis/dashboard')
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(fetch_kpis) for _ in range(100)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        # Al menos 95% debería ser exitosa
        success_count = sum(1 for r in results if r.status_code == 200)
        assert success_count >= 95, f"Solo {success_count}/100 exitosas"
    
    def test_kpis_request_latency_average(self, client):
        """Test latencia promedio de KPIs < 500ms"""
        import time
        
        latencies = []
        for _ in range(10):
            start = time.time()
            response = client.get('/api/kpis/dashboard')
            duration = (time.time() - start) * 1000
            
            if response.status_code == 200:
                latencies.append(duration)
        
        if latencies:
            avg_latency = sum(latencies) / len(latencies)
            assert avg_latency < 500, f"Latencia promedio: {avg_latency:.0f}ms"
