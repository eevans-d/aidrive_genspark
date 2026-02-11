# EVIDENCIA SP-D — Optimización

> Fecha: 2026-02-11
> Commit: `3b1a8b0`
> Ejecutor: Antigravity (Gemini)

---

## D2 — CÓDIGO MUERTO

| Artefacto | Tipo | Líneas/Archivos | Acción | Justificación | Evidencia |
|-----------|------|-----------------|--------|---------------|-----------|
| `api-minimarket/routers/` | Ghost code | 6 archivos, ~1,023 loc | **ELIMINAR** | Directorio NUNCA importado por index.ts. Dead code deployado. | `rg 'routers/' supabase/functions/api-minimarket/index.ts` → 0 results |
| `alertas-vencimientos` | Edge Function huérfana | 1 archivo, 206 loc | **CONECTAR** | Implementada completamente. Solo falta cron job con auth header. | Sin trigger en deploy_all_cron_jobs.sql |
| `reposicion-sugerida` | Edge Function huérfana | 1 archivo, 237 loc | **CONECTAR** | Implementada completamente. Integrar en Dashboard o crear cron. | Sin trigger. Frontend usa views/insightsApi en su lugar. |
| `cron-notifications` | Edge Function simulación | 1 archivo, 1,282 loc | **INVESTIGAR** | Solo llamada por testing-suite. `NOTIFICATIONS_MODE` default='simulation'. | cron-notifications/index.ts L26 |
| `cron-dashboard` | Edge Function huérfana | 1 archivo, 1,283 loc | **DOCUMENTAR** | Sin frontend. Admin/devOps solo. | Sin cron schedule ni página frontend |
| `cron-health-monitor` | Edge Function huérfana | 1 archivo, 959 loc | **CONECTAR** | Potencialmente útil si se crea cron. Actualmente solo llamada por testing-suite. | Sin trigger productivo |
| `cron-testing-suite` | Edge Function dev-only | 1 archivo, 1,424 loc | **DOCUMENTAR** | Suite QA manual. No productiva. | Sin cron. Arnés de testing. |
| `import_map.json` | Archivo redundante | 5 loc | **ELIMINAR** | Duplica imports de deno.json. | Contenido idéntico a `deno.json` imports |
| `tests/unit/components/` | Directorio vacío | 0 | **ELIMINAR** | Carpeta creada sin contenido. | `ls` devuelve vacío |
| Endpoints sin caller (~20) | Gateway endpoints | ~800 loc est. | **DOCUMENTAR** | Patrón dual-path: frontend lee de PostgREST directo; endpoints gateway disponibles para futuras integraciones. | Cruce apiClient.ts (~28 endpoints) vs gateway (~46 endpoints) |
| Legacy tests (3 suites) | Tests no en CI | 1,072 loc | **ACTIVAR** | Ya migrados a Vitest pero CI solo ejecuta `tests/unit/`. Incluir en pipeline. | tests/performance/, tests/security/, tests/api-contracts/ |
| Tests en `src/pages/` | Tests mal ubicados | 3 archivos, 254 loc | **MOVER** | Dashboard.test.tsx, Login.test.tsx, Tareas.optimistic.test.tsx mal ubicados en src/. | src/pages/*.test.tsx |
| `docs/closure/` | Históricos | 42 archivos | **ARCHIVAR** | Sesiones pasadas. No productivos. Mover a branch o subdirectorio marcado. | `find docs/closure -type f | wc -l` |
| `VITE_USE_MOCKS` | Flag dev | En apiClient + supabase.ts | **EVALUAR** | Solo afecta tareasApi. Evaluar eliminar para producción. | apiClient.ts L9; supabase.ts L7-8 |

### Total código muerto/huérfano

| Categoría | Líneas estimadas |
|-----------|-----------------|
| Edge Functions NO-PROD (6) | ~5,390 |
| Ghost code routers/ | ~1,023 |
| Endpoints sin caller | ~800 est. |
| Legacy tests no en CI | 1,072 |
| Tests mal ubicados | 254 |
| Archivos redundantes | ~5 |
| **TOTAL** | **~8,544** |

---

## D3 — SEGURIDAD

| Vector | Riesgo | Estado actual | Mitigación | Acción requerida | Evidencia |
|--------|--------|--------------|------------|-----------------|-----------|
| **Auth verify_jwt=false (api-minimarket)** | ALTO | Validación JWT manual en `auth.ts` (344 lín) con cache SHA-256 (30s pos/10s neg) + circuit breaker (3 fallos → 15s open) + timeout 5s | Cache reduce latencia. requireRole() valida `app_metadata.rol`. | **Riesgo cache:** token revocado válido hasta 30s. **Riesgo breaker:** si se abre, verificar si gateway acepta requests sin auth. | auth.ts helpers; deploy.sh sin `--no-verify-jwt` |
| **deploy.sh 2 bugs** | **CRÍTICO** | No filtra `_shared/` (intentará deploy → fallo con set -e). No tiene `--no-verify-jwt` para api-minimarket. | **Ninguna** — deploy.sh actual destruye el sistema si se usa. | Fix urgente pre-producción: excluir `_shared/` y agregar `--no-verify-jwt`. | deploy.sh L307-321 |
| **RLS cobertura** | MEDIO | Migración RLS v2: deny-by-default + `has_personal_role()` en 10 tablas P0. | 10 tablas P0 cubiertas. Tables nuevas (pedidos, clientes, ventas, ofertas, bitácora) cubiertas por `20260211100000_audit_rls_new_tables.sql`. | **Verificado:** Policies aplicadas para authenticated users. | migración RLS v2; AUDITORIA_RLS_CHECKLIST.md |
| **CORS producción** | MEDIO | `_shared/cors.ts` (128 lín): fallback a localhost solo si `ALLOWED_ORIGINS` está vacío. | `ALLOWED_ORIGINS` configurado y validado con curl/script (origin permitido 200, no permitido 403/null). | Mantener dominios permitidos alineados a entorno real de despliegue. | cors.ts; api-minimarket/index.ts L158; scripts/verify-cors.sh |
| **Rate limiting real** | MEDIO | `rate-limit.ts` (273 lín): **RPC-backed** con `sp_check_rate_limit` + fallback in-memory. | **Mejor que lo esperado:** intenta usar RPC cross-instance. Si RPC no existe (404), cae a in-memory. | Verificar que SP `sp_check_rate_limit` existe en producción (migración 20260208020000). Si no existe → rate limit es solo in-memory. | rate-limit.ts L126-193: `checkRateLimitShared()` |
| **Secrets en código** | BAJO | `.gitignore` excluye `.env*` (L783: `**/.env*` con excepciones para `.env.example`). Grep `eyJ\|sk_\|SG.` en codebase: **0 hardcoded secrets** encontrados. | `.gitignore` robusto (948 lín). Sin secrets hardcodeados. | PASS. Sin acción requerida. | .gitignore L783-786; grep clean |
| **3 cron jobs sin auth (HC-1)** | **CRÍTICO** | `alertas-stock_invoke`, `notificaciones-tareas_invoke`, `reportes-automaticos_invoke`: SIN Authorization header en cron SQL. Funciones con verify_jwt=true (Supabase default). | **Ninguna** — probablemente 401 silencioso. | Agregar `Authorization: Bearer {service_role_key}` al cron SQL como en `daily_price_update`. | deploy_all_cron_jobs.sql |
| **Input validation** | MEDIO | `validation.ts` (130 lín) valida inputs en handlers. Frontend valida antes de enviar. | Validación en ambas capas. | Verificar cobertura de SQLi/XSS en inputs de texto libre. Validación de UUIDs parece ausente en algún handler. | validation.ts |
| **SUPABASE_SERVICE_ROLE_KEY en frontend** | BAJO | Grep en minimarket-system/src/: **NO encontrado**. Frontend solo usa `VITE_SUPABASE_ANON_KEY`. | Separación correcta: anon key en frontend, service role en Edge Functions. | PASS. | grep en src/ |

### Resumen D3

| Severidad | Vectores |
|-----------|---------|
| CRÍTICO | 2 (deploy.sh bugs, 3 cron sin auth) |
| ALTO | 1 (auth cache 30s) |
| MEDIO | 4 (RLS, CORS, rate-limit, validation) |
| BAJO | 2 (secrets, service_role_key) |

---

## D1 — PERFORMANCE REAL

| Aspecto | Estado actual | Riesgo | Impacto 6 meses | Acción | Evidencia |
|---------|--------------|--------|-----------------|--------|-----------|
| **Cold start api-minimarket** | index.ts = 2,184 lín. Importa 22 módulos (~5,539 lín total). Todo se importa al inicio (no lazy). | MEDIO | Cold start probablemente ~2-5s en Free plan. Cada invocación tras inactividad penaliza. | Considerar code splitting o lazy loading de handlers. | api-minimarket/index.ts imports |
| **SELECT * en hooks** | 3 hooks usan `select('*')`: useAlertas (4 queries), useDashboardStats (1 query → `select('*').limit(100)` filtra client-side), useDeposito (1 query). | MEDIO | Con ~500-2000 productos y crecimiento, queries ineficientes. | Especificar columnas necesarias en cada `.select()`. | hooks/useAlertas.ts L66,82,98,113; useDashboardStats.ts L27; useDeposito.ts L46 |
| **Paginación** | Sin evidencia de paginación en hooks principales que manejan listados. `useDashboardStats` usa `limit(100)`. | MEDIO | Listas de productos/stock crecen sin límite en UI. Degradación en mobile. | Implementar paginación con `useInfiniteQuery` o paginación server-side. | hooks/ sin .range() visible |
| **Índices** | Migraciones crean índices para stock, productos, precios. `cron_jobs_execution_log` con `created_at` index (migración de índices existe). | BAJO | Índices existentes adecuados para volumen actual. | Verificar en producción con `EXPLAIN ANALYZE` tras datos reales. | migraciones de índices |
| **Vistas materializadas** | MVs creadas (migración 20260206235900). Refresh via RPC (migración 20260208010000). pg_cron NO instalado → refresh manual. | MEDIO | Datos obsoletos si no se ejecuta refresh periódicamente. | Habilitar pg_cron o implementar refresh en el cron-jobs-maxiconsumo orquestador. | migraciones MVs |
| **Frontend bundle** | React lazy loading de 13 páginas ✅. Build exitoso 9.90s con 27 entradas PWA precache. | BAJO | Bundle splitting funciona. Tamaño aceptable. | Monitorear tamaño con cada release. | Build log: 27 precache entries |
| **TanStack Query** | `queryClient` configurado globalmente. Sin evidencia de `staleTime` excesivo ni refetch innecesarios. | BAJO | Comportamiento default aceptable para MVP. | Ajustar `staleTime` por tipo de datos tras mediciones reales. | lib/queryClient.ts |

---

## D4 — OPTIMIZACIÓN UX FINAL

| Fix UX | Página(s) | Severidad | Esfuerzo | Dependencias | Evidencia |
|--------|----------|-----------|----------|-------------|-----------|
| **Fix bug Pedidos.tsx mutaciones** | Pedidos | 🔴 **P0** | 30min | Ninguna | L50,59,68: `console.error` → cambiar a `toast.error` |
| **Agregar ErrorMessage a 6 páginas** | Deposito, Pedidos, Pos, Pocket, Clientes, Login | 🔴 **P0** | 2-3h | Componente existe (116 lín) | 6 páginas sin manejo de error estandarizado |
| **Fix deploy.sh (2 bugs)** | deploy.sh | 🔴 **P0** | 30min | Ninguna | Filtrar _shared + --no-verify-jwt |
| **Interceptor 401 global** | apiClient.ts / AuthContext | 🔴 **P0** | 1h | Ninguna | Sesión expirada no redirige a login |
| **Fix formato moneda Pedidos.tsx** | Pedidos | 🟡 P1 | 15min | Ninguna | `.toLocaleString()` sin locale → agregar `'es-AR'` |
| **Agregar Skeleton a 8 páginas** | Deposito, Kardex, Rentabilidad, Proveedores, Pos, Pocket, Clientes, Login | 🟡 P1 | 3-4h | Componentes existen | 8 páginas sin loading profesional |
| **Verificar formato moneda en Productos, Rentabilidad, Proveedores, Stock** | Múltiples | 🟡 P1 | 1h | Ninguna | Usan `.toFixed()` sin separador de miles |
| **ErrorBoundaries granulares** | App.tsx | 🟡 P1 | 2h | Ninguna | Solo boundary global en main.tsx |
| **Estados vacíos (primer uso)** | Todas | 🟡 P1 | 2h | Ninguna | Sin empty states definidos |
| **3 cron jobs sin auth → fix SQL** | deploy_all_cron_jobs.sql | 🔴 **P0** | 30min | Acceso SQL Editor | Agregar Bearer token |
| **maintenance_cleanup cron** | deploy_all_cron_jobs.sql | 🟡 P1 | 15min | maintenance.ts ya existe | Agregar job al SQL de cron |

---

## Addendum: Fixes P0 aplicados (2026-02-11, Claude Code Opus 4)

### D3 — Seguridad: actualización

| Vector | Riesgo anterior | Estado tras fix | Evidencia |
|--------|----------------|----------------|-----------|
| deploy.sh 2 bugs | **CRÍTICO** | ✅ **RESUELTO** | `_shared/` excluido, `api-minimarket` con `--no-verify-jwt`. Dry-run verificado: 13 funciones target, _shared skip. |
| 3 cron jobs sin auth (HC-1) | **CRÍTICO** | ✅ **APLICADO EN REMOTO** (2026-02-11) | Migraciones `20260211055140` + `20260211062617` aplicadas. Auth vía Vault (`vault.decrypted_secrets`) verificada en runtime. |

### D4 — UX: actualización

| Fix | Estado anterior | Estado tras fix | Evidencia |
|-----|----------------|----------------|-----------|
| Pedidos.tsx mutaciones | 🔴 P0 | ✅ RESUELTO | 3 `toast.error()` agregados (L52, L62, L72). Build PASS. |
| deploy.sh bugs | 🔴 P0 | ✅ RESUELTO | Filtro `_shared` + `--no-verify-jwt` para `api-minimarket`. |
| Interceptor 401 global | 🔴 P0 | ✅ RESUELTO | `authEvents.ts` + `apiClient.ts` emit + `AuthContext.tsx` listener → signOut en 401. |
| 3 cron jobs auth | 🔴 P0 | ✅ **APLICADO EN REMOTO** | Migración `20260211055140` aplicada (2026-02-11). |
| maintenance_cleanup cron | 🟡 P1 | ✅ RESUELTO (aplicado en remoto) | Job 8 activo: Domingos 04:00, retención 30 días. |

### Resumen D3 actualizado

| Severidad | Vectores (antes) | Vectores (después) |
|-----------|-----------------|-------------------|
| CRÍTICO | 2 (deploy.sh, cron auth) | 0 |
| ALTO | 1 (auth cache 30s) | 1 (auth cache 30s — sin cambio) |
| MEDIO | 4 (RLS, CORS, rate-limit, validation) | 4 (sin cambio) |
| BAJO | 2 (secrets, service_role_key) | 2 (sin cambio) |
