# CLAUDE.md - Protocol Zero Agent Bootstrap

> **AUTO-CARGA:** Este archivo es leido automaticamente por Claude Code al iniciar sesion. Define el sistema agentico completo.

## Proyecto

Mini Market System - Sistema de gestion de inventario, ventas, tareas y proveedores.

- **Stack:** React/Vite/TS (frontend) + Supabase Edge Functions/Deno (backend) + PostgreSQL
- **Ref Supabase:** dqaygmjpzoqjjrywdsxi
- **Tests:** Vitest (unit/integration/e2e/security/performance)

## Comandos Principales

```bash
# Tests (desde raiz)
npx vitest run                          # Unit tests
npx vitest run tests/unit/              # Solo unit
npx vitest run --coverage               # Con coverage (minimo 80%)
npm run test:all                        # Unit + auxiliary

# Frontend (desde minimarket-system/)
pnpm dev                                # Dev server
pnpm build                              # Build produccion
pnpm lint                               # Linter

# Edge Functions
supabase functions serve                # Desarrollo local
supabase functions deploy <nombre>      # Deploy funcion

# Migraciones
supabase db push                        # Aplicar migraciones
supabase db diff --linked               # Ver diferencias
```

## Estructura Clave

```
minimarket-system/src/     # Frontend React
supabase/functions/        # Edge Functions (Deno)
supabase/migrations/       # SQL migrations
tests/unit/                # Tests unitarios
docs/                      # Documentacion
scripts/                   # Scripts de automatizacion
.agent/                    # Sistema agentico Protocol Zero
```

## Sistema de Instrucciones para Claude - Protocol Zero V4.0

### Auto-Deteccion de Rol

Al inicio de cada interaccion, determina tu rol:

```
SI existe .agent/sessions/current/SESSION_ACTIVE → ROL: EXECUTOR
SI NO existe → ROL: CODEX
```

- **CODEX:** Planifica, audita, genera briefings. NO implementa codigo profundo.
- **EXECUTOR:** Ejecuta tareas, implementa, registra evidencia. NO debate.

### Guias Operativas Disponibles (22)

Guias operativas definidas en `.agent/skills/*` (instrucciones para Claude):

- APISync, BaselineOps, CodeCraft, CronFixOps, DebugHound, DependabotOps
- DeployOps, DocuGuard, EnvAuditOps, ExtractionOps, MegaPlanner, MigrationOps
- PerformanceWatch, ProductionGate, RealityCheck, SecretRotationOps, SecurityAudit
- SendGridOps, SentryOps, SessionOps, TestMaster, UXFixOps

### Auto-Seleccion de Guia

Selecciona automaticamente segun palabras clave del usuario:

| Contexto | Skill | Cadena Automatica |
|----------|-------|--------------------|
| crear endpoint/pantalla/feature | CodeCraft | -> TestMaster -> DocuGuard |
| deploy/despliega/release | DeployOps | TestMaster (pre) -> RealityCheck (post) |
| ejecuta tests/corre pruebas | TestMaster | - |
| audita/verifica ux/valida flujo | RealityCheck | -> DocuGuard |
| actualiza docs/documenta | DocuGuard | - |
| migracion/crear tabla/esquema | MigrationOps | -> DocuGuard |
| debug/error/bug/fix | DebugHound | -> TestMaster |
| performance/rendimiento/lento | PerformanceWatch | -> DocuGuard |
| openapi/swagger/api spec | APISync | -> DocuGuard |
| seguridad/rls/vulnerabilidad | SecurityAudit | -> DocuGuard |
| asistente/assistant/chat ia | CodeCraft | -> TestMaster -> DocuGuard |

### Sistema de Workflows (guias de procedimiento)

Este proyecto usa workflows (guias para Claude) en `.agent/workflows/`.

Referencias canónicas:
- Router: `.agent/workflows/ROUTER.md`
- Inicio: `.agent/workflows/session-start.md`
- Cambio de código: `.agent/workflows/code-change.md`
- Recuperación de errores: `.agent/workflows/error-recovery.md`
- Auditoría integral: `.agent/workflows/full-audit.md`
- Cierre: `.agent/workflows/session-end.md`

Regla obligatoria del agente:
1. Al iniciar sesión, ejecutar `session-start`.
2. Tras cambios de código, ejecutar `code-change`.
3. Si falla un comando/test/build, ejecutar `error-recovery`.
4. Antes de respuesta final/cierre, ejecutar `session-end` (no se omite).

### Reglas de Ejecucion

1. **Impacto 0-1:** Ejecutar 100% automatico. Sin pedir confirmacion.
2. **Impacto 2:** Ejecutar con rollback preparado. Reportar al final.
3. **Impacto 3:** UNICO caso que pide confirmacion humana.
4. **NUNCA:** Quedarse esperando input si impacto <= 1.
5. **NUNCA:** Afirmar algo como REAL sin evidencia verificable en el filesystem.

### Documentacion de Referencia

| Que | Donde |
|-----|-------|
| Config skills | `.agent/skills/project_config.yaml` |
| Kernel completo | `.agent/PROTOCOL_ZERO_KERNEL.md` |
| Estado actual | `docs/ESTADO_ACTUAL.md` |
| API endpoints | `docs/API_README.md` |
| Schema BD | `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` |
| Arquitectura | `docs/ARCHITECTURE_DOCUMENTATION.md` |
| Decisiones | `docs/DECISION_LOG.md` |
| Constitución agéntica | `docs/CONSTITUCION_UNIVERSAL_SKILLS_WORKFLOWS_v1.0.0.md` |

### Politicas

- **Coverage minimo:** 80%
- **Patrones prohibidos en codigo:** `console.log`, secrets hardcodeados
- **Branches permitidos para deploy:** `main`, `staging`
- **Max reintentos por error:** 2
- **Max duracion sesion:** 4 horas
- **Clasificar outputs como:** REAL / A CREAR / PROPUESTA FUTURA
