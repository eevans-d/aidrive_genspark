# Secretos Requeridos y Validacion (Mini Market)

**Fecha:** 2026-01-29  
**Estado:** Checklist operativo (sin claves; solo valores no sensibles)  

---

## 1) Alcance

Este documento lista **que secretos obtener**, **donde obtenerlos** y **como validarlos** sin exponer claves. Solo incluye valores no sensibles ya existentes en el repo.

**Estado actual confirmado (repo):**
- URLs de Supabase y gateway ya definidas (no sensibles).
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `DATABASE_URL` obtenidos desde Supabase (2026-01-29, sin exponer valores).
- `API_PROVEEDOR_SECRET` y `ALLOWED_ORIGINS` creados/cargados en Edge Functions (2026-01-29).
- `SUPABASE_*` claves cargadas en `.env`/CI (según reporte COMET, sin exponer valores).
- `TEST_PASSWORD` sincronizado en Supabase Auth (usuarios E2E).
- Validaciones mínimas ejecutadas (2026-01-29): `migrate.sh status staging` OK; `run-integration-tests --dry-run` OK.
- Validación previa (2026-01-26): prerequisitos OK; E2E auth real OK (7/7).
- Claves reales siguen fuera de documentación y repositorio.

---

## 2) Reglas no negociables

- No guardar secretos en Git ni en archivos versionados.
- No compartir secretos por chat o correo.
- `SUPABASE_SERVICE_ROLE_KEY` nunca va al frontend.
- `.env.test` es **local** y debe estar en `.gitignore`.

---

## 3) Inventario de secretos (tabla unica)

### 3.1 Valores no sensibles conocidos (del repo)

```bash
SUPABASE_URL=https://dqaygmjpzoqjjrywdsxi.supabase.co
VITE_SUPABASE_URL=https://dqaygmjpzoqjjrywdsxi.supabase.co
# Producción
VITE_API_GATEWAY_URL=https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket
# Local (proxy)
VITE_API_GATEWAY_URL=/api-minimarket
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

| Secreto | Entorno | Origen exacto | Se usa en | Donde guardar | Validacion | Owner | Rotacion |
|---|---|---|---|---|---|---|---|
| `SUPABASE_URL` | Staging/Prod | Supabase → Project Settings → API → Project URL | Backend/CI | Supabase Secrets + GitHub Actions | `scripts/run-integration-tests.sh --dry-run` | eevans-d | N/A (cambia con proyecto) |
| `SUPABASE_ANON_KEY` | Staging/Prod | Supabase → Project Settings → API → anon public | Backend/CI | Supabase Secrets + GitHub Actions | `npm run test:integration` (con `.env.test`) | eevans-d | 180d |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging/Prod | Supabase → Project Settings → API → service_role | Backend/CI | Supabase Secrets + GitHub Actions | `npm run test:integration` (con `.env.test`) | eevans-d | 90d |
| `DATABASE_URL` | Staging/Prod | Supabase → Project Settings → Database → Connection string (alias `SUPABASE_DB_URL`) | Ops/CI | GitHub Actions | `./migrate.sh status staging` | eevans-d | 90d |
| `ALLOWED_ORIGINS` | Staging/Prod | Lista definida (local dev) | Edge Functions | Supabase Secrets | Curl con Origin bloqueado/permitido | eevans-d | N/A (cambio controlado) |
| `API_PROVEEDOR_SECRET` | Staging/Prod | Generado por equipo | Edge Functions | Supabase Secrets | Tests de api-proveedor | eevans-d | 90d |
| `VITE_SUPABASE_URL` | Frontend | Igual a `SUPABASE_URL` | Frontend | `.env`/Vercel | `pnpm build` | eevans-d | N/A (cambia con proyecto) |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Igual a `SUPABASE_ANON_KEY` | Frontend | `.env`/Vercel | `pnpm build` | eevans-d | 180d |
| `VITE_API_GATEWAY_URL` | Frontend | URL gateway | Frontend | `.env`/Vercel | Smoke UI | eevans-d | N/A (cambio controlado) |
| `TEST_USER_*` + `TEST_PASSWORD` | Local | Supabase Auth (staging) | E2E auth real | `.env.test` local | `playwright test auth.real` | eevans-d | On reset |

> **Nota:** si algun secreto falta, detener ejecucion y reportar bloqueador.

---

## 4) Manual paso a paso por secreto

### 4.1 `SUPABASE_URL` + `VITE_SUPABASE_URL`
1) Abrir Supabase Dashboard y elegir el proyecto correcto (staging/prod).
2) Ir a Project Settings → API.
3) Copiar **Project URL**.
4) Guardar como `SUPABASE_URL` y `VITE_SUPABASE_URL`.

### 4.2 `SUPABASE_ANON_KEY` + `VITE_SUPABASE_ANON_KEY`
1) En Project Settings → API, ubicar **anon public**.
2) Copiar el valor.
3) Guardar como `SUPABASE_ANON_KEY` y `VITE_SUPABASE_ANON_KEY`.
4) Confirmar que se use solo en frontend/lecturas.

### 4.3 `SUPABASE_SERVICE_ROLE_KEY`
1) En Project Settings → API, ubicar **service_role**.
2) Copiar el valor.
3) Guardar SOLO en Supabase Edge Functions y GitHub Actions.
4) Verificar que no exista en frontend ni en archivos versionados.

### 4.4 `DATABASE_URL`
1) Ir a Project Settings → Database.
2) Copiar **Connection string** (del entorno correcto).
3) Guardar como `DATABASE_URL` en CI/operacion.
4) Si en Supabase Secrets figura como `SUPABASE_DB_URL`, usar ese nombre (alias aceptado).

### 4.5 `ALLOWED_ORIGINS`
1) Valor vigente (lista exacta, sin wildcard): `http://localhost:5173,http://127.0.0.1:5173`.
2) Guardar la lista exacta en Edge Functions y GitHub Actions.
3) Si se agrega dominio publico, registrar el cambio en `docs/DECISION_LOG.md` y actualizar en Supabase/CI.

