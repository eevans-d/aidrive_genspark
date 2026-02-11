-- RLS audit hardening for business tables.
-- This migration does NOT broaden permissions.
-- It only ensures RLS is enabled and validates effective policy/grant coverage.

begin;

alter table if exists public.pedidos enable row level security;
alter table if exists public.clientes enable row level security;
alter table if exists public.ventas enable row level security;
alter table if exists public.ofertas_stock enable row level security;
alter table if exists public.bitacora_turnos enable row level security;

do $$
declare
  tbl text;
  policy_count int;
begin
  foreach tbl in array array['pedidos', 'clientes', 'ventas', 'ofertas_stock', 'bitacora_turnos']
  loop
    select count(*)
      into policy_count
      from pg_policies
     where schemaname = 'public'
       and tablename = tbl;

    if policy_count = 0 then
      raise exception 'RLS audit failed: public.% has 0 policies', tbl;
    end if;
  end loop;
end $$;

-- Guardrail: sensitive business tables must not grant direct access to anon.
do $$
declare
  tbl text;
begin
  foreach tbl in array array['pedidos', 'clientes', 'ventas', 'ofertas_stock', 'bitacora_turnos']
  loop
    if exists (
      select 1
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = tbl
        and grantee = 'anon'
        and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
    ) then
      raise exception 'RLS audit failed: anon grant detected on public.%', tbl;
    end if;
  end loop;
end $$;

commit;
