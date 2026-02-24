#!/bin/bash
# === init-audit.sh ===
# Inicializa el directorio .audit/ para el Sistema Integral de Calidad y Cierre.
# Adaptado al stack: React/Vite/TS + Supabase Edge Functions/Deno + PostgreSQL.
#
# Uso: bash scripts/init-audit.sh
# Requiere ejecutarse desde la raiz del proyecto.

set -euo pipefail

AUDIT_DIR=".audit"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE_SHORT=$(date -u +"%Y-%m-%d")

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}  Sistema Integral de Calidad y Cierre — Inicializacion${NC}"
echo -e "${BLUE}  Proyecto: Mini Market System${NC}"
echo -e "${BLUE}  Fecha: ${DATE_SHORT}${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""

# Verificar que estamos en la raiz del proyecto
if [ ! -f "package.json" ] || [ ! -d "supabase" ]; then
  echo -e "${RED}ERROR: Ejecutar desde la raiz del proyecto (donde esta package.json y supabase/).${NC}"
  exit 1
fi

# Crear directorio
mkdir -p "$AUDIT_DIR"
echo -e "${GREEN}Directorio $AUDIT_DIR creado/verificado.${NC}"
echo ""

# =====================================================================
# FASE 0: Inventario de archivos
# =====================================================================
echo -e "${YELLOW}FASE 0: Generando inventario de archivos...${NC}"
find . -type f \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -not -path "./dist/*" \
  -not -path "./.audit/*" \
  -not -path "./coverage/*" \
  -not -path "./minimarket-system/node_modules/*" \
  -not -path "./minimarket-system/dist/*" \
  -not -path "./test-reports/*" \
  | sort > "$AUDIT_DIR/FILE_INVENTORY.txt"

FILE_COUNT=$(wc -l < "$AUDIT_DIR/FILE_INVENTORY.txt")
echo -e "   Archivos encontrados: ${GREEN}${FILE_COUNT}${NC}"

# Contar por tipo
TS_COUNT=$(grep -c "\.tsx\?$" "$AUDIT_DIR/FILE_INVENTORY.txt" 2>/dev/null || echo "0")
MD_COUNT=$(grep -c "\.md$" "$AUDIT_DIR/FILE_INVENTORY.txt" 2>/dev/null || echo "0")
SQL_COUNT=$(grep -c "\.sql$" "$AUDIT_DIR/FILE_INVENTORY.txt" 2>/dev/null || echo "0")
echo -e "   TypeScript/TSX: ${TS_COUNT} | Markdown: ${MD_COUNT} | SQL: ${SQL_COUNT}"
echo ""

# =====================================================================
# FASE 1: Busqueda de marcadores pendientes
# =====================================================================
echo -e "${YELLOW}FASE 1: Buscando marcadores pendientes (TODO/FIXME/HACK/STUB)...${NC}"
grep -rn "TODO\|FIXME\|HACK\|XXX\|PLACEHOLDER\|TEMP\|STUB" \
  minimarket-system/src/ supabase/functions/ scripts/ \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.mjs" \
  > "$AUDIT_DIR/SOURCE_AUDIT.txt" 2>/dev/null || echo "Sin marcadores encontrados" > "$AUDIT_DIR/SOURCE_AUDIT.txt"

MARKER_COUNT=$(wc -l < "$AUDIT_DIR/SOURCE_AUDIT.txt")
echo -e "   Marcadores encontrados: ${YELLOW}${MARKER_COUNT}${NC}"

# Buscar catch vacios o con solo console.log
grep -rn "catch" minimarket-system/src/ supabase/functions/ \
  --include="*.ts" --include="*.tsx" -A3 2>/dev/null \
  | grep -E "console\.(log|error)|^\s*\}" \
  > "$AUDIT_DIR/CATCH_ANALYSIS.txt" 2>/dev/null || echo "Sin catch problematicos" > "$AUDIT_DIR/CATCH_ANALYSIS.txt"

