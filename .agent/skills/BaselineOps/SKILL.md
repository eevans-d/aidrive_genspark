---
name: BaselineOps
description: Captura un baseline seguro (git + supabase) y genera un log en docs/closure
  sin exponer secretos.
role: CODEX
version: 1.0.0
impact: LOW
impact_legacy: 0
triggers:
  automatic:
  - orchestrator keyword match (BaselineOps)
  manual:
  - BaselineOps
  - baseline
  - baseline inmediato
  - estado del repo
chain:
  receives_from: []
  sends_to: []
  required_before: []
priority: 2
---

# BaselineOps Skill

**ROL:** CODEX. Snapshot operativo para arrancar una sesion con evidencia (sin cambios funcionales).

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres).
2. NO ejecutar comandos destructivos.

## Reglas de Automatizacion

1. Ejecutar captura completa sin pedir confirmacion.
2. Si script falla -> ejecutar comandos manuales equivalentes.
3. Validar que el archivo de evidencia se creo correctamente.
4. Si Supabase CLI no disponible -> capturar solo git baseline.
5. Incluir siempre: git status, branch, HEAD, test count, file counts.

## Activacion

**Activar cuando:**
- Nueva sesion ("arranquemos", "dame el estado", "baseline inmediato").
- Antes de hacer cambios grandes (impacto >= 2).
- Post-deploy para dejar evidencia.

**NO activar cuando:**
- Ya existe un baseline reciente (< 1 hora).
- En medio de una sesion activa (usar SessionOps).

## Protocolo

### FASE A: Captura Automatizada

1. Ejecutar el capturador automatizado:
   ```bash
   .agent/scripts/baseline_capture.sh
   ```
2. Verificar que el log se creo en `docs/closure/BASELINE_LOG_*.md`.

### FASE B: Captura Manual (fallback si script falla)

Si el script no esta disponible:

1. **Git baseline:**
   ```bash
   echo "Branch: $(git branch --show-current)"
   echo "HEAD: $(git rev-parse HEAD)"
   git status --short
   git log -5 --oneline
   ```
2. **Conteos rapidos:**
   ```bash
   find tests/ -name "*.test.ts" | wc -l
   find minimarket-system/src/pages/ -name "*.tsx" | wc -l
   find supabase/functions/ -maxdepth 1 -type d | wc -l
   find supabase/migrations/ -name "*.sql" | wc -l
   ```
3. **Supabase (si disponible):**
   ```bash
   supabase --version 2>/dev/null
   supabase functions list --project-ref dqaygmjpzoqjjrywdsxi 2>/dev/null || echo "Supabase CLI not linked"
   ```
4. **Guardar en** `docs/closure/BASELINE_LOG_<YYYY-MM-DD>_<HHMMSS>.md`.

## Salida Requerida

- Archivo nuevo en `docs/closure/` con:
  - git status/branch/HEAD/log
  - Conteos: tests, paginas, funciones, migraciones
  - supabase version
  - migrations list (linked)
  - functions list (verify_jwt)
  - secrets list (NOMBRES solamente)

## Quality Gates

- [ ] Archivo `BASELINE_LOG_*.md` creado en `docs/closure/`.
- [ ] Git data capturado (branch, HEAD, status).
- [ ] Conteos verificados contra filesystem real.
- [ ] No hay secretos/valores expuestos en el log.
- [ ] Supabase data capturado o marcado como BLOCKED.

## Anti-Loop / Stop-Conditions

**SI Supabase CLI no disponible:**
1. Capturar solo git + conteos locales.
2. Marcar secciones Supabase como BLOCKED.
3. Continuar sin esperar input.

**SI filesystem WSL tiene problemas de permisos:**
1. Intentar con rutas absolutas.
2. Si persiste -> documentar limitacion.
3. Generar baseline parcial con lo disponible.

**SI ya existe baseline reciente (< 1h):**
1. Reportar "Baseline reciente encontrado".
2. No duplicar. Solo continuar.

**NUNCA:** Exponer valores de secretos en el log.
