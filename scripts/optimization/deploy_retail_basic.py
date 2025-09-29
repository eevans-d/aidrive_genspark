#!/usr/bin/env python3
"""
Script de despliegue básico para aplicar optimizaciones retail
SOLUCIONA, APLICA E IMPLEMENTA las optimizaciones sin dependencias externas
"""

import os
import sys
import sqlite3
import logging
import json
import time
from pathlib import Path
from datetime import datetime
import subprocess

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class BasicRetailDeployer:
    """
    Desplegador básico de optimizaciones retail (sin dependencias externas)
    """
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.config_path = self.project_root / "config" / "database"
        self.deployment_results = {
            "timestamp": datetime.now().isoformat(),
            "optimizations_applied": [],
            "warnings": [],
            "success": False
        }
        
    def deploy_all_optimizations(self) -> bool:
        """
        Aplicar todas las optimizaciones retail de forma básica
        """
        logger.info("🚀 INICIANDO DESPLIEGUE BÁSICO DE OPTIMIZACIONES RETAIL")
        logger.info(f"📁 Proyecto: {self.project_root}")
        
        success = True
        
        # Fase 1: Verificar archivos
        if not self._verify_files():
            return False
        
        # Fase 2: Aplicar optimizaciones SQLite
        if not self._deploy_sqlite_basic():
            success = False
        
        # Fase 3: Configurar PostgreSQL (instrucciones)
        self._setup_postgresql_instructions()
        
        # Fase 4: Configurar monitoreo básico
        if not self._setup_basic_monitoring():
            success = False
        
        # Fase 5: Generar reporte
        self._generate_basic_report()
        
        self.deployment_results["success"] = success
        
        if success:
            logger.info("🎉 DESPLIEGUE BÁSICO COMPLETADO EXITOSAMENTE")
        else:
            logger.error("❌ DESPLIEGUE COMPLETADO CON ADVERTENCIAS")
        
        return success
    
    def _verify_files(self) -> bool:
        """Verificar que todos los archivos estén presentes"""
        logger.info("🔍 Verificando archivos de optimización...")
        
        required_files = [
            "config/database/inventario_sqlite_pragmas.sql",
            "config/database/bi_postgresql_indices.sql", 
            "config/database/deposito_postgresql_optimizations.sql",
            "shared/retail_validation.py",
            "shared/retail_transactions.py",
            "shared/retail_metrics.py"
        ]
        
        missing_files = []
        for file_path in required_files:
            full_path = self.project_root / file_path
            if not full_path.exists():
                missing_files.append(file_path)
            else:
                logger.info(f"✅ Encontrado: {file_path}")
        
        if missing_files:
            logger.error("❌ Archivos faltantes:")
            for missing in missing_files:
                logger.error(f"   - {missing}")
            return False
        
        logger.info("✅ Todos los archivos de optimización están presentes")
        return True
    
    def _deploy_sqlite_basic(self) -> bool:
        """Aplicar optimizaciones SQLite básicas"""
        logger.info("🗄️ Aplicando optimizaciones SQLite...")
        
        try:
            # Crear directorio de datos para demostración
            data_dir = self.project_root / "data"
            data_dir.mkdir(exist_ok=True)
            
            # Crear base de datos de demostración
            demo_db = data_dir / "retail_optimizado.db"
            
            logger.info(f"📦 Creando base de datos optimizada: {demo_db}")
            
            conn = sqlite3.connect(str(demo_db))
            
            try:
                # Leer configuración SQLite
                sqlite_config = self.config_path / "inventario_sqlite_pragmas.sql"
                with open(sqlite_config, 'r') as f:
                    sql_content = f.read()
                
                # Aplicar configuraciones
                logger.info("⚙️ Aplicando pragmas de optimización...")
                statements_executed = 0
                
                for statement in sql_content.split(';'):
                    statement = statement.strip()
                    if statement and not statement.startswith('--'):
                        try:
                            conn.execute(statement)
                            statements_executed += 1
                            logger.debug(f"✅ Ejecutado: {statement[:50]}...")
                        except sqlite3.Error as e:
                            if "already exists" not in str(e):
                                logger.warning(f"⚠️ SQLite warning: {e}")
                
                conn.commit()
                
                # Verificar configuraciones aplicadas
                stats = self._verify_sqlite_config(conn)
                logger.info(f"📊 Configuraciones SQLite aplicadas: {statements_executed}")
                logger.info(f"📈 Estadísticas: {stats}")
                
                # Crear datos de demostración
                self._create_demo_data(conn)
                
                self.deployment_results["optimizations_applied"].append({
                    "type": "SQLite Demo",
                    "database": str(demo_db),
                    "statements": statements_executed,
                    "stats": stats
                })
                
                logger.info("✅ Optimizaciones SQLite aplicadas correctamente")
                return True
                
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"❌ Error aplicando optimizaciones SQLite: {e}")
            return False
    
    def _verify_sqlite_config(self, conn) -> dict:
        """Verificar configuraciones SQLite aplicadas"""
        stats = {}
        try:
            # Verificar pragmas principales
            cursor = conn.execute("PRAGMA journal_mode")
            stats['journal_mode'] = cursor.fetchone()[0]
            
            cursor = conn.execute("PRAGMA cache_size")
            stats['cache_size'] = cursor.fetchone()[0]
            
            cursor = conn.execute("PRAGMA foreign_keys")
            stats['foreign_keys'] = cursor.fetchone()[0]
            
            # Contar índices personalizados
            cursor = conn.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
            stats['custom_indexes'] = cursor.fetchone()[0]
            
        except Exception as e:
            stats['error'] = str(e)
        
        return stats
    
    def _create_demo_data(self, conn):
        """Crear datos de demostración en la base optimizada"""
        logger.info("📦 Creando datos de demostración...")
        
        # Crear tablas
        conn.execute("""
            CREATE TABLE IF NOT EXISTS productos (
                id INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                codigo_barras TEXT UNIQUE,
                precio_ars DECIMAL(10,2) NOT NULL CHECK (precio_ars > 0),
                categoria TEXT NOT NULL,
                stock_actual INTEGER DEFAULT 0 CHECK (stock_actual >= 0),
                stock_minimo INTEGER DEFAULT 0,
                activo INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.execute("""
            CREATE TABLE IF NOT EXISTS movimientos_stock (
                id INTEGER PRIMARY KEY,
                producto_id INTEGER REFERENCES productos(id),
                cantidad INTEGER NOT NULL CHECK (cantidad > 0),
                tipo_movimiento TEXT NOT NULL,
                motivo TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Insertar productos de demostración
        productos = [
            ("Coca Cola 500ml", "7790895000805", 350.50, "Bebidas", 100, 10),
            ("Dulce de Leche La Serenísima", "7790070031058", 450.99, "Lacteos", 50, 5),
            ("Pan Lactal Bimbo", "7790315001147", 280.00, "Panadería", 25, 3),
            ("Detergente Ala", "7790130921234", 520.75, "Limpieza", 30, 5),
            ("Yerba Mate La Merced", "7790742000123", 890.00, "Almacén", 40, 8)
        ]
        
        for producto in productos:
            conn.execute("""
                INSERT OR REPLACE INTO productos 
                (nombre, codigo_barras, precio_ars, categoria, stock_actual, stock_minimo)
                VALUES (?, ?, ?, ?, ?, ?)
            """, producto)
        
        # Insertar algunos movimientos
        movimientos = [
            (1, 20, "SALIDA", "Venta demostración"),
            (2, 10, "SALIDA", "Venta demostración"),
            (3, 50, "ENTRADA", "Reposición stock"),
            (4, 5, "AJUSTE", "Inventario")
        ]
        
        for mov in movimientos:
            conn.execute("""
                INSERT INTO movimientos_stock (producto_id, cantidad, tipo_movimiento, motivo)
                VALUES (?, ?, ?, ?)
            """, mov)
        
        conn.commit()
        logger.info("✅ Datos de demostración creados")
    
    def _setup_postgresql_instructions(self):
        """Generar instrucciones para PostgreSQL"""
        logger.info("🐘 Generando instrucciones PostgreSQL...")
        
        instructions_dir = self.project_root / "deployment_instructions"
        instructions_dir.mkdir(exist_ok=True)
        
        # Instrucciones para BI
        bi_instructions = instructions_dir / "postgresql_bi_setup.md"
        with open(bi_instructions, 'w') as f:
            f.write("""# Configuración PostgreSQL - Business Intelligence

## Variables de Entorno

```bash
export BI_PG_HOST=localhost
export BI_PG_PORT=5432
export BI_PG_DATABASE=business_intelligence
export BI_PG_USER=bi_user
export BI_PG_PASSWORD=password
```

## Aplicar Optimizaciones

```bash
# 1. Crear base de datos
createdb -h $BI_PG_HOST -p $BI_PG_PORT -U $BI_PG_USER $BI_PG_DATABASE

# 2. Aplicar optimizaciones
psql -h $BI_PG_HOST -p $BI_PG_PORT -U $BI_PG_USER -d $BI_PG_DATABASE -f config/database/bi_postgresql_indices.sql
```

## Verificar Aplicación

```bash
psql -h $BI_PG_HOST -p $BI_PG_PORT -U $BI_PG_USER -d $BI_PG_DATABASE -c "SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE 'idx_%';"
```
""")
        
        # Instrucciones para Depósito
        deposito_instructions = instructions_dir / "postgresql_deposito_setup.md"
        with open(deposito_instructions, 'w') as f:
            f.write("""# Configuración PostgreSQL - Sistema Depósito

## Variables de Entorno

```bash
export DEPOSITO_PG_HOST=localhost
export DEPOSITO_PG_PORT=5432
export DEPOSITO_PG_DATABASE=deposito_db
export DEPOSITO_PG_USER=deposito_user
export DEPOSITO_PG_PASSWORD=deposito_pass
```

## Aplicar Optimizaciones

```bash
# 1. Crear base de datos
createdb -h $DEPOSITO_PG_HOST -p $DEPOSITO_PG_PORT -U $DEPOSITO_PG_USER $DEPOSITO_PG_DATABASE

# 2. Aplicar optimizaciones
psql -h $DEPOSITO_PG_HOST -p $DEPOSITO_PG_PORT -U $DEPOSITO_PG_USER -d $DEPOSITO_PG_DATABASE -f config/database/deposito_postgresql_optimizations.sql
```

## Verificar Aplicación

```bash
psql -h $DEPOSITO_PG_HOST -p $DEPOSITO_PG_PORT -U $DEPOSITO_PG_USER -d $DEPOSITO_PG_DATABASE -c "SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE 'idx_%';"
```
""")
        
        logger.info(f"✅ Instrucciones PostgreSQL generadas en: {instructions_dir}")
        
        self.deployment_results["optimizations_applied"].append({
            "type": "PostgreSQL Instructions",
            "files": ["postgresql_bi_setup.md", "postgresql_deposito_setup.md"]
        })
    
    def _setup_basic_monitoring(self) -> bool:
        """Configurar monitoreo básico"""
        logger.info("📊 Configurando monitoreo básico...")
        
        try:
            monitoring_dir = self.project_root / "monitoring_basic"
            monitoring_dir.mkdir(exist_ok=True)
            
            # Script básico de métricas
            metrics_script = monitoring_dir / "check_retail_metrics.py"
            with open(metrics_script, 'w') as f:
                f.write("""#!/usr/bin/env python3
\"\"\"
Script básico para verificar métricas retail
\"\"\"
import sqlite3
import json
from datetime import datetime
from pathlib import Path

def check_retail_metrics(db_path):
    \"\"\"Verificar métricas básicas del sistema retail\"\"\"
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        
        metrics = {
            "timestamp": datetime.now().isoformat(),
            "database": db_path
        }
        
        # Valor total inventario
        cursor = conn.execute(\"\"\"
            SELECT 
                COUNT(*) as total_productos,
                SUM(stock_actual * precio_ars) as valor_total
            FROM productos WHERE activo = 1
        \"\"\")
        row = cursor.fetchone()
        metrics["total_productos"] = row["total_productos"]
        metrics["valor_inventario_ars"] = float(row["valor_total"] or 0)
        
        # Productos con stock bajo
        cursor = conn.execute(\"\"\"
            SELECT COUNT(*) as stock_bajo
            FROM productos 
            WHERE stock_actual <= stock_minimo AND activo = 1
        \"\"\")
        metrics["productos_stock_bajo"] = cursor.fetchone()["stock_bajo"]
        
        # Movimientos del día
        cursor = conn.execute(\"\"\"
            SELECT COUNT(*) as movimientos_hoy
            FROM movimientos_stock 
            WHERE date(created_at) = date('now')
        \"\"\")
        metrics["movimientos_hoy"] = cursor.fetchone()["movimientos_hoy"]
        
        conn.close()
        
        # Mostrar métricas
        print("📊 MÉTRICAS RETAIL - " + metrics["timestamp"])
        print("=" * 50)
        print(f"💰 Valor total inventario: ${metrics['valor_inventario_ars']:,.2f} ARS")
        print(f"📦 Total productos: {metrics['total_productos']}")
        print(f"⚠️ Productos stock bajo: {metrics['productos_stock_bajo']}")
        print(f"📋 Movimientos hoy: {metrics['movimientos_hoy']}")
        print("=" * 50)
        
        # Guardar métricas
        metrics_file = Path(db_path).parent / "retail_metrics.json"
        with open(metrics_file, 'w') as f:
            json.dump(metrics, f, indent=2)
        
        print(f"💾 Métricas guardadas en: {metrics_file}")
        
    except Exception as e:
        print(f"❌ Error calculando métricas: {e}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        check_retail_metrics(sys.argv[1])
    else:
        print("Uso: python check_retail_metrics.py <database_path>")
""")
            
            # Script de verificación de optimizaciones
            verify_script = monitoring_dir / "verify_optimizations.py"
            with open(verify_script, 'w') as f:
                f.write("""#!/usr/bin/env python3
\"\"\"
Script para verificar que las optimizaciones están aplicadas
\"\"\"
import sqlite3
import sys
from pathlib import Path

def verify_sqlite_optimizations(db_path):
    \"\"\"Verificar optimizaciones SQLite\"\"\"
    try:
        conn = sqlite3.connect(db_path)
        
        print(f"🔍 Verificando optimizaciones en: {db_path}")
        print("=" * 60)
        
        # Verificar pragmas
        pragmas = [
            ("journal_mode", "Modo de diario"),
            ("cache_size", "Tamaño de cache"), 
            ("foreign_keys", "Claves foráneas"),
            ("synchronous", "Modo sincronización")
        ]
        
        for pragma, desc in pragmas:
            cursor = conn.execute(f"PRAGMA {pragma}")
            value = cursor.fetchone()[0]
            print(f"✅ {desc}: {value}")
        
        # Verificar índices
        cursor = conn.execute(\"\"\"
            SELECT name FROM sqlite_master 
            WHERE type='index' AND name LIKE 'idx_%'
            ORDER BY name
        \"\"\")
        
        indices = cursor.fetchall()
        print(f"\\n📊 Índices personalizados: {len(indices)}")
        for idx in indices:
            print(f"   ✅ {idx[0]}")
        
        # Verificar triggers
        cursor = conn.execute(\"\"\"
            SELECT name FROM sqlite_master 
            WHERE type='trigger' AND name LIKE 'trg_%'
        \"\"\")
        
        triggers = cursor.fetchall()
        print(f"\\n🛡️ Triggers de integridad: {len(triggers)}")
        for trg in triggers:
            print(f"   ✅ {trg[0]}")
        
        conn.close()
        print("\\n✅ Verificación completada exitosamente")
        
    except Exception as e:
        print(f"❌ Error verificando optimizaciones: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        verify_sqlite_optimizations(sys.argv[1])
    else:
        print("Uso: python verify_optimizations.py <database_path>")
""")
            
            # Hacer scripts ejecutables
            os.chmod(metrics_script, 0o755)
            os.chmod(verify_script, 0o755)
            
            logger.info(f"✅ Scripts de monitoreo creados en: {monitoring_dir}")
            
            self.deployment_results["optimizations_applied"].append({
                "type": "Basic Monitoring",
                "scripts": ["check_retail_metrics.py", "verify_optimizations.py"]
            })
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error configurando monitoreo: {e}")
            return False
    
    def _generate_basic_report(self):
        """Generar reporte básico del despliegue"""
        logger.info("📋 Generando reporte de despliegue...")
        
        report = {
            "deployment_type": "basic",
            "timestamp": self.deployment_results["timestamp"],
            "project_root": str(self.project_root),
            "optimizations_applied": self.deployment_results["optimizations_applied"],
            "warnings": self.deployment_results["warnings"],
            "success": self.deployment_results["success"],
            "next_steps": [
                "Revisar base de datos demo en data/retail_optimizado.db",
                "Ejecutar scripts de verificación en monitoring_basic/",
                "Seguir instrucciones PostgreSQL en deployment_instructions/",
                "Configurar variables de entorno para producción"
            ]
        }
        
        # Guardar reporte
        report_file = self.project_root / "deployment_basic_report.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        # Generar resumen en consola
        logger.info("=" * 60)
        logger.info("📊 RESUMEN DEL DESPLIEGUE BÁSICO")
        logger.info("=" * 60)
        logger.info(f"✅ Optimizaciones aplicadas: {len(report['optimizations_applied'])}")
        
        for opt in report["optimizations_applied"]:
            logger.info(f"  🔧 {opt['type']}")
        
        logger.info(f"\n📋 Reporte completo guardado en: {report_file}")
        
        logger.info("\n💡 PRÓXIMOS PASOS:")
        for step in report["next_steps"]:
            logger.info(f"   {step}")
        
        logger.info("=" * 60)


def main():
    """Función principal del despliegue básico"""
    if len(sys.argv) < 2:
        print("Uso: python deploy_retail_basic.py <project_root_path>")
        print("Ejemplo: python deploy_retail_basic.py /path/to/aidrive_genspark_forensic")
        sys.exit(1)
    
    project_root = sys.argv[1]
    
    if not os.path.exists(project_root):
        logger.error(f"❌ Directorio del proyecto no encontrado: {project_root}")
        sys.exit(1)
    
    logger.info("🚀 INICIANDO DESPLIEGUE BÁSICO DE OPTIMIZACIONES RETAIL")
    
    deployer = BasicRetailDeployer(project_root)
    success = deployer.deploy_all_optimizations()
    
    if success:
        logger.info("🎉 DESPLIEGUE BÁSICO COMPLETADO EXITOSAMENTE")
        sys.exit(0)
    else:
        logger.error("❌ DESPLIEGUE COMPLETADO CON ADVERTENCIAS")
        sys.exit(1)


if __name__ == "__main__":
    main()