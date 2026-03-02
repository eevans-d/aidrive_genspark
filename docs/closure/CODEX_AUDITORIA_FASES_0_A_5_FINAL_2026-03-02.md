# CODEX - Auditoria Completa (Fase 0 a Fase 5)
**Fecha:** 2026-03-02 (UTC)  
**Repositorio:** `aidrive_genspark`  
**Autor:** Codex  
**Modo:** Auditoria tecnica exhaustiva + evidencia por codigo/comandos (sin modificar codigo fuente)

---

## FASE 0 — IDENTIFICACION DEL PROYECTO (CONCLUIDA)

1. He identificado que tu proyecto es: **plataforma full-stack interna para gestion operativa de minimarket** (frontend React/Vite + backend Supabase Edge Functions + Postgres). ¿Es correcto?
2. Usa las siguientes tecnologias: **TypeScript, React 18, Vite, Vitest, Playwright, Supabase Edge Functions (Deno), SQL migrations, pnpm/npm, Tailwind, Zod, Sentry**. ¿Falta alguna que yo deba saber?
3. El proposito principal del proyecto parece ser: **operar ventas, stock, pedidos, facturas (con OCR), cuentas corrientes, tareas y asistente IA con acciones controladas**. ¿Es correcto?

### Respuestas de contexto incorporadas del usuario
- Uso: **interno**.
- Escenario prioritario: **revision integral, todo bajo la lupa**.
- Carga esperada: **hasta 10 usuarios simultaneos** y **20-50 operaciones/dia**.
- Continuidad: avanzar segun hallazgos y riesgos reales.

---

## FASE 1 — RECONOCIMIENTO PROFUNDO (CONCLUIDA)

### 1.1 Estructura y entrypoints
- Frontend: `minimarket-system/src/main.tsx`, `minimarket-system/src/App.tsx`.
- Backend gateway: `supabase/functions/api-minimarket/index.ts`.
- Modulos criticos: `facturas-ocr`, `api-assistant`, `api-proveedor`, `_shared`.
- Configs clave: `package.json` (raiz/frontend), `supabase/config.toml`, `.env.example`, `.env.test.example`, `deploy.sh`.

### 1.2/1.3/1.4/1.5 (lectura y trazado)
Se analizaron handlers de negocio, rutas, helpers, migraciones, tests y flujo E2E funcional (auth -> operaciones -> persistencia -> feedback UI).

### 1.6 Comandos diagnosticos ejecutados (evidencia real)
- `pnpm -C minimarket-system build` -> PASS.
- `pnpm -C minimarket-system lint` -> PASS.
- `pnpm -C minimarket-system exec tsc -b --pretty false` -> PASS.
- `npm test` -> PASS (**85 files**, **1905 tests**).
- `npm run test:coverage` -> PASS (**All files: 90.03% stmts / 82.82% branch / 91.14% funcs / 91.14% lines**).
- `npm run test:auxiliary` -> PASS (**45 passed, 4 skipped**).
- `npm audit --json` -> PASS (**0 vulnerabilidades** en root).
- `pnpm -C minimarket-system audit --json` -> FAIL esperado por advisories (**12 high, 1 moderate**, mayormente transitivos/toolchain).

---

## FASE 2 — PLAN DE AUDITORIA DETALLADO (VERSION DEFINITIVA CODEX)

**Proyecto auditado:** plataforma interna full-stack de gestion minimarket con OCR y asistente IA.  
**Dimensiones cubiertas:** 14  
**Verificaciones ejecutadas en Fase 4:** 42

### D1: Validacion de logica de negocio
- Que: rutas de calculo/reglas (`/precios/aplicar`, `/reservas`, `/ventas`, `/facturas/{id}/aplicar`).
- Riesgo: calculos incorrectos, no idempotencia, reglas de negocio incompletas.
- Como: lectura de codigo + contraste con tests + chequeo de headers idempotentes.

### D2: Manejo de errores
- Que: timeouts, contratos de error, sanitizacion de respuestas.
- Riesgo: errores silenciosos o filtrado tecnico al usuario.
- Como: inspeccion try/catch y rutas de fallback en gateway/OCR/asistente/proveedor.

### D3: Integridad y persistencia
- Que: locks, estados, escrituras parciales y atomicidad.
- Riesgo: race conditions, inconsistencias o perdida parcial.
- Como: lectura SQL (FOR UPDATE/SP) + trazado de endpoints mutativos.

### D4: Seguridad
- Que: autenticacion/autorizacion/secrets/CORS/rate limiting.
- Riesgo: bypass auth, abuso, exposicion de secretos.
- Como: analisis de auth helpers, rutas protegidas, grep de secretos, env/gitignore.

### D5: Rendimiento
- Que: hot paths, agregaciones en memoria, build bundles.
- Riesgo: degradacion con mas datos/concurrencia.
- Como: build real + inspeccion de loops/consultas + tests de performance.

### D6: Config prod vs dev
- Que: flags debug, origenes, scripts deploy.
- Riesgo: configuracion de desarrollo en produccion.
- Como: analisis de `deploy.sh`, env examples, gates de despliegue.

### D7: Flujo E2E real
- Que: doble click/multi-tab/confirmaciones.
- Riesgo: doble ejecucion o estados incoherentes.
- Como: lectura UI + backend de confirmaciones + validacion de bloqueos.

### D8: Dependencias externas
- Que: vulnerabilidades y estabilidad de versiones.
- Riesgo: CVEs activas o paquetes riesgosos en cadena.
- Como: `npm audit` + `pnpm audit` + clasificacion runtime/tooling.

### D9: Resiliencia
- Que: circuit breaker, degradacion, reintentos, rollback.
- Riesgo: fallos en cascada / no recuperacion.
- Como: lectura `_shared/circuit-breaker.ts`, flujos OCR y compensaciones.

### D10: Infra y despliegue
- Que: reproducibilidad y health checks.
- Riesgo: deploy manual fragil o verificacion incompleta.
- Como: analisis `deploy.sh`, `DEPLOYMENT_GUIDE`, endpoints health.

### D11: Monitoreo/observabilidad
- Que: estructura de logs, requestId, trazabilidad.
- Riesgo: incidentes no diagnosticables.
- Como: lectura logger/audit + chequeo de propagacion de request-id.

### D12: Documentacion operativa
- Que: coherencia docs-codigo.
- Riesgo: drift y decisiones operativas incorrectas.
- Como: contraste README/ESTADO_ACTUAL/API docs/runbooks.

