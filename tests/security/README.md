# 🛡️ Security Tests (Vitest, mocks)

> **Estado**: Migrado a Vitest con mocks locales. Pruebas reales requieren entorno controlado y credenciales.

## Descripción

Esta carpeta contiene tests de seguridad migrados a Vitest (mocks locales).  
Los archivos legacy están desactivados y no se ejecutan en CI.

## Archivos

| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `security.vitest.test.ts` | Suite migrada a Vitest (mock, sin red) | Activo |
| `security-tests.legacy.js` | Tests OWASP básicos (legacy) | Legacy |
| `security-tests.test.js` | Stub desactivado (no-op) | Inactivo |

## Dependencias (tests/package.json)

El runner Jest fue retirado; se mantienen librerías auxiliares para mocks y benchmarks.

## Ejecución (mock, sin red)

```bash
# Desde la raíz del repo
npm run test:security            # Vitest + vitest.auxiliary.config.ts
# O toda la suite auxiliar
npm run test:auxiliary
```

## Habilitar pruebas reales (requiere credenciales, no ejecutar en CI)

```bash
RUN_REAL_TESTS=true SUPABASE_URL=... SUPABASE_ANON_KEY=... API_PROVEEDOR_SECRET=... npm run test:security
```

## Cobertura de Tests

Los tests verifican (con mocks):
- ✅ SQL Injection protection
- ✅ XSS prevention
- ✅ Authentication bypass
- ✅ Rate limiting behavior
- ✅ CORS configuration
- ✅ Input validation

## Plan de Migración

1. Vitest con mocks locales (completado en `security.vitest.test.ts`).
2. Mantener `security-tests.legacy.js` como referencia legacy.
3. Mantener `security-tests.test.js` como stub desactivado (sin ejecución).
3. Agregar suite de integración separada para seguridad real (fuera de CI) cuando haya credenciales.

## Alternativas Recomendadas

Para auditorías de seguridad reales:
- OWASP ZAP (scanning automatizado)
- Burp Suite (testing manual)
- `npm audit` / `pnpm audit` (dependencias)

---

*Última actualización: Enero 2026*
