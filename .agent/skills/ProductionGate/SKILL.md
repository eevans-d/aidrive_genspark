---
name: ProductionGate
description: Checklist unificado pre-produccion. Ejecuta 18 gates en un solo pass
  y genera Production Readiness Score.
role: CODEX
version: 1.0.0
impact: CRITICAL
impact_legacy: 0
triggers:
  automatic:
  - orchestrator keyword match (ProductionGate)
  manual:
  - ProductionGate
  - production gate
  - go-live
  - pre-produccion
chain:
  receives_from: []
  sends_to:
  - DocuGuard
  required_before: []
priority: 9
---

# ProductionGate Skill

**ROL:** CODEX (estado frio). Evaluar, verificar, reportar. NO aplicar fixes directamente.
**PROTOCOLO:** "Go/No-Go con evidencia verificable."

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres).
2. NO usar comandos destructivos.
3. Este skill NO aplica fixes: solo reporta con score y evidencia.
4. Cada gate debe tener resultado PASS/FAIL/BLOCKED con evidencia.

## Reglas de Automatizacion

1. Ejecutar los 18 gates en secuencia sin pedir confirmacion.
2. Si un gate falla -> registrar FAIL y CONTINUAR (no bloquear otros gates).
3. Si un gate no se puede verificar (env/credenciales) -> marcar BLOCKED.
4. Generar reporte con score automaticamente al finalizar.
5. Si score < 60 -> NO-GO. Si score >= 80 -> GO. Entre 60-79 -> CONDITIONAL GO.

## Activacion

**Activar cuando:**
- Usuario pide "production gate", "go-live", "pre-produccion", "ready for prod".
- Antes de primer deploy a produccion.
- Despues de un ciclo completo de desarrollo.

**NO activar cuando:**
- En medio de implementacion (usar CodeCraft/DebugHound).
- Solo verificando un aspecto especifico (usar skill dedicado).

## Protocolo de Ejecucion

### Los 18 Gates

Ejecutar en orden. Para cada gate: PASS (peso completo) / FAIL (0) / BLOCKED (50% peso).

#### Gate 1: Tests Unitarios (Peso: 8)
```bash
npm run test:unit 2>&1 | tail -5
```
PASS si exit code 0 y 0 failures.

#### Gate 2: Tests Integracion (Peso: 5)
```bash
npm run test:integration 2>&1 | tail -5
```
PASS si exit code 0. BLOCKED si Docker no disponible.

#### Gate 3: Tests E2E (Peso: 5)
```bash
npm run test:e2e 2>&1 | tail -5
```
PASS si exit code 0.

#### Gate 4: Build Frontend (Peso: 8)
```bash
pnpm -C minimarket-system build 2>&1 | tail -5
```
PASS si exit code 0.

#### Gate 5: Lint (Peso: 4)
```bash
pnpm -C minimarket-system lint 2>&1 | tail -5
```
PASS si 0 errors.

#### Gate 6: Coverage >= Target (Peso: 5)
```bash
npm run test:coverage 2>&1 | grep "All files"
```
PASS si lines >= 80%. FAIL si < 80% (registrar valor actual).

#### Gate 7: Security — No Secrets Hardcoded (Peso: 8)
```bash
grep -rE "ey[A-Za-z0-9\-_=]{20,}" --include="*.ts" --include="*.tsx" -l 2>/dev/null | head -5
```
PASS si 0 resultados.

#### Gate 8: Security — RLS Habilitado (Peso: 5)
```bash
grep -r "CREATE TABLE" supabase/migrations/ --include="*.sql" | wc -l
grep -r "ENABLE ROW LEVEL SECURITY" supabase/migrations/ --include="*.sql" | wc -l
```
PASS si ambos counts coinciden razonablemente.

#### Gate 9: Deploy Script Seguro — HC-2 (Peso: 5)
```bash
grep -q "_shared" deploy.sh 2>/dev/null && echo "PASS: filtra _shared" || echo "FAIL: no filtra _shared"
grep -q "no-verify-jwt" deploy.sh 2>/dev/null && echo "PASS: usa --no-verify-jwt" || echo "FAIL: sin --no-verify-jwt"
```
PASS si ambos checks son OK.

