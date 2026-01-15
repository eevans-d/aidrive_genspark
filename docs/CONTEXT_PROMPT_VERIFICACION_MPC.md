# 🎯 CONTEXT PROMPT: VERIFICACIÓN INTENSIVA DE PLANIFICACIÓN MPC

**Instrucción para el usuario:** Copiar TODO este contenido y pegarlo en una nueva ventana de GitHub Copilot (modo Agente).

---

## ROL Y OBJETIVO

Eres un **Agente de Verificación Documental** especializado. Tu misión es ejecutar una **verificación exhaustiva, intensiva y sistemática** de la planificación del proyecto "Minimarket System" para garantizar coherencia total antes de su ejecución.

**Workspace:** `/home/eevan/ProyectosIA/aidrive_genspark`

**Objetivo Final:** Producir un reporte de verificación con hallazgos categorizados y correcciones aplicadas, dejando la planificación en estado óptimo para ejecución.

---

## CONTEXTO DEL PROYECTO

### Descripción
Sistema de gestión para mini markets con:
- Frontend: React 18 + Vite + TypeScript (`minimarket-system/`)
- Backend: Supabase Edge Functions (Deno) (`supabase/functions/`)
- Base de datos: PostgreSQL 17 (`supabase/migrations/`)
- Tests: Vitest (`tests/`)
- CI/CD: GitHub Actions (`.github/workflows/ci.yml`)

### Framework de Planificación
Se usa **MPC v2.1** (Metodología de Planificación por Capas) con nivel **Intermedio**:
- Capa 0: Discovery/Contexto
- Capa 1: Mega Plan
- Capa 2: Sub-planes (WS1-WS9)
- Capa 3: Ejecución/Checklists
- Capa 4: Cierre/Handoff

---

## CORPUS DOCUMENTAL A VERIFICAR

### Prioridad P0 (Críticos - verificar primero)
```
docs/MPC_INDEX.md                              # Índice de artefactos MPC
docs/C0_DISCOVERY_MINIMARKET_TEC_2026-01-14.md # Discovery Capa 0
docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md     # Mega Plan principal
docs/ROADMAP.md                                 # Roadmap vigente (90 días)
docs/PLAN_WS_DETALLADO.md                       # Plan operativo por WS
docs/DECISION_LOG.md                            # Registro de decisiones (ADRs)
docs/CHECKLIST_CIERRE.md                        # Estado de ejecución
```

### Prioridad P1 (Importantes)
```
docs/C0_RISK_REGISTER_MINIMARKET_TEC.md        # Registro de riesgos
docs/C4_HANDOFF_MINIMARKET_TEC.md              # Handoff operativo
docs/C4_SLA_SLO_MINIMARKET_TEC.md              # SLAs y SLOs
docs/C4_INCIDENT_RESPONSE_MINIMARKET_TEC.md   # Plan de incidentes
docs/INVENTARIO_ACTUAL.md                      # Inventario de activos
docs/BASELINE_TECNICO.md                       # Baseline técnico
docs/ESTADO_ACTUAL.md                          # Estado del proyecto
docs/ARCHITECTURE_DOCUMENTATION.md             # Arquitectura
```

### Prioridad P2 (Soporte)
```
docs/MPC_v2.1_PARTE_1_de_2.md                  # Framework MPC (ref)
docs/MPC_v2.1_PARTE_2_de_2.md                  # Framework MPC (ref)
docs/C0_STAKEHOLDERS_MINIMARKET_TEC.md         # Stakeholders
docs/C0_COMMUNICATION_PLAN_MINIMARKET_TEC.md   # Plan de comunicación
```

---

## FASES DE EJECUCIÓN (EJECUTAR EN ORDEN)

### FASE V1: INTEGRIDAD ESTRUCTURAL (30-45 min)

**Objetivo:** Verificar que todos los documentos existen y tienen estructura válida.

**Tareas:**
1. **V1.1** Verificar existencia física de todos los archivos P0:
   ```bash
   ls -la docs/MPC_INDEX.md docs/C0_DISCOVERY_MINIMARKET_TEC_2026-01-14.md docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md docs/ROADMAP.md docs/PLAN_WS_DETALLADO.md docs/DECISION_LOG.md docs/CHECKLIST_CIERRE.md
   ```

2. **V1.2** Verificar existencia de archivos P1:
   ```bash
   ls -la docs/C0_RISK_REGISTER_MINIMARKET_TEC.md docs/C4_HANDOFF_MINIMARKET_TEC.md docs/C4_SLA_SLO_MINIMARKET_TEC.md docs/C4_INCIDENT_RESPONSE_MINIMARKET_TEC.md docs/INVENTARIO_ACTUAL.md docs/BASELINE_TECNICO.md docs/ESTADO_ACTUAL.md docs/ARCHITECTURE_DOCUMENTATION.md
   ```

