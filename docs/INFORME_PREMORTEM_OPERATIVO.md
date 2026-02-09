# INFORME PRE-MORTEM OPERATIVO — Mini Market System
**Fecha:** 2026-02-04  
**Versión del análisis:** 1.0  
**Fuente de verdad:** Repositorio (código + configuración)

## 1) Alcance, Supuestos y Datos No Verificables
- Alcance: `supabase/functions`, `supabase/migrations`, `supabase/cron_jobs`, `minimarket-system/src`, `docs/*` (runbooks, SLO/SLA, deployment).
- Metodología aplicada: RealityCheck + DocuGuard (auditoría operativa + consistencia documental).

Supuestos (máx 10):
- El sistema opera como single-tenant (roles `admin/deposito/ventas`, no multi-tenant estricto).
- `api-minimarket` es el gateway principal para writes y lecturas UI.
- `api-proveedor` es server-to-server y no expuesto a usuarios finales.
- Los cron jobs de `supabase/cron_jobs/*` están activos en PROD.
- El endpoint `/auth/v1/user` es la fuente de validación de JWT en runtime.
- `ALLOWED_ORIGINS` está configurado en PROD con dominio real.
- Secrets de SMTP/Slack/Twilio existen en PROD si se requiere notificación real.
- PostgREST/RPC responden dentro de 10s en condiciones normales.

Datos no verificables y cómo verificarlos (comandos/archivos/señales):
- Flags `verify_jwt` por Edge Function (especialmente `api-minimarket`, `cron-*`, `scraper-*`).
  Comando: `supabase functions list --project-ref <ref>` o Dashboard > Functions > Settings.
- Estado real de cron jobs en PROD.
  SQL: `select * from cron.job order by jobname;` en SQL Editor.
- Pooling y límites de conexiones en PROD.
  SQL: `show max_connections;` y ver configuración en Supabase Dashboard > Database > Pooling.
- Integraciones de notificaciones (SMTP/Twilio/Slack/Webhooks).
  Verificar secrets en Dashboard > Project Settings > Secrets y ejecutar smoke real.
- Log drains / tracing / métricas en PROD.
  Verificar en Dashboard > Logs / Integrations o configuración de exportadores.

## 2) Mapa Operativo (solo lo mínimo necesario)
- UI React (`minimarket-system`) → `/functions/v1/api-minimarket` → PostgREST/RPC → DB.
- API interna (`/functions/v1/api-proveedor`) → `scraper-maxiconsumo` → DB + `cache_proveedor`.
- `pg_cron` (JSON en `supabase/cron_jobs`) → `/functions/v1/cron-jobs-maxiconsumo` → jobs → `cron_jobs_*`.
- `cron-health-monitor` → métricas DB → alertas + “auto-recovery”.

Puntos de entrada/salida y dependencias externas:
- Entradas: `api-minimarket`, `api-proveedor`, `cron-jobs-maxiconsumo`, `scraper-maxiconsumo`.
- Dependencias externas: Supabase Auth (`/auth/v1/user`), sitio Maxiconsumo (scraping), SMTP/Slack/Twilio (notificaciones).

## 3) Riesgos Críticos y Mejoras de Ingeniería (hallazgos)

### [R-001] Reserva/stock no atómico → sobreventa y stock negativo
**Severidad:** P0  
**Categoría:** Concurrencia / Datos  
**Superficie afectada:** `/reservas` + `sp_movimiento_inventario`

**Escenario real (historia corta):**  
Dos usuarios reservan el mismo producto casi al mismo tiempo. Ambos pasan el check de stock y se inserta la reserva. Luego los movimientos de inventario se actualizan en paralelo sin locking. Resultado: stock negativo o sobreventa.

**Impacto (usuario/negocio/operación):**
- Usuario: confirma reserva que luego no se puede cumplir.
- Negocio: venta con stock inexistente; pérdida de confianza y margen.
- Operación: reconciliación manual de inventario y reservas.

