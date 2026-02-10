#!/usr/bin/env python3
"""
Generate `agents/openai.yaml` UI metadata for all Protocol Zero skills.

This makes skills show up nicely in Codex UIs (display_name + default_prompt).
Idempotent: won't overwrite unless --overwrite is provided.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Any

import yaml


REPO_ROOT = Path(__file__).resolve().parents[2]
SKILLS_ROOT = REPO_ROOT / ".agent" / "skills"


def _parse_frontmatter(skill_md: Path) -> dict[str, Any]:
    raw = skill_md.read_text(encoding="utf-8")
    lines = raw.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}
    try:
        end = lines[1:].index("---") + 1
    except ValueError:
        return {}
    block = "\n".join(lines[1:end])
    meta = yaml.safe_load(block) or {}
    return meta if isinstance(meta, dict) else {}


def _shorten(text: str, n: int) -> str:
    t = " ".join(text.split())
    if len(t) <= n:
        return t
    return t[: n - 3].rstrip() + "..."


DEFAULT_PROMPTS: dict[str, str] = {
    "SessionOps": "Start/end a Protocol Zero session with evidence: kickoff (session-start + extraction + mega-plan template) and archive on close.",
    "BaselineOps": "Capture a safe baseline (git + supabase) into docs/closure without exposing secrets.",
    "MegaPlanner": "Produce a top-10, executable roadmap/mega-plan from the repo's source-of-truth docs with clear DoD and gates.",
    "DependabotOps": "Process Dependabot PRs one-by-one: inspect diff, run quality gates, merge or comment with evidence.",
    "CodeCraft": "Implement features using this repo's patterns (TDD, shared libs, no console.log) and leave evidence.",
    "TestMaster": "Run the appropriate test suite(s), analyze failures, and produce a concise actionable report.",
    "DeployOps": "Run pre-flight gates, ensure api-minimarket stays verify_jwt=false, deploy safely, and verify health/smoke.",
    "MigrationOps": "Validate migrations, prepare rollback, apply safely, and verify post-migration expectations.",
    "DebugHound": "Diagnose and fix errors systematically with evidence and a strict anti-loop limit.",
    "DocuGuard": "Keep documentation synced with reality; block forbidden patterns; update source-of-truth docs.",
    "RealityCheck": "Audit UX/flows realistically; classify REAL/A CREAR/PROPUESTA with evidence; output report.",
    "PerformanceWatch": "Measure before optimizing; run perf baseline and produce a performance report with actionable recommendations.",
    "APISync": "Sync OpenAPI specs to the real code endpoints; validate YAML and document changes.",
    "SecurityAudit": "Perform a code-first security audit (RLS, secrets, OWASP) and output a severity-ranked report.",
    "SendGridOps": "Resolve EMAIL_FROM vs SMTP_FROM mismatch and validate SendGrid sender setup (no secret values).",
    "SecretRotationOps": "Execute or plan secret rotation safely with rollback and evidence; require confirmation for prod-impact steps.",
    "SentryOps": "Integrate Sentry only when a real DSN exists; keep bundle impact measured and documented.",
    "EnvAuditOps": "Audit env var NAMES used in code vs .env.example and (optionally) Supabase secrets to catch mismatches early.",
    "ExtractionOps": "Generate shareable technical + inventory extraction reports under docs/closure for production planning.",
}


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Generate agents/openai.yaml for Protocol Zero skills")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing agents/openai.yaml")
    args = parser.parse_args(argv)

    if not SKILLS_ROOT.is_dir():
        raise SystemExit(f"Missing skills root: {SKILLS_ROOT}")

    for skill_dir in sorted(SKILLS_ROOT.iterdir(), key=lambda p: p.name.lower()):
        if not skill_dir.is_dir() or skill_dir.name.startswith("."):
            continue
        skill_md = skill_dir / "SKILL.md"
        if not skill_md.is_file():
            continue

        meta = _parse_frontmatter(skill_md)
        name = meta.get("name") if isinstance(meta.get("name"), str) else skill_dir.name
        desc = meta.get("description") if isinstance(meta.get("description"), str) else ""

        agents_dir = skill_dir / "agents"
        agents_dir.mkdir(parents=True, exist_ok=True)
        out_path = agents_dir / "openai.yaml"

        if out_path.exists() and not args.overwrite:
            continue

        prompt = DEFAULT_PROMPTS.get(skill_dir.name) or f"Use the {name} skill for this repository. Follow SKILL.md and respect guardrails."

        payload = {
            "interface": {
                "display_name": str(name),
                "short_description": _shorten(str(desc), 90) if desc else f"Protocol Zero skill: {name}",
                "default_prompt": str(prompt),
            }
        }
        out_path.write_text(yaml.safe_dump(payload, sort_keys=False), encoding="utf-8")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(os.sys.argv[1:]))
