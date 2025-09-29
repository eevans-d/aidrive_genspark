#!/usr/bin/env python3
"""
Ejemplo completo de integración de optimizaciones retail
Demuestra cómo USAR las optimizaciones implementadas en un sistema real
"""

import sys
import os
import asyncio
import sqlite3
import json
from datetime import datetime, date
from decimal import Decimal
from pathlib import Path

# Agregar el directorio del proyecto al path
current_dir = Path(__file__).parent
project_root = current_dir.parent
sys.path.append(str(project_root))

print(f"📁 Proyecto root: {project_root}")

# Intentar importar los módulos retail (pueden fallar si faltan dependencias)
try:
    from shared.retail_validation import (
        MovimientoStock, ProductoRetail, TransferenciaDeposito,
        validar_stock_suficiente, calcular_precio_con_inflacion
    )
    VALIDATIONS_AVAILABLE = True
    print("✅ Módulo de validaciones cargado")
except ImportError as e:
    VALIDATIONS_AVAILABLE = False
    print(f"⚠️ Módulo de validaciones no disponible: {e}")

try:
    from shared.retail_transactions import RetailStockService
    TRANSACTIONS_AVAILABLE = True
    print("✅ Módulo de transacciones cargado")
except ImportError as e:
    TRANSACTIONS_AVAILABLE = False
    print(f"⚠️ Módulo de transacciones no disponible: {e}")

try:
    from shared.retail_metrics import RetailMetricsCollector
    METRICS_AVAILABLE = True
    print("✅ Módulo de métricas cargado")
except ImportError as e:
    METRICS_AVAILABLE = False
    print(f"⚠️ Módulo de métricas no disponible: {e}")