### D13: Cumplimiento/datos sensibles
- Que: manejo de PII, logs sensibles, controles documentales.
- Riesgo: exposicion de datos, brechas de privacidad.
- Como: analisis handlers de clientes/CC/notificaciones + docs de seguridad.

### D14: Riesgos no obvios
- Que: deuda tecnica y anti-patrones de produccion.
- Riesgo: "funciona de casualidad".
- Como: cruce de OPEN_ISSUES + codigo + resultados de auditoria.

---

## FASE 3 — CHECKPOINT (APROBADA)

Aprobacion explicita recibida del usuario para avanzar: **"OK, ADELANTE"**.

---

## FASE 4 — EJECUCION EXHAUSTIVA DE AUDITORIA

📍 VERIFICACIÓN: D1-01 Margen y calculo de precio en `/precios/aplicar`  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/api-minimarket/index.ts` (aprox. 900-1005)  
🔍 MÉTODO: Lectura de codigo y trazado read->validacion->SP  
📊 HALLAZGO: Validaciones funcionales presentes; el chequeo de margen se hace con lectura previa no bloqueante.  
📌 EVIDENCIA: Lectura de `productos` y `categorias` en líneas ~930-953; luego aplica `sp_aplicar_precio` en ~989-994 sin lock explicito del dato leido.  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Mover validacion de margen minimo dentro de un SP atomico (con lock/condicion) para evitar decisiones con dato stale bajo concurrencia.

📍 VERIFICACIÓN: D1-02 Idempotencia en operaciones mutativas  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/api-minimarket/index.ts`, `supabase/functions/api-minimarket/handlers/{reservas.ts,ventas.ts}`  
🔍 MÉTODO: Lectura de rutas y uso de header `idempotency-key`  
📊 HALLAZGO: `/reservas` y `/ventas` exigen idempotency key; `/deposito/movimiento`, `/deposito/ingreso`, `/compras/recepcion` no la exigen.  
📌 EVIDENCIA: `idempotencyKeyRaw: req.headers.get('idempotency-key')` en ~1686 y ~2081; ausencia equivalente en rutas ~1453, ~1602, ~1722.  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Implementar idempotency-key en esos tres POST para prevenir duplicados por retry/doble click.

📍 VERIFICACIÓN: D1-03 Consistencia de flujo OCR aplicar/rollback  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/api-minimarket/index.ts` (aprox. 2374-2609)  
🔍 MÉTODO: Lectura de logica de aplicacion por item y compensacion  
📊 HALLAZGO: Existe compensacion de movimientos ante fallo parcial, mejorando consistencia operativa.  
📌 EVIDENCIA: Bloque de compensacion/rollback en zona ~2513-2579 (segun OPEN_ISSUES y codigo actual).  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D2-01 Timeouts en llamadas externas/criticas  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/api-minimarket/index.ts`, `supabase/functions/facturas-ocr/index.ts`, `supabase/functions/api-assistant/index.ts`, `supabase/functions/api-proveedor/utils/http.ts`, `supabase/functions/api-minimarket/helpers/auth.ts`  
🔍 MÉTODO: Lectura de fetch con `AbortSignal.timeout` y controladores de timeout  
📊 HALLAZGO: Timeouts definidos y distribuidos (auth 5s, OCR 15s, storage 10s, proveedor HTTP helper, etc.).  
📌 EVIDENCIA: `AUTH_TIMEOUT_MS=5000` (`auth.ts` ~41); `FETCH_TIMEOUT_MS=15000` (`facturas-ocr` ~35); `AbortSignal.timeout(35_000)` para invocacion OCR desde gateway (~2260).  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D2-02 Sanitizacion de errores al cliente  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/api-minimarket/index.ts`  
🔍 MÉTODO: Lectura del catch global y respuesta final  
📊 HALLAZGO: Mensajes 5xx se sanitizan a texto generico, evitando filtrar detalles tecnicos.  
📌 EVIDENCIA: `appError.status >= 500 ? 'Error interno del servidor' : appError.message` en ~2647.  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D2-03 Errores silenciosos en flujos no bloqueantes  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/api-minimarket/index.ts`  
🔍 MÉTODO: Lectura de `try/catch` con `logger.warn` y sin propagacion  
📊 HALLAZGO: Persistencia de `precios_compra` y auto-validacion OCR pueden fallar silenciosamente para usuario.  
📌 EVIDENCIA: `PRECIO_COMPRA_INSERT_FAILED` (~1665-1667), `PRECIO_COMPRA_FACTURA_FAILED` (~2499-2501), `FACTURA_AUTO_VALIDATE_FAILED` (~2364).  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Exponer warning controlado en respuesta/evento para asegurar trazabilidad funcional, no solo log interno.

📍 VERIFICACIÓN: D3-01 Concurrencia en inventario/pagos (DB locking)  
📁 ARCHIVOS ANALIZADOS: `supabase/migrations/20260217200000_vuln003_004_concurrency_locks.sql`  
🔍 MÉTODO: Lectura SQL de SPs y locks  
📊 HALLAZGO: Se agregaron `FOR UPDATE` en stock, ordenes de compra y pedidos; mejora atomicidad.  
📌 EVIDENCIA: `FOR UPDATE` en ~45, ~83, ~143 del archivo de migracion.  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D3-02 Cancelacion atomica de reservas  
📁 ARCHIVOS ANALIZADOS: `supabase/migrations/20260218050000_add_sp_cancelar_reserva.sql`  
🔍 MÉTODO: Lectura SQL y guardas de estado  
📊 HALLAZGO: Cancelacion protegida con lock de fila y validacion de estado previo (`activa`).  
📌 EVIDENCIA: `FOR UPDATE` (~22) y `IF v_reserva.estado <> 'activa'` (~30-33).  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D3-03 Insercion parcial OCR sin transaccion global  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/facturas-ocr/index.ts`  
🔍 MÉTODO: Lectura del inserter batch/fallback  
📊 HALLAZGO: Si falla batch, fallback individual permite exito parcial de items sin rollback integral.  
📌 EVIDENCIA: `insertFacturaItemsBatch()` retorna `insertMode: 'fallback'` y contabiliza `failedItems` (~790-839).  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Definir politica transaccional para integridad estricta (todo/nada) o mantener parcial pero con remediacion automatizada obligatoria.

📍 VERIFICACIÓN: D3-04 Transiciones de estado de tareas  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/api-minimarket/index.ts`  
🔍 MÉTODO: Lectura de endpoints `/tareas/:id/completar` y `/cancelar`  
📊 HALLAZGO: Actualizan estado directamente sin verificar estado previo permitido.  
📌 EVIDENCIA: `updateData.estado='completada'` (~1383-1387) y `'cancelada'` (~1423-1428) sin guard de estado previo.  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Implementar maquina de estados explicita (pendiente->completada/cancelada; bloquear transiciones invalidas).

