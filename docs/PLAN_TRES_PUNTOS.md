# PLAN DE EJECUCION: TRES PUNTOS SOLICITADOS

**Estado:** en progreso (FASES 1-6 completadas, F7 gateway security ✅)  
**Fecha:** 2026-01-12  
**Alcance:** documentar el trabajo para (1) reporte final, (2) fixes prioritarios, (3) backlog priorizado.

---

## Progreso reciente (2026-01-12)

| Item | Estado | Notas |
|------|--------|-------|
| P0-03 Gateway sin service role + CORS | ✅ **COMPLETADO** | JWT auth, CORS restrictivo, rate limit 60/min, circuit breaker |
| P1-08 Refactor gateway monolítico | ✅ **COMPLETADO** | Helpers modularizados en `api-minimarket/helpers/` |
| P1-10 Rate limiting en gateway | ✅ **COMPLETADO** | FixedWindowRateLimiter 60 req/min por IP |
| WS6.1 CI jobs gated | ✅ **COMPLETADO** | integration/E2E con workflow_dispatch |
| Tests unitarios | ✅ **141 pasando** | +46 nuevos para helpers gateway |

### Checklist de verificación post-cambio
- [x] Auth/CORS: requiere `ALLOWED_ORIGINS` configurado
- [x] Tests: 141 unit tests pasan (`npx vitest run`)
- [x] CI: workflow `ci.yml` pasa en main
- [x] Docs: INVENTARIO_ACTUAL, DECISION_LOG, BACKLOG actualizados

---

## 1) Documento final del analisis (reporte consolidado)

**Objetivo:** dejar un reporte unico, claro y accionable con hallazgos, riesgos y recomendaciones.

**Entregable:** `docs/REPORTE_ANALISIS_PROYECTO.md`

**Estructura sugerida (minima):**
1. Resumen ejecutivo (3-6 bullets)
2. Alcance y limites del analisis
3. Hallazgos criticos (seguridad + bugs funcionales)
4. Hallazgos de rendimiento y escalabilidad
5. Hallazgos UX / friccion operativa
6. Deuda tecnica / mantenibilidad
7. Oportunidades de mejora (quick wins vs medio plazo)
8. Riesgos y supuestos
9. Recomendaciones priorizadas (P0/P1/P2)

**Fuentes principales:**
- Frontend: `minimarket-system/src/pages/*`
- Edge Functions: `supabase/functions/api-minimarket/index.ts`
- Shared utils: `supabase/functions/_shared/*`
- Documentos actuales: `docs/ESTADO_ACTUAL.md`, `docs/OBJETIVOS_Y_KPIS.md`

**Criterios de aceptacion:**
- Incluye referencias directas a archivos/lineas relevantes.
- Diferencia entre hechos observados y supuestos.
- Prioriza con impacto en el usuario (duenio/personal).

**Riesgos / mitigaciones:**
- Sin telemetria real: declarar limitaciones al inicio.
- Sin RLS/indices confirmados: marcar como pendiente de auditoria.

---

## 2) Fixes de alta prioridad (Dashboard + Deposito + Seguridad gateway)

**Objetivo:** corregir riesgos funcionales y de seguridad con alto impacto inmediato.

**Alcance tecnico:**
- **Dashboard:** conteo de productos usando `count` del response.
- **Deposito:** movimiento de stock atomico (validacion de stock y transaccion).
- **Gateway:** ✅ **COMPLETADO** - JWT auth para RLS, CORS restrictivo (`ALLOWED_ORIGINS`), rate limit 60/min, circuit breaker.
- **Proveedor/Scraper:** ahora requieren `x-api-secret` y bloquean requests sin `Origin` permitido (CORS activo).

**Archivos a intervenir (referencia):**
- `minimarket-system/src/pages/Dashboard.tsx`
- `minimarket-system/src/pages/Deposito.tsx`
- `supabase/functions/api-minimarket/index.ts` ✅ **HARDENED**
- `supabase/functions/api-minimarket/helpers/` ✅ **NUEVO** (auth, validation, pagination, supabase)
- `supabase/functions/_shared/cors.ts`

**Tareas tecnicas sugeridas:**
- Dashboard: reemplazar `productos.length` por `count` real de Supabase.
- Deposito: mover logica de movimiento a RPC (`sp_movimiento_inventario`) o Edge Function con validacion de stock; evitar operaciones separadas.
- ~~Gateway: usar JWT del usuario/anon key para queries normales; reservar service role para tareas admin; configurar `ALLOWED_ORIGINS` en CORS.~~ ✅ **COMPLETADO**

**Criterios de aceptacion:**
- Conteo de productos consistente con registros reales.
- No permite salida de stock por debajo de cero.
- Gateway rechaza accesos no autorizados y no expone datos con service role.

**Verificacion:**
- Smoke manual en UI (Dashboard/Deposito).
- Llamadas de API con y sin token para validar permisos.

---

## 3) Backlog priorizado (impacto/esfuerzo)

**Objetivo:** ordenar mejoras por impacto al negocio y esfuerzo tecnico.

**Entregable:** `docs/BACKLOG_PRIORIZADO.md`

**Metodologia recomendada (simple):**
- Puntaje = Impacto (1-5) x Urgencia (1-5) / Esfuerzo (1-5)
- Etiquetas: `P0` (critico), `P1` (alto), `P2` (medio), `P3` (bajo)

**Template de backlog:**
| ID | Tema | Impacto | Esfuerzo | Urgencia | Puntaje | Dependencias | Owner | Estado |
|----|------|---------|----------|----------|---------|--------------|-------|--------|

