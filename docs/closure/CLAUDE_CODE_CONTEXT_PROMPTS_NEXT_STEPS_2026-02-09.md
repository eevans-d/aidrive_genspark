# Claude Code — Context Prompt Engineering (Next Steps) — 2026-02-09

Objetivo: entregar a un nuevo agente (Claude Code) un set **definitivo** (max 5 prompts) para continuar la ejecución “post-merge” de manera **auditada**, **no destructiva** y **operativamente segura**.

Estado actual verificado (2026-02-09):
- Branch estable: `main` (PR `#33` y PR `#34` ya mergeados).
- Evidencia QA/cierre FASE 1-2:
  - `docs/closure/REVIEW_LOG_FASE1_FASE2_2026-02-08.md`
  - `docs/closure/INTEGRATION_LOG_FASE1_FASE2_2026-02-09.md`
  - `docs/closure/CI_FIX_EDGE_FUNCTIONS_SYNTAX_CHECK_2026-02-09.md`
- Supabase project-ref: `dqaygmjpzoqjjrywdsxi`
- Regla crítica: `api-minimarket` debe seguir `verify_jwt=false` (si se redeployea: `--no-verify-jwt`).

Uso:
- Pegar **PROMPT 1**, ejecutar, actualizar el log.
- Luego **PROMPT 2** … **PROMPT 5**.
- No ejecutar prompts en paralelo.

---

## PROMPT 1/5 — Bootstrap + Baseline + Log Auditable

```text
Actuas como Claude Code (agente ejecutor) en este repo.

Repo:
- Path: /home/eevan/ProyectosIA/aidrive_genspark
- Branch objetivo: main

Reglas NO negociables:
1) Prohibido: git reset --hard, git checkout -- <archivo>, reescritura de historia, force-push.
2) Seguridad: NO imprimir secretos/JWTs/passwords/DB URLs. Si listás secretos: SOLO nombres.
3) Supabase: api-minimarket debe permanecer verify_jwt=false. Si redeploy: usar --no-verify-jwt.
4) Evidencia auditable: TODO comando relevante + resultado debe quedar en docs/closure/.
5) Si hay cambios: branch propio + commits mínimos + PR. No mezclar temas.

Primero: crear log de turno y baseline (pegar outputs completos, sin secretos):

cd /home/eevan/ProyectosIA/aidrive_genspark
date
git status --porcelain=v1
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
git log -n 15 --oneline --decorate

supabase --version
supabase migration list --linked
supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json | jq -r '.[] | "\(.name)\tv\(.version)\tverify_jwt=\(.verify_jwt)"' | sort
supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi --output json | jq -r '.[].name' | sort

gh pr view 33 --json number,state,mergedAt,mergeCommit,url --jq '{number,state,mergedAt,mergeCommit:(.mergeCommit.oid),url}'
gh pr view 34 --json number,state,mergedAt,mergeCommit,url --jq '{number,state,mergedAt,mergeCommit:(.mergeCommit.oid),url}'

Crear el archivo:
- docs/closure/EXECUTION_LOG_2026-02-09_NEXT_STEPS.md
Y pegar allí todo lo anterior + un índice de tareas a ejecutar.

PASS si:
- Estas en main, working tree limpio.
- migrations linked incluyen 20260208020000 y 20260208030000 en remoto.
- functions list muestra api-minimarket verify_jwt=false.
- PR #33 y #34 figuran MERGED.
```

---

## PROMPT 2/5 — Verificación de Artefactos + Sync de Pendientes (docs-only si aplica)

```text
Objetivo: que la documentación “diga la verdad” post-merge, sin inventar.
Si hay cambios: docs-only PR separado.

1) Verificar que existen artefactos de cierre QA:
ls -la docs/closure | rg -n "REVIEW_LOG_FASE1_FASE2_2026-02-08|INTEGRATION_LOG_FASE1_FASE2_2026-02-09|CI_FIX_EDGE_FUNCTIONS_SYNTAX_CHECK_2026-02-09"

2) Verificar referencias en estado actual:
rg -n "REVIEW_LOG_FASE1_FASE2_2026-02-08|FASE 1-2|PR #33|CI 100% verde" docs/ESTADO_ACTUAL.md

3) Normalizar pendientes: OPEN_ISSUES + Hoja de ruta (sin reescribir historia; solo reflejar realidad).
Abrir y revisar:
- docs/closure/OPEN_ISSUES.md
- docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md

Acción:
- Si algo figura “PENDIENTE” pero YA está hecho (WS3/WS4 allowlist/rate-limit/breaker), actualizar el estado y referenciar evidencia existente (paths + logs).
- No borrar contenido histórico, solo marcar RESUELTO con fecha y evidencia.

Si hay cambios:
git switch -c docs/sync-pendientes-20260209
editar archivos docs
git add <paths>
git commit -m "docs: sync pendientes post-merge"
git push -u origin HEAD
gh pr create --base main --head <tu-branch> --title "docs: sync pendientes post-merge" --body "Docs-only. Actualiza estados según evidencia en docs/closure."

PASS si:
- OPEN_ISSUES y Hoja de ruta reflejan el estado real, citando evidencias del repo.
- Log de turno incluye comandos + diff/resumen.
```

