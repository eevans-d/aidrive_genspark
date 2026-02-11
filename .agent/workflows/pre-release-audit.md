---
name: pre-release-audit
description: Validacion completa pre-release. RealityCheck + TestMaster + SecurityAudit + PerformanceWatch.
version: 1.0.0
trigger:
  automatic:
    - antes de release a producción/staging
    - cierre de sprint con intención de entrega
  manual:
    - pre release audit
    - auditoria pre release
  schedule: []
priority: 4
timeout: 90
auto_execution: true
skills: [RealityCheck, TestMaster, SecurityAudit, PerformanceWatch, DocuGuard]
---

# Pre-Release Audit Workflow

Workflow para validacion completa antes de un release a produccion.
**Automatico excepto deploy final a produccion (impacto 3).**

## Cuando Usar

- Antes de version mayor/menor.
- Antes de demo a stakeholders.
- Despues de sprint completado.

## Pasos

### 1. RealityCheck Completo

Ejecutar con parametros: `deep`, `full`, `all`
```bash
# El skill se ejecuta siguiendo .agent/skills/RealityCheck/SKILL.md
# con Scope=full, Depth=deep, Focus=all
```
Verificar: Score UX >= 8/10.

### 2. Suite de Tests Completa

```bash
npm run test:all
```
Verificar: 100% passing.

### 3. Security Audit

Seguir `.agent/skills/SecurityAudit/SKILL.md`:
- Verificar Score seguridad >= 8/10.
- Sin hallazgos CRITICAL.

### 4. Performance Check

Seguir `.agent/skills/PerformanceWatch/SKILL.md`:
```bash
cd minimarket-system && pnpm build
```
Verificar: Bundle < 200KB gzip.

### 5. Build de Produccion

```bash
cd minimarket-system && pnpm build
```
Verificar: Sin errores ni warnings.

### 6. Sincronizacion de Docs

Seguir `.agent/skills/DocuGuard/SKILL.md`:
- Verificar `docs/ESTADO_ACTUAL.md` actualizado.
- Verificar `docs/DECISION_LOG.md` al dia.

## Checklist Pre-Release

- [ ] RealityCheck score >= 8
- [ ] Tests 100% passing
- [ ] Security sin CRITICAL
- [ ] Build produccion OK
- [ ] Bundle < 200KB gzip
- [ ] Documentacion sincronizada
- [ ] DECISION_LOG actualizado

## Skills Relacionados

- **RealityCheck**: Auditoria UX
- **TestMaster**: Suite de tests
- **SecurityAudit**: Seguridad
- **PerformanceWatch**: Rendimiento
- **DocuGuard**: Documentacion
- **DeployOps**: Deploy final