📍 VERIFICACIÓN: D4-01 Secrets hardcodeados en codigo  
📁 ARCHIVOS ANALIZADOS: repo completo (grep heuristico), tests  
🔍 MÉTODO: Busqueda regex de patrones key/JWT  
📊 HALLAZGO: No se detectaron secretos reales en codigo productivo; solo fixture JWT de test.  
📌 EVIDENCIA: Coincidencia unica en `tests/unit/strategic-high-value.test.ts:60` (`eyJ...abc_signature`).  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D4-02 Proteccion de archivos de entorno y docs de secretos  
📁 ARCHIVOS ANALIZADOS: `.gitignore`, `.env.example`, `.env.test.example`  
🔍 MÉTODO: Lectura de patrones y variables  
📊 HALLAZGO: `.env` y variantes estan ignorados; variables criticas principales documentadas.  
📌 EVIDENCIA: `.gitignore` incluye `**/.env` y `**/.env.*` (~118 y ~219+); `.env.example` incluye claves backend y frontend.  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Agregar variable faltante de frontend (ver D6-03).

📍 VERIFICACIÓN: D4-03 AuthN/AuthZ en endpoints sensibles  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/api-minimarket/index.ts`, `supabase/functions/api-assistant/index.ts`, `supabase/functions/_shared/internal-auth.ts`  
🔍 MÉTODO: Matriz ruta->checkRole/auth helper  
📊 HALLAZGO: Controles presentes en gateway y asistente; endpoints internos usan validacion estricta service role.  
📌 EVIDENCIA: Asistente admin-only (~616-619), internal auth compara exacto bearer/apikey (~41), gateway usa `checkRole(...)` en rutas mutativas.  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D5-01 Build y tamaño de artefactos frontend  
📁 ARCHIVOS ANALIZADOS: comando `pnpm -C minimarket-system build`  
🔍 MÉTODO: Ejecucion real  
📊 HALLAZGO: Build exitoso; existen chunks grandes que requieren seguimiento si escala UI/SDKs.  
📌 EVIDENCIA: `scanner-BB-WS6-1.js 457.28 kB`, `react-BwBtu1Xb.js 490.90 kB`, build PASS.  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Establecer budget de bundles y optimizar splitting en modulos pesados.

📍 VERIFICACIÓN: D5-02 Agregacion en memoria sin limite en reporte tareas  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/api-minimarket/index.ts` (aprox. 1169-1295)  
🔍 MÉTODO: Lectura de flujo de consulta y reduccion  
📊 HALLAZGO: Consulta `tareas_metricas` sin paginacion y agrega todo en memoria (`agregados`).  
📌 EVIDENCIA: `fetchWithParams(... tareas_metricas ...)` (~1217-1222) seguido de loop sobre todos los rows (~1226+) y sort final (~1293).  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Mover agregacion a SQL/SP o agregar paginacion/limites defensivos.

📍 VERIFICACIÓN: D5-03 Pruebas de performance auxiliares  
📁 ARCHIVOS ANALIZADOS: `tests/performance/load-testing.vitest.test.ts`, comando `npm run test:auxiliary`  
🔍 MÉTODO: Ejecucion de suite auxiliar  
📊 HALLAZGO: Pruebas de performance existentes pasan en sesion actual.  
📌 EVIDENCIA: `Test Files 3 passed`, `45 passed | 4 skipped` en `test:auxiliary`.  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Mantener baseline y agregar escenarios de concurrencia de negocio real.

📍 VERIFICACIÓN: D6-01 Separacion config dev/prod en UI/backend  
📁 ARCHIVOS ANALIZADOS: `minimarket-system/src/App.tsx`, `supabase/functions/api-minimarket/index.ts`, `.env.example`  
🔍 MÉTODO: Lectura de flags y defaults  
📊 HALLAZGO: Debug UI condicionado a DEV; `REQUIRE_ORIGIN` y allowlist configurables por env.  
📌 EVIDENCIA: `import.meta.env.DEV && <ReactQueryDevtools ...>` (~265); `REQUIRE_ORIGIN` leido en gateway (~182).  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D6-02 Guardrails de deploy para edge functions  
📁 ARCHIVOS ANALIZADOS: `deploy.sh`  
🔍 MÉTODO: Lectura de script de despliegue  
📊 HALLAZGO: Script salta `_shared` y fuerza `--no-verify-jwt` para `api-minimarket`.  
📌 EVIDENCIA: `_shared` skip (~365-369); deploy `api-minimarket --no-verify-jwt` (~380-383).  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D6-03 Cobertura de variables de entorno documentadas  
📁 ARCHIVOS ANALIZADOS: `.env.example`, `minimarket-system/.env.example`, `minimarket-system/src/lib/assistantApi.ts`, salida `env_audit.py`  
🔍 MÉTODO: Auditoria automatica + lectura puntual  
📊 HALLAZGO: Falta documentar `VITE_API_ASSISTANT_URL` en ejemplos de env.  
📌 EVIDENCIA: uso en `assistantApi.ts` (~11-13); `env_audit.py` reporta `missing_in_env_example: ["VITE_API_ASSISTANT_URL"]`.  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Agregar `VITE_API_ASSISTANT_URL` en `.env.example` y `minimarket-system/.env.example` con comentario de uso.