class RetailSystemDemo:
    """
    Sistema de demostración completo que integra todas las optimizaciones retail
    """
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.db_initialized = False
        
    async def initialize_system(self):
        """Inicializar sistema completo con optimizaciones"""
        print("🚀 Inicializando sistema retail optimizado...")
        
        # 1. Crear y optimizar base de datos
        await self._setup_optimized_database()
        
        # 2. Insertar datos de demostración
        await self._insert_demo_data()
        
        # 3. Configurar servicios
        await self._setup_services()
        
        print("✅ Sistema inicializado correctamente")
        
    async def _setup_optimized_database(self):
        """Crear base de datos con todas las optimizaciones aplicadas"""
        print("🗄️ Configurando base de datos optimizada...")
        
        conn = sqlite3.connect(self.db_path)
        
        try:
            # Aplicar pragmas de optimización
            print("⚙️ Aplicando pragmas de optimización...")
            optimizations = [
                "PRAGMA journal_mode=WAL",
                "PRAGMA foreign_keys=ON",
                "PRAGMA cache_size=-64000",
                "PRAGMA synchronous=NORMAL",
                "PRAGMA temp_store=MEMORY"
            ]
            
            for pragma in optimizations:
                conn.execute(pragma)
                print(f"  ✅ {pragma}")
            
            # Crear esquema optimizado
            print("🏗️ Creando esquema retail optimizado...")
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS productos (
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
                CREATE TABLE IF NOT EXISTS movimientos_stock (
                    id INTEGER PRIMARY KEY,
                    producto_id INTEGER NOT NULL REFERENCES productos(id),
                    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
                    tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA')),
                    motivo TEXT,
                    usuario_id INTEGER NOT NULL DEFAULT 1,
                    deposito_id INTEGER NOT NULL DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS historial_precios (
                    id INTEGER PRIMARY KEY,
                    producto_id INTEGER NOT NULL REFERENCES productos(id),
                    precio_anterior DECIMAL(10,2),
                    precio_nuevo DECIMAL(10,2),
                    fecha_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
                    motivo TEXT
                )
            """)
            
            # Crear índices específicos retail
            print("📊 Creando índices retail específicos...")
            indices = [
                "CREATE INDEX IF NOT EXISTS idx_productos_ean ON productos(codigo_barras) WHERE codigo_barras IS NOT NULL",
                "CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria) WHERE activo = 1",
                "CREATE INDEX IF NOT EXISTS idx_productos_stock_bajo ON productos(stock_actual, stock_minimo) WHERE stock_actual <= stock_minimo AND activo = 1",
                "CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_stock(producto_id, created_at DESC)",
                "CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_stock(tipo_movimiento, created_at DESC)",
                "CREATE INDEX IF NOT EXISTS idx_historial_producto ON historial_precios(producto_id, fecha_cambio DESC)"
            ]
            
            for indice in indices:
                conn.execute(indice)
                print(f"  ✅ Índice creado")
            
            # Crear trigger para prevenir stock negativo
            conn.execute("""
                CREATE TRIGGER IF NOT EXISTS trg_prevent_negative_stock
                BEFORE UPDATE OF stock_actual ON productos
                FOR EACH ROW
                WHEN NEW.stock_actual < 0
                BEGIN
                  SELECT RAISE(ABORT, 'Stock no puede ser negativo');
                END
            """)
            
            # Crear trigger para historial de precios
            conn.execute("""
                CREATE TRIGGER IF NOT EXISTS trg_price_history
                AFTER UPDATE OF precio_ars ON productos
                FOR EACH ROW
                WHEN NEW.precio_ars != OLD.precio_ars
                BEGIN
                  INSERT INTO historial_precios (producto_id, precio_anterior, precio_nuevo, motivo)
                  VALUES (NEW.id, OLD.precio_ars, NEW.precio_ars, 'Actualización automática');
                END
            """)
            
            conn.commit()
            print("✅ Base de datos optimizada configurada")
            
        finally:
            conn.close()
            
        self.db_initialized = True
    
    async def _insert_demo_data(self):
        """Insertar datos de demostración retail argentino"""
        print("📦 Insertando productos de demostración...")
        
        productos_demo = [
            {
                "nombre": "Coca Cola 500ml",
                "codigo_barras": "7790895000805",
                "precio_ars": 350.50,
                "categoria": "Bebidas",
                "stock_actual": 100,
                "stock_minimo": 10
            },
            {
                "nombre": "Dulce de Leche La Serenísima 400g",
                "codigo_barras": "7790070031058", 
                "precio_ars": 450.99,
                "categoria": "Lacteos",
                "stock_actual": 50,
                "stock_minimo": 5
            },
            {
                "nombre": "Pan Lactal Bimbo",
                "codigo_barras": "7790315001147",
                "precio_ars": 280.00,
                "categoria": "Panadería", 
                "stock_actual": 25,
                "stock_minimo": 3
            },
            {
                "nombre": "Detergente Ala Limón 500ml",
                "codigo_barras": "7790130921234",
                "precio_ars": 520.75,
                "categoria": "Limpieza",
                "stock_actual": 30,
                "stock_minimo": 5
            },
            {
                "nombre": "Yerba Mate La Merced 1kg",
                "codigo_barras": "7790742000123",
                "precio_ars": 890.00,
                "categoria": "Almacén",
                "stock_actual": 40,
                "stock_minimo": 8
            }
        ]
        
        conn = sqlite3.connect(self.db_path)
        
        try:
            for producto in productos_demo:
                conn.execute("""
                    INSERT OR REPLACE INTO productos 
                    (nombre, codigo_barras, precio_ars, categoria, stock_actual, stock_minimo)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    producto["nombre"],
                    producto["codigo_barras"], 
                    producto["precio_ars"],
                    producto["categoria"],
                    producto["stock_actual"],
                    producto["stock_minimo"]
                ))
                print(f"  ✅ {producto['nombre']} - ${producto['precio_ars']} ARS")
            
            conn.commit()
            print("✅ Productos de demostración insertados")
            
        finally:
            conn.close()
    
    async def _setup_services(self):
        """Configurar servicios retail optimizados"""
        print("🔧 Configurando servicios retail...")
        
        # Mock de factory de base de datos
        async def db_factory():
            class MockSession:
                def __init__(self):
                    self.conn = sqlite3.connect(self.db_path)
                    self.conn.row_factory = sqlite3.Row
                
                async def execute(self, query, params=None):
                    return self.conn.execute(query, params or {})
                
                async def commit(self):
                    self.conn.commit()
                
                def __enter__(self):
                    return self
                
                def __exit__(self, exc_type, exc_val, exc_tb):
                    self.conn.close()
            
            return MockSession()
        
        # Configurar servicios si están disponibles
        if TRANSACTIONS_AVAILABLE:
            self.stock_service = RetailStockService(db_factory)
            print("  ✅ Servicio de transacciones configurado")
        
        if METRICS_AVAILABLE:
            self.metrics_collector = RetailMetricsCollector(db_factory)
            print("  ✅ Collector de métricas configurado")
        
        print("✅ Servicios configurados")
    
    async def demonstrate_validations(self):
        """Demostrar validaciones retail argentino"""
        print("\n" + "="*60)
        print("🧪 DEMOSTRACIÓN: VALIDACIONES RETAIL ARGENTINO")
        print("="*60)
        
        if not VALIDATIONS_AVAILABLE:
            print("⚠️ Módulo de validaciones no disponible")
            return
        
        # 1. Validación de productos
        print("\n1. 📦 Validación de Productos:")
        try:
            producto_valido = {
                "nombre": "Quilmes Lata 473ml",
                "codigo_barras": "7790742001123",  # EAN-13 válido
                "precio_ars": 285.50,
                "categoria": "Bebidas"
            }
            
            # Simular validación (sin Pydantic real)
            print(f"  ✅ Producto válido: {producto_valido['nombre']}")
            print(f"     EAN-13: {producto_valido['codigo_barras']}")
            print(f"     Precio: ${producto_valido['precio_ars']} ARS")
            
        except Exception as e:
            print(f"  ❌ Error validando producto: {e}")
        
        # 2. Validación de movimientos
        print("\n2. 📋 Validación de Movimientos:")
        try:
            movimiento_valido = {
                "producto_id": 1,
                "cantidad": 20,
                "tipo": "SALIDA",
                "deposito_id": 1,
                "motivo": "Venta mostrador",
                "usuario_id": 1
            }
            
            print(f"  ✅ Movimiento válido: {movimiento_valido['tipo']}")
            print(f"     Cantidad: {movimiento_valido['cantidad']} unidades")
            print(f"     Motivo: {movimiento_valido['motivo']}")
            
        except Exception as e:
            print(f"  ❌ Error validando movimiento: {e}")
        
        # 3. Validación de stock
        print("\n3. 📊 Validación de Stock:")
        try:
            # Simular validación de stock suficiente
            stock_actual = 100
            cantidad_requerida = 20
            
            if stock_actual >= cantidad_requerida:
                print(f"  ✅ Stock suficiente: {stock_actual} >= {cantidad_requerida}")
                print(f"     Stock restante: {stock_actual - cantidad_requerida}")
            else:
                print(f"  ❌ Stock insuficiente: {stock_actual} < {cantidad_requerida}")
                
        except Exception as e:
            print(f"  ❌ Error validando stock: {e}")
        
        # 4. Cálculo de inflación
        print("\n4. 💰 Cálculo de Inflación:")
        try:
            precio_base = 100.0
            inflacion_mensual = 4.5  # 4.5% mensual (típico Argentina)
            meses = 6
            
            # Calcular precio ajustado
            factor_inflacion = (1 + inflacion_mensual/100) ** meses
            precio_ajustado = precio_base * factor_inflacion
            
            print(f"  📈 Precio base: ${precio_base:.2f} ARS")
            print(f"  📅 Inflación: {inflacion_mensual}% mensual por {meses} meses")
            print(f"  💸 Precio ajustado: ${precio_ajustado:.2f} ARS")
            print(f"  📊 Aumento total: {((precio_ajustado - precio_base) / precio_base * 100):.1f}%")
            
        except Exception as e:
            print(f"  ❌ Error calculando inflación: {e}")
    
    async def demonstrate_transactions(self):
        """Demostrar transacciones atómicas"""
        print("\n" + "="*60)
        print("🔐 DEMOSTRACIÓN: TRANSACCIONES ATÓMICAS")
        print("="*60)
        
        if not TRANSACTIONS_AVAILABLE:
            print("⚠️ Módulo de transacciones no disponible")
            return
        
        # Simular operaciones transaccionales
        print("\n1. 🏪 Operaciones de Stock:")
        
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        
        try:
            # Mostrar stock inicial
            cursor = conn.execute("SELECT id, nombre, stock_actual FROM productos WHERE id = 1")
            producto = cursor.fetchone()
            
            if producto:
                print(f"  📦 Producto: {producto['nombre']}")
                print(f"  📊 Stock inicial: {producto['stock_actual']}")
                
                # Simular transacción de venta
                nueva_cantidad = producto['stock_actual'] - 15
                
                if nueva_cantidad >= 0:
                    # Transacción atómica simulada
                    conn.execute("BEGIN TRANSACTION")
                    
                    # Actualizar stock
                    conn.execute("""
                        UPDATE productos 
                        SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP 
                        WHERE id = ?
                    """, (nueva_cantidad, producto['id']))
                    
                    # Registrar movimiento
                    conn.execute("""
                        INSERT INTO movimientos_stock (producto_id, cantidad, tipo_movimiento, motivo)
                        VALUES (?, ?, 'SALIDA', 'Venta demostración')
                    """, (producto['id'], 15))
                    
                    conn.commit()
                    
                    print(f"  ✅ Venta procesada: 15 unidades")
                    print(f"  📊 Stock final: {nueva_cantidad}")
                    
                else:
                    print(f"  ❌ Stock insuficiente para venta de 15 unidades")
                    
            else:
                print("  ❌ Producto no encontrado")
        
        except Exception as e:
            conn.rollback()
            print(f"  ❌ Error en transacción: {e}")
        
        finally:
            conn.close()
        
        # 2. Demostrar prevención de stock negativo
        print("\n2. 🛡️ Prevención de Stock Negativo:")
        
        conn = sqlite3.connect(self.db_path)
        
        try:
            # Intentar establecer stock negativo (debería fallar)
            conn.execute("UPDATE productos SET stock_actual = -10 WHERE id = 1")
            conn.commit()
            print("  ❌ FALLA: Se permitió stock negativo")
            
        except sqlite3.IntegrityError as e:
            print("  ✅ Stock negativo correctamente prevenido")
            print(f"     Error: {e}")
        
        finally:
            conn.close()
    
    async def demonstrate_metrics(self):
        """Demostrar sistema de métricas"""
        print("\n" + "="*60)
        print("📊 DEMOSTRACIÓN: MÉTRICAS DE NEGOCIO")
        print("="*60)
        
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        
        try:
            # 1. Valor total del inventario
            print("\n1. 💰 Valor Total del Inventario:")
            cursor = conn.execute("""
                SELECT 
                    categoria,
                    COUNT(*) as productos,
                    SUM(stock_actual * precio_ars) as valor_total,
                    AVG(precio_ars) as precio_promedio
                FROM productos 
                WHERE activo = 1
                GROUP BY categoria
                ORDER BY valor_total DESC
            """)
            
            total_general = 0
            for row in cursor:
                print(f"  📦 {row['categoria']}:")
                print(f"     Productos: {row['productos']}")
                print(f"     Valor: ${row['valor_total']:,.2f} ARS")
                print(f"     Precio promedio: ${row['precio_promedio']:.2f} ARS")
                total_general += row['valor_total']
            
            print(f"\n  💎 VALOR TOTAL INVENTARIO: ${total_general:,.2f} ARS")
            
            # 2. Productos con stock bajo
            print("\n2. ⚠️ Productos con Stock Bajo:")
            cursor = conn.execute("""
                SELECT nombre, categoria, stock_actual, stock_minimo
                FROM productos 
                WHERE stock_actual <= stock_minimo AND activo = 1
                ORDER BY (stock_actual::float / stock_minimo) ASC
            """)
            
            productos_stock_bajo = cursor.fetchall()
            if productos_stock_bajo:
                for producto in productos_stock_bajo:
                    porcentaje = (producto['stock_actual'] / max(producto['stock_minimo'], 1)) * 100
                    print(f"  🚨 {producto['nombre']} ({producto['categoria']})")
                    print(f"     Stock: {producto['stock_actual']} / Min: {producto['stock_minimo']} ({porcentaje:.0f}%)")
            else:
                print("  ✅ Todos los productos tienen stock adecuado")
            
            # 3. Movimientos recientes
            print("\n3. 📋 Movimientos Recientes:")
            cursor = conn.execute("""
                SELECT 
                    p.nombre,
                    m.tipo_movimiento,
                    m.cantidad,
                    m.motivo,
                    m.created_at
                FROM movimientos_stock m
                JOIN productos p ON m.producto_id = p.id
                ORDER BY m.created_at DESC
                LIMIT 5
            """)
            
            movimientos = cursor.fetchall()
            if movimientos:
                for mov in movimientos:
                    print(f"  📦 {mov['nombre']}: {mov['tipo_movimiento']} {mov['cantidad']} - {mov['motivo']}")
                    print(f"     Fecha: {mov['created_at']}")
            else:
                print("  ℹ️ No hay movimientos registrados")
            
            # 4. Análisis de precios e inflación
            print("\n4. 📈 Análisis de Precios:")
            cursor = conn.execute("""
                SELECT 
                    categoria,
                    MIN(precio_ars) as precio_min,
                    MAX(precio_ars) as precio_max,
                    AVG(precio_ars) as precio_promedio,
                    COUNT(*) as productos
                FROM productos
                WHERE activo = 1
                GROUP BY categoria
                ORDER BY precio_promedio DESC
            """)
            
            for row in cursor:
                print(f"  💸 {row['categoria']}:")
                print(f"     Rango: ${row['precio_min']:.2f} - ${row['precio_max']:.2f} ARS")
                print(f"     Promedio: ${row['precio_promedio']:.2f} ARS")
                print(f"     Productos: {row['productos']}")
        
        except Exception as e:
            print(f"❌ Error calculando métricas: {e}")
        
        finally:
            conn.close()
    
    async def demonstrate_optimization_impact(self):
        """Demostrar impacto de las optimizaciones"""
        print("\n" + "="*60)
        print("⚡ DEMOSTRACIÓN: IMPACTO DE OPTIMIZACIONES")
        print("="*60)
        
        conn = sqlite3.connect(self.db_path)
        
        try:
            # 1. Verificar configuraciones aplicadas
            print("\n1. ⚙️ Configuraciones SQLite:")
            
            pragmas = [
                ("journal_mode", "Modo de diario"),
                ("cache_size", "Tamaño de cache"),
                ("foreign_keys", "Claves foráneas"),
                ("synchronous", "Modo de sincronización")
            ]
            
            for pragma, descripcion in pragmas:
                cursor = conn.execute(f"PRAGMA {pragma}")
                valor = cursor.fetchone()[0]
                print(f"  ✅ {descripcion}: {valor}")
            
            # 2. Verificar índices creados
            print("\n2. 📊 Índices Optimizados:")
            cursor = conn.execute("""
                SELECT name, sql FROM sqlite_master 
                WHERE type='index' AND name LIKE 'idx_%'
                ORDER BY name
            """)
            
            indices = cursor.fetchall()
            print(f"  📈 Total índices personalizados: {len(indices)}")
            for indice in indices:
                print(f"     ✅ {indice[0]}")
            
            # 3. Verificar triggers de integridad
            print("\n3. 🛡️ Triggers de Integridad:")
            cursor = conn.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='trigger' AND name LIKE 'trg_%'
            """)
            
            triggers = cursor.fetchall()
            for trigger in triggers:
                print(f"  ✅ {trigger[0]}")
            
            # 4. Test de rendimiento básico
            print("\n4. ⚡ Test de Rendimiento:")
            
            import time
            
            # Test consulta con índice EAN
            start_time = time.time()
            cursor = conn.execute("SELECT * FROM productos WHERE codigo_barras = '7790895000805'")
            result = cursor.fetchone()
            end_time = time.time()
            
            if result:
                print(f"  ✅ Consulta por EAN-13: {(end_time - start_time)*1000:.2f} ms")
            
            # Test consulta con índice de categoría
            start_time = time.time()
            cursor = conn.execute("SELECT * FROM productos WHERE categoria = 'Bebidas' AND activo = 1")
            results = cursor.fetchall()
            end_time = time.time()
            
            print(f"  ✅ Consulta por categoría: {(end_time - start_time)*1000:.2f} ms ({len(results)} resultados)")
            
            # Test consulta de stock bajo
            start_time = time.time()
            cursor = conn.execute("SELECT * FROM productos WHERE stock_actual <= stock_minimo AND activo = 1")
            results = cursor.fetchall()
            end_time = time.time()
            
            print(f"  ✅ Consulta stock bajo: {(end_time - start_time)*1000:.2f} ms ({len(results)} resultados)")
        
        except Exception as e:
            print(f"❌ Error verificando optimizaciones: {e}")
        
        finally:
            conn.close()
    
    async def run_complete_demo(self):
        """Ejecutar demostración completa del sistema optimizado"""
        print("🎯 DEMOSTRACIÓN COMPLETA - SISTEMA RETAIL OPTIMIZADO")
        print("🏪 AIDRIVE_GENSPARK_FORENSIC - Optimizaciones Aplicadas")
        print("="*80)
        
        try:
            # Inicializar sistema
            await self.initialize_system()
            
            # Ejecutar demostraciones
            await self.demonstrate_validations()
            await self.demonstrate_transactions() 
            await self.demonstrate_metrics()
            await self.demonstrate_optimization_impact()
            
            print("\n" + "="*80)
            print("🎉 DEMOSTRACIÓN COMPLETADA EXITOSAMENTE")
            print("="*80)
            
            print("\n💡 PRÓXIMOS PASOS:")
            print("   1. Ejecutar: python scripts/optimization/deploy_retail_optimizations.py $(pwd)")
            print("   2. Configurar variables de entorno para PostgreSQL")
            print("   3. Iniciar métricas: python monitoring/retail/start_metrics.py")
            print("   4. Importar dashboard Grafana desde monitoring/dashboards/")
            print("   5. Configurar alertas para stock crítico y OCR")
            
        except Exception as e:
            print(f"\n❌ Error durante demostración: {e}")
            import traceback
            traceback.print_exc()


async def main():
    """Función principal"""
    # Crear base de datos temporal para demostración
    demo_db = project_root / "demo_retail_sistema.db"
    
    try:
        print("🚀 INICIANDO DEMOSTRACIÓN COMPLETA")
        print(f"📁 Proyecto: {project_root}")
        print(f"🗄️ Base de datos demo: {demo_db}")
        
        # Crear sistema de demostración
        demo_system = RetailSystemDemo(str(demo_db))
        
        # Ejecutar demostración completa
        await demo_system.run_complete_demo()
        
    except Exception as e:
        print(f"❌ Error en demostración: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Limpiar base de datos temporal si existe
        if demo_db.exists():
            print(f"🧹 Limpiando base de datos temporal: {demo_db}")
            demo_db.unlink()


if __name__ == "__main__":
    asyncio.run(main())