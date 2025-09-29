#!/usr/bin/env python3
"""
Script para probar las optimizaciones retail implementadas
Ejecuta tests básicos sin dependencias externas complejas
"""

import sys
import os
import tempfile
import sqlite3
import logging
from decimal import Decimal
from datetime import date

# Agregar paths necesarios
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from shared.retail_validation import (
    MovimientoStock, ProductoRetail, TransferenciaDeposito,
    validar_stock_suficiente, calcular_precio_con_inflacion
)

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def test_retail_validations():
    """Test básico de validaciones retail"""
    logger.info("🧪 Testing retail validations...")
    
    try:
        # Test MovimientoStock
        movimiento = MovimientoStock(
            producto_id=1,
            cantidad=10,
            tipo="ENTRADA",
            deposito_id=1,
            motivo="Test de validación",
            usuario_id=1
        )
        assert movimiento.cantidad == 10
        logger.info("✅ MovimientoStock validation passed")
        
        # Test ProductoRetail
        producto = ProductoRetail(
            nombre="Coca Cola 500ml",
            codigo_barras="7790895000805",  # EAN válido
            precio_ars=Decimal("350.50"),
            categoria="Bebidas"
        )
        assert producto.precio_ars == Decimal("350.50")
        logger.info("✅ ProductoRetail validation passed")
        
        # Test TransferenciaDeposito
        transferencia = TransferenciaDeposito(
            producto_id=1,
            cantidad=5,
            deposito_origen_id=1,
            deposito_destino_id=2
        )
        assert transferencia.deposito_origen_id != transferencia.deposito_destino_id
        logger.info("✅ TransferenciaDeposito validation passed")
        
        # Test validación de stock
        assert validar_stock_suficiente(100, 50, "Test Product") == True
        logger.info("✅ Stock validation function passed")
        
        # Test cálculo inflación
        precio_ajustado = calcular_precio_con_inflacion(Decimal("100.00"), 5.0, 3)
        expected = Decimal("115.76")
        assert abs(precio_ajustado - expected) < Decimal("0.01")
        logger.info("✅ Inflation calculation passed")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Retail validation test failed: {e}")
        return False


