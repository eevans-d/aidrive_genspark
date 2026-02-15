> [DEPRECADO: 2026-02-13] Documento histórico de contexto/snapshot. Usar solo para trazabilidad. Fuente vigente: `docs/ESTADO_ACTUAL.md` + `docs/closure/README_CANONICO.md`.

# Next Session Prompt (Codex) — 2026-02-09

Pega este prompt en una nueva ventana de Codex para continuar.

---

## Context Prompt

Estas trabajando en el repo:
- Path: `/home/eevan/ProyectosIA/aidrive_genspark`
- Objetivo: continuar desde el cierre de sesion 2026-02-09 con el proyecto en estado operativo.

Reglas:
- NO imprimir secretos/JWTs (solo nombres).
- NO usar comandos destructivos (`git reset --hard`, `git checkout -- <file>`, force-push).
- `api-minimarket` debe permanecer con `verify_jwt=false` (si se redeployea usar `--no-verify-jwt`).

### 0) Skills (auto)
Sincroniza skills del repo hacia Codex (symlinks) y usa el orquestador:
```bash
cd /home/eevan/ProyectosIA/aidrive_genspark
.agent/scripts/p0.sh bootstrap
.agent/scripts/p0.sh route "<pedido del usuario>"
```

Extracción completa para planificar producción (genera reportes en `docs/closure/`):
```bash
.agent/scripts/p0.sh extract --with-gates --with-supabase
```

Kickoff (push-button: sesion + extraccion + mega plan template):
```bash
.agent/scripts/p0.sh kickoff "objetivo" --with-gates --with-supabase
```

Opcional: iniciar sesion Protocol Zero (solo baseline + briefing + evidencia):
```bash
.agent/scripts/p0.sh session-start "objetivo"
```

### 1) Leer primero (fuente de verdad)
- `docs/closure/NEXT_SESSION_CONTEXT_2026-02-09.md` (punto de entrada recomendado)
- `docs/ESTADO_ACTUAL.md`
- `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`
- `docs/closure/SESSION_CLOSE_2026-02-09.md`
- `docs/closure/EXECUTION_LOG_2026-02-09_NEXT_STEPS.md`
- `docs/closure/REVIEW_LOG_FASE1_FASE2_2026-02-08.md`
- `docs/closure/OPEN_ISSUES.md`

Docs operativas nuevas:
- `docs/SENDGRID_VERIFICATION.md`
- `docs/SECRET_ROTATION_PLAN.md`
- `docs/SENTRY_INTEGRATION_PLAN.md`

Scripts nuevos:
- `scripts/perf-baseline.mjs` (read-only, p50/p95)
- `scripts/smoke-reservas.mjs` (write, idempotente; puede quedar BLOCKED si no hay productos)

### 2) Baseline inmediato (no secrets)
Ejecuta baseline seguro (crea automaticamente un log en `docs/closure/`):
```bash
cd /home/eevan/ProyectosIA/aidrive_genspark
.agent/scripts/baseline_capture.sh
```

### 3) Prioridades recomendadas (proxima sesion)
1. Dependabot PRs (#20–#31): revisar, correr suites, mergear si no rompe (mantener disciplina: 1 PR a la vez).
2. SendGrid: resolver mismatch `EMAIL_FROM` vs `SMTP_FROM` (ver `docs/SENDGRID_VERIFICATION.md`).
3. Secret rotation: coordinar ejecucion real (ver `docs/SECRET_ROTATION_PLAN.md`, sin valores en repo) y registrar evidencia.
4. Sentry: solo si hay DSN real. Seguir `docs/SENTRY_INTEGRATION_PLAN.md`.
5. Performance: correr `node scripts/perf-baseline.mjs 5` (bajo impacto) y guardar resultados en `docs/closure/`.
6. `/reservas` smoke: correr `node scripts/smoke-reservas.mjs` SOLO si esta permitido escribir en el ambiente remoto.

### 4) Quality gates (antes de mergear cambios)
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
pnpm -C minimarket-system lint
pnpm -C minimarket-system build
pnpm -C minimarket-system test:components
```
