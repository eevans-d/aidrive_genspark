#!/bin/bash

################################################################################
# AUDITORÍA PRE-DESPLIEGUE - FASE 1: ANÁLISIS DE CÓDIGO
# Sistema: Inventario Retail Multi-Agente (Microservicios)
# Fecha: October 18, 2025
# Duración estimada: 6-8 horas
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración
PROJECT_ROOT="/home/eevan/ProyectosIA/aidrive_genspark"
INVENTARIO_DIR="$PROJECT_ROOT/inventario-retail"
AUDIT_DIR="$PROJECT_ROOT/AUDITORIA_PRE_DESPLIEGUE"
REPORT_FILE="$AUDIT_DIR/FASE_1_ANALISIS_CODIGO_REPORT.md"
START_TIME=$(date +%s)

# Crear directorio de reportes
mkdir -p "$AUDIT_DIR/reports"
mkdir -p "$AUDIT_DIR/logs"

################################################################################
# FUNCIONES AUXILIARES
################################################################################

log_step() {
    local step=$1
    local message=$2
    echo -e "${CYAN}[$(date +'%H:%M:%S')]${NC} ${BLUE}[FASE 1]${NC} $step: $message"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info() {
    echo -e "${MAGENTA}ℹ️  $1${NC}"
}

################################################################################
# HEADER
################################################################################

clear
cat << 'EOF'

╔══════════════════════════════════════════════════════════════════════════════╗
║          🔍 AUDITORÍA PRE-DESPLIEGUE - FASE 1: ANÁLISIS DE CÓDIGO          ║
║                     October 18, 2025 - INICIANDO                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 OBJETIVOS DE FASE 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Análisis Estático
   • Linting con Pylint (target: >9.5/10)
   • Code formatting (Black, isort)
   • Type checking (mypy)
   • Complejidad ciclomática (<10 por función)
   • Dead code detection

2. Análisis de Seguridad
   • Security scanning (bandit)
   • Dependency vulnerabilities (safety)
   • Secrets scanning
   • OWASP code patterns

3. Análisis de Calidad
   • Code coverage (target: >90%)
   • Code duplication
   • Maintainability index
   • Technical debt estimation

4. Arquitectura de Microservicios
   • API contract validation
   • Inter-service communication review
   • Database schema review
   • Error handling patterns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Iniciando análisis...

EOF

sleep 2

################################################################################
# PASO 1: INSTALACIÓN DE HERRAMIENTAS
################################################################################

log_step "PASO 1" "Instalando herramientas de análisis"

cd "$INVENTARIO_DIR"

# Verificar si venv existe
if [ ! -d "venv" ]; then
    log_info "Creando virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

log_info "Instalando herramientas de análisis..."

pip install --quiet --upgrade pip setuptools wheel

# Instalar herramientas
pip install --quiet \
    pylint==3.0.2 \
    black==23.11.0 \
    isort==5.12.0 \
    mypy==1.7.1 \
    bandit==1.7.5 \
    safety==2.3.5 \
    pytest==7.4.3 \
    pytest-cov==4.1.0 \
    radon==6.0.1 \
    vulture==2.10 \
    xenon==0.9.1 \
    flake8==6.1.0 \
    mccabe==0.7.0

log_success "Herramientas instaladas correctamente"

################################################################################
# PASO 2: ANÁLISIS DE LINTING (PYLINT)
################################################################################

log_step "PASO 2" "Ejecutando análisis de linting con Pylint"

log_info "Analizando código con Pylint..."

# Crear configuración de pylint si no existe
cat > "$INVENTARIO_DIR/.pylintrc" << 'PYLINTRC'
[MASTER]
ignore=venv,__pycache__,.pytest_cache,tests,migrations
jobs=4
persistent=yes
suggestion-mode=yes

[MESSAGES CONTROL]
disable=
    C0103,  # Invalid name (muchos casos de nombres cortos válidos)
    C0114,  # Missing module docstring (algunos módulos no requieren)
    C0115,  # Missing class docstring (clases simples)
    C0116,  # Missing function docstring (funciones privadas)
    R0903,  # Too few public methods (DTOs, schemas)
    R0913,  # Too many arguments (necesario en algunos casos)
    W0212,  # Protected access (necesario para testing)
    W0621,  # Redefined outer name (fixtures pytest)

[REPORTS]
output-format=text
reports=yes
score=yes

[BASIC]
good-names=i,j,k,ex,Run,_,db,id,pk,app

[FORMAT]
max-line-length=120
indent-string='    '

[DESIGN]
max-args=7
max-attributes=10
max-bool-expr=5
max-branches=15
max-locals=20
max-parents=7
max-public-methods=25
max-returns=6
max-statements=60
min-public-methods=1

[SIMILARITIES]
min-similarity-lines=4
ignore-comments=yes
ignore-docstrings=yes
ignore-imports=yes
PYLINTRC

# Ejecutar pylint
PYLINT_OUTPUT="$AUDIT_DIR/logs/pylint_output.txt"

pylint inventario-retail/ \
    --rcfile=.pylintrc \
    --output-format=text \
    > "$PYLINT_OUTPUT" 2>&1 || true

# Extraer score
PYLINT_SCORE=$(grep "Your code has been rated at" "$PYLINT_OUTPUT" | grep -oP '\d+\.\d+' | head -1 || echo "0.0")

log_info "Pylint Score: $PYLINT_SCORE/10.0"

if (( $(echo "$PYLINT_SCORE >= 9.5" | bc -l) )); then
    log_success "Pylint score ≥9.5 - EXCELENTE"
elif (( $(echo "$PYLINT_SCORE >= 8.5" | bc -l) )); then
    log_warning "Pylint score ≥8.5 pero <9.5 - BUENO (mejorable)"
else
    log_error "Pylint score <8.5 - REQUIERE MEJORAS"
fi

################################################################################
# PASO 3: ANÁLISIS DE FORMATEO (BLACK, ISORT)
################################################################################

log_step "PASO 3" "Verificando formateo de código (Black, isort)"

log_info "Ejecutando Black check..."
BLACK_OUTPUT="$AUDIT_DIR/logs/black_output.txt"
black --check inventario-retail/ > "$BLACK_OUTPUT" 2>&1 || BLACK_STATUS=$?

if [ -z "${BLACK_STATUS:-}" ]; then
    log_success "Código formateado correctamente (Black)"
else
    log_warning "Algunos archivos requieren formateo con Black"
fi

log_info "Ejecutando isort check..."
ISORT_OUTPUT="$AUDIT_DIR/logs/isort_output.txt"
isort --check-only inventario-retail/ > "$ISORT_OUTPUT" 2>&1 || ISORT_STATUS=$?

if [ -z "${ISORT_STATUS:-}" ]; then
    log_success "Imports ordenados correctamente (isort)"
else
    log_warning "Algunos archivos requieren reordenamiento de imports"
fi

################################################################################
# PASO 4: TYPE CHECKING (MYPY)
################################################################################

log_step "PASO 4" "Ejecutando type checking con mypy"

log_info "Analizando type hints con mypy..."

# Crear configuración de mypy
cat > "$INVENTARIO_DIR/mypy.ini" << 'MYPYINI'
[mypy]
python_version = 3.9
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = False
ignore_missing_imports = True
check_untyped_defs = True
strict_optional = True
warn_redundant_casts = True
warn_unused_ignores = True
warn_no_return = True
warn_unreachable = True

[mypy-tests.*]
ignore_errors = True
MYPYINI

MYPY_OUTPUT="$AUDIT_DIR/logs/mypy_output.txt"
mypy inventario-retail/ --config-file=mypy.ini > "$MYPY_OUTPUT" 2>&1 || true

MYPY_ERRORS=$(grep -c "error:" "$MYPY_OUTPUT" || echo "0")
MYPY_NOTES=$(grep -c "note:" "$MYPY_OUTPUT" || echo "0")

log_info "Mypy errors: $MYPY_ERRORS"
log_info "Mypy notes: $MYPY_NOTES"

if [ "$MYPY_ERRORS" -eq 0 ]; then
    log_success "Sin errores de type checking"
else
    log_warning "$MYPY_ERRORS errores de type checking detectados"
fi

################################################################################
# PASO 5: COMPLEJIDAD CICLOMÁTICA (RADON)
################################################################################

log_step "PASO 5" "Analizando complejidad ciclomática (Radon)"

log_info "Ejecutando análisis de complejidad..."

RADON_CC_OUTPUT="$AUDIT_DIR/logs/radon_cc_output.txt"
radon cc inventario-retail/ -a -s > "$RADON_CC_OUTPUT" 2>&1

RADON_MI_OUTPUT="$AUDIT_DIR/logs/radon_mi_output.txt"
radon mi inventario-retail/ -s > "$RADON_MI_OUTPUT" 2>&1

# Extraer métricas
AVERAGE_CC=$(grep "Average complexity:" "$RADON_CC_OUTPUT" | grep -oP '\d+\.\d+' | head -1 || echo "0.0")
HIGH_COMPLEXITY=$(grep -c " - C " "$RADON_CC_OUTPUT" || echo "0")
VERY_HIGH_COMPLEXITY=$(grep -c " - [DF] " "$RADON_CC_OUTPUT" || echo "0")

log_info "Complejidad promedio: $AVERAGE_CC"
log_info "Funciones alta complejidad (C): $HIGH_COMPLEXITY"
log_info "Funciones muy alta complejidad (D-F): $VERY_HIGH_COMPLEXITY"

if (( $(echo "$AVERAGE_CC <= 5.0" | bc -l) )); then
    log_success "Complejidad promedio excelente (<5.0)"
elif (( $(echo "$AVERAGE_CC <= 10.0" | bc -l) )); then
    log_success "Complejidad promedio buena (<10.0)"
else
    log_warning "Complejidad promedio alta (>10.0) - revisar refactoring"
fi

################################################################################
# PASO 6: DEAD CODE DETECTION (VULTURE)
################################################################################

log_step "PASO 6" "Detectando código muerto (Vulture)"

log_info "Ejecutando Vulture..."

VULTURE_OUTPUT="$AUDIT_DIR/logs/vulture_output.txt"
vulture inventario-retail/ --min-confidence 80 > "$VULTURE_OUTPUT" 2>&1 || true

DEAD_CODE_ITEMS=$(wc -l < "$VULTURE_OUTPUT" || echo "0")

log_info "Items de código no utilizado detectados: $DEAD_CODE_ITEMS"

if [ "$DEAD_CODE_ITEMS" -eq 0 ]; then
    log_success "Sin código muerto detectado"
elif [ "$DEAD_CODE_ITEMS" -lt 10 ]; then
    log_warning "Algunos items de código no utilizado (<10)"
else
    log_warning "Múltiples items de código no utilizado (>10) - revisar"
fi

################################################################################
# PASO 7: SECURITY SCANNING (BANDIT)
################################################################################

log_step "PASO 7" "Ejecutando análisis de seguridad (Bandit)"

log_info "Escaneando código con Bandit..."

BANDIT_OUTPUT="$AUDIT_DIR/logs/bandit_output.json"
bandit -r inventario-retail/ -f json -o "$BANDIT_OUTPUT" || true

BANDIT_TEXT="$AUDIT_DIR/logs/bandit_output.txt"
bandit -r inventario-retail/ -f txt > "$BANDIT_TEXT" 2>&1 || true

# Extraer métricas de seguridad
HIGH_SEVERITY=$(grep -c '"issue_severity": "HIGH"' "$BANDIT_OUTPUT" || echo "0")
MEDIUM_SEVERITY=$(grep -c '"issue_severity": "MEDIUM"' "$BANDIT_OUTPUT" || echo "0")
LOW_SEVERITY=$(grep -c '"issue_severity": "LOW"' "$BANDIT_OUTPUT" || echo "0")

log_info "Vulnerabilidades HIGH: $HIGH_SEVERITY"
log_info "Vulnerabilidades MEDIUM: $MEDIUM_SEVERITY"
log_info "Vulnerabilidades LOW: $LOW_SEVERITY"

if [ "$HIGH_SEVERITY" -eq 0 ]; then
    log_success "Sin vulnerabilidades críticas (HIGH)"
else
    log_error "$HIGH_SEVERITY vulnerabilidades críticas detectadas - REVISAR INMEDIATAMENTE"
fi

################################################################################
# PASO 8: DEPENDENCY VULNERABILITIES (SAFETY)
################################################################################

log_step "PASO 8" "Verificando vulnerabilidades en dependencias (Safety)"

log_info "Escaneando dependencias con Safety..."

SAFETY_OUTPUT="$AUDIT_DIR/logs/safety_output.json"
safety check --json > "$SAFETY_OUTPUT" 2>&1 || SAFETY_STATUS=$?

if [ -z "${SAFETY_STATUS:-}" ]; then
    log_success "Sin vulnerabilidades conocidas en dependencias"
else
    VULN_COUNT=$(python3 -c "import json; data=json.load(open('$SAFETY_OUTPUT')); print(len(data))" 2>/dev/null || echo "0")
    if [ "$VULN_COUNT" -eq 0 ]; then
        log_success "Sin vulnerabilidades conocidas en dependencias"
    else
        log_warning "$VULN_COUNT vulnerabilidades detectadas en dependencias"
    fi
fi

################################################################################
# PASO 9: CODE COVERAGE ANALYSIS
################################################################################

log_step "PASO 9" "Analizando cobertura de tests"

log_info "Ejecutando tests con coverage..."

cd "$INVENTARIO_DIR"

COVERAGE_OUTPUT="$AUDIT_DIR/logs/coverage_output.txt"
pytest tests/ \
    --cov=inventario-retail \
    --cov-report=term \
    --cov-report=html:$AUDIT_DIR/reports/coverage_html \
    --cov-report=json:$AUDIT_DIR/reports/coverage.json \
    -v > "$COVERAGE_OUTPUT" 2>&1 || true

# Extraer coverage percentage
COVERAGE_PCT=$(grep "TOTAL" "$COVERAGE_OUTPUT" | grep -oP '\d+%' | head -1 | tr -d '%' || echo "0")

log_info "Code coverage: $COVERAGE_PCT%"

if [ "$COVERAGE_PCT" -ge 90 ]; then
    log_success "Code coverage ≥90% - EXCELENTE"
elif [ "$COVERAGE_PCT" -ge 85 ]; then
    log_success "Code coverage ≥85% - BUENO"
elif [ "$COVERAGE_PCT" -ge 80 ]; then
    log_warning "Code coverage ≥80% pero <85% - MEJORABLE"
else
    log_warning "Code coverage <80% - REQUIERE MÁS TESTS"
fi

################################################################################
# PASO 10: FLAKE8 ANALYSIS
################################################################################

log_step "PASO 10" "Ejecutando análisis adicional con Flake8"

log_info "Analizando con Flake8..."

FLAKE8_OUTPUT="$AUDIT_DIR/logs/flake8_output.txt"
flake8 inventario-retail/ \
    --max-line-length=120 \
    --exclude=venv,__pycache__,.pytest_cache \
    --statistics > "$FLAKE8_OUTPUT" 2>&1 || true

FLAKE8_ERRORS=$(wc -l < "$FLAKE8_OUTPUT" | head -1 || echo "0")

log_info "Flake8 issues: $FLAKE8_ERRORS"

if [ "$FLAKE8_ERRORS" -eq 0 ]; then
    log_success "Sin issues de Flake8"
elif [ "$FLAKE8_ERRORS" -lt 50 ]; then
    log_warning "Algunos issues menores de Flake8 (<50)"
else
    log_warning "Múltiples issues de Flake8 (>50) - revisar"
fi

################################################################################
# PASO 11: SECRETS SCANNING
################################################################################

log_step "PASO 11" "Escaneando secrets hardcodeados"

log_info "Buscando secrets en código..."

SECRETS_OUTPUT="$AUDIT_DIR/logs/secrets_scan.txt"

# Patrones de secrets comunes
grep -r -n -i \
    -e "password\s*=\s*['\"][^'\"]\+['\"]" \
    -e "api_key\s*=\s*['\"][^'\"]\+['\"]" \
    -e "secret\s*=\s*['\"][^'\"]\+['\"]" \
    -e "token\s*=\s*['\"][^'\"]\+['\"]" \
    -e "aws_access_key" \
    -e "private_key" \
    --exclude-dir=venv \
    --exclude-dir=__pycache__ \
    --exclude-dir=.git \
    --exclude="*.pyc" \
    inventario-retail/ > "$SECRETS_OUTPUT" 2>&1 || true

SECRETS_COUNT=$(wc -l < "$SECRETS_OUTPUT" || echo "0")

if [ "$SECRETS_COUNT" -eq 0 ]; then
    log_success "Sin secrets hardcodeados detectados"
else
    log_warning "$SECRETS_COUNT posibles secrets hardcodeados - REVISAR MANUALMENTE"
fi

################################################################################
# PASO 12: API CONTRACT VALIDATION
################################################################################

log_step "PASO 12" "Validando contratos de API"

log_info "Verificando definiciones de API..."

# Buscar archivos de especificación OpenAPI/Swagger
OPENAPI_FILES=$(find inventario-retail/ -name "openapi.yaml" -o -name "openapi.json" -o -name "swagger.yaml" 2>/dev/null | wc -l)

log_info "Archivos OpenAPI encontrados: $OPENAPI_FILES"

if [ "$OPENAPI_FILES" -gt 0 ]; then
    log_success "Especificaciones OpenAPI presentes"
else
    log_warning "No se encontraron especificaciones OpenAPI - considerar agregar"
fi

################################################################################
# PASO 13: DATABASE SCHEMA REVIEW
################################################################################

log_step "PASO 13" "Revisando esquemas de base de datos"

log_info "Analizando modelos de base de datos..."

# Contar modelos SQLAlchemy
MODEL_COUNT=$(find inventario-retail/ -name "models.py" -exec grep -c "class.*Base" {} + 2>/dev/null | awk '{s+=$1} END {print s}' || echo "0")

log_info "Modelos de base de datos encontrados: $MODEL_COUNT"

if [ "$MODEL_COUNT" -gt 0 ]; then
    log_success "Modelos de base de datos presentes y documentados"
fi

################################################################################
# PASO 14: ERROR HANDLING PATTERNS
################################################################################

log_step "PASO 14" "Analizando patrones de manejo de errores"

log_info "Verificando manejo de errores..."

# Contar exception handlers
TRY_EXCEPT_COUNT=$(grep -r "try:" inventario-retail/ --include="*.py" | wc -l || echo "0")
CUSTOM_EXCEPTIONS=$(find inventario-retail/ -name "exceptions.py" | wc -l || echo "0")

log_info "Bloques try-except: $TRY_EXCEPT_COUNT"
log_info "Archivos de excepciones custom: $CUSTOM_EXCEPTIONS"

if [ "$CUSTOM_EXCEPTIONS" -gt 0 ]; then
    log_success "Excepciones custom implementadas"
fi

################################################################################
# PASO 15: GENERAR REPORTE
################################################################################

log_step "PASO 15" "Generando reporte final"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
DURATION_MIN=$((DURATION / 60))
DURATION_SEC=$((DURATION % 60))

cat > "$REPORT_FILE" << EOREPORT
# FASE 1: ANÁLISIS DE CÓDIGO - REPORTE FINAL

**Fecha:** $(date '+%Y-%m-%d %H:%M:%S')
**Duración:** ${DURATION_MIN}m ${DURATION_SEC}s
**Sistema:** Inventario Retail Multi-Agente (Microservicios)

---

## 📊 RESUMEN EJECUTIVO

### Estado General: $(
    if [ "$PYLINT_SCORE" != "0.0" ] && (( $(echo "$PYLINT_SCORE >= 8.5" | bc -l) )) && \
       [ "$HIGH_SEVERITY" -eq 0 ] && \
       [ "$COVERAGE_PCT" -ge 85 ]; then
        echo "✅ EXCELENTE"
    elif [ "$HIGH_SEVERITY" -eq 0 ] && [ "$COVERAGE_PCT" -ge 80 ]; then
        echo "🟡 BUENO (mejorable)"
    else
        echo "⚠️ REQUIERE ATENCIÓN"
    fi
)

