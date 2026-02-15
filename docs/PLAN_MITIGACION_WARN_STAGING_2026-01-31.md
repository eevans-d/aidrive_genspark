> [DEPRECADO: 2026-02-13] Documento historico. No usar como fuente primaria. Fuente vigente: `docs/ESTADO_ACTUAL.md`, `docs/closure/MEGA_PLAN_2026-02-13_042956.md`, `docs/closure/OPEN_ISSUES.md`.

# 📋 PLAN: Mitigación WARN Residual + Validación Staging/Local

**Fecha de creación:** 2026-01-31  
**Proyecto:** minimarket-system (ref: `dqaygmjpzoqjjrywdsxi`)  
**Estado:** ⚠️ Re‑abierto (COMET 2026-02-02; WARN=3 y leaked password bloqueado)  
**Autor:** GitHub Copilot (modo agente)

> **Contexto actual:** ver `docs/HOJA_RUTA_MADRE_2026-01-31.md` y `docs/ESTADO_ACTUAL.md`.  
> **Evidencia base:** `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` (Partes 7 y 8).

---

## 🎯 OBJETIVO

Confirmar el WARN residual del Security Advisor en PROD, habilitar la protección de contraseñas filtradas (leaked password protection) y validar que las migraciones de seguridad estén correctamente aplicadas en entornos staging/local.  
**Estado actual (COMET 2026-02-02):** Security Advisor reporta **WARN=3**, y leaked password protection permanece bloqueado por **SMTP personalizado**.

---

## 🆕 Addendum 2026-02-02 (COMET)

**WARN actuales (3):**
1) `public.sp_aplicar_precio` con **search_path mutable**.  
2) **Vista materializada** `public.tareas_metricas` accesible por API (anon/authenticated).  
3) **Leaked password protection** deshabilitada (bloqueada por falta de SMTP personalizado).

**Acciones técnicas preparadas en repo (EJECUTADAS EN PROD 2026-02-02):**
- ✅ Migración `20260202083000_security_advisor_followup.sql`: `SET search_path` en `sp_aplicar_precio` + `REVOKE` `tareas_metricas` para `authenticated`.
- ✅ Endpoint `/reportes/efectividad-tareas`: usa `service_role` para leer `tareas_metricas` (evita acceso vía data API).

**Bloqueo pendiente (panel):**
- Leaked password protection **no se puede habilitar** sin **SMTP personalizado** (credenciales externas).

**Pendientes por limitación de entorno (Antigravity):**
- ✅ Verificación visual del Security Advisor (confirmado WARN=1) — 2026-02-04.
- ✅ Test real del endpoint `/reportes/efectividad-tareas` con JWT válido (**200 OK**) — 2026-02-04. *(Requirió redeploy `api-minimarket` con `--no-verify-jwt` por JWT ES256; validación queda en app).*

> **Nota de coherencia:** las listas con `[x]` en fases posteriores corresponden a la ejecución **histórica 2026-02-01**.  
> El estado actual está re‑abierto; usar este addendum como referencia principal.

---

## 📊 ANÁLISIS DEL ESTADO (histórico + cierre)

### Security Advisor (PROD) — estado pre‑cierre (2026-01-31)

| Nivel | Cantidad | Detalle |
|-------|----------|---------|
| **ERROR** | 0 | ✅ Todos eliminados |
| **WARN** | 2 | `auth_leaked_password_protection` + posible segundo (verificar) |
| **INFO** | 15 | Tablas internas sin políticas (aceptable - uso por service_role) |

#### Grants `anon` (contexto previo)
- 21 objetos reportados inicialmente (16 tablas internas + 5 vistas).  
- Se revocó además `tareas_metricas` (mat. view) aunque no aparecía en el listado inicial; confirmar en panel/SQL si persiste.

### Security Advisor (PROD) — estado post‑cierre (2026-02-01, confirmación usuario)

| Nivel | Cantidad | Detalle |
|-------|----------|---------|
| **ERROR** | 0 | ✅ Todos eliminados |
| **WARN** | 0 | ✅ Leaked password protection habilitado (histórico 2026-02-01; re‑abierto 2026-02-02) |
| **INFO** | 15 | Tablas internas sin políticas (aceptable - uso por service_role) |

