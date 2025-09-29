"""
Tests de integración para validar optimizaciones retail específicas
Valida que las optimizaciones funcionen sin romper APIs existentes
"""

import pytest
import asyncio
import tempfile
import sqlite3
import os
from decimal import Decimal
from datetime import datetime, date
from unittest.mock import Mock, AsyncMock, patch

# Importar las clases que creamos
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from shared.retail_validation import (
    MovimientoStock, ProductoRetail, TransferenciaDeposito, 
    FacturaOCR, validar_stock_suficiente, calcular_precio_con_inflacion
)
from shared.retail_transactions import RetailStockService, CircuitBreaker, CircuitBreakerConfig
from shared.retail_metrics import RetailMetricsCollector, AlertLevel


class TestRetailValidations:
    """Tests para validaciones del dominio retail"""
    
    def test_movimiento_stock_validacion_positiva(self):
        """Test validación cantidad positiva en movimientos"""
        # Caso válido
        movimiento = MovimientoStock(
            producto_id=1,
            cantidad=10,
            tipo="ENTRADA",
            deposito_id=1,
            motivo="Reposición stock",
            usuario_id=1
        )
        assert movimiento.cantidad == 10
        
        # Caso inválido - cantidad negativa
        with pytest.raises(ValueError, match="Cantidad debe ser mayor a cero"):
            MovimientoStock(
                producto_id=1,
                cantidad=-5,
                tipo="ENTRADA", 
                deposito_id=1,
                motivo="Test",
                usuario_id=1
            )
        
        # Caso inválido - cantidad excesiva
        with pytest.raises(ValueError, match="excede límite máximo"):
            MovimientoStock(
                producto_id=1,
                cantidad=1000000,
                tipo="ENTRADA",
                deposito_id=1,
                motivo="Test",
                usuario_id=1
            )
    
    def test_producto_retail_codigo_barras_ean13(self):
        """Test validación códigos EAN-13"""
        # EAN-13 válido (Coca Cola ejemplo)
        producto = ProductoRetail(
            nombre="Coca Cola 500ml",
            codigo_barras="7790895000805",  # EAN-13 con checksum válido
            precio_ars=Decimal("350.50"),
            categoria="Bebidas"
        )
        assert producto.codigo_barras == "7790895000805"
        
        # Código inválido
        with pytest.raises(ValueError, match="Código de barras debe ser EAN-13"):
            ProductoRetail(
                nombre="Producto Test",
                codigo_barras="123",  # Muy corto
                precio_ars=Decimal("100.00"),
                categoria="Almacén"
            )
    
    def test_precio_argentino_validacion(self):
        """Test validación precios en contexto argentino"""
        # Precio válido
        producto = ProductoRetail(
            nombre="Dulce de Leche",
            precio_ars=Decimal("450.99"),
            categoria="Lacteos"
        )
        assert producto.precio_ars == Decimal("450.99")
        
        # Precio muy bajo
        with pytest.raises(ValueError, match="Precio debe ser mayor"):
            ProductoRetail(
                nombre="Test",
                precio_ars=Decimal("0.00"),
                categoria="Test"
            )
        
        # Precio excesivo
        with pytest.raises(ValueError, match="excede límite máximo"):
            ProductoRetail(
                nombre="Test",
                precio_ars=Decimal("10000000.00"),
                categoria="Test"
            )
    
    def test_transferencia_depositos_diferentes(self):
        """Test validación depósitos diferentes en transferencias"""
        # Transferencia válida
        transferencia = TransferenciaDeposito(
            producto_id=1,
            cantidad=5,
            deposito_origen_id=1,
            deposito_destino_id=2
        )
        assert transferencia.deposito_origen_id != transferencia.deposito_destino_id
        
        # Mismo depósito origen y destino
        with pytest.raises(ValueError, match="deben ser diferentes"):
            TransferenciaDeposito(
                producto_id=1,
                cantidad=5,
                deposito_origen_id=1,
                deposito_destino_id=1
            )
    
    def test_factura_ocr_cuit_validacion(self):
        """Test validación CUIT argentino"""
        # CUIT válido
        factura = FacturaOCR(
            tipo_comprobante="FACTURA_B",
            numero_comprobante="0001-00000123",
            cuit_emisor="20-12345678-9",  # CUIT formato válido
            fecha_emision=date.today(),
            importe_total=Decimal("1500.00"),
            confianza_ocr=0.85
        )
        assert "20-12345678-9" in factura.cuit_emisor
        
        # CUIT inválido
        with pytest.raises(ValueError, match="CUIT debe tener 11 dígitos"):
            FacturaOCR(
                tipo_comprobante="FACTURA_B",
                numero_comprobante="0001-00000123",
                cuit_emisor="123456",  # Muy corto
                fecha_emision=date.today(),
                importe_total=Decimal("1500.00"),
                confianza_ocr=0.85
            )
    
    def test_validar_stock_suficiente_funcion(self):
        """Test función auxiliar de validación de stock"""
        # Stock suficiente
        assert validar_stock_suficiente(100, 50, "Producto Test") == True
        
        # Stock insuficiente
        with pytest.raises(ValueError, match="Stock insuficiente"):
            validar_stock_suficiente(10, 50, "Producto Test")
    
    def test_calculo_inflacion_argentina(self):
        """Test cálculo de precios con inflación"""
        precio_base = Decimal("100.00")
        inflacion_mensual = 5.0  # 5% mensual
        meses = 3
        
        precio_ajustado = calcular_precio_con_inflacion(precio_base, inflacion_mensual, meses)
        
        # 100 * (1.05)^3 = 115.76
        assert abs(precio_ajustado - Decimal("115.76")) < Decimal("0.01")


