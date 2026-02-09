---
description: Desarrollo de features completo - desde planificacion hasta documentacion. Usa CodeCraft + TestMaster + DocuGuard.
auto_execution: true
skills: [CodeCraft, TestMaster, DocuGuard]
---

# Feature Development Workflow

Workflow estandarizado para crear nuevas funcionalidades con enfoque test-first.
**100% automatico para impacto 0-1.** Sin pedir confirmacion.

## Inputs

- **Feature Name**: Nombre descriptivo (ej: `GestionProveedores`). Inferir del contexto del usuario.
- **Scope**: `frontend`, `backend`, o `fullstack`. Inferir del pedido.
- **Requirements**: Lista de requisitos funcionales. Extraer del mensaje del usuario.

## Pasos

### 1. Inicializacion

Leer la configuracion del proyecto:
```bash
cat .agent/skills/project_config.yaml
```

### 2. Planificacion (CODEX)

- Analizar el pedido del usuario.
- Identificar archivos existentes relevantes.
- Determinar si es backend, frontend o fullstack.
- SI hay nuevas tablas -> anotar para MigrationOps.

### 3. Preparar Tests (Test-First)

Si es backend:
```bash
touch tests/unit/<feature>.test.ts
```

Si es frontend:
```bash
ls minimarket-system/src/hooks/
```

### 4. Verificar estado inicial

```bash
npx vitest run tests/unit/
```
Confirmar que tests existentes pasan antes de empezar.

### 5. Implementar (CodeCraft)

Seguir protocolo de `.agent/skills/CodeCraft/SKILL.md`:
- Backend: handlers en `supabase/functions/api-minimarket/handlers/`
- Frontend: paginas en `minimarket-system/src/pages/`, hooks en `src/hooks/`
- Crear tests ANTES del codigo.

### 6. Verificar (TestMaster)

```bash
npx vitest run tests/unit/
cd minimarket-system && pnpm build
```

Si tests fallan -> arreglar automaticamente (max 2 intentos).

### 7. Documentar (DocuGuard)

- Actualizar `docs/ESTADO_ACTUAL.md` si aplica.
- Actualizar `docs/API_README.md` si hay nuevos endpoints.
- Registrar en `docs/DECISION_LOG.md` si hubo decision arquitectonica.

### 8. Migraciones (si aplica)

Si se crearon tablas nuevas -> seguir MigrationOps skill.

## Quality Gates

- [ ] Tests creados antes de codigo.
- [ ] Build pasa sin errores.
- [ ] Documentacion actualizada.
- [ ] Sin console.log en codigo nuevo.

## Skills Relacionados

- **CodeCraft**: Scaffold y patrones
- **TestMaster**: Ejecucion de tests
- **DocuGuard**: Sincronizacion de documentacion
- **MigrationOps**: Si hay tablas nuevas
