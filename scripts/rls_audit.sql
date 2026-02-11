-- =============================================================================
-- RLS AUDIT SCRIPT - Sistema Mini Market
-- =============================================================================
-- Estado: ✅ LISTO PARA EJECUTAR
-- Fecha actualización: 2026-01-23
-- Proyecto: minimarket-system (dqaygmjpzoqjjrywdsxi)
-- 
-- Ejecutar:
--   Opción A: Dashboard SQL Editor
--     https://supabase.com/dashboard/project/dqaygmjpzoqjjrywdsxi/sql
--   
--   Opción B: psql
--     psql "$DATABASE_URL" -f scripts/rls_audit.sql > rls_audit_output.txt
--
-- Plan detallado: docs/PLAN_PENDIENTES_DEFINITIVO.md
-- =============================================================================

\echo '============================================================='
\echo 'AUDITORÍA RLS - Mini Market'
\echo 'Fecha: ' :DBNAME
\echo '============================================================='

\echo ''
\echo '=== 1. RLS STATUS POR TABLA ==='
\echo 'Muestra qué tablas tienen RLS habilitado'
\echo ''

SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rowsecurity DESC, tablename;

\echo ''
\echo '=== 2. POLÍTICAS RLS EXISTENTES ==='
\echo 'Detalle de políticas configuradas por tabla'
\echo ''

SELECT 
    tablename,
    policyname,
    CASE permissive WHEN 'PERMISSIVE' THEN 'PERMIT' ELSE 'RESTRICT' END as type,
    roles::text as applies_to,
    cmd as operation,
    LEFT(COALESCE(qual::text, '(all)'), 50) as using_clause
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo ''
\echo '=== 3. ⚠️ ALERTA: TABLAS SIN RLS HABILITADO ==='
\echo 'Estas tablas permiten acceso sin restricciones de fila'
\echo ''

SELECT 
    tablename as "❌ Tabla sin RLS"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false
ORDER BY tablename;

\echo ''
\echo '=== 4. ⚠️ ALERTA: TABLAS CON RLS PERO SIN POLÍTICAS ==='
\echo 'Estas tablas bloquean TODO acceso excepto service_role'
\echo ''

SELECT 
    t.tablename as "🔒 Tabla bloqueada (sin políticas)"
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0
ORDER BY t.tablename;

\echo ''
\echo '=== 5. FUNCIONES SECURITY DEFINER ==='
\echo 'Funciones que ejecutan con permisos elevados'
\echo ''

SELECT 
    proname as function_name,
    CASE WHEN proconfig IS NOT NULL 
         THEN array_to_string(proconfig, ', ')
         ELSE '⚠️ SIN search_path (riesgo)' 
    END as security_config
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
  AND prosecdef = true
ORDER BY proname;

\echo ''
\echo '=== 6. RESUMEN DE PERMISOS POR ROL ==='
\echo ''

SELECT 
    grantee,
    table_name,
    string_agg(privilege_type, ', ' ORDER BY privilege_type) as permissions
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

\echo ''
\echo '=== 7. TABLAS CRÍTICAS P0 - VERIFICACIÓN ESPECIAL ==='
\echo ''

SELECT 
    t.tablename,
    CASE WHEN t.rowsecurity THEN '✅' ELSE '❌' END as rls,
    COUNT(p.policyname) as num_policies,
    CASE 
        WHEN NOT t.rowsecurity THEN '⚠️ CRÍTICO: Sin RLS'
        WHEN COUNT(p.policyname) = 0 THEN '🔒 Bloqueada (service_role only)'
        ELSE '✅ Protegida'
    END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'productos',
    'stock_deposito', 
    'movimientos_deposito',
    'precios_historicos',
    'proveedores',
    'personal',
    'categorias'
  )
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.rowsecurity, t.tablename;

\echo ''
\echo '============================================================='
\echo 'AUDITORÍA COMPLETADA'
\echo ''
\echo 'Próximos pasos:'
\echo '1. Revisar tablas marcadas con ❌ o ⚠️'
\echo '2. Crear políticas RLS para tablas P0 sin protección'
\echo '3. Verificar funciones sin search_path'
\echo '4. Guardar este output en docs/evidencias/'
\echo '============================================================='
