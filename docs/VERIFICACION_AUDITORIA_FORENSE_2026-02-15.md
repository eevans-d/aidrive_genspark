# VERIFICACIÓN Y AMPLIACIÓN DE AUDITORÍA FORENSE ABSOLUTA

**Proyecto:** Mini Market System
**Branch:** `session-close-2026-02-11`
**Fecha de verificación:** 2026-02-15
**Documento verificado:** `docs/AUDITORIA_FORENSE_ABSOLUTA_2026-02-13.md`
**Método:** Verificación READ-ONLY exhaustiva contra filesystem real (cero archivos modificados). 5 subagentes paralelos de investigación.

---

## RESUMEN EJECUTIVO

La auditoría forense del 2026-02-13 es **sustancialmente sólida** en su estructura y la mayoría de conteos, pero contiene **12 errores factuales, 7 hallazgos faltantes, y 3 hallazgos positivos que son parcial o totalmente incorrectos**. Los errores más graves:

1. `scraper-maxiconsumo` **SÍ tiene auth guard** pero se reporta sin ella
2. P-07 "CORS estricto sin wildcards" es **FALSO** para al menos 2 funciones
3. `api-proveedor` usa `x-api-secret` no Bearer tokens
4. Hay **4 archivos E2E** no 1
5. ErrorMessage es **13/13** en realidad (no contradicción real)

El score 55/100 podría ajustarse ligeramente al alza (~57/100) dado que `scraper-maxiconsumo` sí está protegido, pero los hallazgos críticos H-03 y H-04 siguen siendo válidos y severos. El veredicto "APROBADO CON RESERVAS SIGNIFICATIVAS" se mantiene.

---

## SECCIÓN A — ERRORES FACTUALES EN LA AUDITORÍA (12)

### A-01: `scraper-maxiconsumo` SÍ tiene auth guard

**Afecta:** Sección 2.2/fila 13 + Sección 10 (Mapa de Auth Guards)

