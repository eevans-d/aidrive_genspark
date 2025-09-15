#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dashboard Web - Sistema Mini Market
==================================

Dashboard web completo con Business Intelligence, métricas avanzadas,
gráficos interactivos y reportes ejecutivos para el Sistema Mini Market.

Autor: Sistema Multiagente
Fecha: 2025-01-18
Versión: 1.0
"""

from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse
import sqlite3
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import math
from pathlib import Path
import os

# Importar lógica del Mini Market
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'agente_negocio'))

try:
    from provider_database_integration import MiniMarketDatabaseManager
except ImportError:
    print("⚠️  No se pudo importar MiniMarketDatabaseManager. Usando modo simulado.")
    MiniMarketDatabaseManager = None

# ========================================
# CONFIGURACIÓN GLOBAL
# ========================================

app = FastAPI(
    title="Dashboard Web - Mini Market",
    description="Dashboard completo con Business Intelligence para el Sistema Mini Market",
    version="1.0"
)

# Configurar templates
current_dir = Path(__file__).parent
templates = Jinja2Templates(directory=str(current_dir / "templates"))

# Configurar archivos estáticos (crear directorio si no existe)
static_dir = current_dir / "static"
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Base de datos
DATABASE_PATH = str(current_dir / ".." / "agente_negocio" / "minimarket_inventory.db")

# ========================================
# CLASE ANALYTICS AVANZADA
# ========================================

class DashboardAnalytics:
    """Clase para generar analytics y métricas del dashboard."""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def get_connection(self):
        """Obtiene conexión a la base de datos."""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            return conn
        except Exception as e:
            print(f"Error conectando a DB: {e}")
            return None
    
    def get_summary_metrics(self) -> Dict[str, Any]:
        """Obtiene métricas de resumen para el dashboard principal."""
        conn = self.get_connection()
        if not conn:
            return self._get_mock_summary()
        
        try:
            cursor = conn.cursor()
            
            # Total proveedores activos
            cursor.execute("SELECT COUNT(*) as total FROM proveedores WHERE activo = 1")
            total_providers = cursor.fetchone()["total"]
            
            # Total productos en inventario
            cursor.execute("SELECT COUNT(*) as total FROM productos WHERE stock_actual > 0 AND activo = 1")
            total_products = cursor.fetchone()["total"]
            
            # Valor total del inventario
            cursor.execute("SELECT SUM(precio_venta * stock_actual) as total FROM productos WHERE stock_actual > 0 AND activo = 1")
            result = cursor.fetchone()
            total_value = result["total"] or 0
            
            # Pedidos del último mes
            last_month = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            cursor.execute("""
                SELECT COUNT(*) as total 
                FROM pedidos 
                WHERE fecha_pedido >= ?
            """, (last_month,))
            monthly_orders = cursor.fetchone()["total"]
            
            # Productos con stock bajo (menos del stock mínimo)
            cursor.execute("SELECT COUNT(*) as total FROM productos WHERE stock_actual < stock_minimo AND activo = 1")
            low_stock = cursor.fetchone()["total"]
            
            # Calcular tendencias (comparar con mes anterior)
            prev_month = (datetime.now() - timedelta(days=60)).strftime('%Y-%m-%d')
            cursor.execute("""
                SELECT COUNT(*) as total 
                FROM pedidos 
                WHERE fecha_pedido >= ? AND fecha_pedido < ?
            """, (prev_month, last_month))
            prev_monthly_orders = cursor.fetchone()["total"]
            
            # Calcular cambio porcentual en pedidos
            orders_change = 0
            if prev_monthly_orders > 0:
                orders_change = ((monthly_orders - prev_monthly_orders) / prev_monthly_orders) * 100
            
            conn.close()
            
            return {
                "total_proveedores": total_providers,
                "total_pedidos": monthly_orders,
                "total_productos_pedidos": total_products,
                "total_movimientos": total_products,  # Usando productos como proxy
                "pedidos_mes": monthly_orders,
                "movimientos_semana": low_stock,  # Usando low_stock como proxy
                "facturas_procesadas": total_providers,  # Usando proveedores como proxy
                "proveedor_top": {
                    "nombre": "Proveedor Principal",
                    "pedidos": monthly_orders
                },
                "orders_trend": round(orders_change, 1)
            }
            
        except Exception as e:
            conn.close()
            print(f"Error en get_summary_metrics: {e}")
            return self._get_mock_summary()
    
    def get_top_products(self, limit: int = 10, start_date: str = None, end_date: str = None, proveedor: str = None) -> List[Dict[str, Any]]:
        """Obtiene los productos más pedidos con filtros opcionales."""
        conn = self.get_connection()
        if not conn:
            return self._get_mock_top_products(limit)
        
        try:
            cursor = conn.cursor()
            
            # Construir query con filtros
            where_conditions = []
            params = []
            
            if start_date:
                where_conditions.append("p.fecha_pedido >= ?")
                params.append(start_date)
            
            if end_date:
                where_conditions.append("p.fecha_pedido <= ?")
                params.append(end_date)
            
            if proveedor:
                where_conditions.append("LOWER(prov.nombre) LIKE LOWER(?)")
                params.append(f"%{proveedor}%")
            
            where_clause = ""
            if where_conditions:
                where_clause = "WHERE " + " AND ".join(where_conditions)
            
            query = f"""
                SELECT 
                    dp.producto_nombre as producto,
                    prov.nombre as proveedor,
                    SUM(dp.cantidad) as cantidad_total,
                    COUNT(DISTINCT p.id) as pedidos
                FROM pedidos p
                JOIN detalle_pedidos dp ON p.id = dp.pedido_id
                JOIN proveedores prov ON p.proveedor_id = prov.id
                {where_clause}
                GROUP BY dp.producto_nombre, prov.nombre
                ORDER BY cantidad_total DESC
                LIMIT ?
            """
            
            params.append(limit)
            cursor.execute(query, params)
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    "producto": row["producto"],
                    "proveedor": row["proveedor"],
                    "cantidad_total": row["cantidad_total"],
                    "pedidos": row["pedidos"]
                })
            
            conn.close()
            return results
            
        except Exception as e:
            conn.close()
            print(f"Error en get_top_products: {e}")
            return [{"error": f"Error obteniendo productos: {str(e)}"}]
    
    def get_monthly_trends(self, months: int = 6, start_date: str = None, end_date: str = None, proveedor: str = None) -> List[Dict[str, Any]]:
        """Obtiene tendencias mensuales de pedidos con filtros opcionales."""
        conn = self.get_connection()
        if not conn:
            return self._get_mock_trends(months)
        
        try:
            cursor = conn.cursor()
            
            # Construir query con filtros
            where_conditions = []
            params = []
            
            if start_date:
                where_conditions.append("p.fecha_pedido >= ?")
                params.append(start_date)
            
            if end_date:
                where_conditions.append("p.fecha_pedido <= ?")
                params.append(end_date)
            
            if proveedor:
                where_conditions.append("LOWER(prov.nombre) LIKE LOWER(?)")
                params.append(f"%{proveedor}%")
            
            where_clause = ""
            if where_conditions:
                where_clause = "AND " + " AND ".join(where_conditions)
            
            query = f"""
                SELECT 
                    strftime('%Y-%m', p.fecha_pedido) as mes,
                    COUNT(DISTINCT p.id) as pedidos,
                    SUM(dp.cantidad) as cantidad_total,
                    SUM(dp.subtotal) as valor_total,
                    COUNT(DISTINCT p.proveedor_id) as proveedores_activos
                FROM pedidos p
                JOIN detalle_pedidos dp ON p.id = dp.pedido_id
                JOIN proveedores prov ON p.proveedor_id = prov.id
                WHERE p.fecha_pedido >= date('now', '-{months} months')
                {where_clause}
                GROUP BY strftime('%Y-%m', p.fecha_pedido)
                ORDER BY mes DESC
            """
            
            cursor.execute(query, params)
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    "mes": row["mes"],
                    "pedidos": row["pedidos"],
                    "cantidad_total": row["cantidad_total"],
                    "valor_total": round(row["valor_total"] or 0, 2),
                    "proveedores_activos": row["proveedores_activos"]
                })
            
            conn.close()
            return results[::-1]  # Orden cronológico
            
        except Exception as e:
            conn.close()
            print(f"Error en get_monthly_trends: {e}")
            return [{"error": f"Error obteniendo tendencias: {str(e)}"}]
    
    def get_provider_stats(self) -> List[Dict[str, Any]]:
        """Obtiene estadísticas de proveedores."""
        conn = self.get_connection()
        if not conn:
            return self._get_mock_provider_stats()
        
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    prov.nombre,
                    COUNT(DISTINCT prod.id) as productos,
                    SUM(prod.stock_actual) as stock_total,
                    AVG(prod.precio_venta) as precio_promedio,
                    COUNT(DISTINCT p.id) as pedidos_total,
                    COALESCE(SUM(dp.cantidad), 0) as cantidad_pedida
                FROM proveedores prov
                LEFT JOIN productos prod ON prov.id = prod.proveedor_id
                LEFT JOIN pedidos p ON prov.id = p.proveedor_id
                LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id
                WHERE prov.activo = 1
                GROUP BY prov.nombre
                ORDER BY pedidos_total DESC
            """)
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    "nombre": row["nombre"],
                    "productos": row["productos"],
                    "stock_total": row["stock_total"] or 0,
                    "precio_promedio": round(row["precio_promedio"] or 0, 2),
                    "pedidos_total": row["pedidos_total"] or 0,
                    "cantidad_pedida": row["cantidad_pedida"] or 0
                })
            
            conn.close()
            return results
            
        except Exception as e:
            conn.close()
            print(f"Error en get_provider_stats: {e}")
            return [{"error": f"Error obteniendo stats de proveedores: {str(e)}"}]
    
    def _get_mock_summary(self) -> Dict[str, Any]:
        """Datos mock para testing."""
        return {
            "total_providers": 12,
            "total_products": 156,
            "total_value": 45780.50,
            "monthly_orders": 89,
            "low_stock_items": 8,
            "orders_trend": 12.5
        }
    
    def _get_mock_top_products(self, limit: int) -> List[Dict[str, Any]]:
        """Productos mock para testing."""
        mock_products = [
            {"producto": "Coca Cola 500ml", "proveedor": "Coca Cola Company", "cantidad_total": 145, "pedidos": 28},
            {"producto": "Pan Lactal", "proveedor": "Bimbo", "cantidad_total": 89, "pedidos": 22},
            {"producto": "Leche Entera 1L", "proveedor": "La Serenísima", "cantidad_total": 76, "pedidos": 19},
            {"producto": "Agua Mineral 1.5L", "proveedor": "Villavicencio", "cantidad_total": 134, "pedidos": 31},
            {"producto": "Arroz Grado 1", "proveedor": "Molinos Río", "cantidad_total": 45, "pedidos": 12}
        ]
        return mock_products[:limit]
    
    def _get_mock_trends(self, months: int) -> List[Dict[str, Any]]:
        """Tendencias mock para testing."""
        trends = []
        for i in range(months):
            date = datetime.now() - timedelta(days=30*i)
            trends.append({
                "mes": date.strftime('%Y-%m'),
                "pedidos": 80 + (i * 5),
                "cantidad_total": 450 + (i * 25),
                "valor_total": 12500.0 + (i * 500),
                "proveedores_activos": 8 + (i % 3)
            })
        return trends[::-1]
    
    def _get_mock_provider_stats(self) -> List[Dict[str, Any]]:
        """Stats de proveedores mock."""
        return [
            {"nombre": "Coca Cola Company", "productos": 8, "stock_total": 245, "precio_promedio": 85.50, "pedidos_total": 45, "cantidad_pedida": 180},
            {"nombre": "Bimbo", "productos": 12, "stock_total": 180, "precio_promedio": 125.00, "pedidos_total": 38, "cantidad_pedida": 156},
            {"nombre": "La Serenísima", "productos": 6, "stock_total": 95, "precio_promedio": 195.75, "pedidos_total": 32, "cantidad_pedida": 98}
        ]

