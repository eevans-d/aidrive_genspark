# ⚠️ LEGACY - API Contract Tests (Jest)

> **Estado**: LEGACY - Pendiente migración a Vitest

## Descripción

Esta carpeta contiene tests de contratos OpenAPI usando Jest y swagger-parser.  
**No se ejecutan en CI** hasta completar la migración.

## Archivos

| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `openapi-compliance.test.js` | Validación de specs OpenAPI | Legacy |

## Dependencias (tests/package.json)

```json
{
  "jest": "^29.7.0",
  "@apidevtools/swagger-parser": "^10.1.0"
}
```

## Specs OpenAPI del Proyecto

- `docs/api-openapi-3.1.yaml` - API principal (api-minimarket)
- `docs/api-proveedor-openapi-3.1.yaml` - API proveedor

## Ejecución Local (NO recomendado)

```bash
cd tests
npm install
npm run test:api-contracts  # Jest - valida specs YAML
```

## Plan de Migración

1. Migrar a Vitest con `@apidevtools/swagger-parser`
2. Agregar validación de responses reales vs spec
3. **Timeline**: Ver `docs/ROADMAP.md`

## Alternativas Recomendadas

Para validación de OpenAPI:
```bash
# Validar spec directamente
npx @apidevtools/swagger-cli validate docs/api-openapi-3.1.yaml

# O usar Spectral para linting de OpenAPI
npx @stoplight/spectral-cli lint docs/api-openapi-3.1.yaml
```

---

*Última actualización: Enero 2025*
