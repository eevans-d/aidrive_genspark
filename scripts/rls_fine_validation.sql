-- =============================================================================
-- RLS FINE VALIDATION SCRIPT - Mini Market System
-- =============================================================================
-- Objetivo:
-- - Validar allow/deny real por rol sobre tablas/vistas nuevas (P1) sin ambigüedad.
-- - Detectar bypass por PostgREST/RPC antes de producción.
--
-- Importante:
-- - Ejecuta en una transacción y hace ROLLBACK al final (no deja datos),
--   pero algunas operaciones pueden avanzar secuencias si usan defaults.
-- - Para habilitar pruebas de ESCRITURA (INSERT/UPDATE/DELETE/RPC), ejecutar:
--     select set_config('rls_fine.write_tests', '1', true);
--
-- Ejecución:
-- - SQL Editor (Supabase Dashboard) o:
--     psql "$DATABASE_URL" -f scripts/rls_fine_validation.sql
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0) Config
-- -----------------------------------------------------------------------------
-- default: read-only. Enable writes with:
--   select set_config('rls_fine.write_tests', '1', true);
do $$
begin
  perform set_config('rls_fine.write_tests', coalesce(current_setting('rls_fine.write_tests', true), '0'), true);
end;
$$;

create temp table temp_results (
  scenario_id text not null,
  actor text not null,
  operation text not null,
  object text not null,
  expected text not null,
  actual text not null,
  pass boolean not null,
  notes text
);

create temp table temp_ids (
  key text primary key,
  id uuid not null
);

-- Permitir que el rol `authenticated` lea/escriba temp tables creadas por postgres/owner.
grant all on table temp_results to authenticated;
grant all on table temp_ids to authenticated;

-- -----------------------------------------------------------------------------
-- 1) Test identities (UUIDs fijos, no requieren existir en auth.users)
-- -----------------------------------------------------------------------------
-- Roles canónicos:
-- - admin
-- - deposito
-- - ventas
-- - usuario (sin fila personal)
--
-- Se crean filas en public.personal para admin/deposito/ventas.
with ins as (
  insert into public.personal (user_auth_id, nombre, email, rol, activo)
  values
    ('11111111-1111-1111-1111-111111111111'::uuid, 'RLS TEST ADMIN', 'rls-test-admin@example.local', 'admin', true),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'RLS TEST DEPOSITO', 'rls-test-deposito@example.local', 'deposito', true),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'RLS TEST VENTAS', 'rls-test-ventas@example.local', 'ventas', true)
  returning user_auth_id
)
select count(*) from ins;

-- Seed mínimo para SELECT tests (evitar nextval: numero_pedido explícito)
with c as (
  insert into public.clientes (nombre, telefono, email, activo)
  values ('__RLS_TEST_CLIENTE__', null, null, true)
  returning id
)
insert into temp_ids(key, id)
select 'cliente', id from c;

-- Delete targets (uno por actor) para evitar interacciones entre escenarios
with c as (
  insert into public.clientes (nombre, activo)
  values
    ('__RLS_TEST_CLIENTE_DEL__ admin', true),
    ('__RLS_TEST_CLIENTE_DEL__ deposito', true),
    ('__RLS_TEST_CLIENTE_DEL__ ventas', true),
    ('__RLS_TEST_CLIENTE_DEL__ usuario', true)
  returning id, nombre
)
insert into temp_ids(key, id)
select
  case
    when nombre like '% admin' then 'cliente_del_admin'
    when nombre like '% deposito' then 'cliente_del_deposito'
    when nombre like '% ventas' then 'cliente_del_ventas'
    when nombre like '% usuario' then 'cliente_del_usuario'
  end,
  id
from c;

with p as (
  insert into public.pedidos (numero_pedido, cliente_nombre, tipo_entrega, estado, estado_pago, monto_total, monto_pagado)
  values (987654321, '__RLS_TEST_PEDIDO__', 'retiro', 'pendiente', 'pendiente', 0, 0)
  returning id
)
insert into temp_ids(key, id)
select 'pedido', id from p;

