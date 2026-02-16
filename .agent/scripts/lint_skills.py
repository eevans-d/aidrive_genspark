#!/usr/bin/env python3
"""
Lint Protocol Zero skills + orchestrator config for drift.

Checks:
- Each `.agent/skills/<Skill>/SKILL.md` has valid YAML frontmatter with name+description.
- Frontmatter `name` matches directory name.
- `project_config.yaml` only references skills that exist.
- Trigger patterns / chains cover installed skills (warn on gaps).
"""

from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


REPO_ROOT = Path(__file__).resolve().parents[2]
SKILLS_ROOT = REPO_ROOT / ".agent" / "skills"
CONFIG_PATH = SKILLS_ROOT / "project_config.yaml"
SKILL_SOFT_MAX_LINES = 300
SKILL_HARD_MAX_LINES = 500


def _load_yaml(path: Path) -> dict[str, Any]:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"Invalid YAML root object: {path}")
    return data


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
    try:
        meta = yaml.safe_load(block) or {}
    except Exception:
        return {}
    return meta if isinstance(meta, dict) else {}


def _read_body(skill_md: Path) -> str:
    return skill_md.read_text(encoding="utf-8", errors="replace")


def _skill_dirs() -> list[Path]:
    if not SKILLS_ROOT.is_dir():
        return []
    out: list[Path] = []
    for child in SKILLS_ROOT.iterdir():
        if not child.is_dir():
            continue
        if child.name.startswith("."):
            continue
        if (child / "SKILL.md").is_file():
            out.append(child)
    return sorted(out, key=lambda p: p.name.lower())


@dataclass(frozen=True)
class LintResult:
    errors: list[str]
    warnings: list[str]


def lint() -> LintResult:
    errors: list[str] = []
    warnings: list[str] = []

    if not CONFIG_PATH.is_file():
        errors.append(f"Missing config: {CONFIG_PATH}")
        return LintResult(errors=errors, warnings=warnings)

    config = _load_yaml(CONFIG_PATH)
    orchestrator = config.get("skill_orchestrator") or {}
    graph = config.get("skill_graph") or {}

    skills = _skill_dirs()
    skill_names = {p.name for p in skills}

    # Validate skill frontmatters.
    for d in skills:
        skill_md = d / "SKILL.md"
        meta = _parse_frontmatter(skill_md)
        if not meta:
            errors.append(f"{d}: invalid or missing YAML frontmatter")
            continue
        name = meta.get("name")
        desc = meta.get("description")
        if not isinstance(name, str) or not name.strip():
            errors.append(f"{d}/SKILL.md: missing frontmatter name")
        if not isinstance(desc, str) or not desc.strip():
            errors.append(f"{d}/SKILL.md: missing frontmatter description")
        if isinstance(name, str) and name != d.name:
            warnings.append(f"{d}/SKILL.md: frontmatter name '{name}' != dir '{d.name}'")

        # Optional-but-expected metadata fields (Protocol Zero conventions).
        for field in ("role", "impact"):
            if field not in meta:
                warnings.append(f"{d}/SKILL.md: missing frontmatter '{field}'")

        # Basic structure sanity checks (keep skills consistent and skimmable).
        body = _read_body(skill_md)
        body_lines = len(body.splitlines())
        for header in ("## Guardrails", "## Activacion"):
            if header not in body:
                warnings.append(f"{d}/SKILL.md: missing section '{header}'")
        if body_lines > SKILL_HARD_MAX_LINES:
            warnings.append(
                f"{d}/SKILL.md: {body_lines} lines (> {SKILL_HARD_MAX_LINES}); move detailed procedures to references/ to reduce context load"
            )
        elif body_lines > SKILL_SOFT_MAX_LINES and not (d / "references").is_dir():
            warnings.append(
                f"{d}/SKILL.md: {body_lines} lines and no references/ folder; consider progressive disclosure for better Codex efficiency"
            )

        ui_yaml = d / "agents" / "openai.yaml"
        if not ui_yaml.is_file():
            warnings.append(f"{d}: missing agents/openai.yaml (run .agent/scripts/generate_agents_yaml.py)")

    # Collect config references.
    referenced: set[str] = set()

    default_skill = orchestrator.get("default_skill")
    if isinstance(default_skill, str) and default_skill:
        referenced.add(default_skill)
        if default_skill not in skill_names:
            errors.append(f"skill_orchestrator.default_skill '{default_skill}' missing in .agent/skills/")
    else:
        warnings.append("skill_orchestrator.default_skill missing/invalid")

    triggers = orchestrator.get("trigger_patterns") or {}
    if isinstance(triggers, dict):
        for skill, spec in triggers.items():
            referenced.add(skill)
            if skill not in skill_names:
                errors.append(f"trigger_patterns references missing skill: {skill}")
            if not isinstance(spec, dict):
                errors.append(f"trigger_patterns.{skill} is not a mapping")
                continue
            kw = spec.get("keywords")
            if not isinstance(kw, list) or not any(isinstance(x, str) and x.strip() for x in kw):
                warnings.append(f"trigger_patterns.{skill}.keywords missing/empty")
    else:
        errors.append("skill_orchestrator.trigger_patterns is not a mapping")

    chains = (graph.get("chains") or {}) if isinstance(graph, dict) else {}
    if isinstance(chains, dict):
        for skill, spec in chains.items():
            referenced.add(skill)
            if skill not in skill_names:
                errors.append(f"skill_graph.chains references missing skill: {skill}")
            if not isinstance(spec, dict):
                errors.append(f"skill_graph.chains.{skill} is not a mapping")
                continue
            for field in ("pre_check", "on_complete"):
                val = spec.get(field)
                if isinstance(val, list):
                    for dep in val:
                        if isinstance(dep, str) and dep:
                            referenced.add(dep)
                elif val is not None:
                    errors.append(f"skill_graph.chains.{skill}.{field} must be a list")
    else:
        errors.append("skill_graph.chains is not a mapping")

    deps = (graph.get("dependencies") or {}) if isinstance(graph, dict) else {}
    if isinstance(deps, dict):
        for skill, spec in deps.items():
            referenced.add(skill)
            if skill not in skill_names:
                errors.append(f"skill_graph.dependencies references missing skill: {skill}")
            if not isinstance(spec, dict):
                errors.append(f"skill_graph.dependencies.{skill} is not a mapping")
                continue
            reqs = spec.get("requires") or []
            if isinstance(reqs, list):
                for req in reqs:
                    if isinstance(req, dict) and isinstance(req.get("skill"), str):
                        referenced.add(req["skill"])
            else:
                errors.append(f"skill_graph.dependencies.{skill}.requires must be a list")
    elif deps is not None:
        errors.append("skill_graph.dependencies is not a mapping")

    # Final cross-check.
    missing = sorted([s for s in referenced if s not in skill_names])
    if missing:
        errors.append(f"Config references unknown skill(s): {', '.join(missing)}")

    # Warn on skills not present in config (usually drift).
    unmanaged = sorted([s for s in skill_names if s not in referenced and s not in triggers and s not in chains])
    if unmanaged:
        warnings.append(f"Skills not referenced by config (possible drift): {', '.join(unmanaged)}")

    return LintResult(errors=errors, warnings=warnings)


def main() -> int:
    res = lint()
    for w in res.warnings:
        print(f"WARNING: {w}", file=sys.stderr)
    for e in res.errors:
        print(f"ERROR: {e}", file=sys.stderr)
    if res.errors:
        return 1
    print("OK: skills + config are consistent")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