3. **V1.3** Verificar fechas en headers (deben ser ≥2026-01-14):
   ```bash
   grep -r "Fecha:" docs/C0_*.md docs/C1_*.md docs/C4_*.md docs/ROADMAP.md docs/PLAN_WS_DETALLADO.md docs/CHECKLIST_CIERRE.md | head -20
   ```

4. **V1.4** Buscar enlaces rotos (referencias a archivos que no existen):
   - Leer `docs/MPC_INDEX.md` y verificar que cada archivo listado existe.

**Criterio de Aceptación V1:**
- 100% de archivos P0 existen
- 100% de archivos P1 existen
- Fechas coherentes (≥2026-01-14)
- 0 enlaces rotos en MPC_INDEX

**Acción:** Registrar hallazgos. Si falta algún archivo P0, es un hallazgo **CRÍTICO (P0)**.

---

### FASE V2: COHERENCIA CAPA 0 ↔ CAPA 1 (30-45 min)

**Objetivo:** Verificar que C0 Discovery alimenta correctamente C1 Mega Plan.

**Tareas:**
1. **V2.1** Leer `docs/C0_DISCOVERY_MINIMARKET_TEC_2026-01-14.md` y extraer:
   - Lista de activos identificados
   - Lista de restricciones
   - Lista de deuda técnica

2. **V2.2** Leer `docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md` sección "Consolidación del Alcance" y verificar:
   - Activos de C0 están cubiertos en scope
   - Restricciones de C0 están en "Restricciones operativas"
   - Deuda técnica de C0 está en sección 7 "Gaps"

3. **V2.3** Leer `docs/C0_RISK_REGISTER_MINIMARKET_TEC.md` y extraer riesgos R1-Rn.

4. **V2.4** Verificar que cada riesgo de C0 tiene mitigación en C1 sección 3 "Matriz RAID".

5. **V2.5** Cruzar Stakeholders (`docs/C0_STAKEHOLDERS_MINIMARKET_TEC.md`) con Owners en `docs/PLAN_WS_DETALLADO.md`.

**Criterio de Aceptación V2:**
- Cada riesgo C0 tiene entrada en RAID de C1
- Cada activo crítico tiene cobertura en al menos un WS
- Restricciones C0 reflejadas en C1
- Deuda técnica C0 → Gaps C1

**Acción:** Documentar discrepancias como hallazgos P1.

---

### FASE V3: COHERENCIA CAPA 1 INTERNA (45-60 min)

**Objetivo:** Verificar alineación entre MEGA_PLAN ↔ ROADMAP ↔ PLAN_WS_DETALLADO.

**Tareas:**
1. **V3.1** Extraer Etapas E1-E5 y Fases F1.1-F5.3 de `docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md`.

2. **V3.2** Extraer WS1-WS9 de `docs/ROADMAP.md` y verificar mapeo con E1-E5.

3. **V3.3** Verificar que cada tarea WSx.y en ROADMAP tiene detalle en `docs/PLAN_WS_DETALLADO.md`:
   ```bash
   # Contar WS en ROADMAP
   grep -oE "WS[0-9]+\.[0-9]+" docs/ROADMAP.md | sort -u
   
   # Contar detalle en PLAN_WS
   grep -oE "WS[0-9]+\.[0-9]+\.[0-9]+" docs/PLAN_WS_DETALLADO.md | sort -u
   ```

4. **V3.4** Verificar ADRs referenciados en C1 existen en DECISION_LOG:
   ```bash
   # ADRs en C1
   grep -oE "D-[0-9]{3}" docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md | sort -u
   
   # ADRs en DECISION_LOG
   grep -oE "D-[0-9]{3}" docs/DECISION_LOG.md | sort -u
   ```
   Comparar listas: todos los ADRs de C1 deben existir en DECISION_LOG.

5. **V3.5** Verificar prioridades P0-P3 consistentes:
   - Leer sección 5 "Matriz de Priorización" en C1
   - Cruzar con prioridades en ROADMAP (P0, P1 en cada WS)
   - No debe haber contradicciones (ej: WS marcado P0 en un doc y P2 en otro)

6. **V3.6** Verificar Checkpoints en C1 sección 9 alineados con estados en CHECKLIST_CIERRE.

7. **V3.7** Verificar dependencias declaradas en C1 sección 2 "Grafo de dependencias" son lógicas.

8. **V3.8** Verificar que bloqueadores externos (credenciales, D-011/D-012/D-015) están documentados consistentemente.

