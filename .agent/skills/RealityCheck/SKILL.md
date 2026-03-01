---
name: RealityCheck
description: Mentor ultra-realista que audita UX, funcionalidad y produccion. Detecta
  gaps entre docs y codigo.
role: CODEX
version: 1.0.0
impact: HIGH
impact_legacy: 0
triggers:
  automatic:
  - orchestrator keyword match (RealityCheck)
  - 'after completion of: DeployOps'
  manual:
  - RealityCheck
  - audita
  - verifica ux
  - revisa usabilidad
chain:
  receives_from:
  - DeployOps
  sends_to:
  - DocuGuard
  required_before: []
priority: 9
---

# RealityCheck Skill

**ROL:** CODEX (estado frio). Auditar, validar, generar reportes. NO implementar cambios.
**FILOSOFIA:** "Si el usuario no puede completar su tarea en 3 clicks o menos, algo esta mal."

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres).
2. NO usar comandos destructivos.
3. Clasificar TODO como REAL / A CREAR / PROPUESTA FUTURA con evidencia (ruta/comando).

## Reglas de Automatizacion

1. Ejecutar todas las fases en secuencia sin pedir confirmacion.
2. Generar reporte automaticamente al finalizar.
3. Clasificar TODOS los elementos como REAL/A CREAR/PROPUESTA FUTURA.
4. Si encuentra blockers P0, reportar y continuar (no esperar input).

## Prioridades

- **P0:** Flujos de Usuario - puede el usuario completar su tarea?
- **P1:** Experiencia Frontend - es agil, simple, sin friccion?
- **P2:** Confiabilidad Backend - los datos fluyen correctamente?
- **P3:** Seguridad - es seguro sin sacrificar usabilidad?
- **P4:** Documentacion - coincide con la realidad?

## Activacion

**Activar cuando:**
- Validar si un empleado podria usar el sistema.
- Pre-demo a cliente/stakeholder.
- Validar flujo completo de usuario.
- Post-implementacion de feature grande.

**NO activar cuando:**
- Solo revisando codigo estatico (usar lint).
- Bug puntual aislado (usar DebugHound).
- Solo cambios en documentacion.

## Inputs

| Input | Descripcion | Default |
|-------|-------------|---------|
| Scope | `full`, `page:<name>`, `flow:<name>` | `full` |
| Depth | `quick`, `standard`, `deep` | `standard` |
| Focus | `ux`, `completeness`, `security`, `all` | `ux` |

## Protocolo de Ejecucion

### FASE A: Descubrimiento Dinamico

No asumir que paginas existen. Descubrirlo:

1. **Listar paginas:**
   ```bash
   ls minimarket-system/src/pages/
   ```
2. **Identificar hooks por pagina:**
   ```bash
   grep -r "use[A-Z]" minimarket-system/src/pages/ --include="*.tsx" -oh | sort -u
   ```
3. **Listar endpoints backend:**
   ```bash
   grep -E "(GET|POST|PUT|PATCH|DELETE)" supabase/functions/api-minimarket/index.ts
   ```

### FASE B: Checklist UX (por cada pagina)

- [ ] Estados de carga (`isLoading`) visibles?
- [ ] Estados de error (`isError`) amigables y con retry?
- [ ] Estados vacios (`data.length === 0`) con instrucciones?
- [ ] Feedback visual inmediato al usuario?
- [ ] Navegacion clara (breadcrumbs, titulos)?

### FASE C: Simulacion de Usuario Real

Adoptar rol de usuario final (Repositor, Cajero, Admin):

**Busqueda de Friccion:**
- Login -> Persiste la sesion?
- Formularios -> Validan antes de enviar?
- Errores -> Dicen que hacer o solo "Error"?
- Navegacion -> Se puede volver atras?

### FASE D: Validacion Tecnica Backend

1. **Match de endpoints:**
   ```bash
   grep -r "apiClient\.\|fetch(" minimarket-system/src/ --include="*.ts" --include="*.tsx" -l
   ```
2. **Production killers:**
   ```bash
   grep -r "console\.log" supabase/functions/ --include="*.ts" -l
   grep -r "throw new Error(" supabase/functions/ --include="*.ts" -c
   ```

### FASE E: Patrones de Auditoria (HC-1/HC-2/HC-3)

Verificar patrones criticos descubiertos en auditoria forense:

1. **HC-1 — Cron jobs sin Authorization header:**
   ```bash
   for f in supabase/migrations/*.sql; do
     awk 'BEGIN{inb=0;has=0}
          /^[[:space:]]*--/ {next}
          /net\.http_post\(/ {inb=1;has=0;start=NR}
          inb && /Authorization/ {has=1}
          inb && /\);/ {if(!has) printf "%s:%d missing Authorization in net.http_post block\n", FILENAME, start; inb=0}' "$f"
   done
   ```
   Si hay cron jobs sin header `Authorization` -> **CRITICAL**.

2. **HC-2 — deploy.sh seguridad:**
   ```bash
   grep "_shared" deploy.sh 2>/dev/null || echo "WARN: deploy.sh no filtra _shared/"
   grep "no-verify-jwt" deploy.sh 2>/dev/null || echo "WARN: deploy.sh sin --no-verify-jwt para api-minimarket"
   ```
   Si `deploy.sh` no filtra `_shared/` ni usa `--no-verify-jwt` -> **CRITICAL**.

3. **HC-3 — Mutaciones sin feedback al usuario:**
   ```bash
   grep -B5 "console.error" minimarket-system/src/pages/ --include="*.tsx" -r | grep -v "toast\.\|ErrorMessage"
   ```
   Si hay mutaciones que solo hacen `console.error()` sin `toast.error()` -> bug UX P0.

4. **Post-Audit Cross-Reference:**
   Si existen archivos `docs/audit/EVIDENCIA_SP-*.md`:
   ```bash
   ls docs/audit/EVIDENCIA_SP-*.md 2>/dev/null
   ```
   Comparar hallazgos actuales con evidencia de auditorias previas para detectar regresiones.

## Salida Requerida

Generar/actualizar: `docs/REALITY_CHECK_UX.md`

```markdown
# RealityCheck Report
**Fecha:** [Date] | **Scope:** [Scope] | **Score UX:** [1-10]

## Clasificacion de Estado
| Elemento | Estado | Evidencia |
|----------|--------|-----------|
| [Modulo] | REAL/A CREAR/PROPUESTA | [Ruta] |

## Blockers (P0)
- [ ] Problema A (impacto critico)

## Fricciones (P1)
- [ ] Problema B (molestia visual/funcional)

## Ready
- [x] Modulo C verificado ok
```

## Anti-Loop / Stop-Conditions

**SI hay >15 paginas:**
1. Priorizar: Login, Dashboard, flujos de compra/venta.
2. Documentar priorizacion.
3. Continuar SIN pedir confirmacion.

**SI no hay DB local/staging:**
1. Ejecutar analisis estatico del codigo.
2. Documentar limitacion.
3. Marcar como PARCIAL.

**NUNCA:** Quedarse esperando input manual.
