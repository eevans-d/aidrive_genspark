#!/usr/bin/env bash
set -euo pipefail

# Captures a safe, non-secret baseline snapshot into docs/closure/.
# - Never prints secret values (only secret NAMES).
# - Intended for session start / evidence trails.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

PROJECT_REF="${SUPABASE_PROJECT_REF:-dqaygmjpzoqjjrywdsxi}"
OUT_DIR="docs/closure"
TS_DATE="$(date +%Y-%m-%d)"
TS_TIME="$(date +%H%M%S)"
OUT_FILE="${OUT_DIR}/BASELINE_LOG_${TS_DATE}_${TS_TIME}.md"

mkdir -p "$OUT_DIR"

{
  echo "# Baseline Log"
  echo
  echo "- Date: \`$(date -Is)\`"
  echo "- Repo: \`$ROOT_DIR\`"
  echo "- Supabase project_ref: \`$PROJECT_REF\`"
  echo

  section() {
    echo "## $1"
    echo
    echo '```bash'
    printf '%q ' "${@:2}"
    echo
    echo '```'
    echo
    echo '```text'
    # shellcheck disable=SC2068
    ( "${@:2}" ) 2>&1 || true
    echo '```'
    echo
  }

  section "date" date

  section "git status" git status --porcelain=v1
  section "git branch" git rev-parse --abbrev-ref HEAD
  section "git head" git rev-parse HEAD
  section "git log" git log -n 10 --oneline --decorate

  if command -v supabase >/dev/null 2>&1; then
    section "supabase version" supabase --version

    # Linked migrations (safe).
    section "supabase migration list (linked)" supabase migration list --linked

    # Functions list (safe: includes verify_jwt only).
    if command -v jq >/dev/null 2>&1; then
      echo "## supabase functions list (safe view)"
      echo
      echo '```bash'
      echo "supabase functions list --project-ref \"$PROJECT_REF\" --output json | jq -r '.[] | \"\\(.name)\\tv\\(.version)\\tverify_jwt=\\(.verify_jwt)\"' | sort"
      echo '```'
      echo
      echo '```text'
      supabase functions list --project-ref "$PROJECT_REF" --output json \
        | jq -r '.[] | "\(.name)\tv\(.version)\tverify_jwt=\(.verify_jwt)"' \
        | sort 2>&1 || true
      echo '```'
      echo

      # Secrets list: only names (NEVER print values).
      echo "## supabase secrets list (names only)"
      echo
      echo '```bash'
      echo "supabase secrets list --project-ref \"$PROJECT_REF\" --output json | jq -r '.[].name' | sort"
      echo '```'
      echo
      echo '```text'
      supabase secrets list --project-ref "$PROJECT_REF" --output json \
        | jq -r '.[].name' \
        | sort 2>&1 || true
      echo '```'
      echo
    else
      echo "## supabase lists"
      echo
      echo "jq is missing; skipping functions/secrets listing to avoid accidental raw JSON output."
      echo
    fi
  else
    echo "## supabase"
    echo
    echo "supabase CLI not found; skipping supabase baseline."
    echo
  fi
} > "$OUT_FILE"

echo "Wrote: $OUT_FILE"
