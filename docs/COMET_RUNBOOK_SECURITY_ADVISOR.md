# ✅ COMET — Runbook mínimo para Security Advisor (Supabase)

**Objetivo:** verificar y corregir alertas de “tabla pública / RLS” con el menor consumo de créditos.

---

## FASE 1 — Verificación (1 solo bloque SQL)

**Copiar y pegar en Supabase → SQL Editor → New query:**

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

**Resultado esperado:**
- Las tablas críticas NO deben aparecer en `rowsecurity = false`.

Si aparecen, ir a FASE 2.

---

## FASE 2 — Habilitar RLS (solo si el SQL anterior lo indica)

**Copiar y pegar en SQL Editor:**

```sql
ALTER TABLE public.stock_deposito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_deposito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precios_historicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_faltantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones_tareas ENABLE ROW LEVEL SECURITY;
```

---

## FASE 3 — Políticas mínimas (solo si faltan políticas)

> Solo ejecutar si en la consulta de `pg_policies` NO aparecen políticas para `authenticated`.

```sql
-- Políticas mínimas (SELECT) para tablas críticas
CREATE POLICY stock_deposito_select_authenticated
ON public.stock_deposito
FOR SELECT TO authenticated
USING (true);

CREATE POLICY movimientos_deposito_select_authenticated
ON public.movimientos_deposito
FOR SELECT TO authenticated
USING (true);

CREATE POLICY precios_historicos_select_authenticated
ON public.precios_historicos
FOR SELECT TO authenticated
USING (true);

CREATE POLICY personal_select_authenticated
ON public.personal
FOR SELECT TO authenticated
USING (true);

CREATE POLICY productos_faltantes_select_authenticated
ON public.productos_faltantes
FOR SELECT TO authenticated
USING (true);

CREATE POLICY notificaciones_tareas_select_authenticated
ON public.notificaciones_tareas
FOR SELECT TO authenticated
USING (true);
```

---

## FASE 4 — Validación final (re-ejecutar FASE 1)

Si la lista de `rowsecurity = false` queda vacía para las tablas críticas, el problema está resuelto.

---

## Regla de oro
**Nunca pegar secretos ni tokens.**

---

## Resultado esperado (respuesta corta)
- “RLS OK en tablas críticas”
- “Policies OK para authenticated”
- “Security Advisor sin alertas críticas”
