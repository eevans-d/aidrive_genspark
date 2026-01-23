# 🛡️ Security Tests (Vitest, mocks)

> **Estado**: Migrado a Vitest con mocks locales. Pruebas reales requieren entorno controlado y credenciales.

## Descripción

Esta carpeta contiene tests de seguridad migrados a Vitest (mocks locales).  
Los archivos legacy fueron eliminados.

## Archivos

| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `security.vitest.test.ts` | Suite completa de seguridad (15 tests) | ✅ Activo |

## Ejecución (mock, sin red)

```bash
# Desde la raíz del repo
npx vitest run --config vitest.auxiliary.config.ts tests/security

# O con script npm
npm run test:auxiliary
```

## Habilitar pruebas reales (requiere credenciales, no ejecutar en CI)

```bash
RUN_REAL_TESTS=true SUPABASE_URL=... SUPABASE_ANON_KEY=... API_PROVEEDOR_SECRET=... \
  npx vitest run --config vitest.auxiliary.config.ts tests/security
```

## Cobertura de Tests (15 tests)

| Categoría | Tests | Descripción |
|-----------|-------|-------------|
| 💉 SQL Injection | 2 | Payloads SQL en queries y params numéricos |
| 🛡️ XSS Prevention | 1 | Payloads XSS en búsquedas |
| 🌐 CORS Headers | 1 | Validación de headers CORS |
| 🔐 Auth/AuthZ | 2 | Endpoints protegidos, tokens válidos |
| ⏱️ Rate Limiting | 1 | Límite de 60 req/min |
| 📁 Path Traversal | 1 | Payloads de traversal de directorios |
| 🔄 SSRF Prevention | 1 | URLs internas bloqueadas |
| 💾 Input Validation | 3 | JSON malformado, payload size, tipos |
| 🔑 JWT Validation | 2 | Token expirado, firma inválida |
| 🔗 Real Tests | 1 (skip) | Requiere credenciales reales |

## Fixtures de Payloads

Los payloads de ataque están definidos como constantes en el archivo de test:
- `SQL_INJECTION_PAYLOADS` - 7 payloads
- `XSS_PAYLOADS` - 6 payloads
- `NUMERIC_INJECTION_PAYLOADS` - 5 payloads
- `PATH_TRAVERSAL_PAYLOADS` - 6 payloads
- `SSRF_PAYLOADS` - 6 payloads

## Última actualización

- **Fecha:** 2026-01-23
- **Tests:** 14 passing + 1 skipped
- **Runner:** Vitest 4.0.16
3. Mantener `security-tests.test.js` como stub desactivado (sin ejecución).
3. Agregar suite de integración separada para seguridad real (fuera de CI) cuando haya credenciales.

## Alternativas Recomendadas

Para auditorías de seguridad reales:
- OWASP ZAP (scanning automatizado)
- Burp Suite (testing manual)
- `npm audit` / `pnpm audit` (dependencias)

---

*Última actualización: Enero 2026*