**EVIDENCIA en repo (obligatorio):**
- Archivo(s): `supabase/functions/api-minimarket/index.ts` — `/reservas` valida stock y luego inserta reserva sin transacción.
- Extracto breve:
```ts
const stockInfo = await callFunction(supabaseUrl, 'fnc_stock_disponible', requestHeaders(), {
  p_producto_id: producto_id,
  p_deposito: depositoValue,
});
...
if (disponibleNumero < cantidadNumero) return respondFail('INSUFFICIENT_STOCK', ...);

const reserva = await insertTable(supabaseUrl, 'stock_reservado', requestHeaders(), {
  producto_id,
  cantidad: cantidadNumero,
  estado: 'activa',
  referencia: referenciaValue,
  usuario: user!.id,
  fecha_reserva: new Date().toISOString(),
});
```
- Archivo(s): `supabase/migrations/20260109090000_update_sp_movimiento_inventario.sql` — lectura y update sin locking.
- Extracto breve:
```sql
SELECT COALESCE(cantidad_actual, 0)
  INTO v_stock_actual
FROM stock_deposito
WHERE producto_id = p_producto_id AND ubicacion = v_ubicacion
LIMIT 1;
...
UPDATE stock_deposito
  SET cantidad_actual = v_stock_nuevo
WHERE producto_id = p_producto_id AND ubicacion = v_ubicacion;
```

**Causa raíz probable (técnica):**
- Read-then-write sin `SELECT ... FOR UPDATE` ni `UPDATE ... WHERE stock >= ...`.
- No hay idempotency key ni constraint único que impida doble reserva.

**Señales / Cómo detectarlo (SLIs):**
- Métrica: `count(*)` de `stock_deposito` con `cantidad_actual < 0`.
- Métrica: reservas duplicadas por `producto_id` y ventana <1s.
- Alerta: tasa de `INSUFFICIENT_STOCK` después de `reserva creada` > 0.5%.

**Solución técnica avanzada (concreta):**
- Mover reserva a una función transaccional única (`sp_reservar_stock`) con `SELECT ... FOR UPDATE` o `UPDATE ... WHERE cantidad_actual >= ... RETURNING`.
- Agregar `idempotency_key` en `stock_reservado` + índice único (`producto_id`, `idempotency_key`).
- Usar `pg_advisory_xact_lock(hash(producto_id))` para serializar por producto.
- En UI, bloquear doble submit y mostrar “reserva en proceso” con confirmación única.
- Rollout seguro: migración expand/contract (añadir columna + constraint, desplegar gateway con key obligatoria, luego limpiar).

**Acción inmediata (P0):**
- Hotfix de doble-submit en UI + header `Idempotency-Key` obligatorio en `/reservas`.
- Agregar constraint único temporal y rechazar duplicados con `409`.

**Trade-offs / coste / riesgo residual:**
- Mayor contención/latencia bajo alta concurrencia.
- Riesgo de deadlocks si no se ordenan locks por producto.
- Necesita backfill y manejo de reservas existentes.

---

### [R-002] Cron jobs sin control de concurrencia/dedupe → ejecuciones duplicadas
**Severidad:** P1  
**Categoría:** Concurrencia / Infra  
**Superficie afectada:** `cron-jobs-maxiconsumo`, `cron_jobs_execution_log`

**Escenario real (historia corta):**  
El job `realtime_change_alerts` corre cada 15 min. Si una ejecución tarda más, la siguiente se dispara igual. Con reintentos HTTP, se duplican alertas y escrituras.

**Impacto (usuario/negocio/operación):**
- Usuario: alertas repetidas o inconsistentes.
- Negocio: métricas infladas, notificaciones duplicadas.
- Operación: aumento de costos y ruido operativo.

**EVIDENCIA en repo (obligatorio):**
- Archivo(s): `supabase/cron_jobs/job_realtime_alerts.json` — cron cada 15 min con `net.http_post`.
- Extracto breve:
```json
"cron_expression": "*/15 * * * *",
"edge_function_name": "cron-jobs-maxiconsumo",
"raw_sql": "... SELECT cron.schedule('realtime_change_alerts', '*/15 * * * *', 'CALL realtime_change_alerts_5a9b4c2d()');"
```
- Archivo(s): `supabase/functions/cron-jobs-maxiconsumo/orchestrator.ts` — no hay lock ni dedupe.
- Extracto breve:
```ts
export function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
...
const result = await Promise.race([
  handler(ctx, supabaseUrl, serviceRoleKey, jobLog),
  new Promise<JobResult>((_, reject) => setTimeout(() => reject(new Error('Job timeout')), config.timeoutMs))
]);
```
- Archivo(s): `supabase/migrations/20260104020000_create_missing_objects.sql` — `cron_jobs_execution_log` sin constraint único.
- Extracto breve:
```sql
CREATE TABLE IF NOT EXISTS cron_jobs_execution_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL,
  execution_id text,
  ...
);
```

