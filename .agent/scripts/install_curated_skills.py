#!/usr/bin/env python3
"""
Idempotently install a recommended set of curated OpenAI skills into $CODEX_HOME/skills.

Why:
- Skill installer script aborts if destination already exists.
- This wrapper only installs missing skills and is safe to run repeatedly.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


CORE = [
    "doc",
    "gh-fix-ci",
    "gh-address-comments",
    "playwright",
    "sentry",
    "security-best-practices",
    "security-threat-model",
]

OPTIONAL = [
    # Useful add-ons; not required for this repo. Install via --tier full.
    "openai-docs",
    "vercel-deploy",
    "render-deploy",
    "netlify-deploy",
    "cloudflare-deploy",
]

TIERS: dict[str, list[str]] = {
    "core": CORE,
    "full": CORE + OPTIONAL,
}


def _codex_home() -> Path:
    return Path(os.environ.get("CODEX_HOME", os.path.expanduser("~/.codex"))).resolve()


def _skills_root() -> Path:
    return _codex_home() / "skills"


def _installer_script() -> Path:
    return _skills_root() / ".system" / "skill-installer" / "scripts" / "install-skill-from-github.py"


def _installed() -> set[str]:
    root = _skills_root()
    if not root.is_dir():
        return set()
    out: set[str] = set()
    for name in os.listdir(root):
        p = root / name
        if p.is_dir():
            out.add(name)
    return out


def _run(cmd: list[str]) -> None:
    proc = subprocess.run(cmd, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}")


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Install recommended curated Codex skills (idempotent)")
    parser.add_argument(
        "--tier",
        choices=sorted(TIERS.keys()),
        default=os.environ.get("P0_CURATED_TIER", "core"),
        help="Which tier to install when --skills is not provided (default: core).",
    )
    parser.add_argument(
        "--skills",
        nargs="+",
        default=None,
        help="Explicit skill names to ensure installed (overrides --tier).",
    )
    parser.add_argument("--repo", default="openai/skills", help="GitHub repo (default: openai/skills)")
    parser.add_argument("--ref", default="main", help="Git ref (default: main)")
    args = parser.parse_args(argv)

    root = _skills_root()
    root.mkdir(parents=True, exist_ok=True)

    installer = _installer_script()
    if not installer.is_file():
        print(f"Error: installer not found at {installer}", file=sys.stderr)
        return 2

    installed = _installed()
    base = args.skills if args.skills is not None else TIERS.get(args.tier, CORE)
    wanted = [s for s in base if isinstance(s, str) and s.strip()]
    missing = [s for s in wanted if s not in installed]

    if not missing:
        print("OK: curated skills already installed")
        return 0

    paths = [f"skills/.curated/{name}" for name in missing]
    cmd = [
        sys.executable,
        os.fspath(installer),
        "--repo",
        args.repo,
        "--ref",
        args.ref,
        "--path",
        *paths,
    ]
    _run(cmd)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
