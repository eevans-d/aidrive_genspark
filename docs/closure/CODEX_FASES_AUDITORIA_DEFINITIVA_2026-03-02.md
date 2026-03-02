# CODEX - Fases de Auditoria (Version Definitiva)
**Fecha:** 2026-03-02 (UTC)  
**Repositorio:** `aidrive_genspark`  
**Autor:** Codex  
**Modo de trabajo:** Solo lectura + ejecucion de comandos + documentacion (sin cambios de codigo fuente)

---

## FASE 0 - IDENTIFICACION DEL PROYECTO (CONCLUIDA)

### 0.1 Identificacion inicial verificada
- Tipo de proyecto identificado: plataforma full-stack interna para gestion de minimarket, con frontend React/Vite y backend Supabase Edge Functions + Postgres.
- Tecnologias detectadas: TypeScript, React 18, Vite, Vitest, Playwright, Supabase (Edge Functions + SQL migrations), Deno, pnpm/npm, Tailwind, Zod, Sentry (SDK).
- Proposito principal identificado: operar ventas/stock/pedidos/facturas/clientes/proveedores, con OCR de facturas y un asistente IA para flujos operativos.

### 0.2 Respuestas del usuario incorporadas
- Uso: interno.
- Escenario prioritario: ninguno puntual; revision integral ("todo bajo la lupa").
- Carga esperada: hasta 10 usuarios simultaneos, 20-50 operaciones/interacciones por dia.
- Despliegue: el usuario delega continuidad segun hallazgos ("si no hay problema, seguimos con lo que mencionas").

### 0.3 Supuestos operativos explicitados
- Se asume presencia de datos sensibles operativos (clientes, cuentas corrientes, autenticacion, facturacion) hasta nueva confirmacion.

---

## FASE 1 - RECONOCIMIENTO PROFUNDO (CONCLUIDA)

### 1.1 Analisis estructural
- Estructura del repo mapeada; se verifico presencia de `minimarket-system/`, `supabase/functions/`, `supabase/migrations/`, `tests/`, `docs/`.
- Entrypoints verificados:
- Frontend: `minimarket-system/src/main.tsx`, `minimarket-system/src/App.tsx`.
- Backend gateway principal: `supabase/functions/api-minimarket/index.ts`.
- Archivos de configuracion verificados: `package.json` (raiz y frontend), `supabase/config.toml`, `.env.example`, `.env.test.example`, `vitest*.config.ts`, `deploy.sh`.

### 1.2 Analisis de codigo real (lectura focalizada de modulos criticos)
- Gateway/API minimarket: `supabase/functions/api-minimarket/index.ts` y handlers clave (`pedidos.ts`, `ventas.ts`, `clientes.ts`, `cuentas_corrientes.ts`, `search.ts`, `insights.ts`, `reservas.ts`).
- Infra compartida: `supabase/functions/_shared/cors.ts`, `_shared/errors.ts`, `_shared/rate-limit.ts`, `_shared/circuit-breaker.ts`, `_shared/audit.ts`, `_shared/logger.ts`, `_shared/internal-auth.ts`, `_shared/response.ts`.
- OCR y asistente: `supabase/functions/facturas-ocr/index.ts`, `facturas-ocr/helpers.ts`, `api-assistant/index.ts`, `api-assistant/parser.ts`, `api-assistant/confirm-store.ts`, `api-assistant/auth.ts`.
- Integracion proveedor/scraper: `supabase/functions/api-proveedor/index.ts`, `api-proveedor/router.ts`, `api-proveedor/validators.ts`, `api-proveedor/utils/{http,auth,cache}.ts`, `supabase/functions/scraper-maxiconsumo/{index,config,scraping,matching,parsing,storage,cache,anti-detection}.ts`.
- Frontend de negocio: `minimarket-system/src/pages/{Facturas,Pedidos,Asistente,Login}.tsx`, `minimarket-system/src/lib/apiClient.ts`.

### 1.3 Analisis de tests existentes
- Inventario verificado de suites unitarias/contratos/performance/security.
- Tests de frontend y backend presentes en `tests/` y `minimarket-system/src/**/*.test.tsx`.
- Cobertura de error paths observada en multiples suites (no solo caminos felices).

### 1.4 Analisis de dependencias
- Manifest revisado en raiz (`package.json`) y frontend (`minimarket-system/package.json`).
- Se ejecutaron auditorias de vulnerabilidades para npm (raiz) y pnpm (frontend).

### 1.5 Analisis de flujo completo (trazado logico)
- Flujo trazado: autenticacion -> navegacion protegida -> operaciones de stock/pedidos/facturas/asistente -> persistencia/reportes.
- Puntos de falla mapeados: validacion de input, dependencia de servicios externos, concurrencia de reservas/stock, errores de red, recuperacion post-fallo.

