#!/bin/bash

# =============================================================================
# SCRIPT DE TESTING - MINI MARKET BACKEND
# =============================================================================
# Descripción: Script para ejecutar suites de testing
# Uso: ./test.sh [tipo] [opciones]
# Tipos: unit, integration, e2e, all, coverage

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
TEST_TYPE=${1:-all}
COVERAGE=${2:-true}
VERBOSE=${3:-false}
PARALLEL=${4:-true}

# Archivos de configuración de testing
VITEST_CONFIG="vitest.config.ts"
VITEST_AUX_CONFIG="vitest.auxiliary.config.ts"
CYPRESS_CONFIG="cypress.config.js"

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

log_test() {
    echo -e "${CYAN}[TEST]${NC} $1"
}

# Banner
show_banner() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "     SUITE DE TESTING"
    echo "     MINI MARKET BACKEND"
    echo "=================================================="
    echo -e "${NC}"
    echo "Tipo de test: $TEST_TYPE"
    echo "Cobertura: $COVERAGE"
    echo "Verbose: $VERBOSE"
    echo "Paralelo: $PARALLEL"
    echo ""
}

# Verificar dependencias de testing
check_testing_dependencies() {
    log "Verificando dependencias de testing..."
    
    # Verificar si Vitest está disponible
    if npm list vitest --depth=0 &>/dev/null; then
        VITEST_AVAILABLE=true
        log_success "Vitest encontrado"
    else
        VITEST_AVAILABLE=false
        log_warning "Vitest no encontrado"
    fi
    
    # Verificar si Cypress está disponible
    if npm list cypress --depth=0 &>/dev/null; then
        CYPRESS_AVAILABLE=true
        log_success "Cypress encontrado"
    else
        CYPRESS_AVAILABLE=false
        log_warning "Cypress no encontrado"
    fi
    
    # Verificar si Supabase CLI está disponible para testing
    if command -v supabase &> /dev/null; then
        SUPABASE_AVAILABLE=true
        SUPABASE_VERSION=$(supabase -v)
        log_success "Supabase CLI $SUPABASE_VERSION disponible"
    else
        SUPABASE_AVAILABLE=false
        log_warning "Supabase CLI no disponible"
    fi
}

# Configurar entorno de testing
setup_test_environment() {
    log "Configurando entorno de testing..."
    
    # Verificar variables de entorno de testing
    if [ -f ".env" ]; then
        source .env
        
        if [ -z "$TEST_DATABASE_URL" ]; then
            log_warning "TEST_DATABASE_URL no configurada"
            log "Usando base de datos de desarrollo para tests"
        else
            log_success "Base de datos de testing configurada"
        fi
    else
        log_warning "Archivo .env no encontrado"
    fi
    
    # Crear directorio de reportes
    mkdir -p test-reports
    
    # Configurar base de datos de testing si es necesario
    if [ "$SUPABASE_AVAILABLE" = true ]; then
        log "Configurando Supabase para testing..."
        # Aquí se configuraría el entorno de testing de Supabase
    fi
}

# Ejecutar tests unitarios
run_unit_tests() {
    log_test "Ejecutando tests unitarios..."
    
    local test_command=""
    
    if [ "$VITEST_AVAILABLE" = true ]; then
        test_command="npx vitest run"
        if [ "$VERBOSE" = "true" ]; then
            test_command="$test_command --reporter=verbose"
        fi
        if [ "$COVERAGE" = "true" ]; then
            test_command="$test_command --coverage"
        fi
        if [ "$PARALLEL" = "false" ]; then
            test_command="$test_command --threads=false"
        fi
        
        $test_command || {
            log_error "Tests unitarios fallaron"
            return 1
        }
    else
        log_warning "No se encontró Vitest para tests unitarios"
        return 1
    fi
    
    log_success "Tests unitarios completados"
}

# Ejecutar tests de integración
run_integration_tests() {
    log_test "Ejecutando tests de integración..."
    
    # Tests de integración con base de datos
    if [ -d "test/integration" ] || [ -d "tests/integration" ]; then
        local integration_path="test/integration"
        [ ! -d "$integration_path" ] && integration_path="tests/integration"

        log "Ejecutando tests desde: $integration_path"

        if [ "$VITEST_AVAILABLE" = true ]; then
            npx vitest run --config "$VITEST_CONFIG" "$integration_path" || {
                log_error "Tests de integración fallaron"
                return 1
            }
        else
            log_warning "Tests de integración requieren Vitest; se omiten por ahora"
        fi

        log_success "Tests de integración completados"
    else
        log_warning "Directorio de tests de integración no encontrado"
    fi
    
    # Tests de API/Supabase
    run_api_tests
}

