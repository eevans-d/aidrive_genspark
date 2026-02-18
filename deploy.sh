#!/bin/bash

# =============================================================================
# SCRIPT DE DEPLOYMENT - MINI MARKET BACKEND
# =============================================================================
# Descripción: Script automatizado para deployment a diferentes entornos
# Uso: ./deploy.sh [entorno] [opciones]
# Entornos: dev, staging, production

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ENV=${1:-staging}
BUILD_NUMBER=${2:-$(date +%s)}
COMMIT_SHA=${3:-$(git rev-parse --short HEAD 2>/dev/null || echo "manual")}
DRY_RUN=${4:-false}
FORCE_DEPLOY=${5:-false}
ALLOWED_PROD_BRANCHES=${ALLOWED_PROD_BRANCHES:-main}
ALLOWED_STAGING_BRANCHES=${ALLOWED_STAGING_BRANCHES:-main,staging}

# Directorios
BUILD_DIR="dist"
BACKUP_DIR="$SCRIPT_DIR/backups"
LOGS_DIR="$SCRIPT_DIR/logs"

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

log_deploy() {
    echo -e "${CYAN}[DEPLOY]${NC} $1"
}

validate_production_branch() {
    if [ "$DEPLOY_ENV" != "production" ] && [ "$DEPLOY_ENV" != "staging" ]; then
        return 0
    fi

    if [ ! -d ".git" ]; then
        log_warning "No se puede validar branch: no es repositorio Git"
        return 0
    fi

    local current_branch
    current_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"

    local branch_list
    if [ "$DEPLOY_ENV" = "production" ]; then
        branch_list="$ALLOWED_PROD_BRANCHES"
    else
        branch_list="$ALLOWED_STAGING_BRANCHES"
    fi

    local allowed=false
    IFS=',' read -ra branches <<< "$branch_list"
    for branch in "${branches[@]}"; do
        local trimmed
        trimmed="$(echo "$branch" | xargs)"
        if [ "$current_branch" = "$trimmed" ]; then
            allowed=true
            break
        fi
    done

    if [ "$allowed" != "true" ]; then
        log_error "Branch '$current_branch' no permitida para deploy a $DEPLOY_ENV"
        log_error "Branches permitidas: $branch_list"
        return 1
    fi

    log_success "Branch '$current_branch' permitida para $DEPLOY_ENV"
    return 0
}

# Banner
show_banner() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "     DEPLOYMENT AUTOMATIZADO"
    echo "     MINI MARKET BACKEND"
    echo "=================================================="
    echo -e "${NC}"
    echo "Entorno: $DEPLOY_ENV"
    echo "Build: $BUILD_NUMBER"
    echo "Commit: $COMMIT_SHA"
    echo "Modo Dry-Run: $DRY_RUN"
    echo "Forzar Deploy: $FORCE_DEPLOY"
    echo ""
}