CATCH_COUNT=$(wc -l < "$AUDIT_DIR/CATCH_ANALYSIS.txt")
echo -e "   Catch problematicos: ${YELLOW}${CATCH_COUNT}${NC} lineas"
echo ""

# =====================================================================
# FASE 4: Variables de entorno
# =====================================================================
echo -e "${YELLOW}FASE 4: Verificando variables de entorno...${NC}"

# Frontend (Vite)
grep -roh "import\.meta\.env\.\w\+" minimarket-system/src/ 2>/dev/null \
  | sed 's/import\.meta\.env\.//' | sort -u > "$AUDIT_DIR/ENV_REFERENCED_FRONTEND.txt" || true

# Backend (Deno)
grep -roh 'Deno\.env\.get("[^"]\+")' supabase/functions/ 2>/dev/null \
  | sed 's/Deno\.env\.get("//;s/")//' | sort -u > "$AUDIT_DIR/ENV_REFERENCED_BACKEND.txt" || true

# Definidas en .env.example
cat .env.example 2>/dev/null | grep -v "^#" | grep -v "^$" | cut -d= -f1 | sort -u > "$AUDIT_DIR/ENV_DEFINED.txt" || true
cat .env.test.example 2>/dev/null | grep -v "^#" | grep -v "^$" | cut -d= -f1 | sort -u >> "$AUDIT_DIR/ENV_DEFINED.txt" || true
sort -u -o "$AUDIT_DIR/ENV_DEFINED.txt" "$AUDIT_DIR/ENV_DEFINED.txt" 2>/dev/null || true

FRONTEND_ENV=$(wc -l < "$AUDIT_DIR/ENV_REFERENCED_FRONTEND.txt" 2>/dev/null || echo "0")
BACKEND_ENV=$(wc -l < "$AUDIT_DIR/ENV_REFERENCED_BACKEND.txt" 2>/dev/null || echo "0")
DEFINED_ENV=$(wc -l < "$AUDIT_DIR/ENV_DEFINED.txt" 2>/dev/null || echo "0")
echo -e "   Env vars frontend: ${FRONTEND_ENV} | backend: ${BACKEND_ENV} | definidas: ${DEFINED_ENV}"
echo ""

# =====================================================================
# FASE 6: Secretos hardcodeados
# =====================================================================
echo -e "${YELLOW}FASE 6: Escaneando secretos hardcodeados...${NC}"

# Secretos en formato key=value
grep -rn 'password\s*=\s*["'"'"'].\+["'"'"']\|secret\s*=\s*["'"'"'].\+["'"'"']\|api_key\s*=\s*["'"'"'].\+["'"'"']\|token\s*=\s*["'"'"'].\+["'"'"']' \
  minimarket-system/src/ supabase/functions/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "Deno\.env\|import\.meta\.env\|process\.env\|config\.\|example\|test\|mock\|placeholder\|type\|interface\|password:\s*string\|PasswordInput" \
  > "$AUDIT_DIR/HARDCODED_SECRETS.txt" 2>/dev/null || echo "Sin secretos detectados" > "$AUDIT_DIR/HARDCODED_SECRETS.txt"

SECRET_COUNT=$(wc -l < "$AUDIT_DIR/HARDCODED_SECRETS.txt")
if [ "$SECRET_COUNT" -gt 1 ] || ! grep -q "Sin secretos" "$AUDIT_DIR/HARDCODED_SECRETS.txt" 2>/dev/null; then
  echo -e "   Posibles secretos: ${RED}${SECRET_COUNT}${NC}"
else
  echo -e "   Posibles secretos: ${GREEN}0${NC}"
fi

# JWTs hardcodeados (patron prohibido del proyecto)
grep -rE "ey[A-Za-z0-9\-_=]{20,}" \
  minimarket-system/src/ supabase/functions/ \
  --include="*.ts" --include="*.tsx" \
  -l > "$AUDIT_DIR/HARDCODED_JWTS.txt" 2>/dev/null || echo "Sin JWTs hardcodeados" > "$AUDIT_DIR/HARDCODED_JWTS.txt"

