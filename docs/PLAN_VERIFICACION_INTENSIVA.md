# PLAN DE VERIFICACIÓN Y PULIDO INTENSIVO DE PLANIFICACIÓN

**Fecha:** 2026-01-15  
**Estado:** En ejecución  
**Tipo:** Sub-planificación temporal de verificación (meta-verificación)  
**Objetivo:** Validar, pulir y garantizar coherencia total de la planificación definitiva antes de ejecución  
**Duración estimada:** 2-4 horas de trabajo intensivo

---

## 1. Alcance de la Verificación

### Documentos a Verificar (Corpus de Planificación)

| Capa | Documento | Prioridad | Estado |
|------|-----------|-----------|--------|
| Índice | `docs/MPC_INDEX.md` | P0 | ⬜ Pendiente |
| C0 | `docs/C0_DISCOVERY_MINIMARKET_TEC_2026-01-14.md` | P0 | ⬜ Pendiente |
| C0 | `docs/C0_RISK_REGISTER_MINIMARKET_TEC.md` | P1 | ⬜ Pendiente |
| C0 | `docs/C0_STAKEHOLDERS_MINIMARKET_TEC.md` | P2 | ⬜ Pendiente |
| C0 | `docs/C0_COMMUNICATION_PLAN_MINIMARKET_TEC.md` | P2 | ⬜ Pendiente |
| C1 | `docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md` | P0 | ⬜ Pendiente |
| C1 | `docs/ROADMAP.md` | P0 | ⬜ Pendiente |
| C1 | `docs/PLAN_WS_DETALLADO.md` | P0 | ⬜ Pendiente |
| C1 | `docs/DECISION_LOG.md` | P0 | ⬜ Pendiente |
| C3 | `docs/CHECKLIST_CIERRE.md` | P0 | ⬜ Pendiente |
| C4 | `docs/C4_HANDOFF_MINIMARKET_TEC.md` | P1 | ⬜ Pendiente |
| C4 | `docs/C4_SLA_SLO_MINIMARKET_TEC.md` | P1 | ⬜ Pendiente |
| C4 | `docs/C4_INCIDENT_RESPONSE_MINIMARKET_TEC.md` | P1 | ⬜ Pendiente |
| Soporte | `docs/INVENTARIO_ACTUAL.md` | P1 | ⬜ Pendiente |
| Soporte | `docs/BASELINE_TECNICO.md` | P1 | ⬜ Pendiente |
| Soporte | `docs/ESTADO_ACTUAL.md` | P1 | ⬜ Pendiente |
| Framework | `docs/MPC_v2.1_PARTE_1_de_2.md` | P2 | ⬜ Pendiente |
| Framework | `docs/MPC_v2.1_PARTE_2_de_2.md` | P2 | ⬜ Pendiente |

---

## 2. Fases de Verificación

### FASE V1: Integridad Estructural (30-45 min)

**Objetivo:** Verificar que todos los documentos existen, tienen estructura correcta y enlaces válidos.

| ID | Tarea | Verificación | Estado |
|----|-------|--------------|--------|
| V1.1 | Verificar existencia física de todos los docs en MPC_INDEX | `ls -la docs/C0_* docs/C1_* docs/C4_*` | ⬜ |
| V1.2 | Verificar enlaces internos entre documentos (no rotos) | Grep referencias cruzadas | ⬜ |
| V1.3 | Verificar formato markdown válido en docs P0 | Lint o revisión visual | ⬜ |
| V1.4 | Verificar fechas consistentes (≥2026-01-14) | Grep `Fecha:` headers | ⬜ |
| V1.5 | Verificar versiones correctas referenciadas | Cross-check v1.0.0 | ⬜ |

**Criterio de Aceptación V1:**
- 100% de archivos listados en MPC_INDEX existen
- 0 enlaces rotos internos
- Fechas coherentes (no versiones anteriores a 2026-01-14)

---

### FASE V2: Coherencia Cruzada Capa 0 ↔ Capa 1 (30-45 min)

**Objetivo:** Verificar que C0 Discovery alimenta correctamente C1 Mega Plan.