def test_sqlite_optimizations():
    """Test aplicación de optimizaciones SQLite"""
    logger.info("🧪 Testing SQLite optimizations...")
    
    try:
        # Crear base de datos temporal
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp_file:
            db_path = tmp_file.name
        
        try:
            conn = sqlite3.connect(db_path)
            
            # Aplicar pragmas de optimización
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA foreign_keys=ON")  
            conn.execute("PRAGMA cache_size=-64000")
            conn.execute("PRAGMA synchronous=NORMAL")
            conn.execute("PRAGMA temp_store=MEMORY")
            
            # Verificar configuraciones
            result = conn.execute("PRAGMA journal_mode").fetchone()
            assert result[0].lower() == "wal"
            
            result = conn.execute("PRAGMA foreign_keys").fetchone()
            assert result[0] == 1
            
            result = conn.execute("PRAGMA cache_size").fetchone()
            assert result[0] == -64000
            
            logger.info("✅ SQLite pragmas applied successfully")
            
            # Crear tablas de ejemplo retail
            conn.execute("""
                CREATE TABLE productos (
                    id INTEGER PRIMARY KEY,
                    nombre TEXT NOT NULL,
                    codigo_barras TEXT,
                    precio_ars DECIMAL(10,2),
                    categoria TEXT,
                    stock_actual INTEGER DEFAULT 0,
                    stock_minimo INTEGER DEFAULT 0,
                    activo INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.execute("""
                CREATE TABLE movimientos_stock (
                    id INTEGER PRIMARY KEY,
                    producto_id INTEGER REFERENCES productos(id),
                    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
                    tipo_movimiento TEXT NOT NULL,
                    motivo TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Crear índices específicos retail
            indices_retail = [
                "CREATE INDEX idx_productos_ean ON productos(codigo_barras) WHERE codigo_barras IS NOT NULL",
                "CREATE INDEX idx_productos_categoria ON productos(categoria) WHERE activo = 1",
                "CREATE INDEX idx_productos_stock_bajo ON productos(stock_actual, stock_minimo) WHERE stock_actual <= stock_minimo AND activo = 1",
                "CREATE INDEX idx_movimientos_producto_fecha ON movimientos_stock(producto_id, created_at DESC)",
                "CREATE INDEX idx_movimientos_tipo ON movimientos_stock(tipo_movimiento, created_at DESC)"
            ]
            
            for indice in indices_retail:
                conn.execute(indice)
            
            # Verificar índices creados
            result = conn.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='index' AND name LIKE 'idx_%'
            """).fetchall()
            
            indices_creados = [row[0] for row in result]
            assert len(indices_creados) >= 5
            logger.info(f"✅ Created {len(indices_creados)} retail-specific indexes")
            
            # Test trigger para prevenir stock negativo
            conn.execute("""
                CREATE TRIGGER trg_prevent_negative_stock
                BEFORE UPDATE OF stock_actual ON productos
                FOR EACH ROW
                WHEN NEW.stock_actual < 0
                BEGIN
                  SELECT RAISE(ABORT, 'Stock no puede ser negativo');
                END
            """)
            
            # Insertar datos de prueba
            conn.execute("""
                INSERT INTO productos (nombre, codigo_barras, precio_ars, categoria, stock_actual, stock_minimo)
                VALUES ('Coca Cola 500ml', '7790895000805', 350.50, 'Bebidas', 100, 10)
            """)
            
            # Test trigger funcionando
            try:
                conn.execute("UPDATE productos SET stock_actual = -5 WHERE id = 1")
                conn.commit()
                assert False, "Trigger should have prevented negative stock"
            except sqlite3.IntegrityError as e:
                assert "Stock no puede ser negativo" in str(e)
                logger.info("✅ Negative stock prevention trigger working")
            
            conn.close()
            logger.info("✅ SQLite optimizations test passed")
            return True
            
        finally:
            # Limpiar archivo temporal
            if os.path.exists(db_path):
                os.unlink(db_path)
                
    except Exception as e:
        logger.error(f"❌ SQLite optimization test failed: {e}")
        return False


def test_database_optimization_script():
    """Test script de optimización de bases de datos"""
    logger.info("🧪 Testing database optimization script...")
    
    try:
        from scripts.optimization.apply_database_optimizations import DatabaseOptimizer
        
        # Crear instancia del optimizador
        optimizer = DatabaseOptimizer(project_root)
        
        # Verificar que paths de configuración existen
        config_path = optimizer.config_path
        assert config_path.exists(), f"Config path not found: {config_path}"
        
        # Verificar archivos de configuración específicos
        sqlite_config = config_path / "inventario_sqlite_pragmas.sql"
        assert sqlite_config.exists(), f"SQLite config not found: {sqlite_config}"
        
        bi_config = config_path / "bi_postgresql_indices.sql"
        assert bi_config.exists(), f"BI PostgreSQL config not found: {bi_config}"
        
        deposito_config = config_path / "deposito_postgresql_optimizations.sql"
        assert deposito_config.exists(), f"Deposito PostgreSQL config not found: {deposito_config}"
        
        logger.info("✅ Database optimization script structure validated")
        
        # Test configuración SQLite sin base de datos real
        sqlite_stats = optimizer._verify_sqlite_optimizations("/tmp/nonexistent.db")
        assert "error" in sqlite_stats  # Esperamos error por DB inexistente
        
        logger.info("✅ Database optimization script test passed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Database optimization script test failed: {e}")
        return False


def test_configuration_files():
    """Test integridad de archivos de configuración"""
    logger.info("🧪 Testing configuration files...")
    
    try:
        config_dir = os.path.join(project_root, "config", "database")
        
        # Verificar archivos de configuración
        configs = [
            "inventario_sqlite_pragmas.sql",
            "bi_postgresql_indices.sql", 
            "deposito_postgresql_optimizations.sql"
        ]
        
        for config_file in configs:
            config_path = os.path.join(config_dir, config_file)
            assert os.path.exists(config_path), f"Config file not found: {config_path}"
            
            # Verificar que no esté vacío
            with open(config_path, 'r') as f:
                content = f.read().strip()
                assert len(content) > 0, f"Config file is empty: {config_file}"
                
            logger.info(f"✅ Config file validated: {config_file}")
        
        # Verificar dashboard de métricas
        dashboard_path = os.path.join(project_root, "monitoring", "dashboards", "retail_dashboard.json")
        assert os.path.exists(dashboard_path), f"Dashboard config not found: {dashboard_path}"
        
        with open(dashboard_path, 'r') as f:
            import json
            dashboard_config = json.load(f)
            assert "dashboard" in dashboard_config
            assert "panels" in dashboard_config["dashboard"]
            
        logger.info("✅ Dashboard configuration validated")
        logger.info("✅ Configuration files test passed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Configuration files test failed: {e}")
        return False


def main():
    """Ejecutar todos los tests de optimización retail"""
    logger.info("🚀 Starting retail optimizations test suite...")
    logger.info(f"📁 Project root: {project_root}")
    
    tests = [
        ("Retail Validations", test_retail_validations),
        ("SQLite Optimizations", test_sqlite_optimizations),
        ("Database Optimization Script", test_database_optimization_script),
        ("Configuration Files", test_configuration_files)
    ]
    
    results = {}
    for test_name, test_func in tests:
        logger.info(f"\n{'='*50}")
        logger.info(f"Running: {test_name}")
        logger.info(f"{'='*50}")
        
        try:
            result = test_func()
            results[test_name] = result
        except Exception as e:
            logger.error(f"❌ Test {test_name} crashed: {e}")
            results[test_name] = False
    
    # Resumen final
    logger.info(f"\n{'='*50}")
    logger.info("📊 TEST RESULTS SUMMARY")
    logger.info(f"{'='*50}")
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        logger.info(f"{test_name}: {status}")
    
    logger.info(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("🎉 All retail optimizations are working correctly!")
        return 0
    else:
        logger.error("💥 Some retail optimizations need attention")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)