### 1.6 Ejecucion de comandos diagnosticos (evidencia real)
- `pnpm -C minimarket-system build` -> PASS.
- `pnpm -C minimarket-system lint` -> PASS.
- `pnpm -C minimarket-system exec tsc -b --pretty false` -> PASS.
- `npm test` -> PASS, **85** archivos de test y **1905** tests en verde.
- `npm run test:auxiliary` -> PASS, **45** tests en verde y **4** skipped (smoke opcional/credenciales).
- `npm audit --json` (raiz) -> **0 vulnerabilidades**.
- `pnpm -C minimarket-system audit --json` -> **13 advisories** transitivos (12 high, 1 moderate), concentrados en toolchain (`minimatch`, `rollup`, `serialize-javascript`, `ajv`).

---

## FASE 2 - PLAN DE AUDITORIA DETALLADO (VERSION DEFINITIVA CODEX)

**Cobertura definida:** 14 dimensiones, 74 verificaciones especificas.  
**Criterio de diseno del plan:** enfoque de produccion real para uso interno, con prioridad en integridad de datos y seguridad operativa.

### D1: Validacion de logica de negocio con datos reales
- Que se verificara: reglas/calculos en `supabase/functions/api-minimarket/handlers/pedidos.ts`, `ventas.ts`, `reservas.ts`, `supabase/functions/facturas-ocr/helpers.ts`, `minimarket-system/src/pages/Facturas.tsx`.
- Riesgos buscados: calculos incorrectos, inconsistencia por reintentos, reglas implicitas faltantes, edge-cases no contemplados.
- Metodo: trazado input->transformacion->persistencia->respuesta + contraste con tests existentes y validacion de idempotencia.

### D2: Manejo de errores y situaciones imprevistas
- Que se verificara: control de errores en `supabase/functions/api-minimarket/index.ts`, `_shared/errors.ts`, `supabase/functions/api-proveedor/utils/http.ts`, `supabase/functions/api-assistant/index.ts`.
- Riesgos buscados: errores silenciosos, stack traces al usuario, falta de timeout/retry, degradacion incorrecta ante fallos externos.
- Metodo: inspeccion exhaustiva de try/catch, codigos HTTP, contratos de error y rutas de fallback.

### D3: Integridad, consistencia y persistencia de datos
- Que se verificara: locks/idempotencia/transacciones en `supabase/migrations/20260204100000_add_idempotency_stock_reservado.sql`, `supabase/migrations/20260217200000_vuln003_004_concurrency_locks.sql`, `supabase/functions/api-minimarket/handlers/reservas.ts`.
- Riesgos buscados: duplicados, perdida de datos, race conditions, escrituras parciales.
- Metodo: lectura SQL + flujo de escrituras criticas + validacion de consistencia de formatos (fecha, numero, moneda, timezone).

### D4: Seguridad para produccion
- Que se verificara: autenticacion/autorizacion/sanitizacion en `supabase/functions/api-minimarket/helpers/auth.ts`, `validation.ts`, `supabase/functions/_shared/internal-auth.ts`, `_shared/cors.ts`, `_shared/rate-limit.ts`.
- Riesgos buscados: bypass auth, abuso de endpoints, inyeccion, exposicion de informacion sensible.
- Metodo: matriz endpoint->proteccion + verificacion de headers/politicas + chequeo de secretos hardcodeados y gitignore/env docs.

### D5: Rendimiento bajo carga real
- Que se verificara: puntos de costo en `supabase/functions/api-minimarket/handlers/search.ts`, `insights.ts`, `supabase/functions/scraper-maxiconsumo/{parsing,matching,storage}.ts`, `tests/performance/load-testing.vitest.test.ts`.
- Riesgos buscados: complejidad no escalable, consultas sin limite/paginacion, consumo elevado de memoria.
- Metodo: analisis algoritmico y de consultas + contraste con pruebas de performance existentes y bundle de produccion.

### D6: Configuracion produccion vs desarrollo
- Que se verificara: scripts/flags/env en `package.json`, `minimarket-system/package.json`, `supabase/config.toml`, `minimarket-system/src/lib/apiClient.ts`, `deploy.sh`.
- Riesgos buscados: configuracion dev en produccion, endpoints sandbox activos, logs inseguros.
- Metodo: comparativa explicita por entorno + validacion de defaults y comandos de build/release.

### D7: Flujo completo end-to-end (simulacion real)
- Que se verificara: recorrido Login->Dashboard->Pedidos/Facturas/Asistente en `minimarket-system/src/App.tsx`, `pages/Login.tsx`, `pages/Pedidos.tsx`, `pages/Facturas.tsx`, `pages/Asistente.tsx`, `supabase/functions/api-assistant/confirm-store.ts`.
- Riesgos buscados: doble envio, acciones en orden invalido, errores de UX no accionables, perdida de estado.
- Metodo: simulacion paso a paso de camino feliz y caminos alternativos (cancelar, volver, repetir, multi-tab, conexion inestable).

