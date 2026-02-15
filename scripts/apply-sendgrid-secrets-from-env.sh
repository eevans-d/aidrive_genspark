#!/usr/bin/env bash
set -euo pipefail

# Applies SendGrid/SMTP secrets to Supabase using an env file, without printing secret values.
#
# Usage:
#   scripts/apply-sendgrid-secrets-from-env.sh [env_file]
#
# Default env file (gitignored by repo): backups/.env.sendgrid.rotate.local

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${1:-backups/.env.sendgrid.rotate.local}"
PROJECT_REF="${SUPABASE_PROJECT_REF:-dqaygmjpzoqjjrywdsxi}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERROR] Env file not found: $ENV_FILE" >&2
  echo "Create it from: backups/.env.sendgrid.rotate.template" >&2
  exit 2
fi

required_keys=(
  "SENDGRID_API_KEY"
  "SMTP_PASS"
  "SMTP_USER"
  "SMTP_HOST"
  "SMTP_PORT"
  "NOTIFICATIONS_MODE"
)

missing=()
placeholders=()
format_errors=()
values=()

for k in "${required_keys[@]}"; do
  # Grep value without echoing it. Accepts quoted or unquoted.
  if ! rg -q "^${k}=" "$ENV_FILE"; then
    missing+=("$k")
    continue
  fi

  v="$(rg "^${k}=" "$ENV_FILE" | tail -n 1 | sed -E "s/^${k}=//")"
  v="${v#"${v%%[![:space:]]*}"}" # ltrim
  v="${v%"${v##*[![:space:]]}"}" # rtrim
  # Remove surrounding quotes for validation purposes.
  v_unquoted="$v"
  if [[ ${#v_unquoted} -ge 2 && "${v_unquoted:0:1}" == "\"" && "${v_unquoted: -1}" == "\"" ]]; then
    v_unquoted="${v_unquoted:1:${#v_unquoted}-2}"
  elif [[ ${#v_unquoted} -ge 2 && "${v_unquoted:0:1}" == "'" && "${v_unquoted: -1}" == "'" ]]; then
    v_unquoted="${v_unquoted:1:${#v_unquoted}-2}"
  fi
  values+=("$k=$v_unquoted")
  # Basic placeholder detection (prevents accidental apply of dummy values).
  if [[ -z "${v//[[:space:]]/}" ]] || [[ "$v" == "__PASTE__" ]] || [[ "$v" == "\"__PASTE__\"" ]] || [[ "$v" == "'__PASTE__'" ]]; then
    placeholders+=("$k")
  fi

  # Minimal format validation for SendGrid keys to prevent pasting Key ID or name.
  if [[ "$k" == "SENDGRID_API_KEY" || "$k" == "SMTP_PASS" ]]; then
    if [[ ! "$v_unquoted" =~ ^SG\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$ ]]; then
      format_errors+=("$k")
    fi
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "[ERROR] Missing required keys in env file: ${missing[*]}" >&2
  exit 2
fi

if [[ ${#placeholders[@]} -gt 0 ]]; then
  echo "[ERROR] Placeholder/empty values detected for: ${placeholders[*]}" >&2
  echo "Edit $ENV_FILE and replace __PASTE__ with real values (do NOT paste secrets in chat)." >&2
  exit 2
fi

	if [[ ${#format_errors[@]} -gt 0 ]]; then
	  echo "[ERROR] Invalid SendGrid key format detected for: ${format_errors[*]}" >&2
	  echo "Expected full API key value starting with 'SG' followed by a dot (NOT the Key ID, name, or a truncated value)." >&2
	  exit 2
	fi

sendgrid_key=""
smtp_pass=""
for kv in "${values[@]}"; do
  case "$kv" in
    SENDGRID_API_KEY=*) sendgrid_key="${kv#SENDGRID_API_KEY=}" ;;
    SMTP_PASS=*) smtp_pass="${kv#SMTP_PASS=}" ;;
  esac
done

if [[ -n "$sendgrid_key" && -n "$smtp_pass" && "$sendgrid_key" != "$smtp_pass" ]]; then
  echo "[ERROR] SENDGRID_API_KEY and SMTP_PASS must match (same value)." >&2
  exit 2
fi

echo "[INFO] Applying secrets (names only) to project-ref=$PROJECT_REF from env-file=$ENV_FILE"
supabase secrets set --env-file "$ENV_FILE" --project-ref "$PROJECT_REF" >/dev/null
echo "[INFO] Secrets applied."

echo "[INFO] Redeploying Edge Functions that send email..."
supabase functions deploy cron-notifications --use-api --project-ref "$PROJECT_REF" >/dev/null
supabase functions deploy notificaciones-tareas --use-api --project-ref "$PROJECT_REF" >/dev/null
echo "[INFO] Redeploy complete."

echo "[INFO] Running smoke send (cron-notifications/send)..."

# Obtain service_role JWT via CLI and call the function. Do not print the JWT.
SERVICE_ROLE_KEY="$(supabase projects api-keys --project-ref "$PROJECT_REF" --output json | jq -r '.[] | select(.name=="service_role") | .api_key')"
BASE_URL="https://${PROJECT_REF}.supabase.co/functions/v1/cron-notifications/send"
REQUEST_ID="terminal-sendgrid-smoke-$(date +%s)"

payload="$(jq -n --arg rid "$REQUEST_ID" '{
  templateId: "critical_alert",
  channels: ["email_default"],
  recipients: { email: ["eevans.d@gmail.com"] },
  data: {
    alertType: "SMOKE_TEST",
    alertTitle: "SendGrid smoke from terminal",
    alertDescription: "Smoke test triggered from terminal to validate SendGrid delivery.",
    jobId: "sendgrid-smoke",
    executionId: $rid,
    timestamp: (now | todateiso8601),
    severity: "low",
    recommendedAction: "N/A",
    dashboardUrl: "https://example.invalid/dashboard",
    logsUrl: "https://example.invalid/logs"
  },
  priority: "low",
  source: "terminal-smoke",
  requiresEscalation: false
}')"

tmp_body="$(mktemp)"
http_code="$(curl -sS "$BASE_URL" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "x-request-id: ${REQUEST_ID}" \
  -H "Content-Type: application/json" \
  -d "$payload" \
  -o "$tmp_body" -w '%{http_code}')"

echo "[INFO] Smoke HTTP status=$http_code"

# Print only safe fields from response (no secrets).
if command -v jq >/dev/null 2>&1; then
  jq -r '{success, notificationId: .data.notificationId, sent: .data.result.totalSent, failed: .data.result.totalFailed, channels: (.data.result.channels | map({channelId, status, messageId, error}))}' "$tmp_body" 2>/dev/null || true
fi

rm -f "$tmp_body"

echo "[INFO] Done. Verify SendGrid Email Activity for Message ID and status."