**Causa raíz probable (técnica):**
- `pg_cron` es at-least-once y no hay lock distribuido.
- No hay dedupe por `execution_id`/`run_id`.

**Señales / Cómo detectarlo (SLIs):**
- Métrica: ejecuciones simultáneas por `job_id` (`start_time` solapado).
- Métrica: alertas generadas por job > 2x baseline.
- Alerta: `cron_jobs_execution_log` con >1 ejecución activa del mismo job.

**Solución técnica avanzada (concreta):**
- Implementar `pg_advisory_lock` por `job_id` en la stored procedure o al inicio del handler.
- Agregar índice único en (`job_id`, `run_id`) y rechazar duplicados.
- Registrar `status=in_progress` con TTL y hacer `skip` si ya existe.
- Rollout seguro: agregar columna/índice, luego habilitar lock y dedupe.

**Trade-offs / coste / riesgo residual:**
- Jobs podrían quedarse “bloqueados” si no se libera el lock (requiere TTL/cleanup).
- Complejidad extra en orquestador y DB.

---

### [R-003] Rate limiting y circuit breaker en memoria → bypass y falsos 429
**Severidad:** P1  
**Categoría:** Resiliencia / Seguridad  
**Superficie afectada:** `api-minimarket`, `api-proveedor`, `_shared/*`

**Escenario real (historia corta):**  
En tráfico 10x, múltiples instancias Edge crean su propio contador. Un atacante distribuye requests y el rate limit no se aplica globalmente. En paralelo, el IP “unknown” agrupa usuarios y bloquea tráfico legítimo.

**Impacto (usuario/negocio/operación):**
- Usuario: 429 intermitentes o bypass total.
- Negocio: degradación o abuso no controlado.
- Operación: difícil de mitigar sin WAF externo.

**EVIDENCIA en repo (obligatorio):**
- Archivo(s): `supabase/functions/_shared/rate-limit.ts` — buckets en `Map` (memoria por instancia).
- Extracto breve:
```ts
export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, RateLimitState>();
  ...
}
```
- Archivo(s): `supabase/functions/_shared/circuit-breaker.ts` — breakers en `Map`.
- Extracto breve:
```ts
const CIRCUIT_BREAKERS = new Map<string, CircuitBreaker>();
```
- Archivo(s): `supabase/functions/api-minimarket/index.ts` — IP fallback a `unknown`.
- Extracto breve:
```ts
function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
}
```

**Causa raíz probable (técnica):**
- Estado de rate limit/circuit breaker no compartido entre instancias.
- Identificador de cliente débil (fallback `unknown`).

**Señales / Cómo detectarlo (SLIs):**
- Métrica: 429 con alto % de `clientIp=unknown`.
- Métrica: discrepancia entre rate-limits y tráfico real por PoP.
- Alerta: picos de requests sin aumento en 429.

**Solución técnica avanzada (concreta):**
- Centralizar rate limit (Redis/Supabase KV) y usar claves por `userId` + `ip`.
- Validar y normalizar `x-forwarded-for`/`cf-connecting-ip`.
- Persistir estado de circuit breaker en DB/KV y leer antes de `allowRequest`.
- Complementar con WAF/CDN rate limiting.

**Trade-offs / coste / riesgo residual:**
- Latencia adicional por store compartido.
- Complejidad operativa de Redis/KV.

---

### [R-004] Auto-recovery no afecta breakers reales → “self-healing” ilusorio
**Severidad:** P1  
**Categoría:** Resiliencia / Operación  
**Superficie afectada:** `cron-health-monitor`, `cron-jobs-maxiconsumo`

