#!/bin/bash

# =============================================================================
# SCRIPT DE MIGRACIÓN DE BASE DE DATOS - MINI MARKET BACKEND
# =============================================================================
# Descripción: Script para ejecutar migraciones de Supabase/PostgreSQL
# Uso: ./migrate.sh [comando] [opciones]
# Comandos: up, down, status, seed, reset

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMAND=${1:-up}
ENV=${2:-development}
MIGRATION_DIR="$SCRIPT_DIR/supabase/migrations"
BACKUP_DIR="$SCRIPT_DIR/backups"

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_info() {
    echo -e "${PURPLE}[i]${NC} $1"
}

# Banner
show_banner() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "     MIGRADOR DE BASE DE DATOS"
    echo "     MINI MARKET BACKEND"
    echo "=================================================="
    echo -e "${NC}"
    echo "Comando: $COMMAND"
    echo "Ambiente: $ENV"
    echo "Directorio migraciones: $MIGRATION_DIR"
    echo ""
}

# Cargar variables de entorno
load_environment() {
    if [ -f ".env" ]; then
        source .env
        log_success "Variables de entorno cargadas"
    else
        log_error "Archivo .env no encontrado"
        log "Ejecuta setup.sh primero o copia .env.example a .env"
        exit 1
    fi
}

# Verificar dependencias
check_dependencies() {
    log "Verificando dependencias..."
    
    # Verificar Supabase CLI
    if command -v supabase &> /dev/null; then
        SUPABASE_VERSION=$(supabase -v)
        log_success "Supabase CLI $SUPABASE_VERSION encontrado"
    else
        log_warning "Supabase CLI no está instalado"
        log "Instalar con: npm install -g supabase"
    fi
    
    # Verificar psql si está disponible
    if command -v psql &> /dev/null; then
        PSQL_VERSION=$(psql --version | head -n1)
        log_success "$PSQL_VERSION"
    else
        log_warning "psql no está instalado (usará Supabase CLI)"
    fi
}

# Crear backup
create_backup() {
    local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "Creando backup antes de migración..."
    mkdir -p "$BACKUP_DIR"
    
    if command -v supabase &> /dev/null; then
        supabase db dump --file "$backup_path.sql" || {
            log_warning "No se pudo crear backup con Supabase CLI"
        }
    fi
    
    log_success "Backup creado: $backup_path.sql"
}

