# 📋 API Contract Tests (Vitest, mocks)

> **Estado**: Migrado a Vitest con mocks locales. Validación real contra endpoints requiere credenciales.

## Descripción

Esta carpeta contiene tests de contratos OpenAPI migrados a Vitest (mocks locales).  
Los archivos legacy fueron eliminados para evitar confusión.

## Archivos

| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `openapi-compliance.vitest.test.ts` | Validación de contratos (mock, sin red) | Activo |

## Dependencias (tests/package.json)

El runner Jest fue retirado; se mantienen librerías auxiliares para validación local.

## Specs OpenAPI del Proyecto

- `docs/api-openapi-3.1.yaml` - API principal (api-minimarket)
- `docs/api-proveedor-openapi-3.1.yaml` - API proveedor

## Ejecución (mock, sin red)

```bash
# Desde la raíz del repo
npm run test:contracts           # Vitest + vitest.auxiliary.config.ts
# O toda la suite auxiliar
npm run test:auxiliary
```

## Habilitar pruebas reales (requiere credenciales, no ejecutar en CI)

```bash
RUN_REAL_TESTS=true SUPABASE_URL=... SUPABASE_ANON_KEY=... API_PROVEEDOR_SECRET=... npm run test:contracts
```

## Plan de Migración

1. Vitest con mocks locales (completado en `openapi-compliance.vitest.test.ts`).
2. Agregar validación real vs endpoints cuando haya credenciales.

## Alternativas Recomendadas

Para validación de OpenAPI:
```bash
# Validar spec directamente
npx @apidevtools/swagger-cli validate docs/api-openapi-3.1.yaml

# O usar Spectral para linting de OpenAPI
npx @stoplight/spectral-cli lint docs/api-openapi-3.1.yaml
```

---

*Última actualización: Enero 2026*