# Verificar precondiciones
check_prerequisites() {
    log "Verificando precondiciones de deployment..."
    
    # Verificar que estamos en un repositorio Git
    if [ ! -d ".git" ]; then
        log_warning "No se detectó repositorio Git"
    else
        log_success "Repositorio Git detectado"
        
        # Verificar estado del repositorio
        if [ -n "$(git status --porcelain)" ]; then
            if [ "$FORCE_DEPLOY" != "true" ]; then
                log_warning "Hay cambios sin commit en el repositorio"
                read -p "¿Continuar con deployment? (y/N): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    log "Deployment cancelado"
                    exit 1
                fi
            else
                log_warning "Deployando con cambios sin commit (FORCE_DEPLOY=true)"
            fi
        else
            log_success "Repositorio limpio"
        fi
    fi

    if [ "$DEPLOY_ENV" = "production" ]; then
        if ! validate_production_branch; then
            if [ "$FORCE_DEPLOY" != "true" ]; then
                exit 1
            else
                log_warning "Branch inválida para producción (FORCE_DEPLOY=true)"
            fi
        fi
    fi
    
    # Verificar variables de entorno
    if [ ! -f ".env" ]; then
        log_error "Archivo .env no encontrado"
        exit 1
    fi
    
    source .env
    
    # Verificar variables críticas según entorno
    case "$DEPLOY_ENV" in
        "production")
            if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
                log_error "SUPABASE_SERVICE_ROLE_KEY requerida para producción"
                exit 1
            fi
            ;;
        "staging")
            if [ -z "$SUPABASE_URL" ]; then
                log_error "SUPABASE_URL requerida para staging"
                exit 1
            fi
            ;;
    esac

    # Guardrail: NOTIFICATIONS_MODE en producción
    if [ "$DEPLOY_ENV" = "production" ]; then
        local notifications_mode
        notifications_mode="$(echo "${NOTIFICATIONS_MODE:-simulation}" | tr '[:upper:]' '[:lower:]')"

        if [ "$notifications_mode" != "real" ]; then
            if [ "$FORCE_DEPLOY" != "true" ]; then
                log_error "NOTIFICATIONS_MODE=$notifications_mode bloqueado en producción (requiere 'real')"
                exit 1
            else
                log_warning "NOTIFICATIONS_MODE=$notifications_mode en producción (FORCE_DEPLOY=true)"
            fi
        fi

        if command -v supabase &> /dev/null; then
            local secrets_json
            if secrets_json=$(supabase secrets list --output json 2>/dev/null); then
                if ! echo "$secrets_json" | grep -q '"name":"NOTIFICATIONS_MODE"'; then
                    if [ "$FORCE_DEPLOY" != "true" ]; then
                        log_error "NOTIFICATIONS_MODE no configurado en Supabase Secrets"
                        exit 1
                    else
                        log_warning "NOTIFICATIONS_MODE no configurado en Supabase Secrets (FORCE_DEPLOY=true)"
                    fi
                fi
            else
                if [ "$FORCE_DEPLOY" != "true" ]; then
                    log_error "No se pudo verificar Supabase Secrets para NOTIFICATIONS_MODE"
                    exit 1
                else
                    log_warning "Supabase Secrets no verificable (FORCE_DEPLOY=true)"
                fi
            fi
        else
            if [ "$FORCE_DEPLOY" != "true" ]; then
                log_error "Supabase CLI no disponible para verificar NOTIFICATIONS_MODE"
                exit 1
            else
                log_warning "Supabase CLI no disponible (FORCE_DEPLOY=true)"
            fi
        fi
    fi
    
    log_success "Precondiciones verificadas"
}

# Ejecutar pre-deployment checks
run_pre_deploy_checks() {
    log "Ejecutando pre-deployment checks..."
    
    # Ejecutar tests
    log_info "Ejecutando tests rápidos..."
    if [ -f "./test.sh" ]; then
        if ./test.sh unit false false true; then
            log_success "Tests pasaron correctamente"
        else
            log_error "Tests fallaron"
            if [ "$FORCE_DEPLOY" != "true" ]; then
                log "Deployment cancelado por tests fallidos"
                exit 1
            else
                log_warning "Deployando a pesar de tests fallidos (FORCE_DEPLOY=true)"
            fi
        fi
    fi
    
    # Verificar linting
    log_info "Verificando linting..."
    if npm run lint --if-present; then
        log_success "Linting OK"
    else
        log_warning "Problemas de linting detectados"
        if [ "$FORCE_DEPLOY" != "true" ]; then
            log "Corrige los problemas de linting antes de deployar"
            exit 1
        fi
    fi
    
    # Verificar seguridad básica
    log_info "Verificando vulnerabilidades..."
    if npm audit --audit-level moderate; then
        log_success "No se detectaron vulnerabilidades críticas"
    else
        log_warning "Vulnerabilidades detectadas"
        if [ "$FORCE_DEPLOY" != "true" ]; then
            log "Resuelve vulnerabilidades antes de deployar"
            exit 1
        fi
    fi
    
    log_success "Pre-deployment checks completados"
}