**Fuente de items:**
- Hallazgos del reporte (Punto 1)
- Problemas operativos reportados por usuarios
- Deuda tecnica identificada en `docs/DB_GAPS.md` y `docs/ESTADO_ACTUAL.md`

**Criterios de aceptacion:**
- Al menos 20 items con puntaje y categoria.
- Top 5 con plan corto (1-2 frases cada uno).

---

## Siguiente paso inmediato
~~Continuar con FASE 6 (API proveedor) y~~ preparar el reporte final (Punto 1) y el backlog base (Punto 3).

**Nota:** FASE 6 y F7 (gateway security) completadas. Próximo foco: Punto 1 (reporte) y observabilidad (WS4.1).

### Variables de entorno requeridas (producción)
```bash
ALLOWED_ORIGINS=https://tu-dominio.com,https://otro.com  # CORS allowlist (REQUERIDO)
API_PROVEEDOR_SECRET=your-secret-here                    # Auth API proveedor (REQUERIDO)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Modo sin credenciales (`.env.test` pendiente)
- Tests permitidos: `npm run test:unit`.
- Validación de prerequisitos sin Supabase: `bash scripts/run-e2e-tests.sh --dry-run` y `bash scripts/run-integration-tests.sh --dry-run`.
- Bloqueado: E2E/integración hasta contar con `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `API_PROVEEDOR_SECRET` reales en `.env.test`.
- Flags opcionales (proxy/CAPTCHA/cookie jar) permanecen desactivados por defecto; no requieren credenciales ni afectan el flujo.

### Roadmap breve sin credenciales (tareas que sí pueden avanzar)
- Backend: refinar validadores (tipos, rangos) y rutas estáticas; endurecer manejo de HTML vacío y timeouts configurables (ya iniciado en scraper).
- Tests: ampliar unitarios de parsers/routers/cache; cubrir casos borde de fail() y CORS; mantener `npm run test:unit` como guardia.
- Docs: cerrar `REPORTE_ANALISIS_PROYECTO.md` y `BACKLOG_PRIORIZADO.md`; actualizar API_README con ejemplos sin claves y flow de `--dry-run`.
- Frontend: revisión estática de pages (Dashboard/Deposito/Productos) para conteos y validaciones; no requiere Supabase en vivo.
- Operación: checklist de release sin credenciales (scripts `--dry-run`, variables requeridas) y notas en DECISION_LOG.

---

## 4) Plan maestro de debugging modular (alineado y verificado)

**Verificaciones y alineacion (confirmado en repo):**
- Proyecto: Sistema Mini Market (ver `README.md`).
- Stack: React 18 + TypeScript + Vite + Tailwind, Supabase (Postgres + Edge Functions Deno), Vitest.
- Backend principal: `supabase/functions/api-minimarket/index.ts`.
- API proveedor modular: `supabase/functions/api-proveedor/*`.
- Scraper y cron jobs: `supabase/functions/scraper-maxiconsumo/*` y `supabase/functions/cron-jobs-maxiconsumo/*`.
- Frontend: `minimarket-system/src/*`.
- Tests: `tests/*` + configs `vitest*.config.ts`.

**Reglas aplicadas:**
- Orden logico: BD -> Backend -> Frontend -> Tests -> Release.
- Integracion cada 3 fases (1-3, 5-7, 9-11, 13-15, 17-19, 21-23).
- Prompts autocontenidos y autocorregibles (con cierre obligatorio).
- Granularidad fina aplicada en API Proveedor y Scraper.

---

### FASE 1: Base de datos - gaps y esquema

**1. OBJETIVO DE ESTA FASE:**
   - Cubrir gaps de objetos y asegurar migraciones base completas.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `docs/DB_GAPS.md`.
   - Luego `supabase/migrations/20260104020000_create_missing_objects.sql`.
   - Luego `supabase/migrations/20260110000000_fix_constraints_and_indexes.sql`.
   - Luego `supabase/migrations/20251103_create_cache_proveedor.sql`.
   - Luego `supabase/migrations/20260109060000_create_precios_proveedor.sql`.
   - Finalmente `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`.

**3. DEPENDENCIAS:**
   - Ninguna fase previa.
   - Servicios: Postgres de Supabase accesible con permisos de migracion.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en la capa de datos (schema y objetos base) del sistema Mini Market.
Tarea especifica: Analiza `docs/DB_GAPS.md` y las migraciones listadas para detectar objetos faltantes, definiciones incompletas, indices ausentes y constraints insuficientes.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (PK/FK/unique faltantes, indices criticos, objetos del gap sin migracion)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con tabla `Objeto | Archivo | Hallazgo | Severidad (P0/P1/P2) | Fix SQL`.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera un script SQL que compare los objetos de `docs/DB_GAPS.md` con `information_schema` y reporte faltantes."

**6. CRITERIO DE EXITO:**
   - Todos los objetos del gap tienen migracion o justificacion.
   - Constraints e indices basicos definidos.

---

### FASE 2: Base de datos - RLS y funciones criticas

**1. OBJETIVO DE ESTA FASE:**
   - Validar RLS y asegurar funciones criticas atomicas y seguras.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `supabase/migrations/20260104083000_add_rls_policies.sql`.
   - Luego `supabase/migrations/20250101000000_version_sp_aplicar_precio.sql`.
   - Luego `supabase/migrations/20260109090000_update_sp_movimiento_inventario.sql`.
   - Luego `supabase/migrations/20260110100000_fix_rls_security_definer.sql`.
   - Finalmente `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`.