with p as (
  insert into public.pedidos (numero_pedido, cliente_nombre, tipo_entrega, estado, estado_pago, monto_total, monto_pagado)
  values
    (987654330, '__RLS_TEST_PEDIDO_DEL__ admin', 'retiro', 'pendiente', 'pendiente', 0, 0),
    (987654331, '__RLS_TEST_PEDIDO_DEL__ deposito', 'retiro', 'pendiente', 'pendiente', 0, 0),
    (987654332, '__RLS_TEST_PEDIDO_DEL__ ventas', 'retiro', 'pendiente', 'pendiente', 0, 0),
    (987654333, '__RLS_TEST_PEDIDO_DEL__ usuario', 'retiro', 'pendiente', 'pendiente', 0, 0)
  returning id, cliente_nombre
)
insert into temp_ids(key, id)
select
  case
    when cliente_nombre like '% admin' then 'pedido_del_admin'
    when cliente_nombre like '% deposito' then 'pedido_del_deposito'
    when cliente_nombre like '% ventas' then 'pedido_del_ventas'
    when cliente_nombre like '% usuario' then 'pedido_del_usuario'
  end,
  id
from p;

with d as (
  insert into public.detalle_pedidos (pedido_id, producto_nombre, cantidad, precio_unitario, observaciones)
  select (select id from temp_ids where key = 'pedido'), '__RLS_TEST_ITEM__', 1, 1.00, null
  returning id
)
insert into temp_ids(key, id)
select 'detalle_pedidos', id from d;

with d as (
  insert into public.detalle_pedidos (pedido_id, producto_nombre, cantidad, precio_unitario)
  select (select id from temp_ids where key = 'pedido'), '__RLS_TEST_ITEM_DEL__ admin', 1, 1.00
  union all
  select (select id from temp_ids where key = 'pedido'), '__RLS_TEST_ITEM_DEL__ deposito', 1, 1.00
  union all
  select (select id from temp_ids where key = 'pedido'), '__RLS_TEST_ITEM_DEL__ ventas', 1, 1.00
  union all
  select (select id from temp_ids where key = 'pedido'), '__RLS_TEST_ITEM_DEL__ usuario', 1, 1.00
  returning id, producto_nombre
)
insert into temp_ids(key, id)
select
  case
    when producto_nombre like '% admin' then 'detalle_del_admin'
    when producto_nombre like '% deposito' then 'detalle_del_deposito'
    when producto_nombre like '% ventas' then 'detalle_del_ventas'
    when producto_nombre like '% usuario' then 'detalle_del_usuario'
  end,
  id
from d;

-- -----------------------------------------------------------------------------
-- 2) Switch to authenticated role + set JWT claims.
-- -----------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

-- -----------------------------------------------------------------------------
-- 3) Ejecutar escenarios por actor
-- -----------------------------------------------------------------------------
do $$
declare
  write_enabled boolean := coalesce(current_setting('rls_fine.write_tests', true), '0') = '1';
  actor_rec record;
  v_count int;
  v_rowcount int;
  v_json jsonb;
  v_pass boolean;
  v_expected_allow boolean;
  v_actual_allow boolean;
  v_note text;
  v_cliente_id uuid := (select id from temp_ids where key = 'cliente');
  v_cliente_del_id uuid;
  v_pedido_id uuid := (select id from temp_ids where key = 'pedido');
  v_pedido_del_id uuid;
  v_detalle_id uuid := (select id from temp_ids where key = 'detalle_pedidos');
  v_detalle_del_id uuid;
