#!/usr/bin/env bash

# set_staging_secrets.sh
# Crea/actualiza los secretos de GitHub Actions para el despliegue a STAGING.
# Requiere GitHub CLI (gh) autenticado con permisos para escribir secretos del repo.
#
# Soporta cargar valores desde un archivo .env y/o variables de entorno.
# Para la clave SSH permite pasar una ruta de archivo (STAGING_KEY_FILE) o el contenido inline (STAGING_KEY).
#
# Uso:
#   scripts/set_staging_secrets.sh \
#     [-r owner/repo] [-f path/.env] [--dry-run]
#
# Variables soportadas:
#   STAGING_HOST                  -> host o IP del servidor de staging
#   STAGING_USER                  -> usuario SSH
#   STAGING_KEY_FILE              -> ruta a la clave privada SSH (preferido)
#   STAGING_KEY                   -> contenido de la clave privada SSH (alternativo)
#   STAGING_GHCR_TOKEN            -> token de acceso a GHCR para pull de imágenes
#   STAGING_DASHBOARD_API_KEY     -> API key para /api/* y /metrics del backend
#   STAGING_DASHBOARD_UI_API_KEY  -> API key que el frontend inyecta y envía en X-API-Key (opcional)

set -euo pipefail

REPO_SLUG=""
ENV_FILE=""
DRY_RUN="false"

red()  { printf "\033[31m%s\033[0m\n" "$*"; }
green(){ printf "\033[32m%s\033[0m\n" "$*"; }
yellow(){ printf "\033[33m%s\033[0m\n" "$*"; }

usage() {
  cat <<EOF
Uso: $0 [-r owner/repo] [-f path/.env] [--dry-run]

Opciones:
  -r, --repo     Repo objetivo en formato owner/repo. Si se omite, se intenta detectar automáticamente.
  -f, --env-file Ruta a un archivo .env con variables STAGING_*. (Ver scripts/.env.staging.secrets.example)
  --dry-run      Muestra qué se configuraría sin aplicarlo.
  -h, --help     Muestra esta ayuda.
EOF
}

# --- Parseo simple de argumentos ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    -r|--repo)
      REPO_SLUG="$2"; shift 2 ;;
    -f|--env-file)
      ENV_FILE="$2"; shift 2 ;;
    --dry-run)
      DRY_RUN="true"; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      red "Argumento no reconocido: $1"; usage; exit 1 ;;
  esac
done

# --- Comprobaciones de dependencias ---
if ! command -v gh >/dev/null 2>&1; then
  red "GitHub CLI (gh) no está instalado."
  echo "Instalación: https://cli.github.com/ (Linux: sudo apt-get install gh)"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  red "GitHub CLI no está autenticado. Ejecuta: gh auth login"
  exit 1
fi

# --- Determinar repo ---
if [[ -z "$REPO_SLUG" ]]; then
  if gh repo view --json nameWithOwner -q .nameWithOwner >/dev/null 2>&1; then
    REPO_SLUG=$(gh repo view --json nameWithOwner -q .nameWithOwner)
  else
    # Fallback a git remote
    if REMOTE_URL=$(git config --get remote.origin.url 2>/dev/null); then
      # Soporta formatos https y ssh
      # https://github.com/owner/repo.git -> owner/repo
      # git@github.com:owner/repo.git -> owner/repo
      REPO_SLUG=$(echo "$REMOTE_URL" | sed -E 's#(git@github.com:|https://github.com/)##; s/.git$//' )
    fi
  fi
fi

if [[ -z "$REPO_SLUG" ]]; then
  red "No se pudo determinar el repo. Usa -r owner/repo."
  exit 1
fi

yellow "Repositorio destino: $REPO_SLUG"

# --- Cargar .env si se especifica ---
if [[ -n "$ENV_FILE" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    red "Archivo .env no encontrado: $ENV_FILE"; exit 1
  fi
  # Cargar variables, permitiendo KEY=VALUE simples
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
  green "Variables cargadas desde $ENV_FILE"
fi

# --- Recoger variables ---
VARS=(
  STAGING_HOST
  STAGING_USER
  STAGING_GHCR_TOKEN
  STAGING_DASHBOARD_API_KEY
  STAGING_DASHBOARD_UI_API_KEY
)

# --- Helpers para setear secretos ---
set_secret_value() {
  local name="$1"; shift
  local value="$1"; shift
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[dry-run] gh secret set $name --repo $REPO_SLUG --body ****(len ${#value})"
  else
    printf "%s" "$value" | gh secret set "$name" --repo "$REPO_SLUG" --body - >/dev/null
    green "Secreto $name configurado (repo: $REPO_SLUG)"
  fi
}

set_secret_file() {
  local name="$1"; shift
  local filepath="$1"; shift
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[dry-run] gh secret set $name --repo $REPO_SLUG --body-file $filepath"
  else
    gh secret set "$name" --repo "$REPO_SLUG" --body-file "$filepath" >/dev/null
    green "Secreto $name configurado desde archivo (repo: $REPO_SLUG)"
  fi
}

# --- Aplicar secretos estándar ---
MISSING=()
for var in "${VARS[@]}"; do
  if [[ -n "${!var-}" ]]; then
    set_secret_value "$var" "${!var}"
  else
    MISSING+=("$var")
  fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
  yellow "Variables no proporcionadas (omitidas): ${MISSING[*]}"
fi

# --- Manejo especial para STAGING_KEY / STAGING_KEY_FILE ---
if [[ -n "${STAGING_KEY_FILE-}" ]]; then
  EXPANDED_PATH=$(eval echo "$STAGING_KEY_FILE")
  if [[ -f "$EXPANDED_PATH" ]]; then
    set_secret_file STAGING_KEY "$EXPANDED_PATH"
  else
    red "STAGING_KEY_FILE apunta a un archivo inexistente: $STAGING_KEY_FILE"
    exit 1
  fi
elif [[ -n "${STAGING_KEY-}" ]]; then
  set_secret_value STAGING_KEY "$STAGING_KEY"
else
  yellow "No se estableció STAGING_KEY ni STAGING_KEY_FILE. Se omitirá la clave SSH."
fi

green "Proceso finalizado. Revisa tus secretos en: https://github.com/$REPO_SLUG/settings/secrets/actions"
