#!/usr/bin/env python3
"""
Protocol Zero Skill Orchestrator

Selects the best-fitting skill (and its auto-chain) for a given user request,
using `.agent/skills/project_config.yaml` as the source of truth.

This script is intentionally read-only by default: it prints a selection report.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


REPO_ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = REPO_ROOT / ".agent" / "skills" / "project_config.yaml"
SESSIONS_CURRENT = REPO_ROOT / ".agent" / "sessions" / "current"
SESSION_ACTIVE = SESSIONS_CURRENT / "SESSION_ACTIVE"


def _normalize(text: str) -> str:
    # Lowercase + strip accents for robust ES/EN keyword matching.
    text = text.strip().lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return " ".join(text.split())


def _read_text_arg(text_arg: str | None) -> str:
    if text_arg is not None and text_arg.strip():
        return text_arg
    if not sys.stdin.isatty():
        payload = sys.stdin.read()
        if payload.strip():
            return payload
    return ""


def _load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    if not isinstance(data, dict):
        raise ValueError(f"Invalid YAML root object in {path}")
    return data


def _detect_role() -> str:
    return "EXECUTOR" if SESSION_ACTIVE.exists() else "CODEX"


def _skill_md_path(skill_name: str) -> Path:
    return REPO_ROOT / ".agent" / "skills" / skill_name / "SKILL.md"


def _parse_frontmatter(skill_md: Path) -> dict[str, Any]:
    """
    Parse YAML frontmatter between the first two '---' lines.
    Returns {} if not present.
    """
    try:
        raw = skill_md.read_text(encoding="utf-8")
    except FileNotFoundError:
        return {}
    lines = raw.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}
    try:
        end_idx = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration:
        return {}
    block = "\n".join(lines[1:end_idx])
    try:
        meta = yaml.safe_load(block) or {}
    except Exception:
        # Invalid YAML frontmatter should not break orchestration.
        return {}
    return meta if isinstance(meta, dict) else {}


def _impact_max(impact_field: Any) -> int | None:
    """
    Impact can be `0`, `1`, `2`, `3`, or a range string like `1-2` / `0-1`.
    Returns the maximum as int, or None if unknown.
    """
    if impact_field is None:
        return None
    if isinstance(impact_field, int):
        return impact_field
    if isinstance(impact_field, str):
        s = impact_field.strip()
        if s.isdigit():
            return int(s)
        # Common patterns: "1-2", "2-3", "variable"
        parts = [p.strip() for p in s.replace("–", "-").split("-") if p.strip()]
        nums = [int(p) for p in parts if p.isdigit()]
        return max(nums) if nums else None
    return None


@dataclass(frozen=True)
class Selection:
    role: str
    selected_skill: str
    defaulted: bool
    matched_keywords: list[str]
    intent: str | None
    chain_pre_check: list[str]
    chain_on_complete: list[str]
    skill_md: str
    config_path: str
    impact_max: int | None
    skill_role: str | None
    candidates: list[dict[str, Any]]


def select_skill(config: dict[str, Any], user_text: str, *, top_n: int = 3) -> Selection:
    orchestrator = config.get("skill_orchestrator") or {}
    trigger_patterns = orchestrator.get("trigger_patterns") or {}
    default_skill = orchestrator.get("default_skill") or "RealityCheck"

    norm_text = _normalize(user_text)
    scored: list[tuple[int, int, str, list[str], str | None]] = []
    for skill_name, spec in (trigger_patterns.items() if isinstance(trigger_patterns, dict) else []):
        if not isinstance(spec, dict):
            continue
        keywords = spec.get("keywords") or []
        if not isinstance(keywords, list):
            continue
        matches = []
        total_len = 0
        for kw in keywords:
            if not isinstance(kw, str) or not kw.strip():
                continue
            n_kw = _normalize(kw)
            if n_kw and n_kw in norm_text:
                matches.append(kw)
                total_len += len(n_kw)
        if matches:
            intent = spec.get("intent") if isinstance(spec.get("intent"), str) else None
            scored.append((len(matches), total_len, skill_name, matches, intent))

    scored_sorted = sorted(scored, key=lambda x: (-x[0], -x[1], x[2].lower()))
    if scored_sorted:
        # Highest match count, then longest total match length, then stable name.
        _, _, skill, matches, intent = scored_sorted[0]
        defaulted = False
    else:
        skill, matches, intent, defaulted = default_skill, [], None, True

    graph = config.get("skill_graph") or {}
    chains = graph.get("chains") or {}
    chain_spec = chains.get(skill) if isinstance(chains, dict) else None
    chain_pre_check: list[str] = []
    chain_on_complete: list[str] = []
    if isinstance(chain_spec, dict):
        pre = chain_spec.get("pre_check") or []
        on = chain_spec.get("on_complete") or []
        if isinstance(pre, list):
            chain_pre_check = [x for x in pre if isinstance(x, str)]
        if isinstance(on, list):
            chain_on_complete = [x for x in on if isinstance(x, str)]

    candidates: list[dict[str, Any]] = []
    for mc, tl, sn, m, it in scored_sorted[: max(0, top_n)]:
        candidates.append(
            {
                "skill": sn,
                "match_count": mc,
                "match_len": tl,
                "matched_keywords": m,
                "intent": it,
            }
        )

    skill_md = _skill_md_path(skill)
    meta = _parse_frontmatter(skill_md)
    impact_max = _impact_max(meta.get("impact"))
    skill_role = meta.get("role") if isinstance(meta.get("role"), str) else None

    return Selection(
        role=_detect_role(),
        selected_skill=skill,
        defaulted=defaulted,
        matched_keywords=matches,
        intent=intent,
        chain_pre_check=chain_pre_check,
        chain_on_complete=chain_on_complete,
        skill_md=os.fspath(skill_md.relative_to(REPO_ROOT)) if skill_md.exists() else os.fspath(skill_md),
        config_path=os.fspath(CONFIG_PATH.relative_to(REPO_ROOT)) if CONFIG_PATH.exists() else os.fspath(CONFIG_PATH),
        impact_max=impact_max,
        skill_role=skill_role,
        candidates=candidates,
    )


def _to_markdown(sel: Selection) -> str:
    chain = sel.chain_pre_check + [sel.selected_skill] + sel.chain_on_complete
    suggested_cmds = {
        "SessionOps": '.agent/scripts/p0.sh kickoff "<objetivo>" --with-gates --with-supabase',
        "BaselineOps": ".agent/scripts/p0.sh baseline",
        "ExtractionOps": ".agent/scripts/p0.sh extract --with-gates --with-supabase",
        "MegaPlanner": '.agent/scripts/p0.sh mega-plan --objective "<objetivo>"',
        "TestMaster": ".agent/scripts/p0.sh gates all",
        "EnvAuditOps": ".agent/scripts/p0.sh env-audit --with-supabase",
        "DependabotOps": ".agent/scripts/p0.sh dependabot",
        "DeployOps": ".agent/scripts/p0.sh gates all",
    }
    lines = []
    lines.append("# Skill Orchestrator Report")
    lines.append("")
    lines.append(f"- Role detected: `{sel.role}`")
    lines.append(f"- Selected skill: `{sel.selected_skill}`" + (" (default)" if sel.defaulted else ""))
    if sel.intent:
        lines.append(f"- Intent: {sel.intent}")
    if sel.skill_role:
        lines.append(f"- Skill role: `{sel.skill_role}`")
    if sel.impact_max is not None:
        lines.append(f"- Impact (max): `{sel.impact_max}`")
    if sel.matched_keywords:
        joined = ", ".join(f"`{k}`" for k in sel.matched_keywords[:10])
        lines.append(f"- Matched keywords: {joined}")
        if len(sel.matched_keywords) > 10:
            lines.append(f"- Matched keywords (extra): `{len(sel.matched_keywords) - 10}` more")
    else:
        lines.append("- Matched keywords: none")
    lines.append(f"- Skill file: `{sel.skill_md}`")
    lines.append(f"- Config: `{sel.config_path}`")
    lines.append("")
    if sel.role == "CODEX" and sel.skill_role and sel.skill_role.strip().upper().startswith("EXECUTOR"):
        lines.append(
            "- Note: session not active (CODEX) but selected skill expects EXECUTOR. Consider `.agent/scripts/p0.sh session-start \"<objetivo>\"`."
        )
        lines.append("")
    lines.append("## Auto-Chain")
    lines.append("")
    lines.append(" -> ".join(f"`{s}`" for s in chain) if chain else "(none)")
    lines.append("")

    cmds = [(s, suggested_cmds.get(s)) for s in chain if suggested_cmds.get(s)]
    if cmds:
        lines.append("## Suggested Commands")
        lines.append("")
        for skill, cmd in cmds:
            lines.append(f"- `{skill}`: `{cmd}`")
        lines.append("")

    if sel.candidates:
        lines.append("## Top Candidates")
        lines.append("")
        for c in sel.candidates:
            lines.append(
                f"- `{c['skill']}` score={c['match_count']}/{c['match_len']} keywords={len(c['matched_keywords'])}"
            )
        lines.append("")
    return "\n".join(lines)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Protocol Zero skill orchestrator")
    parser.add_argument("text", nargs="?", help="User request text. If omitted, read stdin.")
    parser.add_argument("--format", choices=["markdown", "json"], default="markdown")
    parser.add_argument("--top", type=int, default=3, help="How many candidate skills to show (default: 3)")
    args = parser.parse_args(argv)

    text = _read_text_arg(args.text)
    if not text:
        print("Error: missing request text (arg or stdin).", file=sys.stderr)
        return 2

    if not CONFIG_PATH.exists():
        print(f"Error: missing config at {CONFIG_PATH}", file=sys.stderr)
        return 2

    try:
        config = _load_yaml(CONFIG_PATH)
    except Exception as exc:
        print(f"Error: failed to load config: {exc}", file=sys.stderr)
        return 2

    sel = select_skill(config, text, top_n=max(0, args.top))
    if args.format == "json":
        payload = {
            "role": sel.role,
            "selected_skill": sel.selected_skill,
            "defaulted": sel.defaulted,
            "matched_keywords": sel.matched_keywords,
            "intent": sel.intent,
            "impact_max": sel.impact_max,
            "skill_role": sel.skill_role,
            "chain": {
                "pre_check": sel.chain_pre_check,
                "on_complete": sel.chain_on_complete,
                "full": sel.chain_pre_check + [sel.selected_skill] + sel.chain_on_complete,
            },
            "paths": {
                "skill_md": sel.skill_md,
                "config": sel.config_path,
            },
            "candidates": sel.candidates,
        }
        print(json.dumps(payload, ensure_ascii=True, indent=2))
    else:
        print(_to_markdown(sel))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
