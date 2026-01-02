create table if not exists public.cache_proveedor (
    endpoint text primary key,
    payload jsonb not null,
    updated_at timestamptz not null default now(),
    ttl_seconds integer not null
);

create index if not exists cache_proveedor_updated_at_idx on public.cache_proveedor (updated_at desc);
