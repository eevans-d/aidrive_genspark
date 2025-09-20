#!/bin/bash
#
# Script de Restauración para Dashboard Mini Market
# Restaura un backup específico de la BD SQLite
#

set -euo pipefail

# Configuración
DB_PATH="${MINIMARKET_DB_PATH:-inventario-retail/data/minimarket_inventory.db}"
BACKUP_DIR="${BACKUP_DIR:-backups}"

if [[ $# -ne 1 ]]; then
    echo "Uso: $0 <archivo_backup.db.gz>"
    echo ""
    echo "Backups disponibles:"
    ls -1 "$BACKUP_DIR"/minimarket_backup_*.db.gz 2>/dev/null || echo "  (ninguno encontrado)"
    exit 1
fi

BACKUP_FILE="$1"

# Verificar que el backup existe
if [[ ! -f "$BACKUP_FILE" ]]; then
    # Intentar buscar en el directorio de backups
    if [[ -f "$BACKUP_DIR/$BACKUP_FILE" ]]; then
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    else
        echo "ERROR: Backup no encontrado: $BACKUP_FILE"
        exit 1
    fi
fi

echo "=== Restauración Dashboard Mini Market - $(date) ==="
echo "Backup origen: $BACKUP_FILE"
echo "BD destino: $DB_PATH"

# Crear backup de la BD actual si existe
if [[ -f "$DB_PATH" ]]; then
    CURRENT_BACKUP="$DB_PATH.backup_$(date +%Y%m%d_%H%M%S)"
    echo "Creando respaldo de BD actual: $CURRENT_BACKUP"
    cp "$DB_PATH" "$CURRENT_BACKUP"
fi

# Verificar integridad del backup a restaurar
echo "Verificando integridad del backup..."
gunzip -c "$BACKUP_FILE" > "/tmp/restore_test.db"
if ! sqlite3 "/tmp/restore_test.db" "PRAGMA integrity_check;" | grep -q "ok"; then
    echo "ERROR: El backup presenta problemas de integridad"
    rm -f "/tmp/restore_test.db"
    exit 1
fi

# Restaurar
echo "Restaurando base de datos..."
mkdir -p "$(dirname "$DB_PATH")"
gunzip -c "$BACKUP_FILE" > "$DB_PATH"
rm -f "/tmp/restore_test.db"

# Verificar BD restaurada
echo "Verificando BD restaurada..."
if ! sqlite3 "$DB_PATH" "PRAGMA integrity_check;" | grep -q "ok"; then
    echo "ERROR: La BD restaurada presenta problemas"
    # Restaurar backup previo si existe
    if [[ -n "${CURRENT_BACKUP:-}" && -f "$CURRENT_BACKUP" ]]; then
        echo "Restaurando BD previa..."
        cp "$CURRENT_BACKUP" "$DB_PATH"
    fi
    exit 1
fi

echo "✅ Restauración completada exitosamente"
echo "   BD restaurada: $DB_PATH"
echo "   Desde backup: $BACKUP_FILE"
[[ -n "${CURRENT_BACKUP:-}" ]] && echo "   Backup previo: $CURRENT_BACKUP"
echo "   Fecha: $(date)"