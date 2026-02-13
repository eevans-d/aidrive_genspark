# AUDITORIA FORENSE ABSOLUTA - REPORTE EJECUTIVO FINAL (REVISION TECNICA v1.1)

**Proyecto:** Mini Market System  
**Branch verificado:** `session-close-2026-02-11`  
**Fecha de auditoria original:** 2026-02-13  
**Fecha de revision tecnica:** 2026-02-13  
**Metodo:** verificacion local READ-ONLY contra filesystem (sin cambios de codigo fuente)

---

## 1. Resumen Ejecutivo

**Score tecnico heuristico:** **56/100**  
**Estado:** **Aprobado con reservas significativas**

El sistema tiene una base tecnica buena en RBAC/RLS, trazabilidad (`x-request-id`) y estructura general.  
La reserva principal sigue siendo de **superficie de control operativa sin guard interno** en funciones cron criticas, sumado a **falsa sensacion de cobertura en seguridad** por tests mayormente mockeados.

### Riesgos que bloquean un "production-ready sin reservas"
1. Endpoints operativos de cron sin `requireServiceRoleAuth` en codigo de entrada.
2. Suite `tests/security/security.vitest.test.ts` valida mocks, no comportamiento real del sistema.
3. Drift entre politica de coverage, umbral tecnico y enforcement en CI.
4. Config Auth local con flags de hardening desactivados (`enable_confirmations`, `secure_password_change`, MFA).

---

## 2. Correcciones y Ajustes Respecto al Reporte Inicial

| Item | Reporte inicial | Revision v1.1 | Estado |
|---|---|---|---|
| Conteo de unit tests (casos `it/test`) | 817 | **822** (`tests/unit`) | Ajustado |
| Hooks de query | 9 archivos | **9 hooks files + `index.ts` barrel (10 archivos totales en carpeta)** | Aclarado |
| `cron-testing-suite` tratado como endpoint HTTP | Implicito | **No expone `Deno.serve()` en `index.ts`** | Corregido |
| Politica coverage "80%" | Contradiccion absoluta | **D-006 define 80% modulos criticos y 60% global**; aun asi CI no bloquea coverage por `continue-on-error` | Profundizado |
| Inventario frontend/backend/migraciones | 13/13/39 | **Confirmado** | Verificado |
| Paginas sin test | 5 | **Confirmado (Kardex, Pocket, Proveedores, Rentabilidad, Stock)** | Verificado |

---

## 3. Metodologia y Alcance de Verificacion

### Alcance verificado con evidencia local
- Estructura real de frontend/backend/db/tests.
- Presencia o ausencia de guardas de auth en entrypoints.
- Configuracion de CI y coverage.
- Configuracion de auth en `supabase/config.toml`.
- Coherencia interna de claims documentales vs codigo.

### Limites (importante)
- **No se verifico estado remoto en dashboard Supabase** (versiones deployadas y flags runtime actuales).
- Claims remotos se tratan como **"no confirmados localmente"** salvo evidencia en archivos de closure.

---

## 4. Inventario Real Verificado (Snapshot Local)

### 4.1 Frontend

- Paginas reales: **13** (`minimarket-system/src/pages/*.tsx`, excluyendo tests)
- Componentes reutilizables: **7** (`minimarket-system/src/components/*.tsx`, excluyendo tests)
- Hooks query: **9 archivos funcionales** (+ `index.ts` barrel)
- Hooks custom: **7**
- Libs: **6**
- Contexts: **2**

**Paginas sin test dedicado:**
- Kardex
- Pocket
- Proveedores
- Rentabilidad
- Stock

### 4.2 Backend / Edge Functions

- Edge Functions en repo: **13** (excluyendo `_shared`)
- Migraciones SQL: **39** (`supabase/migrations/*.sql`)

**Mapa de auth de entrada (codigo local):**

| Funcion | `requireServiceRoleAuth` | `Deno.serve()` en `index.ts` | Lectura de riesgo |
|---|---:|---:|---|
| alertas-stock | SI | SI | Protegida internamente |
| notificaciones-tareas | SI | SI | Protegida internamente |
| reportes-automaticos | SI | SI | Protegida internamente |
| cron-dashboard | NO | SI | Critico (control operativo) |
| cron-notifications | NO | SI | Critico (envio notificaciones) |
| cron-health-monitor | NO | SI | Alto (recovery remoto) |
| cron-jobs-maxiconsumo | NO | SI | Alto |
| cron-testing-suite | NO | NO | Caso atipico (no HTTP entrypoint) |
| alertas-vencimientos | NO | SI | Medio |
| reposicion-sugerida | NO | SI | Medio |
| scraper-maxiconsumo | NO | SI | Medio |
| api-minimarket | NO | SI | Auth propia en app |
| api-proveedor | NO | SI | Auth por `x-api-secret` + validacion de origen |