📍 VERIFICACIÓN: D7-01 Prevencion de doble accion en Facturas UI  
📁 ARCHIVOS ANALIZADOS: `minimarket-system/src/pages/Facturas.tsx`  
🔍 MÉTODO: Lectura de estado UI y disable de botones  
📊 HALLAZGO: Usa `Set<string>` para tracking concurrente (`extracting`/`applying`) y deshabilita botones durante operacion.  
📌 EVIDENCIA: estados en ~62-63; alta/baja del set en ~117-137 y ~186-196; botones `disabled={extracting.has(f.id)}` (~341) / `disabled={applying.has(f.id)}` (~364).  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D7-02 Flujo plan->confirm en Asistente IA  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/api-assistant/index.ts`, `supabase/functions/api-assistant/confirm-store.ts`, `minimarket-system/src/pages/Asistente.tsx`  
🔍 MÉTODO: Lectura de backend + frontend de confirmacion  
📊 HALLAZGO: Confirmacion de acciones de escritura con token single-use y TTL; reduce ejecuciones accidentales.  
📌 EVIDENCIA: `consumeConfirmToken(...)` en endpoint `/confirm` (~653), store in-memory TTL 120s y single-use (~28, ~74-85), UI elimina token tras confirmar/cancelar (~184-199, ~207-217).  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D7-03 Concurrencia de OCR extraer (misma factura)  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/api-minimarket/index.ts` (aprox. 2219-2275), `docs/closure/OPEN_ISSUES.md`  
🔍 MÉTODO: Lectura de flujo gateway + backlog canonico  
📊 HALLAZGO: Gateway valida estado y despacha OCR, pero no hace lock previo de factura en esa ruta; riesgo de carrera simultanea.  
📌 EVIDENCIA: Lectura `facturas_ingesta` y dispatch posterior sin lock en ~2227-2262; issue RC-01 documentado en `OPEN_ISSUES.md` (~24).  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Aplicar lock optimista/pesimista previo al dispatch de OCR para evitar doble extraccion concurrente.

📍 VERIFICACIÓN: D8-01 Vulnerabilidades en dependencias root  
📁 ARCHIVOS ANALIZADOS: comando `npm audit --json` (raiz)  
🔍 MÉTODO: Ejecucion real  
📊 HALLAZGO: Sin vulnerabilidades reportadas en el conjunto root auditado.  
📌 EVIDENCIA: `"total": 0` en metadata de vulnerabilidades.  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D8-02 Vulnerabilidades en dependencias frontend (pnpm)  
📁 ARCHIVOS ANALIZADOS: comando `pnpm -C minimarket-system audit --json`  
🔍 MÉTODO: Ejecucion real y clasificacion de advisories  
📊 HALLAZGO: 13 advisories (12 high, 1 moderate), principalmente transitivos/toolchain (`minimatch`, `rollup`, `serialize-javascript`, `ajv`).  
📌 EVIDENCIA: `metadata.vulnerabilities: { moderate: 1, high: 12 }` y resoluciones sugeridas en salida de audit.  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Plan de upgrade/overrides controlado con regresion tests (priorizar paquetes con exploitabilidad real en el contexto del proyecto).

📍 VERIFICACIÓN: D8-03 Estabilidad de versiones (alpha/beta/rc/deprecated)  
📁 ARCHIVOS ANALIZADOS: `package.json`, `minimarket-system/package.json`  
🔍 MÉTODO: Lectura de manifiestos  
📊 HALLAZGO: No se observaron versiones alpha/beta/rc declaradas de forma explicita.  
📌 EVIDENCIA: Dependencias fijadas en ranges estables (`^` / versiones semver normales) en ambos manifiestos.  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Mantener control de changelogs en upgrades mayores.

📍 VERIFICACIÓN: D9-01 Circuit breaker compartido con fallback  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/_shared/circuit-breaker.ts`, `supabase/functions/api-minimarket/index.ts`  
🔍 MÉTODO: Lectura de breaker local+RPC y rutas de fallback  
📊 HALLAZGO: Existe breaker con fallback in-memory cuando RPC no esta disponible; mejora degradacion controlada.  
📌 EVIDENCIA: `checkCircuitBreakerShared(...)` + fallback local (~210+), uso en gateway (~261-287).  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D9-02 Recuperacion ante fallo parcial en aplicar factura  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/api-minimarket/index.ts`, `docs/closure/OPEN_ISSUES.md`  
🔍 MÉTODO: Lectura de logica de compensacion y referencia documental de cierre  
📊 HALLAZGO: Se implemento compensacion de stock y limpieza de link idempotente para reintentos limpios.  
📌 EVIDENCIA: OPEN_ISSUES OCR-011 cerrado, evidencia en `index.ts` líneas referenciadas 2513-2579.  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D9-03 Persistencia de confirm tokens del asistente  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/api-assistant/confirm-store.ts`  
🔍 MÉTODO: Lectura de almacenamiento de tokens  
📊 HALLAZGO: Store en memoria; un restart de edge puede invalidar planes pendientes antes de confirmar.  
📌 EVIDENCIA: `const store = new Map...` (~31), TTL 120s (~28), sin persistencia DB.  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Si la operacion requiere mayor resiliencia, mover confirm tokens a almacenamiento persistente con expiracion.

📍 VERIFICACIÓN: D10-01 Build/lint/typecheck de produccion  
📁 ARCHIVOS ANALIZADOS: comandos de validacion en sesion  
🔍 MÉTODO: Ejecucion real  
📊 HALLAZGO: Build/lint/tsc en verde.  
📌 EVIDENCIA: `pnpm -C minimarket-system build` PASS, `lint` PASS, `tsc -b` exit 0.  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D10-02 Health checks de runtime  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/api-minimarket/index.ts`, `supabase/functions/api-assistant/index.ts`, docs API/openapi  
🔍 MÉTODO: Lectura de endpoints y docs  
📊 HALLAZGO: Endpoints de health presentes en servicios principales.  
📌 EVIDENCIA: `/health` en gateway (~2208-2213) y asistente (~600-602); documentado en `docs/API_README.md` y `docs/api-openapi-3.1.yaml`.  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D10-03 Reproducibilidad de deploy  
📁 ARCHIVOS ANALIZADOS: `deploy.sh`, `docs/DEPLOYMENT_GUIDE.md`  
🔍 MÉTODO: Lectura de automatizacion y pasos manuales  
📊 HALLAZGO: Flujo mayormente scriptable; existe prompt interactivo cuando hay cambios sin commit (puede romper automatizacion estricta).  
📌 EVIDENCIA: `read -p "¿Continuar con deployment?"` en `deploy.sh` (~132).  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Para pipeline 100% no interactivo, usar modo no-interactivo controlado por flag/entorno en CI.