**3. DEPENDENCIAS:**
   - Fase 1 completada.
   - Servicios: RLS habilitado en Supabase.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en RLS y funciones SQL criticas (precios y movimientos de stock).
Tarea especifica: Analiza las migraciones listadas y busca RLS incompleta, funciones no atomicas, validaciones de stock insuficientes y uso inseguro de SECURITY DEFINER.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (stock negativo, RLS incompleta, transacciones no atomicas)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con tabla `Objeto | Hallazgo | Riesgo | Fix SQL`.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera SQL de prueba para verificar que `sp_movimiento_inventario` rechaza salidas con stock insuficiente y que las politicas RLS bloquean accesos indebidos."

**6. CRITERIO DE EXITO:**
   - RLS aplicado en tablas sensibles.
   - Funciones criticas evitan inconsistencias de stock.

---

### FASE 3: Utilidades compartidas de Edge Functions

**1. OBJETIVO DE ESTA FASE:**
   - Unificar manejo de errores, CORS, rate-limit y logging.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `supabase/functions/_shared/errors.ts`.
   - Luego `supabase/functions/_shared/response.ts`.
   - Luego `supabase/functions/_shared/cors.ts`.
   - Luego `supabase/functions/_shared/rate-limit.ts`.
   - Luego `supabase/functions/_shared/logger.ts`.
   - Finalmente `supabase/functions/_shared/circuit-breaker.ts`.

**3. DEPENDENCIAS:**
   - Fases 1 y 2 completadas.
   - Servicios: runtime Deno disponible.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en utilidades compartidas de Edge Functions (errors, response, cors, rate-limit, logger, circuit-breaker).
Tarea especifica: Analiza los archivos listados y busca inconsistencias de status code, CORS permisivo, rate-limit evadible y logs con datos sensibles.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (CORS abierto, rate-limit ineficaz, errores sin status correcto)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Archivo | Hallazgo | Riesgo | Fix recomendado` y ejemplos de headers esperados.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera pruebas unitarias para CORS (permitido/denegado), rate-limit (limite alcanzado) y formato de errores."

**6. CRITERIO DE EXITO:**
   - Respuestas estandarizadas y CORS restringido.

---

### FASE 4: INTEGRACION 1 - DB + Shared

**1. OBJETIVO DE ESTA FASE:**
   - Verificar coherencia entre DB, errores estandar y CORS.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `supabase/functions/_shared/errors.ts`.
   - Luego `supabase/functions/_shared/response.ts`.
   - Luego `supabase/functions/_shared/cors.ts`.
   - Luego `supabase/functions/api-minimarket/index.ts`.
   - Finalmente `supabase/migrations/20260109090000_update_sp_movimiento_inventario.sql`.

**3. DEPENDENCIAS:**
   - Fases 1 a 3 completadas.
   - Servicios: Supabase con RLS activa.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas validando integracion entre DB y utilidades compartidas.
Tarea especifica: Revisa los archivos listados y detecta discrepancias entre errores DB y respuestas HTTP, mas configuracion CORS incoherente.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (mapeo incorrecto de errores, headers inconsistentes)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Flujo | Problema | Impacto | Ajuste` y pruebas minimas de integracion.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Define una prueba de integracion que fuerce un error de DB y verifique el formato de respuesta."

**6. CRITERIO DE EXITO:**
   - Errores DB se traducen a HTTP consistente con CORS correcto.

---

### FASE 5: API Gateway principal (api-minimarket)

**1. OBJETIVO DE ESTA FASE:**
   - Validar autenticacion, roles y consistencia de endpoints.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `supabase/functions/api-minimarket/index.ts`.

**3. DEPENDENCIAS:**
   - Fases 1 a 4 completadas.
   - Servicios: Supabase Auth y PostgREST accesibles.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en el API Gateway principal con JWT y multiples endpoints REST.
Tarea especifica: Analiza `supabase/functions/api-minimarket/index.ts` y busca fallos de auth/roles, validacion de parametros, respuestas inconsistentes y uso incorrecto de count.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (autorizacion por rol, conteos incorrectos, inputs sin validar)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Endpoint | Hallazgo | Severidad | Fix` y lista de cambios P0/P1.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera comandos curl para 3 endpoints (publico, con rol, con body invalido) e indica respuesta esperada."

**6. CRITERIO DE EXITO:**
   - Endpoints respetan roles, validaciones y respuestas consistentes.

**7. ESTADO ACTUAL (2026-01-10):**
   - Auth/roles endurecidos sin rol por defecto; lecturas requieren JWT valido.
   - Validaciones de UUID/numeros y whitelist en payloads criticos.
   - Conteo real con `Prefer: count=exact` en listados paginados.
   - Tests: `bash scripts/run-integration-tests.sh` (31 tests OK).

---

### FASE 6: API Proveedor - routing y validaciones

**1. OBJETIVO DE ESTA FASE:**
   - Asegurar routing y validacion robusta en la API de proveedor.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `supabase/functions/api-proveedor/index.ts`.
   - Luego `supabase/functions/api-proveedor/router.ts`.
   - Luego `supabase/functions/api-proveedor/validators.ts`.
   - Luego `supabase/functions/api-proveedor/schemas.ts`.
   - Luego `supabase/functions/api-proveedor/utils/params.ts`.
   - Luego `supabase/functions/api-proveedor/utils/http.ts`.
   - Luego `supabase/functions/api-proveedor/utils/constants.ts`.
   - Finalmente `supabase/functions/api-proveedor/utils/format.ts`.

**3. DEPENDENCIAS:**
   - Fase 5 completada.
   - Servicios: Supabase envs configuradas para API proveedor.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en routing, validators y schemas de la API proveedor.
Tarea especifica: Analiza los archivos listados y detecta rutas sin validacion, schemas inconsistentes y parseo de params incorrecto.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (params mal parseados, rutas sin control, schemas incompletos)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Ruta | Archivo | Hallazgo | Fix` y lista de validaciones faltantes.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Crea ejemplos de requests validos e invalidos para 3 rutas y explica el error esperado."

