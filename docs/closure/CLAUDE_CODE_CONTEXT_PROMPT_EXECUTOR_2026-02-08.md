# Context Prompt (Claude Code) — Ejecutor de Hoja de Ruta 2026-02-08

Copiar y pegar este prompt en una nueva ventana de **Claude Code**.

---

## PROMPT

ACTUAS COMO AGENTE EJECUTOR (CLAUDE CODE) EN ESTE REPOSITORIO.

Repositorio (workspace real): `/home/eevan/ProyectosIA/aidrive_genspark`  
Branch base: `chore/closure-prep-20260202` (registrar commit exacto con `git log -1 --oneline`)  
Supabase project ref (remoto): `dqaygmjpzoqjjrywdsxi`

Fuentes de verdad (en orden):
1. `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md` (principal)
2. `docs/ESTADO_ACTUAL.md`
3. `docs/DECISION_LOG.md`
4. `docs/PLAN_EJECUCION_PREMORTEM.md`
5. `docs/PLANIFICACION_DEFINITIVA_MEJORAS_2026-02-07.md`

Objetivo: ejecutar la hoja de ruta **fase por fase** dejando el sistema listo para producción y cerrando gaps UX, sin reimplementar lo que ya existe.

No tomes decisiones nuevas si no es necesario. Si hay ambigüedad, elegí el camino más seguro, documentá el supuesto en el log y seguí.

### Reglas no negociables
1. Registro auditable: crear un log y escribirlo mientras trabajás.
2. No comandos destructivos: prohibido `git reset --hard`, `git checkout -- <archivo>`, “limpiar” working tree sin aprobación.
3. No exponer secretos: nunca imprimir valores de `.env*` ni de Supabase Secrets. En logs: redactar.
4. Docker puede NO estar disponible: evitá comandos que dependan de Docker (`supabase status`, `supabase db dump`, `supabase start`). Usar `supabase db push --linked` y `supabase functions deploy --use-api`.
5. Mantener `api-minimarket` con `verify_jwt=false` hasta cerrar WS4. Si redeploy: usar `supabase functions deploy api-minimarket --no-verify-jwt --use-api`.

### Protocolo de ejecución (OBLIGATORIO)
0. Crear log:
- Archivo: `docs/closure/EXECUTION_LOG_2026-02-08_ROADMAP.md`
- Estructura mínima: Baseline, luego secciones por fase (Fase 0, Fase 1, etc) con checklist, comandos y resultados.

1. Baseline (pegar output en el log):
```bash
cd /home/eevan/ProyectosIA/aidrive_genspark
git status --porcelain=v1
git log -1 --oneline
supabase migration list --linked
supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json
supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi --output json
```

2. Branch de trabajo (recomendado):
```bash
git switch -c feat/roadmap-exec-20260208
```

3. Cada fase cierra con:
- tests obligatorios (ver “Comandos de verificación”)
- actualización mínima docs (estado/decisiones/OpenAPI si aplica)
- commit + push
- resumen final de la fase en el log (qué cambió + evidencia)

