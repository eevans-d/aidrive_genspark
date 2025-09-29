#!/usr/bin/env python3
"""
Script básico para verificar métricas retail
"""
import sqlite3
import json
from datetime import datetime
from pathlib import Path

def check_retail_metrics(db_path):
    """Verificar métricas básicas del sistema retail"""
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        
        metrics = {
            "timestamp": datetime.now().isoformat(),
            "database": db_path
        }
        
        # Valor total inventario
        cursor = conn.execute("""
            SELECT 
                COUNT(*) as total_productos,
                SUM(stock_actual * precio_ars) as valor_total
            FROM productos WHERE activo = 1
        """)
        row = cursor.fetchone()
        metrics["total_productos"] = row["total_productos"]
        metrics["valor_inventario_ars"] = float(row["valor_total"] or 0)
        
        # Productos con stock bajo
        cursor = conn.execute("""
            SELECT COUNT(*) as stock_bajo
            FROM productos 
            WHERE stock_actual <= stock_minimo AND activo = 1
        """)
        metrics["productos_stock_bajo"] = cursor.fetchone()["stock_bajo"]
        
        # Movimientos del día
        cursor = conn.execute("""
            SELECT COUNT(*) as movimientos_hoy
            FROM movimientos_stock 
            WHERE date(created_at) = date('now')
        """)
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