**6. CRITERIO DE EXITO:**
   - Todas las rutas tienen validacion consistente y schemas correctos.

**7. NOTA DE AUTENTICACION (FASE 6 → 7):**
   - La API proveedor es interna: auth por shared secret + CORS allowlist.
   - El check actual valida solo presencia de `Authorization` (temporal). En FASE 7 debe reemplazarse por verificacion real del token/secret.

---

### FASE 7: API Proveedor - handlers y logica de negocio

**1. OBJETIVO DE ESTA FASE:**
   - Validar logica de negocio, cache y comparaciones.
   - Endurecer autenticacion real (shared secret/JWT) en handlers que usan `requiresAuth`.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `supabase/functions/api-proveedor/handlers/productos.ts`.
   - Luego `supabase/functions/api-proveedor/handlers/precios.ts`.
   - Luego `supabase/functions/api-proveedor/handlers/comparacion.ts`.
   - Luego `supabase/functions/api-proveedor/handlers/alertas.ts`.
   - Luego `supabase/functions/api-proveedor/handlers/estadisticas.ts`.
   - Luego `supabase/functions/api-proveedor/handlers/configuracion.ts`.
   - Luego `supabase/functions/api-proveedor/handlers/sincronizar.ts`.
   - Luego `supabase/functions/api-proveedor/handlers/status.ts`.
   - Luego `supabase/functions/api-proveedor/handlers/health.ts`.
   - Luego `supabase/functions/api-proveedor/utils/alertas.ts`.
   - Luego `supabase/functions/api-proveedor/utils/cache.ts`.
   - Luego `supabase/functions/api-proveedor/utils/comparacion.ts`.
   - Luego `supabase/functions/api-proveedor/utils/config.ts`.
   - Luego `supabase/functions/api-proveedor/utils/estadisticas.ts`.
   - Luego `supabase/functions/api-proveedor/utils/metrics.ts`.
   - Finalmente `supabase/functions/api-proveedor/utils/health.ts`.

**3. DEPENDENCIAS:**
   - Fase 6 completada.
   - Servicios: DB con tablas proveedor y cache disponibles.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en handlers y utilidades de negocio para la API proveedor.
Tarea especifica: Analiza los archivos listados y busca fallos de cache, comparaciones incorrectas, queries costosas y manejo de errores incompleto.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (cache incoherente, comparaciones falsas, datos inconsistentes)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Handler | Hallazgo | Impacto | Fix` y casos borde recomendados.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera casos de prueba para `/precios`, `/comparacion` y `/alertas` con resultados esperados."

**6. CRITERIO DE EXITO:**
   - Logica consistente, cache coherente y errores controlados.
   - Auth endurecida (shared secret/JWT real) en endpoints `requiresAuth`.

---

### FASE 8: INTEGRACION 2 - Gateway + API Proveedor

**1. OBJETIVO DE ESTA FASE:**
   - Validar coherencia de auth, errores y CORS entre APIs.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `supabase/functions/api-minimarket/index.ts`.
   - Luego `supabase/functions/api-proveedor/index.ts`.
   - Luego `supabase/functions/api-proveedor/router.ts`.
   - Luego `supabase/functions/_shared/errors.ts`.
   - Finalmente `supabase/functions/_shared/cors.ts`.

**3. DEPENDENCIAS:**
   - Fases 5 a 7 completadas.
   - Servicios: Edge Functions activas.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas validando integracion entre gateway principal y API proveedor.
Tarea especifica: Analiza los archivos listados y detecta inconsistencias de formato de respuesta, auth y CORS entre APIs.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (mismatch de headers, roles no alineados)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Flujo | Problema | Impacto | Ajuste` y pruebas E2E minimas.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Define un flujo E2E que consulte gateway y proveedor y valide CORS y auth."

**6. CRITERIO DE EXITO:**
   - Respuestas y auth coherentes entre APIs.
   - Gateway y proveedor usan el mismo modelo de auth (shared secret/JWT) y CORS allowlist.

---

### FASE 9: Scraper - scraping y anti-detection

**1. OBJETIVO DE ESTA FASE:**
   - Asegurar estabilidad de scraping y mitigacion anti-detection.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `supabase/functions/scraper-maxiconsumo/config.ts`.
   - Luego `supabase/functions/scraper-maxiconsumo/types.ts`.
   - Luego `supabase/functions/scraper-maxiconsumo/anti-detection.ts`.
   - Finalmente `supabase/functions/scraper-maxiconsumo/scraping.ts`.

**3. DEPENDENCIAS:**
   - Fases 1 a 8 completadas.
   - Servicios: acceso a fuente de scraping.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en configuracion, anti-detection y scraping.
