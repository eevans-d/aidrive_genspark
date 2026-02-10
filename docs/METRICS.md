# Métricas de Código (Fuente única)

**Generado:** 2026-02-09T23:22:14.901Z (UTC)
**Script:** `scripts/metrics.mjs`

## Definiciones

- **Endpoints:** rutas contadas en `supabase/functions/api-minimarket/index.ts` ("path === ... && method === ...") + lista `endpointList` en `supabase/functions/api-proveedor/schemas.ts`.
- **Hooks:** archivos `use*.ts/tsx` en `minimarket-system/src/hooks/queries`, excluye `index.ts` y tests.
- **Páginas:** archivos `.tsx` en `minimarket-system/src/pages`, excluye tests.
- **Tests:** archivos con sufijo `.test.*` o `.spec.*` en todo el repo, agrupados por carpeta.

## Resumen

| Métrica | Total | Detalle |
|---|---:|---|
| Endpoints | 43 | api-minimarket: 34, api-proveedor: 9 |
| Hooks (React Query) | 9 | `minimarket-system/src/hooks/queries` |
| Páginas | 13 | `minimarket-system/src/pages` |
| Test files | 72 | total en repo |

## Test files por carpeta

| Carpeta | Cantidad |
|---|---:|
| minimarket-system/e2e | 3 |
| minimarket-system/src/components | 3 |
| minimarket-system/src/hooks/queries | 8 |
| minimarket-system/src/lib | 2 |
| minimarket-system/src/pages | 3 |
| tests/api-contracts | 1 |
| tests/e2e | 1 |
| tests/integration | 3 |
| tests/performance | 1 |
| tests/security | 1 |
| tests/unit | 46 |
