---
name: MigrationOps
description: Gestión segura de migraciones SQL. Valida, aplica y rollback de cambios de base de datos con verificación pre/post.
---

# MigrationOps Skill (SQL Migration Handler)

<kernel_identity>
  **ROL EN PROTOCOL ZERO:** Este skill opera en modo **CODEX** (validación) + **EXECUTOR** (aplicación).
  - FASE A: CODEX (valida migración, analiza riesgos)
  - FASE B-C: EXECUTOR (aplica migración, verifica)
  **NIVEL DE IMPACTO:** 2-3 (siempre requiere rollback preparado).
</kernel_identity>

<auto_execution>
  **REGLAS DE AUTOMATIZACIÓN:**
  1. Validar SQL antes de aplicar (verificar tablas existentes, nombres).
  2. **SI local/staging:** Aplicar automáticamente con dry-run previo.
  3. **SI production:** ÚNICO caso que requiere confirmación.
  4. Crear backup de estado previo automáticamente.
  5. Verificar post-migración con SELECT de validación.
</auto_execution>

<objective>
  Gestionar el ciclo de vida de migraciones SQL de forma segura.
  **Protocolo:** "Cambio Reversible Siempre".
</objective>

## 1. Configuración
**⚠️ OBLIGATORIO:** Lee `.agent/skills/project_config.yaml`.

## 2. Criterios de Activación
<activation_rules>
  <enable_if>
    - Nuevo archivo en `supabase/migrations/`
    - Usuario pide "aplicar migraciones" o "crear tabla"
    - Usuario pide "crear columna" o "modificar esquema"
  </enable_if>
  <disable_if>
    - No hay archivos pendientes de migración
    - Supabase CLI no disponible
    - Entorno no configurado (.env faltante)
  </disable_if>
</activation_rules>

## 3. Protocolo de Ejecución

### FASE A: Pre-Flight Validation
<step>
  1. **Listar migraciones pendientes:**
     ```bash
     supabase db migrations list
     ```
  2. **Analizar SQL para riesgos:**
     - Buscar `DROP` → **Impacto 3**
     - Buscar `ALTER TABLE ... DROP COLUMN` → **Impacto 3**
     - Buscar `CREATE TABLE` → **Impacto 2**
     - Solo `INSERT/SELECT` → **Impacto 1**
</step>

### FASE B: Dry Run (Staging)
<step>
  1. **Verificar estado actual:**
     ```bash
     supabase db diff --linked
     ```
  2. **Aplicar con flag de prueba (si disponible):**
     - Revisar que el SQL es válido syntácticamente
     - Verificar que no hay conflictos con datos existentes
</step>

### FASE C: Execution
<step>
  1. **Aplicar migración:**
     ```bash
     supabase db push
     ```
  2. **Verificar post-migración:**
     - Ejecutar SELECT en nuevas tablas
     - Confirmar índices creados
     - Verificar RLS policies activas
</step>

## 4. Rollback (Impacto >= 2)
<instruction>
  Si la migración falla o hay error post-aplicación:
</instruction>

1. **Identificar migración fallida:**
   ```bash
   supabase db migrations list
   ```
2. **Ejecutar DOWN si existe:** (migración inversa)
3. **Si no hay DOWN:** Restaurar desde backup manual (Supabase Dashboard)

## 5. Quality Gates
<checklist>
  <item>SQL válido sintácticamente.</item>
  <item>No hay DROP sin confirmación.</item>
  <item>RLS policies incluidas para nuevas tablas.</item>
  <item>Indices creados para columnas de búsqueda.</item>
  <item>Post-verificación SELECT exitosa.</item>
</checklist>

## 6. Anti-Loop / Stop-Conditions
<fallback_behavior>
  **SI supabase CLI no disponible:**
  1. Documentar limitación
  2. Generar SQL script para ejecución manual
  3. Marcar sesión como PARCIAL
  
  **SI migración falla por constraint:**
  1. Analizar error
  2. Sugerir fix automático si es posible
  3. Documentar en EVIDENCE.md
  4. NO reintentar más de 2 veces
  
  **SI impacto=3 (producción):**
  1. Solicitar confirmación humana
  2. Preparar rollback explícito
  3. Documnetar en SESSION_REPORT
  
  **NUNCA:** Aplicar DROP sin backup previo
</fallback_behavior>
