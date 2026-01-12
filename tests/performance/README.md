# ⚠️ LEGACY - Performance Tests (Jest)

> **Estado**: LEGACY - Pendiente migración a Vitest/k6

## Descripción

Esta carpeta contiene tests de performance usando Jest y Artillery.  
**No se ejecutan en CI** hasta completar la migración.

## Archivos

| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `load-testing.test.js` | Tests de carga con mocks | Legacy |

## Dependencias (tests/package.json)

```json
{
  "jest": "^29.7.0",
  "artillery": "^2.0.0",
  "artillery-plugin-expect": "^2.2.0"
}
```

## Ejecución Local (NO recomendado)

```bash
cd tests
npm install
npm run test:performance  # Jest - requiere .env con credenciales
```

## Plan de Migración

1. **Opción A**: Migrar a Vitest + benchmark utilities
2. **Opción B**: Migrar a k6 para tests de carga reales
3. **Timeline**: Ver `docs/ROADMAP.md`

## Notas

- Los tests actuales usan mocks, no servicios reales
- Para tests de carga reales, usar Artillery CLI o k6 directamente
- El CI ejecuta solo `tests/unit/` (Vitest) como suite obligatoria

---

*Última actualización: Enero 2025*