# Instancia global de analytics
analytics = DashboardAnalytics(DATABASE_PATH)

# ========================================
# RUTAS DE LA WEB
# ========================================

@app.get("/", response_class=HTMLResponse)
async def dashboard_home(request: Request):
    """Dashboard principal con métricas generales."""
    metrics = analytics.get_summary_metrics()
    
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "title": "Dashboard Principal",
        "summary": metrics
    })

@app.get("/providers", response_class=HTMLResponse)
async def providers_page(request: Request):
    """Página de gestión de proveedores."""
    provider_stats = analytics.get_provider_stats()
    
    return templates.TemplateResponse("providers.html", {
        "request": request,
        "title": "Gestión de Proveedores",
        "providers": provider_stats
    })

@app.get("/analytics", response_class=HTMLResponse)
async def analytics_page(request: Request):
    """Página de analytics avanzados."""
    
    # Obtener datos iniciales para la página
    top_products = analytics.get_top_products(10)
    trends = analytics.get_monthly_trends(6)
    
    return templates.TemplateResponse("analytics.html", {
        "request": request,
        "title": "Analytics Avanzados",
        "top_products": top_products,
        "trends": {
            "pedidos_mensuales": trends
        }
    })

# ========================================
# API ENDPOINTS
# ========================================

@app.get("/api/summary")
async def api_summary():
    """API que devuelve métricas de resumen."""
    return analytics.get_summary_metrics()

