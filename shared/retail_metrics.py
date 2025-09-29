"""
Sistema de métricas específicas para retail argentino
Implementa métricas de negocio críticas y observabilidad técnica
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta, date
from dataclasses import dataclass
from decimal import Decimal
from enum import Enum

try:
    from prometheus_client import Counter, Histogram, Gauge, Info, CollectorRegistry, generate_latest
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    logging.warning("Prometheus client not available. Metrics will be logged only.")


logger = logging.getLogger(__name__)


class AlertLevel(Enum):
    """Niveles de alerta para métricas"""
    INFO = "info"
    WARNING = "warning"  
    CRITICAL = "critical"
    EMERGENCY = "emergency"


@dataclass
class RetailMetric:
    """Métrica de retail con metadata"""
    name: str
    value: float
    labels: Dict[str, str]
    timestamp: datetime
    alert_level: Optional[AlertLevel] = None
    description: Optional[str] = None


class RetailMetricsCollector:
    """
    Colector de métricas específicas para el dominio retail argentino
    """
    
    def __init__(self, db_session_factory, registry=None):
        self.db_session_factory = db_session_factory
        self.registry = registry or CollectorRegistry() if PROMETHEUS_AVAILABLE else None
        self._setup_prometheus_metrics()
        
    def _setup_prometheus_metrics(self):
        """Configurar métricas Prometheus específicas del retail"""
        if not PROMETHEUS_AVAILABLE:
            return
            
        # Métricas técnicas específicas
        self.stock_operations = Counter(
            'retail_stock_operations_total',
            'Total stock operations',
            ['operation_type', 'deposito_id', 'result', 'categoria'],
            registry=self.registry
        )
        
        self.ocr_processing_time = Histogram(
            'retail_ocr_processing_seconds',
            'OCR processing time distribution',
            ['ocr_type', 'success', 'confidence_level'],
            buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
            registry=self.registry
        )
        
        self.api_response_time = Histogram(
            'retail_api_response_seconds',
            'API response time distribution',
            ['endpoint', 'method', 'status_code', 'submódulo'],
            buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
            registry=self.registry
        )
        
        # Métricas de negocio retail específicas
        self.current_stock_value = Gauge(
            'retail_stock_value_total_ars',
            'Total inventory value in ARS',
            ['deposito_id', 'categoria', 'currency'],
            registry=self.registry
        )
        
        self.low_stock_items = Gauge(
            'retail_low_stock_items_count',
            'Number of items with low stock',
            ['categoria', 'criticality', 'deposito_id'],
            registry=self.registry
        )
        
        self.daily_sales_volume = Gauge(
            'retail_daily_sales_volume_ars',
            'Daily sales volume in ARS',
            ['deposito_id', 'categoria', 'date'],
            registry=self.registry
        )
        
        self.inventory_turnover_rate = Gauge(
            'retail_inventory_turnover_rate',
            'Inventory turnover rate by category',
            ['categoria', 'deposito_id', 'period'],
            registry=self.registry
        )
        
        # Métricas específicas contexto argentino
        self.price_inflation_impact = Gauge(
            'retail_price_inflation_impact_percent',
            'Price inflation impact percentage',
            ['categoria', 'periodo', 'tipo_inflacion'],
            registry=self.registry
        )
        
        self.afip_compliance_status = Gauge(
            'retail_afip_compliance_status',
            'AFIP compliance status (1=compliant, 0=non-compliant)',
            ['tipo_comprobante', 'deposito_id'],
            registry=self.registry
        )
        
        # Métricas de calidad OCR
        self.ocr_confidence_distribution = Histogram(
            'retail_ocr_confidence_distribution',
            'Distribution of OCR confidence scores',
            ['documento_tipo', 'resultado'],
            buckets=[0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 0.95, 0.99, 1.0],
            registry=self.registry
        )

        # Info metrics para metadata
        self.system_info = Info(
            'retail_system_info',
            'Information about the retail system',
            registry=self.registry
        )
        
        # Configurar info inicial
        self.system_info.info({
            'version': '1.0.0',
            'country': 'argentina',
            'currency': 'ARS',
            'system_type': 'multi_agent_retail',
            'modules': 'inventario,bi_orchestrator,deposito'
        })
    
    async def record_stock_operation(self, operation_type: str, deposito_id: int, 
                                   categoria: str, success: bool, **kwargs):
        """Registrar operación de stock"""
        if PROMETHEUS_AVAILABLE:
            result = "success" if success else "error"
            self.stock_operations.labels(
                operation_type=operation_type,
                deposito_id=str(deposito_id),
                result=result,
                categoria=categoria
            ).inc()
        
        logger.info(f"Stock operation recorded: {operation_type}, {result}, {categoria}")
    
    async def record_ocr_processing(self, processing_time: float, ocr_type: str, 
                                  success: bool, confidence: float):
        """Registrar procesamiento OCR"""
        if PROMETHEUS_AVAILABLE:
            confidence_level = self._get_confidence_level(confidence)
            self.ocr_processing_time.labels(
                ocr_type=ocr_type,
                success=str(success).lower(),
                confidence_level=confidence_level
            ).observe(processing_time)
            
            self.ocr_confidence_distribution.labels(
                documento_tipo=ocr_type,
                resultado="success" if success else "error"
            ).observe(confidence)
        
        logger.info(f"OCR processing recorded: {processing_time:.2f}s, confidence: {confidence:.2%}")
    
    async def record_api_call(self, endpoint: str, method: str, status_code: int, 
                            response_time: float, submódulo: str):
        """Registrar llamada API"""
        if PROMETHEUS_AVAILABLE:
            self.api_response_time.labels(
                endpoint=endpoint,
                method=method,
                status_code=str(status_code),
                submódulo=submódulo
            ).observe(response_time)
    
    async def calculate_stock_metrics(self) -> Dict[str, Any]:
        """Calcular métricas específicas de stock retail"""
        metrics = {}
        
        try:
            async with self.db_session_factory() as session:
                # Valor total del inventario por categoría y depósito
                result = await session.execute("""
                    SELECT 
                        deposito_id,
                        categoria,
                        SUM(stock_actual * precio_ars) as valor_total,
                        COUNT(*) as total_productos,
                        COUNT(CASE WHEN stock_actual <= stock_minimo THEN 1 END) as productos_stock_bajo
                    FROM productos 
                    WHERE activo = 1 AND precio_ars > 0
                    GROUP BY deposito_id, categoria
                """)
                
                for row in result:
                    deposito_id = str(row.deposito_id)
                    categoria = row.categoria
                    
                    # Actualizar métricas Prometheus
                    if PROMETHEUS_AVAILABLE:
                        self.current_stock_value.labels(
                            deposito_id=deposito_id,
                            categoria=categoria,
                            currency="ARS"
                        ).set(float(row.valor_total or 0))
                        
                        # Clasificar criticidad del stock bajo
                        criticality = "CRITICO" if row.productos_stock_bajo > row.total_productos * 0.2 else "NORMAL"
                        self.low_stock_items.labels(
                            categoria=categoria,
                            criticality=criticality,
                            deposito_id=deposito_id
                        ).set(row.productos_stock_bajo or 0)
                    
                    # Agregar a métricas calculadas
                    key = f"{deposito_id}_{categoria}"
                    metrics[f"stock_value_{key}"] = float(row.valor_total or 0)
                    metrics[f"low_stock_items_{key}"] = row.productos_stock_bajo or 0
                    metrics[f"total_products_{key}"] = row.total_productos or 0
                
                logger.info(f"Stock metrics calculated for {len(metrics)} combinations")
                
        except Exception as e:
            logger.error(f"Error calculating stock metrics: {e}")
            metrics["error"] = str(e)
        
        return metrics
    
    async def calculate_business_metrics(self) -> Dict[str, Any]:
        """Calcular métricas de negocio retail específicas"""
        metrics = {}
        
        try:
            async with self.db_session_factory() as session:
                # Rotación de inventario por categoría (últimos 30 días)
                result = await session.execute("""
                    SELECT 
                        p.categoria,
                        p.deposito_id,
                        AVG(p.stock_actual) as stock_promedio,
                        SUM(CASE WHEN m.tipo_movimiento = 'SALIDA' THEN m.cantidad ELSE 0 END) as ventas_30d
                    FROM productos p
                    LEFT JOIN movimientos_stock m ON p.id = m.producto_id 
                        AND m.created_at >= date('now', '-30 days')
                    WHERE p.activo = 1
                    GROUP BY p.categoria, p.deposito_id
                    HAVING stock_promedio > 0
                """)
                
                for row in result:
                    deposito_id = str(row.deposito_id)
                    categoria = row.categoria
                    
                    # Calcular tasa de rotación (ventas/stock promedio)
                    turnover_rate = (row.ventas_30d or 0) / (row.stock_promedio or 1)
                    
                    if PROMETHEUS_AVAILABLE:
                        self.inventory_turnover_rate.labels(
                            categoria=categoria,
                            deposito_id=deposito_id,
                            period="30d"
                        ).set(turnover_rate)
                    
                    metrics[f"turnover_rate_{deposito_id}_{categoria}"] = turnover_rate
                
                # Ventas diarias por categoría
                today = date.today()
                result = await session.execute("""
                    SELECT 
                        p.categoria,
                        p.deposito_id,
                        SUM(m.cantidad * p.precio_ars) as ventas_diarias
                    FROM movimientos_stock m
                    JOIN productos p ON m.producto_id = p.id
                    WHERE m.tipo_movimiento = 'SALIDA' 
                        AND date(m.created_at) = :today
                    GROUP BY p.categoria, p.deposito_id
                """, {"today": today})
                
                for row in result:
                    deposito_id = str(row.deposito_id)
                    categoria = row.categoria
                    ventas = float(row.ventas_diarias or 0)
                    
                    if PROMETHEUS_AVAILABLE:
                        self.daily_sales_volume.labels(
                            deposito_id=deposito_id,
                            categoria=categoria,
                            date=today.isoformat()
                        ).set(ventas)
                    
                    metrics[f"daily_sales_{deposito_id}_{categoria}"] = ventas
                
        except Exception as e:
            logger.error(f"Error calculating business metrics: {e}")
            metrics["error"] = str(e)
        
        return metrics
    
    async def calculate_inflation_impact(self) -> Dict[str, Any]:
        """Calcular impacto de inflación en precios (específico Argentina)"""
        metrics = {}
        
        try:
            async with self.db_session_factory() as session:
                # Análisis de aumentos de precio en últimos 90 días
                result = await session.execute("""
                    SELECT 
                        p.categoria,
                        COUNT(*) as productos_actualizados,
                        AVG((hp.precio_nuevo - hp.precio_anterior) / hp.precio_anterior * 100) as inflacion_promedio
                    FROM historial_precios hp
                    JOIN productos p ON hp.producto_id = p.id
                    WHERE hp.fecha_cambio >= date('now', '-90 days')
                        AND hp.precio_anterior > 0
                    GROUP BY p.categoria
                """)
                
                for row in result:
                    categoria = row.categoria
                    inflacion_pct = float(row.inflacion_promedio or 0)
                    
                    if PROMETHEUS_AVAILABLE:
                        self.price_inflation_impact.labels(
                            categoria=categoria,
                            periodo="90d",
                            tipo_inflacion="precio_productos"
                        ).set(inflacion_pct)
                    
                    # Generar alerta si inflación > 20% en 90 días
                    alert_level = None
                    if inflacion_pct > 30:
                        alert_level = AlertLevel.CRITICAL
                    elif inflacion_pct > 20:
                        alert_level = AlertLevel.WARNING
                    
                    metrics[f"inflation_impact_{categoria}"] = {
                        "percentage": inflacion_pct,
                        "products_updated": row.productos_actualizados,
                        "alert_level": alert_level.value if alert_level else None
                    }
                
        except Exception as e:
            logger.error(f"Error calculating inflation impact: {e}")
            metrics["error"] = str(e)
        
        return metrics
    
    async def generate_retail_alerts(self) -> List[Dict[str, Any]]:
        """Generar alertas específicas del retail"""
        alerts = []
        
        try:
            async with self.db_session_factory() as session:
                # Productos con stock crítico (< 3 días de venta)
                result = await session.execute("""
                    SELECT 
                        p.id,
                        p.nombre,
                        p.categoria,
                        p.stock_actual,
                        p.stock_minimo,
                        AVG(CASE WHEN m.tipo_movimiento = 'SALIDA' THEN m.cantidad ELSE 0 END) as venta_diaria_promedio
                    FROM productos p
                    LEFT JOIN movimientos_stock m ON p.id = m.producto_id 
                        AND m.created_at >= date('now', '-7 days')
                    WHERE p.activo = 1 AND p.stock_actual > 0
                    GROUP BY p.id, p.nombre, p.categoria, p.stock_actual, p.stock_minimo
                    HAVING venta_diaria_promedio > 0 
                        AND (p.stock_actual / venta_diaria_promedio) < 3
                """)
                
                for row in result:
                    dias_stock = row.stock_actual / (row.venta_diaria_promedio or 1)
                    alerts.append({
                        "type": "STOCK_CRITICO",
                        "level": AlertLevel.WARNING.value,
                        "producto_id": row.id,
                        "producto_nombre": row.nombre,
                        "categoria": row.categoria,
                        "stock_actual": row.stock_actual,
                        "dias_stock_restante": round(dias_stock, 1),
                        "mensaje": f"Producto {row.nombre} tiene stock para {dias_stock:.1f} días"
                    })
                
                # Productos sin movimiento en 30 días
                result = await session.execute("""
                    SELECT p.id, p.nombre, p.categoria, p.stock_actual
                    FROM productos p
                    WHERE p.activo = 1 
                        AND p.stock_actual > 0
                        AND NOT EXISTS (
                            SELECT 1 FROM movimientos_stock m 
                            WHERE m.producto_id = p.id 
                                AND m.created_at >= date('now', '-30 days')
                        )
                """)
                
                for row in result:
                    alerts.append({
                        "type": "PRODUCTO_SIN_MOVIMIENTO", 
                        "level": AlertLevel.INFO.value,
                        "producto_id": row.id,
                        "producto_nombre": row.nombre,
                        "categoria": row.categoria,
                        "stock_actual": row.stock_actual,
                        "mensaje": f"Producto {row.nombre} sin movimientos hace 30+ días"
                    })
                
        except Exception as e:
            logger.error(f"Error generating retail alerts: {e}")
            alerts.append({
                "type": "SYSTEM_ERROR",
                "level": AlertLevel.CRITICAL.value,
                "mensaje": f"Error generando alertas: {e}"
            })
        
        return alerts
    
    async def export_metrics_prometheus(self) -> str:
        """Exportar métricas en formato Prometheus"""
        if not PROMETHEUS_AVAILABLE:
            return "# Prometheus client not available\n"
        
        # Calcular métricas actuales
        await self.calculate_stock_metrics()
        await self.calculate_business_metrics()
        await self.calculate_inflation_impact()
        
        return generate_latest(self.registry)
    
    def _get_confidence_level(self, confidence: float) -> str:
        """Clasificar nivel de confianza OCR"""
        if confidence >= 0.9:
            return "high"
        elif confidence >= 0.7:
            return "medium"
        elif confidence >= 0.5:
            return "low"
        else:
            return "very_low"
    
    async def get_dashboard_summary(self) -> Dict[str, Any]:
        """Generar resumen para dashboard"""
        try:
            stock_metrics = await self.calculate_stock_metrics()
            business_metrics = await self.calculate_business_metrics()
            inflation_metrics = await self.calculate_inflation_impact()
            alerts = await self.generate_retail_alerts()
            
            return {
                "timestamp": datetime.now().isoformat(),
                "stock": stock_metrics,
                "business": business_metrics,
                "inflation": inflation_metrics,
                "alerts": {
                    "total": len(alerts),
                    "critical": len([a for a in alerts if a["level"] == "critical"]),
                    "warning": len([a for a in alerts if a["level"] == "warning"]),
                    "items": alerts[:10]  # Primeras 10 alertas
                },
                "system_status": "healthy" if not any(a["level"] == "critical" for a in alerts) else "degraded"
            }
            
        except Exception as e:
            logger.error(f"Error generating dashboard summary: {e}")
            return {
                "timestamp": datetime.now().isoformat(),
                "error": str(e),
                "system_status": "error"
            }


# Factory function
def create_retail_metrics_collector(db_session_factory, registry=None) -> RetailMetricsCollector:
    """Factory para crear collector de métricas retail"""
    return RetailMetricsCollector(db_session_factory, registry)


# Constantes de configuración
METRICS_COLLECTION_INTERVAL = 60  # segundos
ALERT_CHECK_INTERVAL = 300  # 5 minutos
STOCK_CRITICAL_DAYS = 3  # días de stock crítico
INFLATION_ALERT_THRESHOLD = 20.0  # porcentaje en 90 días