📍 VERIFICACIÓN: D11-01 Logging estructurado  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/_shared/logger.ts`  
🔍 MÉTODO: Lectura del logger base  
📊 HALLAZGO: Logs JSON con `ts`, `level`, `scope`, `message` y metadata adicional.  
📌 EVIDENCIA: payload de `write()` construido en ~50-57 con timestamp ISO en ~51.  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D11-02 Trazabilidad con request-id end-to-end  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/api-minimarket/index.ts`, `supabase/functions/api-minimarket/helpers/auth.ts`, `minimarket-system/src/lib/apiClient.ts`  
🔍 MÉTODO: Lectura de generacion/propagacion de `x-request-id`  
📊 HALLAZGO: Request-id propagado desde frontend al backend y reenviado a llamadas internas.  
📌 EVIDENCIA: frontend agrega `x-request-id` (~103-109 en `apiClient.ts`), backend lo sanitiza (~146-150) y lo reusa en headers internos (~349 en `createRequestHeaders`).  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D11-03 Monitoreo operativo documentado  
📁 ARCHIVOS ANALIZADOS: `docs/MONITORING.md`, `docs/OPERATIONS_RUNBOOK.md`  
🔍 MÉTODO: Lectura documental  
📊 HALLAZGO: Hay runbooks, umbrales, escalacion y comandos base de chequeo.  
📌 EVIDENCIA: `MONITORING.md` define chequeo diario/semanal y umbrales (~15-57); `OPERATIONS_RUNBOOK.md` define incidentes/escalacion (~49-122).  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Mantener fecha de actualizacion sincronizada con cambios relevantes.

📍 VERIFICACIÓN: D12-01 Documentacion de despliegue y rollback  
📁 ARCHIVOS ANALIZADOS: `docs/DEPLOYMENT_GUIDE.md`, `docs/OPERATIONS_RUNBOOK.md`, `docs/TROUBLESHOOTING.md`  
🔍 MÉTODO: Lectura documental cruzada  
📊 HALLAZGO: Existe documentacion operativa minima y procedimientos de rollback/escalacion.  
📌 EVIDENCIA: `DEPLOYMENT_GUIDE.md` secciones 3-5 y rollback (~57+); runbook/tshoot activos con checklists.  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D12-02 Coherencia README vs estado actual real  
📁 ARCHIVOS ANALIZADOS: `README.md`, comandos de test ejecutados, `docs/ESTADO_ACTUAL.md`  
🔍 MÉTODO: Contraste de metadatos declarados vs evidencia actual  
📊 HALLAZGO: README principal esta desactualizado en conteos/estado (snapshot viejo).  
📌 EVIDENCIA: README declara `2026-02-27` y `1733/1733 PASS` (~5-9), mientras ejecucion actual da `1905/1905` y docs ejecutivas estan en 2026-03-02.  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Actualizar README para reflejar estado canonico vigente o derivar siempre a `docs/ESTADO_ACTUAL.md` sin numericas fijas.

📍 VERIFICACIÓN: D12-03 Contratos API y health documentados  
📁 ARCHIVOS ANALIZADOS: `docs/API_README.md`, `docs/api-openapi-3.1.yaml`  
🔍 MÉTODO: Verificacion de presencia y referencias  
📊 HALLAZGO: Contratos API presentes y health endpoint documentado.  
📌 EVIDENCIA: rutas de health visibles en ambos documentos (`API_README` ~287/560; OpenAPI `/health` ~1655+).  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D13-01 Manejo de datos personales en handlers de clientes/CC  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/api-minimarket/handlers/clientes.ts`, `.../cuentas_corrientes.ts`  
🔍 MÉTODO: Lectura de validaciones y campos PII tratados  
📊 HALLAZGO: Se validan tipos/formatos basicos y roles en operaciones sensibles; no se observan mascaras/encriptacion aplicativa adicional.  
📌 EVIDENCIA: parse/validacion de campos en `buildClientePatch` (~78-135) y pago CC con `cliente_id`+`monto` validado (~84-103).  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Definir politica explicita de retencion/minimizacion de PII y controles de acceso/reporting sobre esos datos.

📍 VERIFICACIÓN: D13-02 Exposicion de PII en logs de notificaciones  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/cron-notifications/index.ts`  
🔍 MÉTODO: Lectura de logs de envio email  
📊 HALLAZGO: Logs reportan conteo y metadatos tecnicos, no lista de destinatarios ni contenido completo.  
📌 EVIDENCIA: `SIMULATION_EMAIL_SEND` y `REAL_EMAIL_SEND` registran `toCount/messageId/status` (~873-919).  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D13-03 Cumplimiento formal y derechos de datos  
📁 ARCHIVOS ANALIZADOS: `docs/SECURITY.md`, handlers de clientes  
🔍 MÉTODO: Lectura documental + busqueda de capacidades de borrado por solicitud  
📊 HALLAZGO: El proyecto declara explicitamente no cumplir estandares formales (GDPR/HIPAA/PCI); no se identifico flujo explicito de "borrado por solicitud" en endpoints auditados.  
📌 EVIDENCIA: `docs/SECURITY.md` indica "NO cumple" (~175); en handlers revisados no hay endpoint explicito de eliminacion de datos personales.  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Si evoluciona a uso regulado o externo, implementar politica y flujo operativo para acceso/eliminacion de datos.

📍 VERIFICACIÓN: D14-01 Dependencia critica externa del OCR  
📁 ARCHIVOS ANALIZADOS: `docs/closure/OPEN_ISSUES.md`, `supabase/functions/facturas-ocr/index.ts`  
🔍 MÉTODO: Cruce de issue canonico + runtime de OCR  
📊 HALLAZGO: OCR productivo sigue bloqueado por servicio externo (GCV/billing), no por logica interna local.  
📌 EVIDENCIA: `OPEN_ISSUES.md` OCR-007 (líneas ~8-16 y ~80-82) describe bloqueo; function retorna errores timeout/config segun entorno externo.  
🏷️ SEVERIDAD: 🔴 CRÍTICO  
🔧 ACCIÓN REQUERIDA: Activar billing/proyecto GCP para restaurar OCR E2E real.

📍 VERIFICACIÓN: D14-02 Backlog MEDIUM de auditoria aun abierto  
📁 ARCHIVOS ANALIZADOS: `docs/closure/OPEN_ISSUES.md`, `supabase/functions/api-minimarket/index.ts`  
🔍 MÉTODO: Cruce entre backlog y codigo actual  
📊 HALLAZGO: Persisten hallazgos de concurrencia/idempotencia/errores no bloqueantes ya documentados.  
📌 EVIDENCIA: `AUDIT-001` abierto (~19-33) y evidencia en rutas correspondientes (idempotencia parcial, tarea estado, reportes memoria).  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Cerrar backlog por prioridad operativa (primero idempotencia + locks de OCR dispatch).

