# Evidencia V2-05 — Skeleton fase 2

- Fecha: 2026-02-20
- Bloque: B
- Estado: COMPLETADO

## Problema

Paginas funcionales mostraban estados de carga inconsistentes:
- Rentabilidad.tsx:102: `<div className="text-center py-8">Cargando...</div>` (texto plano)
- Pocket.tsx:141-146: `Loader2` spinner en PriceCheck
- Deposito.tsx: Sin indicador de carga inicial (la pagina aparecia con dropdowns vacios)
- Login.tsx: No tiene fase de carga de datos (formulario estatico con feedback en boton submit)

## Solucion

### Rentabilidad.tsx
- Import: `import { SkeletonCard, SkeletonText, SkeletonTable } from '../components/Skeleton'`
- Reemplazado `"Cargando..."` por composicion skeleton: titulo + 4 cards metricas + tabla

### Pocket.tsx (PriceCheck component)
- Import: `import { SkeletonCard, SkeletonText } from '../components/Skeleton'`
- Reemplazado `Loader2` spinner por skeleton: texto + card
- Nota: el spinner de `isResolving` (buscando producto) se mantiene como spinner contextual, no skeleton

### Deposito.tsx
- Import: `import { SkeletonCard, SkeletonText, SkeletonList } from '../components/Skeleton'`
- Agregado `isLoading` a queries de productos y proveedores
- Agregado gate de loading: cuando ambas queries estan cargando, muestra skeleton (titulo + card + list)

### Login.tsx
- No requiere skeleton: es formulario estatico sin fase de data-fetching
- El feedback de carga ya existe: boton muestra "Iniciando sesion..." durante submit
- El fallback Suspense en App.tsx es P2/backlog per plan

## Verificacion

```bash
pnpm -C minimarket-system lint     # PASS
pnpm -C minimarket-system build    # PASS
npx vitest run                     # 1561/1561 PASS
```

## Cobertura skeleton post-V2-05

Cobertura confirmada en esta fase:
- Dashboard, Ventas, Proveedores, Kardex (fase 1)
- Rentabilidad, Deposito, Pocket/PriceCheck (fase 2)
- POS (ya tenia `SkeletonTable`)
- Login (N/A — formulario estatico)

Desviacion detectada respecto al plan canónico:
- `Clientes.tsx` no usa `Skeleton.tsx` en carga inicial; mantiene loader textual/spinner (`minimarket-system/src/pages/Clientes.tsx`:150-153). Queda pendiente para cierre estricto de V2-04.

## Archivos modificados

- `minimarket-system/src/pages/Rentabilidad.tsx`
- `minimarket-system/src/pages/Pocket.tsx`
- `minimarket-system/src/pages/Deposito.tsx`
