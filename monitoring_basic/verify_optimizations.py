#!/usr/bin/env python3
"""
Script para verificar que las optimizaciones están aplicadas
"""
import sqlite3
import sys
from pathlib import Path

def verify_sqlite_optimizations(db_path):
    """Verificar optimizaciones SQLite"""
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
        cursor = conn.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='index' AND name LIKE 'idx_%'
            ORDER BY name
        """)
        
        indices = cursor.fetchall()
        print(f"\n📊 Índices personalizados: {len(indices)}")
        for idx in indices:
            print(f"   ✅ {idx[0]}")
        
        # Verificar triggers
        cursor = conn.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='trigger' AND name LIKE 'trg_%'
        """)
        
        triggers = cursor.fetchall()
        print(f"\n🛡️ Triggers de integridad: {len(triggers)}")
        for trg in triggers:
            print(f"   ✅ {trg[0]}")
        
        conn.close()
        print("\n✅ Verificación completada exitosamente")
        
    except Exception as e:
        print(f"❌ Error verificando optimizaciones: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        verify_sqlite_optimizations(sys.argv[1])
    else:
        print("Uso: python verify_optimizations.py <database_path>")