**Escenario real (historia corta):**  
El health monitor detecta degradación y “resetea” circuit breakers en DB. Pero el breaker real está en memoria de otra instancia y sigue en `open`. El sistema no se recupera aunque el dashboard lo marque “cerrado”.

**Impacto (usuario/negocio/operación):**
- Usuario: servicios siguen caídos aunque “recuperados”.
- Negocio: downtime extendido.
- Operación: toil manual por inconsistencias de estado.

**EVIDENCIA en repo (obligatorio):**
- Archivo(s): `supabase/functions/cron-health-monitor/index.ts` — recovery actúa sobre `cron_jobs_tracking`.
- Extracto breve:
```ts
const circuitBreakersResponse = await fetch(`${supabaseUrl}/rest/v1/cron_jobs_tracking?select=*&circuit_breaker_state=eq.open`, ...);
...
recoveryActions.push({ type: 'reset_circuit_breaker', target: job.job_id, ... });
```
- Archivo(s): `supabase/functions/cron-jobs-maxiconsumo/orchestrator.ts` — breaker real en memoria.
- Extracto breve:
```ts
const breaker = getCircuitBreaker(`cron-${jobId}`, { ... });
if (!breaker.allowRequest()) throw new Error(`Circuit breaker open for job: ${jobId}`);
```

**Causa raíz probable (técnica):**
- Estado del breaker en memoria no sincronizado con DB.
- Auto-recovery actúa en metadata, no en estado real.

**Señales / Cómo detectarlo (SLIs):**
- Métrica: `cron_jobs_tracking.circuit_breaker_state='closed'` pero job sigue fallando con `Circuit breaker open`.
- Alerta: health monitor marca recovery ejecutado sin aumento en éxito de jobs.

**Solución técnica avanzada (concreta):**
- Persistir estado del breaker (DB/KV) y consultarlo en `allowRequest`.
- Exponer endpoint para reset real del breaker por job.
- Ajustar health monitor para operar sobre el mismo store que los breakers.

**Trade-offs / coste / riesgo residual:**
- Mayor complejidad y costo de storage compartido.
- Necesidad de migración y backward compatibility.

---

### [R-005] Validación JWT vía `/auth/v1/user` en cada request → latencia y dependencia crítica
**Severidad:** P1  
**Categoría:** Resiliencia / UX  
**Superficie afectada:** `api-minimarket` auth

**Escenario real (historia corta):**  
Supabase Auth responde lento o con errores. Cada request al gateway depende de esa llamada. Resultado: latencias altas, fallos generalizados y UX degradada.

**Impacto (usuario/negocio/operación):**
- Usuario: pantallas quedan cargando o errores 401/500.
- Negocio: interrupción de operaciones básicas.
- Operación: dependencia externa sin cache.

**EVIDENCIA en repo (obligatorio):**
- Archivo(s): `supabase/functions/api-minimarket/helpers/auth.ts` — fetch por request a `/auth/v1/user`.
- Extracto breve:
```ts
const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
  headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
});
```
- Archivo(s): `docs/DEPLOYMENT_GUIDE.md` — `api-minimarket` desplegado con `--no-verify-jwt`.
- Extracto breve:
```md
supabase functions deploy api-minimarket --no-verify-jwt --use-api
```

**Causa raíz probable (técnica):**
- `verify_jwt` deshabilitado → validación depende de llamada externa.
- No hay cache de sesión ni fallback.

**Señales / Cómo detectarlo (SLIs):**
- Métrica: latencia p95 de `/auth/v1/user` > 500ms.
- Métrica: porcentaje de 401/500 en gateway correlacionado con Auth.
- Alerta: spikes de `AUTH_ERROR` en logs del gateway.

**Solución técnica avanzada (concreta):**
- Rehabilitar `verify_jwt` cuando sea posible (resolver ES256 de forma nativa).
- Cachear validación JWT (TTL corto) o usar `JWT` local verification.
- Añadir timeout + circuit breaker específico para Auth.

**Trade-offs / coste / riesgo residual:**
- Cache de JWT aumenta complejidad y riesgo de aceptar tokens revocados.
- Requiere coordinación con configuración de Supabase/Auth.

---

