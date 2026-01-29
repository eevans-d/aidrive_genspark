---
description: Ejecutar suite completa de tests antes de deploy
---

# Test Before Deploy Workflow

Este workflow garantiza que todos los tests pasen antes de cualquier operación de deployment.

## Pasos

1. Verificar que el repositorio esté limpio:
```bash
git status --short
```

2. Ejecutar tests unitarios:
```bash
npm run test:unit
```

// turbo
3. Verificar coverage mínimo:
```bash
npm run test:coverage
```

4. Ejecutar tests de integración:
```bash
npm run test:integration
```

5. Verificar build del frontend:
```bash
cd minimarket-system && npm run build
```

6. Si todos los pasos pasan → Proceder con DeployOps skill.

## Condiciones de Fallo

- Si cualquier test falla → **STOP** y reportar errores
- Si coverage < 70% → **STOP** y notificar
- Si build falla → **STOP** y revisar errores de TypeScript

## Skills Relacionados

- **TestMaster**: Para debugging de tests fallidos
- **DeployOps**: Para ejecutar el deploy una vez aprobado
