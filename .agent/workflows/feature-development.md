---
description: Nueva feature con enfoque test-first usando CodeCraft
---

# Feature Development Workflow

Workflow estandarizado para crear nuevas funcionalidades siguiendo el patrón test-first.

## Inputs Requeridos

- **Feature Name**: Nombre descriptivo (ej: `GestionProveedores`)
- **Scope**: `frontend`, `backend`, o `fullstack`
- **Requirements**: Lista de requisitos funcionales

## Pasos

// turbo-all

1. Leer skill CodeCraft:
```bash
cat .agent/skills/CodeCraft/SKILL.md
```

2. Si es backend - crear archivo de test vacío:
```bash
touch tests/unit/<feature>.test.ts
```

3. Si es frontend - verificar estructura de hooks:
```bash
ls minimarket-system/src/hooks/queries/
```

4. Ejecutar TestMaster para verificar estado inicial:
```bash
npm run test:unit -- --passWithNoTests
```

5. Implementar la feature siguiendo CodeCraft skill.

6. Verificar que los tests pasen:
```bash
npm run test:unit
```

7. Ejecutar DocuGuard para actualizar documentación:
   - Revisar ESTADO_ACTUAL.md si aplica
   - Actualizar API_README.md si hay nuevos endpoints

8. Ejecutar RealityCheck para validar UX:
   - Verificar flujo de usuario
   - Validar estados de carga y error

## Quality Gates

- [ ] Tests creados antes de código
- [ ] Build pasa sin errores
- [ ] Documentación actualizada
- [ ] UX validado con RealityCheck

## Skills Relacionados

- **CodeCraft**: Scaffold y patrones
- **TestMaster**: Ejecución de tests
- **DocuGuard**: Sincronización de documentación
- **RealityCheck**: Validación UX