### D8: Dependencias y servicios externos
- Que se verificara: estado/versiones/seguridad en `package.json`, `minimarket-system/package.json`, `deno.lock`.
- Riesgos buscados: CVEs activas, dependencias desactualizadas o sin mantenimiento, incompatibilidades de SDK/API externas.
- Metodo: correlacion de resultados de `npm audit` y `pnpm audit` con criticidad real de ejecucion (runtime vs tooling).

### D9: Resiliencia, recuperacion y degradacion elegante
- Que se verificara: circuit breaker/reintentos/locks/recuperacion en `supabase/functions/_shared/circuit-breaker.ts`, `supabase/functions/cron-jobs-maxiconsumo/orchestrator.ts`, `supabase/functions/cron-jobs-maxiconsumo/execution-log.ts`, `tests/unit/cron-jobs-locking.test.ts`.
- Riesgos buscados: caida en cascada, bloqueo de jobs, falta de retoma post-crash.
- Metodo: validacion de mecanismos de contencion + trazabilidad de ejecucion y errores.

### D10: Infraestructura y despliegue
- Que se verificara: reproducibilidad de deploy y salud operativa en `deploy.sh`, `supabase/config.toml`, `supabase/functions/api-minimarket/index.ts`, `supabase/functions/api-proveedor/index.ts`.
- Riesgos buscados: deploy fragil, servicios parcialmente desplegados, health checks insuficientes.
- Metodo: verificacion de scripts/comandos reales + consistencia con endpoints de health y configuracion de runtime.

### D11: Monitoreo y observabilidad
- Que se verificara: calidad de logs/metrica en `supabase/functions/_shared/logger.ts`, `_shared/audit.ts`, `docs/METRICS.md`.
- Riesgos buscados: incidentes invisibles, trazas incompletas, baja capacidad de diagnostico.
- Metodo: chequeo de campos minimos (timestamp, nivel, contexto, requestId cuando aplica) y cobertura de eventos criticos.

### D12: Documentacion operativa minima
- Que se verificara: sincronizacion docs-codigo en `README.md`, `docs/ESTADO_ACTUAL.md`, `docs/API_README.md`, `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`, `docs/api-openapi-3.1.yaml`, `docs/closure/OPEN_ISSUES.md`.
- Riesgos buscados: runbooks incompletos, pasos de produccion desactualizados, contratos de API divergentes.
- Metodo: comparacion cruzada directa docs <-> codigo <-> scripts <-> migraciones.

### D13: Cumplimiento y datos sensibles
- Que se verificara: manejo de datos en `supabase/functions/api-minimarket/handlers/clientes.ts`, `cuentas_corrientes.ts`, `minimarket-system/src/pages/Facturas.tsx`.
- Riesgos buscados: datos sensibles en logs/respuestas, retencion excesiva, ausencia de mecanismos de minimizacion/eliminacion.
- Metodo: inspeccion de payloads, logs y persistencia con foco en privacidad y exposicion indebida.

### D14: Riesgos adicionales (no evidentes para no-profesional)
- Que se verificara: anti-patrones y deuda tecnica critica en `supabase/functions/api-minimarket/index.ts`, `minimarket-system/src/lib/apiClient.ts`, `docs/PRODUCTION_GATE_REPORT.md`, `docs/DECISION_LOG.md`.
- Riesgos buscados: "funciona por casualidad", acoplamientos fragiles, drift entre narrativa y realidad tecnica.
- Metodo: auditoria cruzada de evidencia ejecutable + deteccion de contradicciones entre codigo, pruebas y documentacion.

---

## FASE 3 - CHECKPOINT (GENERADA, LISTA PARA APROBACION)

Texto de checkpoint preparado:

"Este es mi plan de auditoria para tu proyecto plataforma interna full-stack de gestion minimarket con OCR y asistente IA. Cubre 14 dimensiones con 74 verificaciones especificas.

¿Aprobas este plan? ¿Queres que agregue, quite o modifique algo? ¿Hay algun escenario especifico que te preocupe y que quieras que priorice?"

Estado: pendiente de aprobacion explicita del usuario para iniciar FASE 4 (ejecucion exhaustiva).

---

## Notas de control
- No se realizaron cambios de codigo fuente.
- No se imprimieron secretos ni tokens.
- Se mantuvo el guardrail operativo de `api-minimarket` con `verify_jwt=false` en despliegue (`--no-verify-jwt` presente en `deploy.sh`).
