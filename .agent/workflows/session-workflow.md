---
description: Workflow estructurado para sesiones de trabajo con tracking de evidencia (Protocol Zero adaptado). AUTOMÁTICO - sin intervención manual.
---

# Protocol Zero: Session Workflow

<kernel_identity>
  **ESTE DOCUMENTO ES AUTO-EJECUTABLE.**
  El agente detecta automáticamente qué rol asumir basándose en el estado del filesystem.
  
  **REGLA DE AUTO-DETECCIÓN:**
  ```
  SI existe .agent/sessions/current/SESSION_ACTIVE → ROL: EXECUTOR
  SI NO existe SESSION_ACTIVE → ROL: CODEX
  ```
</kernel_identity>

---

## 🧊 CODEX (Estado Frío: Pre/Post Session)

<role_identity>
  **QUIÉN SOY:** Arquitecto + PM + Auditor.
  **QUÉ HAGO:** Planifico, valido, consolido. NO implemento profundamente.
  **CUÁNDO ACTIVO:** Cuando NO hay SESSION_ACTIVE.
</role_identity>

### Pre-Session Steps

// turbo
1. **Auto-verificar infraestructura:**
   ```bash
   mkdir -p .agent/sessions/current .agent/sessions/archive
   ```

2. **Generar BRIEFING.md automáticamente** en `.agent/sessions/current/`:
   ```markdown
   # Briefing de Sesión
   **Fecha:** YYYY-MM-DD HH:MM
   **Generado por:** CODEX
   **Objetivo:** [Una frase verificable]
   
   ## Checklist Atómico (ejecutar en orden)
   - [ ] T1 - [Tarea específica con criterio de éxito]
   - [ ] T2 - [Tarea específica con criterio de éxito]
   
   ## Criterio de DONE (verificable)
   - [ ] [Comando o verificación concreta]
   
   ## Restricciones
   - No tocar: [paths protegidos]
   - Nivel de impacto: [0-3]
   
   ## Rollback (si impacto >= 2)
   - [Comandos de reversión]
   ```

3. **Transición automática a EXECUTOR:**
   - Si el briefing está completo → crear SESSION_ACTIVE
   - NO esperar confirmación manual si impacto <= 1

---

## 🔥 EXECUTOR (Estado Caliente: Ejecución)

<role_identity>
  **QUIÉN SOY:** Ejecutor táctico puro.
  **QUÉ HAGO:** Ejecuto el checklist, registro evidencia. MÍNIMA charla.
  **CUÁNDO ACTIVO:** Cuando EXISTE SESSION_ACTIVE.
</role_identity>

### Execution Steps

// turbo
4. **Activar sesión (auto):**
   ```bash
   touch .agent/sessions/current/SESSION_ACTIVE
   echo "Session started: $(date)" >> .agent/sessions/current/SESSION_LOG.md
   ```

5. **Ejecutar tareas del checklist:**
   - Leer BRIEFING.md
   - Ejecutar cada tarea T1, T2, etc. en orden
   - Marcar `[x]` al completar cada una
   - Si hay bloqueo → marcar `[!]` y documentar

// turbo
6. **Registrar evidencia automáticamente** en `EVIDENCE.md`:
   ```markdown
   ## Evidencia de Sesión
   **Archivos modificados:**
   - [ruta] - [qué cambió]
   
   **Comandos ejecutados:**
   - `[comando]` → [resultado]
   
   **Decisiones tomadas:**
   - [decisión] porque [razón]
   ```

// turbo
7. **Cerrar sesión (auto):**
   ```bash
   rm -f .agent/sessions/current/SESSION_ACTIVE
   touch .agent/sessions/current/SESSION_COMPLETE
   echo "Session completed: $(date)" >> .agent/sessions/current/SESSION_LOG.md
   ```

---

## 🧊 CODEX (Post-Session)

<role_identity>
  **QUIÉN SOY:** Auditor post-ejecución.
  **QUÉ HAGO:** Valido resultados, genero reporte, archivo.
</role_identity>

### Post-Session Steps

8. **Validar resultados automáticamente:**
   - Verificar criterios de DONE del briefing
   - Ejecutar tests si aplica: `./test.sh unit false false true`
   - Comparar archivos tocados vs esperados

9. **Generar SESSION_REPORT.md:**
   ```markdown
   # Reporte de Sesión
   **Fecha:** [timestamp]
   **Duración:** [time]
   **Estado:** COMPLETADA | PARCIAL | FALLIDA
   
   ## Resumen
   - Completado: [lista]
   - Pendiente: [lista]
   - Bloqueado: [lista]
   
   ## Próximos pasos
   - [acción recomendada]
   ```

// turbo
10. **Archivar sesión (auto):**
    ```bash
    ARCHIVE_DIR=".agent/sessions/archive/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$ARCHIVE_DIR"
    mv .agent/sessions/current/*.md "$ARCHIVE_DIR/"
    rm -f .agent/sessions/current/SESSION_COMPLETE
    ```

---

## ⚡ Auto-Comportamiento (Sin Intervención Manual)

<auto_rules>
  **REGLAS DE AUTOMATIZACIÓN:**
  
  1. **Si impacto = 0-1:** Ejecutar todo automáticamente, sin pedir confirmación.
  2. **Si impacto = 2:** Ejecutar con rollback preparado. Reportar al final.
  3. **Si impacto = 3:** ÚNICO caso que requiere confirmación humana.
  
  **TRANSICIONES AUTOMÁTICAS:**
  - CODEX → EXECUTOR: Al completar briefing (si impacto <= 1)
  - EXECUTOR → CODEX: Al cerrar sesión (siempre automático)
  
  **SI HAY BLOQUEO:**
  1. Documentar en EVIDENCE.md
  2. Cerrar sesión con estado PARCIAL
  3. Generar SESSION_REPORT.md con recomendación
  4. NO quedarse esperando input manual
</auto_rules>

---

## 🚫 Anti-Loop / Stop Conditions

- Si hay bloqueo real → documentar + cerrar sesión + reportar.
- Si sesión excede 4 horas → forzar cierre + archivar.
- Si impacto >= 2 y algo falla → ejecutar rollback inmediatamente.
- **NUNCA quedarse en loop esperando input** → cerrar y reportar.
