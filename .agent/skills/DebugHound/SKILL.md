---
name: DebugHound
description: Analisis y resolucion sistematica de errores. Traza, diagnostica y aplica fixes con evidencia.
role: CODEX->EXECUTOR
impact: variable
chain: [TestMaster]
---

# DebugHound Skill

**ROL:** CODEX (fases A-B: analizar, diagnosticar) + EXECUTOR (fase C: aplicar fix).
**PROTOCOLO:** "Un error, un fix, una evidencia."

## Reglas de Automatizacion

1. Ejecutar analisis completo sin pedir confirmacion.
2. SI hay fix obvio (typo, import faltante) -> aplicar automaticamente.
3. SI fix requiere cambio arquitectonico -> documentar y proponer.
4. Siempre generar evidencia con stack trace y analisis.
5. Nunca quedarse en loop de debugging > 3 iteraciones.

## Activacion

**Activar cuando:**
- Build falla con error.
- Test falla con stack trace.
- Usuario reporta bug especifico.
- Runtime error en logs.

**NO activar cuando:**
- Error ajeno al proyecto (dependencia externa caida).
- Error de configuracion de entorno (`.env` faltante).
- Solo warnings (no errores).

## Protocolo de Ejecucion

### FASE A: Recoleccion de Evidencia

1. **Capturar error completo:** Stack trace, archivo, linea, contexto.
2. **Clasificar tipo:**
   | Tipo | Ejemplo | Fix Tipico |
   |------|---------|------------|
   | ImportError | Cannot find module | Agregar import/instalar dep |
   | TypeError | X is not defined | Agregar declaracion/null check |
   | SyntaxError | Unexpected token | Corregir sintaxis |
   | CompileError | Type mismatch | Ajustar tipos TS |
   | NetworkError | Connection refused | Verificar env/URLs |
   | AuthError | Unauthorized | Verificar tokens/permisos |
   | LogicError | Resultado incorrecto | Corregir flujo |

### FASE B: Diagnostico

1. **Analizar stack trace:**
   - Identificar archivo raiz del error.
   - Trazar flujo de ejecucion.
2. **Buscar patrones similares:**
   ```bash
   grep -r "<patron_error>" --include="*.ts" --include="*.tsx" -l
   ```
3. **Verificar cambios recientes:**
   ```bash
   git log -5 --oneline
   git diff HEAD~1 --stat
   ```

### FASE C: Fix y Verify

1. **Aplicar fix segun tipo:**
   - TypeScript: Corregir tipos, imports.
   - Runtime: Agregar validaciones, null checks.
   - Logic: Corregir flujo.
2. **Verificar fix:**
   ```bash
   npx vitest run tests/unit/
   cd minimarket-system && pnpm build
   ```
3. **Documentar en EVIDENCE.md:**
   ```markdown
   ## Bug Fix: [descripcion]
   **Causa:** [root cause]
   **Archivos:** [lista]
   **Fix:** [que se cambio]
   **Verificacion:** [como se verifico]
   ```

## Quality Gates

- [ ] Error original reproducido y entendido.
- [ ] Root cause identificado.
- [ ] Fix aplicado y verificado con tests.
- [ ] No se introdujeron nuevos errores.
- [ ] Evidencia documentada.

## Anti-Loop / Stop-Conditions

**SI el fix no resuelve el error:**
1. Documentar intentos previos.
2. Ampliar busqueda de contexto.
3. Maximo 3 iteraciones.
4. Si persiste -> marcar como NEEDS_HUMAN_REVIEW.

**SI el error es de dependencia externa:**
1. Documentar como "External Issue".
2. No intentar fix.
3. Reportar con recomendacion de workaround.

**NUNCA:** Aplicar fixes sin verificar que funcionan.