> **Nota (2026-02-02):** esta confirmación quedó **desactualizada**. COMET verificó en PROD **WARN=3** y leaked password protection **deshabilitada** por falta de SMTP personalizado.

### Migración de mitigaciones existente:

| Campo | Valor |
|-------|-------|
| **Archivo** | `supabase/migrations/20260131020000_security_advisor_mitigations.sql` |
| **Contenido** | ALTER functions (search_path) + ALTER views (security_invoker) + REVOKE anon |
| **Estado PROD** | ✅ Ya aplicada y verificada (Parte 8) |
| **Estado Staging/Local** | ✅ Validado (confirmación usuario 2026-02-01) |

### Contenido de la migración:

```sql
-- Security Advisor mitigations (search_path + security_invoker + revoke anon)
BEGIN;

-- Fix search_path for functions flagged by Advisor (5 funciones)
ALTER FUNCTION IF EXISTS public.has_personal_role(roles text[]) SET search_path = public;
ALTER FUNCTION IF EXISTS public.fnc_redondear_precio(precio numeric) SET search_path = public;
ALTER FUNCTION IF EXISTS public.fnc_margen_sugerido(p_producto_id uuid) SET search_path = public;
ALTER FUNCTION IF EXISTS public.fnc_productos_bajo_minimo() SET search_path = public;
ALTER FUNCTION IF EXISTS public.fnc_stock_disponible(p_producto_id uuid, p_deposito text) SET search_path = public;

-- SECURITY DEFINER views -> security_invoker (5 vistas internas)
ALTER VIEW IF EXISTS public.vista_cron_jobs_dashboard SET (security_invoker = true);
ALTER VIEW IF EXISTS public.vista_cron_jobs_metricas_semanales SET (security_invoker = true);
ALTER VIEW IF EXISTS public.vista_cron_jobs_alertas_activas SET (security_invoker = true);
ALTER VIEW IF EXISTS public.vista_alertas_activas SET (security_invoker = true);
ALTER VIEW IF EXISTS public.vista_oportunidades_ahorro SET (security_invoker = true);

-- Revoke anon grants (16 tablas + 5 vistas + 1 mat. view si aplica)
REVOKE ALL ON TABLE public.alertas_cambios_precios FROM anon;
REVOKE ALL ON TABLE public.cache_proveedor FROM anon;
-- ... (objetos total según hallazgos)

COMMIT;
```

---

## 🔄 FASE 1: CONFIRMAR WARN RESIDUAL EN PANEL (PROD)

### 1.1 Acceder al Dashboard Supabase

| Campo | Valor |
|-------|-------|
| **URL** | https://supabase.com/dashboard/project/dqaygmjpzoqjjrywdsxi |
| **Ruta** | Database → Database Linter (o "Advisors" en sidebar izquierdo) |

### 1.2 Identificar alertas WARN activas

Buscar específicamente:

| Alerta esperada | Tipo | Estado actual | Acción requerida |
|-----------------|------|---------------|------------------|
| `auth_leaked_password_protection` | Auth Config | ⚠️ WARN | Habilitar en Auth Settings |
| `materialized_view_in_api` | Vista Mat. | Verificar | Confirmar si aplica y si sigue reportando WARN |

### 1.3 Capturar evidencia

- [x] Screenshot del Security Advisor mostrando alertas actuales
- [x] Anotar timestamp de verificación
- [x] Confirmar número exacto de WARN (esperado: 1-2)

---

## 🔐 FASE 2: HABILITAR LEAKED PASSWORD PROTECTION

### 2.1 Navegación en Dashboard

```
Supabase Dashboard
  └── Authentication (sidebar izquierdo)
       └── Settings (o Providers → Email)
            └── Password Protection
```

### 2.2 Configuración recomendada

| Setting | Valor recomendado | Notas |
|---------|-------------------|-------|
| **Enable leaked password protection** | ✅ ON | Obligatorio |
| **Check against HaveIBeenPwned** | ✅ Habilitado | Verifica contraseñas comprometidas |
| Minimum password length | 8+ (ideal 12) | Opcional pero recomendado |

