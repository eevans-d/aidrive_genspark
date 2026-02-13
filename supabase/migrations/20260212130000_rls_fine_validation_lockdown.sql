-- ============================================================================
-- Migración: RLS Fine Validation + Role Alignment Lockdown
-- Fecha: 2026-02-12
-- Objetivo:
-- 1) Normalizar roles legacy (jefe/administrador/vendedor/depósito) -> roles canónicos.
-- 2) Endurecer public.personal: unique user_auth_id + RLS self-select + mínimos grants.
-- 3) Alinear RLS (clientes/pedidos/detalle_pedidos) a la matriz UI (deny-by-default).
-- 4) Endurecer views CC con security_invoker=true.
-- 5) Evitar bypass de RPC sp_crear_pedido (check de rol + revoke/grant).
--
-- Guardrails:
-- - No cambia contratos HTTP.
-- - No expone secretos.
-- - Evita impacto en datos: el script de validación fina se ejecuta aparte.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 0) Robustez: has_personal_role debe tolerar espacios (btrim).
-- ----------------------------------------------------------------------------
create or replace function public.has_personal_role(roles text[])
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.personal p
    where p.user_auth_id = auth.uid()
      and p.activo is true
      and lower(btrim(p.rol)) = any (roles)
  );
$$;

-- ----------------------------------------------------------------------------
-- 1) Normalizar roles legacy en public.personal (solo valores conocidos).
-- ----------------------------------------------------------------------------
update public.personal
set rol = 'admin'
where lower(btrim(rol)) in ('administrador', 'administrator', 'jefe');

update public.personal
set rol = 'deposito'
where lower(btrim(rol)) in ('depósito', 'warehouse');

update public.personal
set rol = 'ventas'
where lower(btrim(rol)) in ('vendedor', 'sales');

update public.personal
set rol = 'usuario'
where lower(btrim(rol)) in ('user');

-- ----------------------------------------------------------------------------
-- 2) Dedup + unique user_auth_id para garantizar 1 fila por usuario.
-- ----------------------------------------------------------------------------
with ranked as (
  select
    id,
    user_auth_id,
    row_number() over (
      partition by user_auth_id
      order by updated_at desc nulls last, created_at desc
    ) as rn
  from public.personal
  where user_auth_id is not null
)
update public.personal p
set
  activo = false,
  user_auth_id = null
from ranked r
where p.id = r.id
  and r.rn > 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'personal_user_auth_id_unique'
      and conrelid = 'public.personal'::regclass
  ) then
    alter table public.personal
      add constraint personal_user_auth_id_unique unique (user_auth_id);
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3) Lockdown personal: RLS self-select only (server-side truth).
-- ----------------------------------------------------------------------------
alter table public.personal enable row level security;

revoke all on public.personal from anon;
revoke insert, update, delete on public.personal from authenticated;
grant select on public.personal to authenticated;

drop policy if exists personal_select_self on public.personal;
create policy personal_select_self
  on public.personal
  for select
  to authenticated
  using (user_auth_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 4) Alinear RLS: clientes (solo admin/ventas).
-- ----------------------------------------------------------------------------
drop policy if exists clientes_select_authenticated on public.clientes;
drop policy if exists clientes_insert_admin_deposito on public.clientes;
drop policy if exists clientes_update_admin_deposito on public.clientes;
drop policy if exists clientes_insert_base_roles on public.clientes;
drop policy if exists clientes_update_base_roles on public.clientes;
drop policy if exists clientes_delete_admin on public.clientes;

create policy clientes_select_base_roles
  on public.clientes
  for select
  to authenticated
  using (public.has_personal_role(array['admin','ventas']));

create policy clientes_insert_admin_ventas
  on public.clientes
  for insert
  to authenticated
  with check (public.has_personal_role(array['admin','ventas']));

create policy clientes_update_admin_ventas
  on public.clientes
  for update
  to authenticated
  using (public.has_personal_role(array['admin','ventas']))
  with check (public.has_personal_role(array['admin','ventas']));

create policy clientes_delete_admin_only
  on public.clientes
  for delete
  to authenticated
  using (public.has_personal_role(array['admin']));

-- ----------------------------------------------------------------------------
-- 5) Alinear RLS: pedidos + detalle_pedidos (staff: admin/deposito/ventas).
-- ----------------------------------------------------------------------------
drop policy if exists pedidos_select_authenticated on public.pedidos;
drop policy if exists pedidos_insert_staff on public.pedidos;
drop policy if exists pedidos_update_staff on public.pedidos;
drop policy if exists pedidos_delete_admin on public.pedidos;

create policy pedidos_select_staff
  on public.pedidos
  for select
  to authenticated
  using (public.has_personal_role(array['admin','deposito','ventas']));

