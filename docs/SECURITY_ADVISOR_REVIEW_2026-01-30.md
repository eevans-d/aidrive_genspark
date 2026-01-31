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

### Ejecución local (CLI)
**Fecha:** 2026-01-30  
**Comando:** `./scripts/run_security_advisor_check.sh .env.test`  
**Resultado:** `DATABASE_URL missing in .env.test`  
**Estado:** SQL no ejecutado; verificación pendiente por credenciales.

### Ejecución COMET (STAGING) — Snapshot ANTES
**Fecha/hora:** 2026-01-30 05:03:07 UTC (02:03:07 -03)  
**Fuente:** Reporte COMET (SQL Editor)  
**Metadatos:** DB=Postgres, user=Postgres  
**RLS (pg_tables) reportado:**
- `movimientos_deposito` → rowsecurity **true**
- `notificaciones_tareas` → rowsecurity **false**
- `personal` → rowsecurity **true**
- `precios_historicos` → rowsecurity **true**
- `productos_faltantes` → rowsecurity **false**
- `stock_deposito` → rowsecurity **true** *(en reporte aparece traducido como “depósito de existencias”)*

**Policies (pg_policies):** 0 filas para las 6 tablas consultadas.  
**Grants (information_schema.table_privileges):** 18 filas (incluía `anon` en 5/6 tablas; `productos_faltantes` sin grant a `anon`).  
**Nota de COMET:** el editor traduce valores (`anon` → “luego”, `service_role` → “rol de servicio”).

**Interpretación técnica (si el reporte es correcto):**
- 2 tablas con **RLS deshabilitado** → exposición potencial si hay grants.
- 4 tablas con **RLS habilitado pero sin políticas** → acceso bloqueado para `anon`/`authenticated` (solo `service_role`).
- Esto contradice la auditoría RLS previa (2026-01-23). Requiere remediación y re-verificación.

### Ejecución COMET (STAGING) — Remediación + Snapshot DESPUÉS
**Fecha/hora reportada:** 2026-01-30 02:13 UTC (23:13 -03)  
**Observación:** la hora reportada es anterior al Snapshot ANTES; se conserva tal cual fue reportada.  
**Acciones ejecutadas (según COMET):**
- RLS habilitado en 6/6 tablas.
- REVOKE ALL para `anon` en 6/6 tablas.
- Políticas creadas (6):  
  - `personal_select_own_authenticated`  
  - `personal_insert_own_authenticated`  
  - `stock_deposito_select_authenticated`  
  - `movimientos_deposito_select_authenticated`  
  - `movimientos_deposito_insert_authenticated`  
  - `precios_historicos_select_authenticated`
- Grants para `authenticated` (4 tablas): `personal`, `stock_deposito`, `movimientos_deposito`, `precios_historicos`.

**Snapshot DESPUÉS (evidencia parcial):**
- RLS: reportado como **true** en las 6 tablas.  
- Policies: reportadas 6 políticas (listado anterior), **sin output literal** por tabla.  
- Grants: 12 filas (solo `authenticated` + `service_role`), **sin `anon`**.

**Implicancias funcionales (a confirmar):**
- `notificaciones_tareas` y `productos_faltantes` quedarían sin policies → acceso bloqueado para `authenticated` (solo `service_role`).  
- Esto es aceptable si el acceso es únicamente vía Edge Functions con `service_role`; de lo contrario, se requieren policies.

**Pendiente inmediato:** re-ejecutar consultas de Snapshot DESPUÉS y capturar output literal (sin traducciones) para:
- `pg_tables` (rowsecurity)
- `pg_policies` (policies exactas por tabla)
- `information_schema.table_privileges` (grants exactos)

### Ejecución COMET (STAGING) — Snapshot DESPUÉS literal (Prompt 1)
**Fecha/hora:** 2026-01-30T05:35:40.016273+00:00  
**Fuente:** Reporte COMET (SQL Editor, JSON con traducciones de UI)  
**Meta (JSON):** `{"db":"postgres","db_user":"postgres","timezone":"UTC","executed_at":"2026-01-30T05:35:40.016273+00:00"}`  

**RLS (pg_tables) — JSON traducido:**
- 6/6 tablas con `rowsecurity = true`: `movimientos_deposito`, `notificaciones_tareas`, `personal`, `precios_historicos`, `productos_faltantes`, `stock_deposito`.

**Policies (pg_policies) — JSON traducido:**
- 6 policies para `authenticated`:  
  - `movimientos_deposito` (SELECT + INSERT)  
  - `personal` (SELECT + INSERT con `auth.uid()`)  
  - `precios_historicos` (SELECT)  
  - `stock_deposito` (SELECT)