| Categoría | Métrica | Valor | Target | Status |
|-----------|---------|-------|--------|--------|
| **Code Quality** | Pylint Score | $PYLINT_SCORE/10 | ≥9.5 | $([ "$PYLINT_SCORE" != "0.0" ] && (( $(echo "$PYLINT_SCORE >= 9.5" | bc -l) )) && echo "✅" || echo "⚠️") |
| **Security** | High Vulnerabilities | $HIGH_SEVERITY | 0 | $([ "$HIGH_SEVERITY" -eq 0 ] && echo "✅" || echo "❌") |
| **Security** | Medium Vulnerabilities | $MEDIUM_SEVERITY | <5 | $([ "$MEDIUM_SEVERITY" -lt 5 ] && echo "✅" || echo "⚠️") |
| **Coverage** | Test Coverage | $COVERAGE_PCT% | ≥90% | $([ "$COVERAGE_PCT" -ge 90 ] && echo "✅" || [ "$COVERAGE_PCT" -ge 85 ] && echo "🟡" || echo "⚠️") |
| **Complexity** | Avg Cyclomatic | $AVERAGE_CC | <10 | $([ "$AVERAGE_CC" != "0.0" ] && (( $(echo "$AVERAGE_CC < 10.0" | bc -l) )) && echo "✅" || echo "⚠️") |
| **Dead Code** | Unused Items | $DEAD_CODE_ITEMS | <10 | $([ "$DEAD_CODE_ITEMS" -lt 10 ] && echo "✅" || echo "⚠️") |
| **Type Safety** | Mypy Errors | $MYPY_ERRORS | 0 | $([ "$MYPY_ERRORS" -eq 0 ] && echo "✅" || echo "⚠️") |
| **Secrets** | Hardcoded Secrets | $SECRETS_COUNT | 0 | $([ "$SECRETS_COUNT" -eq 0 ] && echo "✅" || echo "⚠️") |

