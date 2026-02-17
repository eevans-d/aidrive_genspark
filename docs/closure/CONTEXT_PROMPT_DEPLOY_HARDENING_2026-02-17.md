# CONTEXT PROMPT: Deploy Pre-Mortem Hardening + Continuidad

> **Para:** Nueva ventana de Claude Code
> **Fecha:** 2026-02-17
> **Commit base:** `af94363` (branch `main`, clean, pushed)
> **Sesion anterior:** Pre-Mortem Hardening D-126 (17 fixes criticos implementados, auditados, testeados)

---

## INSTRUCCION PRINCIPAL

Sos el agente continuador de una sesion de hardening pre-produccion. Todo el codigo ya esta commiteado y pusheado. Tu trabajo es:

1. **Deployar** la migracion SQL + 5 edge functions al entorno remoto
2. **Verificar** que el deploy fue exitoso
3. **Ejecutar** smoke tests post-deploy
4. **Documentar** evidencia del deploy
5. **Actualizar** documentacion de continuidad

---

## ESTADO ACTUAL DEL PROYECTO

- **Proyecto:** Mini Market System (React/Vite/TS + Supabase Edge Functions/Deno + PostgreSQL)
- **Ref Supabase:** `dqaygmjpzoqjjrywdsxi`
- **Branch:** `main` (clean, up to date with remote)
- **Score operativo:** 92/100
- **Tests:** 1165/1165 PASS (58 archivos) | Coverage: 89.20% stmts / 80.91% branch
- **Build frontend:** CLEAN
- **Edge Functions activas:** 13
- **Migraciones local:** 42 (41 aplicadas remotamente + 1 pendiente)

---

## TAREA 1: DEPLOY MIGRACION SQL (CRITICO)

### Pre-requisito obligatorio

```bash
# Conectar a la base y verificar que NO existan filas con stock negativo
# Si este query devuelve filas, la migracion FALLARA por el CHECK constraint
supabase db remote execute --linked <<'SQL'
SELECT producto_id, cantidad_actual FROM stock_deposito WHERE cantidad_actual < 0;
SQL
```

**Si devuelve filas:** Corregir manualmente antes de continuar:
```sql
UPDATE stock_deposito SET cantidad_actual = 0 WHERE cantidad_actual < 0;
```

### Aplicar migracion

```bash
supabase db push --linked
```

**Archivo:** `supabase/migrations/20260217100000_hardening_concurrency_fixes.sql`

**Contenido de la migracion:**
- `CHECK constraint stock_no_negativo` — `cantidad_actual >= 0` en `stock_deposito`
- `sp_procesar_venta_pos` reescrito con:
  - `FOR UPDATE` en idempotency check (previene TOCTOU)
  - `FOR SHARE` en productos (previene price drift entre loops)
  - `FOR UPDATE` en clientes (previene credit limit bypass concurrente)
  - `EXCEPTION WHEN unique_violation` handler (safety net para race condition)

### Verificacion post-migracion

```bash
supabase migration list --linked
# Debe mostrar 42/42 migraciones aplicadas (incluyendo 20260217100000)
```

---

## TAREA 2: DEPLOY EDGE FUNCTIONS (5 funciones)

```bash
supabase functions deploy alertas-stock
supabase functions deploy notificaciones-tareas
supabase functions deploy reportes-automaticos
supabase functions deploy cron-notifications
supabase functions deploy scraper-maxiconsumo
```

**Nota:** `api-minimarket` requiere `--no-verify-jwt` (D-056). Las 5 funciones de arriba NO necesitan ese flag.

### Verificacion post-deploy

```bash
supabase functions list
# Verificar que las 5 funciones tienen version incrementada
```

**Versiones esperadas (previas → nuevas):**

| Function | Version previa | Esperada |
|----------|---------------|----------|
| alertas-stock | v16 | v17 |
| notificaciones-tareas | v18 | v19 |
| reportes-automaticos | v16 | v17 |
| cron-notifications | v24 | v25 |
| scraper-maxiconsumo | v19 | v20 |

---

## TAREA 3: SMOKE TESTS POST-DEPLOY

### 3.1 Verificar que POS funciona (idempotency hardened)

```bash
# Desde el frontend (o curl): intentar crear una venta POS
# Verificar que el endpoint responde correctamente
curl -s -X POST "https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket/ventas" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: smoke-test-$(date +%s)" \
  -d '{"metodo_pago":"efectivo","items":[{"producto_id":"<ID>","cantidad":1}]}'
```

### 3.2 Verificar alertas-stock (N+1 fix)

```bash
curl -s -X POST "https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/alertas-stock" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "apikey: <SERVICE_ROLE_KEY>"
# Debe responder 200 con alertas (si hay stock bajo) o lista vacia
```

### 3.3 Verificar reportes-automaticos (parallelized)

```bash
curl -s -X POST "https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/reportes-automaticos" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "apikey: <SERVICE_ROLE_KEY>"
# Debe responder 200 con reporte JSON (stock, movimientos, tareas, precios, faltantes)
```

### 3.4 Test E2E manual (checklist)

- [ ] Venta POS con doble-click rapido (idempotency: solo 1 venta creada)
- [ ] ESC con carrito lleno (debe mostrar confirmacion "Descartar el ticket actual?")
- [ ] Barcode scan rapido repetido (no debe duplicar item por race)
- [ ] Forzar 401 (debe intentar refresh antes de cerrar sesion)
- [ ] Checkbox `preparado` en pedido (toggle instantaneo, rollback si falla)

