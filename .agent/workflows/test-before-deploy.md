---
name: test-before-deploy
description: Suite completa de tests antes de deploy. Gate obligatorio.
version: 1.0.0
trigger:
  automatic:
    - antes de ejecutar DeployOps
    - cambio relevante en backend/frontend previo a release
  manual:
    - test before deploy
    - validar antes de deploy
  schedule: []
priority: 2
timeout: 45
auto_execution: true
skills: [TestMaster, DeployOps]
---

# Test Before Deploy Workflow

Garantiza que todos los tests pasen antes de cualquier operacion de deployment.
**100% automatico.** No pedir confirmacion.

## Pasos

### 1. Verificar repo limpio
```bash
git status --short
```
Si hay cambios sin commit -> documentar y continuar con warning.

### 2. Ejecutar tests unitarios
```bash
npx vitest run tests/unit/
```

### 3. Verificar coverage
```bash
npx vitest run --coverage
```
Minimo requerido: **80%**.

### 4. Ejecutar tests de integracion (si Docker disponible)
```bash
docker ps 2>/dev/null && bash scripts/run-integration-tests.sh || echo "Docker no disponible, skip integration"
```

### 5. Verificar build del frontend
```bash
cd minimarket-system && pnpm build
```

### 6. Resultado
- Si todos pasan -> proceder con DeployOps skill.
- Si alguno falla -> **STOP** y reportar errores.

## Condiciones de Fallo

- Cualquier test falla -> **STOP** y reportar.
- Coverage < 80% -> **WARNING** pero no bloquear.
- Build falla -> **STOP** y revisar errores TypeScript.

## Skills Relacionados

- **TestMaster**: Para debugging de tests fallidos
- **DeployOps**: Para ejecutar el deploy una vez aprobado
