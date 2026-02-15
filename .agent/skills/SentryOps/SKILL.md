---
name: SentryOps
description: Integracion Sentry (solo con DSN real) siguiendo el plan del repo, midiendo
  impacto en bundle y dejando evidencia.
role: CODEX->EXECUTOR
version: 1.0.0
impact: HIGH
impact_legacy: 1-2
triggers:
  automatic:
  - orchestrator keyword match (SentryOps)
  manual:
  - SentryOps
  - sentry
  - dsn
  - observability
chain:
  receives_from: []
  sends_to:
  - DocuGuard
  - PerformanceWatch
  - TestMaster
  required_before: []
priority: 8
---

# SentryOps Skill

**ROL:** CODEX->EXECUTOR. Observabilidad UI con disciplina: sin DSN no se toca.

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres). Tratar DSN como secreto (no loggear su valor).
2. NO instalar `@sentry/react` si no hay DSN real.
3. Medir impacto (bundle/perf) y dejar evidencia.

## Activacion

**Activar cuando:**
- El usuario pide integrar Sentry.
- Existe un DSN real disponible.
- Se quiere mejorar observabilidad UI.

## Protocolo

### FASE A: Fuente de verdad

Leer `docs/SENTRY_INTEGRATION_PLAN.md`.

### FASE B: Check DSN (sin exponer valor)

1. Verificar si hay DSN configurado (solo presencia):
   ```bash
   rg -q '^VITE_SENTRY_DSN=' .env.production && echo "DSN present" || echo "DSN missing"
   ```
2. Si falta DSN: BLOQUEAR y dejar checklist para el owner (crear cuenta/proyecto, obtener DSN).

### FASE C: Integracion (solo si DSN existe)

1. Instalar dependencia:
   ```bash
   pnpm -C minimarket-system add @sentry/react
   ```
2. Implementar pasos del plan (main.tsx, observability.ts, ErrorBoundary).
3. Quality gates:
   ```bash
   .agent/scripts/quality_gates.sh frontend
   ```
4. Medir impacto:
   ```bash
   node scripts/perf-baseline.mjs 5
   ```

### FASE D: Evidencia

Crear en `docs/closure/`:
- `SENTRY_INTEGRATION_<YYYY-MM-DD>_<HHMMSS>.md` con:
  - Cambio aplicado (archivos)
  - Verificacion (build + gates)
  - Impacto bundle/perf (baseline)

## Quality Gates

- [ ] DSN real verificado (presente en `.env.production`).
- [ ] Dependencia `@sentry/react` instalada.
- [ ] Integracion implementada (main.tsx, ErrorBoundary).
- [ ] Build exitoso post-integracion.
- [ ] Bundle size impact medido (delta vs baseline).
- [ ] Si bundle crece >15% → WARNING documentado.
- [ ] Evidencia generada en `docs/closure/`.

## Anti-Loop / Stop-Conditions

**SI DSN no disponible:**
1. BLOQUEAR integracion (no instalar dependencia).
2. Generar checklist para el owner (crear proyecto Sentry, obtener DSN).
3. Marcar como BLOCKED y continuar con otras tareas.

**SI bundle crece >20%:**
1. Evaluar si el incremento es aceptable.
2. Documentar alternativas (lazy loading de Sentry).
3. NO revertir automaticamente; reportar para decision humana.

**SI quality_gates.sh falla post-integracion:**
1. Revertir cambios de Sentry.
2. Documentar incompatibilidad.
3. NO reintentar sin diagnostico previo.

**NUNCA:** Instalar @sentry/react sin DSN real configurado.
