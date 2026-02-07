#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage (from env):
  SUPABASE_URL=... \
  SUPABASE_ANON_KEY=... \
  SUPABASE_SERVICE_ROLE_KEY=... \
  VITE_SUPABASE_URL=... \
  VITE_SUPABASE_ANON_KEY=... \
  DATABASE_URL=... \
  API_PROVEEDOR_SECRET=... \
  ./scripts/set-supabase-secrets.sh [--write-env-test]

Usage (from file):
  ./scripts/set-supabase-secrets.sh --env-file /path/to/file [--write-env-test]

Options:
  --env-file PATH   Reads KEY=VALUE pairs from PATH (no code execution).
  --write-env-test  Appends missing variables to .env.test (does not overwrite existing lines).

Notes:
  - This script does NOT print secret values.
  - Requires authenticated GitHub CLI (gh auth login).
  - Placeholder values like "PENDIENTE" or "PEGAR_AQUI" are skipped.
EOF
}

write_env_test=false
env_file=""
for arg in "$@"; do
  case "$arg" in
    --help|-h)
      usage
      exit 0
      ;;
  esac
done
while [[ $# -gt 0 ]]; do
  case "$1" in
    --write-env-test)
      write_env_test=true
      shift
      ;;
    --env-file)
      env_file="${2:-}"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

trim() {
  local val="$1"
  val="${val#"${val%%[![:space:]]*}"}"
  val="${val%"${val##*[![:space:]]}"}"
  printf "%s" "$val"
}

is_placeholder() {
  local val
  val="$(trim "$1")"
  if [[ -z "$val" ]]; then
    return 0
  fi
  case "${val^^}" in
    PENDIENTE|PEGAR_AQUI|PEGA_AQUI|PEGAR_AQUI_O_PENDIENTE|PEGA_AQUI_O_PENDIENTE)
      return 0
      ;;
  esac
  return 1
}

load_from_file() {
  local file="$1"
  if [[ -z "$file" ]]; then
    return 0
  fi
  if [[ ! -f "$file" ]]; then
    echo "Env file not found: $file"
    exit 1
  fi
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="$(trim "$line")"
    [[ -z "$line" ]] && continue
    [[ "$line" == \#* ]] && continue
    if [[ "$line" != *"="* ]]; then
      continue
    fi
    local key="${line%%=*}"
    local value="${line#*=}"
    key="$(trim "$key")"
    value="$(trim "$value")"
    if [[ ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      continue
    fi
    if is_placeholder "$value"; then
      continue
    fi
    export "$key=$value"
  done < "$file"
}

required_vars=(
  SUPABASE_URL
  SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
)

optional_vars=(
  DATABASE_URL
  API_PROVEEDOR_SECRET
)

load_from_file "$env_file"

missing=()
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    missing+=("$var")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Missing required env vars: ${missing[*]}"
  echo "Export the missing values and re-run."
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI not authenticated. Run: gh auth login"
  exit 1
fi

repo="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
if [[ -z "$repo" ]]; then
  echo "Unable to determine repository. Run from within the repo."
  exit 1
fi

set_secret() {
  local name="$1"
  local value="${!1:-}"
  if is_placeholder "$value"; then
    return 0
  fi
  echo "Setting GitHub secret: $name"
  gh secret set "$name" -b "$value" >/dev/null
}

for var in "${required_vars[@]}" "${optional_vars[@]}"; do
  set_secret "$var"
done

if $write_env_test; then
  target=".env.test"
  touch "$target"
  append_if_missing() {
    local name="$1"
    local value="${!1:-}"
    if is_placeholder "$value"; then
      return 0
    fi
    if rg -q "^${name}=" "$target"; then
      echo "Skipping ${name} (already present in ${target})"
      return 0
    fi
    echo "${name}=${value}" >> "$target"
  }
  for var in "${required_vars[@]}" "${optional_vars[@]}"; do
    append_if_missing "$var"
  done
  echo "Updated ${target} (appended missing variables only)."
fi

echo "Done."
