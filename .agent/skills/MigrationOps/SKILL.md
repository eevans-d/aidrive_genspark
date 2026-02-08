---
name: MigrationOps
description: Gestion segura de migraciones SQL. Valida, aplica y rollback con verificacion pre/post.
role: CODEX->EXECUTOR
impact: 2-3
chain: [DocuGuard]
requires: [TestMaster]
---

# MigrationOps Skill

**ROL:** CODEX (fase A: validacion) + EXECUTOR (fase B-C: aplicacion).
**NIVEL DE IMPACTO:** 2-3 (siempre requiere rollback preparado).

## Reglas de Automatizacion

1. Validar SQL antes de aplicar (verificar tablas, nombres, sintaxis).
2. **SI local/staging:** Aplicar automaticamente con dry-run previo.
3. **SI production:** UNICO caso que requiere confirmacion.
4. Crear backup de estado previo automaticamente.
5. Verificar post-migracion con SELECT de validacion.

## Activacion

**Activar cuando:**
- Nuevo archivo en `supabase/migrations/`.
- Usuario pide "aplicar migraciones", "crear tabla", "nueva columna".
- CodeCraft genera tablas nuevas.

**NO activar cuando:**
- No hay archivos pendientes de migracion.
- Supabase CLI no disponible.
- `.env` faltante.

## Protocolo de Ejecucion

### FASE A: Pre-Flight Validation

1. **Listar migraciones:**
   ```bash
   ls -la supabase/migrations/
   ```
2. **Analizar SQL para riesgos:**
   ```bash
   grep -l "DROP" supabase/migrations/*.sql 2>/dev/null && echo "IMPACTO 3: DROP detectado"
   grep -l "ALTER TABLE.*DROP COLUMN" supabase/migrations/*.sql 2>/dev/null && echo "IMPACTO 3: DROP COLUMN"
   grep -l "CREATE TABLE" supabase/migrations/*.sql 2>/dev/null && echo "IMPACTO 2: CREATE TABLE"
   ```
3. **Verificar RLS en nuevas tablas:**
   ```bash
   for f in supabase/migrations/*.sql; do
     if grep -q "CREATE TABLE" "$f" && ! grep -q "ENABLE ROW LEVEL SECURITY" "$f"; then
       echo "WARNING: $f crea tabla sin RLS"
     fi
   done
   ```

### FASE B: Dry Run

1. **Ver estado actual:**
   ```bash
   supabase db diff --linked 2>/dev/null || echo "No linked project - verificar manualmente"
   ```
2. **Validar sintaxis SQL:** Revisar que no hay errores evidentes.

### FASE C: Execution

1. **Aplicar migracion:**
   ```bash
   supabase db push
   ```
2. **Verificar post-migracion:**
   - Confirmar tablas creadas.
   - Verificar indices.
   - Verificar RLS policies activas.
3. **Actualizar docs:**
   - Actualizar `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` con nuevas tablas/columnas.

## Rollback (Impacto >= 2)

1. Identificar migracion fallida.
2. Ejecutar migracion inversa (DOWN) si existe.
3. Si no hay DOWN: restaurar desde Supabase Dashboard.

## Quality Gates

- [ ] SQL valido sintacticamente.
- [ ] No hay DROP sin confirmacion explicita.
- [ ] RLS policies incluidas para nuevas tablas.
- [ ] Indices creados para columnas de busqueda.
- [ ] Post-verificacion exitosa.
- [ ] docs/ESQUEMA_BASE_DATOS_ACTUAL.md actualizado.

## Anti-Loop / Stop-Conditions

**SI supabase CLI no disponible:**
1. Documentar limitacion.
2. Generar SQL script para ejecucion manual.
3. Marcar sesion como PARCIAL.

**SI migracion falla por constraint:**
1. Analizar error.
2. Sugerir fix automatico si posible.
3. NO reintentar mas de 2 veces.

**NUNCA:** Aplicar DROP sin backup previo.