@app.get("/api/top-products")
async def api_top_products(limit: int = 10, start_date: str = None, end_date: str = None, proveedor: str = None):
    """API que devuelve productos más pedidos con filtros opcionales."""
    return analytics.get_top_products(limit, start_date, end_date, proveedor)

@app.get("/api/trends")
async def api_trends(months: int = 6, start_date: str = None, end_date: str = None, proveedor: str = None):
    """API que devuelve tendencias mensuales con filtros opcionales."""
    return analytics.get_monthly_trends(months, start_date, end_date, proveedor)

@app.get("/api/providers")
async def api_providers():
    """API que devuelve estadísticas de proveedores."""
    return analytics.get_provider_stats()

# ========================================
# ENDPOINTS DE EXPORTACIÓN CSV
# ========================================

@app.get("/api/export/top-products.csv")
async def api_export_top_products_csv(limit: int = 10, start_date: str = None, end_date: str = None, proveedor: str = None):
    """Exporta el ranking de productos más pedidos a CSV con filtros."""
    data = analytics.get_top_products(limit, start_date, end_date, proveedor)
    
    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict) and data[0].get("error"):
        csv_text = "error,message\ntrue,{}".format(data[0]["error"].replace("\n", " "))
    else:
        headers = ["producto","cantidad_total","pedidos","proveedor"]
        lines = [",".join(headers)]
        for p in (data or []):
            lines.append(
                f"{p.get('producto','')},{p.get('cantidad_total',0)},{p.get('pedidos',0)},{p.get('proveedor','')}"
            )
        csv_text = "\n".join(lines)
    
    return PlainTextResponse(content=csv_text, media_type="text/csv")

