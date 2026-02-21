# Mini Market - Frontend

Estado: Activo
Audiencia: Desarrollo + soporte interno
Ultima actualizacion: 2026-02-21
Fuente de verdad: ../docs/ESTADO_ACTUAL.md
Owner documental: Frontend

> Snapshot de referencia: segun FactPack 2026-02-21.

## Objetivo
Documentar el frontend real del sistema (SPA) y reemplazar el template base de Vite.

## Contexto Operativo Integrado
Este frontend incorpora los flujos implementados y verificados en D-146/D-147/D-148 (Cuaderno Inteligente + ajustes post-Claude + backfill de recordatorios). Para manuales de operacion usar:
- `../docs/MANUAL_USUARIO_FINAL.md`
- `../docs/GUIA_RAPIDA_OPERACION_DIARIA.md`
- `../docs/TROUBLESHOOTING.md`

## Stack
- React 18
- Vite 6
- TypeScript 5.9
- React Router 6
- TanStack Query 5
- Tailwind CSS 3.4
- Radix UI
- Playwright + Vitest

## Rutas Principales
Definidas en `src/App.tsx`:
- `/` Dashboard
- `/pos` POS
- `/cuaderno` Cuaderno de faltantes
- `/stock`, `/productos`, `/proveedores`, `/pedidos`, `/clientes`, `/ventas`, `/tareas`, `/deposito`, `/kardex`, `/rentabilidad`, `/pocket`

## Estructura
```text
minimarket-system/
  src/
    components/
    contexts/
    hooks/
    lib/
    pages/
    types/
    utils/
  deploy/cloudflare/
  public/
```

## Procedimiento Paso A Paso
### 1) Instalar dependencias
```bash
pnpm install --prefer-offline
```

### 2) Configurar entorno
```bash
cp .env.example .env
```

Variables minimas:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_GATEWAY_URL`

### 3) Desarrollo
```bash
pnpm dev
```

### 4) Build
```bash
pnpm build
```

### 5) Tests frontend
```bash
pnpm test:components
pnpm test:e2e:frontend
```

### 6) Lint
```bash
pnpm lint
```

## Scripts Disponibles
| Script | Uso |
|---|---|
| `pnpm dev` | Desarrollo con HMR |
| `pnpm build` | Build de produccion |
| `pnpm build:prod` | Build modo prod |
| `pnpm build:pages` | Build para Cloudflare Pages |
| `pnpm test:components` | Tests de componentes |
| `pnpm test:e2e:frontend` | E2E de frontend con Playwright |
| `pnpm lint` | Lint del frontend |

## Integraciones Relevantes
- Supabase Auth + DB (lecturas RLS)
- API Gateway `api-minimarket` para escrituras/control de negocio
- Edge Functions auxiliares para alertas/reportes

## Errores Comunes
| Error | Causa probable | Solucion |
|---|---|---|
| `VITE_*` no definido | `.env` faltante | copiar `.env.example` |
| Pantalla vacia en ruta protegida | sesion/rol invalido | re-login y validar permisos |
| Build falla por tipado | drift de tipos/imports | ejecutar lint y corregir errores |
| E2E inestable | entorno incompleto | usar config y prechecks correctos |

## Verificacion
```bash
pnpm lint
pnpm build
pnpm test:components
```

## Escalacion
1. Registrar ruta + error exacto.
2. Revisar `../docs/TROUBLESHOOTING.md`.
3. Escalar a soporte tecnico con evidencia (requestId/captura/comandos).