### 4.3 Tests (conteo por patron `it/test`)

| Categoria | Casos |
|---|---:|
| Unit (`tests/unit`) | 822 |
| Frontend (`minimarket-system/src`) | 108 |
| Integration (`tests/integration`) | 38 |
| Security (`tests/security`) | 14 |
| Performance (`tests/performance`) | 5 |

---

## 5. Hallazgos Priorizados (Revalidados)

## 5.1 Criticos

### C-01. Endpoints cron de control sin guard interno
**Evidencia:**
- `supabase/functions/cron-dashboard/index.ts:116`
- `supabase/functions/cron-dashboard/index.ts:148`
- `supabase/functions/cron-notifications/index.ts:563`
- `supabase/functions/cron-notifications/index.ts:603`
- `supabase/functions/cron-health-monitor/index.ts:81`
- `supabase/functions/cron-health-monitor/index.ts:118`
- `supabase/functions/cron-jobs-maxiconsumo/index.ts:104`

**Impacto:** ejecucion de acciones operativas sensibles desde endpoint sin validacion explicita de token interno en codigo de entrada.

**Nota tecnica clave:** exista o no `verify_jwt` en runtime, la defensa de aplicacion debe ser explicita para endpoints internos de control.

### C-02. Security tests con baja efectividad real (mock-driven)
**Evidencia:**
- `tests/security/security.vitest.test.ts:27` (`mockFetch = vi.fn()`)
- `tests/security/security.vitest.test.ts:110` (`vi.stubGlobal('fetch', mockFetch)`)
- `tests/security/security.vitest.test.ts:461` (tests reales bajo `SKIP_REAL`)

**Impacto:** gate de seguridad puede pasar sin validar ataques reales en runtime.

### C-03. Hardening Auth local en modo laxo
**Evidencia (`supabase/config.toml`):**
- `enable_confirmations = false` (`supabase/config.toml:178`)
- `secure_password_change = false` (`supabase/config.toml:180`)
- `minimum_password_length = 6` (`supabase/config.toml:144`)
- MFA TOTP off (`supabase/config.toml:255`, `supabase/config.toml:256`)

**Impacto:** postura de auth no alineada con baseline de produccion estricta.

## 5.2 Altos

### A-01. Coverage no bloqueante en CI
**Evidencia:**
- Umbrales globales al 60%: `vitest.config.ts:43`
- Coverage step con `continue-on-error`: `.github/workflows/ci.yml:134`

**Impacto:** drift de gobernanza de calidad; cobertura no frena merges.

### A-02. Riesgo de PII en logging/almacen de notificaciones
**Evidencia:**
- `subject` se loguea en envio email: `supabase/functions/cron-notifications/index.ts:834`, `supabase/functions/cron-notifications/index.ts:877`
- Persistencia de `recipients` y `data` completos: `supabase/functions/cron-notifications/index.ts:1196`, `supabase/functions/cron-notifications/index.ts:1197`

**Impacto:** exposicion innecesaria de datos sensibles en trazas y tabla de logs.

### A-03. Deploy sin validacion de branch
**Evidencia:** `deploy.sh:546` (valida entorno, no branch permitida).

**Impacto:** riesgo operativo de despliegue desde branch no autorizado.

### A-04. Drift de versiones de `@supabase/supabase-js`
**Evidencia:**
- `supabase/functions/deno.json:3` -> `2.39.3`
- `minimarket-system/package.json` -> `^2.78.0`
- `package.json` root -> `^2.95.3`

**Impacto:** comportamiento divergente entre runtime Edge/FE/tooling.

### A-05. Sin ruta catch-all 404 en frontend
**Evidencia:** `minimarket-system/src/App.tsx` (no existe `<Route path="*" ... />`).

### A-06. Pre-commit sin verificacion backend Deno
**Evidencia:** `.husky/pre-commit` solo ejecuta TS/lint-staged frontend.

### A-07. `extractUserRole()` sin uso productivo
**Evidencia:**
- Definicion: `minimarket-system/src/lib/roles.ts:65`
- Uso real detectado solo en tests: `minimarket-system/src/lib/roles.test.ts`

---

