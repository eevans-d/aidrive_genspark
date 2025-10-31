#!/bin/bash

# =============================================================================
# SCRIPT DE INSTALACIÓN - MINI MARKET BACKEND
# =============================================================================
# Descripción: Script automatizado para configurar el entorno de desarrollo
# Uso: ./setup.sh [opciones]
# Opciones: --dev (instalación desarrollo), --prod (instalación producción)

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="minimarket-backend"
ENV=${1:-dev}

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

# Banner
show_banner() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "     CONFIGURADOR MINI MARKET BACKEND"
    echo "=================================================="
    echo -e "${NC}"
    echo "Proyecto: $PROJECT_NAME"
    echo "Ambiente: $ENV"
    echo "Directorio: $SCRIPT_DIR"
    echo ""
}

# Verificar dependencias
check_dependencies() {
    log "Verificando dependencias del sistema..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js no está instalado. Por favor instalar Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | sed 's/v//')
    log_success "Node.js $NODE_VERSION encontrado"
    
    # Verificar npm/pnpm
    if command -v pnpm &> /dev/null; then
        PACKAGE_MANAGER="pnpm"
        PACKAGE_MANAGER_VERSION=$(pnpm -v)
        log_success "pnpm $PACKAGE_MANAGER_VERSION encontrado"
    elif command -v npm &> /dev/null; then
        PACKAGE_MANAGER="npm"
        PACKAGE_MANAGER_VERSION=$(npm -v)
        log_success "npm $PACKAGE_MANAGER_VERSION encontrado"
    else
        log_error "No se encontró npm ni pnpm"
        exit 1
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        log_warning "Git no está instalado (opcional para desarrollo)"
    else
        log_success "Git encontrado"
    fi
}

# Configurar variables de entorno
setup_environment() {
    log "Configurando variables de entorno..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_success "Archivo .env creado desde .env.example"
            log_warning "Por favor configurar las variables en .env antes de continuar"
        else
            log_warning "No se encontró .env.example"
        fi
    else
        log_success "Archivo .env ya existe"
    fi
    
    # Crear directorios necesarios
    mkdir -p logs
    mkdir -p temp
    mkdir -p backups
    
    log_success "Directorios de trabajo creados"
}

# Instalar dependencias
install_dependencies() {
    log "Instalando dependencias..."
    
    if [ "$ENV" = "prod" ]; then
        $PACKAGE_MANAGER install --production
        log_success "Dependencias de producción instaladas"
    else
        $PACKAGE_MANAGER install
        log_success "Dependencias de desarrollo instaladas"
    fi
}

# Configurar hooks de Git
setup_git_hooks() {
    log "Configurando hooks de Git..."
    
    if [ -d ".git" ]; then
        # Crear pre-commit hook
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# Pre-commit hook para Mini Market Backend

echo "Ejecutando pre-commit checks..."

# Verificar linting
npm run lint --if-present || {
    echo "Linting falló. Corrige los errores antes de hacer commit."
    exit 1
}

# Verificar tests (si existen)
npm test --if-present || {
    echo "Tests fallaron. Corrige los errores antes de hacer commit."
    exit 1
}

echo "Pre-commit checks pasaron correctamente."
EOF
        
        chmod +x .git/hooks/pre-commit
        log_success "Pre-commit hook configurado"
    else
        log_warning "No es un repositorio Git"
    fi
}

# Configurar Supabase CLI
setup_supabase() {
    log "Verificando configuración de Supabase..."
    
    if command -v supabase &> /dev/null; then
        SUPABASE_VERSION=$(supabase -v)
        log_success "Supabase CLI $SUPABASE_VERSION encontrado"
        
        # Verificar configuración local
        if [ -f "supabase/config.toml" ]; then
            log_success "Configuración de Supabase encontrada"
        else
            log_warning "Configuración de Supabase no encontrada"
            log "Ejecuta 'supabase init' para inicializar"
        fi
    else
        log_warning "Supabase CLI no está instalado"
        log "Instalar con: npm install -g supabase"
    fi
}

# Crear scripts útiles
create_useful_scripts() {
    log "Creando scripts adicionales..."
    
    # Script de desarrollo rápido
    cat > dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando entorno de desarrollo..."
source .env
npm run dev
EOF
    chmod +x dev.sh
    
    # Script de logs
    cat > logs.sh << 'EOF'
#!/bin/bash
echo "📋 Mostrando logs de aplicación..."
tail -f logs/app.log 2>/dev/null || echo "Archivo de logs no encontrado"
EOF
    chmod +x logs.sh
    
    log_success "Scripts adicionales creados (dev.sh, logs.sh)"
}

# Verificar instalación
verify_installation() {
    log "Verificando instalación..."
    
    # Verificar que los archivos críticos existen
    local files_to_check=(
        ".env"
        "package.json"
        "setup.sh"
        "migrate.sh"
        "test.sh"
        "deploy.sh"
    )
    
    for file in "${files_to_check[@]}"; do
        if [ -f "$file" ]; then
            log_success "$file existe"
        else
            log_warning "$file no encontrado"
        fi
    done
}

# Mostrar siguiente pasos
show_next_steps() {
    echo ""
    echo -e "${GREEN}=================================================="
    echo -e "     INSTALACIÓN COMPLETADA"
    echo -e "==================================================${NC}"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Configurar variables de entorno en .env"
    echo "2. Ejecutar migraciones: ./migrate.sh"
    echo "3. Ejecutar tests: ./test.sh"
    echo "4. Iniciar desarrollo: ./dev.sh"
    echo ""
    echo "📚 Scripts disponibles:"
    echo "  setup.sh      - Configurar entorno"
    echo "  migrate.sh    - Ejecutar migraciones DB"
    echo "  test.sh       - Ejecutar tests"
    echo "  deploy.sh     - Deploy a producción"
    echo "  dev.sh        - Iniciar desarrollo"
    echo "  logs.sh       - Ver logs"
    echo ""
    echo "🔧 Para más información:"
    echo "  cat README.md"
    echo "  ./deploy.sh --help"
    echo ""
}

# Función principal
main() {
    show_banner
    
    log "Iniciando configuración del entorno $ENV..."
    
    check_dependencies
    setup_environment
    install_dependencies
    setup_git_hooks
    setup_supabase
    create_useful_scripts
    verify_installation
    show_next_steps
    
    log_success "¡Configuración completada exitosamente!"
}

# Manejo de señales
trap 'log_error "Instalación interrumpida"; exit 1' INT TERM

# Ejecutar función principal
main "$@"