| ID | Tarea | Verificación | Estado |
|----|-------|--------------|--------|
| V2.1 | Riesgos en C0_RISK_REGISTER ↔ RAID en C1_MEGA_PLAN | Cruzar R1-R6 | ⬜ |
| V2.2 | Activos en C0_DISCOVERY ↔ Scope en C1_MEGA_PLAN | Validar cobertura | ⬜ |
| V2.3 | Stakeholders C0 ↔ Owners por WS en PLAN_WS_DETALLADO | Mapeo roles | ⬜ |
| V2.4 | Restricciones C0 ↔ Assumptions C1 | Coherencia | ⬜ |
| V2.5 | Deuda técnica C0 ↔ Gaps C1 sección 7 | No omisiones | ⬜ |

**Criterio de Aceptación V2:**
- Cada riesgo en C0 tiene mitigación en C1
- Cada activo crítico tiene cobertura en al menos un WS
- Owners asignados a todos los WS

---

### FASE V3: Coherencia Capa 1 Interna (MEGA_PLAN ↔ ROADMAP ↔ PLAN_WS) (45-60 min)

**Objetivo:** Verificar que los tres documentos de nivel 1 están 100% alineados.

| ID | Tarea | Verificación | Estado |
|----|-------|--------------|--------|
| V3.1 | Etapas E1-E5 en C1 ↔ WS1-WS9 en ROADMAP | Mapeo completo | ⬜ |
| V3.2 | Fases F1.1-F5.3 en C1 ↔ Tareas en PLAN_WS_DETALLADO | Cobertura total | ⬜ |
| V3.3 | Prioridades P0-P3 consistentes entre docs | No contradicciones | ⬜ |
| V3.4 | Checkpoints en C1 ↔ Estado por fase en CHECKLIST_CIERRE | Alineados | ⬜ |
| V3.5 | ADRs D-XXX referenciados en C1 existen en DECISION_LOG | Completitud | ⬜ |
| V3.6 | Criterios SMART en C1 ↔ Criterios de aceptación en PLAN_WS | Consistencia | ⬜ |
| V3.7 | Dependencias declaradas ↔ Orden de ejecución recomendado | Lógica correcta | ⬜ |
| V3.8 | Bloqueadores externos (credenciales) ↔ Gates CI documentados | Coherencia | ⬜ |

**Criterio de Aceptación V3:**
- 0 tareas en ROADMAP sin correspondencia en PLAN_WS_DETALLADO
- 0 ADRs referenciados en C1 sin existir en DECISION_LOG
- Secuencia de dependencias lógica verificada

---

### FASE V4: Coherencia Documental ↔ Código Real (45-60 min)

**Objetivo:** Verificar que la planificación refleja el estado real del código.

| ID | Tarea | Verificación | Estado |
|----|-------|--------------|--------|
| V4.1 | Funciones listadas en INVENTARIO existen en `supabase/functions/` | `ls` vs doc | ⬜ |
| V4.2 | Tests mencionados existen en paths correctos | `ls tests/` | ⬜ |
| V4.3 | Scripts referenciados (`rls_audit.sql`, runners) existen | File check | ⬜ |
| V4.4 | Configs mencionados (vitest.config.ts, ci.yml) actualizados | Content check | ⬜ |
| V4.5 | Handlers/modules listados en PLAN_WS existen en código | Grep paths | ⬜ |
| V4.6 | DECISION_LOG.md refleja estado real (Jest retirado, Vitest activo) | Cross-check | ⬜ |
| V4.7 | ARCHITECTURE_DOCUMENTATION.md refleja stack real | Validar | ⬜ |

**Criterio de Aceptación V4:**
- 100% de archivos referenciados existen
- DECISION_LOG actualizado a estado real
- Arquitectura documental = arquitectura código

---

### FASE V5: Verificación de Completitud MPC (30 min)

**Objetivo:** Verificar que el framework MPC está correctamente aplicado.

| ID | Tarea | Verificación | Estado |
|----|-------|--------------|--------|
| V5.1 | MPC_INDEX referencia correctamente todos los artefactos | Cross-check | ⬜ |
| V5.2 | Templates MPC_v2.1 usados correctamente (TEC domain) | Revisión | ⬜ |
| V5.3 | Nivel Intermedio correctamente aplicado (C0+C1+C4) | Validar capas | ⬜ |
| V5.4 | Capa 2 en PLAN_WS_DETALLADO cubre todos los WS | Completitud | ⬜ |
| V5.5 | Capa 3 execution logs/checklists listos | Verificar templates | ⬜ |
| V5.6 | Capa 4 handoff/SLO/IR tienen contenido útil | No placeholders | ⬜ |

**Criterio de Aceptación V5:**
- Framework MPC aplicado consistentemente
- No hay placeholders [TODO] sin resolver en docs P0

