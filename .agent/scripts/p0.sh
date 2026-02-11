#!/usr/bin/env bash
set -euo pipefail

# Protocol Zero unified CLI wrapper.
#
# Examples:
#   .agent/scripts/p0.sh bootstrap
#   .agent/scripts/p0.sh route "merge dependabot prs"
#   .agent/scripts/p0.sh baseline
#   .agent/scripts/p0.sh extract --with-gates --with-supabase
#   .agent/scripts/p0.sh gates all
#   .agent/scripts/p0.sh env-audit --with-supabase
#   .agent/scripts/p0.sh session-start "Objetivo"
#   .agent/scripts/p0.sh session-end
#   .agent/scripts/p0.sh dependabot --merge --comment

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

cmd="${1:-help}"
shift || true

maybe_bootstrap() {
  # Make the system low-friction: most commands auto-bootstrap unless explicitly disabled.
  if [ "${P0_NO_BOOTSTRAP:-}" = "1" ]; then
    return 0
  fi
  case "$cmd" in
    help|-h|--help|bootstrap)
      return 0
      ;;
    *)
      .agent/scripts/bootstrap.sh >/dev/null
      ;;
  esac
}

usage() {
  cat <<'EOF'
Protocol Zero CLI

Commands:
  bootstrap                 Sync skills + install curated + lint + UI metadata
  route <text>              Select skill + chain for a request
  baseline                  Capture safe baseline into docs/closure
  extract [args]            Generate TECHNICAL_ANALYSIS + INVENTORY reports (pass args to extract_reports.py)
  mega-plan [args]          Generate MEGA_PLAN template (pass args to mega_plan_template.py)
  kickoff <objective> [args]  session-start + extract + mega-plan (args passed to extract_reports.py)
  gates [all|backend|frontend]  Run quality gates and log output
  env-audit [args]          Env audit (names only). Pass through args to env_audit.py
  session-start <objective> Start session (baseline + briefing + evidence)
  session-end               End session and archive
  dependabot [args]         One-PR Dependabot autopilot. Pass args to dependabot_autopilot.sh

EOF
}

maybe_bootstrap

case "$cmd" in
  bootstrap)
    .agent/scripts/bootstrap.sh
    ;;
  route)
    .agent/scripts/skill_orchestrator.py "$@"
    ;;
  baseline)
    .agent/scripts/baseline_capture.sh
    ;;
  extract)
    .agent/scripts/extract_reports.py "$@"
    ;;
  mega-plan)
    .agent/scripts/mega_plan_template.py "$@"
    ;;
  kickoff)
    .agent/scripts/kickoff.sh "$@"
    ;;
  gates)
    .agent/scripts/quality_gates.sh "${1:-all}"
    ;;
  env-audit)
    .agent/scripts/env_audit.py "$@"
    ;;
  session-start)
    .agent/scripts/session_start.sh "$*"
    ;;
  session-end)
    .agent/scripts/session_end.sh
    ;;
  dependabot)
    .agent/scripts/dependabot_autopilot.sh "$@"
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "Unknown command: $cmd" >&2
    usage >&2
    exit 2
    ;;
esac
