#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# ============================================================================
# MODO DRY-RUN (solo valida prerequisitos y sale sin ejecutar Supabase)
# ============================================================================
if [ "${1:-}" = "--dry-run" ]; then
  echo "DRY-RUN: Validacion de prerequisitos para E2E" >&2
  echo "- Se requiere .env.test con SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY" >&2
  echo "- Supabase CLI debe estar instalado (supabase version)" >&2
  echo "No se iniciara Supabase ni se ejecutaran tests en este modo." >&2
  exit 0
fi

# ============================================================================
# VALIDACIÓN DE REQUISITOS ANTES DE INICIAR
# ============================================================================

# Evitar override de contexto Docker por variables globales del host
unset DOCKER_HOST

# 1. Verificar que existe .env.test
if [ ! -f "$ROOT_DIR/.env.test" ]; then
  echo "============================================================================" >&2
  echo "ERROR: Archivo .env.test no encontrado" >&2
  echo "============================================================================" >&2
  echo "" >&2
  echo "Los tests E2E requieren un archivo .env.test con credenciales de Supabase." >&2
  echo "" >&2
  echo "Para crear .env.test:" >&2
  echo "  1. cp .env.test.example .env.test" >&2
  echo "  2. Ejecutar: supabase start" >&2
  echo "  3. Ejecutar: supabase status" >&2
  echo "  4. Copiar los valores reales a .env.test:" >&2
  echo "     - API URL -> SUPABASE_URL" >&2
  echo "     - anon key -> SUPABASE_ANON_KEY" >&2
  echo "     - service_role key -> SUPABASE_SERVICE_ROLE_KEY" >&2
  echo "" >&2
  echo "Sin .env.test, solo se pueden ejecutar tests unitarios:" >&2
  echo "  npm run test:unit" >&2
  echo "============================================================================" >&2
  exit 1
fi

# 2. Cargar .env.test
echo "Cargando variables desde .env.test..."
set -a
source "$ROOT_DIR/.env.test"
set +a

# 3. Verificar variables SUPABASE_* obligatorias
MISSING_VARS=""
if [ -z "${SUPABASE_URL:-}" ]; then
  MISSING_VARS="${MISSING_VARS}  - SUPABASE_URL\n"
fi
if [ -z "${SUPABASE_ANON_KEY:-}" ]; then
  MISSING_VARS="${MISSING_VARS}  - SUPABASE_ANON_KEY\n"
fi
if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  MISSING_VARS="${MISSING_VARS}  - SUPABASE_SERVICE_ROLE_KEY\n"
fi

if [ -n "$MISSING_VARS" ]; then
  echo "============================================================================" >&2
  echo "ERROR: Faltan variables obligatorias en .env.test" >&2
  echo "============================================================================" >&2
  echo "" >&2
  echo -e "Variables faltantes:\n$MISSING_VARS" >&2
  echo "Ejecuta 'supabase status' y copia los valores reales a .env.test" >&2
  echo "" >&2
  echo "Sin estas variables, solo se pueden ejecutar tests unitarios:" >&2
  echo "  npm run test:unit" >&2
  echo "============================================================================" >&2
  exit 1
fi

# 4. Verificar Supabase CLI
if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI no encontrado. Instala supabase y reintenta." >&2
  exit 1
fi

# Detectar si el entorno apunta a Supabase remoto (no-local)
is_local_supabase() {
  case "${SUPABASE_URL:-}" in
    http://localhost:*|http://127.0.0.1:*|https://localhost:*|https://127.0.0.1:*)
      return 0
      ;;
  esac
  return 1
}

# ============================================================================
# EJECUCIÓN DE TESTS
# ============================================================================

if is_local_supabase || [ "${SUPABASE_FORCE_LOCAL:-}" = "1" ]; then
  echo "Iniciando Supabase local..."
  supabase start

  # Actualizar variables desde supabase status si están disponibles
  if supabase status -o env >/dev/null 2>&1; then
    eval "$(supabase status -o env)"
    export SUPABASE_URL="${SUPABASE_URL:-${API_URL:-}}"
    export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-${ANON_KEY:-}}"
    export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-${SERVICE_ROLE_KEY:-}}"
  fi
else
  echo "SUPABASE_URL apunta a un proyecto remoto. Se omite supabase start." >&2
fi

# Si API_PROVEEDOR_SECRET no esta configurado, abortar con mensaje claro
if [ -z "${API_PROVEEDOR_SECRET:-}" ]; then
  echo "ERROR: API_PROVEEDOR_SECRET no configurado. Defina la variable en .env.test o en el entorno." >&2
  exit 1
fi
export API_PROVEEDOR_SECRET

echo "Ejecutando smoke tests E2E con Vitest..."
npx vitest run --config vitest.e2e.config.ts
