# EVIDENCIA M2.S1 - Ruta catch-all 404 (T06)

**Fecha:** 2026-02-13  
**Estado:** PASS

## Implementación

- Se agregó página `NotFound` y ruta `path="*"` dentro del layout protegido.
- Se exportó `AppRoutes` para testeo directo.

## Archivos tocados

- `minimarket-system/src/App.tsx`
- `minimarket-system/src/pages/NotFound.tsx`
- `minimarket-system/src/App.test.tsx`

## Verificación

```bash
pnpm -C minimarket-system test:components
```

Resultado:

- `Test Files 27 passed (27)`
- `Tests 150 passed (150)`
- Incluye test `App routing` para ruta inválida.

## Riesgo residual

- Sin riesgo crítico; advertencias de future flags de React Router no bloquean.

## Siguiente paso

- T07: completar smoke tests faltantes en páginas.