Tarea especifica: Analiza los archivos listados y busca timeouts inadecuados, reintentos ausentes y bloqueos por user-agent.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (reintentos mal definidos, timeouts bajos, scraping inestable)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Modulo | Hallazgo | Impacto | Fix` y configuraciones recomendadas.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera un plan de pruebas para simular fallos de red y validar reintentos."

**6. CRITERIO DE EXITO:**
   - Scraping estable con reintentos controlados.

---

### FASE 10: Scraper - parsing, matching y persistencia

**1. OBJETIVO DE ESTA FASE:**
   - Garantizar parsing correcto, matching confiable y persistencia idempotente.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `supabase/functions/scraper-maxiconsumo/parsing.ts`.
   - Luego `supabase/functions/scraper-maxiconsumo/matching.ts`.
   - Luego `supabase/functions/scraper-maxiconsumo/storage.ts`.
   - Luego `supabase/functions/scraper-maxiconsumo/cache.ts`.
   - Luego `supabase/functions/scraper-maxiconsumo/alertas.ts`.
   - Finalmente `supabase/functions/scraper-maxiconsumo/index.ts`.

**3. DEPENDENCIAS:**
   - Fase 9 completada.
   - Servicios: DB accesible para persistencia.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en parsing, matching y persistencia del scraper.
Tarea especifica: Analiza los archivos listados y busca parsing incorrecto de precios/unidades, matching con falsos positivos y persistencia no idempotente.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (parsing incorrecto, matching erroneo, duplicados)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Modulo | Hallazgo | Impacto | Fix` y ejemplos de casos de parsing.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera fixtures HTML y tests para `parsing.ts` y `matching.ts` con precios y unidades variadas."

**6. CRITERIO DE EXITO:**
   - Parsing y matching deterministas, persistencia sin duplicados.

---

### FASE 11: Cron jobs - ejecucion y orquestacion

**1. OBJETIVO DE ESTA FASE:**
   - Validar jobs, orquestacion y logging de ejecuciones.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `supabase/functions/cron-jobs-maxiconsumo/types.ts`.
   - Luego `supabase/functions/cron-jobs-maxiconsumo/config.ts`.
   - Luego `supabase/functions/cron-jobs-maxiconsumo/execution-log.ts`.
   - Luego `supabase/functions/cron-jobs-maxiconsumo/jobs/realtime-alerts.ts`.
   - Luego `supabase/functions/cron-jobs-maxiconsumo/jobs/daily-price-update.ts`.
   - Luego `supabase/functions/cron-jobs-maxiconsumo/jobs/maintenance.ts`.
   - Luego `supabase/functions/cron-jobs-maxiconsumo/jobs/weekly-analysis.ts`.
   - Luego `supabase/functions/cron-jobs-maxiconsumo/orchestrator.ts`.
   - Finalmente `supabase/functions/cron-jobs-maxiconsumo/index.ts`.

**3. DEPENDENCIAS:**
   - Fases 9 y 10 completadas.
   - Servicios: scheduler activo y DB con tablas de log.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en cron jobs y orquestacion.
Tarea especifica: Analiza los archivos listados y busca ejecuciones duplicadas, falta de idempotencia, errores sin logging y manejo deficiente de concurrencia.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (jobs duplicados, concurrencia sin control)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Job | Hallazgo | Riesgo | Fix` y recomendaciones de scheduling.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera un plan de pruebas para simular cada job y validar `execution-log`."

**6. CRITERIO DE EXITO:**
   - Jobs idempotentes con logging completo.

---

### FASE 12: INTEGRACION 3 - Scraper + Cron

**1. OBJETIVO DE ESTA FASE:**
   - Confirmar flujo de datos desde scraping hasta jobs.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `supabase/functions/scraper-maxiconsumo/index.ts`.
   - Luego `supabase/functions/cron-jobs-maxiconsumo/orchestrator.ts`.
   - Luego `supabase/functions/cron-jobs-maxiconsumo/execution-log.ts`.
   - Luego `supabase/functions/api-proveedor/handlers/precios.ts`.
   - Finalmente `supabase/functions/api-proveedor/utils/cache.ts`.

**3. DEPENDENCIAS:**
   - Fases 9 a 11 completadas.
   - Servicios: DB y scheduler activos.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas validando integracion entre scraper, cron jobs y API proveedor.
Tarea especifica: Analiza los archivos listados y detecta inconsistencias entre datos scrapeados, cache y exposicion via API.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (cache desactualizada, datos incompletos)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Flujo | Problema | Impacto | Ajuste` y pruebas de integracion sugeridas.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Define un script de integracion que ejecute un job, valide DB y consulte `/precios`."

**6. CRITERIO DE EXITO:**
   - Datos scrapeados visibles en API sin inconsistencias.

---

### FASE 13: Alertas y notificaciones

**1. OBJETIVO DE ESTA FASE:**
   - Evitar alertas duplicadas y asegurar notificaciones utiles.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `supabase/functions/alertas-stock/index.ts`.
   - Luego `supabase/functions/notificaciones-tareas/index.ts`.
   - Luego `supabase/functions/cron-notifications/index.ts`.
   - Finalmente `supabase/functions/api-proveedor/utils/alertas.ts`.

**3. DEPENDENCIAS:**
   - Fase 12 completada.
   - Servicios: DB con tablas de alertas.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en alertas de stock y notificaciones.
