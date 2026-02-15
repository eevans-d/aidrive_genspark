# EVIDENCIA GATE 18 - Legacy CI Hardening

**Fecha:** 2026-02-12
**Estado:** PASS

## Descripcion

Endurecimiento del pipeline CI para que tests de seguridad sean un gate efectivo (no decorativo).
Separacion de security tests como job obligatorio vs legacy tests informativos.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `.github/workflows/ci.yml` | Nuevo job `security-tests` obligatorio + politica GO/NO-GO |

## Cambios realizados

### 1. Nuevo job `security-tests` (obligatorio, bloqueante)
- Corre en TODOS los push a main y PRs
- NO tiene `continue-on-error`
- Si falla, el CI pipeline falla (blocking gate)
- Ejecuta: `npx vitest run tests/security --config vitest.auxiliary.config.ts`

### 2. Job `legacy-tests` refinado (solo manual, informativo)
- Solo corre via `workflow_dispatch` con `run_legacy=true`
- Removido el step de Security Tests (ahora en su propio job)
- Mantiene Performance y API Contract tests con `continue-on-error: true`

### 3. Politica GO/NO-GO explicita
```yaml
# GO/NO-GO POLICY:
#   - Security tests MUST pass to merge. No exceptions.
#   - Performance/API-contract tests are informational; failures are logged
#     but do not block merges.
```

## Pipeline resultante

| Job | Obligatorio | Bloquea CI | Condicion |
|-----|-------------|------------|-----------|
| lint | Si | Si | Siempre |
| test (unit) | Si | Si | Siempre |
| build | Si | Si | Siempre |
| typecheck | Si | Si | Siempre |
| edge-functions-check | Si | Si | Siempre |
| **security-tests** | **Si** | **Si** | **Siempre (nuevo)** |
| e2e-frontend | No | No | workflow_dispatch o vars.RUN_E2E_FRONTEND |
| integration | No | No | workflow_dispatch o vars.RUN_INTEGRATION_TESTS |
| e2e | No | No | workflow_dispatch |
| legacy-tests | No | No | workflow_dispatch (performance, api-contracts) |

## Verificacion de security tests

```bash
$ npx vitest run tests/security --config vitest.auxiliary.config.ts --reporter=verbose

  ✓ SQL Injection Prevention - debe validar parámetros numéricos
  ✓ XSS Prevention - debe manejar payloads XSS
  ✓ CORS y headers seguros
  ✓ Authentication & Authorization - rechazar sin auth
  ✓ Authentication & Authorization - permitir con auth válida
  ✓ Rate Limiting
  ✓ Path Traversal Prevention
  ✓ SSRF Prevention
  ✓ Input Validation - JSON malformado
  ✓ Input Validation - tamaño de payload
  ✓ Input Validation - tipos de datos
  ✓ JWT Validation - expirado
  ✓ JWT Validation - firma inválida
  ↓ Real Security Tests (requires credentials) [skipped]

  Test Files  1 passed (1)
  Tests       14 passed | 1 skipped (15)
```

## Validacion YAML
```bash
$ python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); print('YAML VALID')"
YAML VALID
```
