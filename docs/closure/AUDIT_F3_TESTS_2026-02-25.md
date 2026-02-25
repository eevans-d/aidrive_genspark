# AUDIT_F3_TESTS_2026-02-25

## Objetivo
Verificar calidad ejecutable real: suites bloqueantes, skips, cobertura global y cobertura en módulos críticos.

## Comandos ejecutados
```bash
npm run -s test:unit
pnpm -C minimarket-system test:components
npm run -s test:security
npm run -s test:auxiliary
npm run -s test:integration
npm run -s test:e2e
npm run -s test:coverage
```

## Salida relevante

### Unit
- `Test Files 81 passed (81)`
- `Tests 1722 passed (1722)`

### Components
- `Test Files 46 passed (46)`
- `Tests 238 passed (238)`

### Security
- `Test Files 1 passed (1)`
- `Tests 11 passed | 3 skipped (14)`

### Auxiliary / perf / contracts
- `Test Files 3 passed (3)`
- `Tests 45 passed | 4 skipped (49)`

### Integration
- `Test Files 3 passed (3)`
- `Tests 68 passed (68)`

### E2E smoke
- `Test Files 1 passed (1)`
- `Tests 4 passed (4)`

### Coverage global
- `Statements: 90.19%`
- `Branches: 82.63%`
- `Functions: 91.16%`
- `Lines: 91.29%`

## Auditoría de SKIP relevantes
- Security (`3 SKIP`): smoke real opcional dependiente de credenciales/modo real.
- Auxiliary/contracts (`1 SKIP` contractual real): depende de credenciales reales.
- Clasificación: `SKIP JUSTIFICADO` (no bloqueante según estrategia de suite vigente).

## Conclusión F3
Suites bloqueantes en verde, cobertura global >80% en todas las dimensiones. No hay fallos de test que bloqueen cierre técnico de esta fase.

## Hallazgos F3
- Sin hallazgos nuevos `CRITICO/ALTO` en tests/cobertura.