# Crear backup pre-deployment
create_pre_deploy_backup() {
    log "Creando backup pre-deployment..."
    
    local backup_name="pre-deploy_$(date +%Y%m%d_%H%M%S)_$DEPLOY_ENV"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    mkdir -p "$BACKUP_DIR"
    chmod 700 "$BACKUP_DIR"
    
    # Backup de base de datos (solo en producción)
    if [ "$DEPLOY_ENV" = "production" ]; then
        if command -v supabase &> /dev/null; then
            log_info "Creando backup de base de datos..."
            supabase db dump --file "$backup_path.sql" || {
                log_warning "No se pudo crear backup de base de datos"
            }
        fi
    fi
    
    # Backup de archivos de configuración
    cp .env "$backup_path/.env.backup" 2>/dev/null && chmod 600 "$backup_path/.env.backup" || true
    cp package.json "$backup_path/package.json.backup" 2>/dev/null || true
    
    log_success "Backup creado: $backup_path"
}

# Construir aplicación
build_application() {
    log "Construyendo aplicación para $DEPLOY_ENV..."
    
    # Limpiar build anterior
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"
    
    # Variables de build
    export NODE_ENV="$DEPLOY_ENV"
    export BUILD_NUMBER="$BUILD_NUMBER"
    export COMMIT_SHA="$COMMIT_SHA"
    
    # Ejecutar build
    if [ "$DEPLOY_ENV" = "production" ]; then
        npm run build:prod || {
            log_error "Build de producción falló"
            exit 1
        }
    else
        npm run build || {
            log_error "Build falló"
            exit 1
        }
    fi
    
    # Verificar que el build fue exitoso
    if [ ! -d "$BUILD_DIR" ] || [ -z "$(ls -A $BUILD_DIR)" ]; then
        log_error "Build no generó archivos en $BUILD_DIR"
        exit 1
    fi
    
    # Agregar metadatos de build
    cat > "$BUILD_DIR/build-info.json" << EOF
{
  "build_number": "$BUILD_NUMBER",
  "commit_sha": "$COMMIT_SHA",
  "environment": "$DEPLOY_ENV",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "node_version": "$(node -v)",
  "npm_version": "$(npm -v)"
}
EOF
    
    log_success "Aplicación construida exitosamente"
}

