# Funciones Cron Auxiliares - Documentación de Arquitectura

## Estado Actual

Las siguientes funciones cron auxiliares están activas:

| Función | Líneas | Propósito |
|---------|--------|-----------|
| `cron-testing-suite` | 1413 | Suite de testing para validar jobs |
| `cron-notifications` | 1246 | Sistema de notificaciones (email/SMS/slack) |
| `cron-dashboard` | 1130 | API para dashboard de monitoreo |
| `cron-health-monitor` | 898 | Health checks y métricas del sistema |

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

**Estado de adopción actual:**

| Función | Usa `_shared/`? | Módulos |
|---------|-----------------|---------|
| `cron-notifications` | ⚠️ Parcial | Solo `rate-limit.ts` |
| `cron-testing-suite` | ❌ No | Pendiente migración |
| `cron-dashboard` | ❌ No | Pendiente migración |
| `cron-health-monitor` | ❌ No | Pendiente migración |

> **PENDIENTE:** Migrar las funciones que aún no usan `_shared/` para unificar patrones.

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
3. 🔄 Migrar funciones para usar módulos compartidos (incremental)
4. 📊 Agregar dashboards de observabilidad