- **Sin policies** para `notificaciones_tareas` y `productos_faltantes`.

**Grants (information_schema.table_privileges) — JSON traducido:**
- Solo `authenticated` y `service_role` en las 6 tablas.
- **Sin grants para `anon`**.

**Nota de traducción:** la UI de Supabase tradujo campos (`table`→`tabla`, `policy`→`política`) y valores (`authenticated`→`autenticado`, `service_role`→`rol_de_servicio`, `true`→`verdadero`).  

**Implicancias:** `notificaciones_tareas` y `productos_faltantes` quedan **bloqueadas** para `authenticated` (solo `service_role`). Esto es aceptable si solo se usan desde Edge Functions.

### Ejecución COMET (STAGING) — Auditoría RLS Lite (Prompt 2)
**Fecha/hora:** 2026-01-30T05:38:24.129275+00:00  
**Fuente:** Reporte COMET (SQL Editor, JSON con traducciones de UI)

**Resultados clave:**
- `tables_without_rls`: `[]` → todas las tablas públicas tienen RLS habilitado.  
- `tables_rls_no_policies`: lista con 14 tablas **sin policies** (bloqueadas). Incluye `categorias`, `productos`, `proveedores`, `notificaciones_tareas` y varias tablas internas (cron/scraping).  
- **P0 summary:**  
  - `productos`, `proveedores`, `categorias` → `rls=true`, `num_policies=0` (**gap crítico**).  
  - `movimientos_deposito`, `personal`, `precios_historicos`, `stock_deposito` → con policies.
- **P0 grants:** COMET reporta grants para `anon` en `categorias`, `productos`, `proveedores` (traducido como “anónimo”).  

**Implicancia crítica:** las tablas P0 `productos`, `proveedores`, `categorias` no tienen policies para `authenticated` y mantienen grants para `anon`.  
Esto puede bloquear al frontend/gateway y/o dejar permisos abiertos si RLS cambia. Requiere remediación inmediata.

### Ejecución GitHub Copilot (MCP Supabase) — Auditoría completa + remediación
**Fecha/hora:** 2026-01-31 03:33 UTC  
**Fuente:** `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` (SQL con output crudo)

**Diagnóstico inicial (resumen):**
- RLS habilitado en 10/10 tablas críticas.
- 5 tablas sin policies: `categorias`, `productos`, `proveedores`, `productos_faltantes`, `notificaciones_tareas`.
- Grants `anon` detectados en: `categorias`, `ordenes_compra`, `productos`, `proveedores`, `tareas_pendientes`.

**Remediación aplicada (resumen):**
- Función helper `public.has_personal_role(roles text[])`.
- `REVOKE ALL` a `anon` en 10 tablas críticas.
- 30 policies RLS basadas en roles (`admin`, `deposito`, `ventas`, `usuario` + sinónimos).
- Grants mínimos a `authenticated` por tabla (sin `anon`).

**Post-check final (resumen):**
- RLS habilitado 10/10.
- 30 policies activas.
- `anon` sin grants.

**Estado:** gaps P0 de `categorias`, `productos`, `proveedores` **resueltos** (post-check OK).

### Verificación en PROD (post-migración)
**Fecha/hora:** 2026-01-31 04:06–04:15 UTC  
**Fuente:** `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` (Partes 4 y 5)

**Resultado en PROD:**
- RLS 10/10 ✅
- Policies 30/30 ✅
- `anon` grants 0 ✅
- Función `has_personal_role` STABLE ✅

**Estado:** migración aplicada y verificada en PROD.

### Security Advisor (PROD) — Parte 7
**Fecha/hora:** 2026-01-31 ~12:00 UTC  
**Fuente:** `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` (Parte 7)

**Resumen Advisor:**
- **ERROR:** 5 (vistas `SECURITY DEFINER`)
- **WARN:** 7 (5 funciones sin `search_path` fijo + 1 vista materializada con grants + Auth leaked password protection deshabilitado)
- **INFO:** 15 (tablas internas con RLS y sin políticas)

**Conclusión:** Advisor **con alertas**, pero **tablas core protegidas** (RLS + 30 policies + 0 grants `anon`).  
Acciones recomendadas (no bloqueantes): ajustar `search_path`, revocar `anon` en tablas internas, habilitar leaked password protection, documentar vistas `SECURITY DEFINER`.

### Security Advisor (PROD) — Mitigación aplicada (Parte 8)
**Fecha/hora:** 2026-01-31 04:33–04:40 UTC  
**Fuente:** `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` (Parte 8)