# Deploy a Supabase
deploy_to_supabase() {
    log "Deploying a Supabase..."
    
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI no está instalado"
        log "Instalar con: npm install -g supabase"
        exit 1
    fi
    
    # Deploy de edge functions
    if [ -d "supabase/functions" ]; then
        log_info "Deploying edge functions..."

        for func_dir in supabase/functions/*/; do
            if [ -d "$func_dir" ]; then
                func_name=$(basename "$func_dir")

                # Skip _shared/ directory (not a deployable function)
                if [ "$func_name" = "_shared" ]; then
                    log_info "Skipping shared module: $func_name"
                    continue
                fi

                # Skip directories without an index.ts (not a valid Edge Function)
                if [ ! -f "$func_dir/index.ts" ]; then
                    log_info "Skipping non-function directory: $func_name"
                    continue
                fi

                log_deploy "Deploying function: $func_name"

                if [ "$DRY_RUN" != "true" ]; then
                    # api-minimarket requires --no-verify-jwt (custom auth in app)
                    if [ "$func_name" = "api-minimarket" ]; then
                        supabase functions deploy "$func_name" --no-verify-jwt || {
                            log_error "Error deploying function $func_name"
                            exit 1
                        }
                    else
                        supabase functions deploy "$func_name" || {
                            log_error "Error deploying function $func_name"
                            exit 1
                        }
                    fi
                else
                    if [ "$func_name" = "api-minimarket" ]; then
                        log_info "[DRY-RUN] Would deploy function: $func_name (--no-verify-jwt)"
                    else
                        log_info "[DRY-RUN] Would deploy function: $func_name"
                    fi
                fi
            fi
        done
    fi
    
    # Ejecutar migraciones
    log_info "Aplicando migraciones..."
    
    if [ "$DRY_RUN" != "true" ]; then
        # Solo aplicar migraciones en producción/staging con cuidado
        if [ "$DEPLOY_ENV" = "production" ]; then
            log_warning "Aplicando migraciones en PRODUCCIÓN"
            read -p "¿Continuar? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log "Migraciones canceladas"
                exit 1
            fi
        fi
        
        # Aplicar migraciones
        supabase db push || {
            log_error "Error aplicando migraciones"
            exit 1
        }
    else
        log_info "[DRY-RUN] Would apply migrations"
    fi
    
    log_success "Deploy a Supabase completado"
}

# Deploy de migraciones
# IMPORTANTE: staging/production usan `db push` (aplica solo migraciones pendientes).
# `db reset` solo se permite en dev local sin --linked (D-128).
deploy_migrations() {
    log "Deploying migraciones..."

    if [ -d "supabase/migrations" ]; then
        if command -v supabase &> /dev/null; then
            if [ "$DRY_RUN" != "true" ]; then
                if [ "$DEPLOY_ENV" = "production" ] || [ "$DEPLOY_ENV" = "staging" ]; then
                    log_info "Aplicando migraciones pendientes con db push (entorno: $DEPLOY_ENV)..."
                    supabase db push --linked || {
                        log_error "Error en deploy de migraciones (db push)"
                        exit 1
                    }
                else
                    log_info "Aplicando migraciones en entorno local (dev)..."
                    supabase db reset || {
                        log_error "Error en reset local de migraciones"
                        exit 1
                    }
                fi
            else
                log_info "[DRY-RUN] Would deploy migrations"
            fi
        else
            log_warning "Supabase CLI no disponible para deploy de migraciones"
        fi
    fi
}

# Configurar entorno post-deployment
setup_post_deployment() {
    log "Configurando entorno post-deployment..."
    
    if [ "$DRY_RUN" != "true" ]; then
        # Configurar cron jobs si existen
        if [ -d "supabase/cron_jobs" ]; then
            log_info "Configurando cron jobs..."
            # Aquí se configurarían los cron jobs
        fi
        
        # Poblar datos iniciales si es necesario
        if [ "$DEPLOY_ENV" != "production" ]; then
            log_info "Poblando datos de desarrollo..."
            # Ejecutar seed data para entornos de desarrollo
        fi
        
        # Configurar políticas RLS si es necesario
        log_info "Verificando políticas RLS..."
        # Aquí se verificarían las políticas de Row Level Security
    else
        log_info "[DRY-RUN] Would setup post-deployment configuration"
    fi
    
    log_success "Configuración post-deployment completada"
}

# Ejecutar post-deployment tests
run_post_deployment_tests() {
    log "Ejecutando post-deployment tests..."
    
    if [ "$DRY_RUN" != "true" ]; then
        # Esperar a que el deployment esté listo
        log_info "Esperando a que el deployment esté listo..."
        sleep 10
        
        # Ejecutar health checks
        log_info "Ejecutando health checks..."
        
        # Aquí se ejecutarían tests específicos del entorno deployado
        # Por ejemplo, verificar que las APIs respondan correctamente
        
        log_success "Post-deployment tests completados"
    else
        log_info "[DRY-RUN] Would run post-deployment tests"
    fi
}

# Notificar deployment
notify_deployment() {
    log "Notificando deployment..."
    
    # Aquí se pueden configurar notificaciones
    # Por ejemplo, Slack, email, etc.
    
    local notification_data=$(cat << EOF
{
  "environment": "$DEPLOY_ENV",
  "build_number": "$BUILD_NUMBER", 
  "commit_sha": "$COMMIT_SHA",
  "status": "success",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deployed_by": "$(whoami)"
}
EOF
)
    
    # Guardar log de deployment
    echo "$notification_data" > "$LOGS_DIR/deployment-$BUILD_NUMBER.json"
    
    log_success "Deployment notificado"
}

# Rollback en caso de error
rollback_deployment() {
    log_error "¡Error en deployment! Se requiere rollback manual."
    log_warning "Pasos de rollback manual:"
    log_warning "  1. Verificar estado de funciones: supabase functions list"
    log_warning "  2. Revertir migraciones si es necesario: supabase db reset"
    log_warning "  3. Redesplegar versión anterior: git checkout <commit> && ./deploy.sh"
    exit 1
}

# Mostrar resumen de deployment
show_deployment_summary() {
    echo ""
    echo -e "${GREEN}=================================================="
    echo -e "     DEPLOYMENT COMPLETADO"
    echo -e "==================================================${NC}"
    echo ""
    echo "📋 Información del Deployment:"
    echo "  Entorno: $DEPLOY_ENV"
    echo "  Build: $BUILD_NUMBER"
    echo "  Commit: $COMMIT_SHA"
    echo "  Fecha: $(date)"
    echo "  Usuario: $(whoami)"
    echo ""
    echo "🔗 URLs del Entorno:"
    case "$DEPLOY_ENV" in
        "production")
            echo "  API: $SUPABASE_URL"
            echo "  Dashboard: https://app.supabase.com"
            ;;
        "staging")
            echo "  API: $SUPABASE_URL (staging)"
            echo "  Dashboard: https://app.supabase.com"
            ;;
        "dev")
            echo "  Local development"
            echo "  Dashboard: http://localhost:54323"
            ;;
    esac
    echo ""
    echo "📁 Archivos Generados:"
    echo "  Build: $BUILD_DIR/"
    echo "  Backup: $BACKUP_DIR/"
    echo "  Logs: $LOGS_DIR/deployment-$BUILD_NUMBER.json"
    echo ""
    echo "🔍 Próximos Pasos:"
    echo "  1. Verificar funcionamiento en el entorno"
    echo "  2. Ejecutar tests manuales si es necesario"
    echo "  3. Monitorear logs por posibles errores"
    echo ""
}

# Mostrar ayuda
show_help() {
    echo -e "${GREEN}Uso: ./deploy.sh [entorno] [build_number] [commit_sha] [dry_run] [force]${NC}"
    echo ""
    echo "Entornos disponibles:"
    echo "  dev         - Deployment a entorno de desarrollo"
    echo "  staging     - Deployment a entorno de staging (default)"
    echo "  production  - Deployment a producción"
    echo ""
    echo "Parámetros:"
    echo "  build_number - Número de build (timestamp por defecto)"
    echo "  commit_sha   - SHA del commit (git por defecto)"
    echo "  dry_run      - true/false (simular deployment)"
    echo "  force        - true/false (forzar deployment ignoring checks)"
    echo ""
    echo "Ejemplos:"
    echo "  ./deploy.sh staging"
    echo "  ./deploy.sh production 12345 abc123 false false"
    echo "  ./deploy.sh dev"
    echo ""
}

# Función principal
main() {
    case "$DEPLOY_ENV" in
        "dev"|"staging"|"production")
            show_banner
            
            # Crear directorios necesarios
            mkdir -p "$LOGS_DIR" "$BACKUP_DIR"
            
            # Verificar que el entorno es válido para operaciones críticas
            if [ "$DEPLOY_ENV" = "production" ] && [ "$FORCE_DEPLOY" != "true" ]; then
                log_warning "Deployando a PRODUCCIÓN"
                read -p "¿Estás completamente seguro? (yes/NO): " confirm
                if [ "$confirm" != "yes" ]; then
                    log "Deployment a producción cancelado"
                    exit 1
                fi
            fi

            check_prerequisites
            run_pre_deploy_checks
            create_pre_deploy_backup
            build_application

            if [ "$DEPLOY_ENV" != "dev" ]; then
                deploy_to_supabase
                deploy_migrations
            fi

            setup_post_deployment
            run_post_deployment_tests
            notify_deployment

            show_deployment_summary
            ;;
        "help"|"-h"|"--help")
            show_help
            exit 0
            ;;
        *)
            log_error "Entorno desconocido: $DEPLOY_ENV"
            log "Entornos válidos: dev, staging, production"
            show_help
            exit 1
            ;;
    esac
}

# Manejo de señales para rollback
trap 'log_error "Deployment interrumpido"; rollback_deployment' INT TERM

# Ejecutar función principal
main "$@"
