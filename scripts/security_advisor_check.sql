-- Security Advisor RLS check (critical tables)

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'personal',
    'notificaciones_tareas',
    'productos_faltantes',
    'precios_historicos',
    'movimientos_deposito',
    'stock_deposito'
  )
ORDER BY tablename;

SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'personal',
    'notificaciones_tareas',
    'productos_faltantes',
    'precios_historicos',
    'movimientos_deposito',
    'stock_deposito'
  )
ORDER BY tablename, policyname;
