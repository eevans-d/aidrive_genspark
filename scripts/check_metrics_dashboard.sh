#!/usr/bin/env bash
set -euo pipefail

# check_metrics_dashboard.sh
# Verificación rápida de métricas clave del Dashboard tras un despliegue.
# Requiere variable de entorno DASHBOARD_API_KEY o argumento -k.

usage() {
  cat <<EOF
Uso: $0 [-u URL_BASE] [-k API_KEY] [-t THRESHOLD_ERROR_PCT]

Parámetros:
  -u URL_BASE              Base del dashboard (default: http://localhost:8080)
  -k API_KEY               API Key (si no se pasa, usa DASHBOARD_API_KEY)
  -t THRESHOLD_ERROR_PCT   Umbral máximo de errores (%) (default: 2)

Ejemplo:
  DASHBOARD_API_KEY=xxxx $0 -u https://staging.example.com
EOF
}

BASE_URL="http://localhost:8080"
API_KEY="${DASHBOARD_API_KEY:-}"
ERROR_THRESH=2

while getopts ":u:k:t:h" opt; do
  case $opt in
    u) BASE_URL="$OPTARG" ;;
    k) API_KEY="$OPTARG" ;;
    t) ERROR_THRESH="$OPTARG" ;;
    h) usage; exit 0 ;;
    *) usage; exit 1 ;;
  esac
done

if [ -z "$API_KEY" ]; then
  echo "[ERROR] API Key no proporcionada (usar -k o variable DASHBOARD_API_KEY)" >&2
  exit 2
fi

echo "[INFO] Consultando métricas en $BASE_URL/metrics"
RAW=$(curl -fsS -H "X-API-Key: $API_KEY" "$BASE_URL/metrics") || { echo "[ERROR] No se pudo obtener /metrics" >&2; exit 3; }

req_total=$(echo "$RAW" | awk '/^dashboard_requests_total /{print $2; exit}')
err_total=$(echo "$RAW" | awk '/^dashboard_errors_total /{print $2; exit}')

if [ -z "$req_total" ]; then
  echo "[ERROR] No se encontró métrica dashboard_requests_total" >&2
  exit 4
fi

err_total=${err_total:-0}

if [ "$req_total" -eq 0 ] 2>/dev/null; then
  echo "[WARN] dashboard_requests_total = 0 (posible falta de tráfico)"
  err_pct=0
else
  # Cálculo porcentaje con 2 decimales
  err_pct=$(awk -v e="$err_total" -v r="$req_total" 'BEGIN{ if (r==0) {print 0} else {printf "%.2f", (e/r)*100} }')
fi

echo "[INFO] Requests totales: $req_total"
echo "[INFO] Errores totales:  $err_total"
echo "[INFO] %Errores:        $err_pct% (umbral ${ERROR_THRESH}%)"

compare=$(awk -v a="$err_pct" -v b="$ERROR_THRESH" 'BEGIN{ if (a>b) print 1; else print 0 }')
if [ "$compare" -eq 1 ]; then
  echo "[FAIL] Porcentaje de errores supera umbral" >&2
  exit 5
fi

duration_p95=$(echo "$RAW" | awk -F' ' '/^dashboard_request_duration_ms_p95 /{print $2; exit}')
if [ -n "$duration_p95" ]; then
  echo "[INFO] p95 duration (ms): $duration_p95"
fi

echo "[OK] Métricas dentro de umbrales"