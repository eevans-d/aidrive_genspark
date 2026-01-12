# ⚠️ LEGACY - Security Tests (Jest)

> **Estado**: LEGACY - Pendiente migración a Vitest

## Descripción

Esta carpeta contiene tests de seguridad usando Jest.  
**No se ejecutan en CI** hasta completar la migración.

## Archivos

| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `security-tests.test.js` | Tests OWASP básicos con mocks | Legacy |

## Dependencias (tests/package.json)

```json
{
  "jest": "^29.7.0",
  "supertest": "^6.3.3"
}
```

## Ejecución Local (NO recomendado)

```bash
cd tests
npm install
npm run test:security  # Jest - usa mocks, no servicios reales
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

1. Migrar assertions a Vitest
2. Mantener mocks para tests unitarios
3. Agregar tests de integración separados para seguridad real
4. **Timeline**: Ver `docs/ROADMAP.md`

## Alternativas Recomendadas

Para auditorías de seguridad reales:
- OWASP ZAP (scanning automatizado)
- Burp Suite (testing manual)
- `npm audit` / `pnpm audit` (dependencias)

---

*Última actualización: Enero 2025*
