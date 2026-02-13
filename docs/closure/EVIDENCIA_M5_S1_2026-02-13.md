# EVIDENCIA M5.S1 - Security tests reales (T02)

**Fecha:** 2026-02-13  
**Estado:** PASS

## Implementación

- La suite `tests/security/security.vitest.test.ts` fue reemplazada por contratos reales sobre helpers productivos (`internal-auth`, `cors`, `validators`).
- Se dejó smoke real opcional controlado por `RUN_REAL_TESTS=true`.

## Archivos tocados

- `tests/security/security.vitest.test.ts`

## Verificación

```bash
npm run test:security
```

Resultado:

- `Test Files 1 passed (1)`
- `Tests 6 passed | 1 skipped (7)`
- JUnit actualizado en `test-reports/junit.auxiliary.xml`.

## Riesgo residual

- El smoke real depende de credenciales (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) y se mantiene como ejecución explícita.

## Siguiente paso

- T03: enforcement de coverage alineado con CI.