Tarea especifica: Analiza los archivos listados y busca duplicacion de alertas, reglas mal definidas y falta de deduplicacion.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (alertas duplicadas, umbrales incorrectos)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Alerta | Hallazgo | Severidad | Fix` y escenarios de duplicacion.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera una prueba que simule stock bajo y valide una sola alerta por producto."

**6. CRITERIO DE EXITO:**
   - Alertas deduplicadas y notificaciones confiables.

---

### FASE 14: Reportes y dashboard cron

**1. OBJETIVO DE ESTA FASE:**
   - Asegurar reportes consistentes y eficientes.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `supabase/functions/reportes-automaticos/index.ts`.
   - Luego `supabase/functions/cron-dashboard/index.ts`.
   - Finalmente `docs/CRON_JOBS_COMPLETOS.md`.

**3. DEPENDENCIAS:**
   - Fase 13 completada.
   - Servicios: DB con metricas disponibles.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en reportes automaticos y dashboard cron.
Tarea especifica: Analiza los archivos listados y busca ventanas de tiempo mal definidas, queries costosas y metricas incorrectas.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (metricas erroneas, ventanas de tiempo incorrectas)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Reporte | Hallazgo | Impacto | Fix` y recomendaciones de indices.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera queries de verificacion para metricas clave del dashboard."

**6. CRITERIO DE EXITO:**
   - Reportes consistentes con tiempos de ejecucion aceptables.

---

### FASE 15: Operacion, configuracion y monitoreo

**1. OBJETIVO DE ESTA FASE:**
   - Validar variables de entorno, scripts y cron jobs.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `.env.example`.
   - Luego `minimarket-system/.env.example`.
   - Luego `supabase/config.toml`.
   - Luego `supabase/cron_jobs/README.md`.
   - Luego `supabase/cron_jobs/deploy_master.sh`.
   - Luego `supabase/cron_jobs/job_2.json`.
   - Luego `supabase/cron_jobs/job_3.json`.
   - Luego `supabase/cron_jobs/job_4.json`.
   - Luego `supabase/cron_jobs/job_daily_price_update.json`.
   - Luego `supabase/cron_jobs/job_realtime_alerts.json`.
   - Luego `supabase/cron_jobs/job_weekly_trend_analysis.json`.
   - Luego `supabase/functions/cron-health-monitor/index.ts`.
   - Luego `supabase/functions/cron-testing-suite/index.ts`.
   - Luego `setup.sh`.
   - Luego `migrate.sh`.
   - Luego `deploy.sh`.
   - Luego `scripts/run-integration-tests.sh`.
   - Luego `scripts/run-e2e-tests.sh`.
   - Finalmente `test.sh`.

**3. DEPENDENCIAS:**
   - Fase 14 completada.
   - Servicios: credenciales y accesos operativos.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en operacion, configuracion y monitoreo.
Tarea especifica: Analiza los archivos listados y busca variables faltantes, scripts no idempotentes, cron jobs mal configurados y health checks incompletos.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (orden de pasos incorrecto, envs faltantes)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Archivo | Riesgo | Impacto | Fix` y un checklist operativo final.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera un script para validar variables de entorno y un checklist pre-deploy."

**6. CRITERIO DE EXITO:**
   - Scripts reproducibles y cron jobs alineados con funciones reales.

---

### FASE 16: INTEGRACION 4 - Operacion + alertas + reportes

**1. OBJETIVO DE ESTA FASE:**
   - Verificar convivencia de jobs, alertas y reportes con monitoreo.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `supabase/functions/cron-health-monitor/index.ts`.
   - Luego `supabase/functions/cron-notifications/index.ts`.
   - Luego `supabase/functions/reportes-automaticos/index.ts`.
   - Luego `supabase/functions/cron-dashboard/index.ts`.
   - Luego `supabase/cron_jobs/job_2.json`.
   - Luego `supabase/cron_jobs/job_3.json`.
   - Luego `supabase/cron_jobs/job_4.json`.
   - Luego `supabase/cron_jobs/job_daily_price_update.json`.
   - Luego `supabase/cron_jobs/job_realtime_alerts.json`.
   - Finalmente `supabase/cron_jobs/job_weekly_trend_analysis.json`.

**3. DEPENDENCIAS:**
   - Fases 13 a 15 completadas.
   - Servicios: scheduler activo y logging habilitado.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas validando integracion entre monitoreo, alertas y reportes.
Tarea especifica: Analiza los archivos listados y busca solapamientos de schedule, reintentos sin control y riesgos de saturacion de DB.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (solapamientos, retries sin backoff)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Interaccion | Riesgo | Mitigacion` y un plan de scheduling recomendado.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Propone un plan de pruebas de carga controlada para 1 hora de jobs."

**6. CRITERIO DE EXITO:**
   - Jobs no se solapan de forma critica y quedan auditables.

---

### FASE 17: Frontend core (app, auth, layout)

**1. OBJETIVO DE ESTA FASE:**
   - Asegurar arranque, auth estable y layout robusto.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `minimarket-system/src/main.tsx`.
   - Luego `minimarket-system/src/App.tsx`.
   - Luego `minimarket-system/src/components/Layout.tsx`.
   - Luego `minimarket-system/src/components/ErrorBoundary.tsx`.
   - Luego `minimarket-system/src/contexts/AuthContext.tsx`.
   - Luego `minimarket-system/src/contexts/auth-context.ts`.
   - Luego `minimarket-system/src/hooks/useAuth.ts`.
   - Luego `minimarket-system/src/hooks/use-mobile.tsx`.
   - Luego `minimarket-system/src/types/database.ts`.
   - Luego `minimarket-system/src/lib/supabase.ts`.
   - Luego `minimarket-system/src/index.css`.
   - Luego `minimarket-system/src/App.css`.
   - Finalmente `minimarket-system/src/vite-env.d.ts`.