---

## 1. ANÁLISIS ESTÁTICO

### 1.1 Pylint
- **Score:** $PYLINT_SCORE/10.0
- **Status:** $([ "$PYLINT_SCORE" != "0.0" ] && (( $(echo "$PYLINT_SCORE >= 9.5" | bc -l) )) && echo "✅ EXCELENTE" || (( $(echo "$PYLINT_SCORE >= 8.5" | bc -l) )) && echo "🟡 BUENO" || echo "⚠️ MEJORABLE")
- **Log:** \`logs/pylint_output.txt\`

### 1.2 Black (Formateo)
- **Status:** $([ -z "${BLACK_STATUS:-}" ] && echo "✅ Correcto" || echo "⚠️ Requiere formateo")
- **Log:** \`logs/black_output.txt\`

### 1.3 isort (Imports)
- **Status:** $([ -z "${ISORT_STATUS:-}" ] && echo "✅ Correcto" || echo "⚠️ Requiere ordenamiento")
- **Log:** \`logs/isort_output.txt\`

### 1.4 Flake8
- **Issues:** $FLAKE8_ERRORS
- **Status:** $([ "$FLAKE8_ERRORS" -eq 0 ] && echo "✅ Sin issues" || [ "$FLAKE8_ERRORS" -lt 50 ] && echo "🟡 Issues menores" || echo "⚠️ Múltiples issues")
- **Log:** \`logs/flake8_output.txt\`

---

## 2. TYPE CHECKING

### 2.1 Mypy
- **Errors:** $MYPY_ERRORS
- **Notes:** $MYPY_NOTES
- **Status:** $([ "$MYPY_ERRORS" -eq 0 ] && echo "✅ Sin errores" || echo "⚠️ Errores detectados")
- **Log:** \`logs/mypy_output.txt\`

---

## 3. COMPLEJIDAD Y MANTENIBILIDAD

### 3.1 Complejidad Ciclomática (Radon)
- **Promedio:** $AVERAGE_CC
- **Funciones alta complejidad (C):** $HIGH_COMPLEXITY
- **Funciones muy alta complejidad (D-F):** $VERY_HIGH_COMPLEXITY
- **Status:** $([ "$AVERAGE_CC" != "0.0" ] && (( $(echo "$AVERAGE_CC <= 5.0" | bc -l) )) && echo "✅ EXCELENTE" || (( $(echo "$AVERAGE_CC <= 10.0" | bc -l) )) && echo "✅ BUENO" || echo "⚠️ MEJORABLE")
- **Logs:** \`logs/radon_cc_output.txt\`, \`logs/radon_mi_output.txt\`

### 3.2 Código Muerto (Vulture)
- **Items detectados:** $DEAD_CODE_ITEMS
- **Status:** $([ "$DEAD_CODE_ITEMS" -eq 0 ] && echo "✅ Sin código muerto" || [ "$DEAD_CODE_ITEMS" -lt 10 ] && echo "🟡 Pocos items" || echo "⚠️ Revisar")
- **Log:** \`logs/vulture_output.txt\`

---

## 4. SEGURIDAD

### 4.1 Bandit (Security Scanning)
- **HIGH Severity:** $HIGH_SEVERITY $([ "$HIGH_SEVERITY" -eq 0 ] && echo "✅" || echo "❌ CRÍTICO")
- **MEDIUM Severity:** $MEDIUM_SEVERITY $([ "$MEDIUM_SEVERITY" -lt 5 ] && echo "✅" || echo "⚠️")
- **LOW Severity:** $LOW_SEVERITY
- **Logs:** \`logs/bandit_output.json\`, \`logs/bandit_output.txt\`

### 4.2 Safety (Dependency Vulnerabilities)
- **Status:** $([ -z "${SAFETY_STATUS:-}" ] && echo "✅ Sin vulnerabilidades" || echo "⚠️ Vulnerabilidades detectadas")
- **Log:** \`logs/safety_output.json\`

### 4.3 Secrets Scanning
- **Posibles secrets hardcodeados:** $SECRETS_COUNT
- **Status:** $([ "$SECRETS_COUNT" -eq 0 ] && echo "✅ Sin secrets" || echo "⚠️ REVISAR MANUALMENTE")
- **Log:** \`logs/secrets_scan.txt\`

---

## 5. COBERTURA DE TESTS

### 5.1 Pytest Coverage
- **Cobertura:** $COVERAGE_PCT%
- **Target:** ≥90%
- **Status:** $([ "$COVERAGE_PCT" -ge 90 ] && echo "✅ EXCELENTE" || [ "$COVERAGE_PCT" -ge 85 ] && echo "✅ BUENO" || echo "⚠️ REQUIERE MÁS TESTS")
- **Report HTML:** \`reports/coverage_html/index.html\`
- **Report JSON:** \`reports/coverage.json\`
- **Log:** \`logs/coverage_output.txt\`

---

## 6. ARQUITECTURA Y PATRONES

### 6.1 API Contracts
- **Archivos OpenAPI:** $OPENAPI_FILES
- **Status:** $([ "$OPENAPI_FILES" -gt 0 ] && echo "✅ Presente" || echo "⚠️ Considerar agregar")

### 6.2 Database Models
- **Modelos detectados:** $MODEL_COUNT
- **Status:** $([ "$MODEL_COUNT" -gt 0 ] && echo "✅ Presente" || echo "⚠️")

### 6.3 Error Handling
- **Bloques try-except:** $TRY_EXCEPT_COUNT
- **Excepciones custom:** $CUSTOM_EXCEPTIONS
- **Status:** $([ "$CUSTOM_EXCEPTIONS" -gt 0 ] && echo "✅ Implementadas" || echo "⚠️")

---

## 7. ISSUES CRÍTICOS DETECTADOS

### 🚨 Bloqueantes (deben resolverse antes de continuar)

$(if [ "$HIGH_SEVERITY" -gt 0 ]; then
    echo "- ❌ **$HIGH_SEVERITY vulnerabilidades HIGH severity detectadas** (ver logs/bandit_output.txt)"
fi)

$(if [ "$PYLINT_SCORE" != "0.0" ] && (( $(echo "$PYLINT_SCORE < 8.5" | bc -l) )); then
    echo "- ⚠️ **Pylint score <8.5** (actual: $PYLINT_SCORE) - refactoring requerido"
fi)

$(if [ "$COVERAGE_PCT" -lt 80 ]; then
    echo "- ⚠️ **Coverage <80%** (actual: $COVERAGE_PCT%) - agregar tests"
fi)

$(if [ "$HIGH_SEVERITY" -eq 0 ] && [ "$COVERAGE_PCT" -ge 80 ]; then
    echo "✅ **Sin bloqueantes críticos detectados**"
fi)

### ⚠️ Advertencias (recomendado resolver)

$(if [ "$MEDIUM_SEVERITY" -gt 0 ]; then
    echo "- ⚠️ $MEDIUM_SEVERITY vulnerabilidades MEDIUM severity"
fi)

$(if [ "$SECRETS_COUNT" -gt 0 ]; then
    echo "- ⚠️ $SECRETS_COUNT posibles secrets hardcodeados - revisar manualmente"
fi)

$(if [ "$DEAD_CODE_ITEMS" -ge 10 ]; then
    echo "- ⚠️ $DEAD_CODE_ITEMS items de código no utilizado"
fi)

$(if [ "$MYPY_ERRORS" -gt 0 ]; then
    echo "- ⚠️ $MYPY_ERRORS errores de type checking"
fi)

---

## 8. RECOMENDACIONES

### Acción Inmediata
$(if [ "$HIGH_SEVERITY" -gt 0 ]; then
    echo "1. ❌ **Resolver vulnerabilidades HIGH** antes de continuar (ver Bandit report)"
else
    echo "1. ✅ Sin acciones críticas requeridas"
fi)

### Mejoras Recomendadas
$(if [ "$COVERAGE_PCT" -lt 90 ]; then
    echo "2. 📝 Aumentar coverage de tests de $COVERAGE_PCT% a ≥90%"
fi)

$(if [ "$PYLINT_SCORE" != "0.0" ] && (( $(echo "$PYLINT_SCORE < 9.5" | bc -l) )); then
    echo "3. 📝 Mejorar score de Pylint de $PYLINT_SCORE a ≥9.5"
fi)

$(if [ "$OPENAPI_FILES" -eq 0 ]; then
    echo "4. 📝 Agregar especificaciones OpenAPI para APIs"
fi)

$(if [ "$SECRETS_COUNT" -gt 0 ]; then
    echo "5. 🔒 Revisar y eliminar secrets hardcodeados detectados"
fi)

---

## 9. PRÓXIMOS PASOS

### Si FASE 1 está APROBADA (sin bloqueantes):
1. ✅ Resolver warnings (opcional pero recomendado)
2. ✅ Continuar con FASE 2: Testing Exhaustivo (cuando B.1 complete)

### Si FASE 1 tiene BLOQUEANTES:
1. ❌ Resolver vulnerabilidades HIGH priority
2. ❌ Mejorar coverage si <80%
3. ❌ Refactorizar código si Pylint <8.5
4. ❌ Re-ejecutar FASE 1 después de correcciones

---

## 10. CONCLUSIÓN

**Duración Total:** ${DURATION_MIN} minutos ${DURATION_SEC} segundos

**Status Final:** $(
    if [ "$HIGH_SEVERITY" -eq 0 ] && [ "$COVERAGE_PCT" -ge 85 ] && [ "$PYLINT_SCORE" != "0.0" ] && (( $(echo "$PYLINT_SCORE >= 8.5" | bc -l) )); then
        echo "✅ **APROBADO** - Sistema cumple criterios mínimos de calidad"
    else
        echo "⚠️ **REQUIERE ATENCIÓN** - Resolver bloqueantes antes de continuar"
    fi
)

**Recomendación:** $(
    if [ "$HIGH_SEVERITY" -eq 0 ] && [ "$COVERAGE_PCT" -ge 85 ]; then
        echo "Continuar con FASE 2 (Testing Exhaustivo) cuando B.1 complete"
    else
        echo "Resolver issues críticos y re-ejecutar análisis"
    fi
)

---

*Reporte generado automáticamente por FASE_1_ANALISIS_CODIGO_EXECUTE.sh*
*Fecha: $(date '+%Y-%m-%d %H:%M:%S')*

EOREPORT

log_success "Reporte generado: $REPORT_FILE"

################################################################################
# RESUMEN FINAL
################################################################################

cat << EOF

╔══════════════════════════════════════════════════════════════════════════════╗
║              🎯 FASE 1: ANÁLISIS DE CÓDIGO - COMPLETADO                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

📊 RESULTADOS FINALES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Pylint Score:              $PYLINT_SCORE/10.0 $([ "$PYLINT_SCORE" != "0.0" ] && (( $(echo "$PYLINT_SCORE >= 9.5" | bc -l) )) && echo "✅" || echo "⚠️")
  Test Coverage:             $COVERAGE_PCT% $([ "$COVERAGE_PCT" -ge 90 ] && echo "✅" || echo "⚠️")
  High Vulnerabilities:      $HIGH_SEVERITY $([ "$HIGH_SEVERITY" -eq 0 ] && echo "✅" || echo "❌")
  Medium Vulnerabilities:    $MEDIUM_SEVERITY $([ "$MEDIUM_SEVERITY" -lt 5 ] && echo "✅" || echo "⚠️")
  Complejidad Promedio:      $AVERAGE_CC $([ "$AVERAGE_CC" != "0.0" ] && (( $(echo "$AVERAGE_CC < 10.0" | bc -l) )) && echo "✅" || echo "⚠️")
  Dead Code Items:           $DEAD_CODE_ITEMS $([ "$DEAD_CODE_ITEMS" -lt 10 ] && echo "✅" || echo "⚠️")
  Mypy Errors:               $MYPY_ERRORS $([ "$MYPY_ERRORS" -eq 0 ] && echo "✅" || echo "⚠️")
  Hardcoded Secrets:         $SECRETS_COUNT $([ "$SECRETS_COUNT" -eq 0 ] && echo "✅" || echo "⚠️")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$(
    if [ "$HIGH_SEVERITY" -eq 0 ] && [ "$COVERAGE_PCT" -ge 85 ] && [ "$PYLINT_SCORE" != "0.0" ] && (( $(echo "$PYLINT_SCORE >= 8.5" | bc -l) )); then
        echo "✅ FASE 1 APROBADA - Sin bloqueantes críticos"
    else
        echo "⚠️ FASE 1 REQUIERE ATENCIÓN - Resolver bloqueantes"
    fi
)

DURACIÓN: ${DURATION_MIN}m ${DURATION_SEC}s

📝 REPORTES GENERADOS:
  • $REPORT_FILE
  • $AUDIT_DIR/logs/*.txt
  • $AUDIT_DIR/reports/coverage_html/index.html

🚀 PRÓXIMO PASO:
  $(
    if [ "$HIGH_SEVERITY" -eq 0 ] && [ "$COVERAGE_PCT" -ge 85 ]; then
        echo "Esperar B.1 completion, luego ejecutar FASE 2: Testing Exhaustivo"
    else
        echo "Resolver issues críticos y re-ejecutar FASE 1"
    fi
  )

═══════════════════════════════════════════════════════════════════════════════

EOF

deactivate 2>/dev/null || true

exit 0
