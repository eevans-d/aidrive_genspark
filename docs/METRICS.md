# Métricas de Código (Fuente única)

**Generado:** 2026-02-18T06:49:32.633Z (UTC)
**Script:** `scripts/metrics.mjs`

## Definiciones

- **Edge Functions:** directorios en `supabase/functions/*` que contienen `index.ts` (excluye `_shared`).
- **Migraciones:** archivos `.sql` en `supabase/migrations`.
- **Shared modules:** archivos `.ts` en `supabase/functions/_shared`, excluye tests.
- **Endpoints:** rutas contadas en `supabase/functions/api-minimarket/index.ts` ("path === ... && method === ...") + lista `endpointList` en `supabase/functions/api-proveedor/schemas.ts`.
- **Hooks:** archivos `use*.ts/tsx` en `minimarket-system/src/hooks/queries`, excluye `index.ts` y tests.
- **Páginas:** archivos `.tsx` en `minimarket-system/src/pages`, excluye tests.
- **Tests:** archivos con sufijo `.test.*` o `.spec.*` en todo el repo, agrupados por carpeta.

## Resumen

| Métrica | Total | Detalle |
|---|---:|---|
| Edge Functions | 13 | `supabase/functions` |
| Migraciones SQL | 44 | `supabase/migrations` |
| Shared modules (_shared) | 8 | `supabase/functions/_shared` |
| Endpoints | 44 | api-minimarket: 35, api-proveedor: 9 |
| Hooks (React Query) | 9 | `minimarket-system/src/hooks/queries` |
| Páginas | 15 | `minimarket-system/src/pages` |
| Test files | 100 | total en repo |

## Test files por carpeta

| Carpeta | Cantidad |
|---|---:|
| minimarket-system/e2e | 4 |
| minimarket-system/src | 1 |
| minimarket-system/src/components | 3 |
| minimarket-system/src/hooks/queries | 9 |
| minimarket-system/src/lib | 2 |
| minimarket-system/src/pages | 15 |
| tests/api-contracts | 1 |
| tests/contract | 3 |
| tests/e2e | 1 |
| tests/performance | 1 |
| tests/security | 1 |
| tests/unit | 59 |
