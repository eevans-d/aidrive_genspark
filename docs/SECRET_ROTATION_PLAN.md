# Plan de Rotacion de Secretos

**Fecha:** 2026-02-09
**Estado:** EJECUTADO (P1) — `API_PROVEEDOR_SECRET` rotado (2026-02-13) + SendGrid rotado con delivery confirmado (2026-02-15). Higiene recomendada: revocar key anterior.
**Riesgo:** SIN VALORES — este documento NO contiene secrets, solo nombres y procedimiento.
**Ultima verificacion:** 2026-02-15 — SendGrid aplicado en Supabase + smoke real + Email Activity `delivered`.

---

## 1) Inventario de Secrets (Supabase Edge Functions)

| Secret | Tipo | Rotacion | Impacto si se rota |
|--------|------|----------|-------------------|
| `SUPABASE_ANON_KEY` | JWT (Supabase-generated) | No rotar manualmente | Invalida todos los clients |
| `SUPABASE_SERVICE_ROLE_KEY` | JWT (Supabase-generated) | No rotar manualmente | Rompe todas las Edge Functions |
| `SUPABASE_URL` | URL (fija) | No aplica | — |
| `SUPABASE_DB_URL` | Connection string | Via Dashboard > Settings | Requiere redeploy de funciones |
| `API_PROVEEDOR_SECRET` | Custom (shared secret) | **SI rotar** | Afecta api-proveedor auth inter-function |
| `SENDGRID_API_KEY` | API key (SendGrid) | **SI rotar** | Afecta envio de emails |
| `SMTP_FROM` | Email address | No rotar (config) | — |
| `SMTP_HOST` | Hostname | No rotar (config) | — |
| `SMTP_PORT` | Port number | No rotar (config) | — |
| `SMTP_USER` | Username (SendGrid) | No rotar (config) | Valor esperado: `apikey` |
| `SMTP_PASS` | Password (= API key) | **SI rotar** (mismo valor que SENDGRID_API_KEY) | — |
| `NOTIFICATIONS_MODE` | Flag (simulation/real) | No rotar (config) | En `production`, `simulation` bloquea `/send` y `/test` |
| `ALLOWED_ORIGINS` | CSV de origenes | No rotar (config) | — |

## 2) Secrets que requieren rotacion

| Prioridad | Secret(s) | Frecuencia recomendada | Procedimiento |
|-----------|-----------|------------------------|---------------|
| **P1** | `API_PROVEEDOR_SECRET` | Cada 90 dias o ante leak | Ver seccion 3.1 |
| **P1** | `SENDGRID_API_KEY` + `SMTP_PASS` + `SMTP_USER` | Cada 90 dias o ante leak | Ver seccion 3.2 |
| **P2** | `SUPABASE_DB_URL` | Solo si hay leak | Via Dashboard, requiere redeploy |

### Addendum 2026-02-13 (ejecutado)

- ✅ `API_PROVEEDOR_SECRET` rotado en remoto con `supabase secrets set`.
- ✅ Redeploy ejecutado: `api-proveedor`, `scraper-maxiconsumo`.
- ✅ Validación post-rotación:
  - `api-proveedor/status` con secreto nuevo -> 200
  - `api-proveedor/status` con secreto anterior -> 401
- Evidencia: `docs/closure/SECRET_ROTATION_2026-02-13_031253.md`.

### Addendum 2026-02-15 (ejecutado)

- ✅ SendGrid: API key nueva creada en SendGrid (permiso Mail Send) y aplicada en Supabase via env-file seguro.
- ✅ Redeploy ejecutado: `cron-notifications` + `notificaciones-tareas`.
- ✅ Smoke real OK: `cron-notifications/send` -> HTTP `200`, `status=sent`, `messageId` no vacio.
- Evidencia: `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`.
- ✅ Evidencia externa OK: Email Activity `delivered` post-smoke (ver evidencia 2026-02-15).
- ⚠️ Higiene recomendada: revocar la key anterior si aún está activa (evitar llaves huérfanas).

## 3) Procedimientos de rotacion

### 3.1 API_PROVEEDOR_SECRET

```
1. Generar nuevo secret: openssl rand -hex 32
2. Establecer en Supabase:
   supabase secrets set API_PROVEEDOR_SECRET=<nuevo_valor> --project-ref dqaygmjpzoqjjrywdsxi
3. Redeployar funciones que lo usan:
   supabase functions deploy api-proveedor --use-api
   supabase functions deploy scraper-maxiconsumo --use-api
4. Validar:
   - Llamar GET /api-proveedor/health (no requiere auth, verifica que la funcion arranca)
   - Llamar GET /api-proveedor/status con x-api-secret nuevo
5. Si falla: rollback con el valor anterior (guardado antes del paso 2).
```

### 3.2 SENDGRID_API_KEY + SMTP_PASS + SMTP_USER

```
1. En SendGrid Dashboard: crear nueva API key con mismos permisos.
2. Establecer en Supabase (los 3 juntos):
   Opcion segura recomendada (no expone valores en shell history):
   - Crear `backups/.env.sendgrid.rotate.local` (gitignored) a partir de `backups/.env.sendgrid.rotate.template`
     - Nota: el valor de API key de SendGrid empieza con `SG` seguido de `.` y debe pegarse completo.
   - Ejecutar: `scripts/apply-sendgrid-secrets-from-env.sh backups/.env.sendgrid.rotate.local`

   Opcion manual (solo si se entiende el riesgo de exposición en terminal):
   supabase secrets set SENDGRID_API_KEY=<nueva_key> SMTP_PASS=<nueva_key> SMTP_USER=apikey --project-ref dqaygmjpzoqjjrywdsxi
3. Redeployar funciones de notificacion:
   supabase functions deploy notificaciones-tareas --use-api
   supabase functions deploy cron-notifications --use-api
4. Validar:
   - Enviar notificacion real de prueba (en `production` requiere `NOTIFICATIONS_MODE=real`)
   - Verificar en SendGrid Activity que el email fue procesado/entregado
5. Si falla: rollback con valores anteriores.
6. Revocar la API key antigua en SendGrid Dashboard.
```

## 4) Checklist de validacion post-rotacion

- [ ] Secret actualizado en Supabase secrets (verificar con `supabase secrets list`)
- [ ] Funciones redeployadas (sin errores de deploy)
- [ ] Health check de la funcion afectada: 200 OK
- [ ] Endpoint funcional que usa el secret: 200 OK
- [ ] Secret anterior revocado en la fuente (SendGrid Dashboard, etc.)
- [ ] Evidencia registrada en `docs/closure/EXECUTION_LOG_*.md`

## 5) Lo que NO se rota manualmente

- `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`: son JWTs firmados por Supabase. Para rotarlos, hay que usar Dashboard > Settings > API > Regenerate. **Esto invalida TODOS los clientes y TODAS las funciones.** Solo hacerlo en caso de compromiso confirmado.
- `SUPABASE_URL`: es una URL publica fija del proyecto.
- `ALLOWED_ORIGINS`: es configuracion, no credencial.
- `NOTIFICATIONS_MODE`: es un flag operativo.