---

## TAREA 4: DOCUMENTAR EVIDENCIA

Crear archivo de evidencia:

```bash
# Nombre sugerido:
docs/closure/EVIDENCIA_DEPLOY_HARDENING_2026-02-17.md
```

**Contenido minimo:**
- Resultado de `supabase migration list --linked` post-deploy
- Resultado de `supabase functions list` post-deploy
- Resultado de smoke tests (status codes, respuestas)
- Timestamp de deploy

---

## TAREA 5: ACTUALIZAR DOCUMENTACION

### 5.1 `docs/ESTADO_ACTUAL.md`

En el "Addendum Pre-Mortem Hardening", cambiar:
- "Migracion **pendiente de aplicar**" → "Migracion **aplicada** el YYYY-MM-DD"
- "Edge functions modificadas (**pendientes de deploy**)" → "Edge functions **desplegadas** el YYYY-MM-DD"
- Actualizar tabla de "Snapshot de Functions" con nuevas versiones

### 5.2 `docs/closure/CONTINUIDAD_SESIONES.md`

Registrar la sesion de deploy con:
- Fecha y hora
- Tareas completadas
- Evidencia generada

### 5.3 `docs/DECISION_LOG.md`

Si se tomo alguna decision adicional (ej: corregir stock negativo), registrarla como D-127+.

---

## CONTEXTO DE REFERENCIA RAPIDA

### Documentos clave

| Documento | Ruta |
|-----------|------|
| Estado actual | `docs/ESTADO_ACTUAL.md` |
| Decision log | `docs/DECISION_LOG.md` |
| Open issues | `docs/closure/OPEN_ISSUES.md` |
| Continuidad sesiones | `docs/closure/CONTINUIDAD_SESIONES.md` |
| Plan hardening | D-126 en `docs/DECISION_LOG.md` (plan original no persistido en filesystem) |
| Migracion SQL | `supabase/migrations/20260217100000_hardening_concurrency_fixes.sql` |
| Obra objetivo | `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/` |

### Commits recientes

```
af94363 fix: pre-mortem hardening — concurrency, timeouts, N+1, UX guards (D-126)
6079eb5 docs: production-reality verification of OBJETIVO_FINAL_PRODUCCION
d0a74a6 docs: audit report sync + OBJETIVO_FINAL_PRODUCCION reference doc
d8d829d fix: reportes-automaticos column mismatch + /ventas ACL gap + OpenAPI parse error
```

### Archivos modificados en D-126 (ya commiteados)

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/20260217100000_hardening_concurrency_fixes.sql` | NUEVO — CHECK + SP hardened |
| `supabase/functions/_shared/circuit-breaker.ts` | Timeout 3s + TTL re-check |
| `supabase/functions/_shared/rate-limit.ts` | Timeout 3s + TTL re-check |
| `supabase/functions/alertas-stock/index.ts` | N+1 eliminado |
| `supabase/functions/notificaciones-tareas/index.ts` | N+1 eliminado |
| `supabase/functions/reportes-automaticos/index.ts` | Promise.allSettled |
| `supabase/functions/cron-notifications/index.ts` | Timeouts en 7 fetches |
| `supabase/functions/scraper-maxiconsumo/scraping.ts` | MAX_CATEGORIES=4 |
| `minimarket-system/src/pages/Pos.tsx` | ESC guard + scanner lock + smart retry |
| `minimarket-system/src/contexts/AuthContext.tsx` | 401 refresh + dedup lock |
| `minimarket-system/src/components/errorMessageUtils.ts` | ApiError passthrough |
| `minimarket-system/src/hooks/queries/usePedidos.ts` | Optimistic updates |

### Pendientes owner (no bloqueantes para deploy)

1. (P1) Configurar `SUPABASE_DB_URL` para backup automatizado (Gate 15)
2. (P2) Revocar API key anterior en SendGrid
3. (P2) Smoke real periodico de seguridad (`RUN_REAL_TESTS=true`)

### Guardrails operativos

- No exponer secretos/JWTs en outputs
- No usar comandos destructivos de git
- `api-minimarket` debe mantenerse con `--no-verify-jwt` en redeploy
- Coverage minimo: 80%
- Branches permitidos para deploy: `main`, `staging`

---

## SI HAY ERRORES EN EL DEPLOY

### La migracion falla por stock negativo

```sql
-- Listar los productos afectados
SELECT sd.producto_id, p.nombre, sd.cantidad_actual, sd.ubicacion
FROM stock_deposito sd
JOIN productos p ON p.id = sd.producto_id
WHERE sd.cantidad_actual < 0;

-- Corregir a 0 y registrar en decision log
UPDATE stock_deposito SET cantidad_actual = 0 WHERE cantidad_actual < 0;

-- Reintentar migracion
supabase db push --linked
```

### Una edge function falla al deployar

```bash
# Verificar logs
supabase functions logs <nombre-funcion> --linked

# Si es error de sintaxis/import, verificar con:
deno check supabase/functions/<nombre>/index.ts
```

### El frontend necesita redeploy

```bash
cd minimarket-system
pnpm build
# Deploy segun plataforma (Vercel, Netlify, etc.)
```

---

> **Nota:** Este prompt fue generado automaticamente al cierre de la sesion de hardening D-126. El codigo esta 100% commiteado y testeado. Solo falta el deploy al entorno remoto.