## 6. Claims Documentales vs Realidad (Muestra Prioritaria)

| Claim | Veredicto | Evidencia |
|---|---|---|
| "13 paginas frontend" | CORRECTO | `minimarket-system/src/pages` (excluyendo tests) |
| "39 migraciones" | CORRECTO | `supabase/migrations/*.sql` |
| "HC-1 resuelto" | PARCIAL | 3 funciones con guard interno; varias cron criticas sin guard |
| "Gate 18 cerrado" | PARCIALMENTE CIERTO | Job bloqueante existe, pero suite security es mayormente mock |
| "ErrorMessage 13/13" en historial | AJUSTADO | `docs/ESTADO_ACTUAL.md:104` corresponde al corte 2026-02-11; `docs/ESTADO_ACTUAL.md:37` al corte 2026-02-12; el codigo actual refleja adopcion 13/13 |

---

## 7. Evaluacion de Riesgo por Modulo

| Modulo | Riesgo | Justificacion resumida |
|---|---|---|
| Backend/Operaciones | ALTO | Endpoints cron sensibles sin guard interno uniforme |
| Seguridad | ALTO | Hardening auth local debil + seguridad testeada mayormente con mocks |
| Testing | ALTO | Gap entre volumen de tests y eficacia real de suites criticas |
| Frontend | MEDIO | Base buena, pero faltan 404 catch-all y cobertura de 5 paginas |
| Documentacion | MEDIO | Hay mejoras, pero persiste desincronizacion puntual en claims historicos |
| DevOps/CI | MEDIO-ALTO | Coverage no bloqueante y sin branch gate en deploy |

---

## 8. Plan de Remediacion Profundizado

### 0-72 horas (bloqueantes)
1. Agregar `requireServiceRoleAuth` en:
`supabase/functions/cron-dashboard/index.ts`,
`supabase/functions/cron-notifications/index.ts`,
`supabase/functions/cron-health-monitor/index.ts`,
`supabase/functions/cron-jobs-maxiconsumo/index.ts`.
2. Reescribir `tests/security/security.vitest.test.ts` para escenarios reales/contractuales (sin mock global de `fetch` en suite principal).
3. Endurecer config Auth de referencia (confirmaciones, password change seguro, baseline de password, MFA por rol admin).

### 7 dias
1. Quitar `continue-on-error` en coverage y alinear enforcement CI con politica oficial.
2. Agregar branch allowlist en `deploy.sh` (`main` y `staging`).
3. Redactar/mascarar `subject`, `recipients` y `data` en logs de notificaciones.
4. Agregar ruta 404 catch-all en `minimarket-system/src/App.tsx`.

### 30 dias
1. Unificar estrategia de versiones de `@supabase/supabase-js` por superficie.
2. Cubrir 5 paginas sin tests.
3. Revisar y depurar dead code (`extractUserRole`) y actualizar docs canonicamente.

---

## 9. Clasificacion DocuGuard de esta Revision

| Item revisado | Categoria | Accion |
|---|---|---|
| Conteo de tests unitarios (817->822) | DESINCRONIZADO | Corregido en esta revision |
| Cobertura 80% vs 60% | DESINCRONIZADO | Aclarado segun D-006 + CI real |
| `cron-testing-suite` como endpoint | DOC_FANTASMA | Re-etiquetado como script sin `Deno.serve()` |
| Inventario frontend/backend/migraciones | REAL | Confirmado sin cambios |
| Claims historicos de ErrorMessage en `ESTADO_ACTUAL` | REAL | Ajustado: diferencia temporal (2026-02-11 vs 2026-02-12), no contradiccion estructural |

---

## 10. Conclusión

La arquitectura sigue siendo defendible, pero **no debe declararse "lista sin reservas"** hasta cerrar la brecha entre:
1. **Seguridad operativa efectiva** (guards internos en cron),
2. **Calidad comprobada** (tests de seguridad no tautologicos),
3. **Gobernanza CI realmente bloqueante** (coverage/politicas).

**Veredicto actualizado:** **56/100 - Aprobado con reservas significativas**.

---

## 11. Evidencia Principal (archivo:linea)

- `supabase/functions/_shared/internal-auth.ts:14`
- `supabase/functions/cron-dashboard/index.ts:116`
- `supabase/functions/cron-notifications/index.ts:563`
- `supabase/functions/cron-health-monitor/index.ts:81`
- `supabase/functions/cron-jobs-maxiconsumo/index.ts:104`
- `tests/security/security.vitest.test.ts:27`
- `vitest.config.ts:43`
- `.github/workflows/ci.yml:134`
- `supabase/config.toml:178`
- `.husky/pre-commit:1`
- `deploy.sh:546`
- `minimarket-system/src/App.tsx:58`

