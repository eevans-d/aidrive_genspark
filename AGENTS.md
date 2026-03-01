# Protocol Zero (aidrive_genspark)

This repo includes an agentic workflow + skills system under `.agent/`.

If you are an AI coding agent: treat `.agent/` as the source of truth for how to operate.

## Non-Negotiable Guardrails

- NEVER print secrets/JWTs (only secret NAMES).
- NEVER use destructive git commands (`git reset --hard`, `git checkout -- <file>`, force-push).
- Supabase Edge Function `api-minimarket` must remain `verify_jwt=false` (if redeploying, use `--no-verify-jwt`).

## Quick Start

Bootstrap skills (idempotent):
```bash
.agent/scripts/p0.sh bootstrap
```

Select the right skill automatically for a request:
```bash
.agent/scripts/p0.sh route "<user request>"
```

Generate production-planning extraction reports:
```bash
.agent/scripts/p0.sh extract --with-gates --with-supabase
```

Start/end a session with evidence:
```bash
.agent/scripts/p0.sh session-start "<objective>"
.agent/scripts/p0.sh session-end
```

Kickoff (push-button: session-start + extract + mega-plan template):
```bash
.agent/scripts/p0.sh kickoff "<objective>" --with-gates --with-supabase
```

## Source Of Truth Docs

- `docs/ESTADO_ACTUAL.md` — estado actual verificado del sistema
- `docs/DECISION_LOG.md` — decisiones activas e hitos (D-001..D-178+)
- `docs/API_README.md` — endpoints, roles, contratos del gateway y edge functions
- `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` — schema BD real
- `docs/PLAN_FUSIONADO_FACTURAS_OCR.md` — roadmap OCR (10/10 completado)
- `docs/PLAN_ASISTENTE_IA_DASHBOARD.md` — plan asistente IA (Sprint 1 completado, Sprint 2+ pendiente)
- `docs/closure/OPEN_ISSUES.md` — issues abiertos y cerrados
- `docs/api-openapi-3.1.yaml` — OpenAPI spec
- `docs/PRODUCTION_GATE_REPORT.md` — ultimo reporte de production gate
- `AGENTS.md` (this file)
- `CLAUDE.md` — bootstrap agentico
