---
name: CodeCraft
description: Implementar nuevas features (Frontend y Backend) con enfoque TDD y calidad
  primero.
role: EXECUTOR
version: 1.0.0
impact: HIGH
impact_legacy: 1-2
triggers:
  automatic:
  - orchestrator keyword match (CodeCraft)
  manual:
  - CodeCraft
  - crea endpoint
  - agrega pantalla
  - implementa feature
chain:
  receives_from: []
  sends_to:
  - DocuGuard
  - MigrationOps
  - TestMaster
  required_before: []
priority: 5
---

# CodeCraft Skill

**ROL:** EXECUTOR (estado caliente). Implementar codigo, crear tests, scaffolding.
**PRE-REQUISITO:** Briefing aprobado (CODEX previo) o instruccion directa del usuario.

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres).
2. NO usar comandos destructivos (`git reset --hard`, `git checkout -- <file>`, force-push).
3. Backend: NO usar `console.log` (usar `_shared/logger.ts`).
4. Si se redeployea `api-minimarket`: mantener `verify_jwt=false` (flag `--no-verify-jwt`).
5. **HC-3 ENFORCEMENT:** Al crear mutaciones (`useMutation`), OBLIGATORIO usar `toast.error()` o `ErrorMessage` para errores. PROHIBIDO usar solo `console.error()` — el operador DEBE recibir feedback visual.
6. **UX MINIMOS:** Toda pagina nueva DEBE incluir: `ErrorMessage` (errores), `Skeleton` (carga), estado vacio (datos vacíos).

## Reglas de Automatizacion

1. Ejecutar fases A->D en secuencia sin pedir confirmacion.
2. Crear tests ANTES del codigo (TDD automatico).
3. Si build falla -> arreglar automaticamente (no esperar input).
4. Registrar archivos creados/modificados en EVIDENCE.md.
5. Al finalizar, invocar TestMaster y DocuGuard automaticamente.

## Activacion

**Activar cuando:**
- Usuario pide "Crea la pantalla de X" o "Agrega el endpoint de Y".
- Necesitas crear nueva funcionalidad o refactorizar componente.

**NO activar cuando:**
- Solo corrigiendo bug menor (usar DebugHound).
- Solo actualizando dependencias.
- Falta `.env` o credenciales criticas.

## Protocolo de Ejecucion

### FASE A: Analisis y Arquitectura

1. **Leer contexto:** Antes de escribir, leer los archivos relacionados existentes.
2. **Decision arquitectonica:**
   - Backend: Agregar handler en `supabase/functions/api-minimarket/handlers/` o nueva Edge Function?
   - Frontend: Nueva pagina en `minimarket-system/src/pages/` o componente en `minimarket-system/src/components/`?
3. **Verificar patrones existentes:**
   ```bash
   ls minimarket-system/src/pages/
   ls minimarket-system/src/hooks/
   ls supabase/functions/api-minimarket/handlers/
   ```

### FASE B: Backend (API First)

1. **Scaffold:** Crear estructura en `supabase/functions/`.
2. **Shared Libs:** Usar `supabase/functions/_shared/` para logs (`logger.ts`) y respuestas (`response.ts`). NO usar `console.log`.
3. **Test-Driven:** Crear `tests/unit/<feature>.test.ts` ANTES del codigo real.
4. **Implementar:** Escribir codigo hasta que el test pase (Red-Green-Refactor).
5. **Verificar:**
   ```bash
   npx vitest run tests/unit/<feature>.test.ts
   ```

### FASE C: Frontend (UI/UX)

1. **Data Layer:** Crear hook en `minimarket-system/src/hooks/` usando React Query.
2. **API Client:** Actualizar `minimarket-system/src/lib/apiClient.ts` si hay endpoints nuevos.
3. **UI:** Crear pagina/componente en `minimarket-system/src/`.
4. **Routing:** Registrar ruta en `minimarket-system/src/App.tsx`.
5. **UX Checklist (OBLIGATORIO para cada pagina nueva):**
   - [ ] `ErrorMessage` component para estado de error (NO solo `toast.error`)
   - [ ] `Skeleton` component para estado de carga
   - [ ] Estado vacio: mensaje instructivo cuando `data.length === 0`
   - [ ] Mutaciones (`useMutation`): `onError` usa `toast.error(err.message)` minimo
   - [ ] Verificar:
     ```bash
     grep -n "console.error" minimarket-system/src/pages/<NuevaPagina>.tsx
     ```
     Si hay `console.error` sin `toast.error` en la misma funcion -> FIX OBLIGATORIO.

### FASE D: Integration y Verify

1. **Tests:** Ejecutar suite completa:
   ```bash
   npx vitest run tests/unit/
   ```
2. **Build:** Verificar que compila:
   ```bash
   cd minimarket-system && pnpm build
   ```
3. **Documentar:** Registrar feature en `docs/ESTADO_ACTUAL.md`.

## Quality Gates

- [ ] Tests unitarios creados y pasando.
- [ ] Frontend desacoplado (usa Custom Hooks).
- [ ] Backend usa utilidades compartidas (`_shared`).
- [ ] Build exitoso sin errores.
- [ ] Sin `console.log` en codigo nuevo.
- [ ] Sin `console.error` como unico manejo de error en mutaciones (HC-3).
- [ ] Pagina nueva tiene ErrorMessage + Skeleton + empty state.
- [ ] Si se creo backend nuevo: verificar endpoint en OpenAPI spec (`docs/api-openapi-3.1.yaml`).

## Anti-Loop / Stop-Conditions

**SI no sabes donde ubicar un archivo:**
1. Usar ubicacion por defecto segun convencion del proyecto.
2. Documentar decision en EVIDENCE.md.
3. Continuar SIN esperar input.

**SI el build falla por tipos TypeScript:**
1. Arreglar los tipos automaticamente.
2. NO usar `any` como escape.
3. Si no se puede resolver en 2 intentos -> cerrar sesion como PARCIAL.

**NUNCA:** Quedarse esperando confirmacion manual.
