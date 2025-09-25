#!/usr/bin/env bash
set -euo pipefail

# Script de rotación de DASHBOARD_API_KEY y opcional DASHBOARD_UI_API_KEY.
# Requiere: gh (GitHub CLI) autenticado y permisos para setear secretos.

usage() {
  cat <<EOF
Uso: $0 -r <repo> [-k <nueva_api_key>] [-u <nueva_ui_api_key>] [--print-only]

Opciones:
  -r  Repositorio (owner/name)
  -k  Nueva DASHBOARD_API_KEY (si se omite se genera aleatoria)
  -u  Nueva DASHBOARD_UI_API_KEY (opcional; si se omite no se cambia)
  --print-only  Muestra claves pero no ejecuta gh secret set

Ejemplo:
  $0 -r eevans-d/aidrive_genspark_forensic
  $0 -r eevans-d/aidrive_genspark_forensic -k "clave-fija" -u "clave-ui" --print-only
EOF
}

REPO=""
API_KEY=""
UI_KEY=""
PRINT_ONLY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -r) REPO="$2"; shift 2;;
    -k) API_KEY="$2"; shift 2;;
    -u) UI_KEY="$2"; shift 2;;
    --print-only) PRINT_ONLY=true; shift;;
    -h|--help) usage; exit 0;;
    *) echo "Arg desconocido: $1" >&2; usage; exit 1;;
  esac
done

if [[ -z "$REPO" ]]; then
  echo "Debe especificar -r <repo>" >&2
  exit 1
fi

rand_key() {
  openssl rand -base64 48 | tr -d '=+/\n' | cut -c1-48
}

if [[ -z "$API_KEY" ]]; then
  API_KEY=$(rand_key)
fi

if [[ -n "$UI_KEY" && -z "$UI_KEY" ]]; then
  UI_KEY=$(rand_key)
fi

echo "Nueva DASHBOARD_API_KEY: $API_KEY"
if [[ -n "$UI_KEY" ]]; then
  echo "Nueva DASHBOARD_UI_API_KEY: $UI_KEY"
fi

if $PRINT_ONLY; then
  echo "-- Modo print-only: no se actualizaron secretos --"
  exit 0
fi

command -v gh >/dev/null 2>&1 || { echo "gh CLI no encontrado" >&2; exit 1; }

echo "$API_KEY" | gh secret set STAGING_DASHBOARD_API_KEY -R "$REPO" --app actions
if [[ -n "$UI_KEY" ]]; then
  echo "$UI_KEY" | gh secret set STAGING_DASHBOARD_UI_API_KEY -R "$REPO" --app actions
fi
echo "Secretos actualizados en $REPO" >&2
