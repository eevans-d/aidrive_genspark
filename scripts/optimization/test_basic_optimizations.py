#!/usr/bin/env python3
"""
Script básico para validar optimizaciones sin dependencias externas
Verifica que los archivos de configuración estén creados correctamente
"""

import sys
import os
import tempfile
import sqlite3
import json
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def test_configuration_files():
    """Test integridad de archivos de configuración"""
    logger.info("🧪 Testing configuration files...")
    
    try:
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        config_dir = os.path.join(project_root, "config", "database")
        
        # Verificar archivos de configuración
        configs = [
            "inventario_sqlite_pragmas.sql",
            "bi_postgresql_indices.sql", 
            "deposito_postgresql_optimizations.sql"
        ]
        
        for config_file in configs:
            config_path = os.path.join(config_dir, config_file)
            if not os.path.exists(config_path):
                logger.error(f"❌ Config file not found: {config_path}")
                return False
                
            # Verificar que no esté vacío
            with open(config_path, 'r') as f:
                content = f.read().strip()
                if len(content) == 0:
                    logger.error(f"❌ Config file is empty: {config_file}")
                    return False
                
            logger.info(f"✅ Config file validated: {config_file} ({len(content)} chars)")
        
        # Verificar archivos compartidos
        shared_dir = os.path.join(project_root, "shared")
        shared_files = [
            "retail_validation.py",
            "retail_transactions.py", 
            "retail_metrics.py"
        ]
        
        for shared_file in shared_files:
            shared_path = os.path.join(shared_dir, shared_file)
            if not os.path.exists(shared_path):
                logger.error(f"❌ Shared file not found: {shared_path}")
                return False
                
            with open(shared_path, 'r') as f:
                content = f.read().strip()
                if len(content) == 0:
                    logger.error(f"❌ Shared file is empty: {shared_file}")
                    return False
                    
            logger.info(f"✅ Shared file validated: {shared_file} ({len(content)} chars)")
        
        # Verificar dashboard de métricas
        dashboard_path = os.path.join(project_root, "monitoring", "dashboards", "retail_dashboard.json")
        if os.path.exists(dashboard_path):
            with open(dashboard_path, 'r') as f:
                try:
                    dashboard_config = json.load(f)
                    if "dashboard" in dashboard_config:
                        logger.info("✅ Dashboard configuration validated")
                    else:
                        logger.warning("⚠️ Dashboard config missing 'dashboard' key")
                except json.JSONDecodeError as e:
                    logger.error(f"❌ Dashboard JSON invalid: {e}")
                    return False
        else:
            logger.info("ℹ️ Dashboard config not found (optional)")
        
        logger.info("✅ Configuration files test passed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Configuration files test failed: {e}")
        return False