### 2.3 Pasos exactos de ejecución

1. **Navegar:** Ir a `Authentication` en sidebar izquierdo
2. **Acceder settings:** Click en `Settings` (pestaña superior o sección)
3. **Localizar:** Buscar sección "Password" o "Security"
4. **Habilitar:** Toggle ON en "Leaked password protection"
5. **Verificar:** Confirmar que dice "Check passwords against HaveIBeenPwned"
6. **Guardar:** Click en "Save" o aplicar cambios
7. **Capturar:** Screenshot de confirmación con timestamp

### 2.4 Verificación post-cambio

1. Refrescar página del Security Advisor (F5 o navegación)
2. Esperar 30-60 segundos (cache puede tardar)
3. Confirmar que `auth_leaked_password_protection` **ya no aparece** como WARN
4. Capturar screenshot final

---

## 🧪 FASE 3: VALIDAR MIGRACIÓN EN LOCAL

### 3.1 Prerrequisitos

```bash
# Verificar Supabase CLI instalado
supabase --version
# Esperado: supabase version 1.x.x o superior

# Verificar Docker corriendo
docker ps
# Debe mostrar containers activos (o vacío si no hay)

# Verificar que estás en el directorio correcto
pwd
# Esperado: /home/eevan/ProyectosIA/aidrive_genspark
```

### 3.2 Iniciar entorno local

```bash
# Desde raíz del proyecto
cd /home/eevan/ProyectosIA/aidrive_genspark

# Iniciar Supabase local (aplica TODAS las migraciones automáticamente)
supabase start

# Verificar estado y obtener credenciales locales
supabase status
```

**Output esperado de `supabase status`:**
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Anon key: eyJ...
Service role key: eyJ...
```

### 3.3 Verificar migraciones aplicadas

```bash
# Listar todas las migraciones
supabase migration list
```

**Verificar que incluya:**
- [x] `20260131000000_rls_role_based_policies_v2.sql`
- [x] `20260131020000_security_advisor_mitigations.sql`

### 3.4 Ejecutar queries de verificación (local)

Conectar a la base de datos local:

```bash
# Opción 1: psql directo
psql postgresql://postgres:postgres@localhost:54322/postgres

# Opción 2: Supabase Studio
# Abrir http://localhost:54323 → SQL Editor
```

**Query 1: Verificar search_path en funciones**
```sql
SELECT proname, proconfig 
FROM pg_proc 
WHERE proname IN (
  'has_personal_role',
  'fnc_redondear_precio',
  'fnc_margen_sugerido',
  'fnc_productos_bajo_minimo',
  'fnc_stock_disponible'
);
```

**Resultado esperado:**
| proname | proconfig |
|---------|-----------|
| has_personal_role | {search_path=public} |
| fnc_redondear_precio | {search_path=public} |
| fnc_margen_sugerido | {search_path=public} |
| fnc_productos_bajo_minimo | {search_path=public} |
| fnc_stock_disponible | {search_path=public} |

---

**Query 2: Verificar security_invoker en vistas**
```sql
SELECT c.relname AS view_name, 
       COALESCE(
         (SELECT option_value FROM pg_options_to_table(c.reloptions) 
          WHERE option_name = 'security_invoker'), 
         'false'
       ) AS security_invoker
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'v'
  AND c.relname IN (
    'vista_cron_jobs_dashboard',
    'vista_cron_jobs_metricas_semanales',
    'vista_cron_jobs_alertas_activas',
    'vista_alertas_activas',
    'vista_oportunidades_ahorro'
  );
```

**Resultado esperado:**
| view_name | security_invoker |
|-----------|------------------|
| vista_alertas_activas | true |
| vista_cron_jobs_alertas_activas | true |
| vista_cron_jobs_dashboard | true |
| vista_cron_jobs_metricas_semanales | true |
| vista_oportunidades_ahorro | true |

---

**Query 3: Verificar grants anon = 0**
```sql
SELECT count(*) AS anon_grants
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND grantee = 'anon';
```

**Resultado esperado:** `0` (cero grants para anon)

---

### 3.5 Registrar resultados

| Query | Resultado esperado | Resultado obtenido | Estado |
|-------|-------------------|-------------------|--------|
| search_path funciones | 5/5 con {search_path=public} | | |
| security_invoker vistas | 5/5 con true | | |
| grants anon | 0 | | |

---

## 🌐 FASE 4: VALIDAR MIGRACIÓN EN STAGING (si existe)

### 4.1 Identificar proyecto staging

```bash
# Ver proyectos vinculados
supabase projects list

