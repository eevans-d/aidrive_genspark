# Plan Ejecutable: Sentry para Observabilidad UI

**Fecha:** 2026-02-09
**Estado:** BLOQUEADO — sin DSN. Infraestructura local preparada (`observability.ts` + `ErrorBoundary` con placeholder).
**Verificado:** 2026-02-09 (sesion 2) — no hay `VITE_SENTRY_DSN` en secrets ni en `.env.*`. NO instalar `@sentry/react` sin DSN real.

---

## 1) Estado actual

El modulo `minimarket-system/src/lib/observability.ts` ya tiene:

- `reportError()` que acepta `requestId`, `userId` (anonimizado), `source`, `context`
- Almacenamiento en `localStorage` (maximo 50 reportes)
- Placeholder para Sentry: lee `VITE_SENTRY_DSN` y tiene comentario de integracion
- `ErrorBoundary` llama a `reportError()` en `componentDidCatch`

**Lo que falta:** Un DSN de Sentry real y la integracion con `@sentry/react`.

## 2) Prerequisitos

| Requisito | Estado | Accion |
|-----------|--------|--------|
| Cuenta Sentry (free tier suficiente) | NO verificado | Crear en https://sentry.io |
| Proyecto Sentry (plataforma: React) | Pendiente | Crear via Dashboard |
| DSN de Sentry | Pendiente | Se obtiene al crear el proyecto |
| Variable `VITE_SENTRY_DSN` | Placeholder en `observability.ts` | Agregar a `.env.production` |

## 3) Pasos de integracion (cuando DSN este disponible)

### Paso 1: Instalar dependencia

```bash
cd minimarket-system
pnpm add @sentry/react
```

### Paso 2: Inicializar Sentry en `main.tsx`

```typescript
import * as Sentry from '@sentry/react';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.DEV ? 'development' : 'production',
    release: import.meta.env.VITE_BUILD_ID || 'dev',
    tracesSampleRate: 0.1,  // 10% de traces en produccion
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
  });
}
```

### Paso 3: Actualizar `observability.ts`

Reemplazar el placeholder en lineas 152-159:

```typescript
import * as Sentry from '@sentry/react';

// En reportError(), despues de guardar en localStorage:
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.captureException(error instanceof Error ? error : new Error(serialized.message), {
    tags: { source, requestId },
    extra: context,
    user: userHash ? { id: userHash } : undefined,
  });
}
```

### Paso 4: Wrappear ErrorBoundary con Sentry

```typescript
// En ErrorBoundary.tsx
import * as Sentry from '@sentry/react';

// En componentDidCatch:
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.captureException(error, {
    contexts: { componentStack: { value: errorInfo.componentStack } },
  });
}
```

### Paso 5: Variables de entorno

```bash
# .env.production (gitignored)
VITE_SENTRY_DSN=https://xxxx@o1234.ingest.sentry.io/5678
VITE_BUILD_ID=build-$(date +%s)
```

### Paso 6: Verificar

```bash
# Build y verificar que Sentry no se carga sin DSN
pnpm build
# Verificar bundle size: @sentry/react agrega ~30KB gzip
```

## 4) Lo que NO hacer sin DSN

- NO instalar `@sentry/react` (agrega peso al bundle sin beneficio)
- NO crear un DSN "dummy" (genera errores de red)
- NO modificar `observability.ts` mas alla del placeholder existente

## 5) Estimacion de impacto

| Metrica | Sin Sentry | Con Sentry |
|---------|-----------|------------|
| Bundle size | ~52 KB gzip | ~82 KB gzip (+30KB) |
| Error visibility | localStorage solo | Dashboard centralizado |
| x-request-id correlation | Manual (copiar del UI) | Automatico (tags) |
| Alertas | Ninguna | Configurables (email, Slack) |

## 6) Checklist de activacion

- [ ] Crear cuenta/proyecto Sentry
- [ ] Obtener DSN
- [ ] `pnpm add @sentry/react`
- [ ] Implementar pasos 2-4 de este plan
- [ ] Agregar `VITE_SENTRY_DSN` a `.env.production`
- [ ] Build + verificar que errores llegan a Dashboard
- [ ] Configurar alerta en Sentry para errores nuevos
- [ ] Registrar evidencia en `docs/closure/EXECUTION_LOG_*.md`
