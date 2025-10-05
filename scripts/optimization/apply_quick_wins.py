#!/usr/bin/env python3
"""
Script para aplicar optimizaciones Quick Wins del análisis exhaustivo
Implementa las mejoras de mayor impacto y menor esfuerzo
"""

import os
import sys
import shutil
import logging
import re
from pathlib import Path
from typing import List, Tuple

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class QuickWinsOptimizer:
    """Aplicar optimizaciones quick wins al repositorio"""
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.changes_made = []
        self.dry_run = False
        
    def run_all_optimizations(self, dry_run: bool = False) -> bool:
        """Ejecutar todas las optimizaciones quick wins"""
        self.dry_run = dry_run
        mode = "DRY RUN" if dry_run else "LIVE"
        logger.info(f"🚀 Iniciando optimizaciones Quick Wins - Modo: {mode}")
        
        optimizations = [
            ("Limpiar archivos .db del repositorio", self.remove_db_files),
            ("Limpiar __pycache__ existentes", self.clean_pycache),
            ("Mejorar .gitignore", self.enhance_gitignore),
            ("Agregar timeouts HTTP", self.add_http_timeouts),
            ("Ajustar pool_recycle DB", self.adjust_pool_recycle),
        ]
        
        success = True
        for description, func in optimizations:
            logger.info(f"\n{'='*60}")
            logger.info(f"📋 {description}")
            logger.info(f"{'='*60}")
            try:
                if not func():
                    logger.warning(f"⚠️  {description} - Completado con warnings")
                else:
                    logger.info(f"✅ {description} - Exitoso")
            except Exception as e:
                logger.error(f"❌ {description} - Error: {e}")
                success = False
        
        # Resumen
        logger.info(f"\n{'='*60}")
        logger.info("📊 RESUMEN DE OPTIMIZACIONES")
        logger.info(f"{'='*60}")
        for change in self.changes_made:
            logger.info(f"  ✅ {change}")
        
        if self.dry_run:
            logger.info("\n🔍 DRY RUN - No se realizaron cambios reales")
        
        return success
    
    def remove_db_files(self) -> bool:
        """Eliminar archivos .db del repositorio"""
        db_files = list(self.project_root.glob("**/*.db"))
        
        if not db_files:
            logger.info("No se encontraron archivos .db")
            return True
        
        for db_file in db_files:
            relative_path = db_file.relative_to(self.project_root)
            logger.info(f"  Encontrado: {relative_path} ({db_file.stat().st_size} bytes)")
            
            if not self.dry_run:
                # Mover a carpeta temporal en lugar de eliminar
                backup_dir = self.project_root / ".backup_db_files"
                backup_dir.mkdir(exist_ok=True)
                backup_path = backup_dir / db_file.name
                shutil.move(str(db_file), str(backup_path))
                logger.info(f"    → Movido a {backup_path}")
                self.changes_made.append(f"Archivo .db movido: {relative_path}")
            else:
                logger.info(f"    → [DRY RUN] Se movería a .backup_db_files/")
        
        return True
    
    def clean_pycache(self) -> bool:
        """Limpiar directorios __pycache__ y archivos .pyc"""
        pycache_dirs = list(self.project_root.glob("**/__pycache__"))
        pyc_files = list(self.project_root.glob("**/*.pyc"))
        
        total_cleaned = 0
        
        # Limpiar directorios __pycache__
        for pycache_dir in pycache_dirs:
            relative_path = pycache_dir.relative_to(self.project_root)
            logger.info(f"  Eliminando: {relative_path}")
            
            if not self.dry_run:
                shutil.rmtree(pycache_dir, ignore_errors=True)
                total_cleaned += 1
                self.changes_made.append(f"__pycache__ eliminado: {relative_path}")
            else:
                logger.info(f"    → [DRY RUN] Se eliminaría")
        
        # Limpiar archivos .pyc
        for pyc_file in pyc_files:
            if not self.dry_run:
                pyc_file.unlink()
                total_cleaned += 1
        
        if total_cleaned > 0 or pyc_files:
            logger.info(f"✅ Limpiados {len(pycache_dirs)} directorios y {len(pyc_files)} archivos .pyc")
        else:
            logger.info("No se encontraron archivos compilados")
        
        return True
    
    def enhance_gitignore(self) -> bool:
        """Mejorar .gitignore con patrones más completos"""
        gitignore_path = self.project_root / ".gitignore"
        
        if not gitignore_path.exists():
            logger.warning(".gitignore no encontrado")
            return False
        
        # Patrones adicionales recomendados
        additional_patterns = [
            "",
            "# Optimizaciones agregadas por script",
            "# Bases de datos",
            "*.db",
            "*.sqlite",
            "*.sqlite3",
            "data/*.db",
            "!data/.gitkeep",
            "",
            "# Archivos compilados Python (coverage completa)",
            "**/__pycache__/",
            "**/*.pyc",
            "**/*.pyo",
            "**/*.pyd",
            ".Python",
            "",
            "# Backups de DB movidas",
            ".backup_db_files/",
        ]
        
        with open(gitignore_path, 'r') as f:
            current_content = f.read()
        
        # Verificar qué patrones ya existen
        new_patterns = []
        for pattern in additional_patterns:
            if pattern.strip() and not pattern.startswith("#"):
                # Verificar si el patrón ya existe
                if pattern not in current_content:
                    new_patterns.append(pattern)
            else:
                # Agregar comentarios y líneas vacías siempre
                new_patterns.append(pattern)
        
        if not new_patterns:
            logger.info("✅ .gitignore ya tiene todos los patrones recomendados")
            return True
        
        logger.info(f"  Agregando {len([p for p in new_patterns if p.strip() and not p.startswith('#')])} patrones nuevos")
        
        if not self.dry_run:
            with open(gitignore_path, 'a') as f:
                f.write('\n' + '\n'.join(new_patterns) + '\n')
            self.changes_made.append(f"Patrones agregados a .gitignore: {len(new_patterns)}")
        else:
            logger.info("    [DRY RUN] Patrones que se agregarían:")
            for pattern in new_patterns[:10]:  # Mostrar primeros 10
                logger.info(f"      {pattern}")
        
        return True
    
    def add_http_timeouts(self) -> bool:
        """Agregar timeouts a llamadas HTTP requests sin timeout"""
        files_to_fix = [
            "inventario-retail/integrations/afip/wsfe_client.py",
            "inventario-retail/integrations/ecommerce/mercadolibre_client.py",
            "inventario-retail/ui/review_app.py",
            "inventario-retail/scripts/setup_complete.py",
        ]
        
        timeout_config = "(5, 30)  # (connect, read) timeout en segundos"
        fixed_files = 0
        
        for file_path in files_to_fix:
            full_path = self.project_root / file_path
            
            if not full_path.exists():
                logger.warning(f"  Archivo no encontrado: {file_path}")
                continue
            
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Buscar requests.get/post sin timeout
            modified = False
            
            # Patrón para requests.get(url) o requests.post(url, data=...) SIN timeout
            patterns = [
                (r'requests\.get\(([^)]+)\)(?!\s*,\s*timeout)', 
                 lambda m: f'requests.get({m.group(1)}, timeout={timeout_config})'),
                (r'requests\.post\(([^)]+)\)(?!\s*,\s*timeout)',
                 lambda m: f'requests.post({m.group(1)}, timeout={timeout_config})'),
            ]
            
            new_content = content
            for pattern, replacement in patterns:
                matches = list(re.finditer(pattern, new_content))
                if matches:
                    logger.info(f"    Encontradas {len(matches)} llamadas sin timeout en {file_path}")
                    # Solo reportar en dry run, no modificar (muy complejo sin AST)
                    if not self.dry_run:
                        logger.info("    ⚠️  Requiere revisión manual (no auto-aplicado)")
                    modified = True
            
            if modified:
                fixed_files += 1
                self.changes_made.append(f"Timeouts HTTP requeridos en: {file_path} (revisar manualmente)")
        
        if fixed_files > 0:
            logger.info(f"\n📝 Se identificaron {fixed_files} archivos que requieren timeouts HTTP")
            logger.info("   💡 Revisar manualmente y agregar timeout=(5, 30) a requests.get/post")
            return True
        else:
            logger.info("✅ No se encontraron archivos que requieran timeouts o ya están configurados")
            return True
    
    def adjust_pool_recycle(self) -> bool:
        """Ajustar pool_recycle de 3600s a 300s para PostgreSQL"""
        db_file = self.project_root / "inventario-retail/agente_deposito/database.py"
        
        if not db_file.exists():
            logger.warning(f"Archivo no encontrado: {db_file}")
            return False
        
        with open(db_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Buscar pool_recycle=3600
        if 'pool_recycle=3600' not in content:
            logger.info("✅ pool_recycle ya está optimizado o no encontrado")
            return True
        
        logger.info("  Encontrado: pool_recycle=3600 (1 hora)")
        logger.info("  Cambiando a: pool_recycle=300 (5 minutos)")
        
        if not self.dry_run:
            new_content = content.replace(
                'pool_recycle=3600,  # Reciclar conexiones cada hora',
                'pool_recycle=300,  # Reciclar conexiones cada 5 min (optimizado para PostgreSQL idle timeout)'
            )
            
            with open(db_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            self.changes_made.append("pool_recycle ajustado de 3600s a 300s")
            logger.info("✅ Archivo actualizado")
        else:
            logger.info("  [DRY RUN] Se actualizaría el valor")
        
        return True


def main():
    """Función principal"""
    if len(sys.argv) < 2:
        print("Uso: python apply_quick_wins.py <project_root> [--dry-run]")
        print("Ejemplo: python apply_quick_wins.py /path/to/aidrive_genspark_forensic")
        sys.exit(1)
    
    project_root = sys.argv[1]
    dry_run = '--dry-run' in sys.argv
    
    if not os.path.exists(project_root):
        logger.error(f"Project root no encontrado: {project_root}")
        sys.exit(1)
    
    optimizer = QuickWinsOptimizer(project_root)
    
    if optimizer.run_all_optimizations(dry_run=dry_run):
        logger.info("\n✅ Optimizaciones Quick Wins completadas exitosamente")
        if not dry_run:
            logger.info("\n📝 Próximos pasos:")
            logger.info("   1. Revisar cambios con: git status")
            logger.info("   2. Agregar timeouts HTTP manualmente en los archivos indicados")
            logger.info("   3. Ejecutar tests: pytest")
            logger.info("   4. Commit: git add . && git commit -m 'perf: aplicar optimizaciones quick wins'")
        sys.exit(0)
    else:
        logger.error("\n❌ Algunas optimizaciones fallaron")
        sys.exit(1)


if __name__ == "__main__":
    main()