---

### FASE V6: Pulido Final y Correcciones (30-45 min)

**Objetivo:** Aplicar correcciones detectadas y dejar planificación lista.

| ID | Tarea | Verificación | Estado |
|----|-------|--------------|--------|
| V6.1 | Corregir enlaces rotos detectados | Edición | ⬜ |
| V6.2 | Actualizar fechas inconsistentes | Normalizar a 2026-01-15 | ⬜ |
| V6.3 | Eliminar duplicaciones detectadas | Consolidar | ⬜ |
| V6.4 | Resolver gaps C0↔C1 o C1↔código | Ajustar docs | ⬜ |
| V6.5 | Actualizar CHECKLIST_CIERRE con estado real | Marcar completados | ⬜ |
| V6.6 | Regenerar/actualizar secciones obsoletas | Refrescar | ⬜ |
| V6.7 | Verificación final cruzada post-correcciones | Re-run checks | ⬜ |

**Criterio de Aceptación V6:**
- Todas las correcciones aplicadas
- Segunda pasada de verificación sin nuevos hallazgos

---

## 3. Matriz de Verificación Cruzada

```
                    MPC_INDEX  C0_DISCOVERY  C0_RISK  C1_MEGA  ROADMAP  PLAN_WS  DECISION  CHECKLIST
MPC_INDEX              -           ✓            ✓        ✓        ✓        ✓         ✓          ✓
C0_DISCOVERY           ✓           -            ✓        ✓        ✓        ✓         -          -
C0_RISK_REGISTER       ✓           ✓            -        ✓        -        -         -          -
C1_MEGA_PLAN           ✓           ✓            ✓        -        ✓        ✓         ✓          ✓
ROADMAP                ✓           -            -        ✓        -        ✓         ✓          ✓
PLAN_WS_DETALLADO      ✓           -            -        ✓        ✓        -         ✓          ✓
DECISION_LOG           ✓           -            -        ✓        ✓        ✓         -          ✓
CHECKLIST_CIERRE       ✓           -            -        ✓        ✓        ✓         ✓          -
```

**Leyenda:** ✓ = Verificar coherencia cruzada entre documentos

---

## 4. Comandos de Verificación Automatizada

### 4.1 Verificar existencia de archivos P0
```bash
# Ejecutar desde raíz del proyecto
ls -la docs/MPC_INDEX.md \
       docs/C0_DISCOVERY_MINIMARKET_TEC_2026-01-14.md \
       docs/C0_RISK_REGISTER_MINIMARKET_TEC.md \
       docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md \
       docs/ROADMAP.md \
       docs/PLAN_WS_DETALLADO.md \
       docs/DECISION_LOG.md \
       docs/CHECKLIST_CIERRE.md
```

### 4.2 Verificar referencias a ADRs
```bash
# ADRs referenciados en C1
grep -oE "D-[0-9]{3}" docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md | sort -u

# ADRs existentes en DECISION_LOG
grep -oE "D-[0-9]{3}" docs/DECISION_LOG.md | sort -u

# Diferencia (ADRs referenciados pero no existentes)
comm -23 <(grep -oE "D-[0-9]{3}" docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md | sort -u) \
         <(grep -oE "D-[0-9]{3}" docs/DECISION_LOG.md | sort -u)
```

### 4.3 Verificar WS coverage
```bash
# WS mencionados en ROADMAP
grep -oE "WS[0-9]+\.[0-9]+" docs/ROADMAP.md | sort -u | wc -l

# WS detallados en PLAN_WS_DETALLADO
grep -oE "WS[0-9]+\.[0-9]+\.[0-9]+" docs/PLAN_WS_DETALLADO.md | sort -u | wc -l
```

### 4.4 Verificar fechas
```bash
# Fechas en headers de documentos
grep -r "Fecha:" docs/*.md | grep -v "2026-01" | head -20
grep -r "Última actualización:" docs/*.md | grep -v "2026-01" | head -20
```

### 4.5 Verificar archivos código referenciados
```bash
# Paths mencionados en PLAN_WS que deben existir
for f in \
  "supabase/functions/api-proveedor/index.ts" \
  "supabase/functions/scraper-maxiconsumo/index.ts" \
  "supabase/functions/cron-jobs-maxiconsumo/index.ts" \
  "supabase/functions/_shared/logger.ts" \
  "scripts/rls_audit.sql" \
  ".github/workflows/ci.yml"; do
  [ -f "$f" ] && echo "✓ $f" || echo "✗ MISSING: $f"
done
```