### Comandos de verificación (OBLIGATORIOS)
Backend (raíz):
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:contracts
npm run test:security
```

Frontend:
```bash
pnpm -C minimarket-system lint
pnpm -C minimarket-system build
pnpm -C minimarket-system test:components
```

### Orden de ejecución (seguir `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`)

#### Fase 0 — Preflight y baseline
Checklist:
- Crear el log.
- Baseline completo (comandos arriba).
- Confirmar que el repo compila y tests pasan ANTES de cambios (ejecutar comandos de verificación).
- Si algo falla, corregir primero y dejar evidencia.

#### Fase 1 — Hardening P0
Objetivo: A3 y A1.

Tarea A3 (Auth resiliente):
- Archivo principal: `supabase/functions/api-minimarket/helpers/auth.ts`
- Implementar cache por token (TTL 30–60s) + negative cache (401).
- Agregar timeout (AbortController).
- Agregar breaker dedicado a `/auth/v1/user`.
- Tests unitarios para cache/timeout/breaker (agregar archivo(s) en `tests/unit/`).
- Redeploy `api-minimarket` con `--no-verify-jwt --use-api`.

Tarea A1 (Rate limit compartido):
- Crear migración sugerida: `supabase/migrations/20260208020000_add_rate_limit_state.sql`
- Requisitos DB:
  - Tabla `rate_limit_state`
  - RPC `sp_check_rate_limit(...)` atómica
  - Permisos: `REVOKE ALL` + `GRANT EXECUTE` solo a `service_role`
- Código:
  - `supabase/functions/_shared/rate-limit.ts` debe soportar RPC cuando existe y fallback si 404.
  - `supabase/functions/api-minimarket/index.ts` debe usar key `user:{uid}:ip:{ip}` cuando user exista; si no, fallback `ip:{ip}` (opcional: token hash si token existe pero user no).
  - La RPC se llama con headers de `service_role` (no JWT usuario).
- Deploy:
  - `supabase db push --linked --yes`
  - redeploy `api-minimarket` (mantener `--no-verify-jwt`)
- Tests: unit tests para headers `RateLimit-*` + `Retry-After` + fallback RPC missing.

Cerrar Fase 1:
- Ejecutar comandos de verificación.
- Actualizar `docs/ESTADO_ACTUAL.md` y `docs/DECISION_LOG.md` si hubo decisión nueva.
- Commit + push.

#### Fase 2 — Hardening P1
Objetivo: A2, A4, A5.

Tarea A2 (Breaker semi-persistente):
- Crear migración sugerida: `supabase/migrations/20260208030000_add_circuit_breaker_state.sql`
- Permisos: ejecutar RPC solo con `service_role`.
- Integración: persistir solo breaker crítico `api-minimarket-db`.
- Tests: transiciones + TTL reset.

Tarea A4 (Cron/MVs):
- Verificar en SQL Editor si existe `pg_cron` y el job `refresh_stock_views`.
- Si falta schedule y `pg_cron` existe: agregar schedule.
- Documentar evidencia en `docs/CHECKLIST_PREFLIGHT_PREMORTEM.md`.

Tarea A5 (api-proveedor allowlist orígenes internos):
- Archivo: `supabase/functions/api-proveedor/utils/auth.ts` (hay TODO).
- Agregar allowlist real + tests.
- Deploy `api-proveedor` si cambia: `supabase functions deploy api-proveedor --use-api`.

Cerrar Fase 2:
- Tests obligatorios + docs + commit + push + evidencia en log.

#### Fase 3 — UX P1 (flujos faltantes)
Objetivo: B1, B2, B3, B4 (sin reescritura).

B1 Alta producto:
- UI: `minimarket-system/src/pages/Productos.tsx` (CTA + modal).
- API: extender `minimarket-system/src/lib/apiClient.ts` con `productosApi.create(...)`.
- Roles: no mostrar CTA a rol `ventas` (solo `admin`/`deposito`).
- Tests componentes.

B2 Cambio precio:
- UI: acción “Actualizar precio”.
- Admin: usar `preciosApi.aplicar`.
- Depósito: solo si permitido; si se implementa, agregar `productosApi.update(...)` usando `PUT /productos/:id`.
- Tests componentes.

B3 Ajuste stock:
- UI: `minimarket-system/src/pages/Deposito.tsx` agregar tipo “Ajuste” usando endpoint existente `/deposito/movimiento`.
- Tests componentes.

B4 Acciones desde alertas:
- UI: `minimarket-system/src/components/AlertsDrawer.tsx` agregar CTA “Crear tarea reposición” para stock bajo/crítico.
- Integrar con `tareasApi.create`.
- Tests componentes del drawer.

Cerrar Fase 3:
- Tests obligatorios + docs + commit + push + evidencia en log.

#### Fase 4 — Release readiness
Objetivo: C2, C1, C3.

C2 Smokes read-only:
- Crear script `scripts/smoke-minimarket-features.mjs` que valide endpoints (sin mutaciones) y registre output.
- Registrar evidencia en `docs/ESTADO_ACTUAL.md`.

C1 Observabilidad frontend:
- Completar `minimarket-system/src/lib/observability.ts` (Sentry o equivalente) sin romper builds.
- Documentar variables requeridas.

C3 Rotación secretos:
- Seguir `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md`.
- No rotar sin dejar runbook y evidencia; si el entorno es producción real, coordinar ventana.

Cerrar Fase 4:
- Tests obligatorios + docs + commit + push + evidencia en log.

### Entregables finales esperados
1. Log completo: `docs/closure/EXECUTION_LOG_2026-02-08_ROADMAP.md`
2. Commits por fase (o por módulo) con mensajes claros.
3. Evidencia de tests (salidas resumidas en el log) y estado Supabase (migraciones/funciones).

## FIN DEL PROMPT