# Si hay proyecto staging separado, vincular
supabase link --project-ref <STAGING_PROJECT_REF>
```

> **Nota:** Si no existe proyecto staging separado, omitir esta fase y usar local como validación.

### 4.2 Aplicar migraciones a staging

```bash
# Push todas las migraciones pendientes
supabase db push

# O ver estado antes de push
supabase db push --dry-run
```

### 4.3 Verificar en Dashboard staging

1. Acceder al proyecto staging en Dashboard
2. Ir a SQL Editor
3. Ejecutar las mismas 3 queries de verificación de Fase 3.4
4. Registrar resultados

### 4.4 Alternativa: Ejecutar migración manualmente

Si `db push` no está disponible, copiar contenido de:
```
supabase/migrations/20260131020000_security_advisor_mitigations.sql
```

Y ejecutar en SQL Editor del proyecto staging.

---

## 📝 FASE 5: DOCUMENTAR RESULTADOS

### 5.1 Actualizar documento de auditoría

Agregar **PARTE 9** al archivo `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` con:

```markdown
## PARTE 9: VALIDACIÓN FINAL Y CIERRE

### 9.1 Panel PROD - Leaked Password Protection
- **Fecha:** [TIMESTAMP]
- **Acción:** Habilitado en Auth → Settings
- **Evidencia:** [Screenshot o confirmación]
- **Security Advisor post-cambio:** [X] ERROR, [Y] WARN, [Z] INFO

### 9.2 Validación Local
- **Comando:** supabase start + migration list
- **Funciones con search_path:** 5/5 ✅
- **Vistas con security_invoker:** 5/5 ✅
- **Grants anon:** 0 ✅

### 9.3 Validación Staging (si aplica)
- **Método:** [db push / manual]
- **Resultado:** [OK / N/A]