---

## 5. Checklist de Hallazgos

### Hallazgos Críticos (P0 - bloquean ejecución)
| ID | Descripción | Documento | Corrección | Estado |
|----|-------------|-----------|------------|--------|
| H-001 | | | | ⬜ |

### Hallazgos Altos (P1 - corregir antes de iniciar)
| ID | Descripción | Documento | Corrección | Estado |
|----|-------------|-----------|------------|--------|
| H-101 | | | | ⬜ |

### Hallazgos Medios (P2 - corregir durante ejecución)
| ID | Descripción | Documento | Corrección | Estado |
|----|-------------|-----------|------------|--------|
| H-201 | | | | ⬜ |

---

## 6. Criterios de Aceptación Final

### Gate de Verificación Completa

| Criterio | Umbral | Actual | Pass |
|----------|--------|--------|------|
| Archivos P0 existen | 100% | | ⬜ |
| Enlaces internos válidos | 100% | | ⬜ |
| ADRs referenciados existen | 100% | | ⬜ |
| Coherencia C0↔C1 | 100% | | ⬜ |
| Coherencia C1 interna (3 docs) | 100% | | ⬜ |
| Código ↔ Docs alineado | ≥95% | | ⬜ |
| Hallazgos P0 resueltos | 100% | | ⬜ |
| Hallazgos P1 resueltos | ≥90% | | ⬜ |
| Framework MPC aplicado | 100% | | ⬜ |

**Decisión Final:**
- ✅ **PLANIFICACIÓN LISTA:** Todos los criterios cumplidos
- ⚠️ **PROCEDER CON RESERVAS:** >90% cumplido, gaps documentados
- ❌ **REQUIERE MÁS TRABAJO:** <90% cumplido

---

## 7. Orden de Ejecución Recomendado

```
V1 (Integridad) ──► V2 (C0↔C1) ──► V3 (C1 interna) ──► V4 (Docs↔Código) ──► V5 (MPC) ──► V6 (Pulido)
     30-45 min         30-45 min       45-60 min           45-60 min         30 min       30-45 min
                                                                                      
Total estimado: 3.5 - 5 horas (trabajo intensivo con breaks)
```

### Priorización si hay limitación de tiempo:
1. **Mínimo viable (1.5h):** V1 + V3 + V6 (estructura + coherencia C1 + correcciones)
2. **Recomendado (3h):** V1 + V2 + V3 + V6 (incluye validación C0↔C1)
3. **Completo (4-5h):** Todas las fases

---

## 8. Plantilla de Reporte Final

```markdown
# REPORTE DE VERIFICACIÓN DE PLANIFICACIÓN

**Fecha:** 2026-01-15
**Ejecutor:** [Agente/Usuario]
**Duración:** [X horas]

## Resumen Ejecutivo
- Fases completadas: V1 ⬜ | V2 ⬜ | V3 ⬜ | V4 ⬜ | V5 ⬜ | V6 ⬜
- Hallazgos totales: P0: X | P1: X | P2: X
- Hallazgos resueltos: X de Y (Z%)
- Estado final: [LISTA / CON RESERVAS / REQUIERE TRABAJO]

## Hallazgos Detallados
[Tabla de hallazgos con correcciones aplicadas]

## Correcciones Aplicadas
[Lista de commits/cambios realizados]

## Riesgos Residuales
[Si aplica]

## Siguiente Paso
[Iniciar ejecución E1 / Completar correcciones pendientes / etc.]
```

---

## 9. Notas de Ejecución

### Para el Agente IA:
- Ejecutar verificaciones en orden secuencial (V1→V6)
- Documentar cada hallazgo inmediatamente en sección 5
- Aplicar correcciones en FASE V6, no durante verificación
- Usar comandos de sección 4 para automatizar donde sea posible
- Si se detecta un hallazgo P0 crítico, pausar y reportar antes de continuar

### Para el Usuario:
- Este plan es temporal y desechable post-verificación
- El objetivo es dejar la planificación definitiva en estado óptimo
- Los hallazgos y correcciones quedarán documentados en CHECKLIST_CIERRE.md
- Tiempo estimado: 3-5 horas de trabajo intensivo

---

**Estado del Plan:** ⬜ Pendiente de iniciar | 🔄 En progreso | ✅ Completado