### [R-006] Notificaciones en modo “simulación” → alertas críticas no salen
**Severidad:** P1  
**Categoría:** Observabilidad / Operación  
**Superficie afectada:** `cron-notifications`

**Escenario real (historia corta):**  
Se dispara una alerta crítica (stock crítico o degradación). El sistema registra “SIMULATION_*” y no envía email/SMS/Slack real. Nadie se entera.

**Impacto (usuario/negocio/operación):**
- Usuario: no recibe alertas ni comunicación.
- Negocio: incidentes no detectados a tiempo.
- Operación: falsa sensación de cobertura.

**EVIDENCIA en repo (obligatorio):**
- Archivo(s): `supabase/functions/cron-notifications/index.ts` — envío simulado.
- Extracto breve:
```ts
// En implementación real, aquí se enviaría el email
logger.info('SIMULATION_EMAIL_SEND', { ... });
...
// En implementación real, aquí se enviaría SMS via Twilio
logger.info('SIMULATION_SMS_SEND', { ... });
...
logger.info('SIMULATION_SLACK_SEND', { ... });
logger.info('SIMULATION_WEBHOOK_SEND', { ... });
```

**Causa raíz probable (técnica):**
- Integraciones externas no implementadas o deshabilitadas.

**Señales / Cómo detectarlo (SLIs):**
- Métrica: alertas generadas sin `message_id` real.
- Alerta: logs `SIMULATION_*` en ambiente PROD.

**Solución técnica avanzada (concreta):**
- Implementar proveedores reales (SMTP/Twilio/Slack) con env `NOTIFICATIONS_MODE=real`.
- Bloquear despliegue si `NOTIFICATIONS_MODE=simulation` en PROD.
- Añadir tests end-to-end de entrega con sandbox.

**Trade-offs / coste / riesgo residual:**
- Costos operativos (SMS/Email).
- Requiere verificación de dominios/whitelists.

---

### [R-007] API proveedor con shared secret y origin “solo warning” → superficie de abuso
**Severidad:** P1  
**Categoría:** Seguridad / Infra  
**Superficie afectada:** `api-proveedor`

**Escenario real (historia corta):**  
El secret se filtra (logs, CI, proveedor). Un atacante dispara `/sincronizar` repetidamente, forzando scraping pesado y saturando el sistema o el proveedor externo.

**Impacto (usuario/negocio/operación):**
- Usuario: degradación del sistema por saturación.
- Negocio: bloqueo/baneo del proveedor, costos extra.
- Operación: rotación urgente de secretos.

**EVIDENCIA en repo (obligatorio):**
- Archivo(s): `supabase/functions/api-proveedor/utils/auth.ts` — shared secret y allowlist pendiente.
- Extracto breve:
```ts
// TODO: Implementar lista blanca de orígenes internos
export function validateInternalOrigin(request: Request): { valid: boolean; warning?: string } { ... }
```
- Archivo(s): `supabase/functions/api-proveedor/index.ts` — origin inválido no bloquea (warning).
- Extracto breve:
```ts
const originCheck = validateInternalOrigin(request);
if (originCheck.warning) {
  logger.warn('INTERNAL_API_ORIGIN_WARNING', { ... });
}
```

**Causa raíz probable (técnica):**
- Autenticación basada solo en secret compartido.
- Falta de allowlist + controles de origen.

**Señales / Cómo detectarlo (SLIs):**
- Métrica: llamadas a `/sincronizar` por minuto > umbral esperado.
- Alerta: warnings `INTERNAL_API_ORIGIN_WARNING` en PROD.

**Solución técnica avanzada (concreta):**
- Firmar requests con HMAC + timestamp (replay protection).
- IP allowlist (gateway/cron) y rotación programada de secretos.
- Rate limiting centralizado por `source` y `job_type`.

**Trade-offs / coste / riesgo residual:**
- Mayor complejidad de integración server-to-server.
- Requiere gestión segura de claves rotativas.

---

### [R-008] Frontend sin timeout/cancel → esperas largas y doble acción
**Severidad:** P2  
**Categoría:** UX / Resiliencia  
**Superficie afectada:** `minimarket-system/src/lib/apiClient.ts`

