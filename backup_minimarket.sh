#!/bin/bash
#
# Sistema de Backup Automático para Dashboard Mini Market
# Crea backups comprimidos de la BD SQLite con verificación de integridad
#

set -euo pipefail

# Configuración
DB_PATH="${MINIMARKET_DB_PATH:-inventario-retail/data/minimarket_inventory.db}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="minimarket_backup_${DATE}.db"
COMPRESSED_BACKUP="${BACKUP_NAME}.gz"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo "=== Backup Dashboard Mini Market - $(date) ==="

# Verificar que la BD existe
if [[ ! -f "$DB_PATH" ]]; then
    echo "ERROR: Base de datos no encontrada en: $DB_PATH"
    exit 1
fi

echo "Verificando integridad de la base de datos..."
if ! sqlite3 "$DB_PATH" "PRAGMA integrity_check;" | grep -q "ok"; then
    echo "ERROR: La base de datos presenta problemas de integridad"
    exit 1
fi

echo "Creando backup de: $DB_PATH"
# Realizar backup usando SQLite .backup command
sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/$BACKUP_NAME'"

echo "Comprimiendo backup..."
gzip "$BACKUP_DIR/$BACKUP_NAME"

echo "Verificando backup comprimido..."
if [[ ! -f "$BACKUP_DIR/$COMPRESSED_BACKUP" ]]; then
    echo "ERROR: Falló la compresión del backup"
    exit 1
fi

# Verificar integridad del backup descomprimido
echo "Validando integridad del backup..."
gunzip -c "$BACKUP_DIR/$COMPRESSED_BACKUP" > "/tmp/backup_test.db"
if ! sqlite3 "/tmp/backup_test.db" "PRAGMA integrity_check;" | grep -q "ok"; then
    echo "ERROR: El backup presenta problemas de integridad"
    rm -f "/tmp/backup_test.db"
    exit 1
fi
rm -f "/tmp/backup_test.db"

# Limpiar backups antiguos
echo "Limpiando backups antiguos (>${RETENTION_DAYS} días)..."
find "$BACKUP_DIR" -name "minimarket_backup_*.db.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

# Mostrar información del backup
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$COMPRESSED_BACKUP" | cut -f1)
echo "✅ Backup completado exitosamente:"
echo "   Archivo: $BACKUP_DIR/$COMPRESSED_BACKUP"
echo "   Tamaño: $BACKUP_SIZE"
echo "   Fecha: $(date)"

# Listar backups existentes
echo ""
echo "Backups disponibles:"
ls -lah "$BACKUP_DIR"/minimarket_backup_*.db.gz 2>/dev/null || echo "  (ninguno anterior)"

echo "=== Backup finalizado ==="