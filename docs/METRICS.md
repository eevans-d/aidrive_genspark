# Métricas de Código (Fuente única)

**Generado:** 2026-03-11T13:00:15.580Z (UTC)
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
| Edge Functions | 16 | `supabase/functions` |
| Migraciones SQL | 57 | `supabase/migrations` |
| Shared modules (_shared) | 9 | `supabase/functions/_shared` |
| Endpoints | 44 | api-minimarket: 35, api-proveedor: 9 |
| Hooks (React Query) | 11 | `minimarket-system/src/hooks/queries` |
| Páginas | 18 | `minimarket-system/src/pages` |
| Test files | 149 | total en repo |

## Test files por carpeta

| Carpeta | Cantidad |
|---|---:|
| minimarket-system/e2e | 4 |
| minimarket-system/src | 1 |
| minimarket-system/src/components | 4 |
| minimarket-system/src/components/__tests__ | 4 |
| minimarket-system/src/contexts | 1 |
| minimarket-system/src/hooks/__tests__ | 6 |
| minimarket-system/src/hooks/queries | 9 |
| minimarket-system/src/lib | 2 |
| minimarket-system/src/lib/__tests__ | 3 |
| minimarket-system/src/pages | 20 |
| tests/api-contracts | 1 |
| tests/contract | 3 |
| tests/e2e | 1 |
| tests/performance | 1 |
| tests/security | 1 |
| tests/unit | 88 |
