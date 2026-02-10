#!/usr/bin/env bash
set -euo pipefail

# Dependabot autopilot (ONE PR at a time).
# Safe defaults: runs gates and writes evidence; does NOT merge unless --merge.
#
# Usage:
#   .agent/scripts/dependabot_autopilot.sh            # picks oldest open Dependabot PR
#   .agent/scripts/dependabot_autopilot.sh --pr 25    # run for a specific PR
#   .agent/scripts/dependabot_autopilot.sh --merge    # merge if gates pass
#   .agent/scripts/dependabot_autopilot.sh --comment  # comment summary on the PR

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

PR=""
DO_MERGE="false"
DO_COMMENT="false"

while [ $# -gt 0 ]; do
  case "$1" in
    --pr)
      PR="${2:-}"
      shift 2
      ;;
    --merge)
      DO_MERGE="true"
      shift 1
      ;;
    --comment)
      DO_COMMENT="true"
      shift 1
      ;;
    -h|--help)
      sed -n '1,80p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 2
      ;;
  esac
done

if [ -n "$(git status --porcelain=v1)" ]; then
  echo "Repo is dirty; commit/stash first. Aborting." >&2
  exit 1
fi

pick_pr() {
  local q="$1"
  gh pr list --state open --search "$q" --json number,updatedAt,title \
    | jq -r 'sort_by(.updatedAt) | .[0].number // empty'
}

if [ -z "$PR" ]; then
  PR="$(pick_pr "author:app/dependabot")"
fi
if [ -z "$PR" ]; then
  PR="$(pick_pr "author:dependabot[bot]")"
fi
if [ -z "$PR" ]; then
  echo "No open Dependabot PRs found." >&2
  exit 0
fi

META_JSON="$(gh pr view "$PR" --json number,title,headRefName,baseRefName,url 2>/dev/null)"
TITLE="$(echo "$META_JSON" | jq -r '.title')"
HEAD="$(echo "$META_JSON" | jq -r '.headRefName')"
BASE="$(echo "$META_JSON" | jq -r '.baseRefName')"

echo "PR #$PR: $TITLE"
echo "head=$HEAD base=$BASE"

gh pr checkout "$PR"

set +e
.agent/scripts/quality_gates.sh all
GATES_RC=$?
set -e

DATE="$(date +%Y-%m-%d)"
TS="$(date +%H%M%S)"
OUT="docs/closure/DEPENDABOT_PR_${PR}_${DATE}_${TS}.md"
mkdir -p docs/closure

{
  echo "# Dependabot PR Evidence"
  echo
  echo "- PR: #$PR"
  echo "- Title: $TITLE"
  echo "- Head: $HEAD"
  echo "- Base: $BASE"
  echo "- Date: $(date -Is)"
  echo
  echo "## Gates"
  echo
  if [ "$GATES_RC" -eq 0 ]; then
    echo "- Result: PASS"
  else
    echo "- Result: FAIL (exit $GATES_RC)"
  fi
  echo "- Logs: see latest `test-reports/quality-gates_*.log`"
  echo
  echo "## Next"
  echo
  if [ "$GATES_RC" -eq 0 ]; then
    if [ "$DO_MERGE" = "true" ]; then
      echo "- Merge requested: YES"
    else
      echo "- Merge requested: NO (run again with --merge)"
    fi
  else
    echo "- Fix CI/gates before merge. Consider using skill `gh-fix-ci`."
  fi
} > "$OUT"

echo "Wrote evidence: $OUT"

if [ "$DO_COMMENT" = "true" ]; then
  BODY="Gates: $( [ \"$GATES_RC\" -eq 0 ] && echo PASS || echo FAIL ). Evidence: $OUT"
  gh pr comment "$PR" --body "$BODY" || true
fi

if [ "$GATES_RC" -eq 0 ] && [ "$DO_MERGE" = "true" ]; then
  gh pr merge "$PR" --merge --delete-branch
fi

exit "$GATES_RC"

