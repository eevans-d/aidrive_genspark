# 🔐 Security Advisor Review (Supabase) — 2026-01-30

**Fuente:** panel de Security Advisor en Supabase (capturas compartidas).  
**Objetivo:** revisar avisos de tablas públicas/RLS y confirmar el estado real.

---

## 1) Avisos observados (capturas)
Tablas mencionadas con alerta (posible RLS deshabilitado o sin políticas):
- `personal`
- `notificaciones_tareas`
- `productos_faltantes`
- `precios_historicos`
- `movimientos_deposito`
- `stock_deposito`

> Nota: el panel muestra “tabla pública…” (texto truncado). Esto **debe verificarse** con SQL.

---

## 2) Verificación rápida (SQL en Supabase)

```sql
-- Tablas con RLS deshabilitado
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- Políticas existentes
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Resultado esperado:
- Tablas críticas **NO** deben aparecer en el listado de `rowsecurity = false`.
- Deben existir políticas para `authenticated` en tablas usadas por frontend/gateway.

> Alternativa CLI (sin COMET): `scripts/run_security_advisor_check.sh .env.test`

---

## 3) Acciones si hay problemas

### A) Si RLS está deshabilitado
Habilitar RLS en tablas críticas (ejemplo):
```sql
ALTER TABLE public.stock_deposito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_deposito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precios_historicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_faltantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones_tareas ENABLE ROW LEVEL SECURITY;
```

### B) Si faltan políticas
Definir políticas mínimas **solo si se confirma ausencia**, según uso real (frontend/gateway).  
> Recomendado: revisar `docs/AUDITORIA_RLS_CHECKLIST.md` antes de crear políticas nuevas.

---

## 4) Evidencia a registrar
- Fecha/hora del SQL
- Resultado de queries
- Cambios aplicados (si los hubo)
- Captura o log del Advisor luego de corregir

---

## 5) Estado
- [ ] Verificación SQL realizada
- [ ] RLS confirmado en tablas críticas
- [ ] Advisor sin alertas críticas