**Cambios aplicados:**
- `search_path=public` en 5 funciones (WARN eliminadas).
- Vistas internas cambiadas a `security_invoker` (ERROR eliminados).
- `REVOKE` de `anon` en 21 objetos (tablas/vistas/mat view).

**Post-mitigación (Advisor):**
- **ERROR:** 0 (antes 5).
- **WARN:** 2 (antes 7) — pendiente manual: leaked password protection; 1 WARN residual a confirmar en panel.
- **INFO:** 15 (tablas internas con RLS sin policies; aceptable por uso `service_role`).

**Pendiente manual:** habilitar leaked password protection en Dashboard → Auth → Settings.
**Migración recomendada:** versionar mitigaciones en `supabase/migrations/20260131020000_security_advisor_mitigations.sql`.

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
- [x] Verificación SQL realizada (COMET, STAGING, 2026-01-30)
- [x] Remediación aplicada en STAGING (RLS + policies + revoke anon)
- [x] Snapshot DESPUÉS literal capturado (JSON traducido por UI)
- [x] Auditoría RLS completa sin gaps (P0 con policies + grants correctos) — ver `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`
- [x] Migración aplicada y verificada en PROD (2026-01-31)
- [x] Mitigación de alertas no críticas aplicada (Parte 8)
- [ ] Advisor sin alertas críticas (aún quedan WARN/INFO; ver Parte 8)

**Bloqueador actual:** ninguno en RLS; pendiente confirmar panel de Security Advisor.

---

## 6) Anexo — Outputs COMET (JSON traducido por UI)

### 6.1 Prompt 1 — Snapshot DESPUÉS
**Meta:** `{"db":"postgres","db_user":"postgres","timezone":"UTC","executed_at":"2026-01-30T05:35:40.016273+00:00"}`

**RLS (JSON):**
```
[
  { "table": "movimientos_deposito", "rowsecurity": true },
  { "table": "notificaciones_tareas", "rowsecurity": true },
  { "table": "personal", "rowsecurity": true },
  { "table": "precios_historicos", "rowsecurity": true },
  { "table": "productos_faltantes", "rowsecurity": true },
  { "table": "stock_deposito", "rowsecurity": true }
]
```

**Policies (JSON traducido):**
```
[
  { "cmd": "INSERTAR", "qual": null, "roles": [ "autenticado" ], "tabla": "movimientos_deposito", "política": "movimientos_deposito_insertar_autenticado", "con_verificación": "(id_usuario = auth.uid())" },
  { "cmd": "SELECCIONAR", "qual": "verdadero", "roles": [ "autenticado" ], "tabla": "movimientos_deposito", "política": "movimientos_deposito_seleccionar_autenticado", "con_verificación": null },
  { "cmd": "INSERTAR", "qual": null, "roles": [ "autenticado" ], "tabla": "personal", "política": "personal_insertar_propio_autenticado", "con_verificación": "(id_usuario_autenticado = auth.uid())" },
  { "cmd": "SELECT", "qual": "(user_auth_id = auth.uid())", "roles": [ "autenticado" ], "table": "personal", "policy": "personal_select_own_authenticated", "with_check": null },
  { "cmd": "SELECT", "qual": "true", "roles": [ "autenticado" ], "table": "precios_históricos", "policy": "precios_históricos_select_authenticated", "with_check": null },
  { "cmd": "SELECT", "qual": "true", "roles": [ "autenticado" ], "table": "stock_deposito", "policy": "stock_deposito_select_authenticated", "with_check": null }
]
```

