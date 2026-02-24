# AUDIT_F3_TESTS_2026-02-24

## Objetivo
Verificar calidad ejecutable real (no declarativa): suites bloqueantes, skips y cobertura.

## Comandos ejecutados
```bash
npm run test:unit
pnpm -C minimarket-system test:components
npm run test:security
npm run test:auxiliary
npm run test:coverage
```

## Salida relevante

### Unit
- `Test Files 81 passed (81)`
- `Tests 1722 passed (1722)`
- `Duration 32.51s`

### Components
- `Test Files 46 passed (46)`
- `Tests 238 passed (238)`
- `Duration 30.75s`

### Security
- `Test Files 1 passed (1)`
- `Tests 11 passed | 3 skipped (14)`

### Auxiliary/perf/contracts
- `Test Files 3 passed (3)`
- `Tests 45 passed | 4 skipped (49)`

### Coverage (global)
- `Statements: 90.19%`
- `Branches: 82.63%`
- `Functions: 91.16%`
- `Lines: 91.29%`

## Auditoría de SKIP relevantes
- `tests/security/security.vitest.test.ts` (3 skips): smoke real opcional dependiente de credenciales/entorno productivo.
- `tests/api-contracts/openapi-compliance.vitest.test.ts` (1 skip): contrato real opcional con credenciales.
- `tests/performance/load-testing.vitest.test.ts` no presenta skip bloqueantes.
- Justificación: los skips son explícitamente opcionales y no bloquean gates de calidad local/CI declarados.

## Conclusión F3
Suites bloqueantes en verde. Cobertura global supera 80% en todas las métricas globales. No se detectan fallos bloqueantes en esta fase.

## Hallazgos F3
- Sin hallazgos nuevos `CRITICO/ALTO`.