**3. DEPENDENCIAS:**
   - Fases 1 a 16 completadas.
   - Servicios: envs `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en el core del frontend (bootstrap, auth, layout, error boundary).
Tarea especifica: Analiza los archivos listados y busca imports rotos, flujo de auth inconsistente, error boundary incompleto y problemas de responsividad.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (auth inconsistente, imports rotos, layout no responsivo)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Archivo | Hallazgo | Impacto | Fix` y listado de modulos faltantes.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera un smoke test manual del flujo login/logout y persistencia de sesion."

**6. CRITERIO DE EXITO:**
   - App inicia sin errores y auth se mantiene estable.

---

### FASE 18: Frontend pages A (login, dashboard, stock, deposito)

**1. OBJETIVO DE ESTA FASE:**
   - Validar flujos criticos de UI y consistencia de datos.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `minimarket-system/src/pages/Login.tsx`.
   - Luego `minimarket-system/src/pages/Dashboard.tsx`.
   - Luego `minimarket-system/src/pages/Stock.tsx`.
   - Finalmente `minimarket-system/src/pages/Deposito.tsx`.

**3. DEPENDENCIAS:**
   - Fase 17 completada.
   - Servicios: RPC `sp_movimiento_inventario` disponible.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en paginas criticas de UI (login, dashboard, stock, deposito).
Tarea especifica: Analiza los archivos listados y busca conteos incorrectos, validaciones insuficientes en deposito, manejo de errores y estados de carga incompletos.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (conteos incorrectos, stock negativo, validaciones debiles)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Pagina | Hallazgo | Fix` y recomendaciones de UX para errores criticos.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera casos de prueba para Dashboard (conteos exactos) y Deposito (salida con stock insuficiente)."

**6. CRITERIO DE EXITO:**
   - Dashboard con metricas correctas y Deposito sin movimientos invalidos.

---

### FASE 19: Frontend pages B (productos, proveedores, tareas)

**1. OBJETIVO DE ESTA FASE:**
   - Asegurar CRUD y filtros sin inconsistencias.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `minimarket-system/src/pages/Productos.tsx`.
   - Luego `minimarket-system/src/pages/Proveedores.tsx`.
   - Finalmente `minimarket-system/src/pages/Tareas.tsx`.

**3. DEPENDENCIAS:**
   - Fase 18 completada.
   - Servicios: endpoints backend correspondientes.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en paginas de gestion (productos, proveedores, tareas).
Tarea especifica: Analiza los archivos listados y busca errores en CRUD, filtros, estados vacios y sincronizacion con backend.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (estado desincronizado, filtros incorrectos, paginacion rota)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Pagina | Hallazgo | Fix` y casos borde sugeridos.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera pruebas de UI para CRUD basico en Productos y Proveedores."

**6. CRITERIO DE EXITO:**
   - CRUD funciona sin errores y la UI refleja cambios.

---

### FASE 20: INTEGRACION 5 - Frontend + Backend

**1. OBJETIVO DE ESTA FASE:**
   - Verificar contratos API-UI, CORS y flujos completos.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `minimarket-system/src/pages/Dashboard.tsx`.
   - Luego `minimarket-system/src/pages/Deposito.tsx`.
   - Luego `minimarket-system/src/pages/Productos.tsx`.
   - Luego `supabase/functions/api-minimarket/index.ts`.
   - Luego `supabase/functions/api-proveedor/router.ts`.
   - Finalmente `supabase/functions/_shared/cors.ts`.

**3. DEPENDENCIAS:**
   - Fases 17 a 19 completadas.
   - Servicios: Edge Functions accesibles desde frontend.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas validando integracion entre frontend y APIs (gateway + proveedor).
Tarea especifica: Analiza los archivos listados y busca mismatches de campos, CORS incorrecto, errores HTTP no manejados y contratos de datos desalineados.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (mismatch de campos, estados no manejados)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Pantalla | Endpoint | Mismatch | Ajuste` y plan de pruebas E2E minimo.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Define un plan E2E para login -> dashboard -> deposito -> productos con pasos y resultados esperados."

**6. CRITERIO DE EXITO:**
   - UI consume APIs sin errores de contrato ni CORS.

---

### FASE 21: Tests unitarios

**1. OBJETIVO DE ESTA FASE:**
   - Mejorar cobertura y detectar regresiones tempranas.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `vitest.config.ts`.
   - Luego `tests/unit/api-proveedor-routing.test.ts`.
   - Luego `tests/unit/scraper-parsing.test.ts`.
   - Luego `tests/unit/scraper-matching.test.ts`.
   - Luego `tests/unit/scraper-alertas.test.ts`.
   - Finalmente `tests/unit/cron-jobs.test.ts`.

**3. DEPENDENCIAS:**
   - Fases 5 a 20 completadas.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en tests unitarios con Vitest.
Tarea especifica: Analiza los archivos listados y busca gaps de cobertura, asserts debiles, mocks incompletos y casos borde faltantes.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (asserts incorrectos, mocks incompletos)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Test | Gap | Test nuevo propuesto` y snippets sugeridos.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera 3 casos unitarios nuevos para routing y 2 para parsing."

**6. CRITERIO DE EXITO:**
   - Tests unitarios pasan y cubren casos borde.

---

### FASE 22: Tests de integracion y E2E

**1. OBJETIVO DE ESTA FASE:**
   - Validar integracion real con DB y Edge Functions.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `vitest.integration.config.ts`.
   - Luego `vitest.e2e.config.ts`.
   - Luego `tests/integration/api-scraper.integration.test.ts`.
   - Luego `tests/integration/database.integration.test.ts`.
   - Luego `tests/helpers/setup.js`.
   - Luego `tests/setup-edge.js`.
   - Luego `scripts/run-integration-tests.sh`.
   - Finalmente `scripts/run-e2e-tests.sh`.

