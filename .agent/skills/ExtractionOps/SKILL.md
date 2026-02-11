---
name: ExtractionOps
description: Genera reportes de extraccion para produccion (analisis tecnico + inventario)
  en docs/closure, sin exponer secretos.
role: CODEX
version: 1.0.0
impact: MEDIUM
impact_legacy: 0
triggers:
  automatic:
  - orchestrator keyword match (ExtractionOps)
  - 'after completion of: SessionOps'
  manual:
  - ExtractionOps
  - analisis tecnico completo
  - análisis técnico completo
  - reconocimiento completo
chain:
  receives_from:
  - SessionOps
  sends_to:
  - MegaPlanner
  required_before: []
priority: 3
---

# ExtractionOps Skill

**ROL:** CODEX. Produce evidencia compartible para que otro agente disene plan de accion.

## Guardrails (Obligatorio)

1. NO imprimir valores de secrets/JWTs (solo nombres).
2. NO usar comandos destructivos.
3. No modificar codigo (solo leer, ejecutar tests/gates opcionales).

## Reglas de Automatizacion

1. Ejecutar extraccion completa sin pedir confirmacion.
2. Si script falla -> ejecutar protocolo manual equivalente.
3. Validar que ambos reportes fueron generados.
4. Si alguna seccion es BLOCKED -> continuar con resto y documentar.
5. Al finalizar, invocar MegaPlanner automaticamente si chain configurado.

## Activacion

**Activar cuando:**
- El usuario pide "analisis tecnico completo", "reconocimiento del proyecto", "extraccion de informacion".
- Se necesita preparar un reporte para planificar go-live.
- Antes de una etapa de hardening/produccion.

**NO activar cuando:**
- Solo hotfix puntual (usar DebugHound).
- Solo documentacion (usar DocuGuard).

## Protocolo

### FASE A: Extraccion Automatizada

Generar ambos reportes (tecnico + inventario):
```bash
.agent/scripts/p0.sh extract --with-gates --with-supabase
```

Opciones:
- `--mode technical|inventory|both` (default: both)
- `--with-gates` (corre quality gates; puede tardar)
- `--with-perf` (corre `scripts/perf-baseline.mjs` si existe)
- `--with-supabase` (compara env usage vs Supabase secrets, nombres solamente)

### FASE B: Extraccion Manual (fallback si script falla)

Si `p0.sh` no esta disponible:

1. **Analisis tecnico:**
   ```bash
   echo "=== STACK ==="
   cat package.json | grep -E '"(name|version)"'
   cat minimarket-system/package.json | grep -E '"(dependencies|devDependencies)"' -A 50
   echo "=== FUNCIONES ==="
   ls supabase/functions/ | grep -v _shared | grep -v node_modules
   echo "=== MIGRACIONES ==="
   ls supabase/migrations/ | wc -l
   echo "=== TESTS ==="
   find tests/ -name "*.test.ts" | wc -l
   ```

2. **Inventario de recursos:**
   ```bash
   echo "=== PAGINAS ==="
   ls minimarket-system/src/pages/*.tsx
   echo "=== HOOKS ==="
   ls minimarket-system/src/hooks/
   echo "=== COMPONENTES ==="
   ls minimarket-system/src/components/
   echo "=== SHARED MODULES ==="
   ls supabase/functions/_shared/
   ```

3. **Guardar en** `docs/closure/TECHNICAL_ANALYSIS_<YYYY-MM-DD>_<HHMMSS>.md` y `docs/closure/INVENTORY_REPORT_<YYYY-MM-DD>_<HHMMSS>.md`.

## Salida Requerida

- `docs/closure/TECHNICAL_ANALYSIS_<YYYY-MM-DD>_<HHMMSS>.md`
- `docs/closure/INVENTORY_REPORT_<YYYY-MM-DD>_<HHMMSS>.md`

## Siguiente paso recomendado

Usar `MegaPlanner` con el reporte generado para producir un plan Top-10 con DoD + gates.

## Quality Gates

- [ ] Ambos reportes generados (tecnico + inventario).
- [ ] No hay secretos/valores expuestos en los reportes.
- [ ] Conteos son verificables contra filesystem real.
- [ ] Reportes tienen fecha y commit base.
- [ ] Secciones BLOCKED documentadas con razon.

## Anti-Loop / Stop-Conditions

**SI `p0.sh` no esta disponible:**
1. Ejecutar protocolo manual (FASE B).
2. Documentar que se uso fallback.
3. Continuar sin esperar input.

**SI extraccion produce > 500 lineas:**
1. Resumir secciones largas.
2. Mantener datos criticos completos.
3. Mover detalles a apendice.

**SI Supabase CLI no disponible:**
1. Omitir secciones de Supabase.
2. Marcar como BLOCKED.
3. Continuar con datos locales.

**NUNCA:** Quedar esperando confirmacion. Generar reportes y cerrar.