**Escenario real (historia corta):**  
La API tarda >20s. El usuario ve “Cargando...” sin tiempo máximo. Vuelve a intentar o refresca, generando duplicados en operaciones mutables.

**Impacto (usuario/negocio/operación):**
- Usuario: percepción de app “colgada”.
- Negocio: duplicados por reintentos manuales.
- Operación: soporte por inconsistencias.

**EVIDENCIA en repo (obligatorio):**
- Archivo(s): `minimarket-system/src/lib/apiClient.ts` — fetch sin AbortController/timeout.
- Extracto breve:
```ts
const response = await fetch(`${API_BASE_URL}${endpoint}`, {
  ...options,
  headers,
});
```

**Causa raíz probable (técnica):**
- No hay timeout en fetch ni cancelación de requests.

**Señales / Cómo detectarlo (SLIs):**
- Métrica: tiempo medio en estados `isLoading` > 5s.
- Alerta: reintentos de usuario (doble submit) por endpoint.

**Solución técnica avanzada (concreta):**
- Implementar timeout con `AbortController` (p.ej. 10s).
- UI con “toma más de lo normal” y botón “Cancelar”.
- Idempotency keys en mutaciones críticas para mitigar duplicados.

**Trade-offs / coste / riesgo residual:**
- Timeouts agresivos pueden cortar requests válidos lentos.
- Requiere manejo de errores y reintentos en UI.

---

### [R-009] Observabilidad parcial (sin trazas ni reporting central de UI)
**Severidad:** P1  
**Categoría:** Observabilidad / Operación  
**Superficie afectada:** Frontend + Edge Functions

**Escenario real (historia corta):**  
Ocurre un incidente intermitente. Los errores de UI quedan en localStorage y los logs de backend están aislados. Sin correlación, el diagnóstico se vuelve lento y manual.

**Impacto (usuario/negocio/operación):**
- Usuario: errores recurrentes sin resolución rápida.
- Negocio: mayor MTTR.
- Operación: falta de señales accionables.

**EVIDENCIA en repo (obligatorio):**
- Archivo(s): `minimarket-system/src/lib/observability.ts` — almacenamiento local, TODO Sentry.
- Extracto breve:
```ts
// TODO: Integrar Sentry cuando haya credenciales
const STORAGE_KEY = 'mm_error_reports_v1';
... localStorage.setItem(...)
```
- Archivo(s): `supabase/functions/_shared/logger.ts` — logging via `console.*`.
- Extracto breve:
```ts
if (level === 'error') { console.error(line); return; }
```
- Archivo(s): `docs/C4_SLA_SLO_MINIMARKET_TEC.md` — SLOs en borrador.
- Extracto breve:
```md
Latencia P95 API: < 500 ms (pendiente de medición real).
```

**Causa raíz probable (técnica):**
- No hay pipeline de logs/traces centralizado.
- Errores UI no salen del cliente.

**Señales / Cómo detectarlo (SLIs):**
- Ausencia de correlation id end-to-end (UI→gateway→DB).
- Alertas tardías o sin contexto de usuario.

**Solución técnica avanzada (concreta):**
- Integrar Sentry/LogRocket para frontend y export de logs en Supabase.
- Propagar `x-request-id` desde UI a gateway y a PostgREST.
- Definir SLIs reales (p95, error rate, success rate de cron) y alertas.

**Trade-offs / coste / riesgo residual:**
- Costos de observabilidad y data retention.
- Requiere disciplina en logging estructurado.

---

### [R-010] Cachés en memoria sin coherencia multi-instancia
**Severidad:** P2  
**Categoría:** Datos / Rendimiento  
**Superficie afectada:** `scraper-maxiconsumo`, `api-proveedor`

**Escenario real (historia corta):**  
Una instancia cachea datos de scraping pero otra no. Bajo carga, se produce “stampede” y se incrementan llamadas externas. Datos inconsistentes entre usuarios.

**Impacto (usuario/negocio/operación):**
- Usuario: datos desalineados entre sesiones.
- Negocio: presión extra sobre proveedor externo.
- Operación: costos por tráfico y errores de scraping.

