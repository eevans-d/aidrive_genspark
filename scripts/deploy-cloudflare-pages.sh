#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${1:-$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD)}"

required_vars=(
  CLOUDFLARE_API_TOKEN
  CLOUDFLARE_ACCOUNT_ID
  CLOUDFLARE_PAGES_PROJECT
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
)

missing=0
for name in "${required_vars[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "[error] Missing required environment variable: $name" >&2
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  echo "[hint] Export required variable names and retry." >&2
  exit 1
fi

echo "[info] Checking Cloudflare auth context..."
npx wrangler@4 whoami >/dev/null

echo "[info] Building frontend for production..."
(
  cd "$ROOT_DIR/minimarket-system"
  pnpm install --frozen-lockfile
  pnpm build:pages
)

echo "[info] Deploying to Cloudflare Pages..."
echo "[info] Project: $CLOUDFLARE_PAGES_PROJECT | Branch: $BRANCH"
npx wrangler@4 pages deploy "$ROOT_DIR/minimarket-system/dist" \
  --project-name "$CLOUDFLARE_PAGES_PROJECT" \
  --branch "$BRANCH"

echo "[ok] Cloudflare Pages deployment completed."
