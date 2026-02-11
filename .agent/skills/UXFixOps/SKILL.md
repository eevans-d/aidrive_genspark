---
name: UXFixOps
description: Detector y corrector sistematico de gaps UX. Reemplaza console.error
  por toast/ErrorMessage, agrega Skeleton y estados vacios.
role: EXECUTOR
version: 1.0.0
impact: MEDIUM
impact_legacy: 1
triggers:
  automatic:
  - orchestrator keyword match (UXFixOps)
  manual:
  - UXFixOps
  - fix ux
  - mejorar ux
  - agregar skeleton
chain:
  receives_from: []
  sends_to:
  - DocuGuard
  - TestMaster
  required_before: []
priority: 7
---

# UXFixOps Skill

**ROL:** EXECUTOR (estado caliente). Detectar y corregir gaps UX sistematicamente.
**PROTOCOLO:** "Si el operador no ve el error, el error no existe para el."

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres).
2. NO usar comandos destructivos.
3. Cada fix debe ser verificable con `pnpm -C minimarket-system build`.
4. NO cambiar logica de negocio: solo mejorar feedback visual al usuario.

## Reglas de Automatizacion

1. Ejecutar scan completo sin pedir confirmacion.
2. Aplicar fixes automaticamente para patrones conocidos (HC-3, Skeleton faltante).
3. Si un fix no es obvio -> documentar y proponer, no aplicar.
4. Generar reporte de gaps encontrados y corregidos.
5. Invocar TestMaster al finalizar para verificar que fixes no rompen nada.

## Activacion

**Activar cuando:**
- Usuario pide "fix ux", "mejorar ux", "agregar skeleton", "feedback al usuario".
- Post-audit: corregir hallazgos UX de `docs/audit/EVIDENCIA_SP-B.md`.
- Despues de CodeCraft: verificar que nuevos componentes cumplan UX minimos.
- Palabra clave: "console.error", "ErrorMessage", "skeleton", "empty state".

**NO activar cuando:**
- Bug de logica de negocio (usar DebugHound).
- Cambio visual/estetico sin impacto funcional.
- Solo documentacion.

## Protocolo de Ejecucion

### FASE A: Scan de Gaps UX

1. **HC-3 — Mutaciones sin feedback (CRITICAL):**
   ```bash
   grep -rn "console.error" minimarket-system/src/pages/ --include="*.tsx" | grep -v "toast\.\|ErrorMessage"
   ```
   Cada resultado = mutacion donde el operador NO recibe feedback de error.

2. **Paginas sin ErrorMessage:**
   ```bash
   for f in minimarket-system/src/pages/*.tsx; do
     grep -L "ErrorMessage" "$f" 2>/dev/null
   done
   ```

3. **Paginas sin Skeleton:**
   ```bash
   for f in minimarket-system/src/pages/*.tsx; do
     grep -L "Skeleton" "$f" 2>/dev/null
   done
   ```

4. **Paginas sin empty state:**
   ```bash
   grep -rL "length === 0\|No hay\|Sin resultados\|vacio\|vacío" minimarket-system/src/pages/ --include="*.tsx"
   ```

5. **Mutaciones sin onError visible:**
   ```bash
   grep -B5 -A5 "useMutation" minimarket-system/src/pages/ --include="*.tsx" -r | grep -c "onError"
   ```

### FASE B: Clasificar Gaps

Priorizar por impacto al operador:

| Prioridad | Patron | Impacto | Fix |
|-----------|--------|---------|-----|
| P0 | `console.error` sin toast/ErrorMessage | Operador no sabe que fallo | Agregar `toast.error(err.message)` en onError |
| P1 | Pagina sin ErrorMessage | Error de carga invisible | Agregar `<ErrorMessage>` wrapping query error |
| P1 | Pagina sin Skeleton | Flash de contenido | Agregar `<SkeletonTable>` o `<SkeletonList>` |
| P2 | Sin empty state | Operador confunde vacio con error | Agregar mensaje "No hay [items]" |
| P2 | toast.error efimero para errores criticos | Mensaje desaparece rapido | Evaluar reemplazo por ErrorMessage persistente |

### FASE C: Aplicar Fixes

Para cada gap clasificado:

1. **HC-3 Fix (console.error -> toast.error):**
   ```tsx
   // ANTES (MALO):
   } catch (err) {
     console.error('Error creando pedido:', err);
   }

   // DESPUES (CORRECTO):
   } catch (err) {
     console.error('Error creando pedido:', err);
     toast.error(err instanceof Error ? err.message : 'Error al crear pedido');
   }
   ```
   Nota: Mantener `console.error` para debugging + agregar `toast.error` para UX.

2. **ErrorMessage Fix:**
   ```tsx
   // Agregar import:
   import { ErrorMessage } from '../components/ErrorMessage';
   
   // Agregar en render:
   if (error) return <ErrorMessage error={error} onRetry={refetch} />;
   ```

3. **Skeleton Fix:**
   ```tsx
   // Agregar import:
   import { SkeletonTable } from '../components/Skeleton';
   
   // Agregar en render:
   if (isLoading) return <SkeletonTable rows={5} cols={4} />;
   ```

### FASE D: Verify

1. **Build check:**
   ```bash
   pnpm -C minimarket-system build
   ```
2. **Re-scan:** Ejecutar FASE A nuevamente para confirmar que gaps se cerraron.
3. **Documentar en EVIDENCE.md:** Lista de archivos modificados + gaps cerrados.

## Quality Gates

- [ ] Zero `console.error` como unico manejo de error en mutaciones.
- [ ] Todas las paginas tienen ErrorMessage para error de carga.
- [ ] Build exitoso post-fix.
- [ ] Re-scan confirma gaps cerrados.

## Anti-Loop / Stop-Conditions

**SI hay >20 gaps encontrados:**
1. Priorizar P0 primero (HC-3).
2. Hacer P1 en batch.
3. P2 documentar como backlog.

**SI un fix rompe el build:**
1. Revertir fix.
2. Documentar incompatibilidad.
3. Continuar con siguiente gap.

**NUNCA:** Cambiar logica de negocio. Solo mejorar feedback visual.
