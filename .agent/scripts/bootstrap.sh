#!/usr/bin/env bash
set -euo pipefail

# Protocol Zero bootstrap for a machine/repo.
# Safe to run repeatedly.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[bootstrap] syncing repo skills into Codex..."
.agent/scripts/sync_codex_skills.py --mode symlink >/dev/null

echo "[bootstrap] installing curated skills (tier=${P0_CURATED_TIER:-core}) (idempotent)..."
.agent/scripts/install_curated_skills.py >/dev/null || true

echo "[bootstrap] generating skill UI metadata (agents/openai.yaml)..."
.agent/scripts/generate_agents_yaml.py >/dev/null || true

echo "[bootstrap] linting skills + config..."
.agent/scripts/lint_skills.py >/dev/null

echo "[bootstrap] OK"
