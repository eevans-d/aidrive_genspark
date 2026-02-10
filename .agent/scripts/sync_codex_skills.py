#!/usr/bin/env python3
"""
Sync project skills into $CODEX_HOME/skills (default: ~/.codex/skills).

Goal: make `.agent/skills/*/SKILL.md` available as Codex skills without copying.
Default mode creates symlinks:
  ~/.codex/skills/<SkillName> -> <repo>/.agent/skills/<SkillName>

This is idempotent and non-destructive:
- If the destination exists and already points to the right target, it's left as-is.
- If the destination exists and is different, it's skipped (unless --force for symlinks).
"""

from __future__ import annotations

import argparse
import os
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
PROJECT_SKILLS_ROOT = REPO_ROOT / ".agent" / "skills"


def _codex_home() -> Path:
    return Path(os.environ.get("CODEX_HOME", os.path.expanduser("~/.codex"))).resolve()


def _dest_root() -> Path:
    return _codex_home() / "skills"


def _is_skill_dir(path: Path) -> bool:
    return path.is_dir() and (path / "SKILL.md").is_file()


def _rel(path: Path) -> str:
    try:
        return os.fspath(path.relative_to(REPO_ROOT))
    except Exception:
        return os.fspath(path)


@dataclass(frozen=True)
class Result:
    created: list[str]
    ok: list[str]
    skipped: list[str]


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def _link_or_copy(src: Path, dest: Path, *, mode: str, force: bool) -> str:
    if dest.exists() or dest.is_symlink():
        # Handle already-correct symlink.
        if dest.is_symlink():
            try:
                target = dest.resolve()
            except FileNotFoundError:
                target = None
            if target is not None and target == src.resolve():
                return "ok"
            if force:
                dest.unlink()
            else:
                return "skipped"
        else:
            return "skipped"

    if mode == "copy":
        shutil.copytree(src, dest)
    else:
        dest.symlink_to(src, target_is_directory=True)
    return "created"


def sync(*, mode: str, force: bool) -> Result:
    if not PROJECT_SKILLS_ROOT.is_dir():
        raise RuntimeError(f"Missing skills root: {PROJECT_SKILLS_ROOT}")

    _ensure_dir(_dest_root())

    created: list[str] = []
    ok: list[str] = []
    skipped: list[str] = []

    for child in sorted(PROJECT_SKILLS_ROOT.iterdir(), key=lambda p: p.name.lower()):
        if child.name.startswith("."):
            continue
        if not _is_skill_dir(child):
            continue
        dest = _dest_root() / child.name
        status = _link_or_copy(child, dest, mode=mode, force=force)
        msg = f"{child.name}: {status} ({_rel(child)} -> {dest})"
        if status == "created":
            created.append(msg)
        elif status == "ok":
            ok.append(msg)
        else:
            skipped.append(msg)

    return Result(created=created, ok=ok, skipped=skipped)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Sync repo skills into $CODEX_HOME/skills")
    parser.add_argument(
        "--mode",
        choices=["symlink", "copy"],
        default="symlink",
        help="Sync mode (default: symlink)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Replace existing destination symlinks that point elsewhere (never deletes real dirs).",
    )
    args = parser.parse_args(argv)

    try:
        res = sync(mode=args.mode, force=args.force)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    for line in res.created:
        print(line)
    for line in res.ok:
        print(line)
    for line in res.skipped:
        print(line, file=sys.stderr)

    if res.skipped:
        print(
            f"Skipped {len(res.skipped)} skill(s). Use --force only for symlinks if needed.",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