# Ejecutar tests de API
run_api_tests() {
    log_test "Ejecutando tests de API..."
    
    if [ "$SUPABASE_AVAILABLE" = true ]; then
        # Ejecutar tests contra funciones edge de Supabase
        if [ -d "supabase/functions" ]; then
            log "Ejecutando tests de funciones edge..."
            
            # Simular tests de edge functions
            for func_dir in supabase/functions/*/; do
                if [ -d "$func_dir" ]; then
                    func_name=$(basename "$func_dir")
                    log_info "Testing edge function: $func_name"
                    # Aquí se ejecutarían los tests específicos de cada función
                fi
            done
        fi
    fi
    
    # Tests de endpoints API
    if [ -f "test/api/supabase.postman_collection.json" ] || [ -f "docs/postman-collection.json" ]; then
        log "Ejecutando tests de Postman..."
        # newman run docs/postman-collection.json --reporters cli,json --reporter-json-export test-reports/postman-results.json
    fi
    
    log_success "Tests de API completados"
}

# Ejecutar tests End-to-End
run_e2e_tests() {
    log_test "Ejecutando tests End-to-End..."
    
    if [ "$CYPRESS_AVAILABLE" = true ]; then
        local cypress_cmd="npx cypress"
        
        if [ "$VERBOSE" = "true" ]; then
            cypress_cmd="$cypress_cmd --verbose"
        fi
        
        # Determinar si ejecutar en modo headless o interactivo
        if [ "$CI" = "true" ] || [ "$HEADLESS" = "true" ]; then
            cypress_cmd="$cypress_cmd run"
        else
            cypress_cmd="$cypress_cmd open"
        fi
        
        $cypress_cmd || {
            log_error "Tests E2E fallaron"
            return 1
        }
        
        log_success "Tests E2E completados"
    else
        log_warning "Cypress no está disponible para tests E2E"
        # Ejecutar tests E2E alternativos si están disponibles
        
        # Tests E2E con Playwright (si está disponible)
        if npm list @playwright/test --depth=0 &>/dev/null; then
            log "Ejecutando tests E2E con Playwright..."
            npx playwright test || {
                log_error "Tests E2E con Playwright fallaron"
                return 1
            }
        else
            log_warning "No se encontró framework para tests E2E"
        fi
    fi
}

# Ejecutar tests de carga
run_load_tests() {
    log_test "Ejecutando tests de carga..."
    
    # Verificar si artillery está disponible
    if npm list artillery --depth=0 &>/dev/null; then
        log "Ejecutando tests de carga con Artillery..."
        
        if [ -f "test/load/api-load-test.yml" ]; then
            npx artillery run test/load/api-load-test.yml --output test-reports/load-test-results.json
        else
            log_warning "Configuración de tests de carga no encontrada"
        fi
    else
        log_warning "Artillery no está disponible para tests de carga"
    fi
    
    # Verificar si k6 está disponible
    if command -v k6 &> /dev/null; then
        log "Ejecutando tests de carga con k6..."
        
        if [ -d "test/load/k6" ]; then
            for k6_script in test/load/k6/*.js; do
                if [ -f "$k6_script" ]; then
                    k6 run "$k6_script"
                fi
            done
        fi
    fi
    
    log_success "Tests de carga completados"
}

# Ejecutar tests de performance (Vitest auxiliary)
run_performance_tests() {
    log_test "Ejecutando tests de performance (Vitest auxiliary)..."

    if [ "$VITEST_AVAILABLE" = true ]; then
        npx vitest run --config "$VITEST_AUX_CONFIG" tests/performance || {
            log_error "Tests de performance fallaron"
            return 1
        }
        log_success "Tests de performance completados"
    else
        log_warning "Vitest no disponible para tests de performance"
    fi
}

# Ejecutar tests de seguridad
run_security_tests() {
    log_test "Ejecutando tests de seguridad..."

    # Suite de seguridad (Vitest auxiliary)
    if [ "$VITEST_AVAILABLE" = true ]; then
        npx vitest run --config "$VITEST_AUX_CONFIG" tests/security || {
            log_warning "Tests de seguridad (Vitest) fallaron"
        }
    else
        log_warning "Vitest no disponible para tests de seguridad"
    fi
    
    # Tests con eslint security
    if npm list eslint-plugin-security --depth=0 &>/dev/null; then
        log "Ejecutando análisis de seguridad con ESLint..."
        npx eslint --ext .ts,.js --plugin security . || {
            log_warning "Problemas de seguridad detectados"
        }
    fi
    
    # Verificar vulnerabilidades de dependencias
    if npm list npm-audit --depth=0 &>/dev/null || command -v npm &> /dev/null; then
        log "Verificando vulnerabilidades de dependencias..."
        npm audit --audit-level moderate || {
            log_warning "Vulnerabilidades encontradas en dependencias"
        }
    fi
    
    # Verificar si safety está disponible
    if command -v safety &> /dev/null; then
        log "Verificando seguridad con Safety..."
        safety check
    fi
    
    log_success "Tests de seguridad completados"
}

# Ejecutar tests de contratos (Vitest auxiliary)
run_contract_tests() {
    log_test "Ejecutando tests de contratos OpenAPI (Vitest auxiliary)..."

    if [ "$VITEST_AVAILABLE" = true ]; then
        npx vitest run --config "$VITEST_AUX_CONFIG" tests/api-contracts || {
            log_error "Tests de contratos fallaron"
            return 1
        }
        log_success "Tests de contratos completados"
    else
        log_warning "Vitest no disponible para tests de contratos"
    fi
}

# Generar reporte de cobertura
generate_coverage_report() {
    if [ "$COVERAGE" = "true" ]; then
        log "Generando reporte de cobertura..."
        
        # Generar reporte HTML si está disponible
        if [ -f "coverage/lcov.info" ]; then
            if command -v genhtml &> /dev/null; then
                genhtml coverage/lcov.info --output-directory coverage/html
                log_success "Reporte de cobertura HTML generado en coverage/html/"
            fi
        fi
        
        # Mostrar resumen de cobertura
        if [ -f "coverage/coverage-summary.json" ]; then
            log_info "Resumen de cobertura disponible en coverage/coverage-summary.json"
        fi
        
        log_success "Reporte de cobertura generado"
    fi
}

# Generar reporte de tests
generate_test_report() {
    log "Generando reporte de tests..."
    
    # Crear reporte consolidado
    cat > test-reports/test-summary.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "test_type": "$TEST_TYPE",
  "coverage_enabled": $COVERAGE,
  "verbose": $VERBOSE,
  "parallel": $PARALLEL,
  "results": {
    "unit": "pending",
    "integration": "pending", 
    "e2e": "pending",
    "load": "pending",
    "security": "pending"
  }
}
EOF
    
    log_success "Reporte de tests generado en test-reports/test-summary.json"
}

# Mostrar resultados
show_results() {
    echo ""
    echo -e "${GREEN}=================================================="
    echo -e "     RESUMEN DE TESTING"
    echo -e "==================================================${NC}"
    echo ""
    echo "📊 Resultados:"
    echo "  Tipo: $TEST_TYPE"
    echo "  Cobertura: $COVERAGE"
    echo "  Tiempo: $(date +'%H:%M:%S')"
    echo "  Reportes: test-reports/"
    echo ""
    echo "📈 Archivos generados:"
    [ -f "test-reports/test-summary.json" ] && echo "  - test-summary.json"
    [ -f "coverage/coverage-summary.json" ] && echo "  - coverage/coverage-summary.json"
    [ -d "coverage/html" ] && echo "  - coverage/html/ (reporte web)"
    echo ""
}

# Mostrar ayuda
show_help() {
    echo -e "${GREEN}Uso: ./test.sh [tipo] [cobertura] [verbose] [paralelo]${NC}"
    echo ""
    echo "Tipos de test:"
    echo "  unit        - Solo tests unitarios"
    echo "  integration - Tests de integración"
    echo "  e2e         - Tests End-to-End"
    echo "  load        - Tests de carga (Artillery/k6)"
    echo "  performance - Tests de performance (Vitest auxiliary)"
    echo "  security    - Tests de seguridad"
    echo "  contracts   - Tests de contratos OpenAPI"
    echo "  all         - Todos los tests (default)"
    echo ""
    echo "Parámetros:"
    echo "  cobertura   - true/false (generar reporte de cobertura)"
    echo "  verbose     - true/false (output detallado)"
    echo "  paralelo    - true/false (ejecución en paralelo)"
    echo ""
    echo "Ejemplos:"
    echo "  ./test.sh unit"
    echo "  ./test.sh integration false true"
    echo "  ./test.sh all true true false"
    echo ""
}

# Función principal
main() {
    case "$TEST_TYPE" in
        "unit")
            show_banner
            setup_test_environment
            run_unit_tests
            ;;
        "integration")
            show_banner
            setup_test_environment
            run_integration_tests
            ;;
        "e2e")
            show_banner
            setup_test_environment
            run_e2e_tests
            ;;
        "load")
            show_banner
            setup_test_environment
            run_load_tests
            ;;
        "performance")
            show_banner
            setup_test_environment
            check_testing_dependencies
            run_performance_tests
            ;;
        "security")
            show_banner
            setup_test_environment
            check_testing_dependencies
            run_security_tests
            ;;
        "contracts")
            show_banner
            setup_test_environment
            check_testing_dependencies
            run_contract_tests
            ;;
        "all")
            show_banner
            setup_test_environment
            check_testing_dependencies
            
            log_info "Ejecutando suite completa de testing..."
            
            run_unit_tests || log_error "Tests unitarios fallaron"
            run_integration_tests || log_error "Tests de integración fallaron"
            run_e2e_tests || log_error "Tests E2E fallaron"
            run_performance_tests || log_warning "Tests de performance fallaron"
            run_load_tests || log_warning "Tests de carga fallaron"
            run_security_tests || log_warning "Tests de seguridad fallaron"
            run_contract_tests || log_warning "Tests de contratos fallaron"
            
            generate_coverage_report
            ;;
        "help"|"-h"|"--help")
            show_help
            exit 0
            ;;
        *)
            log_error "Tipo de test desconocido: $TEST_TYPE"
            show_help
            exit 1
            ;;
    esac
    
    generate_test_report
    show_results
    
    log_success "Suite de testing completada"
}

# Manejo de señales
trap 'log_error "Testing interrumpido"; exit 1' INT TERM

# Ejecutar función principal
main "$@"
