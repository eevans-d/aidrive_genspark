# Testing Guide

Estado: Activo
Audiencia: Tecnico interno
Ultima actualizacion: 2026-03-11
Fuente de verdad: docs/ESTADO_ACTUAL.md
Owner documental: QA + Desarrollo

> Referencias: corrida verificada 2026-03-11 (`unit_files=88`, `unit_tests=1959`, `integration=68 PASS`, `components=257 PASS`, `e2e=4 PASS`) y auditoria consolidada en `docs/audit/FULL_AUDIT_REPORT_2026-03-11.md`.

## Estado Verificado 2026-03-11
- Unit (root): `88/88` files, `1959/1959` tests PASS.
- Integracion: `68/68` PASS.
- Componentes frontend: `257/257` PASS.
- Lint frontend: `0 errores`, `72 warnings` (tests/mocks).
- Build frontend: PASS (`vite build` + PWA assets generados) con warnings conocidos de chunking/PWA.
- E2E smoke local de Edge Functions: PASS (`4/4`) con JWT HS256 de test + secret inyectado al runtime local.

## Objetivo
Estandarizar como ejecutar, interpretar y mantener tests del proyecto sin ambiguedad.

## Stack De Testing
- Vitest (raiz): unit, integration, e2e-smoke, auxiliary
- Vitest (frontend): component tests
- Playwright: e2e frontend (`minimarket-system`)
- MSW: mocks de red para escenarios controlados

## Procedimiento Paso A Paso
### 1) Tests rapidos (base)
```bash
npm run test:unit
pnpm -C minimarket-system test:components
```

### 2) Integracion y E2E con prereq check
```bash
bash scripts/run-integration-tests.sh --dry-run
bash scripts/run-e2e-tests.sh --dry-run
```

### 3) Integracion real
```bash
npm run test:integration
```

### 4) E2E smoke real
```bash
npm run test:e2e
```

### 5) Suites auxiliares
```bash
npm run test:auxiliary
npm run test:contracts
npm run test:security
npm run test:performance
```

### 6) Cobertura
```bash
npm run test:coverage
```

## Configuraciones Relevantes
- `vitest.config.ts`
- `vitest.integration.config.ts`
- `vitest.e2e.config.ts`
- `vitest.auxiliary.config.ts`

## Matriz De Suites
| Suite | Comando | Requiere `.env.test` |
|---|---|---|
| Unit | `npm run test:unit` | No |
| Components frontend | `pnpm -C minimarket-system test:components` | No |
| Integration | `npm run test:integration` | Si |
| E2E smoke | `npm run test:e2e` | Si |
| Contracts | `npm run test:contracts` | No/Parcial |
| Security | `npm run test:security` | No/Parcial |
| Performance | `npm run test:performance` | No/Parcial |

## Criterio De Lectura De Resultados
1. Falla aislada en unit:
   - corregir modulo especifico
   - no continuar a despliegue
2. Falla de integration/e2e por entorno:
   - validar `.env.test`
   - ejecutar dry-run para confirmar prerequisitos
3. Falla sistemica:
   - bloquear merge/release
   - abrir incidente interno

## Errores Comunes
| Error | Causa | Solucion |
|---|---|---|
| `Archivo .env.test no encontrado` | No existe archivo | `cp .env.test.example .env.test` |
| Variables SUPABASE faltantes | `.env.test` incompleto | Completar segun `supabase status` |
| `Supabase CLI no encontrado` | dependencia local faltante | Instalar Supabase CLI |
| Tests flaky por contexto | mezcla mock/real sin control | usar modo definido por suite |

## Verificacion
Checklist de calidad de prueba:
- [ ] Unit PASS
- [ ] Components PASS
- [ ] Integration PASS o bloqueado por entorno documentado
- [ ] E2E PASS o bloqueado por entorno documentado
- [ ] Cobertura dentro de objetivo minimo

Comando documental final:
```bash
node scripts/validate-doc-links.mjs
```

## Escalacion
Nivel 1:
- Dev corrige test roto y vuelve a correr suite puntual.

Nivel 2:
- QA revisa patron de fallas y decide bloqueo de release.

Nivel 3:
- Soporte tecnico/arquitectura interviene si hay regresion sistémica.
