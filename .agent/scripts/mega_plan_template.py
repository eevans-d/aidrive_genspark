#!/usr/bin/env python3
"""
Generate a MEGA_PLAN template under docs/closure/ for non-technical, guided execution.

This is intentionally a TEMPLATE generator:
- It never prints secret values.
- It references existing evidence reports (technical/inventory/baseline) when available.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
CLOSURE_DIR = REPO_ROOT / "docs" / "closure"


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


def _latest(pattern: str) -> Path | None:
    if not CLOSURE_DIR.is_dir():
        return None
    files = sorted(CLOSURE_DIR.glob(pattern), key=lambda p: p.name)
    return files[-1] if files else None


def _extract_blockers(tech_path: Path) -> list[str]:
    """
    Best-effort parse of the "Issues críticos" section from TECHNICAL_ANALYSIS.
    Returns markdown bullet lines (without trailing whitespace).
    """
    try:
        text = tech_path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return []

    header = "## 🔥 Issues críticos que bloquean producción (autodetect)"
    if header not in text:
        return []

    # Capture lines after header until next heading or EOF.
    after = text.split(header, 1)[1]
    lines = after.splitlines()
    out: list[str] = []
    for line in lines:
        if line.startswith("## "):
            break
        s = line.strip()
        if not s:
            continue
        if s.startswith("-"):
            out.append(s)
    return out[:20]


def _write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Generate MEGA_PLAN template (docs/closure)")
    parser.add_argument("--objective", default="", help="One-sentence objective for this plan.")
    parser.add_argument("--from-tech", default="", help="Path to TECHNICAL_ANALYSIS_*.md (optional).")
    parser.add_argument("--from-inventory", default="", help="Path to INVENTORY_REPORT_*.md (optional).")
    parser.add_argument("--from-baseline", default="", help="Path to BASELINE_LOG_*.md (optional).")
    parser.add_argument(
        "--top",
        type=int,
        default=10,
        help="How many top items to include in the template (default: 10).",
    )
    parser.add_argument(
        "--out",
        default="",
        help="Output path (default: docs/closure/MEGA_PLAN_<YYYY-MM-DD>_<HHMMSS>.md).",
    )
    args = parser.parse_args(argv)

    top_n = max(1, min(int(args.top), 20))
    date = _ts_date()
    tm = _ts_time()
    out_path = Path(args.out) if args.out else (CLOSURE_DIR / f"MEGA_PLAN_{date}_{tm}.md")

    tech = Path(args.from_tech) if args.from_tech else (_latest("TECHNICAL_ANALYSIS_*.md") or Path())
    inv = Path(args.from_inventory) if args.from_inventory else (_latest("INVENTORY_REPORT_*.md") or Path())
    base = Path(args.from_baseline) if args.from_baseline else (_latest("BASELINE_LOG_*.md") or Path())

    tech_rel = _safe_rel(tech) if tech and tech.exists() else ""
    inv_rel = _safe_rel(inv) if inv and inv.exists() else ""
    base_rel = _safe_rel(base) if base and base.exists() else ""

    blockers = _extract_blockers(tech) if tech and tech.exists() else []

    objective = (args.objective or "").strip() or "(sin objetivo provisto)"

    # Keep this file deterministic and easy to fill-in by a non-technical owner.
    lines: list[str] = []
    lines.append("# Mega Plan (Plantilla Ejecutable)")
    lines.append("")
    lines.append(f"- Fecha (UTC): `{_utc_now().strftime('%Y-%m-%d %H:%M:%S')}`")
    lines.append(f"- Objetivo: {objective}")
    lines.append("")
    lines.append("## Inputs (Evidencia)")
    lines.append("")
    if tech_rel:
        lines.append(f"- Técnico: `{tech_rel}`")
    else:
        lines.append("- Técnico: (no encontrado) generar con `.agent/scripts/p0.sh extract`")
    if inv_rel:
        lines.append(f"- Inventario: `{inv_rel}`")
    else:
        lines.append("- Inventario: (no encontrado) generar con `.agent/scripts/p0.sh extract`")
    if base_rel:
        lines.append(f"- Baseline: `{base_rel}`")
    else:
        lines.append("- Baseline: (no encontrado) generar con `.agent/scripts/p0.sh baseline`")
    lines.append("")

    lines.append("## 🔥 Blockers (autodetect, si aplica)")
    lines.append("")
    if blockers:
        lines.extend(blockers)
    else:
        lines.append("- (none) revisar manualmente: SendGrid, rotación de secretos, Sentry, gates.")
    lines.append("")

    lines.append(f"## Prioridades (Top {top_n})")
    lines.append("")
    for i in range(1, top_n + 1):
        lines.append(f"{i}. [Tarea] (Impacto N, Riesgo X) | Skill: `...`")
        lines.append("   - DoD: ... (verificable)")
        lines.append("   - Verificación (gates): ...")
        lines.append("   - Evidencia: `docs/closure/...` o `test-reports/...`")
        lines.append("   - Rollback (si impacto >= 2): ...")
        lines.append("")

    lines.append("## Secuencia Recomendada (bloques)")
    lines.append("")
    lines.append("- Bloque A: Quick wins (impacto 0-1)")
    lines.append("- Bloque B: Safety/Infra (impacto 0-2): secrets, RLS, deploy, CI")
    lines.append("- Bloque C: Producto/UX (impacto 1-2)")
    lines.append("- Bloque D: Performance (impacto 0-1): medir -> optimizar")
    lines.append("")

    lines.append("## Quality Gates (antes de merge/deploy)")
    lines.append("")
    lines.append("```bash")
    lines.append(".agent/scripts/p0.sh gates all")
    lines.append("```")
    lines.append("")
    lines.append("## Evidencia mínima requerida por item")
    lines.append("")
    lines.append("- Log de gates: `test-reports/quality-gates_*.log`")
    lines.append("- Evidencia de decisión: `docs/DECISION_LOG.md` (si aplica)")
    lines.append("- Evidencia de sesión: `.agent/sessions/archive/<ts>/` (si se usa SessionOps)")
    lines.append("")

    _write(out_path, "\n".join(lines).rstrip() + "\n")
    print(_safe_rel(out_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
