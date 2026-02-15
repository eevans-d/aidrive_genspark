> [DEPRECADO: 2026-02-13] Documento historico/referencial. No usar como fuente primaria. Fuente vigente: `docs/ESTADO_ACTUAL.md`, `docs/closure/MEGA_PLAN_2026-02-13_042956.md`, `docs/closure/OPEN_ISSUES.md`.

# Hoja de Ruta Actualizada (post-plan) — Mini Market System

**Fecha:** 2026-02-08  
**Baseline verificado:** branch `chore/closure-prep-20260202` (registrar el commit exacto con `git log -1 --oneline`; la implementación de Fases 0–6 + alineación remoto + refresh MVs quedó en `6584a1b`).  
**Fuentes de verdad:** `docs/ESTADO_ACTUAL.md`, `docs/DECISION_LOG.md`, `docs/PLANIFICACION_DEFINITIVA_MEJORAS_2026-02-07.md`, `docs/closure/EXECUTION_LOG_2026-02-07.md`, `docs/PLAN_EJECUCION_PREMORTEM.md`.

## 0) Objetivo
Dejar el sistema **estable para producción** y cerrar los **gaps funcionales de UX** detectados, sin reimplementar lo existente.

En particular:
1. Endurecer operación (rate limit/circuit breaker compartidos + auth resiliente + cron/refresh MVs verificable).
2. Completar flujos UX faltantes (alta de producto, ajuste stock, cambio de precio, acciones desde alertas).
3. Consolidar observabilidad y checklist de release.

## 1) Reglas operativas (obligatorias para agentes ejecutores)
1. Log auditable: crear `docs/closure/EXECUTION_LOG_YYYY-MM-DD_<scope>.md` y mantenerlo actualizado (qué se hizo, comandos, resultados, evidencias y archivos tocados).
2. Baseline antes de tocar nada: ejecutar y pegar en el log `git status --porcelain=v1`, `git log -1 --oneline`, `supabase migration list --linked`, `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json` y `supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi --output json` (solo nombres).
3. Prohibido: `git reset --hard`, `git checkout -- <file>`, “limpiar” working tree sin aprobación explícita.
4. Cierre por módulo/fase: ejecutar tests (sección 4), actualizar docs mínimas (estado/decisiones/OpenAPI si aplica) y registrar evidencia en el log.

## 1.1) Convenciones (para evitar confusiones)
- Migraciones: `supabase/migrations/YYYYMMDDHHMMSS_<desc>.sql` (timestamp incremental, sin espacios).
- Deploy DB remoto: usar `supabase db push --linked` (no requiere Docker). Evitar `supabase status` / `supabase db dump` si Docker no está disponible.
- Deploy Edge Functions remoto: usar `supabase functions deploy <fn> --use-api`.
- `api-minimarket` debe permanecer con `verify_jwt=false` hasta que se cierre WS4 (ver `docs/DECISION_LOG.md` D-056). Si se redeployea, usar `--no-verify-jwt`.
- Commits: 1 commit por fase o por módulo (mensaje claro + evidencias en el log).

## 2) Estado actual (resumen)
Implementado y verificado (local + remoto):
- Fases 0–6 del plan `docs/PLANIFICACION_DEFINITIVA_MEJORAS_2026-02-07.md`.
- DB remoto alineado + Edge Functions desplegadas (ver `docs/ESTADO_ACTUAL.md`).
- Refresh operativo de MVs de stock: RPC `public.fn_refresh_stock_views()` disponible (migración `20260208010000_*`).

