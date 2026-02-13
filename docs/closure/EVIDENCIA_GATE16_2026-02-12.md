# EVIDENCIA GATE 16 - Monitoreo Real (Sentry)

**Fecha:** 2026-02-12
**Estado:** PARCIAL (codigo completo, DSN pendiente del owner)

## Descripcion

Integracion de Sentry para monitoreo real de errores en frontend.
Codigo completamente funcional: cuando se configure `VITE_SENTRY_DSN`, los errores
se enviaran automaticamente a Sentry.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `minimarket-system/package.json` | Agregado `@sentry/react@10.38.0` |
| `minimarket-system/src/main.tsx` | Inicializacion de Sentry con DSN condicional |
| `minimarket-system/src/lib/observability.ts` | `reportError()` ahora envia a Sentry.captureException() cuando DSN presente |

## Implementacion

### main.tsx - Inicializacion
```typescript
import * as Sentry from '@sentry/react'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.DEV ? 'development' : 'production',
    release: import.meta.env.VITE_BUILD_ID || 'dev',
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 0.5,
    replaysSessionSampleRate: 0,
  })
}
```

### observability.ts - Captura de errores
```typescript
if (sentryDsn) {
  const err = error instanceof Error ? error : new Error(serialized.message);
  Sentry.captureException(err, {
    tags: { source, requestId, errorId: id },
    extra: { ...context, route, buildVersion },
  });
}
```

## Validaciones ejecutadas

| Validacion | Resultado |
|-----------|-----------|
| Build produccion | PASS (8.48s) |
| Component tests (110) | PASS |
| Lint | PASS |
| E2E POS tests (8) | PASS |

## Impacto bundle

| Metrica | Valor |
|---------|-------|
| index.js (gzip) | ~24.65 KB |
| Incremento estimado por Sentry | ~30 KB gzip (alineado con plan) |

## Checklist para owner - Activacion Sentry

1. [ ] Crear cuenta Sentry (plan free aceptable) en https://sentry.io
2. [ ] Crear proyecto React en Sentry Dashboard
3. [ ] Obtener DSN (formato: `https://xxx@oyyy.ingest.sentry.io/zzz`)
4. [ ] Configurar en entorno de produccion:
   - Vercel: `VITE_SENTRY_DSN=<dsn>` en Settings > Environment Variables
   - O en `.env.production`: `VITE_SENTRY_DSN=<dsn>`
5. [ ] (Opcional) Configurar `VITE_BUILD_ID` en CI para release tracking
6. [ ] Desplegar y verificar que errores aparezcan en Sentry Dashboard
7. [ ] Configurar alerta en Sentry: Projects > Alerts > New Alert Rule

## Comportamiento sin DSN

Cuando `VITE_SENTRY_DSN` no esta configurado:
- `Sentry.init()` no se ejecuta
- `reportError()` guarda errores en localStorage (ultimos 50)
- No hay impacto en performance ni errores en consola
- La aplicacion funciona identicamente a antes