**EVIDENCIA en repo (obligatorio):**
- Archivo(s): `supabase/functions/scraper-maxiconsumo/cache.ts` — cache global en memoria.
- Extracto breve:
```ts
const GLOBAL_CACHE = new Map<string, CacheEntry>();
```
- Archivo(s): `supabase/functions/api-proveedor/utils/cache.ts` — cache en memoria.
- Extracto breve:
```ts
export const API_CACHE = new Map<string, { data: any; timestamp: number; ttl: number }>();
```

**Causa raíz probable (técnica):**
- Cache no compartida entre instancias Edge.
- Falta de singleflight/stampede protection.

**Señales / Cómo detectarlo (SLIs):**
- Hit rate variable entre instancias.
- Aumento de scraping externo cuando hay despliegues/cold starts.

**Solución técnica avanzada (concreta):**
- Cache compartida (Redis/Supabase table `cache_proveedor` como read-through).
- Implementar singleflight por key y TTL con jitter.
- Métricas de hit rate a nivel global.

**Trade-offs / coste / riesgo residual:**
- Dependencia de storage adicional.
- Mayor complejidad de invalidación.

---

### [R-011] Pooling/DB saturation no verificada en PROD
**Severidad:** P2  
**Categoría:** Infra / Rendimiento  
**Superficie afectada:** PostgREST/DB connections

**Escenario real (historia corta):**  
En un pico de tráfico, el pool de conexiones se agota. Las llamadas a PostgREST se bloquean y disparan timeouts y circuit breakers.

**Impacto (usuario/negocio/operación):**
- Usuario: latencias altas y errores.
- Negocio: interrupción parcial.
- Operación: necesidad de escalar o reiniciar servicios.

**EVIDENCIA en repo (obligatorio):**
- Archivo(s): `supabase/config.toml` — pooler deshabilitado en config local.
- Extracto breve:
```toml
[db.pooler]
enabled = false
default_pool_size = 20
```

**Causa raíz probable (técnica):**
- Pooling real en PROD no documentado ni validado.
- Sin límites ni backpressure explícito.

**Señales / Cómo detectarlo (SLIs):**
- Métrica: p95 de queries > 2s.
- Métrica: errores por `timeout` en gateway.

**Solución técnica avanzada (concreta):**
- Verificar pooler en PROD y habilitar `transaction` pooling.
- Ajustar `max_connections` y límites por servicio.
- Load test con umbrales y alertas de saturación.

**Trade-offs / coste / riesgo residual:**
- Cambios de pool pueden impactar latencias si mal configurado.
- Requiere pruebas de carga reales.

---

## 4) Roadmap de Mitigación (por ROI)
- **24 horas:**
- Acción inmediata (P0): agregar idempotency key en `/reservas` + constraint único + bloqueo doble-submit en UI.
- Implementar `pg_advisory_lock` por `job_id` en cron-jobs para evitar solapamientos.
- Bloquear despliegue si `cron-notifications` está en modo simulación en PROD.

- **7 días:**
- Implementar `sp_reservar_stock` transaccional y migrar `/reservas` a esa función.
- Centralizar rate limiting/circuit breaker (store compartido) y ajustar claves por usuario/IP.
- Hardening de `api-proveedor`: HMAC + allowlist + rotación de secret.
- Timeouts en `apiClient` + UX “toma más de lo normal” con cancel.

- **30 días:**
- Observabilidad end-to-end (Sentry/OTel/log drains) + SLIs reales + alertas.
- Cache compartida con TTL + singleflight.
- Verificación de pooling en PROD + pruebas de carga con thresholds.

## 5) Checklist Go/No-Go (Producción)
- Ingesta / idempotencia / dedupe: idempotency keys en writes críticos; constraints únicas activas.
- Concurrencia / sesiones / locks: locks por producto en reservas; jobs sin solapamiento.
- DB / pooling / transacciones: pooling validado en PROD; transacciones atómicas en stock.
- Colas / workers / outbox: ejecución cron con dedupe; side effects auditados.
- Resiliencia: rate limiting y breakers centralizados; backpressure definido.
- Observabilidad: requestId end-to-end; SLOs medidos; alertas accionables.
- Deploy safety: migraciones expand/contract; rollback probado y documentado.
- Seguridad: secretos rotados; allowlist/firmado en API interna; verify_jwt confirmado.