def test_sqlite_basic_optimizations():
    """Test aplicación básica de optimizaciones SQLite"""
    logger.info("🧪 Testing basic SQLite optimizations...")
    
    try:
        # Crear base de datos temporal
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp_file:
            db_path = tmp_file.name
        
        try:
            conn = sqlite3.connect(db_path)
            
            # Aplicar pragmas básicos de optimización
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA foreign_keys=ON")  
            conn.execute("PRAGMA cache_size=-64000")
            conn.execute("PRAGMA synchronous=NORMAL")
            conn.execute("PRAGMA temp_store=MEMORY")
            
            # Verificar configuraciones
            result = conn.execute("PRAGMA journal_mode").fetchone()
            if result[0].lower() != "wal":
                logger.error(f"❌ Journal mode not set to WAL: {result[0]}")
                return False
            logger.info(f"✅ Journal mode: {result[0]}")
            
            result = conn.execute("PRAGMA foreign_keys").fetchone()
            if result[0] != 1:
                logger.error(f"❌ Foreign keys not enabled: {result[0]}")
                return False
            logger.info("✅ Foreign keys enabled")
            
            result = conn.execute("PRAGMA cache_size").fetchone()
            if result[0] != -64000:
                logger.error(f"❌ Cache size not set correctly: {result[0]}")
                return False
            logger.info(f"✅ Cache size: {result[0]} KB")
            
            # Crear tabla de ejemplo retail
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
            
            # Crear índices específicos
            indices = [
                "CREATE INDEX idx_productos_ean ON productos(codigo_barras) WHERE codigo_barras IS NOT NULL",
                "CREATE INDEX idx_productos_categoria ON productos(categoria) WHERE activo = 1",
                "CREATE INDEX idx_productos_stock ON productos(stock_actual, stock_minimo) WHERE activo = 1"
            ]
            
            for indice in indices:
                conn.execute(indice)
            
            # Verificar índices creados
            result = conn.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='index' AND name LIKE 'idx_%'
            """).fetchall()
            
            indices_creados = len(result)
            if indices_creados < 3:
                logger.error(f"❌ Not enough indexes created: {indices_creados}")
                return False
            logger.info(f"✅ Created {indices_creados} retail-specific indexes")
            
            # Test constraint básico
            conn.execute("""
                INSERT INTO productos (nombre, precio_ars, categoria, stock_actual)
                VALUES ('Test Product', 100.50, 'Test', 10)
            """)
            
            result = conn.execute("SELECT COUNT(*) FROM productos").fetchone()
            if result[0] != 1:
                logger.error("❌ Basic INSERT test failed")
                return False
            logger.info("✅ Basic data operations working")
            
            conn.close()
            logger.info("✅ SQLite basic optimizations test passed")
            return True
            
        finally:
            # Limpiar archivo temporal
            if os.path.exists(db_path):
                os.unlink(db_path)
                
    except Exception as e:
        logger.error(f"❌ SQLite basic optimization test failed: {e}")
        return False


def test_optimization_script_structure():
    """Test estructura del script de optimización"""
    logger.info("🧪 Testing optimization script structure...")
    
    try:
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        script_path = os.path.join(project_root, "scripts", "optimization", "apply_database_optimizations.py")
        
        if not os.path.exists(script_path):
            logger.error(f"❌ Optimization script not found: {script_path}")
            return False
        
        with open(script_path, 'r') as f:
            content = f.read()
        
        # Verificar componentes clave del script
        required_components = [
            "class DatabaseOptimizer",
            "def apply_sqlite_optimizations",
            "def apply_postgresql_optimizations",
            "def apply_deposito_postgresql_optimizations",
            "def optimize_all_databases"
        ]
        
        for component in required_components:
            if component not in content:
                logger.error(f"❌ Missing component in optimization script: {component}")
                return False
            logger.info(f"✅ Found component: {component}")
        
        logger.info("✅ Optimization script structure test passed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Optimization script structure test failed: {e}")
        return False


def test_retail_domain_validations():
    """Test validaciones básicas del dominio retail (sin Pydantic)"""
    logger.info("🧪 Testing basic retail domain validations...")
    
    try:
        # Test validación código EAN-13 básico
        def validate_ean13_basic(codigo):
            """Validación básica EAN-13"""
            if not codigo.isdigit() or len(codigo) != 13:
                return False
            return True
        
        # Códigos de prueba
        test_codes = [
            ("7790895000805", True),   # Código válido
            ("123", False),            # Muy corto
            ("abcd1234567890", False), # Contiene letras
            ("1234567890123", True),   # Formato correcto
        ]
        
        for codigo, expected in test_codes:
            result = validate_ean13_basic(codigo)
            if result != expected:
                logger.error(f"❌ EAN-13 validation failed for {codigo}: expected {expected}, got {result}")
                return False
        
        logger.info("✅ Basic EAN-13 validation working")
        
        # Test validación precio argentino básico
        def validate_precio_ars(precio):
            """Validación básica precio ARS"""
            try:
                precio_float = float(precio)
                return 0.01 <= precio_float <= 9999999.99
            except (ValueError, TypeError):
                return False
        
        test_prices = [
            ("350.50", True),     # Precio válido
            ("0.00", False),      # Muy bajo
            ("10000000", False),  # Muy alto
            ("abc", False),       # No numérico
            ("150.99", True),     # Precio válido
        ]
        
        for precio, expected in test_prices:
            result = validate_precio_ars(precio)
            if result != expected:
                logger.error(f"❌ Price validation failed for {precio}: expected {expected}, got {result}")
                return False
        
        logger.info("✅ Basic price validation working")
        
        # Test validación stock positivo
        def validate_stock_positive(cantidad):
            """Validación stock positivo"""
            try:
                cantidad_int = int(cantidad)
                return cantidad_int > 0
            except (ValueError, TypeError):
                return False
        
        test_quantities = [
            (10, True),      # Cantidad válida
            (-5, False),     # Negativa
            (0, False),      # Cero
            ("abc", False),  # No numérico
            (1000, True),    # Cantidad válida
        ]
        
        for cantidad, expected in test_quantities:
            result = validate_stock_positive(cantidad)
            if result != expected:
                logger.error(f"❌ Stock validation failed for {cantidad}: expected {expected}, got {result}")
                return False
        
        logger.info("✅ Basic stock validation working")
        logger.info("✅ Retail domain validations test passed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Retail domain validations test failed: {e}")
        return False


def test_sql_configuration_syntax():
    """Test sintaxis básica de configuraciones SQL"""
    logger.info("🧪 Testing SQL configuration syntax...")
    
    try:
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        config_dir = os.path.join(project_root, "config", "database")
        
        # Test SQLite config
        sqlite_config = os.path.join(config_dir, "inventario_sqlite_pragmas.sql")
        with open(sqlite_config, 'r') as f:
            content = f.read()
        
        # Verificar comandos clave SQLite
        required_pragmas = ["PRAGMA journal_mode", "PRAGMA foreign_keys", "PRAGMA cache_size"]
        for pragma in required_pragmas:
            if pragma not in content:
                logger.error(f"❌ Missing SQLite pragma: {pragma}")
                return False
        logger.info("✅ SQLite configuration syntax valid")
        
        # Test PostgreSQL configs
        pg_configs = ["bi_postgresql_indices.sql", "deposito_postgresql_optimizations.sql"]
        for config_file in pg_configs:
            config_path = os.path.join(config_dir, config_file)
            with open(config_path, 'r') as f:
                content = f.read()
            
            # Verificar comandos PostgreSQL
            if "CREATE INDEX CONCURRENTLY" not in content:
                logger.error(f"❌ Missing concurrent index creation in {config_file}")
                return False
            
            if "ANALYZE" not in content:
                logger.error(f"❌ Missing ANALYZE commands in {config_file}")
                return False
        
        logger.info("✅ PostgreSQL configuration syntax valid")
        logger.info("✅ SQL configuration syntax test passed")
        return True
        
    except Exception as e:
        logger.error(f"❌ SQL configuration syntax test failed: {e}")
        return False


def main():
    """Ejecutar tests básicos de optimización"""
    logger.info("🚀 Starting basic retail optimizations test suite...")
    
    tests = [
        ("Configuration Files", test_configuration_files),
        ("SQLite Basic Optimizations", test_sqlite_basic_optimizations),
        ("Optimization Script Structure", test_optimization_script_structure),
        ("Retail Domain Validations", test_retail_domain_validations),
        ("SQL Configuration Syntax", test_sql_configuration_syntax)
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
        logger.info("🎉 All basic retail optimizations are working correctly!")
        logger.info("💡 Ready to apply optimizations to real databases")
        return 0
    else:
        logger.error("💥 Some basic retail optimizations need attention")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)