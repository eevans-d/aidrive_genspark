---
name: TestMaster
description: Ejecucion, analisis y mantenimiento de tests. Centraliza la calidad del codigo.
role: EXECUTOR
impact: 0-1
chain: []
---

# TestMaster Skill

**ROL:** EXECUTOR (estado caliente). Ejecutar tests, analizar resultados, reportar.
**AUTO-INVOCADO POR:** CodeCraft, DeployOps, DebugHound, session-workflow.

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres).
2. NO usar comandos destructivos.

## Reglas de Automatizacion

1. Ejecutar suite de tests sin pedir confirmacion.
2. SI tests fallan -> analizar + reportar + NO esperar input.
3. SI falla >2 veces mismo test -> generar reporte y DETENERSE.
4. Guardar resultados en `test-reports/` automaticamente.
5. Verificar que directorio de logs exista antes de ejecutar.

## Activacion

**Activar cuando:**
- Codigo modificado.
- Antes de deploy (Pre-Flight).
- Debugging de errores reportados.
- Invocado automaticamente por otro skill.

**NO activar cuando:**
- Solo cambios de documentacion.
- Entorno caido (Docker no disponible para integration tests).

## Protocolo de Ejecucion

### FASE A: Environment Check

1. Asegurar directorios existen:
   ```bash
   mkdir -p logs test-reports
   ```
2. Si se necesitan integration tests, verificar Docker:
   ```bash
   docker ps 2>/dev/null || echo "Docker no disponible, solo unit tests"
   ```

### FASE B: Execution Selector

Seleccionar comando segun necesidad:

| Tipo | Comando |
|------|---------|
| Quality Gates (All) | `.agent/scripts/quality_gates.sh all` |
| Unit Quick | `npm run test:unit` |
| Integration | `npm run test:integration` |
| E2E | `npm run test:e2e` |
| Unit + Coverage | `npm run test:coverage` |
| Security | `npm run test:security` |
| Contracts | `npm run test:contracts` |
| Full Suite | `npm run test:all` |
| Single File | `npx vitest run tests/unit/<archivo>.test.ts` |
| Frontend Lint | `pnpm -C minimarket-system lint` |
| Frontend Build | `pnpm -C minimarket-system build` |
| Frontend Components | `pnpm -C minimarket-system test:components` |

### FASE C: Analysis

1. Leer output del test runner.
2. **Si Pass:** Registrar en EVIDENCE.md y continuar.
3. **Si Fail:** Analizar stack trace:
   - Es el codigo o el test lo que esta mal?
   - Es un test flaky (pasa intermitentemente)?
   - Es un error de entorno (conexion, Docker)?

## Quality Gates

- [ ] Exit code 0.
- [ ] 100% tests passed.
- [ ] Coverage >= 80% (codigo nuevo).
- [ ] Sin tests deshabilitados/skipped sin justificacion.

## Anti-Loop / Stop-Conditions

**SI falla por "Connection Refused":**
1. Verificar Docker: `docker ps`
2. Si Docker caido -> ejecutar solo unit tests.
3. Si falla despues de 2 intentos -> marcar sesion PARCIAL.

**SI test falla >2 veces el mismo:**
1. Generar reporte con stack trace.
2. Clasificar: codigo roto o test flaky?
3. Documentar hallazgo.
4. DETENERSE y cerrar como PARCIAL.

**SI coverage < 80%:**
1. Documentar archivos sin cobertura.
2. Continuar ejecucion (no bloquear).
3. Reportar como warning.

**NUNCA:** Quedarse esperando confirmacion manual.
