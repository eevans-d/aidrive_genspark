# ⚙️ Performance Tests (Vitest, mocks)

> **Estado**: Migrado a Vitest con mocks locales. Las pruebas de carga reales siguen pendientes (k6/Artillery) y requieren credenciales.

## Descripción

Esta carpeta contiene tests de performance usando Jest y Artillery.  
**No se ejecutan en CI** hasta completar la migración.

## Archivos

| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `load-testing.vitest.test.ts` | Suite migrada a Vitest (mock, sin red) | Activo |
| `load-testing.test.js` | Legacy Jest (no se ejecuta) | Legacy |

## Dependencias (tests/package.json)

```json
{
  "jest": "^29.7.0",
  "artillery": "^2.0.0",
  "artillery-plugin-expect": "^2.2.0"
}
```

## Ejecución (mock, sin red)

```bash
# Desde la raíz del repo
npm run test:performance           # Vitest + vitest.auxiliary.config.ts
# O toda la suite auxiliar
npm run test:auxiliary
```

## Habilitar pruebas reales (requiere credenciales, no ejecutar en CI)

```bash
RUN_REAL_TESTS=true SUPABASE_URL=... SUPABASE_ANON_KEY=... npm run test:performance
```

## Plan de Migración

1. Vitest con mocks locales (completado en `load-testing.vitest.test.ts`).
2. Mantener `load-testing.test.js` como referencia legacy (no se ejecuta por config).
3. Para carga real: mover a k6/Artillery con entorno controlado y credenciales.

## Notas

- Los tests activos usan mocks, sin red ni credenciales.
- Para carga real, usar Artillery/k6 fuera de CI.
- El CI ejecuta solo `tests/unit/` y suites auxiliares si se habilitan manualmente.

---

*Última actualización: Enero 2026*