Resuelto post-plan (PR #33, merge 2026-02-09):
- ~~WS3: rate limit y circuit breaker **compartidos**~~ → RESUELTO. Migraciones `20260208020000`/`20260208030000` + code `_shared/rate-limit.ts`/`circuit-breaker.ts` con RPC + fallback in-memory.
- ~~WS4: auth resiliente~~ → RESUELTO. Cache 30s (SHA-256 key) + negative-cache 10s + AbortController 5s + breaker dedicado en `helpers/auth.ts`.
- ~~Hardening extra `api-proveedor`~~ → RESUELTO (code + tests). Allowlist en `api-proveedor/utils/auth.ts`, tests en `tests/unit/api-proveedor-auth.test.ts`. Docs (`SECURITY.md`/`API_README.md`) pendientes.
- ~~UX gaps: alta producto / ajuste / cambio precio~~ → RESUELTO. `Productos.tsx` (crear + precio), `Deposito.tsx` (ajuste), `AlertsDrawer.tsx` (CTA reposicion).
- ~~Observabilidad frontend~~ → RESUELTO (implementacion real con localStorage + stub Sentry). `minimarket-system/src/lib/observability.ts`.

Pendientes (no bloqueantes, recomendados pre-produccion):
- A4: verificacion operativa de `pg_cron` / schedule de refresh MVs (RPC existe, schedule pendiente).
- A5 docs: documentar allowlist en `docs/SECURITY.md` y `docs/API_README.md`.
- C3: rotacion de secretos pre-produccion.
- D1: lotes reales / FEFO (solo si el negocio lo requiere).

## 3) Roadmap por módulos (con checklist)

### MODULO A (P0/P1) — Producción: Resiliencia, Seguridad y Operación

#### A1) Rate limit compartido (api-minimarket)
**Problema actual:** `FixedWindowRateLimiter` vive en memoria; en Edge Functions hay múltiples instancias, por lo que el límite no es consistente.

**Checklist** *(COMPLETADO — PR #33, merge 2026-02-09)*
- [x] Crear migración `supabase/migrations/20260208020000_add_rate_limit_state.sql` con: tabla `rate_limit_state` + RPC atómico `sp_check_rate_limit(...)` + permisos correctos. *(commit 926513e)*
- [x] Actualizar `supabase/functions/_shared/rate-limit.ts` para usar la RPC si existe; fallback in-memory solo si la RPC responde 404. *(commit 926513e)*
- [x] Actualizar `supabase/functions/api-minimarket/index.ts` para construir key `user:{uid}:ip:{ip}`. *(commit 926513e)*
- [x] En `api-minimarket`, llamar la RPC con headers de `service_role`. *(commit 926513e)*
- [x] Agregar tests unitarios: `tests/unit/rate-limit-shared.test.ts`. *(commit 926513e)*
- [x] Deploy DB: `supabase db push --linked`. *(migración 20260208020000 en remoto, confirmado 2026-02-09)*
- [x] Deploy Edge: `api-minimarket` v20, `verify_jwt=false`. *(confirmado baseline 2026-02-09)*
- [x] Docs: `docs/DECISION_LOG.md` D-063 + `docs/ESTADO_ACTUAL.md` actualizados. *(PR #33)*

**Done**
- Límite consistente cross-instancia (mismo usuario no puede “bypassear” con reintentos/distribución).
- Respuestas 429 incluyen headers `RateLimit-*` y `Retry-After`.

#### A2) Circuit breaker compartido (api-minimarket) o “semi-persistente”
**Problema actual:** breaker es in-memory; si se reinicia una instancia, el breaker se resetea.

**Opción recomendada (mínimo viable, sin sobrediseño):**
- Persistir solo el breaker “crítico” (DB/PostgREST) en Supabase tabla para evitar tormentas.

**Checklist** *(COMPLETADO — PR #33, merge 2026-02-09)*
- [x] Crear migración `supabase/migrations/20260208030000_add_circuit_breaker_state.sql` con: tabla `circuit_breaker_state` + RPCs `sp_circuit_breaker_record` / `sp_circuit_breaker_check` + TTL + permisos. *(commit 926513e)*
- [x] Actualizar `supabase/functions/_shared/circuit-breaker.ts` para persistir breaker critico via RPC; fallback in-memory si no existe. *(commit 926513e, refinado en 3fbccf4)*
- [x] En `api-minimarket`, llamar la RPC con headers de `service_role`. *(commit 926513e)*
- [x] Agregar tests unitarios: `tests/unit/circuit-breaker-shared.test.ts` (transiciones closed->open->half_open->closed + RPC/fallback). *(commit 926513e)*
- [x] Deploy DB: `supabase db push --linked`. *(migración 20260208030000 en remoto, confirmado 2026-02-09)*
- [x] Deploy Edge: `api-minimarket` v20, `verify_jwt=false`. *(confirmado baseline 2026-02-09)*
- [x] Docs: `docs/DECISION_LOG.md` D-063 + `docs/ESTADO_ACTUAL.md` actualizados. *(PR #33)*

**Done**
- Si DB falla repetidamente, el breaker se mantiene abierto aunque cambie la instancia.

#### A3) Auth resiliente (cache + timeout + breaker dedicado)
**Problema actual:** `api-minimarket` valida token llamando `/auth/v1/user` en cada request.

**Checklist** *(COMPLETADO — PR #33, merge 2026-02-09)*
- [x] Implementar cache en memoria por token (TTL 30s) en `supabase/functions/api-minimarket/helpers/auth.ts` usando key hash SHA-256 + negative-cache de 401 (10s). *(commit 926513e)*
- [x] Agregar timeout a `fetchUserInfo()` (AbortController 5s) y error tipificado cuando vence. *(commit 926513e)*
- [x] Agregar breaker dedicado a `/auth/v1/user` para fail-fast (threshold 3, timeout 15s). *(commit 926513e)*
- [x] Tests unitarios: cache hit/miss, negative-cache, timeout, breaker open. *(incluidos en tests PR #33)*
- [x] Deploy Edge: `api-minimarket` v20, `verify_jwt=false`. *(confirmado baseline 2026-02-09)*
- [x] Docs: `docs/ESTADO_ACTUAL.md` actualizado con evidencia. *(PR #33)*

**Done**
- En una sesión normal, se reduce drásticamente el número de llamadas a `/auth/v1/user`.
- En caída parcial de Auth, el sistema responde fail-fast con error consistente.

#### A4) Cron jobs y refresh de MVs (verificación operativa)
**Checklist** *(VERIFICADO 2026-02-09 via Supabase Management API)*
- [x] Confirmar en SQL Editor si existen `pg_cron` y `pg_net`. **Resultado: NO instalados.** Extensiones disponibles: `pg_graphql`, `pg_stat_statements`, `pgcrypto`, `plpgsql`, `supabase_vault`, `uuid-ossp`. *(query: `select extname from pg_extension`)*
- [N/A] Si `pg_cron` existe: no aplica (pg_cron no instalado).
- [x] Si `pg_cron` NO existe: documentar operacion manual via RPC. **RPC `public.fn_refresh_stock_views()` EXISTE** (confirmado via `pg_proc`). Refresh queda manual: invocar via `service_role` o sincronizar con operaciones (ver migracion `20260208010000`).
- [x] Documentar evidencia en `docs/CHECKLIST_PREFLIGHT_PREMORTEM.md` (seccion "Registro A4: pg_cron y MVs refresh").

**Done**
- `mv_stock_bajo` y `mv_productos_proximos_vencer` se refrescan periódicamente (o se documenta alternativa).

#### A5) Hardening `api-proveedor` (orígenes internos)
**Checklist** *(code + tests COMPLETADO — PR #33; docs pendientes)*
- [x] Implementar allowlist real de origenes internos en `supabase/functions/api-proveedor/utils/auth.ts`. *(commit 926513e: DEFAULT_INTERNAL_ORIGINS + env INTERNAL_ORIGINS_ALLOWLIST + timing-safe comparison)*
- [x] Agregar tests (unit) para origenes permitidos/denegados. *(`tests/unit/api-proveedor-auth.test.ts`, seccion `validateInternalOrigin (A5 allowlist)`)*
- [ ] Documentar en `docs/SECURITY.md` y `docs/API_README.md`. *(pendiente)*

---

### MODULO B (P1) — Completar Flujos UX (sin rehacer arquitectura)

#### B1) Alta de producto (UI)
**Backend ya existe:** `POST /productos` (admin/deposito).

**Checklist** *(COMPLETADO — PR #33, commit dc57704)*
- [x] `minimarket-system/src/pages/Productos.tsx`: CTA "Nuevo producto". *(boton linea ~161, modal lineas ~410-496)*
- [x] Modal/form minimo con campos: `nombre` (requerido), `sku`, `codigo_barras`, `marca`, `contenido_neto`. *(commit dc57704)*
- [x] Extender `minimarket-system/src/lib/apiClient.ts` agregando `productosApi.create(...)`. *(commit dc57704)*
- [x] Mutacion via gateway y revalidacion de listados (React Query). *(commit dc57704)*
- [x] Tests de componentes: render modal + submit OK + error. *(incluidos en 101 component tests, CI green)*

**Done**
- Alta de producto completa desde UI (sin usar SQL Editor).

#### B2) Cambio de precio (UI + action)
**Backend ya existe:**
- `POST /precios/aplicar` (admin) para aplicar precio con redondeo,
- `PUT /productos/:id` (admin/deposito) para actualizar `precio_actual/precio_costo/margen_ganancia`.

**Checklist** *(COMPLETADO — PR #33, commit dc57704)*
- [x] En `Productos.tsx`: accion "Actualizar precio" (boton con icono DollarSign, modal dedicado). *(commit dc57704)*
- [x] Definir UX: Admin usa `preciosApi.aplicar()` para costo+recalculo con margen. *(commit dc57704)*
- [x] Extender `productosApi.update(...)` / `preciosApi.aplicar(...)` en apiClient. *(commit dc57704)*
- [x] Tests de componentes. *(incluidos en 101 component tests, CI green)*

**Done**
- Se puede actualizar precio desde UI con feedback inmediato y rollback si falla.

#### B3) Ajuste de stock (UI)
**Backend ya soporta:** `POST /deposito/movimiento` con `tipo_movimiento='ajuste'`.

**Checklist** *(COMPLETADO — PR #33, commit dc57704)*
- [x] `minimarket-system/src/pages/Deposito.tsx`: agregar tipo "Ajuste" (boton con icono RefreshCw). *(commit dc57704)*
- [x] Campos: producto, cantidad, motivo obligatorio, observaciones opcional. *(commit dc57704)*
- [x] Semantica: `cantidad` es positiva; tipo `ajuste` enviado a `depositoApi.movimiento()`. *(commit dc57704)*
- [x] Tests de componentes: ajuste OK + validaciones. *(incluidos en 101 component tests, CI green)*

**Done**
- Un encargado puede registrar ajustes sin “hackear” entradas/salidas.

#### B4) Acciones desde alertas (quick wins)
**Checklist** *(COMPLETADO — PR #33, commit dc57704)*
- [x] `AlertsDrawer`: CTA "Crear tarea reposicion" para stock bajo/critico. *(`AlertsDrawer.tsx` linea ~405: `tareasApi.create(...)` con titulo reposicion)*
- [x] CTA "Aplicar oferta" ya existe; verificado con `showOfertaCta` + `preciosApi.aplicar()`. *(commit dc57704)*

---

### MODULO C (P1/P2) — Observabilidad y Release Readiness

#### C1) Observabilidad frontend (Sentry o equivalente)
**Checklist** *(COMPLETADO — PR #33, commit f909478)*
- [x] Completar `minimarket-system/src/lib/observability.ts` (implementacion real con localStorage + stub Sentry). *(commit f909478)*
- [x] Capturar errores con contexto: `x-request-id`, userId (anonimizado via hash), ruta, build version. *(commit f909478)*
- [x] Documentar variables (`VITE_SENTRY_DSN`) y politica de PII (anonymized userId, no tokens/passwords). *(inline en observability.ts)*

#### C2) Smoke tests reales (remoto) para features nuevas
**Checklist** *(COMPLETADO — PR #33, commit f909478)*
- [x] Agregar script `scripts/smoke-minimarket-features.mjs` (read-only) que valide: `/search`, `/insights/arbitraje`, `/clientes`, `/cuentas-corrientes/resumen`, `/ofertas/sugeridas`, `/bitacora`. *(commit f909478)*
- [x] Registrar evidencia en `docs/ESTADO_ACTUAL.md`. *(ESTADO_ACTUAL seccion 2026-02-08: smoke remoto 200 OK)*

#### C3) Rotación de secretos pre-producción
**Checklist**
- [ ] Seguir `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md`.
- [ ] Rotar: `API_PROVEEDOR_SECRET`, SendGrid API key, y revisar estrategia para `SUPABASE_*` (según alcance).
- [ ] Confirmar `SMTP_FROM` es sender verificado real.

---

### MODULO D (P2) — Evolución del modelo (solo si el negocio lo requiere)

#### D1) Lotes reales / FEFO
**Contexto actual:** `stock_deposito` tiene índice único `(producto_id, ubicacion)`; no hay múltiples lotes reales por producto/ubicación.

**Checklist (si se decide)**
- [ ] Diseñar esquema “stock por lote” (nueva tabla + migración expand/contract).
- [ ] Ajustar POS para cobrar por lote/FEFO.
- [ ] Tests + plan de migración de datos.

## 4) Checklist de cierre por módulo (siempre)
- [ ] `npm run test:unit`
- [ ] `npm run test:integration`
- [ ] `npm run test:e2e`
- [ ] `npm run test:contracts`
- [ ] `npm run test:security`
- [ ] `pnpm -C minimarket-system lint`
- [ ] `pnpm -C minimarket-system build`
- [ ] `pnpm -C minimarket-system test:components`
- [ ] Actualizar `docs/ESTADO_ACTUAL.md` (fecha + cambios + evidencia).
- [ ] Actualizar `docs/DECISION_LOG.md` (si hubo decisión nueva).
- [ ] Actualizar `docs/api-openapi-3.1.yaml` y `docs/API_README.md` (si cambia API).
- [ ] Actualizar `docs/closure/EXECUTION_LOG_*.md` (registro auditable).

## 5) Mega planificación (secuencial, recomendada)
1. ~~Fase 0 (preflight y baseline)~~: COMPLETADO (baseline en `docs/closure/EXECUTION_LOG_2026-02-08_ROADMAP.md`).
2. ~~Fase 1 (hardening P0): A3 (auth resiliente) y A1 (rate limit compartido)~~: COMPLETADO (PR #33).
3. ~~Fase 2 (hardening P1): A2 (breaker semi-persistente), A5 (hardening api-proveedor)~~: COMPLETADO (PR #33). A4 (pg_cron) pendiente verificacion.
4. ~~Fase 3 (UX P1): B1, B2, B3, B4~~: COMPLETADO (PR #33, commit dc57704).
5. ~~Fase 4 (release readiness): C2 (smokes), C1 (observabilidad)~~: COMPLETADO (PR #33, commit f909478). C3 (rotacion secretos) pendiente.
6. Fase 5 (opcional): MODULO D (modelo) solo si se confirma necesidad real (lotes/FEFO).

Regla: no empezar la fase siguiente si no cerró checklist de verificación (sección 4) y no quedó evidencia en el log.