create policy pedidos_insert_staff
  on public.pedidos
  for insert
  to authenticated
  with check (public.has_personal_role(array['admin','deposito','ventas']));

create policy pedidos_update_staff
  on public.pedidos
  for update
  to authenticated
  using (public.has_personal_role(array['admin','deposito','ventas']))
  with check (public.has_personal_role(array['admin','deposito','ventas']));

create policy pedidos_delete_admin_only
  on public.pedidos
  for delete
  to authenticated
  using (public.has_personal_role(array['admin']));

drop policy if exists detalle_pedidos_select_authenticated on public.detalle_pedidos;
drop policy if exists detalle_pedidos_insert_staff on public.detalle_pedidos;
drop policy if exists detalle_pedidos_update_staff on public.detalle_pedidos;
drop policy if exists detalle_pedidos_delete_admin on public.detalle_pedidos;

create policy detalle_pedidos_select_staff
  on public.detalle_pedidos
  for select
  to authenticated
  using (public.has_personal_role(array['admin','deposito','ventas']));

create policy detalle_pedidos_insert_staff
  on public.detalle_pedidos
  for insert
  to authenticated
  with check (public.has_personal_role(array['admin','deposito','ventas']));

create policy detalle_pedidos_update_staff
  on public.detalle_pedidos
  for update
  to authenticated
  using (public.has_personal_role(array['admin','deposito','ventas']))
  with check (public.has_personal_role(array['admin','deposito','ventas']));

create policy detalle_pedidos_delete_admin_only
  on public.detalle_pedidos
  for delete
  to authenticated
  using (public.has_personal_role(array['admin']));

-- ----------------------------------------------------------------------------
-- 6) Views CC: respetar RLS del invocador (evitar bypass por SECURITY DEFINER).
-- ----------------------------------------------------------------------------
alter view if exists public.vista_cc_saldos_por_cliente set (security_invoker = true);
alter view if exists public.vista_cc_resumen set (security_invoker = true);

-- ----------------------------------------------------------------------------
-- 7) RPC Hardening: sp_crear_pedido
--    - Restrict EXECUTE
--    - Check rol al inicio (evita bypass via RPC/PostgREST)
-- ----------------------------------------------------------------------------
create or replace function public.sp_crear_pedido(
  p_cliente_nombre text,
  p_tipo_entrega text default 'retiro',
  p_direccion_entrega text default null,
  p_edificio text default null,
  p_piso text default null,
  p_departamento text default null,
  p_horario_preferido text default null,
  p_observaciones text default null,
  p_cliente_telefono text default null,
  p_cliente_id uuid default null,
  p_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido_id uuid;
  v_numero_pedido integer;
  v_item jsonb;
  v_monto_total decimal(12,2) := 0;
begin
  -- RLS fine guard: evitar bypass via RPC por usuarios no-staff.
  if not public.has_personal_role(array['admin','deposito','ventas']) then
    return jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  end if;

  insert into public.pedidos (
    cliente_id,
    cliente_nombre,
    cliente_telefono,
    tipo_entrega,
    direccion_entrega,
    edificio,
    piso,
    departamento,
    horario_entrega_preferido,
    observaciones,
    creado_por_id
  ) values (
    p_cliente_id,
    p_cliente_nombre,
    p_cliente_telefono,
    p_tipo_entrega,
    p_direccion_entrega,
    p_edificio,
    p_piso,
    p_departamento,
    p_horario_preferido,
    p_observaciones,
    auth.uid()
  )
  returning id, numero_pedido into v_pedido_id, v_numero_pedido;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.detalle_pedidos (
      pedido_id,
      producto_id,
      producto_nombre,
      producto_sku,
      cantidad,
      precio_unitario,
      observaciones
    ) values (
      v_pedido_id,
      (v_item->>'producto_id')::uuid,
      v_item->>'producto_nombre',
      v_item->>'producto_sku',
      (v_item->>'cantidad')::integer,
      (v_item->>'precio_unitario')::decimal(12,2),
      v_item->>'observaciones'
    );

    v_monto_total := v_monto_total +
      ((v_item->>'cantidad')::integer * (v_item->>'precio_unitario')::decimal(12,2));
  end loop;

  return jsonb_build_object(
    'success', true,
    'pedido_id', v_pedido_id,
    'numero_pedido', v_numero_pedido,
    'monto_total', v_monto_total,
    'items_count', jsonb_array_length(p_items)
  );
exception when others then
  return jsonb_build_object(
    'success', false,
    'error', sqlerrm
  );
end;
$$;

revoke all on function public.sp_crear_pedido(
  text, text, text, text, text, text, text, text, text, uuid, jsonb
) from public;
grant execute on function public.sp_crear_pedido(
  text, text, text, text, text, text, text, text, text, uuid, jsonb
) to authenticated;

commit;
