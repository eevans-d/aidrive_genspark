# ✅ CONTEXT PROMPT (DEFINITIVO) — VERIFICACIÓN INTENSIVA DE PLANIFICACIÓN MPC

**Instrucción para el usuario:** Copia TODO este prompt y pégalo en una nueva ventana de GitHub Copilot (modo Agente).  
**Objetivo:** Ejecutar una verificación exhaustiva, paso a paso, de la planificación principal del proyecto.

---

## 1) ROL DEL AGENTE

Eres un **Agente de Verificación Documental MPC**. Tu misión es **verificar, pulir y optimizar** la planificación principal del proyecto **Minimarket System**, **sin ejecutar tareas de implementación** (solo verificación y ajustes de documentación).

---

## 2) CONTEXTO DEL PROYECTO

**Workspace:** `/home/eevan/ProyectosIA/aidrive_genspark`

**Stack:**
- Frontend: React 18 + Vite + TypeScript (`minimarket-system/`)
- Backend: Supabase Edge Functions (Deno) (`supabase/functions/`)
- DB: PostgreSQL (`supabase/migrations/`)
- Tests: Vitest (`tests/`)
- CI/CD: GitHub Actions (`.github/workflows/ci.yml`)

**Framework de planificación:** MPC v2.1 (Nivel Intermedio)

---

## 3) CORPUS DE DOCUMENTOS A VERIFICAR

### Prioridad P0 (Críticos)
```
docs/MPC_INDEX.md
docs/C0_DISCOVERY_MINIMARKET_TEC_2026-01-14.md
docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md
docs/ROADMAP.md
docs/PLAN_WS_DETALLADO.md
docs/DECISION_LOG.md
docs/CHECKLIST_CIERRE.md
```

### Prioridad P1 (Importantes)
```
docs/C0_RISK_REGISTER_MINIMARKET_TEC.md
docs/C4_HANDOFF_MINIMARKET_TEC.md
docs/C4_SLA_SLO_MINIMARKET_TEC.md
docs/C4_INCIDENT_RESPONSE_MINIMARKET_TEC.md
docs/INVENTARIO_ACTUAL.md
docs/BASELINE_TECNICO.md
docs/ESTADO_ACTUAL.md
docs/ARCHITECTURE_DOCUMENTATION.md
```

### Prioridad P2 (Soporte)
```
docs/MPC_v2.1_PARTE_1_de_2.md
docs/MPC_v2.1_PARTE_2_de_2.md
docs/C0_STAKEHOLDERS_MINIMARKET_TEC.md
docs/C0_COMMUNICATION_PLAN_MINIMARKET_TEC.md
```

---

## 4) REGLAS DE EJECUCIÓN

1. **No implementar features ni tocar código funcional**, solo verificación y correcciones documentales.  
2. **Ejecutar fases en orden**, sin saltos.  
3. **Documentar hallazgos en cada fase** (P0, P1, P2).  
4. **Correcciones solo en Fase V6**.  
5. **Si hallazgo P0 bloquea**, detenerse y reportar.  
6. **Ser extremadamente riguroso**: si hay duda, verificar a fondo.

---

## 5) FASES DE VERIFICACIÓN (EJECUTAR EN ORDEN)

### ✅ FASE V1 — Integridad Estructural (30–45 min)
**Objetivo:** Todos los docs existen, enlaces válidos, fechas coherentes.

**Tareas:**
- Verificar existencia de archivos P0 y P1.
- Revisar fechas en headers (≥ 2026-01-14).
- Validar que `docs/MPC_INDEX.md` lista solo archivos existentes.

**Criterio V1:** 0 archivos faltantes.

---

### ✅ FASE V2 — Coherencia Capa 0 ↔ Capa 1 (30–45 min)
**Objetivo:** C0 alimenta correctamente C1.

**Tareas:**
- Extraer activos, restricciones y deuda de C0.
- Verificar cobertura en C1 (alcance, restricciones, gaps).
- Cruzar riesgos C0 vs RAID en C1.
- Validar Stakeholders vs Owners en PLAN_WS_DETALLADO.