### 4.6 `API_PROVEEDOR_SECRET`
1) Generar un secreto fuerte: `openssl rand -hex 32`.
2) Guardar en Edge Functions y CI.
3) Registrar rotacion cuando se actualice.

### 4.7 `VITE_API_GATEWAY_URL`
1) Construir URL: `https://<ref>.supabase.co/functions/v1/api-minimarket`.
2) Para local, usar `/api-minimarket` (proxy) o `http://localhost:54321/functions/v1/api-minimarket` si se expone directo.
3) Guardar en `.env`/Vercel.

### 4.8 `TEST_USER_*` + `TEST_PASSWORD` (E2E auth real)
1) Ir a Supabase Dashboard → Auth → Users.
2) Verificar usuarios staging (admin, deposito, ventas) o crearlos si faltan.
3) Definir password y guardarlo en `.env.test` local (no versionar).
4) Confirmar que cada usuario tenga registro en tabla `personal`.

### 4.9 Donde registrar/guardar (resumen)
1) Supabase → Project Settings → Edge Functions → Secrets.  
2) Cargar: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `ALLOWED_ORIGINS`, `API_PROVEEDOR_SECRET`.  
3) GitHub Actions → Settings → Secrets and variables → Actions.  
4) Cargar como **Secrets**: mismas claves que Edge Functions.  

---

## 5) Validacion minima (sin exponer secretos)

1) `scripts/run-integration-tests.sh --dry-run` (valida variables requeridas).  
2) `./migrate.sh status staging` (verifica migraciones, si hay acceso).  
3) `cd minimarket-system && VITE_USE_MOCKS=false pnpm exec playwright test auth.real` (auth real).  
4) No imprimir valores en consola ni logs.

### 5.1 Registro de validacion (2026-01-29)
- `./migrate.sh status staging` → OK (sin errores de conexión ni migraciones bloqueantes).
- `scripts/run-integration-tests.sh --dry-run` → OK (variables reconocidas).

### 5.2 Registro de validacion (2026-01-26)
- `scripts/run-integration-tests.sh --dry-run` → OK (prerequisitos verificados).
- `bash migrate.sh status staging` → OK (migraciones listadas; README movido a `docs/db/`).
- `cd minimarket-system && VITE_USE_MOCKS=false pnpm exec playwright test auth.real` → OK (7/7 PASS).

---

## 6) Lo que Codex puede y no puede hacer

- Codex **no** puede acceder a dashboards ni obtener secretos reales.  
- Codex puede verificar consistencia en docs y preparar validaciones sin exponer valores.  
 - Para delegar obtención en Supabase, usar `docs/COMET_PROMPT_SUPABASE_SECRETOS.md`.

---

## 7) Checklist de cierre (secrets)

**Estado operativo (2026-01-29):**
- Secretos Supabase obtenidos y cargados en Edge Functions (según reporte COMET).
- `TEST_PASSWORD` sincronizado en Supabase Auth (2026-01-26).

- [x] Secretos cargados en Supabase (Edge Functions) — 2026-01-29.  
- [x] Secretos cargados en CI (GitHub Actions o equivalente) — 2026-01-29 (según COMET).  
- [x] `.env.test` local actualizado y NO versionado (verificado 2026-01-26).  
- [x] Rotacion documentada en `docs/DECISION_LOG.md`.  
- [x] Owners definidos y responsables asignados.  