📍 VERIFICACIÓN: D14-03 Riesgo de drift documental operacional  
📁 ARCHIVOS ANALIZADOS: `README.md`, `docs/ESTADO_ACTUAL.md`, `docs/PRODUCTION_GATE_REPORT.md`  
🔍 MÉTODO: Comparacion de snapshots temporales  
📊 HALLAZGO: El estado canonico esta actualizado, pero README conserva metricas historicas que pueden inducir decisiones erradas.  
📌 EVIDENCIA: README muestra datos 2026-02-27 (~5-10) vs `ESTADO_ACTUAL` 2026-03-02 y tests actuales 1905/1905.  
🏷️ SEVERIDAD: 🟡 IMPORTANTE  
🔧 ACCIÓN REQUERIDA: Normalizar una unica fuente visible en README o automatizar refresh de metricas.

📍 VERIFICACIÓN: D10/D11 Soporte de comandos de calidad y reproducibilidad  
📁 ARCHIVOS ANALIZADOS: `package.json`, `minimarket-system/package.json`, comandos ejecutados  
🔍 MÉTODO: Lectura scripts + ejecucion real  
📊 HALLAZGO: Calidad automatizada robusta (tests, coverage, lint, build) disponible y operativa en la sesion.  
📌 EVIDENCIA: scripts `test`, `test:auxiliary`, `test:coverage`, `lint`, `build` definidos y ejecutados en verde.  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D4/D6 CORS estricto y origenes permitidos  
📁 ARCHIVOS ANALIZADOS: `supabase/functions/_shared/cors.ts`, `supabase/functions/api-minimarket/index.ts`, `supabase/functions/api-proveedor/index.ts`, `.env.example`  
🔍 MÉTODO: Lectura de validadores de origin y config  
📊 HALLAZGO: CORS por allowlist con rechazo de origen no permitido y exigencia de Origin en browser-like cuando corresponde.  
📌 EVIDENCIA: `validateOrigin` en `_shared/cors.ts` (~47-82); bloqueos en gateway (~203-213) y proveedor (~268-271).  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Mantener `ALLOWED_ORIGINS` de produccion sin wildcard.

📍 VERIFICACIÓN: D8/D11 Gaps de auditoria automatizada de cron auth (falso positivo evitado)  
📁 ARCHIVOS ANALIZADOS: `supabase/migrations/20260211055140_fix_cron_jobs_auth_and_maintenance.sql`  
🔍 MÉTODO: Parseo de `net.http_post` ignorando comentarios  
📊 HALLAZGO: No se detectaron bloques activos sin `Authorization`; los faltantes detectados inicialmente estaban en SQL comentado de rollback.  
📌 EVIDENCIA: Parseo final ignorando líneas comentadas resultó sin hallazgos activos; bloque comentado visible ~167-205.  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Ninguna inmediata.

📍 VERIFICACIÓN: D5/D8 Cobertura de pruebas y estabilidad de regresion  
📁 ARCHIVOS ANALIZADOS: comandos `npm test`, `npm run test:coverage`, `npm run test:auxiliary`  
🔍 MÉTODO: Ejecucion real  
📊 HALLAZGO: Suite amplia y estable en esta sesion (unit/integration/component/auxiliary).  
📌 EVIDENCIA: `85 test files / 1905 tests PASS`; coverage global >90/82/91/91; auxiliary `45 PASS, 4 skipped`.  
🏷️ SEVERIDAD: 🟢 CORRECTO  
🔧 ACCIÓN REQUERIDA: Mantener umbral de coverage y agregar casos de concurrencia E2E real.

📍 VERIFICACIÓN: D12/D13 Limitaciones de verificacion por entorno  
📁 ARCHIVOS ANALIZADOS: entorno local + docs  
🔍 MÉTODO: Evaluacion de capacidad tecnica de prueba en esta sesion  
📊 HALLAZGO: No se verifico comportamiento real en cloud de billing GCP/Supabase remoto productivo ni cumplimiento legal formal en operación real.  
📌 EVIDENCIA: OCR-007 permanece bloqueado externamente; compliance formal declarado como no implementado (`SECURITY.md` ~175).  
🏷️ SEVERIDAD: ⚪ NO APLICA  
🔧 ACCIÓN REQUERIDA: Validar en entorno de produccion real cuando el owner habilite dependencias externas y requisitos regulatorios.

---

## FASE 5 — REPORTE FINAL ESTRUCTURADO

## 🎯 VEREDICTO GENERAL
**⚠️ LISTO CON CONDICIONES**

El sistema base esta solido y las pruebas automatizadas estan en verde, pero hay condiciones operativas claras antes de considerar cierre definitivo de riesgo: OCR bloqueado por dependencia externa y backlog MEDIUM de concurrencia/idempotencia aun abierto.

---

## 📋 RESUMEN EJECUTIVO
El proyecto muestra buena madurez tecnica en seguridad base, testing y observabilidad.  
La arquitectura backend/frontend esta operativa y los controles principales existen.  
Persisten riesgos importantes no bloqueantes (idempotencia parcial, transiciones de estado, agregaciones en memoria, drift documental).  
El unico bloqueo critico actual es externo al codigo (GCV/billing para OCR).  
Para uso interno con baja concurrencia, es usable; para escalar operadores/volumen, requiere hardening puntual.

---

## 🔴 HALLAZGOS CRÍTICOS — BLOQUEAN PRODUCCIÓN
1. **OCR externo bloqueado por dependencia GCP (OCR-007)**
   - 📁 Archivo(s): `docs/closure/OPEN_ISSUES.md` (OCR-007), `supabase/functions/facturas-ocr/index.ts`
   - 💥 Riesgo: el flujo OCR real no puede ejecutarse de punta a punta; facturas quedan sin extraccion automatica operativa.
   - 🔧 Solución: activar billing/proyecto GCP y revalidar flujo OCR E2E con evidencia de requests exitosas.
   - ⏱️ Esfuerzo estimado: medio (mayormente operativo externo).

---

## 🟡 HALLAZGOS IMPORTANTES — NO BLOQUEAN PERO DEBEN CORREGIRSE
1. **Idempotencia incompleta en POST de inventario/recepcion**
   - 📁 Archivo(s): `supabase/functions/api-minimarket/index.ts` (~1453, ~1602, ~1722)
   - 💥 Riesgo: duplicados por retries/doble click bajo concurrencia.
   - 🔧 Solución: exigir `Idempotency-Key` y resolver en DB/SP como en reservas/ventas.
   - ⏱️ Esfuerzo estimado: medio.
