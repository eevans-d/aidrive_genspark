---
name: audit-codebase
description: Auditoria profunda de UX y consistencia documental. Usa RealityCheck + DocuGuard + SecurityAudit.
version: 1.0.0
trigger:
  automatic:
    - ejecución de full-audit
    - detección de deriva documental significativa
  manual:
    - audit codebase
    - auditar repositorio
  schedule: []
priority: 5
timeout: 40
auto_execution: true
skills: [RealityCheck, DocuGuard, SecurityAudit]
---

# Audit Codebase Workflow

Workflow para auditoria completa del sistema: UX, documentacion y seguridad.
**100% automatico.** Generar reporte sin pedir confirmacion.

## Pasos

### 1. Ejecutar RealityCheck (UX Audit)

Seguir `.agent/skills/RealityCheck/SKILL.md`:
1. Descubrir paginas existentes: `ls minimarket-system/src/pages/`
2. Ejecutar "Simulacion de Usuario Real" para flujos criticos.
3. Generar/actualizar `docs/REALITY_CHECK_UX.md`.

### 2. Ejecutar DocuGuard (Consistency Audit)

Seguir `.agent/skills/DocuGuard/SKILL.md`:
1. Buscar patrones prohibidos (console.log, secrets).
2. Verificar que `docs/ESTADO_ACTUAL.md` coincide con la realidad.
3. Reportar discrepancias.

### 3. Ejecutar SecurityAudit (Security Scan)

Seguir `.agent/skills/SecurityAudit/SKILL.md`:
1. Verificar RLS en todas las tablas.
2. Buscar secrets hardcodeados.
3. Verificar autenticacion en endpoints.
4. Generar/actualizar `docs/SECURITY_AUDIT_REPORT.md`.

### 4. Reporte Final

Generar resumen consolidado con:
- Top 3 Blockers (P0) si los hay.
- Top 3 Quick Wins (fixes rapidos).
- Score UX global.
- Score seguridad global.

## Skills Relacionados

- **RealityCheck**: Auditoria UX principal
- **DocuGuard**: Verificar sincronizacion docs
- **SecurityAudit**: Auditoria de seguridad
