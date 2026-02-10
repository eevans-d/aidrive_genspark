-- =============================================================================
-- RLS AUDIT SCRIPT - Mini Market
-- Ejecutar con service_role o psql directo.
--
-- Fuente: docs/AUDITORIA_RLS_CHECKLIST.md (sección "Script de Auditoría Completo").
-- =============================================================================

\echo '=== 1. RLS Status por Tabla ==='
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rls_enabled DESC, tablename;

\echo ''
\echo '=== 2. Políticas RLS Existentes ==='
SELECT
  tablename,
  policyname,
  roles::text,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo ''
\echo '=== 3. ALERTA: Tablas SIN RLS ==='
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

\echo ''
\echo '=== 4. ALERTA: Tablas con RLS pero SIN Políticas ==='
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p
  ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0
ORDER BY t.tablename;

\echo ''
\echo '=== 5. Funciones SECURITY DEFINER ==='
SELECT
  proname AS function_name,
  COALESCE(proconfig::text, '(sin config)') AS config
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND prosecdef = true
ORDER BY proname;

\echo ''
\echo '=== Auditoría completada ==='

