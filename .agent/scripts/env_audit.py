#!/usr/bin/env python3
"""
Environment variable audit (names only).

Finds env var references across backend/frontend, compares with `.env.example`,
and (optionally) compares with Supabase secrets (names only).

Never prints secret values.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]


PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("deno", re.compile(r"Deno\.env\.get\(\s*['\"]([A-Z0-9_]+)['\"]\s*\)")),
    ("process_dot", re.compile(r"process\.env\.([A-Z0-9_]+)")),
    ("process_bracket", re.compile(r"process\.env\[\s*['\"]([A-Z0-9_]+)['\"]\s*\]")),
    ("vite_dot", re.compile(r"import\.meta\.env\.([A-Z0-9_]+)")),
    ("vite_bracket", re.compile(r"import\.meta\.env\[\s*['\"]([A-Z0-9_]+)['\"]\s*\]")),
]


DEFAULT_SCAN_DIRS = [
  "supabase/functions",
  "minimarket-system/src",
  "scripts",
]

IGNORE_BUILTINS_DEFAULT = {
    # Vite built-ins (not user-provided env vars).
    "DEV",
    "PROD",
    "MODE",
    "BASE_URL",
    "SSR",
    # Deno Deploy built-ins.
    "DENO_DEPLOYMENT_ID",
}


def _iter_files(scan_dirs: list[Path]) -> list[Path]:
    exts = {".ts", ".tsx", ".js", ".mjs"}
    out: list[Path] = []
    for base in scan_dirs:
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if not p.is_file():
                continue
            if p.suffix.lower() not in exts:
                continue
            # Avoid huge/vendor folders.
            parts = set(p.parts)
            if "node_modules" in parts or "dist" in parts or ".git" in parts:
                continue
            out.append(p)
    return out


def _extract_vars(path: Path) -> dict[str, set[str]]:
    text = path.read_text(encoding="utf-8", errors="replace")
    found: dict[str, set[str]] = defaultdict(set)
    for label, rx in PATTERNS:
        for match in rx.findall(text):
            if isinstance(match, str) and match:
                found[match].add(label)
    return found


def _parse_env_example(path: Path) -> set[str]:
    if not path.is_file():
        return set()
    out: set[str] = set()
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        if s.startswith("export "):
            s = s[len("export ") :].strip()
        if "=" not in s:
            continue
        key = s.split("=", 1)[0].strip()
        if re.fullmatch(r"[A-Z0-9_]+", key):
            out.add(key)
    return out


def _supabase_secret_names(project_ref: str) -> set[str]:
    cmd = [
        "supabase",
        "secrets",
        "list",
        "--project-ref",
        project_ref,
        "--output",
        "json",
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or "supabase secrets list failed")
    data = json.loads(proc.stdout or "[]")
    names: set[str] = set()
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict) and isinstance(item.get("name"), str):
                names.add(item["name"])
    return names


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Audit env var usage vs docs (names only)")
    parser.add_argument(
        "--scan-dir",
        action="append",
        default=[],
        help="Additional scan directory (relative to repo root). Can be repeated.",
    )
    parser.add_argument(
        "--env-example",
        default=".env.example",
        help="Env example file to compare against (default: .env.example).",
    )
    parser.add_argument("--format", choices=["markdown", "json"], default="markdown")
    parser.add_argument("--with-supabase", action="store_true", help="Also compare with Supabase secrets (names only).")
    parser.add_argument("--project-ref", default="dqaygmjpzoqjjrywdsxi", help="Supabase project ref (default: dqaygmjpzoqjjrywdsxi)")
    parser.add_argument(
        "--supabase-scope",
        choices=["backend-only", "all-used"],
        default="backend-only",
        help="When comparing with Supabase secrets, which used vars to compare (default: backend-only).",
    )
    parser.add_argument(
        "--include-builtins",
        action="store_true",
        help="Include framework/runtime built-ins like DEV/PROD/DENO_DEPLOYMENT_ID in results.",
    )
    args = parser.parse_args(argv)

    scan_dirs = [REPO_ROOT / p for p in DEFAULT_SCAN_DIRS]
    scan_dirs.extend(REPO_ROOT / p for p in args.scan_dir)

    files = _iter_files(scan_dirs)
    used: dict[str, dict[str, Any]] = {}
    for f in files:
        vars_in_file = _extract_vars(f)
        for var, labels in vars_in_file.items():
            if not args.include_builtins and var in IGNORE_BUILTINS_DEFAULT:
                continue
            entry = used.setdefault(var, {"files": set(), "sources": set()})
            entry["files"].add(os.fspath(f.relative_to(REPO_ROOT)))
            entry["sources"].update(labels)

    used_names = set(used.keys())
    env_example = _parse_env_example(REPO_ROOT / args.env_example)

    missing_in_env_example = sorted(used_names - env_example)
    unused_in_code = sorted(env_example - used_names)

    supabase_names: set[str] | None = None
    missing_in_supabase: list[str] | None = None
    if args.with_supabase:
        try:
            supabase_names = _supabase_secret_names(args.project_ref)
            if args.supabase_scope == "all-used":
                compare_set = used_names
            else:
                # Supabase secrets are for Edge Functions. Compare only vars used by files under supabase/functions/.
                compare_set = {
                    var
                    for var, info in used.items()
                    if any(str(f).startswith("supabase/functions/") for f in info["files"])
                }
            missing_in_supabase = sorted(compare_set - supabase_names)
        except Exception as exc:
            supabase_names = None
            missing_in_supabase = None
            if args.format == "markdown":
                print(f"WARNING: supabase compare failed: {exc}", file=sys.stderr)

    if args.format == "json":
        payload = {
            "used": {
                k: {
                    "files": sorted(list(v["files"])),
                    "sources": sorted(list(v["sources"])),
                }
                for k, v in sorted(used.items())
            },
            "env_example": sorted(env_example),
            "missing_in_env_example": missing_in_env_example,
            "unused_in_env_example": unused_in_code,
            "supabase_secrets": sorted(list(supabase_names)) if supabase_names is not None else None,
            "missing_in_supabase_secrets": missing_in_supabase,
            "supabase_scope": args.supabase_scope if args.with_supabase else None,
        }
        print(json.dumps(payload, ensure_ascii=True, indent=2))
        return 0

    print("# Env Audit (names only)")
    print("")
    print(f"- Scan roots: {', '.join(os.fspath(p.relative_to(REPO_ROOT)) for p in scan_dirs if p.exists())}")
    print(f"- Env example: `{args.env_example}`")
    if args.with_supabase:
        print(f"- Supabase secrets: enabled (project_ref `{args.project_ref}`)")
        print(f"- Supabase compare scope: `{args.supabase_scope}`")
    else:
        print("- Supabase secrets: disabled")
    print("")

    def _sec(title: str, items: list[str]) -> None:
        print(f"## {title}")
        print("")
        if not items:
            print("(none)")
            print("")
            return
        for it in items:
            print(f"- `{it}`")
        print("")

    _sec("Used In Code But Missing In .env.example", missing_in_env_example)
    _sec("Present In .env.example But Not Used In Code", unused_in_code)

    if args.with_supabase and supabase_names is not None and missing_in_supabase is not None:
        _sec("Used In Code But Missing In Supabase Secrets (names)", missing_in_supabase)

    print("## Notes")
    print("")
    print("- This report never prints values. Review each missing variable and decide whether it belongs in `.env.example` or Supabase secrets.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