**3. DEPENDENCIAS:**
   - Fase 21 completada.
   - Servicios: Supabase local o remoto disponible para tests.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en tests de integracion/E2E con Supabase local.
Tarea especifica: Analiza los archivos listados y busca setup/teardown incompleto, datos contaminados, dependencia de envs faltantes y tests fragiles.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (setup incompleto, datos contaminados)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Test | Problema | Fix` y un flujo de ejecucion propuesto.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera un script minimo que levante Supabase local, corra migraciones y ejecute tests."

**6. CRITERIO DE EXITO:**
   - Integracion/E2E corren sin flaky y con aislamiento de datos.

---

### FASE 23: Performance, seguridad y contratos API

**1. OBJETIVO DE ESTA FASE:**
   - Validar rendimiento, seguridad y cumplimiento OpenAPI.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `tests/performance/load-testing.test.js`.
   - Luego `tests/performance-benchmark.ts`.
   - Luego `tests/security/security-tests.test.js`.
   - Luego `tests/api-contracts/openapi-compliance.test.js`.
   - Luego `docs/api-openapi-3.1.yaml`.
   - Finalmente `docs/api-proveedor-openapi-3.1.yaml`.

**3. DEPENDENCIAS:**
   - Fase 22 completada.
   - Servicios: endpoints accesibles para pruebas.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas trabajando en pruebas de performance, seguridad y contratos OpenAPI.
Tarea especifica: Analiza los archivos listados y busca endpoints sin cobertura, discrepancias con OpenAPI, umbrales de performance mal definidos y escenarios de seguridad faltantes.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (contract mismatch, umbrales irreales)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Spec/Test | Gap | Fix` y lista de endpoints de riesgo alto.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Propone un set minimo de escenarios de seguridad y como ejecutarlos."

**6. CRITERIO DE EXITO:**
   - OpenAPI refleja la realidad y performance tiene umbrales medibles.

---

### FASE 24: INTEGRACION 6 - Release candidate y regresion

**1. OBJETIVO DE ESTA FASE:**
   - Completar regresion y asegurar release reproducible.

**2. ARCHIVOS INVOLUCRADOS:**
   - Primero `package.json`.
   - Luego `minimarket-system/package.json`.
   - Luego `tests/package.json`.
   - Luego `vitest.config.ts`.
   - Luego `vitest.integration.config.ts`.
   - Luego `vitest.e2e.config.ts`.
   - Luego `migrate.sh`.
   - Luego `deploy.sh`.
   - Luego `scripts/run-integration-tests.sh`.
   - Finalmente `scripts/run-e2e-tests.sh`.

**3. DEPENDENCIAS:**
   - Fases 21 a 23 completadas.

**4. PROMPT PARA GITHUB COPILOT:**
```
Contexto: Estas cerrando un release candidate con regresion completa.
Tarea especifica: Analiza los archivos listados y busca pasos faltantes en build/test/deploy, validaciones previas ausentes y rollback inseguro.
Checklist de revision:
- [ ] Errores de sintaxis
- [ ] Fallos logicos (orden incorrecto, pasos omitidos)
- [ ] Vulnerabilidades de seguridad
- [ ] Codigo redundante o no optimizado
- [ ] Validaciones faltantes
Formato de salida esperado: Entrega un reporte con `Paso | Riesgo | Ajuste` y un checklist final de release.
Si encuentras algo que no puedes corregir automaticamente, lista exactamente que necesita revision manual y por que.
```

**5. PRUEBA DE VERIFICACION:**
   - "Genera un checklist final de release y los comandos exactos para regresion y build."

**6. CRITERIO DE EXITO:**
   - Suite completa pasa, build reproducible y rollback definido.

---

## MAPA DE RUTA VISUAL
Primero estabiliza base de datos y utilidades compartidas, luego valida gateway y API proveedor, despues asegura scraper + cron y sus integraciones, cierra alertas/reportes/operacion, y finalmente consolida frontend + pruebas + release con regresion completa.

## ESTIMACION DE TIEMPO (aprox)
- FASE 1: 45-60 min
- FASE 2: 45-60 min
- FASE 3: 30-45 min
- FASE 4: 20-30 min
- FASE 5: 45-60 min
- FASE 6: 45-60 min
- FASE 7: 45-60 min
- FASE 8: 20-30 min
- FASE 9: 45-60 min
- FASE 10: 60-90 min
- FASE 11: 45-60 min
- FASE 12: 20-30 min
- FASE 13: 30-45 min
- FASE 14: 30-45 min
- FASE 15: 45-60 min
- FASE 16: 20-30 min
- FASE 17: 45-60 min
- FASE 18: 60-90 min
- FASE 19: 45-60 min
- FASE 20: 30-45 min
- FASE 21: 30-45 min
- FASE 22: 45-60 min
- FASE 23: 45-60 min
- FASE 24: 30-45 min

## KIT DE EMERGENCIA
- Deshabilitar cron jobs en `supabase/cron_jobs/*.json` si hay fallas criticas.
- Revertir al ultimo commit estable y redeploy con `deploy.sh`.
- Restaurar DB desde backup/snapshot previo y documentar cambios manuales.
- Desactivar funciones criticas via config o feature flag temporal.
- Ejecutar smoke tests minimos antes de reabrir trafico.