class TestRetailTransactions:
    """Tests para transacciones atómicas retail"""
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock de sesión de base de datos"""
        session = AsyncMock()
        session.execute = AsyncMock()
        session.commit = AsyncMock()
        session.fetchone = Mock()
        return session
    
    @pytest.fixture
    def mock_db_factory(self, mock_db_session):
        """Factory mock que retorna sesión mock"""
        async def factory():
            return mock_db_session
        return factory
    
    @pytest.fixture
    def stock_service(self, mock_db_factory):
        """Servicio de stock con mocks"""
        return RetailStockService(mock_db_factory)
    
    @pytest.mark.asyncio
    async def test_circuit_breaker_funcionamiento(self):
        """Test circuit breaker básico"""
        config = CircuitBreakerConfig(failure_threshold=2, recovery_timeout=1)
        circuit_breaker = CircuitBreaker(config)
        
        # Función que siempre falla
        async def failing_function():
            raise Exception("Test failure")
        
        # Función que siempre funciona
        async def working_function():
            return "success"
        
        # Probar fallos hasta abrir circuit
        with pytest.raises(Exception):
            await circuit_breaker.call(failing_function)
        
        with pytest.raises(Exception):
            await circuit_breaker.call(failing_function)
        
        # Circuit debería estar abierto ahora
        assert circuit_breaker.state.value == "open"
        
        # Intentar función que funciona, debería fallar por circuit abierto
        with pytest.raises(Exception, match="Circuit breaker OPEN"):
            await circuit_breaker.call(working_function)
    
    @pytest.mark.asyncio
    async def test_validar_stock_suficiente_servicio(self, stock_service, mock_db_session):
        """Test validación de stock en servicio"""
        # Mock del resultado de la consulta
        mock_result = Mock()
        mock_producto = Mock()
        mock_producto.nombre = "Producto Test"
        mock_producto.stock_actual = 100
        mock_producto.stock_minimo = 10
        mock_producto.stock_calculado = 100
        
        mock_result.fetchone.return_value = mock_producto
        mock_db_session.execute.return_value = mock_result
        
        # Test stock suficiente
        resultado = await stock_service.validar_stock_suficiente(1, 50)
        
        assert resultado["stock_suficiente"] == True
        assert resultado["stock_actual"] == 100
        assert resultado["cantidad_requerida"] == 50
        assert resultado["stock_restante"] == 50
    
    @pytest.mark.asyncio
    async def test_procesar_movimiento_stock_entrada(self, stock_service, mock_db_session):
        """Test procesamiento movimiento de entrada"""
        movimiento_data = {
            "producto_id": 1,
            "cantidad": 50,
            "tipo": "ENTRADA",
            "motivo": "Reposición",
            "usuario_id": 1
        }
        
        # Mock del stock final
        mock_result = Mock()
        mock_result.fetchone.return_value = Mock(stock_actual=150)
        mock_db_session.execute.return_value = mock_result
        
        resultado = await stock_service.procesar_movimiento_stock(movimiento_data)
        
        assert resultado["success"] == True
        assert resultado["movimiento_tipo"] == "ENTRADA"
        assert resultado["cantidad"] == 50
        assert "timestamp" in resultado


class TestRetailMetrics:
    """Tests para métricas retail"""
    
    @pytest.fixture
    def mock_db_factory(self):
        """Factory mock para métricas"""
        session = AsyncMock()
        session.execute = AsyncMock()
        
        async def factory():
            return session
        return factory
    
    @pytest.fixture  
    def metrics_collector(self, mock_db_factory):
        """Collector de métricas con mock"""
        return RetailMetricsCollector(mock_db_factory)
    
    @pytest.mark.asyncio
    async def test_calculate_stock_metrics(self, metrics_collector, mock_db_factory):
        """Test cálculo de métricas de stock"""
        # Mock de datos de stock
        mock_session = await mock_db_factory()
        mock_result = [
            Mock(deposito_id=1, categoria="Bebidas", valor_total=50000, 
                 total_productos=100, productos_stock_bajo=5),
            Mock(deposito_id=2, categoria="Lacteos", valor_total=30000,
                 total_productos=75, productos_stock_bajo=2)
        ]
        mock_session.execute.return_value = mock_result
        
        metrics = await metrics_collector.calculate_stock_metrics()
        
        assert "stock_value_1_Bebidas" in metrics
        assert "low_stock_items_1_Bebidas" in metrics
        assert metrics["stock_value_1_Bebidas"] == 50000.0
        assert metrics["low_stock_items_1_Bebidas"] == 5
    
    @pytest.mark.asyncio
    async def test_generate_retail_alerts(self, metrics_collector, mock_db_factory):
        """Test generación de alertas retail"""
        # Mock de productos con stock crítico
        mock_session = await mock_db_factory()
        mock_result = [
            Mock(id=1, nombre="Coca Cola", categoria="Bebidas", 
                 stock_actual=10, stock_minimo=5, venta_diaria_promedio=5)
        ]
        mock_session.execute.return_value = mock_result
        
        alerts = await metrics_collector.generate_retail_alerts()
        
        assert len(alerts) > 0
        assert alerts[0]["type"] == "STOCK_CRITICO"
        assert alerts[0]["level"] == "warning"
        assert "dias_stock_restante" in alerts[0]


class TestDatabaseOptimizations:
    """Tests para optimizaciones de base de datos"""
    
    def test_sqlite_pragmas_aplicacion(self):
        """Test aplicación de pragmas SQLite"""
        # Crear base de datos temporal
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp_file:
            db_path = tmp_file.name
        
        try:
            # Aplicar configuraciones SQLite
            conn = sqlite3.connect(db_path)
            
            # Aplicar pragmas básicos
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA foreign_keys=ON")
            conn.execute("PRAGMA cache_size=-64000")
            
            # Verificar configuraciones
            result = conn.execute("PRAGMA journal_mode").fetchone()
            assert result[0] == "wal"
            
            result = conn.execute("PRAGMA foreign_keys").fetchone()
            assert result[0] == 1
            
            result = conn.execute("PRAGMA cache_size").fetchone()
            assert result[0] == -64000
            
            conn.close()
            
        finally:
            # Limpiar archivo temporal
            if os.path.exists(db_path):
                os.unlink(db_path)
    
    def test_indices_retail_especificos(self):
        """Test creación de índices específicos retail"""
        # Crear base de datos temporal
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp_file:
            db_path = tmp_file.name
        
        try:
            conn = sqlite3.connect(db_path)
            
            # Crear tablas de ejemplo
            conn.execute("""
                CREATE TABLE productos (
                    id INTEGER PRIMARY KEY,
                    nombre TEXT,
                    codigo_barras TEXT,
                    precio_ars DECIMAL,
                    categoria TEXT,
                    stock_actual INTEGER,
                    activo INTEGER DEFAULT 1
                )
            """)
            
            conn.execute("""
                CREATE TABLE movimientos_stock (
                    id INTEGER PRIMARY KEY,
                    producto_id INTEGER,
                    cantidad INTEGER,
                    tipo_movimiento TEXT,
                    created_at DATETIME
                )
            """)
            
            # Crear índices específicos retail
            conn.execute("CREATE INDEX IF NOT EXISTS idx_productos_ean ON productos(codigo_barras)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_stock(producto_id, created_at DESC)")
            
            # Verificar que índices fueron creados
            result = conn.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='index' AND name LIKE 'idx_%'
            """).fetchall()
            
            index_names = [row[0] for row in result]
            assert "idx_productos_ean" in index_names
            assert "idx_productos_categoria" in index_names
            assert "idx_movimientos_producto" in index_names
            
            conn.close()
            
        finally:
            if os.path.exists(db_path):
                os.unlink(db_path)