2. **Transiciones de tareas sin guard de estado previo**
   - 📁 Archivo(s): `supabase/functions/api-minimarket/index.ts` (~1374-1450)
   - 💥 Riesgo: estados invalidos/inconsistentes en tareas.
   - 🔧 Solución: aplicar maquina de estados y validaciones previas a update.
   - ⏱️ Esfuerzo estimado: bajo-medio.
3. **Insercion parcial OCR sin rollback integral**
   - 📁 Archivo(s): `supabase/functions/facturas-ocr/index.ts` (~790-839)
   - 💥 Riesgo: factura con items parcialmente persistidos, mayor complejidad operativa.
   - 🔧 Solución: definir modo transaccional (todo/nada) o pipeline de reconciliacion automatica obligatoria.
   - ⏱️ Esfuerzo estimado: medio.
4. **Advisories de dependencias frontend (pnpm audit)**
   - 📁 Archivo(s): `minimarket-system/package.json` + lock/transitivas
   - 💥 Riesgo: deuda de seguridad/transitivas y posible bloqueo futuro de compliance interno.
   - 🔧 Solución: plan de upgrade y overrides con regression suite.
   - ⏱️ Esfuerzo estimado: medio.
5. **Variable de entorno usada y no documentada (`VITE_API_ASSISTANT_URL`)**
   - 📁 Archivo(s): `minimarket-system/src/lib/assistantApi.ts`, `.env.example`, `minimarket-system/.env.example`
   - 💥 Riesgo: despliegues ambiguos o mal configurados del asistente.
   - 🔧 Solución: documentar variable en ejemplos de env.
   - ⏱️ Esfuerzo estimado: bajo.
6. **README principal desactualizado respecto al estado real**
   - 📁 Archivo(s): `README.md`
   - 💥 Riesgo: decisiones operativas tomadas sobre datos historicos.
   - 🔧 Solución: sincronizar README con `docs/ESTADO_ACTUAL.md` o eliminar metricas fijas.
   - ⏱️ Esfuerzo estimado: bajo.

---

## 🔵 HALLAZGOS MENORES — MEJORAS RECOMENDADAS
1. **Prompt interactivo en deploy script para repo sucio**
   - 📁 Archivo(s): `deploy.sh` (~132)
   - 🔧 Solución: modo no interactivo explicito para CI.
2. **Tokens de confirmacion del asistente en memoria**
   - 📁 Archivo(s): `supabase/functions/api-assistant/confirm-store.ts`
   - 🔧 Solución: persistencia opcional en DB si se requiere alta resiliencia.
3. **Agregacion de `efectividad-tareas` en memoria**
   - 📁 Archivo(s): `supabase/functions/api-minimarket/index.ts` (~1217-1295)
   - 🔧 Solución: pushdown de agregacion a SQL con limites.

---

## 📊 PUNTUACIÓN POR DIMENSIÓN

| Dimensión | Puntuación (1-10) | Estado |
|---|---|---|
| D1: Lógica de negocio | 7/10 | 🟡 Correcta en general, con gaps de atomicidad/idempotencia puntual |
| D2: Manejo de errores | 8/10 | 🟢 Buen manejo y sanitización; quedan warns silenciosos no funcionales |
| D3: Integridad de datos | 7/10 | 🟡 Locks/SP sólidos, pero parcialidad OCR y estados de tareas sin guardas |
| D4: Seguridad | 8/10 | 🟢 Controles auth/CORS/rate-limit correctos para contexto interno |
| D5: Rendimiento | 7/10 | 🟡 Build estable; hay hotspots de agregación en memoria y chunks grandes |
| D6: Config prod vs dev | 8/10 | 🟢 Guardrails sólidos; falta documentar una env clave |
| D7: Flujo E2E | 7/10 | 🟡 UX y confirmaciones bien; falta lock pre-dispatch OCR concurrente |
| D8: Dependencias | 6/10 | 🟡 Root limpio, frontend con advisories pendientes |
| D9: Resiliencia | 7/10 | 🟡 Breakers/rollback buenos; tokens en memoria y deuda puntual abierta |
| D10: Infraestructura | 8/10 | 🟢 Deploy/health bien definidos; mejorar no-interactivo CI |
| D11: Monitoreo | 8/10 | 🟢 Logging estructurado y request-id consistente |
| D12: Documentación | 7/10 | 🟡 Runbooks buenos, README principal con drift |
| D13: Cumplimiento | 6/10 | 🟡 Sin compliance formal declarado; falta marco de privacidad/eliminacion |
| D14: Otros riesgos | 7/10 | 🟡 Riesgos identificados y documentados, no todos cerrados |
| **PROMEDIO GENERAL** | **7.2/10** | |

ESCALA:
- 9-10: Excelente, listo para producción
- 7-8: Bueno, mejoras menores recomendadas  
- 5-6: Aceptable, necesita correcciones importantes
- 3-4: Deficiente, riesgos significativos
- 1-2: Crítico, no debe ir a producción sin correcciones mayores

---

## 🗺️ PLAN DE ACCIÓN ORDENADO POR PRIORIDAD

### PASO 1 (HACER PRIMERO): Desbloquear OCR externo
- Qué: resolver dependencia GCP (billing/clave/proyecto) y revalidar OCR E2E.
- Dónde: GCP Console + `docs/closure/OPEN_ISSUES.md` (OCR-007).
- Cómo: activar billing, ejecutar prueba real de `facturas-ocr`, registrar evidencia en OPEN_ISSUES.
- Esfuerzo: medio.
- Impacto: habilita modulo OCR real en produccion.

### PASO 2: Cerrar idempotencia faltante en 3 POST criticos
- Qué: agregar `Idempotency-Key` y resolución transaccional.
- Dónde: `api-minimarket/index.ts` rutas `/deposito/movimiento`, `/deposito/ingreso`, `/compras/recepcion`.
- Cómo: replicar patron de `/reservas` y `/ventas` + soporte DB.
- Esfuerzo: medio.
- Impacto: evita duplicados bajo retry/doble click.

### PASO 3: Enforzar maquina de estados en tareas
- Qué: validar transiciones permitidas antes de completar/cancelar.
- Dónde: `api-minimarket/index.ts` endpoints de tareas.
- Cómo: check estado actual + return `409` en transicion invalida.
- Esfuerzo: bajo-medio.
- Impacto: evita inconsistencias de negocio.

