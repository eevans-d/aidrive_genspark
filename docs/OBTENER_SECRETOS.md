# Guía para obtener secretos (Mini Market)

**Fecha:** 2026-01-23
**Objetivo:** Proveer pasos claros para que tú obtengas las credenciales necesarias. Yo no puedo acceder a tus cuentas ni extraer secretos.

---

## 1) Lista mínima de secretos requeridos

| Secreto | Entorno | Uso principal | Dónde se usa |
|---|---|---|---|
| `SUPABASE_URL` | Staging/Prod | Endpoint Supabase | Edge Functions, CI | 
| `SUPABASE_ANON_KEY` | Staging/Prod | Lecturas seguras (anon/JWT) | Edge Functions, CI | 
| `SUPABASE_SERVICE_ROLE_KEY` | Staging/Prod | Escrituras/admin | Edge Functions, CI (nunca frontend) |
| `DATABASE_URL` | Staging/Prod | Auditoría RLS / migraciones | Operación/CI |
| `ALLOWED_ORIGINS` | Staging/Prod | CORS restrictivo | Edge Functions |
| `API_PROVEEDOR_SECRET` | Staging/Prod | Auth API proveedor | Edge Functions |

### Entorno Supabase (staging/prod)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (o `SUPABASE_DB_URL` si aplica)

### Seguridad/operación
- `ALLOWED_ORIGINS`
- `API_PROVEEDOR_SECRET`

> Nota: Si existe `API_PROVEEDOR_READ_MODE` / `SCRAPER_READ_MODE`, definirlos según política de seguridad (normalmente `anon`).

---

## 2) Cómo obtener secretos desde Supabase (paso a paso)

### 2.1 Acceder al proyecto correcto
1. Entra a https://app.supabase.com
2. Selecciona el proyecto **staging** o **prod**.

### 2.2 Obtener URL del proyecto
1. Ir a **Project Settings → API**.
2. Copiar **Project URL** → usar como `SUPABASE_URL`.

### 2.3 Obtener API keys
1. En **Project Settings → API**.
2. Copiar:
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### 2.4 Obtener DATABASE_URL
1. Ir a **Project Settings → Database**.
2. En **Connection string** copiar la URL de conexión.
3. Usar como `DATABASE_URL`.
> Nota: si tu equipo usa `SUPABASE_DB_URL`, usar ese nombre en CI.

---

## 3) Secrets específicos del proyecto

### 3.1 ALLOWED_ORIGINS
1. Definir la lista de orígenes permitidos (prod/staging/local). Ejemplo:
   - `https://tu-dominio.com,https://staging.tu-dominio.com,http://localhost:5173`
2. Guardar en `ALLOWED_ORIGINS`.

### 3.2 API_PROVEEDOR_SECRET
1. Generar un secreto fuerte (mínimo 32 caracteres, ideal 64+).
2. Guardarlo como `API_PROVEEDOR_SECRET` en el entorno Supabase.
3. Rotarlo si se sospecha exposición.

---

## 4) Dónde registrar los secretos

### 4.1 Supabase (Edge Functions)
1. Ir a **Project Settings → Edge Functions → Secrets**.
2. Agregar:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `ALLOWED_ORIGINS`
   - `API_PROVEEDOR_SECRET`

### 4.2 CI/CD (GitHub Actions)
1. Ir a **Settings → Secrets and variables → Actions**.
2. Guardar en **Secrets**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `ALLOWED_ORIGINS`
   - `API_PROVEEDOR_SECRET`

3. Guardar en **Variables** (no secretos) si aplica:
   - `RUN_INTEGRATION_TESTS=true`
   - `RUN_E2E=true`

---

## 5) Validación mínima (sin exponer secretos)

1. Ejecutar en local un dry-run de integración:
   - `scripts/run-integration-tests.sh --dry-run`
2. Verificar que no falten variables requeridas.
3. No imprimir secretos en logs.
4. Confirmar que el frontend **no** recibe `SUPABASE_SERVICE_ROLE_KEY`.

---

## 6) Seguridad y buenas prácticas

- No compartir secretos por chat.
- Rotar `API_PROVEEDOR_SECRET` si se expone.
- Restringir `ALLOWED_ORIGINS` a dominios reales.
- Mantener `SERVICE_ROLE_KEY` solo en backend/CI.
- No subir `.env` al repositorio.

---

## 7) Qué puedo hacer yo automáticamente

- Verificar en el repo qué variables faltan.
- Preparar scripts de validación sin exponer secretos.
- Ajustar documentación y checklist de cierre.

> Si me confirmas que ya cargaste los secretos, ejecuto las validaciones y actualizo evidencias.
