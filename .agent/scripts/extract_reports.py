#!/usr/bin/env python3
"""
Generate production-readiness extraction reports (Markdown) for sharing with another agent.

Outputs (under docs/closure/):
- TECHNICAL_ANALYSIS_<YYYY-MM-DD>_<HHMMSS>.md
- INVENTORY_REPORT_<YYYY-MM-DD>_<HHMMSS>.md

Safety:
- Never prints secret values (only names).
- Never reads .env files except `.env.example` (names only).
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
CLOSURE_DIR = REPO_ROOT / "docs" / "closure"
BASELINE_REUSE_WINDOW_SECONDS = 10 * 60


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _ts_date() -> str:
    return _utc_now().strftime("%Y-%m-%d")


def _ts_time() -> str:
    return _utc_now().strftime("%H%M%S")


def _safe_rel(path: Path) -> str:
    try:
        return os.fspath(path.relative_to(REPO_ROOT))
    except Exception:
        return os.fspath(path)


@dataclass(frozen=True)
class CmdResult:
    cmd: str
    rc: int
    out: str


def _run(cmd: list[str] | str, *, timeout: int = 900, cwd: Path | None = None) -> CmdResult:
    if isinstance(cmd, list):
        cmd_str = " ".join(_shell_quote(x) for x in cmd)
    else:
        cmd_str = cmd
    proc = subprocess.run(
        cmd,
        cwd=os.fspath(cwd or REPO_ROOT),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        timeout=timeout,
        shell=isinstance(cmd, str),
    )
    return CmdResult(cmd=cmd_str, rc=proc.returncode, out=(proc.stdout or ""))


def _shell_quote(s: str) -> str:
    # Minimal POSIX-ish quoting for display only.
    if re.fullmatch(r"[A-Za-z0-9_./:-]+", s):
        return s
    return "'" + s.replace("'", "'\"'\"'") + "'"


def _truncate(text: str, *, max_chars: int = 6000) -> str:
    t = text.rstrip()
    if len(t) <= max_chars:
        return t
    return t[:max_chars].rstrip() + "\n... (truncated)\n"


def _md_cmd(res: CmdResult, *, max_chars: int = 6000) -> str:
    out = _truncate(res.out, max_chars=max_chars)
    return "\n".join(
        [
            "```bash",
            res.cmd,
            "```",
            "",
            "```text",
            out if out else "(no output)",
            "```",
            "",
        ]
    )


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _list_dir_names(path: Path, *, exclude_prefix: str = "", dirs_only: bool = True) -> list[str]:
    if not path.is_dir():
        return []
    names = []
    for child in path.iterdir():
        if child.name.startswith("."):
            continue
        if dirs_only and not child.is_dir():
            continue
        if exclude_prefix and child.name.startswith(exclude_prefix):
            continue
        names.append(child.name)
    return sorted(names, key=str.lower)


def _count_tests() -> dict[str, int]:
    tests_root = REPO_ROOT / "tests"
    out = {"unit": 0, "integration": 0, "e2e": 0, "component": 0}
    if not tests_root.exists():
        return out
    for p in tests_root.rglob("*.test.ts"):
        rel = _safe_rel(p)
        if rel.startswith("tests/unit/"):
            out["unit"] += 1
        elif rel.startswith("tests/integration/"):
            out["integration"] += 1
        elif rel.startswith("tests/e2e/"):
            out["e2e"] += 1
    # Frontend component tests live under minimarket-system; best-effort count
    comp_dir = REPO_ROOT / "minimarket-system" / "src"
    if comp_dir.exists():
        for p in comp_dir.rglob("*.test.tsx"):
            out["component"] += 1
    return out


def _top_files_by_lines(*, top_n: int = 20) -> list[tuple[int, str]]:
    # Uses git ls-files to avoid node_modules. We filter by extension ourselves
    # to avoid git pathspec glob edge cases.
    exts = {".ts", ".tsx", ".js", ".mjs"}
    cmd = ["git", "ls-files"]
    try:
        res = _run(cmd, timeout=60)
    except Exception:
        return []
    if res.rc != 0:
        return []
    files = []
    for f in (x.strip() for x in res.out.splitlines()):
        if not f:
            continue
        if Path(f).suffix.lower() not in exts:
            continue
        files.append(f)
    files = sorted(set(files), key=str.lower)
    scored: list[tuple[int, str]] = []
    for f in files:
        p = REPO_ROOT / f
        try:
            n = sum(1 for _ in p.open("r", encoding="utf-8", errors="ignore"))
        except Exception:
            continue
        scored.append((n, f))
    scored.sort(key=lambda x: (-x[0], x[1].lower()))
    return scored[:top_n]


def _extract_openapi_paths(path: Path, *, max_paths: int = 60) -> list[str]:
    if not path.is_file():
        return []
    paths: list[str] = []
    rx = re.compile(r"^\s{2}(/[^:]+):\s*$")
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        m = rx.match(line)
        if not m:
            continue
        paths.append(m.group(1).strip())
        if len(paths) >= max_paths:
            break
    return paths


def _find_latest_quality_log() -> str | None:
    root = REPO_ROOT / "test-reports"
    if not root.is_dir():
        return None
    candidates = sorted(root.glob("quality-gates_*.log"), key=lambda p: p.name)
    return _safe_rel(candidates[-1]) if candidates else None


def _baseline_capture() -> str | None:
    """
    Return the latest baseline log path, reusing a recent one when possible.

    This avoids generating multiple BASELINE_LOG_* files during a single workflow
    (e.g., session-start + extract).
    """
    if CLOSURE_DIR.is_dir():
        files = sorted(CLOSURE_DIR.glob("BASELINE_LOG_*.md"), key=lambda p: p.name)
        if files:
            latest = files[-1]
            try:
                age = max(0.0, (datetime.now(timezone.utc) - datetime.fromtimestamp(latest.stat().st_mtime, timezone.utc)).total_seconds())
            except Exception:
                age = BASELINE_REUSE_WINDOW_SECONDS + 1
            if age <= BASELINE_REUSE_WINDOW_SECONDS:
                return _safe_rel(latest)

    # Run baseline capture and parse the created file path from stdout.
    try:
        res = _run([".agent/scripts/baseline_capture.sh"], timeout=300)
    except Exception:
        return None
    m = re.search(r"^Wrote:\s+(docs/closure/BASELINE_LOG_[^\s]+\.md)\s*$", res.out, flags=re.M)
    if m:
        return m.group(1)

    # Fallback: find most recent baseline file.
    if CLOSURE_DIR.is_dir():
        files = sorted(CLOSURE_DIR.glob("BASELINE_LOG_*.md"), key=lambda p: p.name)
        return _safe_rel(files[-1]) if files else None
    return None


def _write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def _technical_report(
    *, include_gates: bool, include_perf: bool, include_supabase_compare: bool, baseline_file: str | None
) -> tuple[str, str]:
    date = _ts_date()
    tm = _ts_time()
    out_path = REPO_ROOT / "docs" / "closure" / f"TECHNICAL_ANALYSIS_{date}_{tm}.md"

    # Baseline evidence (safe) and env audit (names only).
    env_audit_cmd = [".agent/scripts/env_audit.py", "--format", "markdown"]
    if include_supabase_compare:
        env_audit_cmd += ["--with-supabase", "--supabase-scope", "backend-only"]
    env_audit = _run(env_audit_cmd, timeout=300)

    # Core facts.
    git_branch = _run(["git", "rev-parse", "--abbrev-ref", "HEAD"], timeout=30)
    git_head = _run(["git", "rev-parse", "HEAD"], timeout=30)
    node_v = _run(["node", "-v"], timeout=30)
    npm_v = _run(["npm", "-v"], timeout=30)
    pnpm_v = _run(["pnpm", "-v"], timeout=30)
    supabase_v = _run(["supabase", "--version"], timeout=30) if shutil_which("supabase") else None

    pkg = _read_json(REPO_ROOT / "package.json")
    fe_pkg = _read_json(REPO_ROOT / "minimarket-system" / "package.json") if (REPO_ROOT / "minimarket-system" / "package.json").is_file() else {}

    edge_functions = _list_dir_names(REPO_ROOT / "supabase" / "functions", dirs_only=True)
    # Exclude non-functions folders.
    edge_functions = [n for n in edge_functions if n not in {"_shared"}]

    openapi_paths = _extract_openapi_paths(REPO_ROOT / "docs" / "api-openapi-3.1.yaml")
    openapi_prov_paths = _extract_openapi_paths(REPO_ROOT / "docs" / "api-proveedor-openapi-3.1.yaml")

    tests_count = _count_tests()
    todos = _run(
        [
            "rg",
            "-n",
            "(TODO|FIXME|HACK)",
            "supabase",
            "minimarket-system/src",
            "scripts",
            "tests",
            "docs",
            "--glob",
            "!docs/closure/**",
        ],
        timeout=180,
    )
    todos_preview = "\n".join(todos.out.splitlines()[:80])

    top_files = _top_files_by_lines(top_n=20)

    # Detect JWT-like tokens by filename only; keep regex tight to reduce false positives.
    forbidden_jwt = _run(
        [
            "rg",
            "-l",
            "-e",
            r"ey[A-Za-z0-9\-_=]{20,}",
            "--glob",
            "*.ts",
            "--glob",
            "*.tsx",
            "--glob",
            "*.js",
            "--glob",
            "*.mjs",
            "supabase/functions",
            "minimarket-system/src",
            "scripts",
            "tests",
        ],
        timeout=180,
    )
    forbidden_console = _run(["rg", "-l", r"console\.log", "supabase/functions"], timeout=120)

    gates_rc = None
    if include_gates:
        # Run full gates; quality_gates.sh writes a log file.
        gates = _run([".agent/scripts/quality_gates.sh", "all"], timeout=60 * 60)
        gates_rc = gates.rc

    perf_res = None
    if include_perf and (REPO_ROOT / "scripts" / "perf-baseline.mjs").is_file():
        perf_res = _run(["node", "scripts/perf-baseline.mjs", "5"], timeout=600)

    latest_quality_log = _find_latest_quality_log()

    lines: list[str] = []
    lines.append("# MISIÓN: ANÁLISIS TÉCNICO INTEGRAL DEL PROYECTO")
    lines.append("")
    lines.append(f"- Fecha (UTC): `{_utc_now().strftime('%Y-%m-%d %H:%M:%S')}`")
    lines.append(f"- Repo: `{_safe_rel(REPO_ROOT)}`")
    lines.append(f"- Branch: `{git_branch.out.strip()}`")
    lines.append(f"- Commit: `{git_head.out.strip()}`")
    if baseline_file:
        lines.append(f"- Baseline log (safe): `{baseline_file}`")
    lines.append("")

    lines.append("## 1. ARQUITECTURA Y ESTRUCTURA DEL PROYECTO")
    lines.append("")
    lines.append("### A. Información General")
    lines.append("")
    lines.append(f"- Nombre (package.json): `{pkg.get('name', 'n/a')}`")
    lines.append("- Tipo: fullstack (React/Vite frontend + Supabase Edge Functions backend + Postgres/Supabase)")
    lines.append("- Stack (alto nivel):")
    lines.append(f"  - Node: `{node_v.out.strip()}` | npm: `{npm_v.out.strip()}` | pnpm: `{pnpm_v.out.strip()}`")
    if supabase_v:
        lines.append(f"  - Supabase CLI: `{supabase_v.out.strip()}`")
    lines.append(f"- Root package deps (high-signal): `vitest`, `@supabase/supabase-js`, `@tanstack/react-query`")
    lines.append(f"- Frontend deps (high-signal): `{fe_pkg.get('name','minimarket-system')}` (ver `minimarket-system/package.json`)")
    lines.append("")

    lines.append("### B. Componentes Principales")
    lines.append("")
    lines.append(f"- Edge Functions en repo: {len(edge_functions)}")
    if edge_functions:
        lines.append("  - " + ", ".join(f"`{n}`" for n in edge_functions[:20]) + (" ..." if len(edge_functions) > 20 else ""))
    lines.append(f"- OpenAPI paths (api-minimarket spec): {len(openapi_paths)} (muestra hasta {len(openapi_paths)}):")
    if openapi_paths:
        lines.append("  - " + ", ".join(f"`{p}`" for p in openapi_paths[:25]) + (" ..." if len(openapi_paths) > 25 else ""))
    lines.append(f"- OpenAPI paths (api-proveedor spec): {len(openapi_prov_paths)}")
    lines.append("")

    lines.append("## 2. ESTADO ACTUAL DEL CÓDIGO")
    lines.append("")
    lines.append("### A. Análisis de Calidad (estático)")
    lines.append("")
    lines.append("- TODO/FIXME/HACK (preview):")
    lines.append("")
    lines.append("```text")
    lines.append(_truncate(todos_preview, max_chars=4000) if todos_preview else "(none)")
    lines.append("```")
    lines.append("")
    lines.append("- Archivos más grandes por líneas (aprox):")
    if top_files:
        lines.append("")
        lines.append("| Lines | File |")
        lines.append("|---:|---|")
        for n, f in top_files:
            lines.append(f"| {n} | `{f}` |")
        lines.append("")

    lines.append("### B. Patrones prohibidos (seguridad/higiene)")
    lines.append("")
    jwt_files = [f.strip() for f in forbidden_jwt.out.splitlines() if f.strip()]
    jwt_code = [f for f in jwt_files if f.startswith(("supabase/functions/", "minimarket-system/src/", "scripts/"))]
    jwt_tests = [f for f in jwt_files if f.startswith(("tests/",))]
    jwt_status = "✅ none"
    if jwt_code:
        jwt_status = "🔥 FOUND (code)"
    elif jwt_tests:
        jwt_status = "⚠️ FOUND (tests only)"
    lines.append(f"- Posibles JWT hardcodeados (filenames only): {jwt_status}")
    if forbidden_jwt.out.strip():
        lines.append("  - Files:")
        for f in jwt_files[:20]:
            lines.append(f"    - `{f}`")
        if len(jwt_files) > 20:
            lines.append(f"    - ... ({len(jwt_files) - 20} more)")
    lines.append(f"- console.log en backend (filenames only): {'✅ none' if forbidden_console.rc == 1 or not forbidden_console.out.strip() else '⚠️ FOUND'}")
    if forbidden_console.out.strip():
        for f in forbidden_console.out.splitlines()[:20]:
            lines.append(f"  - `{f}`")
    lines.append("")

    lines.append("## 3. TESTING Y CALIDAD")
    lines.append("")
    lines.append("### A. Cobertura / Inventario de tests (aprox)")
    lines.append("")
    lines.append(f"- Unit test files: `{tests_count['unit']}`")
    lines.append(f"- Integration test files: `{tests_count['integration']}`")
    lines.append(f"- E2E test files: `{tests_count['e2e']}`")
    lines.append(f"- Frontend component test files: `{tests_count['component']}`")
    lines.append("")

    lines.append("### B. Ejecución de tests / gates")
    lines.append("")
    if include_gates:
        status = "✅ PASS" if gates_rc == 0 else f"❌ FAIL (exit {gates_rc})"
        lines.append(f"- Quality gates: {status}")
        if latest_quality_log:
            lines.append(f"- Log: `{latest_quality_log}`")
    else:
        lines.append("- Quality gates: (skipped) re-run with `--with-gates`.")
    lines.append("")

    if perf_res is not None:
        lines.append("## 4. PERFORMANCE (baseline)")
        lines.append("")
        lines.append(_md_cmd(perf_res, max_chars=6000))

    lines.append("## 5. CONFIGURACIÓN Y ENTORNO")
    lines.append("")
    lines.append("### A. Variables de entorno (names only)")
    lines.append("")
    lines.append(_md_cmd(env_audit, max_chars=8000))

    lines.append("## 6. DOCUMENTACIÓN ACTUAL")
    lines.append("")
    lines.append("- Fuente de verdad: `docs/ESTADO_ACTUAL.md`")
    lines.append("- Plan vigente: `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`")
    lines.append("- OpenAPI: `docs/api-openapi-3.1.yaml`, `docs/api-proveedor-openapi-3.1.yaml`")
    lines.append("")

    lines.append("## 7. SEGURIDAD Y BUENAS PRÁCTICAS (resumen)")
    lines.append("")
    lines.append("- RLS/Advisor: ver `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` + `docs/SECURITY_AUDIT_REPORT.md`")
    lines.append("- Enforced guardrails: no secrets in logs, no destructive git, api-minimarket verify_jwt=false")
    lines.append("")

    lines.append("## 8. BASE DE DATOS Y DATOS")
    lines.append("")
    mig_dir = REPO_ROOT / "supabase" / "migrations"
    mig_files = sorted(mig_dir.glob("*.sql"), key=lambda p: p.name)
    lines.append(f"- Migrations en repo: `{len(mig_files)}` (`supabase/migrations/`)")
    if mig_files:
        lines.append(f"- Última migración: `{_safe_rel(mig_files[-1])}`")
    lines.append("")

    lines.append("## 🔥 Issues críticos que bloquean producción (autodetect)")
    lines.append("")
    blockers: list[str] = []
    if include_gates and gates_rc not in (None, 0):
        blockers.append(f"- ❌ Quality gates fallan (ver `{latest_quality_log or 'test-reports/quality-gates_*.log'}`)")
    if jwt_code:
        blockers.append("- 🔥 Posibles JWTs hardcodeados detectados en CÓDIGO (filenames list arriba) (CRÍTICO)")
    elif jwt_tests:
        blockers.append("- ⚠️ JWT-like strings detectados solo en tests (probable fixture). Revisar para evitar leaks accidentales.")
    if not blockers:
        blockers.append("- (none detected by automation; revisar planes: SendGrid/Secret rotation/Sentry)")
    lines.extend(blockers)
    lines.append("")

    _write(out_path, "\n".join(lines))
    return (_safe_rel(out_path), latest_quality_log or "")


def _inventory_report(*, include_supabase_compare: bool, baseline_file: str | None) -> str:
    date = _ts_date()
    tm = _ts_time()
    out_path = REPO_ROOT / "docs" / "closure" / f"INVENTORY_REPORT_{date}_{tm}.md"

    env_audit_cmd = [".agent/scripts/env_audit.py", "--format", "markdown"]
    if include_supabase_compare:
        env_audit_cmd += ["--with-supabase", "--supabase-scope", "backend-only"]
    env_audit = _run(env_audit_cmd, timeout=300)

    # Project size summary (avoid node_modules explosion).
    du_cmds = [
        ["du", "-sh", ".agent"],
        ["du", "-sh", "docs"],
        ["du", "-sh", "supabase"],
        ["du", "-sh", "tests"],
        ["du", "-sh", "scripts"],
        ["du", "-sh", "minimarket-system"],
    ]
    du_results = []
    for c in du_cmds:
        if shutil_which("du"):
            du_results.append(_run(c, timeout=60))

    # Assets inventory (best-effort).
    assets = []
    for root in [REPO_ROOT / "minimarket-system" / "public", REPO_ROOT / "minimarket-system" / "src" / "assets"]:
        if root.is_dir():
            for p in root.rglob("*"):
                if p.is_file():
                    assets.append((_safe_rel(p), p.stat().st_size))
    assets.sort(key=lambda x: (-x[1], x[0].lower()))

    # Integrations signals from env audit used-in-code missing list (names only).
    used_missing_env_example = []
    for line in env_audit.out.splitlines():
        m = re.match(r"^- `([A-Z0-9_]+)`$", line.strip())
        if m:
            used_missing_env_example.append(m.group(1))

    integrations = []
    for key in used_missing_env_example:
        if "SENDGRID" in key or "SMTP_" in key:
            integrations.append("SendGrid (SMTP)")
        if key.startswith("TWILIO_"):
            integrations.append("Twilio")
        if "SLACK" in key:
            integrations.append("Slack (webhook)")
        if key.startswith("VITE_SENTRY_") or key == "VITE_SENTRY_DSN":
            integrations.append("Sentry")
    integrations = sorted(set(integrations))

    lines: list[str] = []
    lines.append("# MISIÓN: INVENTARIO COMPLETO DE RECURSOS DEL PROYECTO")
    lines.append("")
    lines.append(f"- Fecha (UTC): `{_utc_now().strftime('%Y-%m-%d %H:%M:%S')}`")
    lines.append(f"- Repo: `{_safe_rel(REPO_ROOT)}`")
    if baseline_file:
        lines.append(f"- Baseline log (safe): `{baseline_file}`")
    lines.append("")

    lines.append("## 1. RECURSOS DEL PROYECTO")
    lines.append("")
    lines.append("### A. Archivos y Assets")
    lines.append("")
    if du_results:
        lines.append("- Tamaño por carpeta (aprox):")
        lines.append("")
        lines.append("| Size | Path |")
        lines.append("|---:|---|")
        for r in du_results:
            # du output: "<size>\t<path>"
            first = r.out.strip().splitlines()[:1]
            if first:
                parts = first[0].split()
                if parts:
                    size = parts[0]
                    path = parts[-1]
                    lines.append(f"| {size} | `{path}` |")
        lines.append("")

    lines.append(f"- Assets detectados (best-effort): `{len(assets)}` (top 20 por tamaño)")
    if assets:
        lines.append("")
        lines.append("| Bytes | Asset |")
        lines.append("|---:|---|")
        for rel, sz in assets[:20]:
            lines.append(f"| {sz} | `{rel}` |")
        lines.append("")

    lines.append("### B. Configuraciones")
    lines.append("")
    lines.append("- `.env.example` existe y documenta variables base (sin valores reales).")
    lines.append("- CI: `.github/workflows/ci.yml`")
    lines.append("- Deploy: `deploy.sh` + `docs/DEPLOYMENT_GUIDE.md`")
    lines.append("- Rollback: `docs/ROLLBACK_SQL_TEMPLATE.md` + archivos en `docs/`")
    lines.append("")

    lines.append("## 2. CONTEXTO DE NEGOCIO (inferido)")
    lines.append("")
    lines.append("- Propósito: sistema de gestión para mini markets (inventario/ventas/reportes) (ver `README.md` + `docs/ESTADO_ACTUAL.md`).")
    lines.append("- Usuarios/roles: admin, ventas, depósito (ver `docs/ESTADO_ACTUAL.md` / frontend).")
    lines.append("")

    lines.append("## 3. INTEGRACIONES Y SERVICIOS EXTERNOS (signals)")
    lines.append("")
    if integrations:
        for it in integrations:
            lines.append(f"- {it}")
    else:
        lines.append("- (no signals detected)")
    lines.append("")

    lines.append("## 4. HISTORIAL Y DECISIONES TÉCNICAS")
    lines.append("")
    lines.append("- Ver `docs/DECISION_LOG.md` (fuente de decisiones).")
    lines.append("- Ver `docs/ARCHITECTURE_DOCUMENTATION.md` (arquitectura).")
    lines.append("")

    lines.append("## 5. CHECKLIST PRE-PRODUCCIÓN (resumen)")
    lines.append("")
    lines.append("- [ ] Variables de entorno configurables (ver env audit)")
    lines.append("- [ ] Manejo de errores robusto (ver `observability.ts` / planes Sentry)")
    lines.append("- [ ] Logging implementado (backend `_shared/logger.ts`)")
    lines.append("- [ ] Tests críticos pasando (ver quality gates logs)")
    lines.append("- [ ] Sin credenciales hardcodeadas (ver scan JWT filenames)")
    lines.append("- [ ] HTTPS/CORS configurado (ver `ALLOWED_ORIGINS` / guardrails)")
    lines.append("- [ ] Rate limiting (ver migraciones 20260208020000 + `rate_limit_state`)")
    lines.append("- [ ] Backup/rollback strategy (docs + templates)")
    lines.append("- [ ] Monitoring/alerting (planes: Sentry, health checks, cron monitoring)")
    lines.append("")

    lines.append("## 6. ESTIMACIÓN DE TRABAJO RESTANTE (alto nivel)")
    lines.append("")
    lines.append("- Bloqueantes típicos (según docs):")
    lines.append("  - SendGrid sender verification (requiere dashboard)")
    lines.append("  - Secret rotation (coordinación + evidencia)")
    lines.append("  - Sentry (solo con DSN real)")
    lines.append("- Importantes no bloqueantes:")
    lines.append("  - Dependabot PRs (1 PR a la vez) con gates")
    lines.append("  - Perf baseline + reporte")
    lines.append("")

    lines.append("## Appendix: Env Audit (names only)")
    lines.append("")
    lines.append(_md_cmd(env_audit, max_chars=9000))

    _write(out_path, "\n".join(lines))
    return _safe_rel(out_path)


def shutil_which(exe: str) -> str | None:
    from shutil import which

    return which(exe)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Generate extraction reports for production hardening")
    parser.add_argument(
        "--mode",
        choices=["technical", "inventory", "both"],
        default="both",
        help="Which report(s) to generate (default: both).",
    )
    parser.add_argument("--with-gates", action="store_true", help="Run full quality gates (may take time).")
    parser.add_argument("--with-perf", action="store_true", help="Run perf baseline script if present.")
    parser.add_argument(
        "--with-supabase",
        action="store_true",
        help="Compare env usage with Supabase secrets (names only). Requires supabase CLI auth.",
    )
    args = parser.parse_args(argv)

    # Always ensure bootstrap is ok (idempotent, safe).
    _run([".agent/scripts/bootstrap.sh"], timeout=300)

    baseline_file = _baseline_capture()

    created: list[str] = []
    if args.mode in ("technical", "both"):
        tech_path, _ = _technical_report(
            include_gates=args.with_gates,
            include_perf=args.with_perf,
            include_supabase_compare=args.with_supabase,
            baseline_file=baseline_file,
        )
        created.append(tech_path)
    if args.mode in ("inventory", "both"):
        inv_path = _inventory_report(include_supabase_compare=args.with_supabase, baseline_file=baseline_file)
        created.append(inv_path)

    for p in created:
        print(p)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