**Criterio de Aceptación V3:**
- 0 tareas en ROADMAP sin correspondencia en PLAN_WS_DETALLADO
- 0 ADRs referenciados en C1 sin existir en DECISION_LOG
- Prioridades sin contradicciones
- Dependencias lógicas verificadas

**Acción:** Documentar discrepancias. ADRs faltantes son hallazgos P0.

---

### FASE V4: COHERENCIA DOCS ↔ CÓDIGO REAL (45-60 min)

**Objetivo:** Verificar que la planificación refleja el estado real del código.

**Tareas:**
1. **V4.1** Verificar funciones Edge listadas existen:
   ```bash
   ls -la supabase/functions/
   ```
   Cruzar con lista en INVENTARIO_ACTUAL.md y PLAN_WS_DETALLADO.md.

2. **V4.2** Verificar estructura de tests:
   ```bash
   ls -la tests/unit/ tests/integration/ tests/e2e/
   ```
   Cruzar con CHECKLIST_CIERRE.md sección F4.

3. **V4.3** Verificar scripts referenciados existen:
   ```bash
   ls -la scripts/rls_audit.sql scripts/run-integration-tests.sh scripts/run-e2e-tests.sh
   ```

4. **V4.4** Verificar CI workflow:
   ```bash
   cat .github/workflows/ci.yml | head -100
   ```
   Cruzar con documentación en CHECKLIST_CIERRE.md sección F6.

5. **V4.5** Verificar `_shared/` modules existen:
   ```bash
   ls -la supabase/functions/_shared/
   ```
   Deben existir: `cors.ts`, `response.ts`, `errors.ts`, `logger.ts`, `rate-limit.ts`.

6. **V4.6** Verificar DECISION_LOG refleja estado real:
   - D-020 (Jest retirement) → Verificar `tests/package.json` no tiene Jest
   - D-004 (Vitest) → Verificar `vitest.config.ts` existe

7. **V4.7** Verificar ARCHITECTURE_DOCUMENTATION.md:
   - Leer sección "Stack" y cruzar con `package.json` y `minimarket-system/package.json`
   - Verificar que indica "ACTUALIZADO" (no "REFERENCIAL")

**Criterio de Aceptación V4:**
- 100% de archivos/funciones referenciados existen
- DECISION_LOG alineado con código real
- Arquitectura documental = arquitectura código

**Acción:** Documentar discrepancias como hallazgos P1.

---

### FASE V5: COMPLETITUD FRAMEWORK MPC (30 min)

**Objetivo:** Verificar que MPC v2.1 está correctamente aplicado.

**Tareas:**
1. **V5.1** Verificar MPC_INDEX.md lista todos los artefactos correctamente:
   - Capa 0: Todos los C0_* existen
   - Capa 1: C1_*, ROADMAP, PLAN_WS, DECISION_LOG existen
   - Capa 3: CHECKLIST_CIERRE existe
   - Capa 4: C4_* existen

2. **V5.2** Verificar nivel "Intermedio" aplicado correctamente:
   - C0 + C1 + C4 presentes (requerido)
   - C2 integrado en PLAN_WS_DETALLADO (permitido en nivel Intermedio)
   - C3 integrado en CHECKLIST_CIERRE (permitido)

3. **V5.3** Verificar templates TEC usados (no templates de otros dominios):
   - Buscar en C1 y PLAN_WS que usen terminología TEC (archivos, endpoints, módulos)
   - No deben aparecer términos de INF/EVT/CON/ORG fuera de contexto

4. **V5.4** Buscar placeholders sin resolver:
   ```bash
   grep -r "\[TODO\]" docs/*.md | head -20
   grep -r "\[PENDIENTE\]" docs/*.md | head -20
   grep -r "TBD" docs/*.md | head -20
   ```

**Criterio de Aceptación V5:**
- Framework MPC aplicado correctamente al dominio TEC
- Nivel Intermedio cumplido
- 0 placeholders [TODO] en docs P0

**Acción:** Placeholders en P0 son hallazgos P0.

---

### FASE V6: PULIDO FINAL Y CORRECCIONES (30-45 min)

**Objetivo:** Aplicar correcciones detectadas en V1-V5.

**Tareas:**
1. **V6.1** Revisar todos los hallazgos registrados y categorizarlos:
   - **P0 (Críticos):** Bloquean ejecución, corregir obligatoriamente
   - **P1 (Altos):** Corregir antes de iniciar ejecución
   - **P2 (Medios):** Corregir durante ejecución

2. **V6.2** Corregir hallazgos P0:
   - Crear archivos faltantes si es necesario
   - Agregar ADRs faltantes a DECISION_LOG
   - Resolver placeholders críticos

3. **V6.3** Corregir hallazgos P1:
   - Actualizar fechas inconsistentes
   - Alinear prioridades contradictorias
   - Agregar entradas faltantes en RAID

