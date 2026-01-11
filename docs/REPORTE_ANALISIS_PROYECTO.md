# REPORTE FINAL DE ANALISIS DEL PROYECTO (v2)

**Fecha:** 2026-01-11  
**Estado:** consolidado (modo sin credenciales para E2E)  
**Fuente:** revisión estática del repo + unit tests (`npm run test:unit` 91/91 OK) + docs internas.

---

## 1) Resumen ejecutivo (accionable)
- Gateway y API proveedor ahora responden con formato estándar `ok`/`fail` y `requestId`; CORS y auth están alineados, pero E2E sigue bloqueado hasta contar con `.env.test` real.
- Scraper endurecido: delays 1.5–6s, backoff 429/503, allowlist de hosts/slug, timeout configurable (5–60s) y cookie jar/proxy/CAPTCHA desactivados por defecto.
- Riesgos abiertos: falta de conteo real en Dashboard, movimiento de depósito no atómico y uso histórico de service role en gateway (requiere validar en entorno real).
- Documentación y scripts incluyen modo `--dry-run` para validar prerequisitos sin credenciales; backlog ajustado para trabajar sin Supabase real.

---

## 2) Alcance y límites
**Dentro:** Frontend (`minimarket-system/src`), Edge Functions (`supabase/functions/*`), docs en `docs/`, scripts de tests.  
**Fuera:** Telemetría real, validación de RLS/índices en Supabase productivo, pruebas con usuarios.

---

## 3) Hallazgos críticos (P0)
1. **Conteo Dashboard incorrecto** – usa `productos.length` tras `head:true`; data nula.  
   Archivo: `minimarket-system/src/pages/Dashboard.tsx`.
2. **Movimientos de depósito no atómicos** – inserta movimiento y actualiza stock en pasos separados, sin validar stock.  
   Archivo: `minimarket-system/src/pages/Deposito.tsx`.
3. **Gateway con service role y CORS laxo (histórico)** – riesgo si no se valida en entorno real; falta confirmar que consultas normales usen JWT/anon.  
   Archivo: `supabase/functions/api-minimarket/index.ts`.

---

## 4) Hallazgos de rendimiento (P1)
1. **N+1 en Productos/Proveedores** – múltiples fetch por ítem.  
   Archivos: `minimarket-system/src/pages/Productos.tsx`, `.../Proveedores.tsx`.
2. **Agregaciones de stock en cliente** – cálculos locales con payload grande.  
   Archivo: `minimarket-system/src/pages/Stock.tsx`.
3. **`select('*')` y sin paginación** – listas cargan dataset completo.  
   Archivos: Dashboard/Productos/Proveedores/Stock.

---

## 5) UX / fricción operativa (P1)
- Errores silenciosos en UI (solo consola), sin reintentos.  
  Archivos: varias páginas en `minimarket-system/src/pages/*`.
- Depósito sin confirmación de stock/rollback.  
- Tareas usa `prompt` y usuario fijo (sin trazabilidad).  
  Archivo: `.../Tareas.tsx`.

---

## 6) Mantenibilidad / arquitectura (P1)
- Gateway monolítico (~1000 líneas) y aún no usa sistemáticamente `_shared/response`.  
  Archivo: `supabase/functions/api-minimarket/index.ts`.
- ErrorBoundary expone stack en prod (typo `searilizeError`).  
  Archivo: `minimarket-system/src/components/ErrorBoundary.tsx`.

---

## 7) Seguridad (P1)
- Roles basados en `user_metadata` sin validación server-side.  
  Archivo: `supabase/functions/api-minimarket/index.ts`.
- CORS del gateway debe confirmarse contra `ALLOWED_ORIGINS`; riesgo de `*` en despliegue real.

---

## 8) Estado actualizado de hardening reciente
- **API proveedor** (`supabase/functions/api-proveedor/*`): auth por `x-api-secret`, CORS allowlist, respuestas `ok`/`fail` con `requestId`, rate-limit y circuit breaker alineados.
- **Scraper Maxiconsumo** (`supabase/functions/scraper-maxiconsumo/*`): timeout configurable (`SCRAPER_TIMEOUT_MS` 5–60s), guardas para HTML vacío, backoff 429/503, UA 2025, allowlist de URL/slug, cookie jar/proxy/CAPTCHA opcionales y apagados por defecto.
- **Scripts de tests**: modo `--dry-run` en `scripts/run-e2e-tests.sh` y `scripts/run-integration-tests.sh` para validar prerequisitos sin credenciales.

---

## 9) Recomendaciones priorizadas
**P0 (inmediato, requiere código):**
1. Dashboard: usar `Prefer: count=exact` + `count` real; manejar nulos.  
2. Depósito: mover a RPC/Edge con validación de stock y transacción.  
3. Gateway: asegurar queries con JWT/anon; reservar service role solo para tareas admin; CORS restringido.

**P1 (corto plazo, puede avanzar sin credenciales):**
1. Paginación y `select` mínimo en listas.  
2. Eliminar N+1 con vistas/RPC.  
3. Error handling visible en UI + reintentos simples.

**P2 (mediano plazo):**
1. Alertas proactivas (stock/vencimientos) y motor de notificaciones.  
2. Capa de datos con caching (React Query/SWR) e invalidación.  
3. Panel de rentabilidad y reposición sugerida.

---

## 10) Supuestos y riesgos
- **Supuesto:** schema/RLS en Supabase real coincide con migraciones; **Riesgo:** divergencias invalidan parte del análisis.  
- **Supuesto:** gateway es el punto de acceso; **Riesgo:** si UI consume Supabase directo, duplicación de reglas.  
- **Bloqueo actual:** sin `.env.test` real no se ejecutan E2E/integración.

---

## 11) Evidencia y referencias
- Gateway: `supabase/functions/api-minimarket/index.ts`  
- Proveedor: `supabase/functions/api-proveedor/index.ts` y handlers asociados  
- Scraper: `supabase/functions/scraper-maxiconsumo/*.ts`  
- Frontend: `minimarket-system/src/pages/*`, `components/ErrorBoundary.tsx`  
- Scripts: `scripts/run-e2e-tests.sh`, `scripts/run-integration-tests.sh`  
- Backlog: `docs/BACKLOG_PRIORIZADO.md`  
- Plan: `docs/PLAN_TRES_PUNTOS.md`
