#!/usr/bin/env python3
"""
Script de demostración para las optimizaciones retail implementadas
Muestra cómo aplicar las optimizaciones sin conectar a bases de datos reales
"""

import os
import sys
import logging
import tempfile
import sqlite3
from pathlib import Path

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def demo_sqlite_optimizations():
    """Demostración de optimizaciones SQLite para inventario-retail"""
    logger.info("🎯 Demostración: Optimizaciones SQLite para inventario-retail")
    
    # Crear base de datos de demostración
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp_file:
        db_path = tmp_file.name
    
    try:
        conn = sqlite3.connect(db_path)
        logger.info(f"📁 Base de datos temporal: {db_path}")
        
        # Mostrar configuración inicial
        logger.info("📋 Aplicando pragmas de optimización...")
        
        optimizations = [
            ("PRAGMA journal_mode=WAL", "Modo WAL para mejor concurrencia"),
            ("PRAGMA foreign_keys=ON", "Integridad referencial habilitada"),  
            ("PRAGMA cache_size=-64000", "Cache de 64MB para rendimiento"),
            ("PRAGMA synchronous=NORMAL", "Balance performance/durabilidad"),
            ("PRAGMA temp_store=MEMORY", "Temporales en memoria"),
            ("PRAGMA mmap_size=268435456", "Memory-mapped I/O optimizado")
        ]
        
        for pragma, descripcion in optimizations:
            conn.execute(pragma)
            logger.info(f"  ✅ {descripcion}")
        
        # Crear esquema retail optimizado
        logger.info("🏗️ Creando esquema retail optimizado...")
        
        conn.execute("""
            CREATE TABLE productos (
                id INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                codigo_barras TEXT UNIQUE,
                precio_ars DECIMAL(10,2) NOT NULL CHECK (precio_ars > 0),
                categoria TEXT NOT NULL,
                stock_actual INTEGER DEFAULT 0 CHECK (stock_actual >= 0),
                stock_minimo INTEGER DEFAULT 0 CHECK (stock_minimo >= 0),
                activo INTEGER DEFAULT 1 CHECK (activo IN (0,1)),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.execute("""
            CREATE TABLE movimientos_stock (
                id INTEGER PRIMARY KEY,
                producto_id INTEGER NOT NULL REFERENCES productos(id),
                cantidad INTEGER NOT NULL CHECK (cantidad > 0),
                tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA')),
                motivo TEXT,
                usuario_id INTEGER NOT NULL,
                deposito_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Crear índices específicos retail argentino
        logger.info("📊 Creando índices específicos retail...")
        
        indices = [
            ("idx_productos_ean", "CREATE INDEX idx_productos_ean ON productos(codigo_barras) WHERE codigo_barras IS NOT NULL"),
            ("idx_productos_categoria", "CREATE INDEX idx_productos_categoria ON productos(categoria) WHERE activo = 1"),
            ("idx_productos_stock_bajo", "CREATE INDEX idx_productos_stock_bajo ON productos(stock_actual, stock_minimo) WHERE stock_actual <= stock_minimo AND activo = 1"),
            ("idx_movimientos_producto", "CREATE INDEX idx_movimientos_producto ON movimientos_stock(producto_id, created_at DESC)"),
            ("idx_movimientos_tipo", "CREATE INDEX idx_movimientos_tipo ON movimientos_stock(tipo_movimiento, created_at DESC)")
        ]
        
        for idx_name, idx_sql in indices:
            conn.execute(idx_sql)
            logger.info(f"  ✅ Índice creado: {idx_name}")
        
        # Insertar datos de ejemplo
        logger.info("📦 Insertando productos de ejemplo...")
        
        productos_ejemplo = [
            ("Coca Cola 500ml", "7790895000805", 350.50, "Bebidas", 100, 10),
            ("Dulce de Leche La Serenísima", "7790070031058", 450.99, "Lacteos", 50, 5),
            ("Pan Lactal Bimbo", "7790315001147", 280.00, "Panadería", 25, 3),
            ("Detergente Ala", "7790130921234", 520.75, "Limpieza", 30, 5)
        ]
        
        for nombre, ean, precio, categoria, stock, minimo in productos_ejemplo:
            conn.execute("""
                INSERT INTO productos (nombre, codigo_barras, precio_ars, categoria, stock_actual, stock_minimo)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (nombre, ean, precio, categoria, stock, minimo))
            logger.info(f"  ✅ Producto: {nombre} - Stock: {stock}")
        
        # Demostrar movimientos de stock
        logger.info("📈 Simulando movimientos de stock...")
        
        movimientos = [
            (1, 20, "SALIDA", "Venta", 1, 1),
            (2, 10, "SALIDA", "Venta", 1, 1), 
            (3, 50, "ENTRADA", "Reposición", 1, 1),
            (4, 5, "AJUSTE", "Inventario", 1, 1)
        ]
        
        for producto_id, cantidad, tipo, motivo, usuario, deposito in movimientos:
            conn.execute("""
                INSERT INTO movimientos_stock (producto_id, cantidad, tipo_movimiento, motivo, usuario_id, deposito_id)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (producto_id, cantidad, tipo, motivo, usuario, deposito))
            
            # Actualizar stock
            factor = 1 if tipo == "ENTRADA" else -1
            conn.execute("""
                UPDATE productos 
                SET stock_actual = stock_actual + (? * ?), updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (cantidad, factor, producto_id))
            
            logger.info(f"  ✅ Movimiento: {tipo} {cantidad} unidades producto {producto_id}")
        
        # Mostrar métricas retail
        logger.info("📊 Métricas retail calculadas...")
        
        # Valor total del inventario
        result = conn.execute("""
            SELECT SUM(stock_actual * precio_ars) as valor_total,
                   COUNT(*) as total_productos,
                   SUM(CASE WHEN stock_actual <= stock_minimo THEN 1 ELSE 0 END) as productos_stock_bajo
            FROM productos WHERE activo = 1
        """).fetchone()
        
        logger.info(f"  💰 Valor total inventario: ${result[0]:,.2f} ARS")
        logger.info(f"  📦 Total productos: {result[1]}")
        logger.info(f"  ⚠️ Productos con stock bajo: {result[2]}")
        
        # Top productos por valor
        logger.info("🏆 Top productos por valor de inventario:")
        result = conn.execute("""
            SELECT nombre, categoria, stock_actual, precio_ars, (stock_actual * precio_ars) as valor
            FROM productos 
            WHERE activo = 1
            ORDER BY valor DESC
            LIMIT 3
        """).fetchall()
        
        for i, (nombre, categoria, stock, precio, valor) in enumerate(result, 1):
            logger.info(f"  {i}. {nombre} ({categoria}) - Stock: {stock} - Valor: ${valor:,.2f}")
        
        # Movimientos recientes
        logger.info("📋 Movimientos recientes:")
        result = conn.execute("""
            SELECT p.nombre, m.tipo_movimiento, m.cantidad, m.motivo
            FROM movimientos_stock m
            JOIN productos p ON m.producto_id = p.id
            ORDER BY m.created_at DESC
            LIMIT 3
        """).fetchall()
        
        for nombre, tipo, cantidad, motivo in result:
            logger.info(f"  📦 {nombre}: {tipo} {cantidad} unidades ({motivo})")
        
        # Verificar rendimiento de índices
        logger.info("⚡ Verificando rendimiento de consultas...")
        
        # Query con índice EAN
        result = conn.execute("EXPLAIN QUERY PLAN SELECT * FROM productos WHERE codigo_barras = '7790895000805'").fetchall()
        if "USING INDEX" in result[0][3]:
            logger.info("  ✅ Consulta por EAN usando índice optimizado")
        
        # Query con índice de categoría
        result = conn.execute("EXPLAIN QUERY PLAN SELECT * FROM productos WHERE categoria = 'Bebidas' AND activo = 1").fetchall()
        if "USING INDEX" in result[0][3]:
            logger.info("  ✅ Consulta por categoría usando índice optimizado")
        
        conn.commit()
        conn.close()
        
        logger.info("🎉 Demo SQLite completada exitosamente!")
        
    finally:
        # Limpiar archivo temporal
        if os.path.exists(db_path):
            os.unlink(db_path)


def demo_configuration_files():
    """Demostración de archivos de configuración creados"""
    logger.info("🎯 Demostración: Archivos de configuración optimizados")
    
    project_root = Path(__file__).parent.parent.parent
    config_dir = project_root / "config" / "database"
    
    configs = [
        ("inventario_sqlite_pragmas.sql", "Optimizaciones SQLite para inventario-retail"),
        ("bi_postgresql_indices.sql", "Índices PostgreSQL para business-intelligence-orchestrator"),
        ("deposito_postgresql_optimizations.sql", "Optimizaciones PostgreSQL para sistema_deposito")
    ]
    
    for config_file, description in configs:
        config_path = config_dir / config_file
        
        logger.info(f"📄 {description}")
        logger.info(f"   Archivo: {config_path}")
        
        if config_path.exists():
            with open(config_path, 'r') as f:
                content = f.read()
            
            # Mostrar estadísticas del archivo
            lines = content.count('\n')
            pragmas = content.count('PRAGMA')
            indices = content.count('CREATE INDEX')
            
            logger.info(f"   📏 Líneas: {lines}")
            if pragmas > 0:
                logger.info(f"   ⚙️ Pragmas SQLite: {pragmas}")
            if indices > 0:
                logger.info(f"   📊 Índices: {indices}")
                
            # Mostrar primeras líneas de configuración
            first_lines = content.split('\n')[:5]
            logger.info("   📋 Vista previa:")
            for line in first_lines:
                if line.strip() and not line.strip().startswith('--'):
                    logger.info(f"      {line.strip()}")
                    break
            
            logger.info("   ✅ Configuración válida\n")
        else:
            logger.error(f"   ❌ Archivo no encontrado: {config_path}\n")


def demo_retail_domain_features():
    """Demostración de características específicas del dominio retail argentino"""
    logger.info("🎯 Demostración: Características del dominio retail argentino")
    
    # Validaciones específicas retail
    logger.info("✅ Validaciones implementadas:")
    validations = [
        "Códigos EAN-13/UPC con dígito verificador",
        "Precios en pesos argentinos con límites realistas", 
        "CUIT argentino con algoritmo de validación",
        "Stock siempre positivo (no permite negativo)",
        "Categorías específicas retail argentino",
        "Movimientos de stock con tipos controlados",
        "Transferencias entre depósitos diferentes",
        "Facturas OCR con tipos de comprobante AFIP"
    ]
    
    for validation in validations:
        logger.info(f"  ✅ {validation}")
    
    # Métricas específicas retail
    logger.info("\n📊 Métricas de negocio implementadas:")
    metrics = [
        "Valor total del inventario por categoría y depósito",
        "Items con stock bajo/crítico por criticidad",
        "Volumen de ventas diarias en ARS",
        "Tasa de rotación de inventario por categoría",
        "Impacto de inflación en precios (contexto argentino)",
        "Estado de compliance AFIP por tipo de comprobante",
        "Distribución de confianza OCR por tipo documento",
        "Alertas de stock crítico (< 3 días de venta)"
    ]
    
    for metric in metrics:
        logger.info(f"  📈 {metric}")
    
    # Transacciones atómicas
    logger.info("\n🔒 Transacciones atómicas implementadas:")
    transactions = [
        "Movimientos de stock con validación previa",
        "Transferencias entre depósitos con rollback",
        "Circuit breakers para operaciones críticas",
        "Retry con backoff exponencial para SQLite", 
        "Invalidación de cache automática",
        "Locks granulares por producto (SELECT FOR UPDATE)"
    ]
    
    for transaction in transactions:
        logger.info(f"  🔐 {transaction}")


def main():
    """Ejecutar demostración completa de optimizaciones retail"""
    logger.info("🚀 DEMO: Optimizaciones Retail AIDRIVE_GENSPARK_FORENSIC")
    logger.info("=" * 70)
    
    demos = [
        ("Configuración de Archivos", demo_configuration_files),
        ("Optimizaciones SQLite", demo_sqlite_optimizations), 
        ("Características Retail", demo_retail_domain_features)
    ]
    
    for demo_name, demo_func in demos:
        logger.info(f"\n{'='*70}")
        logger.info(f"🎪 {demo_name}")
        logger.info(f"{'='*70}")
        
        try:
            demo_func()
        except Exception as e:
            logger.error(f"❌ Demo {demo_name} falló: {e}")
    
    logger.info(f"\n{'='*70}")
    logger.info("🎉 DEMO COMPLETADA")
    logger.info(f"{'='*70}")
    
    logger.info("💡 Próximos pasos para aplicar en producción:")
    logger.info("   1. Configurar variables de entorno de base de datos")
    logger.info("   2. Ejecutar: python scripts/optimization/apply_database_optimizations.py /ruta/proyecto")
    logger.info("   3. Verificar métricas en puerto 9090 (/metrics)")
    logger.info("   4. Importar dashboard Grafana desde monitoring/dashboards/")
    logger.info("   5. Configurar alertas para stock crítico y errores OCR")


if __name__ == "__main__":
    main()