@pytest.mark.integration
class TestRetailIntegration:
    """Tests de integración completa del sistema retail"""
    
    @pytest.mark.asyncio
    async def test_flujo_completo_movimiento_stock(self):
        """Test flujo completo: validación -> transacción -> métricas"""
        # Mock completo del sistema
        mock_db_session = AsyncMock()
        
        async def mock_db_factory():
            return mock_db_session
        
        # Configurar mocks
        mock_result = Mock()
        mock_producto = Mock()
        mock_producto.nombre = "Producto Test"
        mock_producto.stock_actual = 100
        mock_producto.stock_minimo = 10
        mock_producto.stock_calculado = 100
        mock_result.fetchone.return_value = mock_producto
        mock_db_session.execute.return_value = mock_result
        
        # Crear servicios
        stock_service = RetailStockService(mock_db_factory)
        metrics_collector = RetailMetricsCollector(mock_db_factory)
        
        # 1. Validar datos de entrada
        movimiento = MovimientoStock(
            producto_id=1,
            cantidad=20,
            tipo="SALIDA",
            deposito_id=1,
            motivo="Venta",
            usuario_id=1
        )
        assert movimiento.cantidad > 0
        
        # 2. Validar stock suficiente
        stock_info = await stock_service.validar_stock_suficiente(1, 20)
        assert stock_info["stock_suficiente"] == True
        
        # 3. Procesar movimiento
        movimiento_data = {
            "producto_id": 1,
            "cantidad": 20,
            "tipo": "SALIDA",
            "motivo": "Venta",
            "usuario_id": 1
        }
        
        # Mock para stock final
        mock_result.fetchone.return_value = Mock(stock_actual=80)
        resultado = await stock_service.procesar_movimiento_stock(movimiento_data)
        assert resultado["success"] == True
        
        # 4. Registrar métricas
        await metrics_collector.record_stock_operation("SALIDA", 1, "Test", True)
        
        # Verificar que todo el flujo se completó sin errores
        assert True  # Si llegamos aquí, el flujo completo funcionó


if __name__ == "__main__":
    # Ejecutar tests
    pytest.main([__file__, "-v"])