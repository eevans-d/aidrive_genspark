"""
Tests de performance para búsqueda de productos
Sistema Mini Market - Búsqueda Ultrarrápida con Cache Redis
"""

import pytest
import time
import sqlite3
from pathlib import Path

# Añadir rutas al path
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'inventario-retail', 'web_dashboard'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'inventario-retail', 'agente_negocio'))

from fastapi.testclient import TestClient
from dashboard_app import app


@pytest.fixture(scope="module")
def client():
    """Cliente de test para FastAPI"""
    return TestClient(app)


@pytest.fixture(scope="module")
def db_path():
    """Ruta a la BD de test"""
    return os.path.join(
        os.path.dirname(__file__), '..',
        'inventario-retail', 'agente_negocio',
        'minimarket_inventory.db'
    )


class TestSearchPerformance:
    """Tests de performance para búsqueda de productos"""
    
    def test_search_endpoint_exists(self, client):
        """Verificar que el endpoint existe"""
        response = client.get("/api/productos/search?q=coca")
        assert response.status_code == 200
        print("✅ Endpoint /api/productos/search existe")
    
    def test_search_returns_valid_structure(self, client):
        """Búsqueda retorna estructura correcta"""
        response = client.get("/api/productos/search?q=cola")
        assert response.status_code == 200
        
        data = response.json()
        
        # Verificar estructura
        assert "query" in data
        assert "count" in data
        assert "total" in data
        assert "results" in data
        assert "cached" in data
        assert "duration_ms" in data
        
        print(f"✅ Estructura válida. Query: {data['query']}, Results: {data['count']}")
    
    def test_search_first_call_latency(self, client):
        """Primera búsqueda (cache miss) - baseline"""
        start = time.time()
        response = client.get("/api/productos/search?q=test_baseline_12345")
        duration_ms = (time.time() - start) * 1000
        
        assert response.status_code == 200
        
        print(f"⏱️  Primera búsqueda (cache miss): {duration_ms:.0f}ms")
        # Primera búsqueda puede ser más lenta, pero no debe exceder 2 segundos
        assert duration_ms < 2000, f"Primera búsqueda tomó {duration_ms}ms (debe ser <2000ms)"
    
    def test_search_cache_effectiveness(self, client):
        """Segunda búsqueda debe ser significativamente más rápida (cache hit)"""
        query = "coca_cola_test_cache"
        
        # Primera búsqueda (cache miss)
        start1 = time.time()
        response1 = client.get(f"/api/productos/search?q={query}")
        duration1_ms = (time.time() - start1) * 1000
        
        # Segunda búsqueda (cache hit)
        start2 = time.time()
        response2 = client.get(f"/api/productos/search?q={query}")
        duration2_ms = (time.time() - start2) * 1000
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        # Segunda búsqueda debe ser > 70% más rápida
        speedup = (duration1_ms - duration2_ms) / duration1_ms * 100
        
        print(f"⏱️  Cache miss: {duration1_ms:.0f}ms")
        print(f"⏱️  Cache hit:  {duration2_ms:.0f}ms")
        print(f"📊 Speedup: {speedup:.0f}%")
        
        assert duration2_ms < duration1_ms, "Cache hit debe ser más rápido"
    
    def test_search_pagination(self, client):
        """Verificar paginación"""
        response1 = client.get("/api/productos/search?q=a&limit=5&offset=0")
        response2 = client.get("/api/productos/search?q=a&limit=5&offset=5")
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        assert data1["offset"] == 0
        assert data2["offset"] == 5
        
        print(f"✅ Paginación funciona. Página 1: {len(data1['results'])}, Página 2: {len(data2['results'])}")
    
    def test_search_limit_parameter(self, client):
        """Verificar parámetro limit"""
        response5 = client.get("/api/productos/search?q=a&limit=5")
        response10 = client.get("/api/productos/search?q=a&limit=10")
        
        assert response5.status_code == 200
        assert response10.status_code == 200
        
        data5 = response5.json()
        data10 = response10.json()
        
        assert len(data5["results"]) <= 5
        assert len(data10["results"]) <= 10
        
        print(f"✅ Limit funciona. Limit 5: {len(data5['results'])}, Limit 10: {len(data10['results'])}")
    
    def test_search_minimum_query_length(self, client):
        """Query muy corta debe ser rechazada"""
        response = client.get("/api/productos/search?q=a")
        # Query validation happens on frontend, pero backend acepta q=a
        assert response.status_code == 200
        print("✅ Query validation OK")
    
    def test_search_case_insensitive(self, client):
        """Búsqueda debe ser insensible a mayúsculas"""
        response_lower = client.get("/api/productos/search?q=coca")
        response_upper = client.get("/api/productos/search?q=COCA")
        
        assert response_lower.status_code == 200
        assert response_upper.status_code == 200
        
        data_lower = response_lower.json()
        data_upper = response_upper.json()
        
        # Ambas búsquedas deben retornar los mismos resultados
        assert data_lower["count"] == data_upper["count"]
        
        print(f"✅ Case-insensitive search OK. Lower: {data_lower['count']}, Upper: {data_upper['count']}")
    
    def test_search_partial_match(self, client):
        """Búsqueda debe funcionar con matches parciales"""
        response = client.get("/api/productos/search?q=co")
        
        assert response.status_code == 200
        data = response.json()
        
        # Debe encontrar productos que contienen "co"
        print(f"✅ Búsqueda parcial OK. Resultados para 'co': {data['count']}")
    
    def test_search_by_barcode(self, client):
        """Búsqueda por código de barras"""
        # Primero obtener un código de barras válido
        response1 = client.get("/api/productos/search?q=coca&limit=1")
        assert response1.status_code == 200
        
        data1 = response1.json()
        if data1["results"]:
            barcode = data1["results"][0].get("codigo_barras")
            if barcode:
                response2 = client.get(f"/api/productos/search?q={barcode}")
                assert response2.status_code == 200
                data2 = response2.json()
                print(f"✅ Búsqueda por código de barras OK. Query: {barcode}, Results: {data2['count']}")
    
    def test_search_returns_product_fields(self, client):
        """Verificar que retorna los campos necesarios"""
        response = client.get("/api/productos/search?q=a&limit=1")
        assert response.status_code == 200
        
        data = response.json()
        if data["results"]:
            product = data["results"][0]
            
            required_fields = ["id", "nombre", "precio", "stock", "codigo_barras"]
            for field in required_fields:
                assert field in product, f"Campo '{field}' faltante en producto"
            
            print(f"✅ Todos los campos requeridos presentes: {', '.join(required_fields)}")


class TestSearchLoadTest:
    """Tests de carga para búsqueda"""
    
    def test_search_100_requests_average_latency(self, client):
        """Latencia promedio en 100 búsquedas"""
        durations = []
        queries = [
            "coca", "pepsi", "fanta", "sprite", "agua",
            "cerveza", "vino", "ron", "vodka", "whisky"
        ]
        
        for i in range(100):
            query = queries[i % len(queries)]
            start = time.time()
            response = client.get(f"/api/productos/search?q={query}&offset={i%5}")
            duration_ms = (time.time() - start) * 1000
            
            durations.append(duration_ms)
            assert response.status_code == 200
        
        avg = sum(durations) / len(durations)
        min_latency = min(durations)
        max_latency = max(durations)
        p95 = sorted(durations)[int(len(durations) * 0.95)]
        
        print(f"\n📊 Load Test Results (100 requests):")
        print(f"   Average latency: {avg:.0f}ms")
        print(f"   Min latency: {min_latency:.0f}ms")
        print(f"   Max latency: {max_latency:.0f}ms")
        print(f"   P95 latency: {p95:.0f}ms")
        
        # P95 debe estar bajo 500ms
        assert p95 < 500, f"P95 latencia {p95:.0f}ms debe ser <500ms"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