JWT_COUNT=$(wc -l < "$AUDIT_DIR/HARDCODED_JWTS.txt")
if [ "$JWT_COUNT" -gt 1 ] || ! grep -q "Sin JWTs" "$AUDIT_DIR/HARDCODED_JWTS.txt" 2>/dev/null; then
  echo -e "   Archivos con JWTs: ${RED}${JWT_COUNT}${NC}"
else
  echo -e "   Archivos con JWTs: ${GREEN}0${NC}"
fi
echo ""

# =====================================================================
# FASE 5: Routing (escaneo basico)
# =====================================================================
echo -e "${YELLOW}FASE 5: Escaneando rutas del frontend...${NC}"
if [ -f "minimarket-system/src/App.tsx" ]; then
  grep -n "path\|element\|Route\|ProtectedRoute" minimarket-system/src/App.tsx \
    > "$AUDIT_DIR/ROUTING_AUDIT.txt" 2>/dev/null || echo "Sin rutas detectadas" > "$AUDIT_DIR/ROUTING_AUDIT.txt"
  ROUTE_COUNT=$(grep -c "path" "$AUDIT_DIR/ROUTING_AUDIT.txt" 2>/dev/null || echo "0")
  echo -e "   Rutas detectadas: ${GREEN}${ROUTE_COUNT}${NC}"
else
  echo "App.tsx no encontrado" > "$AUDIT_DIR/ROUTING_AUDIT.txt"
  echo -e "   ${RED}App.tsx no encontrado${NC}"
fi
echo ""

# =====================================================================
# Tests omitidos (pre-scan)
# =====================================================================
echo -e "${YELLOW}FASE 3 (pre-scan): Buscando tests omitidos (skip/xit/xdescribe)...${NC}"
grep -rn "\.skip\|\.only\|xit\|xdescribe\|test\.skip\|it\.skip\|describe\.skip" \
  tests/ minimarket-system/src/ \
  --include="*.test.*" --include="*.spec.*" \
  > "$AUDIT_DIR/SKIPPED_TESTS.txt" 2>/dev/null || echo "Sin tests omitidos" > "$AUDIT_DIR/SKIPPED_TESTS.txt"

SKIP_COUNT=$(wc -l < "$AUDIT_DIR/SKIPPED_TESTS.txt")
echo -e "   Tests skip/only: ${YELLOW}${SKIP_COUNT}${NC}"
echo ""

# =====================================================================
# Marcador de fase
# =====================================================================
cat > "$AUDIT_DIR/.phase_marker" <<EOF
LAST_COMPLETED_PHASE=0
TIMESTAMP=$TIMESTAMP
AUDITOR=init-audit-script
NOTES=Escaneo inicial automatizado. Pre-scan de fases 0,1,3,4,5,6. Requiere ejecucion completa por agente.
EOF

# =====================================================================
# Resumen
# =====================================================================
echo -e "${BLUE}================================================================${NC}"
echo -e "${GREEN}Directorio .audit/ inicializado correctamente.${NC}"
echo ""
echo -e "${BLUE}Artefactos generados:${NC}"
ls -la "$AUDIT_DIR/" | tail -n +2
echo ""
echo -e "${BLUE}Resumen rapido:${NC}"
echo -e "   Archivos del proyecto: ${FILE_COUNT}"
echo -e "   Marcadores pendientes: ${MARKER_COUNT}"
echo -e "   Env vars (front/back/def): ${FRONTEND_ENV}/${BACKEND_ENV}/${DEFINED_ENV}"
echo -e "   Tests skip/only: ${SKIP_COUNT}"
echo ""
echo -e "${YELLOW}Siguiente paso:${NC} Ejecutar auditoria completa con Claude Code"
echo -e "   Skill: QualityGate | Workflow: closure-audit"
echo -e "   Comando sugerido: \"ejecuta auditoria de cierre\" o \"quality gate completo\""
echo -e "${BLUE}================================================================${NC}"
