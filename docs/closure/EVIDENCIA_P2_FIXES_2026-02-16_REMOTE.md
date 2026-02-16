=============================================================
EVIDENCIA REMOTA P2 FIXES — precios_proveedor RLS + scraper CORS
Fecha: 2026-02-16
Entorno: REMOTO (proyecto dqaygmjpzoqjjrywdsxi)
Metodo: supabase db push + supabase functions deploy + Management API verification
=============================================================

=== 1. MIGRACION 20260216040000 APLICADA ===
Comando: supabase db push
Resultado: Applying migration 20260216040000_rls_precios_proveedor.sql... Finished.
supabase migration list --linked: 20260216040000 con timestamp remoto.
Veredicto: PASS

=== 2. precios_proveedor RLS STATUS ===
Query: SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'precios_proveedor'
Resultado: [{"tablename":"precios_proveedor","rowsecurity":true}]
Veredicto: PASS

=== 3. GRANTS anon/authenticated EN precios_proveedor ===
Resultado: [] (vacio — sin grants)
Veredicto: PASS

=== 4. GRANTS service_role EN precios_proveedor ===
Resultado: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
Veredicto: PASS

=== 5. TABLAS SIN RLS EN public ===
Resultado: [] (vacio — todas las tablas tienen RLS habilitado)
Veredicto: PASS

=== 6. scraper-maxiconsumo DEPLOY ===
Comando: supabase functions deploy scraper-maxiconsumo --project-ref dqaygmjpzoqjjrywdsxi
Resultado: Deployed Functions on project dqaygmjpzoqjjrywdsxi: scraper-maxiconsumo
Cambio: DEFAULT_CORS_HEADERS (con Access-Control-Allow-Origin: '*') reemplazado
  por SCRAPER_CORS_OVERRIDES (sin wildcard origin). Headers ahora se construyen
  exclusivamente desde validateOrigin() de _shared/cors.ts.
Veredicto: PASS

=============================================================
RESUMEN
=============================================================
  P2-1 (precios_proveedor RLS gap):    RESUELTO EN REMOTO
  P2-2 (scraper CORS wildcard):        RESUELTO EN REMOTO

  Migraciones: 41/41 local=remoto.
  Todas las tablas en public tienen RLS habilitado.
  scraper-maxiconsumo desplegado con fix CORS.
=============================================================
