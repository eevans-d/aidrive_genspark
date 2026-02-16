=============================================================
EVIDENCIA REMOTA POST-FIX P0 SEGURIDAD — RLS + search_path
Fecha: 2026-02-15
Entorno: REMOTO (proyecto dqaygmjpzoqjjrywdsxi, region us-east-1)
Metodo: Supabase Management API (POST /v1/projects/{ref}/database/query)
Migracion aplicada: 20260215100000_p0_rls_internal_tables_and_search_path.sql
=============================================================

=== 1. RLS STATUS — TABLAS P0 ===
Resultado:
  circuit_breaker_state: ENABLED
  cron_jobs_locks:       ENABLED
  rate_limit_state:      ENABLED

Esperado: ENABLED en las 3 tablas.
Veredicto: PASS

=== 2. GRANTS a anon/authenticated EN TABLAS P0 ===
Resultado: [] (vacio — sin grants)

Esperado: sin grants para anon ni authenticated.
Veredicto: PASS

=== 3. GRANTS a service_role EN TABLAS P0 ===
Resultado:
  circuit_breaker_state: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  cron_jobs_locks:       DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  rate_limit_state:      DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

Esperado: service_role retiene acceso completo.
Veredicto: PASS

=== 4. sp_aplicar_precio SEARCH_PATH ===
Resultado:
  sp_aplicar_precio: search_path=public

Esperado: search_path=public
Veredicto: PASS

=== 5. TODAS LAS FUNCIONES SECURITY DEFINER ===
Resultado (20 funciones, todas con search_path=public):
  fn_actualizar_monto_pedido:             search_path=public
  fn_dashboard_metrics:                   search_path=public
  fn_refresh_stock_views:                 search_path=public
  fnc_deteccion_cambios_significativos:   search_path=public
  fnc_limpiar_datos_antiguos:             search_path=public
  refresh_tareas_metricas:                search_path=public
  sp_acquire_job_lock:                    search_path=public
  sp_aplicar_oferta_stock:                search_path=public
  sp_aplicar_precio:                      search_path=public
  sp_check_rate_limit:                    search_path=public
  sp_circuit_breaker_check:               search_path=public
  sp_circuit_breaker_record:              search_path=public
  sp_cleanup_rate_limit_state:            search_path=public
  sp_crear_pedido:                        search_path=public
  sp_desactivar_oferta_stock:             search_path=public
  sp_procesar_venta_pos:                  search_path=public
  sp_registrar_pago_cc:                   search_path=public
  sp_release_job_lock:                    search_path=public
  sp_reservar_stock:                      search_path=public
  trg_clientes_limite_credito_only_admin: search_path=public

Funciones SIN search_path: 0
Veredicto: PASS

=== 6. TABLAS SIN RLS EN public (DEBERIA ESTAR VACIO) ===
Resultado: [] (vacio — todas las tablas tienen RLS habilitado)
Veredicto: PASS

=============================================================
RESUMEN FINAL
=============================================================
  P0-1 (RLS deshabilitado en tablas internas): RESUELTO EN REMOTO
  P0-2 (sp_aplicar_precio sin search_path):    RESUELTO EN REMOTO

  Todas las 20 funciones SECURITY DEFINER tienen search_path=public.
  Todas las tablas en public tienen RLS habilitado.
  anon/authenticated no tienen grants en tablas internas.

  Migracion: supabase/migrations/20260215100000_p0_rls_internal_tables_and_search_path.sql
  Registrada en remoto: supabase migration list --linked muestra 20260215100000 con timestamp remoto.
=============================================================