4. **V6.4** Actualizar `docs/CHECKLIST_CIERRE.md` con estado real verificado.

5. **V6.5** Re-ejecutar verificaciones clave post-corrección:
   ```bash
   # Re-verificar archivos
   ls -la docs/C0_*.md docs/C1_*.md docs/C4_*.md
   
   # Re-verificar ADRs
   grep -oE "D-[0-9]{3}" docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md | sort -u | wc -l
   grep -oE "D-[0-9]{3}" docs/DECISION_LOG.md | sort -u | wc -l
   ```

6. **V6.6** Generar reporte final de verificación (ver formato abajo).

**Criterio de Aceptación V6:**
- 100% hallazgos P0 resueltos
- ≥90% hallazgos P1 resueltos
- Segunda verificación sin nuevos P0

---

## FORMATO DE REPORTE FINAL

Al completar todas las fases, genera un reporte con esta estructura:

```markdown
# REPORTE DE VERIFICACIÓN DE PLANIFICACIÓN MPC

**Fecha:** 2026-01-15
**Ejecutor:** GitHub Copilot Agent
**Duración:** [X horas]

## Resumen Ejecutivo
- Fases completadas: V1 ✅/❌ | V2 ✅/❌ | V3 ✅/❌ | V4 ✅/❌ | V5 ✅/❌ | V6 ✅/❌
- Hallazgos totales: P0: X | P1: X | P2: X
- Hallazgos resueltos: X de Y (Z%)

## Estado Final
[PLANIFICACIÓN LISTA / CON RESERVAS / REQUIERE TRABAJO]

## Hallazgos por Categoría

### P0 - Críticos
| ID | Fase | Descripción | Corrección | Estado |
|----|------|-------------|------------|--------|
| H-001 | V1 | [descripción] | [acción] | ✅/❌ |

### P1 - Altos
| ID | Fase | Descripción | Corrección | Estado |
|----|------|-------------|------------|--------|
| H-101 | V2 | [descripción] | [acción] | ✅/❌ |

### P2 - Medios
| ID | Fase | Descripción | Corrección | Estado |
|----|------|-------------|------------|--------|
| H-201 | V4 | [descripción] | [acción] | ✅/❌ |

## Correcciones Aplicadas
1. [Archivo modificado]: [cambio realizado]
2. ...

## Verificación Final
- Archivos P0 existen: ✅/❌
- ADRs completos: ✅/❌
- Coherencia C0↔C1: ✅/❌
- Coherencia C1 interna: ✅/❌
- Docs↔Código: ✅/❌
- MPC aplicado: ✅/❌

## Siguiente Paso Recomendado
[Iniciar ejecución E1 / Completar correcciones X / etc.]
```

Guardar reporte en: `docs/REPORTE_VERIFICACION_MPC_2026-01-15.md`

---

## INSTRUCCIONES DE EJECUCIÓN

1. **Ejecutar fases en orden:** V1 → V2 → V3 → V4 → V5 → V6
2. **No saltar fases:** Cada fase depende de la anterior
3. **Documentar hallazgos inmediatamente:** No esperar al final
4. **Aplicar correcciones solo en V6:** No durante verificación
5. **Usar comandos bash provistos:** Para verificaciones automatizables
6. **Leer archivos completos:** Cuando sea necesario para contexto
7. **Ser riguroso:** Si hay duda, verificar más a fondo
8. **Reportar bloqueadores:** Si encuentras algo que impide continuar

---

## DEFINICIONES CLAVE

- **ADR:** Architecture Decision Record (formato D-XXX en DECISION_LOG)
- **WS:** Workstream (módulo de trabajo, ej: WS1 = Observabilidad)
- **E1-E5:** Etapas del Mega Plan (Fundación, Observabilidad, Datos, Producto, Cierre)
- **F1.1-F5.3:** Fases dentro de cada etapa
- **P0-P3:** Niveles de prioridad (P0 = crítico, P3 = bajo)
- **RAID:** Risks, Assumptions, Issues, Dependencies
- **RLS:** Row Level Security (PostgreSQL/Supabase)
- **Gating:** Condición que bloquea ejecución hasta cumplirse

---

## ARCHIVOS REFERENCIA ADICIONALES

Si necesitas más contexto durante la verificación:
- `docs/DOCUMENTACION_TECNICA_EXHAUSTIVA_SISTEMA_MINI_MARKET.md` - Stack técnico completo
- `docs/API_README.md` - Documentación de APIs
- `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` - Schema de BD
- `.github/copilot-instructions.md` - Instrucciones del proyecto

---

**INICIO DE EJECUCIÓN:** Comienza con FASE V1. Reporta progreso después de cada fase.