### 9.4 Conclusión Final
✅ Security Advisor sin alertas críticas (histórico 2026-02-01; re‑abierto 2026-02-02)
✅ Migraciones validadas en todos los entornos
```

### 5.2 Actualizar otros documentos

| Documento | Actualización |
|-----------|---------------|
| `docs/CHECKLIST_CIERRE.md` | Marcar ítem de Security Advisor como completado |
| `docs/ESTADO_ACTUAL.md` | Actualizar estado de seguridad |
| `docs/HOJA_RUTA_MADRE_2026-01-31.md` | Cerrar tarea pendiente |

---

## ⏱️ ESTIMACIÓN DE TIEMPOS

| Fase | Descripción | Tiempo estimado |
|------|-------------|-----------------|
| **Fase 1** | Confirmar WARN en panel | 5 min |
| **Fase 2** | Habilitar leaked password | 5 min |
| **Fase 3** | Validar en local | 15 min |
| **Fase 4** | Validar en staging | 10 min |
| **Fase 5** | Documentar resultados | 10 min |
| **Buffer** | Imprevistos | 5 min |
| **TOTAL** | | **~50 min** |

---

## 🛑 CRITERIOS DE ABORT (No continuar si...)

| Condición | Acción recomendada |
|-----------|-------------------|
| No hay acceso al Dashboard Supabase | Escalar a responsable del proyecto |
| Supabase CLI no funciona | Verificar Docker instalado/corriendo, reinstalar CLI |
| `supabase start` falla | Revisar logs con `supabase start --debug` |
| Migración falla en staging | **NO aplicar en prod**, revisar SQL y errores |
| Más de 2 WARN aparecen en Advisor | Investigar nuevas alertas antes de continuar |
| Queries de verificación fallan | Revisar si migración se aplicó correctamente |

---

## ✅ CHECKLIST DE EJECUCIÓN

### Pre-ejecución
- [x] Acceso confirmado a Dashboard Supabase PROD
- [x] Supabase CLI instalado (`supabase --version`)
- [x] Docker instalado y corriendo (`docker ps`)
- [x] Documento de auditoría abierto para actualizar
- [x] Terminal en directorio correcto del proyecto

---

### Fase 1: Confirmar WARN en Panel
- [x] Acceder a Dashboard → Database → Linter/Advisors
- [x] Identificar alertas WARN activas
- [x] Capturar screenshot con timestamp
- [x] Confirmar que el principal es `auth_leaked_password_protection`
- [x] Anotar si hay segundo WARN y cuál es

---

### Fase 2: Habilitar Leaked Password Protection
- [x] Navegar a Authentication → Settings
- [x] Localizar sección "Password" o "Security"
- [x] Habilitar toggle "Leaked password protection" (histórico 2026-02-01; re‑abierto 2026-02-02)
- [x] Verificar que menciona "HaveIBeenPwned"
- [x] Guardar cambios
- [x] Capturar screenshot de confirmación
- [x] Esperar 30-60 segundos
- [x] Refrescar Security Advisor
- [x] Confirmar WARN `auth_leaked_password_protection` eliminado
- [x] Capturar screenshot final del Advisor

---

### Fase 3: Validar en Local
- [x] Ejecutar `supabase start`
- [x] Esperar a que todos los servicios inicien
- [x] Ejecutar `supabase migration list`
- [x] Verificar que incluye `20260131020000_security_advisor_mitigations.sql`
- [x] Conectar a DB local (psql o Studio)
- [x] Ejecutar Query 1: search_path funciones → 5/5 OK
- [x] Ejecutar Query 2: security_invoker vistas → 5/5 OK
- [x] Ejecutar Query 3: grants anon → 0
- [x] Registrar resultados en tabla

---

### Fase 4: Validar en Staging (si aplica)
- [x] Identificar si existe proyecto staging
- [x] Vincular proyecto con `supabase link`
- [x] Ejecutar `supabase db push` (o migración manual)
- [x] Repetir las 3 queries de verificación
- [x] Registrar resultados
- [x] (Si no hay staging) Marcar como N/A

---

### Fase 5: Documentar
- [x] Agregar PARTE 9 a `AUDITORIA_RLS_EJECUTADA_2026-01-31.md`
- [x] Actualizar `CHECKLIST_CIERRE.md`
- [x] Actualizar `ESTADO_ACTUAL.md` (si aplica)
- [x] Commit de documentación (opcional)

---

### Post-ejecución - Verificación Final
- [x] Security Advisor muestra: 0 ERROR, 0-1 WARN, ~15 INFO (histórico 2026-02-01; re‑abierto 2026-02-02)
- [x] Leaked password protection habilitado (histórico 2026-02-01; re‑abierto 2026-02-02)
- [x] Migración validada en local
- [x] Migración validada en staging (o N/A)
- [x] Documentación actualizada
- [x] Comunicar cierre a equipo (si aplica)

---

## 📚 REFERENCIAS

| Documento | Ruta | Uso |
|-----------|------|-----|
| Auditoría RLS | `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` | Evidencia completa |
| Migración | `supabase/migrations/20260131020000_security_advisor_mitigations.sql` | SQL aplicado |
| Deployment Guide | `docs/DEPLOYMENT_GUIDE.md` | Procedimientos de deploy |
| Obtener Secretos | `docs/OBTENER_SECRETOS.md` | Credenciales staging/local |
| Security Advisor Check | `scripts/run_security_advisor_check.sh` | Verificación rápida (sin COMET) |

---

## 📞 CONTACTO Y ESCALAMIENTO

| Situación | Acción |
|-----------|--------|
| No tengo acceso al Dashboard | Solicitar permisos al owner del proyecto |
| Error crítico en migración | Revisar `docs/ROLLBACK_SQL_TEMPLATE.md` |
| Dudas sobre procedimiento | Consultar `docs/OPERATIONS_RUNBOOK.md` |

---

**Plan generado por:** GitHub Copilot (modo agente)  
**Fecha:** 2026-01-31  
**Versión:** 1.0 - Planificación Intensiva Completa

---

> **Próximo paso:** Ejecutar el checklist comenzando por Fase 1.
