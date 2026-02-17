# EVIDENCIA: Deploy Pre-Mortem Hardening D-126

**Fecha:** 2026-02-17
**Sesion:** Deploy continuacion de hardening D-126
**Commit base:** `af94363` (fix: pre-mortem hardening)
**Commit doc:** `3abb4f1` (docs: context prompt)

---

## 1. Migracion SQL

### Pre-requisito: stock negativo
```
supabase db push --linked --dry-run
→ Would push: 20260217100000_hardening_concurrency_fixes.sql
```

### Aplicacion
```
supabase db push --linked
→ Applying migration 20260217100000_hardening_concurrency_fixes.sql...
→ Finished supabase db push.
```
**Resultado:** PASS (sin errores de CHECK constraint → no habia stock negativo)

### Verificacion post-migracion
```
supabase migration list --linked
→ 42/42 migraciones sincronizadas (local = remoto)
→ Ultima: 20260217100000
```

---

## 2. Edge Functions Deploy

### Resultados individuales

| Funcion | Resultado | Version anterior | Version nueva |
|---------|-----------|-----------------|---------------|
| alertas-stock | Deployed | v16 | **v17** |
| notificaciones-tareas | Deployed | v18 | **v19** |
| reportes-automaticos | Deployed | v16 | **v17** |
| cron-notifications | Deployed | v24 | **v25** |
| scraper-maxiconsumo | Deployed | v19 | **v20** |

### Verificacion `supabase functions list`
```
alertas-stock         | ACTIVE | 17 | 2026-02-17 06:00:28
notificaciones-tareas | ACTIVE | 19 | 2026-02-17 06:00:44
reportes-automaticos  | ACTIVE | 17 | 2026-02-17 06:00:52
cron-notifications    | ACTIVE | 25 | 2026-02-17 06:01:08
scraper-maxiconsumo   | ACTIVE | 20 | 2026-02-17 06:01:26
```

### Snapshot completo de functions (13 activas)
```
reportes-automaticos  | ACTIVE | v17
reposicion-sugerida   | ACTIVE | v16
alertas-vencimientos  | ACTIVE | v16
api-minimarket        | ACTIVE | v26
api-proveedor         | ACTIVE | v18
cron-testing-suite    | ACTIVE | v17
scraper-maxiconsumo   | ACTIVE | v20
alertas-stock         | ACTIVE | v17
cron-dashboard        | ACTIVE | v16
cron-health-monitor   | ACTIVE | v16
cron-jobs-maxiconsumo | ACTIVE | v18
cron-notifications    | ACTIVE | v25
notificaciones-tareas | ACTIVE | v19
```

---

## 3. Smoke Tests

### Verificacion CLI
- `supabase migration list --linked` → 42/42 PASS
- `supabase functions list` → 13/13 ACTIVE, versiones correctas
- `supabase inspect db table-stats --linked` → DB remota responde OK

### Smoke tests de endpoints (pendientes de ejecucion manual)
Las siguientes pruebas requieren credenciales (`SERVICE_ROLE_KEY` / JWT) que no estan disponibles en el filesystem local (por diseno de seguridad):

- [ ] `POST /functions/v1/alertas-stock` con SERVICE_ROLE_KEY → debe responder 200
- [ ] `POST /functions/v1/reportes-automaticos` con SERVICE_ROLE_KEY → debe responder 200 con JSON
- [ ] `POST /functions/v1/api-minimarket/ventas` con JWT + Idempotency-Key → debe responder correctamente
- [ ] Doble-click POS (idempotency) → solo 1 venta creada
- [ ] ESC con carrito lleno → confirmacion antes de descartar
- [ ] Barcode scan rapido repetido → no duplica item
- [ ] 401 forzado → intenta refresh antes de signOut
- [ ] Checkbox `preparado` en pedido → toggle optimistico con rollback

**Nota:** Estos smoke tests deben ejecutarse desde el frontend (navegador) o con `RUN_REAL_TESTS=true` cuando se tengan las credenciales configuradas.

---

## 4. Resumen de cambios desplegados

### SQL (1 migracion)
- `CHECK (cantidad_actual >= 0)` en `stock_deposito`
- `sp_procesar_venta_pos` hardened: FOR UPDATE/SHARE idempotency, precios, credito + EXCEPTION WHEN unique_violation

### Edge Functions (5 funciones)
- `alertas-stock` — N+1 eliminado (300 seq → 2 parallel + batch INSERT)
- `notificaciones-tareas` — N+1 eliminado (batch check + batch INSERT)
- `reportes-automaticos` — 5 seq → `Promise.allSettled()` parallel
- `cron-notifications` — AbortSignal.timeout en 7 fetch calls
- `scraper-maxiconsumo` — MAX_CATEGORIES_PER_RUN=4

### Shared infra (incluido en deploys)
- `_shared/circuit-breaker.ts` — AbortSignal.timeout(3s) + TTL re-check 5min
- `_shared/rate-limit.ts` — Mismo patron

### Frontend (pendiente de deploy de plataforma)
- `Pos.tsx` — ESC guard, scanner race lock, smart retry (solo 5xx)
- `AuthContext.tsx` — 401 refresh-before-signOut con lock
- `errorMessageUtils.ts` — ApiError.message passthrough
- `usePedidos.ts` — Optimistic updates con rollback

---

## 5. Estado post-deploy

| Metrica | Valor |
|---------|-------|
| Migraciones local/remoto | 42/42 |
| Edge Functions activas | 13 |
| Tests (pre-deploy) | 1165/1165 PASS |
| Build frontend (pre-deploy) | CLEAN |
| Score operativo | 92/100 |

---

## 6. Pendientes post-deploy

| Prioridad | Accion |
|-----------|--------|
| P0 | Ejecutar smoke tests de endpoints con credenciales reales |
| P0 | Deploy frontend a plataforma (Vercel/Netlify) — build ya generado |
| P1 | Configurar `SUPABASE_DB_URL` para backup automatizado (Gate 15) |
| P2 | Revocar API key anterior de SendGrid |
| P2 | Ejecutar smoke real de seguridad periodico (`RUN_REAL_TESTS=true`) |