### PASO 4: Endurecer atomicidad del flujo de precios
- Qué: mover validacion de margen minimo al nivel SP transaccional.
- Dónde: `/precios/aplicar` + SP asociado.
- Cómo: realizar chequeo y aplicacion en la misma unidad atomica.
- Esfuerzo: medio.
- Impacto: elimina riesgo de dato stale en concurrencia.

### PASO 5: Remediar advisories frontend
- Qué: actualizar transitivas vulnerables y validar regresion.
- Dónde: `minimarket-system/package.json` / lock / overrides.
- Cómo: upgrade incremental + `npm test`, `test:auxiliary`, `build`, `lint`.
- Esfuerzo: medio.
- Impacto: reduce deuda de seguridad y riesgo de cadena.

### PASO 6: Corregir drift documental operativo
- Qué: actualizar README y env examples.
- Dónde: `README.md`, `.env.example`, `minimarket-system/.env.example`.
- Cómo: reflejar estado canonico y documentar `VITE_API_ASSISTANT_URL`.
- Esfuerzo: bajo.
- Impacto: evita errores de despliegue y falsa seguridad documental.

### PASO 7: Limitar agregaciones en memoria
- Qué: evitar procesamiento sin limites en `/reportes/efectividad-tareas`.
- Dónde: `api-minimarket/index.ts`.
- Cómo: mover agregacion a SQL/SP y/o aplicar limite duro/paginacion.
- Esfuerzo: medio.
- Impacto: mejora estabilidad ante crecimiento de datos.

### PASO 8: Evaluar persistencia de confirm_token (opcional)
- Qué: persistir tokens de confirmacion de asistente en DB.
- Dónde: `api-assistant/confirm-store.ts`.
- Cómo: tabla TTL + consume atomico por usuario/token.
- Esfuerzo: medio.
- Impacto: mejora resiliencia ante restart de edge.

---

## ❓ PREGUNTA FINAL

"Ya tenés el reporte completo de auditoría de tu proyecto. 

¿Querés que:
A) Ejecute las correcciones CRÍTICAS ahora, una por una, con tu aprobación en cada paso?
B) Ejecute TODAS las correcciones (críticas + importantes) de forma secuencial?
C) Te genere los archivos/código corregido para que vos lo revises antes de aplicar?
D) Profundicemos en algún hallazgo específico que te preocupe?

¿Qué preferís?"

---

## 🧾 AJUSTE POSTERIOR — VERIFICACIÓN CRUZADA (2026-03-02)

Se realizó verificación cruzada de hallazgos contra código fuente real (sin supuestos).  
Resultado consolidado del cruce: **17 confirmados, 5 parciales, 3 corregidos/desactualizados, 1 no verificable solo por lectura de código**.

### Correcciones relevantes confirmadas por evidencia
1. **`sp_movimiento_inventario` con `FOR UPDATE`**  
   Estado: **corregido/desactualizado** en reportes previos que indicaban ausencia.  
   Evidencia: `supabase/migrations/20260217200000_vuln003_004_concurrency_locks.sql` (bloqueos `FOR UPDATE` en lectura de `stock_deposito` y `ordenes_compra`).

2. **FK con `ON DELETE CASCADE` en tablas críticas**  
   Estado: **confirmado**.  
   Evidencia:  
   - `stock_deposito -> productos` en `supabase/migrations/20260109070000_create_core_tables.sql`.  
   - `cuentas_corrientes_movimientos -> clientes` en `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql`.

3. **Headers CSP/HSTS faltantes en Cloudflare**  
   Estado: **confirmado**.  
   Evidencia: `minimarket-system/deploy/cloudflare/_headers` no define `Content-Security-Policy` ni `Strict-Transport-Security`.

4. **Idempotencia faltante en 3 endpoints de depósito**  
   Estado: **confirmado**.  
   Evidencia: `supabase/functions/api-minimarket/index.ts` en rutas `POST /deposito/movimiento`, `POST /deposito/ingreso`, `POST /compras/recepcion` sin lectura de `idempotency-key` (a diferencia de `/reservas` y `/ventas`).

5. **`VITE_USE_MOCKS` sin guard explícito anti-producción**  
   Estado: **confirmado**.  
   Evidencia: `minimarket-system/src/lib/apiClient.ts` y `minimarket-system/src/lib/supabase.ts`.

6. **`cache_proveedor` sin RLS explícito**  
   Estado: **parcial** (sin `ENABLE RLS`, pero con mitigación de permisos).  
   Evidencia: tabla creada en `supabase/migrations/20251103_create_cache_proveedor.sql`; `REVOKE` a `anon` en `supabase/migrations/20260131020000_security_advisor_mitigations.sql`.

7. **Timing-safe compare en auth interna**  
   Estado: **confirmado** como faltante.  
   Evidencia: comparación directa en `supabase/functions/_shared/internal-auth.ts`.

8. **Constraints de integridad faltantes**  
   Estado: **confirmado** para:  
   - `precio_costo >= 0` (no presente)  
   - `stock_maximo >= stock_minimo` (no presente)  
   - `monto_pagado <= monto_total` (no presente como `CHECK` de tabla)  
   Evidencia: definiciones en `supabase/migrations/20260109070000_create_core_tables.sql` y `supabase/migrations/20260206010000_create_pedidos.sql`.

9. **README desactualizado**  
   Estado: **confirmado**.  
   Evidencia: `README.md` mantiene métricas históricas (`1733` tests) no alineadas al estado canónico actual.

10. **Tamaño chunk scanner**  
    Estado: **confirmado** (vigente).  
    Evidencia de build real: `dist/assets/scanner-*.js` ~`116.76 kB` gzip.

### Ajustes de precisión sobre conteos/afirmaciones numéricas
- Conteo `as any` en frontend productivo (sin tests): **actual 6**, por lo que cifras mayores en documentos paralelos quedaron desactualizadas.
- Cobertura de audit trail en gateway: existe cobertura parcial; cualquier porcentaje exacto debe tratarse como métrica estimada salvo medición formal automatizada.

### Punto no verificable solo por lectura de código
- **OCR-007 (bloqueo GCP billing)**: confirmado documentalmente en `docs/closure/OPEN_ISSUES.md`, pero su estado operativo final depende de validación en infraestructura externa (GCP/Supabase runtime).