---

## 12. Verificacion Punto Por Punto (Re-check 2026-02-13)

| Punto | Resultado | Evidencia | Nota |
|---|---|---|---|
| Conteo paginas frontend = 13 | CONFIRMADO | `find minimarket-system/src/pages ...` | Excluye tests |
| Componentes reutilizables = 7 | CONFIRMADO | `find minimarket-system/src/components ...` | Excluye tests |
| Hooks query = 9 + barrel `index.ts` | CONFIRMADO | `minimarket-system/src/hooks/queries` | 9 archivos funcionales + 1 barrel |
| Hooks custom = 7 | CONFIRMADO | `minimarket-system/src/hooks` | |
| Libs = 6 | CONFIRMADO | `minimarket-system/src/lib` | |
| Contexts = 2 | CONFIRMADO | `minimarket-system/src/contexts` | |
| Edge Functions = 13 | CONFIRMADO | `find supabase/functions ... ! -name _shared` | |
| Migraciones = 39 | CONFIRMADO | `find supabase/migrations -name '*.sql'` | |
| Unit tests (`it/test`) = 822 | CONFIRMADO | `rg -n "\\b(it|test)\\(" tests/unit` | |
| Frontend tests (`it/test`) = 108 | CONFIRMADO | `rg` en `minimarket-system/src` | |
| Integration tests (`it/test`) = 38 | CONFIRMADO | `rg` en `tests/integration` | |
| Security tests (`it/test`) = 14 | CONFIRMADO | `rg` en `tests/security` | |
| Performance tests (`it/test`) = 5 | CONFIRMADO | `rg` en `tests/performance` | |
| Paginas sin test (Kardex/Pocket/Proveedores/Rentabilidad/Stock) | CONFIRMADO | búsqueda de `*.test/spec.tsx` por página | |
| C-01 cron sensibles sin guard interno uniforme | CONFIRMADO | `cron-dashboard`, `cron-notifications`, `cron-health-monitor`, `cron-jobs-maxiconsumo` entrypoints | Sin `requireServiceRoleAuth` en entrada |
| `cron-testing-suite` sin endpoint HTTP | CONFIRMADO | `supabase/functions/cron-testing-suite/index.ts` | No expone `Deno.serve()` |
| C-02 security suite mock-driven | CONFIRMADO | `tests/security/security.vitest.test.ts:27`, `:110`, `:461` | Tests reales quedan condicionados por `SKIP_REAL` |
| C-03 auth hardening laxo en config | CONFIRMADO | `supabase/config.toml:144`, `:178`, `:180`, `:255-256` | |
| A-01 coverage no bloqueante | CONFIRMADO | `vitest.config.ts:43-49`, `.github/workflows/ci.yml:134` | |
| A-02 riesgo PII en `cron-notifications` | CONFIRMADO | `supabase/functions/cron-notifications/index.ts:834`, `:877`, `:1196-1197` | |
| A-03 deploy sin branch allowlist | CONFIRMADO | `deploy.sh:546-575` | |
| A-04 drift `@supabase/supabase-js` | CONFIRMADO | `supabase/functions/deno.json:3`, `minimarket-system/package.json`, `package.json` | |
| A-05 sin catch-all 404 | CONFIRMADO | `minimarket-system/src/App.tsx` | no existe `path="*"` |
| A-06 pre-commit sin check Deno backend | CONFIRMADO | `.husky/pre-commit:1-2` | solo TS/lint frontend |
| A-07 `extractUserRole()` sin uso productivo | CONFIRMADO | definición en `roles.ts:65`; uso en tests | 0 llamadas productivas fuera de tests |
| Claim \"HC-1 resuelto\" en histórico | PARCIAL | `docs/ESTADO_ACTUAL.md` + mapa auth actual | válido como histórico, no como estado absoluto actual |
| Claim \"Gate 18 cerrado\" | PARCIALMENTE CIERTO | job `security-tests` existe; suite es mock-heavy | gate existe, eficacia de suite es mejorable |
| Claim \"ErrorMessage 13/13\" vs \"9/13\" | AJUSTADO | `docs/ESTADO_ACTUAL.md:37` y `docs/ESTADO_ACTUAL.md:104` + verificacion de `ErrorMessage` en 13/13 paginas actuales | diferencia temporal, no inconsistencia real |
