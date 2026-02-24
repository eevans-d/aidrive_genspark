---
name: closure-audit
description: >
  Auditoria integral de cierre — 9 fases (0-8) usando el skill QualityGate.
  Detecta anomalias silenciosas de IA y genera veredicto binario en .audit/FINAL_REPORT.md.
version: 2.0.0
trigger:
  automatic:
    - antes de release final a produccion
    - cierre de proyecto completo
    - primera sesion tras periodo largo sin auditoria
  manual:
    - cierre de proyecto
    - closure audit
    - auditoria de cierre
    - quality gate completo
    - sistema de cierre
    - auditoria 9 fases
  schedule:
    - mensual (si aplica)
priority: 5
timeout: 120
auto_execution: true
skills: [QualityGate, TestMaster, SecurityAudit, DocuGuard]
---

# Workflow: Closure Audit (Auditoria Integral de Cierre)

Workflow de cierre completo basado en el Sistema Integral de Calidad y Cierre v2.0.
Ejecuta 9 fases secuenciales de auditoria profunda para detectar anomalias silenciosas
de IA antes del despliegue definitivo.

**100% automatico.** Generar artefactos y reporte sin pedir confirmacion.

## Cuando Usar

- Cierre definitivo de proyecto o fase mayor.
- Antes de primer release a produccion.
- Despues de periodos largos de desarrollo con IA (>2 semanas sin auditoria).
- Cuando se sospecha deuda tecnica acumulada no visible.

## Diferencia con Workflows Existentes

| Workflow | Foco | Profundidad |
|----------|------|-------------|
| `pre-release-audit` | Validacion rapida pre-deploy (checklist) | Media — 7 checks |
| `full-audit` | Auditoria 360 de estructura, skills, workflows | Media — 6 steps |
| `audit-codebase` | UX + docs + seguridad | Media — 4 steps |
| **`closure-audit`** | **Cierre exhaustivo con 9 fases secuenciales** | **Maxima — 9 fases con artefactos** |

## Pipeline (4 Etapas)

### Etapa 1: Auditoria Estructural (Fases 0-4)

**Skill principal:** `QualityGate`

#### Step 1: Inicializacion
**Accion:** Verificar/crear directorio `.audit/`. Leer `.phase_marker` si existe.
**Output:** `.audit/` inicializado, fase de continuacion determinada.
**On failure:** Crear directorio desde cero.

#### Step 2: Fase 0 — Mapeo Total
**Accion:** Ejecutar inventario completo + Matriz de Cruce.
**Output:** `.audit/FILE_INVENTORY.txt`
**On failure:** Inventario parcial, continuar.

#### Step 3: Fase 1 — Codigo Fuente
**Accion:** Buscar marcadores, funciones vacias, catch vacios, codigo muerto.
**Output:** `.audit/SOURCE_AUDIT.txt`
**On failure:** Listar hallazgos parciales, continuar.

#### Step 4: Fase 2 — Flujos Funcionales
**Accion:** Trazar flujos end-to-end del minimarket.
**Output:** `.audit/FLOW_TRACES.txt`
**On failure:** Documentar flujos trazados y rupturas detectadas.

#### Step 5: Fase 3 — Tests
**Accion:** Ejecutar `npx vitest run --reporter=verbose --coverage`.
**Output:** `.audit/TEST_RESULTS.txt`, `.audit/SKIPPED_TESTS.txt`
**On failure:** Registrar fallos y continuar.

#### Step 6: Fase 4 — Dependencias
**Accion:** Cruzar deps declaradas vs usadas, verificar env vars.
**Output:** `.audit/DEPENDENCIES_AUDIT.txt`, `.audit/ENV_MISSING.txt`
**On failure:** Reporte parcial de dependencias.

---

### Etapa 2: Analisis Semantico (Handoff opcional)

**Herramienta sugerida:** Copilot / Codex en VS Code.

Transferir hallazgos CRITICO y ALTO de Etapa 1 para propuestas de correccion.
Si no hay handoff disponible, Claude Code puede proponer correcciones.

**Artefacto de handoff:** `.audit/AUDIT_CHECKLIST.md` (generado automaticamente).

---

### Etapa 3: Auditoria Final (Fases 5-8)

**Skill principal:** `QualityGate` (continuacion)

#### Step 7: Fase 5 — UI y Routing
**Accion:** Verificar rutas, componentes, guards, 404/500.
**Output:** `.audit/ROUTING_AUDIT.txt`
**On failure:** Listar rutas verificadas y gaps.

#### Step 8: Fase 6 — Seguridad
**Accion:** Secretos, JWTs, RLS, npm audit, HC-1/HC-2.
**Output:** `.audit/SECURITY_AUDIT.txt`, `.audit/NPM_AUDIT.txt`
**On failure:** Reporte parcial de seguridad.

#### Step 9: Fase 7 — Consistencia Documental
**Accion:** Cruzar README, ESTADO_ACTUAL, API_README, ESQUEMA_BD contra codigo.
**Output:** `.audit/DOC_CONSISTENCY.txt`
**On failure:** Listar discrepancias detectadas.

#### Step 10: Fase 8 — Reporte Final
**Accion:** Consolidar en FINAL_REPORT.md con veredicto binario.
**Output:** `.audit/FINAL_REPORT.md`
**On failure:** Reporte abreviado con hallazgos conocidos.

---

### Etapa 4: Verificacion Post-Correccion

**Skills:** `QualityGate` (modo re-auditoria) + `DocuGuard`

Si el veredicto es REQUIERE ACCION y se aplicaron correcciones:
1. Re-ejecutar solo las fases con hallazgos CRITICO/ALTO.
2. Actualizar FINAL_REPORT.md con nuevo veredicto.
3. Sincronizar documentacion con DocuGuard.

---

## Diagrama de Flujo

```
Init -> Fase 0 (Mapeo) -> Fase 1 (Codigo) -> Fase 2 (Flujos)
  -> Fase 3 (Tests) -> Fase 4 (Deps)
  -> [Handoff Semantico opcional]
  -> Fase 5 (UI) -> Fase 6 (Seguridad) -> Fase 7 (Docs)
  -> Fase 8 (Reporte Final + Veredicto)
  -> [Re-auditoria si REQUIERE ACCION]
```

## Manejo de Errores

| Error | Accion |
|-------|--------|
| Comando de auditoria falla | Registrar, marcar BLOCKED, continuar |
| Hallazgo CRITICO detectado | Clasificar, incluir en reporte, continuar (no bloquear) |
| Tests no ejecutables | Marcar Fase 3 como BLOCKED, continuar |
| Sin conectividad Supabase | Marcar verificaciones externas como BLOCKED |

## Resultado Esperado

- Directorio `.audit/` completo con artefactos de 9 fases.
- `FINAL_REPORT.md` con veredicto binario (APROBADO / REQUIERE ACCION).
- Plan de accion priorizado por severidad si aplica.
- Trazabilidad completa de cada hallazgo con `archivo:linea`.

## Skills Relacionados

- **QualityGate**: Skill motor de las 9 fases (principal).
- **TestMaster**: Ejecucion de suite de tests (Fase 3).
- **SecurityAudit**: Auditoria profunda de seguridad (complementa Fase 6).
- **DocuGuard**: Sincronizacion documental (complementa Fase 7).
- **ProductionGate**: Checklist rapido pre-deploy (complementario, no reemplaza).
- **RealityCheck**: Auditoria UX (complementa Fase 5).