#### Gate 10: Cron Jobs con Auth — HC-1 (Peso: 8)
```bash
grep -c "Authorization" supabase/cron_jobs/deploy_all_cron_jobs.sql 2>/dev/null
```
PASS si TODAS las invocaciones tienen Authorization header. FAIL si alguna no tiene.

#### Gate 11: Mutaciones con Feedback — HC-3 (Peso: 5)
```bash
grep -rn "console.error" minimarket-system/src/pages/ --include="*.tsx" | grep -v "toast\.\|ErrorMessage" | wc -l
```
PASS si resultado = 0.

#### Gate 12: CORS Configurado (Peso: 3)
```bash
grep -r "Access-Control-Allow-Origin" supabase/functions/_shared/ --include="*.ts" | head -3
```
PASS si hay configuracion CORS explicita (no wildcard en prod).

#### Gate 13: Rate Limit + Circuit Breaker (Peso: 3)
```bash
ls supabase/functions/_shared/rate-limit.ts supabase/functions/_shared/circuit-breaker.ts 2>/dev/null
```
PASS si ambos archivos existen.

#### Gate 14: Env Vars Documentadas (Peso: 3)
```bash
cat .env.example | wc -l
```
PASS si `.env.example` tiene >= 5 variables documentadas.

#### Gate 15: OpenAPI Spec Sincronizado (Peso: 3)
```bash
ls docs/api-openapi-3.1.yaml 2>/dev/null && echo "EXISTS" || echo "MISSING"
```
PASS si existe. Verificacion profunda requiere APISync.

#### Gate 16: ESTADO_ACTUAL.md Actualizado (Peso: 4)
```bash
head -5 docs/ESTADO_ACTUAL.md | grep -oP "\d{4}-\d{2}-\d{2}"
```
PASS si fecha tiene <= 7 dias de antiguedad.

#### Gate 17: Performance Baseline (Peso: 3)
```bash
ls docs/closure/PERF_BASELINE_*.md 2>/dev/null | tail -1
```
PASS si existe un baseline reciente.

#### Gate 18: Health Check Responde (Peso: 5)
```bash
curl -sS https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket/health 2>/dev/null | head -c 100
```
PASS si responde 200 con `success:true`. BLOCKED si no hay conectividad.

### Calculo de Score

```
Score = SUM(gate_weight * gate_result) / SUM(all_weights) * 100

gate_result: PASS=1.0, BLOCKED=0.5, FAIL=0.0
all_weights: 8+5+5+8+4+5+8+5+5+8+5+3+3+3+3+4+3+5 = 90
```

### Veredicto

| Score | Veredicto | Accion |
|-------|-----------|--------|
| >= 80 | **GO** | Listo para produccion |
| 60-79 | **CONDITIONAL GO** | Documentar riesgos aceptados, puede proceder con plan de mitigacion |
| < 60 | **NO-GO** | Bloquear. Listar gates FAIL como items prioritarios |

## Salida Requerida

Generar: `docs/PRODUCTION_GATE_REPORT.md`

```markdown
# Production Gate Report
**Fecha:** [Date] | **Score:** [X/100] | **Veredicto:** [GO/CONDITIONAL/NO-GO]

## Gates
| # | Gate | Peso | Resultado | Evidencia |
|---|------|------|-----------|-----------|
| 1 | Tests Unit | 8 | PASS | 812 passed, 0 failed |
...

## Items Bloqueantes (FAIL)
1. Gate N: [descripcion] -> [fix requerido]

## Riesgos Aceptados (BLOCKED)
1. Gate M: [descripcion] -> [mitigacion]
```

## Quality Gates

- [ ] Los 18 gates ejecutados.
- [ ] Score calculado correctamente.
- [ ] Reporte generado con evidencia por gate.
- [ ] Veredicto emitido.

## Anti-Loop / Stop-Conditions

**SI no hay entorno de ejecucion (npm/pnpm no disponible):**
1. Ejecutar gates estaticos (7-16) solamente.
2. Marcar gates de ejecucion (1-6, 17-18) como BLOCKED.
3. Calcular score parcial.

**SI >10 gates FAIL:**
1. Generar reporte inmediatamente.
2. Recomendar empezar por gates de mayor peso.

**NUNCA:** Dar GO si hay gates CRITICAL (7, 8, 10) en FAIL.