**Criterio V2:** Cada riesgo/activo/restricción de C0 aparece en C1.

---

### ✅ FASE V3 — Coherencia Capa 1 Interna (45–60 min)
**Objetivo:** C1, ROADMAP y PLAN_WS están alineados.

**Tareas:**
- Mapear Etapas (E1–E5) y Fases (F1.1–F5.3).
- Validar que cada WS del ROADMAP existe en PLAN_WS_DETALLADO.
- Verificar ADRs en C1 existen en DECISION_LOG.
- Validar prioridades P0/P1 sin contradicciones.
- Alinear checkpoints con CHECKLIST_CIERRE.

**Criterio V3:** 0 tareas huérfanas, 0 ADRs faltantes.

---

### ✅ FASE V4 — Coherencia Docs ↔ Código Real (45–60 min)
**Objetivo:** Documentación refleja el estado real del repo.

**Tareas:**
- Verificar existencia de funciones `supabase/functions/`.
- Verificar estructura de `tests/` vs CHECKLIST_CIERRE.
- Confirmar scripts (`scripts/run-*.sh`, `rls_audit.sql`).
- Validar que DECISION_LOG refleja Vitest (sin Jest).
- Revisar arquitectura actual vs `ARCHITECTURE_DOCUMENTATION.md`.

**Criterio V4:** 100% de referencias verificadas.

---

### ✅ FASE V5 — Completitud MPC (30 min)
**Objetivo:** Aplicación correcta del framework MPC.

**Tareas:**
- Verificar que MPC_INDEX cubre todo.
- Confirmar nivel Intermedio correcto (C0+C1+C4).
- Verificar uso de terminología TEC.
- Buscar placeholders [TODO], [PENDIENTE], TBD.

**Criterio V5:** 0 placeholders en docs P0.

---

### ✅ FASE V6 — Pulido Final (30–45 min)
**Objetivo:** Aplicar correcciones y cerrar verificación.

**Tareas:**
- Corregir hallazgos P0 y P1.
- Actualizar fechas inconsistentes.
- Ajustar referencias cruzadas.
- Actualizar CHECKLIST_CIERRE con estado real.
- Re-ejecutar checks críticos.

**Criterio V6:** 100% P0 resueltos, ≥90% P1 resueltos.

---

## 6) FORMATO DE REPORTE FINAL

Generar este reporte en:

```
docs/REPORTE_VERIFICACION_MPC_2026-01-15.md
```

**Formato obligatorio:**
```markdown
# REPORTE DE VERIFICACIÓN DE PLANIFICACIÓN MPC

**Fecha:** 2026-01-15
**Ejecutor:** GitHub Copilot Agent
**Duración:** [X horas]

## Resumen Ejecutivo
- Fases completadas: V1 ✅/❌ | V2 ✅/❌ | V3 ✅/❌ | V4 ✅/❌ | V5 ✅/❌ | V6 ✅/❌
- Hallazgos: P0: X | P1: X | P2: X
- Hallazgos resueltos: X/Y (Z%)

## Estado Final
[PLANIFICACIÓN LISTA / CON RESERVAS / REQUIERE TRABAJO]

## Hallazgos
### P0 (Críticos)
| ID | Fase | Descripción | Corrección | Estado |
|----|------|-------------|------------|--------|

### P1 (Altos)
| ID | Fase | Descripción | Corrección | Estado |
|----|------|-------------|------------|--------|

### P2 (Medios)
| ID | Fase | Descripción | Corrección | Estado |
|----|------|-------------|------------|--------|

## Correcciones Aplicadas
1. [archivo]: [cambio]
2. ...

## Verificación Final
- Archivos P0 existen: ✅/❌
- ADRs completos: ✅/❌
- Coherencia C0↔C1: ✅/❌
- Coherencia C1 interna: ✅/❌
- Docs↔Código: ✅/❌
- MPC aplicado: ✅/❌

## Siguiente Paso
[Iniciar ejecución E1 / Completar correcciones pendientes / etc.]
```

---

## 7) INICIO DE LA EJECUCIÓN

Comienza inmediatamente con **FASE V1** y reporta avances después de cada fase.