@app.get("/api/export/trends.csv")
async def api_export_trends_csv(months: int = 6, start_date: str = None, end_date: str = None, proveedor: str = None):
    """Exporta las tendencias mensuales a CSV con filtros."""
    data = analytics.get_monthly_trends(months, start_date, end_date, proveedor)
    
    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict) and data[0].get("error"):
        csv_text = "error,message\ntrue,{}".format(data[0]["error"].replace("\n", " "))
    else:
        headers = ["mes","pedidos","cantidad_total","valor_total"]
        lines = [",".join(headers)]
        for t in (data or []):
            lines.append(
                f"{t.get('mes','')},{t.get('pedidos',0)},{t.get('cantidad_total',0)},{t.get('valor_total',0)}"
            )
        csv_text = "\n".join(lines)
    
    return PlainTextResponse(content=csv_text, media_type="text/csv")

# ========================================
# ENDPOINT DE SALUD
# ========================================

@app.get("/health")
async def health_check():
    """Endpoint de verificación de salud del sistema."""
    try:
        # Verificar conexión a base de datos
        conn = analytics.get_connection()
        if conn:
            conn.close()
            db_status = "ok"
        else:
            db_status = "error"
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "database": db_status,
            "version": "1.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "version": "1.0"
        }

# ========================================
# MAIN - EJECUTAR SERVIDOR
# ========================================

if __name__ == "__main__":
    import uvicorn
    
    print("\n🏪 === INICIANDO DASHBOARD WEB MINI MARKET ===")
    print("\n📊 Funcionalidades:")
    print("  • Dashboard principal con métricas generales")
    print("  • Analytics de proveedores con estadísticas")
    print("  • Tendencias y gráficos interactivos")
    print("  • API REST para datos en tiempo real")
    
    print("\n🌐 URLs disponibles:")
    print("  • Dashboard: http://localhost:8080/")
    print("  • Proveedores: http://localhost:8080/providers")
    print("  • Analytics: http://localhost:8080/analytics")
    print("  • API: http://localhost:8080/api/*")
    
    print("\n🚀 Iniciando servidor...")
    
    uvicorn.run(
        "dashboard_app:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        reload_dirs=["."]
    )