# Funciones Cron Auxiliares - Documentación de Arquitectura

## Estado Actual

Las siguientes funciones cron auxiliares están activas:

| Función | Propósito | `_shared/` |
|---------|-----------|------------|
| `cron-testing-suite` | Suite de testing para validar jobs | `logger.ts` |
| `cron-notifications` | Sistema de notificaciones (email/SMS/slack) | `rate-limit.ts`, `logger.ts`, `cors.ts` |
| `cron-dashboard` | API para dashboard de monitoreo | `logger.ts`, `cors.ts` |
| `cron-health-monitor` | Health checks y métricas del sistema | `logger.ts`, `cors.ts` |
| `backfill-faltantes-recordatorios` | Backfill diario idempotente: crea recordatorios en `tareas_pendientes` para faltantes críticos sin tarea asociada. Soporta `?dry_run=true`. | `logger.ts`, `cors.ts`, `response.ts`, `internal-auth.ts` |

## Decisión de Arquitectura

**Decisión: Mantener funciones separadas pero con módulos compartidos.**

### Justificación:

1. **Separación de responsabilidades**: Cada función tiene un propósito claro
2. **Escalabilidad independiente**: Pueden escalar según demanda
3. **Deploy independiente**: Cambios en una no afectan otras
4. **Circuit breakers aislados**: Fallos no se propagan

### Módulos Compartidos Disponibles:

Los siguientes módulos en `_shared/` están disponibles para uso:

- `cors.ts` - Headers CORS unificados
- `logger.ts` - Logging estructurado con niveles
- `errors.ts` - Manejo de errores estandarizado
- `response.ts` - Helpers para respuestas HTTP
- `rate-limit.ts` - Rate limiters adaptativos
- `circuit-breaker.ts` - Circuit breakers
- `audit.ts` - Helpers de auditoría (eventos, trazabilidad)

**Estado de adopción actual:** ✅ Las funciones listadas arriba usan módulos de `_shared/` (ver tabla).

## Integración Recomendada

Para nuevas funciones cron, seguir este patrón:

```typescript
import { createLogger } from '../_shared/logger.ts';
import { getCircuitBreaker } from '../_shared/circuit-breaker.ts';

const logger = createLogger('mi-funcion');
const breaker = getCircuitBreaker('mi-funcion', { failureThreshold: 5 });

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  logger.info({ requestId, event: 'REQUEST_START' });
  
  if (!breaker.allowRequest()) {
    return new Response(JSON.stringify({ error: 'Circuit open' }), { status: 503 });
  }
  
  try {
    // ... lógica
    breaker.recordSuccess();
  } catch (e) {
    breaker.recordFailure();
    logger.error({ requestId, error: e.message });
  }
});
```

## Métricas de Uso

Las funciones comparten tablas de la base de datos:
- `cron_jobs_execution_log` - Logs de ejecución
- `cron_jobs_metrics` - Métricas de performance
- `cron_jobs_alerts` - Alertas generadas
- `cron_jobs_health_checks` - Resultados de health checks

## Próximos Pasos

1. ✅ Módulos compartidos creados en `_shared/`
2. ✅ Patrones documentados
3. 🔄 (Propuesta futura) Estandarizar `errors.ts`/`response.ts` y agregar eventos con `audit.ts` en todas las funciones
4. 📊 (Propuesta futura) Mejorar dashboards de observabilidad (métricas + alertas accionables)