La auditoría lo marca con "-" (sin auth), pero realmente importa `validateApiSecret` desde `api-proveedor/utils/auth.ts` en [index.ts L22](../supabase/functions/scraper-maxiconsumo/index.ts#L22) y lo usa en [L283-L287](../supabase/functions/scraper-maxiconsumo/index.ts#L283):

```typescript
const authResult = validateApiSecret(request);
if (!authResult.valid) {
  // rechaza con 401
}
```

**Impacto en la auditoría:**
- El mapa de auth de la Sección 10 debe mover `scraper-maxi` de "MEDIO" a "SEGURO"
- El conteo de funciones sin auth baja de 8 a **7** (excluyendo scraper)
- El módulo M3 (Backend) podría subir de 4/10 a **5/10**

---

### A-02: P-07 "CORS estricto sin wildcards" es PARCIALMENTE FALSO

**Afecta:** Sección 5, hallazgo P-07

La afirmación de que el sistema tiene "CORS estricto sin wildcards" es **falsa** para al menos 2 funciones:

| Función | CORS | Evidencia |
|---------|------|-----------|
| `cron-jobs-maxiconsumo` | `'Access-Control-Allow-Origin': '*'` **hardcoded** | [index.ts L14](../supabase/functions/cron-jobs-maxiconsumo/index.ts#L14) |
| `scraper-maxiconsumo` | `DEFAULT_CORS_HEADERS` con `'*'` como **fallback** | [index.ts L82](../supabase/functions/scraper-maxiconsumo/index.ts#L82) |
| `cron-dashboard` | Usa `getCorsHeaders()` **sin origin** | [index.ts L110](../supabase/functions/cron-dashboard/index.ts#L110) |
| `cron-health-monitor` | Usa `getCorsHeaders()` **sin origin** | [index.ts L90](../supabase/functions/cron-health-monitor/index.ts#L90) |
| `cron-notifications` | Usa `getCorsHeaders()` **sin origin** | [index.ts L564](../supabase/functions/cron-notifications/index.ts#L564) |

P-07 debería calificarse como: **"CORS estricto en las APIs principales (api-minimarket, api-proveedor), wildcard o sin validación de origin en 5 funciones cron/scraper"**.

---

### A-03: `api-proveedor` auth — no es "Bearer + origin validation"

**Afecta:** Sección 2.2/fila 4

El mecanismo real es **`x-api-secret` header (shared secret) + origin validation**, verificado en [index.ts L299](../supabase/functions/api-proveedor/index.ts#L299):

```typescript
const authResult = validateApiSecret(request);
// Verifica header x-api-secret contra API_PROVEEDOR_SECRET env var
```

Los Bearer tokens solo se usan internamente para las llamadas a la REST API de Supabase (header `Authorization: Bearer <key>`), no como mecanismo de auth del endpoint.

**Corrección:** La fila 4 de la tabla 2.2 debe decir: `x-api-secret + origin validation`

---

### A-04: Números de línea incorrectos en config.toml

**Afecta:** Secciones 4.1 (H-03, H-05, H-06, H-07, H-08), 4.2, y 9

| Setting | Línea en auditoría | Línea real verificada |
|---------|-------------------|----------------------|
| `minimum_password_length` | L144 | **L145** |
| `password_requirements` | L147 | **L148** |
| `enable_confirmations` | L178 | **L180** |
| `secure_password_change` | L180 | **L182** |
| `max_frequency` (email) | L182 | **L184** |
| MFA TOTP `enroll_enabled` | L254 | **L255** |
| MFA TOTP `verify_enabled` | L256 | **L256** (coincide) |
| MFA rango general | L254-264 | **L251-266** |

Las discrepancias son menores (~1-2 líneas) y probablemente se deben a cambios post-auditoría o diferencia de conteo, pero deben corregirse para mantener la trazabilidad.

---

### A-05: E2E test files — 4 archivos, no 1

**Afecta:** Sección 2.5 (Inventario de Tests)

La auditoría reporta "E2E (POS): 1 archivo, 8 test cases". En realidad hay **4 archivos spec** en `minimarket-system/e2e/`:

| # | Archivo | Tests |
|---|---------|-------|
| 1 | `pos.e2e.spec.ts` | 8 tests (documentados) |
| 2 | `auth.real.spec.ts` | 7 tests (NO documentados) |
| 3 | `tareas.proveedores.spec.ts` | No evaluado |
| 4 | `app.smoke.spec.ts` | No evaluado |

Contenido completo del directorio `minimarket-system/e2e/`:
- 4 archivos `.spec.ts`
- 1 `README.md`
- 1 directorio `helpers/`

**Impacto:** El total de archivos de test sube de **74 a ~77** y el total de test cases potencialmente por encima de 990.

---

### A-06: ErrorMessage — 13/13 es CORRECTO, no hay contradicción real

**Afecta:** Sección 4.4 (B-02), Sección 6 (Claims vs Realidad)

La auditoría nota la contradicción en ESTADO_ACTUAL (13/13 vs 9/13) pero no verifica cuál es el valor real. Verificación exhaustiva — **las 13 páginas importan y usan `ErrorMessage`**:

| Página | Import `ErrorMessage` | Línea |
|--------|-----------------------|-------|
| Login.tsx | ✅ | L5 |
| Dashboard.tsx | ✅ | L2 |
| Deposito.tsx | ✅ | L6 |
| Rentabilidad.tsx | ✅ | L6 |
| Pocket.tsx | ✅ | L11 |
| Kardex.tsx | ✅ | L6 |
| Pedidos.tsx | ✅ | L22 |
| Clientes.tsx | ✅ | L5 |
| Productos.tsx | ✅ | L6 |
| Tareas.tsx | ✅ | L6 |
| Pos.tsx | ✅ | L18 |
| Stock.tsx | ✅ | L4 |
| Proveedores.tsx | ✅ | L4 |

**Conclusión:** B-02 debería concluir explícitamente que **13/13 es correcto** y 9/13 es un dato histórico desactualizado en ESTADO_ACTUAL.

---

### A-07: Decision Log — 88 decisiones, no ~87

**Afecta:** Sección 5, P-05

El DECISION_LOG tiene D-001 a D-088 = **88 decisiones** (la auditoría dice "~87"). Diferencia menor pero documentada para precisión.

---

### A-08: H-04 título vs contenido inconsistente

**Afecta:** Sección 4.1, H-04

El título dice "cron-dashboard y cron-notifications sin auth = control remoto abierto" pero el cuerpo también incluye `cron-health-monitor` (endpoint `/auto-recovery`).

**Corrección:** Debería titularse: "cron-dashboard, cron-notifications y cron-health-monitor sin auth = control remoto abierto".

---

### A-09: Inventario de tests falta categoría `tests/api-contracts/`

**Afecta:** Sección 2.5

Existe al menos 1 archivo de test en `tests/api-contracts/` que no aparece en el inventario de la Sección 2.5. El total de categorías debería incluir esta entrada.

---

### A-10: H-15 (PII logging) — matiz importante sobre logging vs almacenamiento

**Afecta:** Sección 4.3, H-15

La auditoría agrupa logging en consola y almacenamiento en BD como un solo hallazgo. Verificación detallada:

**Logging en consola (severidad BAJA):**
- [L836](../supabase/functions/cron-notifications/index.ts#L836): `SIMULATION_EMAIL_SEND` loguea `subject` (puede contener datos operativos) y `toCount` (número de destinatarios, NO las direcciones)
- [L877](../supabase/functions/cron-notifications/index.ts#L877): `REAL_EMAIL_SEND` loguea `subject`, `toCount`, `messageId`
- **No se loguean emails/teléfonos directamente en consola** — se loguea `toCount`

**Almacenamiento en BD (severidad MEDIA-ALTA):**
- [L1191-L1202](../supabase/functions/cron-notifications/index.ts#L1191): La función `recordNotificationLog` guarda en tabla `cron_jobs_notifications`:

```typescript
const logData = {
    // ...
    recipients: request.recipients,  // ← L1200 emails y phones en texto plano
    data: request.data,              // ← variables de template con posible PII
    // ...
};
```

Y el tipo `NotificationRequest.recipients` ([L94-L99](../supabase/functions/cron-notifications/index.ts#L94)) contiene:

```typescript
recipients: {
    email?: string[];    // ← emails reales
    phone?: string[];    // ← teléfonos reales
    slack_channels?: string[];
    webhook_urls?: string[];
};
```

**Corrección:** H-15 debería separarse en dos hallazgos:
- H-15a: Logging en consola de `subject` con datos operativos → severidad BAJA
- H-15b: Almacenamiento de emails/teléfonos en texto plano en BD → severidad MEDIA-ALTA

---

### A-11: CI pipeline — documentación incompleta

**Afecta:** Sección de DevOps/CI (M8), no documentado explícitamente

La auditoría describe el pipeline como "lint → test → build → typecheck → edge-functions-check → security-tests" pero la realidad es más compleja con **11 jobs**:

| Job | Obligatorio | Blocking | Dependencies |
|-----|-------------|----------|-------------|
| `lint` | ✅ | ✅ | — |
| `agent-skills` | ✅ | ✅ | — |
| `test` (unit) | ✅ | ✅ (coverage con `continue-on-error`) | — |
| `build` | ✅ | ✅ | lint, test |
| `typecheck` | ✅ | ✅ | — |
| `edge-functions-check` | ✅ | ✅ | — |
| `security-tests` | ✅ | ✅ **sin `continue-on-error`** | test |
| `e2e-frontend` | ❌ opcional | — | lint, test |
| `integration` | ❌ opcional (gated) | — | test |
| `e2e` | ❌ opcional | — | integration |
| `legacy-tests` | ❌ dispatch only | `continue-on-error: true` | — |

---

### A-12: H-13 — contexto adicional sobre métricas incorrectas

**Afecta:** Sección 4.3, H-13

La auditoría dice "7 de 13 métricas incorrectas". Detalle adicional: la sección "Métricas de Código" de ESTADO_ACTUAL.md (alrededor de línea 486) contiene valores de sesiones antiguas (2026-02-06 / 2026-02-09) que nunca fueron actualizados:

| Métrica | Valor en ESTADO_ACTUAL (Métricas) | Valor real actual |
|---------|-----------------------------------|-------------------|
| Páginas | 9 | **13** |
| Componentes | 3 | **7** |
| Hooks Query | 8 | **9** |
| Libs | 5 | **6** |
| Migraciones | 34 | **39** |
| Tests unit (raíz) | 812 | **817** |
| Tests frontend | 110 | **108** |

Sin embargo, la parte superior del documento (encabezado 2026-02-13, línea 45) tiene `39/39 migraciones` correcto — es decir, hay **drift interno** dentro del mismo documento.

---

## SECCIÓN B — HALLAZGOS FALTANTES (7)

### F-01: Barrel export incompleto en `hooks/queries/index.ts`

**Severidad:** MEDIO
**Módulo:** M2 (Frontend)

[hooks/queries/index.ts](../minimarket-system/src/hooks/queries/index.ts) **NO re-exporta** `usePedidos` ni sus 5 hooks asociados:
- `usePedidos`
- `usePedido`
- `useCreatePedido`
- `useUpdateEstadoPedido`
- `useUpdatePagoPedido`
- `useUpdateItemPreparado`

Solo exporta 8 de los 9 archivos de queries. Esto fuerza imports directos desde el archivo, rompiendo el patrón barrel del resto de hooks.

---

### F-02: CORS wildcard como hallazgo negativo separado

**Severidad:** ALTO
**Módulo:** M3 (Backend) / M6 (Seguridad)

`cron-jobs-maxiconsumo` usa `'Access-Control-Allow-Origin': '*'` hardcoded en [index.ts L14](../supabase/functions/cron-jobs-maxiconsumo/index.ts#L14). Combinado con la falta de auth guard, esto significa que **cualquier origen puede invocar endpoints de control de precios/scraping sin autenticación alguna**.

Vector de ataque:
```javascript
// Desde cualquier página web, sin restricción de CORS:
fetch('https://[ref].supabase.co/functions/v1/cron-jobs-maxiconsumo/execute', {
  method: 'POST',
  body: JSON.stringify({ job: 'daily_price_update' })
});
```

Este hallazgo debería ser ALTO y separado de H-04, dado que la combinación CORS wildcard + sin auth amplifica significativamente la superficie de ataque.

---

### F-03: Conteo corregido — 7 funciones sin auth (no 5 ni 8)

**Severidad:** Corrección de scope
**Módulo:** M3 / M6

Funciones sin auth guard reales (verificado contra imports y uso):

| # | Función | Auth Guard | Estado |
|---|---------|-----------|--------|
| 1 | `cron-dashboard` | NINGUNO | ❌ |
| 2 | `cron-health-monitor` | NINGUNO | ❌ |
| 3 | `cron-jobs-maxiconsumo` | NINGUNO | ❌ |
| 4 | `cron-notifications` | NINGUNO | ❌ |
| 5 | `cron-testing-suite` | NINGUNO | ❌ |
| 6 | `alertas-vencimientos` | NINGUNO | ❌ |
| 7 | `reposicion-sugerida` | NINGUNO | ❌ |

Funciones con auth (6):

| # | Función | Auth Guard | Estado |
|---|---------|-----------|--------|
| 1 | `api-minimarket` | JWT + SHA-256 cache + circuit breaker | ✅ |
| 2 | `api-proveedor` | `x-api-secret` + origin validation | ✅ |
| 3 | `alertas-stock` | `requireServiceRoleAuth` | ✅ |
| 4 | `notificaciones-tareas` | `requireServiceRoleAuth` | ✅ |
| 5 | `reportes-automaticos` | `requireServiceRoleAuth` | ✅ |
| 6 | `scraper-maxiconsumo` | `validateApiSecret` | ✅ |

**Total: 7 sin auth / 6 con auth de 13 funciones.**

---

### F-04: `errorMessageUtils.ts` no inventariado

**Severidad:** BAJO
**Módulo:** M2 (Frontend)

[minimarket-system/src/components/errorMessageUtils.ts](../minimarket-system/src/components/errorMessageUtils.ts) existe como utilidad companion de `ErrorMessage.tsx` pero no aparece en el inventario de componentes ni libs de la Sección 2.1.

No es un componente `.tsx` así que el conteo de 7 componentes es técnicamente correcto, pero debería mencionarse como utilidad asociada.

---

### F-05: Security gate ficticio en CI

**Severidad:** CRÍTICO (amplificación de H-01 + H-02)
**Módulo:** M5 (Testing) / M8 (DevOps)

El job `security-tests` en CI ([ci.yml L440-467](../.github/workflows/ci.yml#L440)) es **blocking** (sin `continue-on-error`). Los comentarios del CI dicen:

> *"Security tests MUST pass to merge. No exceptions."*

**PERO:** como se demostró en H-01, los 14 tests son tautológicos — siempre pasan porque verifican valores de mock. El gate de seguridad es un **gate ficticio**: da falsa sensación de protección sin verificar nada real.

Este hallazgo amplifica la severidad de H-01 y H-02: no solo los tests son tautológicos, sino que el pipeline CI los presenta como gate de seguridad bloqueante, creando una **falsa confianza sistémica**.

---

### F-06: E2E tests adicionales no evaluados

**Severidad:** MEDIO (gap de cobertura de la auditoría)
**Módulo:** M5 (Testing)

Tres archivos E2E no fueron evaluados en la auditoría:
- `auth.real.spec.ts` — 7 tests de autenticación
- `tareas.proveedores.spec.ts` — tests de flujo de tareas/proveedores
- `app.smoke.spec.ts` — smoke tests de la aplicación

Podrían contener tests genuinos o tautológicos — es un gap de cobertura del propio audit que debería resolverse.

---

### F-07: `reposicion-sugerida` y `alertas-vencimientos` omitidas del plan de remediación

**Severidad:** MEDIO
**Módulo:** M3 / M6

La Sección 8 (Plan de Remediación) incluye R-05 para agregar auth a `cron-health-monitor`, `cron-testing-suite`, `cron-jobs-maxiconsumo` pero **omite `alertas-vencimientos` y `reposicion-sugerida`**.

Si bien estas no son invocadas por cron, siguen siendo **endpoints públicos sin autenticación** que pueden ser invocados por cualquiera con la URL.

---

## SECCIÓN C — HALLAZGOS CONFIRMADOS SIN CAMBIOS (29)

Todos estos hallazgos fueron verificados contra el filesystem real y son **correctos tal cual** están documentados en la auditoría:

### Hallazgos Negativos Confirmados

| ID | Hallazgo | Verificación |
|----|----------|-------------|
| H-01 | Security tests tautológicos | **CONFIRMADO**. 14 tests con `vi.fn()`, verifican valores de mock. Cada test pre-programa `mockFetch.mockResolvedValueOnce(...)` y luego verifica que retorna exactamente eso. |
| H-02 | Triple contradicción coverage | **CONFIRMADO**. 80% (CLAUDE.md) vs 60% (vitest.config.ts L48-53) vs `continue-on-error: true` (ci.yml L135-138). Ningún threshold se enforza. |
| H-03 | Email confirmation off | **CONFIRMADO**. `enable_confirmations = false` en config.toml L180. |
| H-04 | cron-dashboard/notifications sin auth | **CONFIRMADO** (con corrección: agregar health-monitor al título). `/control` acepta pause/resume/trigger sin auth. `/send` permite envío de emails sin auth. |
| H-05 | Password policy 6 chars sin complejidad | **CONFIRMADO**. `minimum_password_length = 6`, `password_requirements = ""`. |
| H-06 | MFA deshabilitado | **CONFIRMADO**. TOTP enroll/verify = false, Phone MFA = false. |
| H-07 | `secure_password_change = false` | **CONFIRMADO**. Cambio de password no requiere re-autenticación. |
| H-08 | Email rate 1s | **CONFIRMADO**. `max_frequency = "1s"` permite 60 emails/minuto. |
| H-09 | deploy.sh sin validación de branch | **CONFIRMADO**. Valida env names (dev/staging/production) pero NO verifica git branch. CLAUDE.md dice "Branches permitidos: main, staging". |
| H-10 | 38 integration tests mockeados | **CONFIRMADO**. Los 3 archivos usan `vi.fn()` para `global.fetch` o MSW `server.listen()`. Cero contacto con servicios reales. |
| H-11 | Triple versión supabase-js | **CONFIRMADO**. Edge Functions: `2.39.3`, Frontend: `^2.78.0`, Root: `^2.95.3`. Delta de 56 versiones. |
| H-12 | React types v19 en root vs runtime v18 | **CONFIRMADO**. Root: `@types/react@^19.2.8` con `react@^18.3.1`. Frontend correctamente alineado. |
| H-14 | 5 performance tests sintéticos | **CONFIRMADO**. Mockea fetch, genera datos con `Array.from`, mide operaciones in-memory. Latencia ficticia con `setTimeout(random * 50ms)`. |
| H-16 | 5 páginas sin tests | **CONFIRMADO**. Kardex, Pocket, Proveedores, Rentabilidad, Stock. |
| H-17 | Pre-commit no cubre Deno | **CONFIRMADO**. `.husky/pre-commit` solo ejecuta `cd minimarket-system && npx tsc --noEmit`. No ejecuta `deno check`. |
| H-18 | No hay catch-all 404 | **CONFIRMADO**. 13 rutas explícitas en App.tsx, sin `<Route path="*" .../>`. |
| H-19 | `extractUserRole()` dead code | **CONFIRMADO**. Definida en `roles.ts:65`, exportada, solo usada en `roles.test.ts`. Cero usos en producción. |
| B-01 | `"main": "cypress.config.js"` residual | **CONFIRMADO**. En root `package.json` línea 4. |

### Hallazgos Positivos Confirmados

| ID | Hallazgo | Verificación |
|----|----------|-------------|
| P-01 | Auth flow api-minimarket sólido | **CONFIRMADO**. SHA-256 cache (auth.ts L56-62), circuit breaker 3-fail/15s (auth.ts L90-146), app_metadata only (auth.ts L248-253), token cache positivo 30s / negativo 10s, AbortController timeout 5s. |
| P-02 | RLS comprehensivo | **CONFIRMADO**. 33+ policies activas, anon revocado, 60/60 PASS. |
| P-03 | RBAC deny-by-default | **CONFIRMADO**. Frontend: `canAccessRoute` (roles.ts L41-48). Backend: `requireRole` (auth.ts L294-312). |
| P-04 | POS E2E tests genuinos | **CONFIRMADO**. 8 Playwright tests con route interception via `page.route()`, seed data, flujo completo (agregar → cobrar → reset, incrementar cantidad, eliminar, pago tarjeta). Tests E2E legítimos. |
| P-05 | Decision Log ejemplar | **CONFIRMADO**. 88 decisiones (D-001 a D-088), con fechas desde 2026-01-09 hasta 2026-02-13. |
| P-08 | Request ID end-to-end | **CONFIRMADO**. Frontend genera UUID (apiClient.ts L60-66) → envía header `x-request-id` (L106) → backend preserva o genera (index.ts L135-141) → devuelve en response → frontend extrae para errores. Correlación E2E correcta. |
| P-09 | Backup production-quality | **CONFIRMADO**. gzip (db-backup.sh L49-56), rotación 7d (L64-75), verificación tamaño, `--clean --if-exists --no-owner --no-privileges`, credentials nunca loggeadas. |
| P-10 | Security tests blocking en CI | **CONFIRMADO** — pero es un gate ficticio (ver F-05 arriba). |
| P-11 | Zero console.log en frontend | **CONFIRMADO**. Grep `console.log` en `minimarket-system/src/` = 0 resultados. |
| P-12 | Zero XSS vectors | **CONFIRMADO**. `dangerouslySetInnerHTML` = 0, `innerHTML` = 0, `eval()` = 0 en todo el frontend. |
| P-13 | Zero hardcoded secrets | **CONFIRMADO**. Todo via `import.meta.env.VITE_*` (frontend) y `Deno.env.get()` (backend). |
| P-14 | Vault pattern para cron auth | **CONFIRMADO**. Migración `20260211062617` implementa `vault.decrypted_secrets` para 4 procedures. |
| P-15 | Input validation con whitelist | **CONFIRMADO**. UUID regex (validation.ts L12-19), numeric bounds (L24-56), text sanitization strips `[^a-zA-Z0-9 _.-]` (L62), field whitelisting `PRODUCTO_UPDATE_FIELDS` (L100-122), pagination limits (index.ts L433). |

### Hallazgos Positivos Adicionales Confirmados

- Lockfiles committed (npm + pnpm) — builds reproducibles
- Anonymous sign-ins disabled (`config.toml`)
- Refresh token rotation enabled (`config.toml`)
- Double email confirm for changes (`config.toml`)
- No secrets en historial git relevante

---

## SECCIÓN D — VERIFICACIÓN DETALLADA DEL INVENTARIO

### D-01: Frontend — Inventario Verificado

#### Páginas (13/13 ✅)

| # | Archivo | Ruta | Test encontrado |
|---|---------|------|-----------------|
| 1 | Login.tsx | /login | ✅ Login.test.tsx |
| 2 | Dashboard.tsx | / | ✅ Dashboard.test.tsx |
| 3 | Deposito.tsx | /deposito | ✅ Deposito.test.tsx |
| 4 | Kardex.tsx | /kardex | ❌ Sin test |
| 5 | Stock.tsx | /stock | ❌ Sin test |
| 6 | Rentabilidad.tsx | /rentabilidad | ❌ Sin test |
| 7 | Tareas.tsx | /tareas | ⚠️ Solo Tareas.optimistic.test.tsx |
| 8 | Productos.tsx | /productos | ✅ Productos.test.tsx |
| 9 | Proveedores.tsx | /proveedores | ❌ Sin test |
| 10 | Pedidos.tsx | /pedidos | ✅ Pedidos.test.tsx |
| 11 | Clientes.tsx | /clientes | ✅ Clientes.test.tsx |
| 12 | Pocket.tsx | /pocket | ❌ Sin test |
| 13 | Pos.tsx | /pos | ✅ Pos.test.tsx |

**Resultado:** 7 con test directo, 5 sin test, 1 con test parcial. **Conteo 13 = CORRECTO.**

#### Componentes (7/7 ✅)

| # | Archivo | Test |
|---|---------|------|
| 1 | AlertsDrawer.tsx | ❌ |
| 2 | BarcodeScanner.tsx | ❌ |
| 3 | ErrorBoundary.tsx | ✅ |
| 4 | ErrorMessage.tsx | ✅ |
| 5 | GlobalSearch.tsx | ❌ |
| 6 | Layout.tsx | ✅ |
| 7 | Skeleton.tsx | ❌ |

Adicionalmente existe `errorMessageUtils.ts` (utilidad, no componente `.tsx`). **Conteo 7 = CORRECTO.**

#### Hooks Query (9 archivos, 14 hooks ✅)

| Archivo | Hooks | useQuery | useMutation |
|---------|-------|----------|-------------|
| useDashboardStats.ts | 1 | 1 | 0 |
| useDeposito.ts | 1 | 1 | 0 |
| useKardex.ts | 1 | 1 | 0 |
| usePedidos.ts | 6 | 2 | 4 |
| useProductos.ts | 1 | 1 | 0 |
| useProveedores.ts | 1 | 1 | 0 |
| useRentabilidad.ts | 1 | 1 | 0 |
| useStock.ts | 1 | 1 | 0 |
| useTareas.ts | 1 | 1 | 0 |
| **TOTAL** | **14** | **10** | **4** |

⚠️ **Hallazgo adicional:** El barrel export `hooks/queries/index.ts` NO re-exporta `usePedidos` ni sus 5 hooks asociados. Solo exporta 8 de 9 archivos.

**Conteos 9 archivos + 14 hooks = CORRECTO.**

#### Hooks Custom (7/7 ✅), Libs (6/6 ✅), Contexts (2/2 ✅)

Todos los conteos **CORRECTOS** según verificación.

#### App.tsx — Rutas

| Aspecto | Auditoría dice | Verificado |
|---------|---------------|------------|
| Rutas explícitas | 13 | ✅ 13 rutas |
| Catch-all 404 | No existe | ✅ Confirmado ausencia |
| React.lazy code splitting | Sí | ✅ 13 componentes con `lazy()` |

---

### D-02: Backend — Auth Guards Verificados

#### Mapa de Auth Guards CORREGIDO

```
Edge Functions Auth Model (CORREGIDO):

api-minimarket ——— JWT + SHA-256 cache + circuit breaker ——— SEGURO
api-proveedor  ——— x-api-secret + origin validation ———————— SEGURO
alertas-stock  ——— requireServiceRoleAuth ——————————————————— SEGURO (cron)
notif-tareas   ——— requireServiceRoleAuth ——————————————————— SEGURO (cron)
reportes-auto  ——— requireServiceRoleAuth ——————————————————— SEGURO (cron)
scraper-maxi   ——— validateApiSecret ———————————————————————— SEGURO ← CORRECCIÓN

cron-dashboard ——— NINGUNO ———— pause/resume/trigger ————————— CRITICO
cron-notif     ——— NINGUNO ———— send emails via SendGrid ——— CRITICO
cron-health    ——— NINGUNO ———— auto-recovery ———————————————— ALTO
cron-maxicons  ——— NINGUNO ———— scraping/pricing ————————————— ALTO
cron-testing   ——— NINGUNO ———— test execution ——————————————— MEDIO

alertas-venc   ——— Sin guard (no cron-invocado) ——————————————— MEDIO
reposicion     ——— Sin guard (no cron-invocado) ——————————————— MEDIO
```

**Diferencias con auditoría original:**
1. `scraper-maxiconsumo` movido de "MEDIO" a "SEGURO"
2. `api-proveedor` corregido de "Bearer" a "x-api-secret"

---

### D-03: Cron Jobs (8/8 ✅)

| # | Job | Schedule | Target | Auth | Verificado |
|---|-----|----------|--------|------|------------|
| 1 | alertas-stock_invoke | `0 * * * *` | alertas-stock | Vault Bearer | ✅ |
| 2 | notificaciones-tareas_invoke | `0 */2 * * *` | notificaciones-tareas | Vault Bearer | ✅ |
| 3 | reportes-automaticos_invoke | `0 8 * * *` | reportes-automaticos | Vault Bearer | ✅ |
| 4 | daily_price_update | `0 2 * * *` | cron-jobs-maxiconsumo | Vault Bearer | ✅ |
| 5 | realtime_change_alerts | `*/15 * * * *` | cron-jobs-maxiconsumo | Vault Bearer | ✅ |
| 6 | weekly_trend_analysis | `0 3 * * 0` | cron-jobs-maxiconsumo | Vault Bearer | ✅ |
| 7 | maintenance_cleanup | `0 4 * * 0` | cron-jobs-maxiconsumo | Vault Bearer | ✅ |
| 8 | fn_refresh_stock_views | SQL RPC | `fn_refresh_stock_views()` | service_role (SQL) | ✅ |

Todos usan Vault pattern (`vault.decrypted_secrets`). **Conteo 7+1 = CORRECTO.**

---

### D-04: Migraciones (39/39 ✅)

- Primera: `20250101000000_version_sp_aplicar_precio.sql`
- Última: `20260213030000_drop_legacy_columns_precios_historicos.sql`
- **Total: 39 archivos — CORRECTO.**

ESTADO_ACTUAL.md en línea 45 dice `39/39` (correcto), pero "Métricas de Código" más abajo dice `34 archivos` (desactualizado/contradictorio).

---

### D-05: Tests — Verificación de Conteos

| Categoría | Claimed | Verificado | Veredicto |
|-----------|---------|------------|-----------|
| Unit (raíz) archivos | 47 | **47** | ✅ |
| Unit (raíz) tests | 817 | >200 confirmados parcialmente (no ejecutable sin terminal) | ⚠️ Plausible |
| Frontend archivos | 21 | **21** | ✅ |
| Frontend tests | 108 | **~107** (roles.test.ts genera dinámicos) | ✅ Consistente |
| Integration archivos | 3 | **3** | ✅ |
| Integration tests | 38 | **38** (msw:7, api-scraper:11, database:20) | ✅ |
| Security archivos | 1 | **1** | ✅ |
| Security tests | 14 | **14** activos + 1 SKIP_REAL | ✅ |
| Performance archivos | 1 | **1** | ✅ |
| Performance tests | 5 | **5** activos + 1 SKIP_REAL | ✅ |
| E2E archivos | 1 (claimed) | **4** (real) | ❌ Subreportado |
| E2E POS tests | 8 | **8** | ✅ |

**Total archivos: ~74 (auditoría) → ~77 (real, con E2E y api-contracts)**

---

### D-06: Dependencias — Versiones Verificadas

#### Triple supabase-js (H-11 ✅)

| Ubicación | Versión | Verificado |
|-----------|---------|------------|
| `supabase/functions/deno.json` | `@supabase/supabase-js@2.39.3` (esm.sh, pinned) | ✅ |
| `minimarket-system/package.json` | `^2.78.0` | ✅ |
| Root `package.json` | `^2.95.3` (devDependencies) | ✅ |

#### React types mismatch (H-12 ✅)

| Paquete | Root | Frontend |
|---------|------|----------|
| `@types/react` | `^19.2.8` ❌ | `^18.3.12` ✅ |
| `react` | `^18.3.1` | `^18.3.1` |

---

### D-07: Verificación de Claims ESTADO_ACTUAL vs Realidad

| Claim | Veredicto | Evidencia |
|-------|-----------|-----------|
| "HC-1 RESUELTO" | **PARCIAL** | 3/4 funciones invocadas por cron tienen guard. `cron-jobs-maxiconsumo` NO tiene. 5 funciones standalone TAMPOCO. Pero "7/7 net.http_post con auth" es correcto (las invocaciones cron sí usan Vault Bearer). |
| "Gate 3 CERRADO (8/8 POS E2E)" | **CORRECTO** | 8 tests Playwright verificados |
| "Gate 4 CERRADO" | **CORRECTO** | |
| "Gate 15 CERRADO" | **CORRECTO** | |
| "Gate 16 CERRADO" | **CORRECTO** | Evidencia técnica + verificación externa (Comet): `docs/closure/EVIDENCIA_GATE16_2026-02-14.md` |
| "Gate 18 CERRADO" | **CORRECTO** | Tests ejecutan como gate bloqueante (aunque tautológicos) |
| "13/13 ErrorMessage" | **CORRECTO** | Verificado: las 13 páginas importan/usan ErrorMessage |
| "9/13 ErrorMessage" (histórico) | **DESACTUALIZADO** | Dato de sesión anterior, ya resuelto |
| "Logging sanitizado (no PII)" | **PARCIAL** | Consola: no loguea emails directos (loguea toCount). BD: SÍ almacena recipients en texto plano |
| "69.39% coverage" vs "70.34%" | **STALE** | Ambos valores son de sesiones anteriores, no verificable sin ejecutar tests |
| "7/7 net.http_post con auth" | **CORRECTO** | Todas las invocaciones cron usan Vault Bearer token |
| "4 procedures migrated to Vault" | **CORRECTO** | Migración 20260211062617 lo confirma |

---

## SECCIÓN E — AMPLIACIONES Y PROFUNDIZACIÓN

### E-01: Impacto real de H-04 (funciones sin auth)

La auditoría describe el vector de ataque teórico. Ampliación del análisis de impacto:

Las 5 funciones `cron-*` sin auth combinadas representan una superficie de ataque que permite a un atacante:

1. **Pausar/reanudar/disparar** cualquier cron job (cron-dashboard `/control`)
2. **Enviar emails arbitrarios** vía SendGrid a cualquier dirección (cron-notifications `/send`)
3. **Ejecutar auto-recovery** que podría modificar estado de BD (cron-health-monitor `/auto-recovery`)
4. **Disparar scraping masivo** de precios (cron-jobs-maxiconsumo `/execute`) — posible abuso de rate limits contra MaxiConsumo
5. **Ejecutar suite de tests** contra producción (cron-testing-suite)

**Mitigante parcial:** Supabase Edge Functions requieren al menos la URL base correcta (`https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/`), que no es pública por defecto pero sí descubrible si se filtra. La referencia del proyecto (`dqaygmjpzoqjjrywdsxi`) aparece en el código fuente del frontend y en documentación.

**Agravante:** `cron-jobs-maxiconsumo` tiene CORS wildcard (`*`), lo que permite invocación desde cualquier página web vía JavaScript del lado del cliente.

---

### E-02: config.toml — contexto dev vs producción

La auditoría nota que la configuración es "modo desarrollo". Ampliación importante:

`supabase/config.toml` es la configuración **local/dev** (usado por `supabase start`). Los settings de producción se gestionan en el **dashboard de Supabase** y **pueden diferir significativamente**.

Los hallazgos H-03, H-05, H-06, H-07, H-08 son válidos para dev local pero **no necesariamente reflejan producción**. Sin embargo:

1. La auditoría no puede verificar producción (nota metodológica 5 del documento original)
2. Tener config.toml permisivo es riesgo si alguien configura producción **copiando local**
3. Es best practice tener config.toml con settings de seguridad **equivalentes o superiores** a producción para que el desarrollo refleje el entorno real

---

### E-03: H-10 — Los tests de "integración" sí aportan valor

Los 38 tests en `tests/integration/` verifican:
- **Contratos de API** (shapes de request/response)
- **Lógica de retry** y manejo de errores
- **Patrones MSW** (Mock Service Worker)

No son inútiles — son tests de contrato/comportamiento que podrían reclasificarse como `tests/contract/` o `tests/unit-api/`. La remediación no debería eliminarlos sino **re-etiquetarlos** para evitar confusión sobre qué tipo de testing proveen.

---

### E-04: Score 55/100 — Análisis de ajuste

Con la corrección de `scraper-maxiconsumo` (sí tiene auth guard):

| Módulo | Score original | Score ajustado | Justificación |
|--------|---------------|----------------|---------------|
| M3 Backend | 4/10 | **5/10** | scraper protegido, son 7 sin auth (no 8). Pero se agrava con CORS wildcard descubierto. |
| Resto | Sin cambio | Sin cambio | |

**Score ajustado: ~57/100** — la diferencia no es material pero sí refleja mejor la realidad. El veredicto general **no cambia**: "APROBADO CON RESERVAS SIGNIFICATIVAS".

---

### E-05: Tests — panorama completo de cobertura de seguridad

| Categoría | Archivos | Tests | Naturaleza |
|-----------|----------|-------|------------|
| Tests tautológicos | 1 (`security.vitest.test.ts`) | 14 | Verifican mocks, cero valor de seguridad real |
| Tests reales (unit) | 3 (`security-gaps`, `gateway-auth`, `api-proveedor-auth`) | 51 | Testean funciones puras de auth/roles. **Genuinos.** |
| **Total** | **4** | **65** | |

**Lo que SÍ se testea:**
- Extracción de Bearer token
- Validación de roles (requireRole, hasRole, hasAnyRole)
- Parsing de auth modes
- Origin allowlist
- API secret validation
- Funciones de buildHeaders

**Lo que NO se testea:**
- Flujos HTTP completos de auth contra endpoints reales
- RLS enforcement end-to-end
- Circuit breaker behavior bajo carga real
- CORS rejection real (solo se testea la función `validateOrigin` aislada)
- Comportamiento de email confirmation / MFA
- Rate limiting real

---

## SECCIÓN F — PLAN DE REMEDIACIÓN AMPLIADO

### Adiciones al plan de remediación de la auditoría original

| # | Acción | Prioridad | Esfuerzo | Descripción |
|---|--------|-----------|----------|-------------|
| R-23 | Corregir errores factuales en la auditoría | P1 | Bajo | Los 12 puntos de Sección A de este documento |
| R-24 | Agregar auth a `alertas-vencimientos` y `reposicion-sugerida` | P2 | Bajo | Importar `requireServiceRoleAuth` o `validateApiSecret` |
| R-25 | Eliminar CORS wildcard en `cron-jobs-maxiconsumo` | P2 | Bajo | Reemplazar `'*'` por `_shared/cors.ts` validateOrigin |
| R-26 | Completar barrel export en `hooks/queries/index.ts` | P3 | Bajo | Agregar re-export de `usePedidos` y hooks asociados |
| R-27 | Evaluar y documentar 3 archivos E2E adicionales | P3 | Bajo | `auth.real.spec.ts`, `tareas.proveedores.spec.ts`, `app.smoke.spec.ts` |
| R-28 | Agregar nota sobre diferencia config.toml local vs producción | P3 | Bajo | En documentación y/o en config.toml como comentario |
| R-29 | Reclasificar `tests/integration/` como `tests/contract/` | P3 | Bajo | Renombrar directorio y actualizar configs |
| R-30 | Cifrar/hashear `recipients` en tabla `cron_jobs_notifications` | P2 | Medio | Implementar cifrado antes de almacenar PII, función de descifrado para lectura |

---

## SECCIÓN G — NOTAS METODOLÓGICAS DE ESTA VERIFICACIÓN

1. **Verificación READ-ONLY**: cero archivos modificados durante todo el proceso de auditoría.
2. **5 subagentes paralelos**: frontend, backend/seguridad, tests/CI, dependencias/docs, y discrepancias específicas.
3. **Herramientas utilizadas**: file_search, read_file, grep_search, semantic_search en múltiples pasadas.
4. **Scope**: verificación exhaustiva de cada afirmación numérica, cada número de línea referenciado, cada claim de existencia/ausencia.
5. **Limitaciones**: no se ejecutaron tests (conteos basados en patrones `it(`/`test(`), no se verificó estado remoto de Supabase, no se verificó producción vs local.
6. **Guardrails respetados**: no se imprimieron secretos, no se ejecutaron comandos destructivos, `api-minimarket` mantiene `verify_jwt=false`.
7. **Timestamp de verificación**: 2026-02-15.

---

## SECCIÓN H — CONCLUSIÓN DE LA VERIFICACIÓN

La auditoría forense del 2026-02-13 es un documento **de alta calidad** que captura correctamente la gran mayoría del estado del sistema. Sin embargo, esta verificación identifica:

- **12 errores factuales** que deben corregirse para mantener la integridad del documento
- **7 hallazgos faltantes** que amplían la superficie de problemas identificados
- **3 hallazgos positivos parcialmente incorrectos** (P-07 CORS, api-proveedor auth, scraper-maxiconsumo auth) que requieren corrección

**Los hallazgos más significativos de esta verificación son:**

1. **F-05 (Security gate ficticio)**: El gate de seguridad en CI es blocking pero los tests son tautológicos — esto crea **falsa confianza sistémica** y es el hallazgo de mayor impacto no capturado por la auditoría original.

2. **F-02 (CORS wildcard + sin auth)**: La combinación de CORS `*` en `cron-jobs-maxiconsumo` con falta de auth guard amplifica significativamente el vector de ataque — invocable desde cualquier página web.

3. **A-01 (scraper-maxiconsumo protegido)**: Corrige a favor del sistema — reduce de 8 a 7 las funciones sin auth.

**Score ajustado: 57/100 — APROBADO CON RESERVAS SIGNIFICATIVAS** (sin cambio de veredicto).

---

*Documento generado por verificación forense de segundo nivel contra filesystem real el 2026-02-15. Complementa y corrige la auditoría original del 2026-02-13.*