---

## PROMPT 3/5 — Supabase Operación: A4 (pg_cron/jobs) + Guardrail Deploy

```text
Objetivo: cerrar evidencia operativa de A4 y asegurar guardrails de deploy.

Parte A — Baseline remoto (sin secretos):
supabase migration list --linked
supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json | jq -r '.[] | "\(.name)\tv\(.version)\tverify_jwt=\(.verify_jwt)"' | sort

Si faltan migraciones en remoto:
- Aplicar SOLO lo pendiente con:
  supabase db push --linked --yes
- Re-ejecutar migration list y dejar evidencia en el log.

Parte B — A4: verificación pg_cron / jobs (usar Supabase Dashboard SQL Editor; NO imprimir DB URLs ni passwords).
Ejecutar y copiar resultados (resumen) al log:
1) Extensiones:
   select extname from pg_extension where extname in ('pg_cron','pg_net');
2) Jobs:
   select jobid, schedule, command, database, username, active from cron.job order by jobid;
3) RPC refresh:
   select n.nspname as schema, p.proname
   from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='fn_refresh_stock_views';

Interpretación:
- Si pg_cron existe pero NO hay job de refresh: documentar y proponer acción (NO ejecutar schedule sin confirmación del owner, salvo que esté explícito en roadmap).
- Si pg_cron NO existe: documentar que el refresh queda manual/alternativo, citando migración 20260208010000.

Parte C — Guardrail: api-minimarket NO verify_jwt.
Buscar scripts/workflows/documentación que despliegan:
rg -n "functions deploy api-minimarket|api-minimarket.*deploy|--no-verify-jwt|verify_jwt" -S .

Si falta guardrail:
- Preferir doc o script mínimo que obligue --no-verify-jwt para api-minimarket.
- PR separado (ops/docs).

PASS si:
- Estado remoto (migraciones + versions) documentado.
- A4 tiene evidencia SQL (o bloqueo real documentado).
- Guardrail de deploy para api-minimarket queda explícito.
```

---

## PROMPT 4/5 — Verificación Intensiva (tests + smoke) con evidencia

```text
Objetivo: revalidar que main está funcional. Registrar PASS/FAIL con evidencia.

Backend (raíz):
npm run test:unit
npm run test:integration
npm run test:e2e

Frontend:
pnpm -C minimarket-system lint
pnpm -C minimarket-system build
pnpm -C minimarket-system test:components

Seguridad (si hay script):
cat package.json | rg -n "test:security|security"
(ejecutar el comando real del repo; si no hay, documentar cómo se ejecuta tests/security)

Smoke remoto (read-only) SOLO si hay credenciales ya configuradas:
ls -la .env.test || true
node scripts/smoke-minimarket-features.mjs
Si no hay .env.test o faltan credenciales: documentar bloqueo real (sin inventar).

PASS si:
- Suites pasan (o bloqueos quedan documentados con causa real).
- Log contiene comando + resultado resumido por suite.
```

---

## PROMPT 5/5 — Ejecución “Next 20 tareas” (en PRs pequeños, sin mezclar)

```text
Objetivo: empezar a ejecutar el backlog post-merge en forma eficiente.
Regla: 1 PR por tema (minimo viable + tests + evidencia).

En cada tarea:
1) Crear branch: git switch -c <tipo>/<tema>-YYYYMMDD
2) Implementar cambio mínimo (sin romper verify_jwt=false en api-minimarket).
3) Ejecutar tests relevantes.
4) Actualizar docs/closure/EXECUTION_LOG_2026-02-09_NEXT_STEPS.md con comandos + resultados.
5) Commit claro + push + PR.

Orden recomendado (no bloqueado por credenciales):
P0
1) Correlación x-request-id end-to-end (frontend apiClient + UI error reporting) y evidencia.
2) Semántica api-proveedor /health (útil y consistente) + tests.
3) Tests de integración reales para /reservas (idempotencia + 409 + concurrencia) + evidencia.
4) Smoke E2E mínimo /reservas (si entorno lo permite) o bloqueo documentado.

P1
5) Baseline performance simple (script) + números p50/p95.
6) Plan de rotación de secretos (doc-only, sin valores) + checklist validación.
7) Verificación sender/dominio SendGrid (doc con evidencia o bloqueo).
8) Observabilidad UI: plan ejecutable para habilitar Sentry (sin DSN no “integrar a medias”).

P2
9) Actualizar docs/closure/BUILD_VERIFICATION.md con addendum (fecha, CI green, suites).
10) Revisar/actualizar docs/DECISION_LOG.md si hubo decisiones nuevas.

Definición de Done por PR:
- CI green.
- Evidencia en el log del turno.
- No se imprimieron secretos.
```