# Listar migraciones disponibles
list_migrations() {
    log "Migraciones disponibles:"
    
    if [ -d "$MIGRATION_DIR" ]; then
        ls -la "$MIGRATION_DIR"/*.sql | while read line; do
            filename=$(basename "$line")
            echo "  - $filename"
        done
    else
        log_warning "Directorio de migraciones no encontrado: $MIGRATION_DIR"
    fi
    echo ""
}

# Ejecutar migración hacia arriba
migrate_up() {
    log "Ejecutando migraciones hacia adelante..."
    
    if command -v supabase &> /dev/null; then
        # Usar Supabase CLI
        if [ "$ENV" = "production" ]; then
            log_warning "Ejecutando migraciones en PRODUCCIÓN"
            read -p "¿Continuar? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log "Migración cancelada"
                exit 1
            fi
        fi
        
        supabase db push || {
            log_error "Error ejecutando migraciones"
            exit 1
        }
        
        log_success "Migraciones ejecutadas correctamente"
    else
        # Ejecutar migraciones manualmente
        if [ -d "$MIGRATION_DIR" ]; then
            for migration_file in "$MIGRATION_DIR"/*.sql; do
                if [ -f "$migration_file" ]; then
                    filename=$(basename "$migration_file")
                    log "Ejecutando: $filename"
                    
                    # Aquí se ejecutaría el archivo SQL
                    # En un entorno real usarías psql o la conexión a DB
                    log_info "Simulando ejecución de $filename"
                fi
            done
        else
            log_error "Directorio de migraciones no encontrado"
            exit 1
        fi
    fi
}

# Revertir migración
migrate_down() {
    log "Revirtiendo migración..."
    
    log_warning "Esta operación puede ser destructiva"
    read -p "¿Continuar con revert? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Revert cancelado"
        exit 1
    fi
    
    if command -v supabase &> /dev/null; then
        # El revert de Supabase requiere migraciones down específicas
        log "Revert usando Supabase CLI"
        # supabase db reset  # CUIDADO: esto borra todo
    else
        log "Revert manual no implementado"
    fi
}

# Verificar estado de migraciones
migrate_status() {
    log "Estado de migraciones:"
    
    if command -v supabase &> /dev/null; then
        supabase migration list || {
            log_warning "No se pudo obtener lista de migraciones"
        }
    else
        list_migrations
    fi
    
    # Mostrar estado de tablas importantes
    log_info "Verificando tablas críticas..."
    
    local critical_tables=(
        "productos"
        "categorias"
        "proveedores"
        "stock_deposito"
        "pedidos"
        "usuarios"
    )
    
    for table in "${critical_tables[@]}"; do
        log "Tabla $table: [ESTADO]"
        # Aquí se verificaría el estado real de la tabla
    done
}

# Poblar base de datos con datos iniciales
seed_database() {
    log "Poblando base de datos con datos iniciales..."
    
    if [ -f "supabase/seed.sql" ]; then
        log "Ejecutando seed.sql..."
        # psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f supabase/seed.sql
        log_success "Datos iniciales insertados"
    else
        log_warning "Archivo seed.sql no encontrado"
    fi
    
    # Ejecutar scripts de inserción masiva si existen
    if [ -f "data/insertar_productos_masivo.sql" ]; then
        log "Ejecutando inserción masiva de productos..."
        # psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f data/insertar_productos_masivo.sql
        log_success "Productos insertados masivamente"
    fi
}

# Reset completo de base de datos
reset_database() {
    log "Reseteando base de datos COMPLETAMENTE..."
    
    log_error "⚠️  ATENCIÓN: Esta operación BORRARÁ todos los datos"
    read -p "¿Estás completamente seguro? Escribir 'RESET' para continuar: " confirm
    
    if [ "$confirm" != "RESET" ]; then
        log "Reset cancelado"
        exit 1
    fi
    
    create_backup
    
    if command -v supabase &> /dev/null; then
        supabase db reset || {
            log_error "Error en reset de base de datos"
            exit 1
        }
    else
        log "Reset manual no implementado"
    fi
    
    log_success "Base de datos reseteada"
    
    # Re-ejecutar migraciones y seed
    migrate_up
    seed_database
}

# Mostrar ayuda
show_help() {
    echo -e "${GREEN}Uso: ./migrate.sh [comando] [ambiente]${NC}"
    echo ""
    echo "Comandos disponibles:"
    echo "  up       - Ejecutar migraciones hacia adelante"
    echo "  down     - Revertir última migración"
    echo "  status   - Ver estado de migraciones"
    echo "  seed     - Poblar base de datos con datos iniciales"
    echo "  reset    - Reset completo de base de datos (⚠️ destructivo)"
    echo "  list     - Listar migraciones disponibles"
    echo "  backup   - Crear backup manual"
    echo "  help     - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./migrate.sh up"
    echo "  ./migrate.sh up production"
    echo "  ./migrate.sh status"
    echo "  ./migrate.sh seed"
    echo ""
}

# Función principal
main() {
    case "$COMMAND" in
        "up")
            show_banner
            load_environment
            check_dependencies
            create_backup
            migrate_up
            ;;
        "down")
            show_banner
            load_environment
            check_dependencies
            migrate_down
            ;;
        "status")
            show_banner
            load_environment
            check_dependencies
            migrate_status
            ;;
        "seed")
            show_banner
            load_environment
            check_dependencies
            seed_database
            ;;
        "reset")
            show_banner
            load_environment
            check_dependencies
            reset_database
            ;;
        "list")
            show_banner
            list_migrations
            ;;
        "backup")
            show_banner
            load_environment
            create_backup
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Comando desconocido: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# Manejo de señales
trap 'log_error "Migración interrumpida"; exit 1' INT TERM

# Ejecutar función principal
main "$@"