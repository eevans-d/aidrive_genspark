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

trim_wrapping_quotes() {
  local value="${1:-}"
  if [[ "$value" == \"*\" ]]; then
    value="${value#\"}"
    value="${value%\"}"
  fi
  printf '%s' "$value"
}

hydrate_supabase_env_from_status() {
  local status_env line key raw value
  if ! status_env="$(supabase status -o env 2>/dev/null)"; then
    return 1
  fi

  while IFS= read -r line; do
    case "$line" in
      API_URL=*|ANON_KEY=*|SERVICE_ROLE_KEY=*|JWT_SECRET=*)
        key="${line%%=*}"
        raw="${line#*=}"
        value="$(trim_wrapping_quotes "$raw")"
        case "$key" in
          API_URL) export SUPABASE_URL="$value" ;;
          ANON_KEY) export SUPABASE_ANON_KEY="$value" ;;
          SERVICE_ROLE_KEY) export SUPABASE_SERVICE_ROLE_KEY="$value" ;;
          JWT_SECRET) export SUPABASE_JWT_SECRET="$value" ;;
        esac
        ;;
    esac
  done <<< "$status_env"

  return 0
}

SUPABASE_START_LOG="${TMPDIR:-/tmp}/supabase-start-e2e.log"

start_supabase_quietly() {
  if ! supabase start >"$SUPABASE_START_LOG" 2>&1; then
    echo "ERROR: supabase start fallo. Revisa $SUPABASE_START_LOG para detalles." >&2
    return 1
  fi
}

load_project_id() {
  awk -F '"' '/^project_id = /{print $2; exit}' "$ROOT_DIR/supabase/config.toml"
}

ensure_edge_runtime_running() {
  local project_id container_name
  project_id="$(load_project_id)"
  if [ -z "$project_id" ]; then
    echo "WARN: No se pudo detectar project_id en supabase/config.toml. Se omite verificacion de edge runtime." >&2
    return 0
  fi

  container_name="supabase_edge_runtime_${project_id}"
  if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
    return 0
  fi

  echo "Edge Runtime no detectado (${container_name}). Ejecutando autorrecuperacion..." >&2
  supabase stop --no-backup >/dev/null 2>&1 || true
  start_supabase_quietly
  hydrate_supabase_env_from_status || true

  if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
    echo "ERROR: Edge Runtime sigue caido (${container_name})." >&2
    echo "Accion requerida: actualiza Supabase CLI y reintenta (version detectada: $(supabase --version | head -n1))." >&2
    exit 1
  fi
}

resolve_bearer_token() {
  if [ -n "${E2E_BEARER_TOKEN:-}" ]; then
    printf '%s' "${E2E_BEARER_TOKEN}"
    return 0
  fi

  if [ -n "${SUPABASE_JWT_SECRET:-}" ]; then
    node <<'NODE'
const { createHmac } = require('node:crypto');
const secret = process.env.SUPABASE_JWT_SECRET || '';
const now = Math.floor(Date.now() / 1000);
const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
const payload = Buffer.from(JSON.stringify({
  aud: 'authenticated',
  role: 'service_role',
  sub: 'e2e-smoke-runtime-check',
  email: 'runtime-check@local.test',
  iss: 'supabase-local',
  iat: now,
  exp: now + 3600,
})).toString('base64url');
const unsigned = `${header}.${payload}`;
const signature = createHmac('sha256', secret).update(unsigned).digest('base64url');
process.stdout.write(`${unsigned}.${signature}`);
NODE
    return 0
  fi

  printf '%s' "${SUPABASE_SERVICE_ROLE_KEY:-}"
  return 0
}

ensure_api_proveedor_secret_runtime() {
  if ! command -v curl >/dev/null 2>&1; then
    echo "WARN: curl no disponible; se omite verificacion runtime de API_PROVEEDOR_SECRET." >&2
    return 0
  fi

  local probe_url status_file status_code body bearer_token
  probe_url="${SUPABASE_URL%/}/functions/v1/api-proveedor/status"
  bearer_token="$(resolve_bearer_token)"
  status_file="$(mktemp)"

  status_code="$(
    curl -sS -m 10 -o "$status_file" -w "%{http_code}" \
      -H "Authorization: Bearer ${bearer_token}" \
      -H "x-api-secret: ${API_PROVEEDOR_SECRET}" \
      "${probe_url}" || echo "000"
  )"
  body="$(cat "$status_file" 2>/dev/null || true)"
  rm -f "$status_file"

  if [ "$status_code" = "401" ] && {
    printf '%s' "$body" | grep -q "API_PROVEEDOR_SECRET no configurado en servidor" ||
      printf '%s' "$body" | grep -q "API_PROVEEDOR_SECRET debe tener al menos 32 caracteres"
  }; then
    echo "Runtime local con API_PROVEEDOR_SECRET stale. Reiniciando Supabase para rehidratar env..." >&2
    supabase stop --no-backup >/dev/null 2>&1 || true
    start_supabase_quietly
    hydrate_supabase_env_from_status || true
    ensure_edge_runtime_running
  fi
}

run_e2e_suite() {
  local log_file="$1"
  set +e
  npx vitest run --config vitest.e2e.config.ts 2>&1 | tee "$log_file"
  local exit_code=${PIPESTATUS[0]}
  set -e
  return "$exit_code"
}

should_reset_for_missing_schema() {
  local log_file="$1"
  grep -q "POSTGREST_PGRST205" "$log_file" &&
    (
      grep -q "public.precios_proveedor" "$log_file" ||
        grep -q "public.vista_alertas_activas" "$log_file"
    )
}

# ============================================================================
# EJECUCIÓN DE TESTS
# ============================================================================

if is_local_supabase || [ "${SUPABASE_FORCE_LOCAL:-}" = "1" ]; then
  echo "Iniciando Supabase local..."
  start_supabase_quietly
  hydrate_supabase_env_from_status || true
  ensure_edge_runtime_running
else
  echo "SUPABASE_URL apunta a un proyecto remoto. Se omite supabase start." >&2
fi

# Si API_PROVEEDOR_SECRET no esta configurado, abortar con mensaje claro
if [ -z "${API_PROVEEDOR_SECRET:-}" ]; then
  echo "ERROR: API_PROVEEDOR_SECRET no configurado. Defina la variable en .env.test o en el entorno." >&2
  exit 1
fi
export API_PROVEEDOR_SECRET
ensure_api_proveedor_secret_runtime

echo "Ejecutando smoke tests E2E con Vitest..."
E2E_LOG_FILE="$(mktemp)"
if run_e2e_suite "$E2E_LOG_FILE"; then
  rm -f "$E2E_LOG_FILE"
  exit 0
fi

if should_reset_for_missing_schema "$E2E_LOG_FILE"; then
  echo "Schema cache/local DB incompleto detectado (POSTGREST_PGRST205). Ejecutando supabase db reset y reintento unico..." >&2
  supabase db reset >/dev/null 2>&1 || {
    echo "ERROR: supabase db reset fallo durante autorecuperacion E2E." >&2
    rm -f "$E2E_LOG_FILE"
    exit 1
  }
  hydrate_supabase_env_from_status || true
  ensure_edge_runtime_running
  ensure_api_proveedor_secret_runtime

  if run_e2e_suite "$E2E_LOG_FILE"; then
    rm -f "$E2E_LOG_FILE"
    exit 0
  fi
fi

rm -f "$E2E_LOG_FILE"
exit 1
