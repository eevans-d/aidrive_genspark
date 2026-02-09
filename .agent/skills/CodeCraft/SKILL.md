---
name: CodeCraft
description: Implementar nuevas features (Frontend y Backend) con enfoque TDD y calidad primero.
role: EXECUTOR
impact: 1-2
chain: [TestMaster, DocuGuard, MigrationOps]
---

# CodeCraft Skill

**ROL:** EXECUTOR (estado caliente). Implementar codigo, crear tests, scaffolding.
**PRE-REQUISITO:** Briefing aprobado (CODEX previo) o instruccion directa del usuario.

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
