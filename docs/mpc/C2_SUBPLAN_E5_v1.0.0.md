# C2 — Subplan E5 Frontend Calidad (MPC v2.0)

**Etapa:** E5
**Fecha:** 2026-01-22
**Versión:** 1.0.0

---

## 1) Alcance

- **WS5.2** Error boundaries y fallback UI.
- **WS5.5** Paginación + columnas mínimas.
- **WS5.6** Capa de datos con caching.

---

## 2) Referencias exactas (archivo:líneas)

- Hooks de datos:
  - `minimarket-system/src/hooks/queries/*`
- Páginas críticas:
  - `minimarket-system/src/pages/*`
- Error UI:
  - `minimarket-system/src/components/ErrorMessage.tsx`

---

## 3) Subtareas (estimación en horas)

| ID | Tarea | Estimación | Entregable |
|---|---|---:|---|
| E5-T1 | Verificar error boundaries y fallback | 1h | Evidencia UI |
| E5-T2 | Confirmar paginación y select mínimo | 2h | Query optimizadas |
| E5-T3 | Validar caching React Query | 1h | Hooks consistentes |

---

## 4) Variables de entorno críticas

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 5) Plan de testing

- Unitarios de hooks y UI.
- Verificación visual de estados loading/error.

---

## 6) Plan de rollback

1. Revertir cambios de hooks a versión estable.
2. Re-ejecutar unitarios de frontend.

---

## 7) Checklist pre-implementación

- [ ] Hooks React Query disponibles.
- [ ] Páginas críticas revisadas.

## 8) Checklist post-implementación

- [ ] Error boundaries activos.
- [ ] Paginación confirmada en listados.
- [ ] Caching consistente en hooks.