begin
  for actor_rec in
    select * from (values
      ('admin',    '11111111-1111-1111-1111-111111111111'::uuid),
      ('deposito', '22222222-2222-2222-2222-222222222222'::uuid),
      ('ventas',   '33333333-3333-3333-3333-333333333333'::uuid),
      ('usuario',  '44444444-4444-4444-4444-444444444444'::uuid)
    ) as t(actor, user_id)
  loop
    perform set_config('request.jwt.claim.sub', actor_rec.user_id::text, true);
    v_cliente_del_id := (select id from temp_ids where key = 'cliente_del_' || actor_rec.actor);
    v_pedido_del_id := (select id from temp_ids where key = 'pedido_del_' || actor_rec.actor);
    v_detalle_del_id := (select id from temp_ids where key = 'detalle_del_' || actor_rec.actor);

    -- -----------------------------------------------------------------------
    -- PERSONAL: select self
    -- -----------------------------------------------------------------------
    select count(*) into v_count
    from public.personal
    where user_auth_id = actor_rec.user_id;
    v_expected_allow := actor_rec.actor in ('admin', 'deposito', 'ventas');
    v_actual_allow := v_count = 1;
    insert into temp_results
    values (
      'personal_select_self',
      actor_rec.actor,
      'SELECT',
      'public.personal',
      case when v_expected_allow then 'ALLOW (1 row)' else 'DENY (0 rows)' end,
      case when v_actual_allow then 'ALLOW (1 row)' else format('DENY (%s rows)', v_count) end,
      v_expected_allow = v_actual_allow,
      null
    );

    -- -----------------------------------------------------------------------
    -- CLIENTES: select base
    -- -----------------------------------------------------------------------
    select count(*) into v_count
    from public.clientes
    where id = v_cliente_id;
    v_expected_allow := actor_rec.actor in ('admin', 'ventas');
    v_actual_allow := v_count = 1;
    insert into temp_results
    values (
      'clientes_select_base',
      actor_rec.actor,
      'SELECT',
      'public.clientes',
      case when v_expected_allow then 'ALLOW (1 row)' else 'DENY (0 rows)' end,
      case when v_actual_allow then 'ALLOW (1 row)' else format('DENY (%s rows)', v_count) end,
      v_expected_allow = v_actual_allow,
      null
    );

    -- -----------------------------------------------------------------------
    -- PEDIDOS: select base
    -- -----------------------------------------------------------------------
    select count(*) into v_count
    from public.pedidos
    where id = v_pedido_id;
    v_expected_allow := actor_rec.actor in ('admin', 'deposito', 'ventas');
    v_actual_allow := v_count = 1;
    insert into temp_results
    values (
      'pedidos_select_staff',
      actor_rec.actor,
      'SELECT',
      'public.pedidos',
      case when v_expected_allow then 'ALLOW (1 row)' else 'DENY (0 rows)' end,
      case when v_actual_allow then 'ALLOW (1 row)' else format('DENY (%s rows)', v_count) end,
      v_expected_allow = v_actual_allow,
      null
    );

    -- -----------------------------------------------------------------------
    -- DETALLE_PEDIDOS: select base
    -- -----------------------------------------------------------------------
    select count(*) into v_count
    from public.detalle_pedidos
    where id = v_detalle_id;
    v_expected_allow := actor_rec.actor in ('admin', 'deposito', 'ventas');
    v_actual_allow := v_count = 1;
    insert into temp_results
    values (
      'detalle_pedidos_select_staff',
      actor_rec.actor,
      'SELECT',
      'public.detalle_pedidos',
      case when v_expected_allow then 'ALLOW (1 row)' else 'DENY (0 rows)' end,
      case when v_actual_allow then 'ALLOW (1 row)' else format('DENY (%s rows)', v_count) end,
      v_expected_allow = v_actual_allow,
      null
    );

    -- -----------------------------------------------------------------------
    -- VIEWS (CC): security_invoker must enforce clientes RLS
    -- -----------------------------------------------------------------------
    select count(*) into v_count
    from public.vista_cc_saldos_por_cliente
    where cliente_id = v_cliente_id;
    v_expected_allow := actor_rec.actor in ('admin', 'ventas');
    v_actual_allow := v_count = 1;
    insert into temp_results
    values (
      'vista_cc_saldos_por_cliente_select',
      actor_rec.actor,
      'SELECT',
      'public.vista_cc_saldos_por_cliente',
      case when v_expected_allow then 'ALLOW (1 row)' else 'DENY (0 rows)' end,
      case when v_actual_allow then 'ALLOW (1 row)' else format('DENY (%s rows)', v_count) end,
      v_expected_allow = v_actual_allow,
      null
    );

    if not write_enabled then
      continue;
    end if;

    -- -----------------------------------------------------------------------
    -- WRITE TESTS: CLIENTES insert/update/delete
    -- -----------------------------------------------------------------------
    v_note := null;
    begin
      insert into public.clientes (nombre, activo)
      values ('__RLS_TEST_CLIENTE_INS__ ' || actor_rec.actor, true);
      v_actual_allow := true;
    exception when others then
      v_actual_allow := false;
      v_note := sqlerrm;
    end;
    v_expected_allow := actor_rec.actor in ('admin', 'ventas');
    insert into temp_results
    values (
      'clientes_insert',
      actor_rec.actor,
      'INSERT',
      'public.clientes',
      case when v_expected_allow then 'ALLOW' else 'DENY' end,
      case when v_actual_allow then 'ALLOW' else 'DENY' end,
      v_expected_allow = v_actual_allow,
      v_note
    );

    v_note := null;
    v_rowcount := 0;
    begin
      update public.clientes
      set telefono = '__RLS_UPD__'
      where id = v_cliente_id;
      get diagnostics v_rowcount = row_count;
      v_actual_allow := v_rowcount = 1;
    exception when others then
      v_actual_allow := false;
      v_note := sqlerrm;
    end;
    v_expected_allow := actor_rec.actor in ('admin', 'ventas');
    insert into temp_results
    values (
      'clientes_update',
      actor_rec.actor,
      'UPDATE',
      'public.clientes',
      case when v_expected_allow then 'ALLOW (rowcount=1)' else 'DENY (rowcount=0)' end,
      case when v_actual_allow then 'ALLOW (rowcount=1)' else format('DENY (rowcount=%s)', v_rowcount) end,
      v_expected_allow = v_actual_allow,
      v_note
    );

    v_note := null;
    v_rowcount := 0;
    begin
      delete from public.clientes where id = v_cliente_del_id;
      get diagnostics v_rowcount = row_count;
      v_actual_allow := v_rowcount = 1;
    exception when others then
      v_actual_allow := false;
      v_note := sqlerrm;
    end;
    v_expected_allow := actor_rec.actor = 'admin';
    insert into temp_results
    values (
      'clientes_delete',
      actor_rec.actor,
      'DELETE',
      'public.clientes',
      case when v_expected_allow then 'ALLOW (rowcount=1)' else 'DENY (rowcount=0)' end,
      case when v_actual_allow then 'ALLOW (rowcount=1)' else format('DENY (rowcount=%s)', v_rowcount) end,
      v_expected_allow = v_actual_allow,
      v_note
    );

    -- -----------------------------------------------------------------------
    -- WRITE TESTS: PEDIDOS insert/update/delete (numero_pedido explícito)
    -- -----------------------------------------------------------------------
    v_note := null;
    begin
      insert into public.pedidos (numero_pedido, cliente_nombre, tipo_entrega, estado, estado_pago, monto_total, monto_pagado)
      values (987654322, '__RLS_TEST_PEDIDO_INS__ ' || actor_rec.actor, 'retiro', 'pendiente', 'pendiente', 0, 0);
      v_actual_allow := true;
    exception when others then
      v_actual_allow := false;
      v_note := sqlerrm;
    end;
    v_expected_allow := actor_rec.actor in ('admin', 'deposito', 'ventas');
    insert into temp_results
    values (
      'pedidos_insert',
      actor_rec.actor,
      'INSERT',
      'public.pedidos',
      case when v_expected_allow then 'ALLOW' else 'DENY' end,
      case when v_actual_allow then 'ALLOW' else 'DENY' end,
      v_expected_allow = v_actual_allow,
      v_note
    );

    v_note := null;
    v_rowcount := 0;
    begin
      update public.pedidos set estado = 'preparando' where id = v_pedido_id;
      get diagnostics v_rowcount = row_count;
      v_actual_allow := v_rowcount = 1;
    exception when others then
      v_actual_allow := false;
      v_note := sqlerrm;
    end;
    v_expected_allow := actor_rec.actor in ('admin', 'deposito', 'ventas');
    insert into temp_results
    values (
      'pedidos_update',
      actor_rec.actor,
      'UPDATE',
      'public.pedidos',
      case when v_expected_allow then 'ALLOW (rowcount=1)' else 'DENY (rowcount=0)' end,
      case when v_actual_allow then 'ALLOW (rowcount=1)' else format('DENY (rowcount=%s)', v_rowcount) end,
      v_expected_allow = v_actual_allow,
      v_note
    );

    v_note := null;
    v_rowcount := 0;
    begin
      delete from public.pedidos where id = v_pedido_del_id;
      get diagnostics v_rowcount = row_count;
      v_actual_allow := v_rowcount = 1;
    exception when others then
      v_actual_allow := false;
      v_note := sqlerrm;
    end;
    v_expected_allow := actor_rec.actor = 'admin';
    insert into temp_results
    values (
      'pedidos_delete',
      actor_rec.actor,
      'DELETE',
      'public.pedidos',
      case when v_expected_allow then 'ALLOW (rowcount=1)' else 'DENY (rowcount=0)' end,
      case when v_actual_allow then 'ALLOW (rowcount=1)' else format('DENY (rowcount=%s)', v_rowcount) end,
      v_expected_allow = v_actual_allow,
      v_note
    );

    -- -----------------------------------------------------------------------
    -- WRITE TESTS: DETALLE_PEDIDOS insert/update/delete
    -- -----------------------------------------------------------------------
    v_note := null;
    begin
      insert into public.detalle_pedidos (pedido_id, producto_nombre, cantidad, precio_unitario)
      values (v_pedido_id, '__RLS_TEST_ITEM_INS__ ' || actor_rec.actor, 1, 1.00);
      v_actual_allow := true;
    exception when others then
      v_actual_allow := false;
      v_note := sqlerrm;
    end;
    v_expected_allow := actor_rec.actor in ('admin', 'deposito', 'ventas');
    insert into temp_results
    values (
      'detalle_pedidos_insert',
      actor_rec.actor,
      'INSERT',
      'public.detalle_pedidos',
      case when v_expected_allow then 'ALLOW' else 'DENY' end,
      case when v_actual_allow then 'ALLOW' else 'DENY' end,
      v_expected_allow = v_actual_allow,
      v_note
    );

    v_note := null;
    v_rowcount := 0;
    begin
      update public.detalle_pedidos set preparado = true where id = v_detalle_id;
      get diagnostics v_rowcount = row_count;
      v_actual_allow := v_rowcount = 1;
    exception when others then
      v_actual_allow := false;
      v_note := sqlerrm;
    end;
    v_expected_allow := actor_rec.actor in ('admin', 'deposito', 'ventas');
    insert into temp_results
    values (
      'detalle_pedidos_update',
      actor_rec.actor,
      'UPDATE',
      'public.detalle_pedidos',
      case when v_expected_allow then 'ALLOW (rowcount=1)' else 'DENY (rowcount=0)' end,
      case when v_actual_allow then 'ALLOW (rowcount=1)' else format('DENY (rowcount=%s)', v_rowcount) end,
      v_expected_allow = v_actual_allow,
      v_note
    );

    v_note := null;
    v_rowcount := 0;
    begin
      delete from public.detalle_pedidos where id = v_detalle_del_id;
      get diagnostics v_rowcount = row_count;
      v_actual_allow := v_rowcount = 1;
    exception when others then
      v_actual_allow := false;
      v_note := sqlerrm;
    end;
    v_expected_allow := actor_rec.actor = 'admin';
    insert into temp_results
    values (
      'detalle_pedidos_delete',
      actor_rec.actor,
      'DELETE',
      'public.detalle_pedidos',
      case when v_expected_allow then 'ALLOW (rowcount=1)' else 'DENY (rowcount=0)' end,
      case when v_actual_allow then 'ALLOW (rowcount=1)' else format('DENY (rowcount=%s)', v_rowcount) end,
      v_expected_allow = v_actual_allow,
      v_note
    );

    -- -----------------------------------------------------------------------
    -- WRITE TESTS: RPC sp_crear_pedido
    -- Nota: ejecutarla en modo ALLOW genera inserts y puede avanzar secuencias.
    -- -----------------------------------------------------------------------
    v_note := null;
    v_expected_allow := actor_rec.actor in ('admin', 'deposito', 'ventas');
    begin
      v_json := public.sp_crear_pedido(
        '__RLS_TEST_RPC__ ' || actor_rec.actor,
        'retiro',
        null, null, null, null, null,
        null,
        null,
        null,
        '[]'::jsonb
      );
      v_note := coalesce(v_json->>'error', null);

      -- Esta prueba valida que el guard de rol funciona (FORBIDDEN),
      -- no que la inserción sea exitosa (puede fallar por FK a auth.users en entornos sin usuarios reales).
      if v_expected_allow then
        v_pass := coalesce(v_json->>'error', '') <> 'FORBIDDEN';
      else
        v_pass := coalesce(v_json->>'error', '') = 'FORBIDDEN';
      end if;
    exception when others then
      v_pass := false;
      v_note := sqlerrm;
    end;
    insert into temp_results
    values (
      'sp_crear_pedido_exec',
      actor_rec.actor,
      'EXECUTE',
      'public.sp_crear_pedido',
      case when v_expected_allow then 'ALLOW (error!=FORBIDDEN)' else 'DENY (error=FORBIDDEN)' end,
      case
        when v_pass then case when v_expected_allow then 'ALLOW (not FORBIDDEN)' else 'DENY (FORBIDDEN)' end
        else 'FAIL (see notes)'
      end,
      v_pass,
      v_note
    );
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- 4) Output: Summary + failing scenarios
-- -----------------------------------------------------------------------------
select
  count(*) as total,
  sum(case when pass then 1 else 0 end) as passed,
  sum(case when not pass then 1 else 0 end) as failed
from temp_results;

select *
from temp_results
where not pass
order by actor, scenario_id, operation;

rollback;