**Grants (JSON traducido):**
```
[
  { "tabla": "movimientos_depósito", "beneficiario": "autenticado", "privilegios": [ "BORRAR", "INSERTAR", "REFERENCIAS", "SELECCIONAR", "ACTIVAR", "TRUNCAR", "ACTUALIZAR" ] },
  { "tabla": "movimientos_depósito", "beneficiario": "rol_de_servicio", "privilegios": [ "BORRAR", "INSERTAR", "REFERENCIAS", "SELECCIONAR", "ACTIVAR", "TRUNCAR", "ACTUALIZAR" ] },
  { "tabla": "notificaciones_tareas", "beneficiario": "autenticado", "privilegios": [ "BORRAR", "INSERTAR", "REFERENCIAS", "SELECCIONAR", "ACTIVAR", "TRUNCAR", "ACTUALIZAR" ] },
  { "tabla": "notificaciones_tareas", "beneficiario": "rol_de_servicio", "privilegios": [ "BORRAR", "INSERTAR", "REFERENCIAS", "SELECCIONAR", "ACTIVAR", "TRUNCAR", "ACTUALIZAR" ] },
  { "tabla": "personal", "beneficiario": "autenticado", "privilegios": [ "ELIMINAR", "INSERTAR", "REFERENCIAS", "SELECCIONAR", "ACTIVAR", "TRUNCAR", "ACTUALIZAR" ] },
  { "tabla": "personal", "beneficiario": "función_de_servicio", "privilegios": [ "ELIMINAR", "INSERTAR", "REFERENCIAS", "SELECCIONAR", "ACTIVAR", "TRUNCAR", "ACTUALIZAR" ] },
  { "tabla": "precios_históricos", "beneficiario": "autenticado", "privilegios": [ "ELIMINAR", "INSERTAR", "REFERENCIAS", "SELECCIONAR", "ACTIVAR", "TRUNCAR", "ACTUALIZAR" ] },
  { "tabla": "precios_históricos", "beneficiario": "función_de_servicio", "privilegios": [ "ELIMINAR", "INSERTAR", "REFERENCIAS", "SELECCIONAR", "ACTIVAR", "TRUNCAR", "ACTUALIZAR" ] },
  { "tabla": "productos_faltantes", "beneficiario": "autenticado", "privilegios": [ "ELIMINAR", "INSERTAR", "REFERENCIAS", "SELECCIONAR", "ACTIVAR", "TRUNCAR", "ACTUALIZAR" ] },
  { "tabla": "productos_faltantes", "beneficiario": "función_de_servicio", "privilegios": [ "ELIMINAR", "INSERTAR", "REFERENCIAS", "SELECCIONAR", "ACTIVAR", "TRUNCAR", "ACTUALIZAR" ] },
  { "tabla": "stock_deposito", "beneficiario": "autenticado", "privilegios": [ "ELIMINAR", "INSERTAR", "REFERENCIAS", "SELECCIONAR", "ACTIVAR", "TRUNCAR", "ACTUALIZAR" ] },
  { "tabla": "stock_deposito", "beneficiario": "rol_de_servicio", "privilegios": [ "ELIMINAR", "INSERTAR", "REFERENCIAS", "SELECCIONAR", "ACTIVAR", "TRUNCAR", "ACTUALIZAR" ] }
]
```

### 6.2 Prompt 2 — Auditoría RLS Lite
**Meta:** `{"db":"postgres","db_user":"postgres","timezone":"UTC","executed_at":"2026-01-30T05:38:24.129275+00:00"}`

**tables_without_rls (JSON):** `[]`

**tables_rls_no_policies (JSON traducido, lista parcial relevante):**
```
[
  "categorías",
  "comparacion_precios",
  "configuracion_proveedor",
  "alertas_de_trabajos_cron",
  "configuración de trabajos cron",
  "registro_de_ejecución_de_trabajos_cron",
  "comprobaciones_de_estado_de_trabajos_cron",
  "métricas_de_trabajos_cron",
  "historial_de_monitoreo_de_trabajos_cron",
  "preferencias_de_notificación_de_trabajos_cron",
  "notificaciones_de_trabajos_cron",
  "seguimiento de trabajos cron",
  "estadisticas_scraping",
  "notificaciones_tareas"
]
```

**P0 summary (JSON traducido):**
```
[
  { "rls": true, "table": "categorías", "num_policies": 0 },
  { "rls": true, "table": "movimientos_deposito", "num_policies": 2 },
  { "rls": true, "table": "personal", "num_policies": 2 },
  { "rls": true, "table": "precios_historicos", "num_policies": 1 },
  { "rls": true, "table": "productos", "num_policies": 0 },
  { "rls": true, "table": "proveedores", "num_policies": 0 },
  { "rls": true, "table": "stock_deposito", "num_policies": 1 }
]
```

**P0 grants (JSON traducido, extracto crítico):**
```
[
  { "tabla": "categorías", "beneficiario": "anónimo", "privilegios": [ "BORRAR", "INSERTAR", "REFERENCIAS", "SELECCIONAR", "ACTIVAR", "TRUNCAR", "ACTUALIZAR" ] },
  { "tabla": "productos", "beneficiario": "anónimo", "privilegios": [ "ELIMINAR", "INSERTAR", "REFERENCIAS", "SELECCIONAR", "ACTIVAR", "TRUNCAR", "ACTUALIZAR" ] },
  { "tabla": "proveedores", "beneficiario": "anónimo", "privilegios": [ "ELIMINAR", "INSERTAR", "REFERENCIAS", "SELECCIONAR", "ACTIVAR", "TRUNCAR", "ACTUALIZAR" ] }
]
```
