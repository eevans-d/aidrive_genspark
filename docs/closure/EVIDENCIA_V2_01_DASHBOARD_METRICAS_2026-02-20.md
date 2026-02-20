# Evidencia V2-01 — Integridad de metricas dashboard

- Fecha: 2026-02-20
- Bloque: B
- Estado: COMPLETADO

## Problema

Las metricas del dashboard se calculaban sobre datos truncados:
- `useDashboardStats.ts:30`: `.limit(5)` en tareas — solo 5 tareas fetched
- `useDashboardStats.ts:36`: `.limit(100)` en stock — truncaba si habia >100 items
- `tareasUrgentes` se contaba filtrando las 5 tareas fetched, no el total real
- `tareasPendientes.length` se usaba como total => siempre <= 5

## Solucion

### useDashboardStats.ts
- Agregadas 2 count queries dedicadas via `{ count: 'exact', head: true }`:
  - Total tareas pendientes (real, sin limit)
  - Total tareas urgentes (real, con filtro `prioridad = 'urgente'`)
- Removido `.limit(100)` en stock_deposito — ahora fetcha todas las filas (solo 2 columnas: cantidad_actual, stock_minimo) para conteo preciso
- Agregado `totalTareasPendientes: number` al interface `DashboardStats`

### Dashboard.tsx
- Tarjeta "Tareas Pendientes" ahora muestra `totalTareasPendientes` (count real) en vez de `tareasPendientes.length` (max 5)
- Seccion de lista de tareas muestra "Top N Tareas Pendientes (X total)" cuando hay mas tareas que las mostradas

### Tests actualizados
- `Dashboard.test.tsx`: Agregado `totalTareasPendientes` a mock data
- `tests/unit/frontend-hooks.test.ts`: Actualizado mock para 5 queries paralelas (3 a tareas_pendientes con resultados diferenciados por call index)

## Verificacion

```bash
pnpm -C minimarket-system lint     # PASS
pnpm -C minimarket-system build    # PASS
npx vitest run                     # 1561/1561 PASS
```

## Archivos modificados

- `minimarket-system/src/hooks/queries/useDashboardStats.ts`
- `minimarket-system/src/pages/Dashboard.tsx`
- `minimarket-system/src/pages/Dashboard.test.tsx`
- `tests/unit/frontend-hooks.test.ts`
