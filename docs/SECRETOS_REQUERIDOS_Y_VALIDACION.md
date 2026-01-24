# Secretos Requeridos y Validacion (Mini Market)

**Fecha:** 2026-01-23  
**Estado:** Checklist operativo (sin claves; solo valores no sensibles)  

---

## 1) Alcance

Este documento lista **que secretos obtener**, **donde obtenerlos** y **como validarlos** sin exponer claves. Solo incluye valores no sensibles ya existentes en el repo.

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
VITE_API_GATEWAY_URL=https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket
```

| Secreto | Entorno | Origen exacto | Se usa en | Donde guardar | Validacion |
|---|---|---|---|---|---|
| `SUPABASE_URL` | Staging/Prod | Supabase → Project Settings → API → Project URL | Backend/CI | Supabase Secrets + GitHub Actions | `scripts/run-integration-tests.sh --dry-run` |
| `SUPABASE_ANON_KEY` | Staging/Prod | Supabase → Project Settings → API → anon public | Backend/CI | Supabase Secrets + GitHub Actions | `npm run test:integration` (con `.env.test`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging/Prod | Supabase → Project Settings → API → service_role | Backend/CI | Supabase Secrets + GitHub Actions | `npm run test:integration` (con `.env.test`) |
| `DATABASE_URL` | Staging/Prod | Supabase → Project Settings → Database → Connection string | Ops/CI | GitHub Actions | `./migrate.sh status staging` |
| `ALLOWED_ORIGINS` | Staging/Prod | Definir por dominio real | Edge Functions | Supabase Secrets | Curl con Origin bloqueado/permitido |
| `API_PROVEEDOR_SECRET` | Staging/Prod | Generado por equipo | Edge Functions | Supabase Secrets | Tests de api-proveedor |
| `VITE_SUPABASE_URL` | Frontend | Igual a `SUPABASE_URL` | Frontend | `.env`/Vercel | `pnpm build` |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Igual a `SUPABASE_ANON_KEY` | Frontend | `.env`/Vercel | `pnpm build` |
| `VITE_API_GATEWAY_URL` | Frontend | URL gateway | Frontend | `.env`/Vercel | Smoke UI |
| `TEST_USER_*` + `TEST_PASSWORD` | Local | Supabase Auth (staging) | E2E auth real | `.env.test` local | `playwright test auth.real` |

> **Nota:** si algun secreto falta, detener ejecucion y reportar bloqueador.

---

## 4) Donde obtener cada valor (paso a paso)

### 4.1 Supabase (API)
1) Supabase Dashboard → Project Settings → API.  
2) Copiar **Project URL** → `SUPABASE_URL` y `VITE_SUPABASE_URL`.  
3) Copiar **anon public** → `SUPABASE_ANON_KEY` y `VITE_SUPABASE_ANON_KEY`.  
4) Copiar **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (solo backend/CI).

### 4.2 Supabase (Database)
1) Supabase Dashboard → Project Settings → Database.  
2) Copiar **Connection string** → `DATABASE_URL`.

### 4.3 Edge Functions
1) Project Settings → Edge Functions → Secrets.  
2) Cargar: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `ALLOWED_ORIGINS`, `API_PROVEEDOR_SECRET`.

### 4.4 GitHub Actions
1) Settings → Secrets and variables → Actions.  
2) Cargar como **Secrets**: mismas claves que Edge Functions.

---

## 5) Validacion minima (sin exponer secretos)

- `scripts/run-integration-tests.sh --dry-run` (valida variables requeridas).  
- `./migrate.sh status staging` (verifica migraciones).  
- `cd minimarket-system && VITE_USE_MOCKS=false pnpm exec playwright test auth.real` (auth real).

---

## 6) Lo que Codex puede y no puede hacer

- Codex **no** puede acceder a dashboards ni obtener secretos reales.  
- Codex puede verificar consistencia en docs y preparar validaciones sin exponer valores.  

---

## 7) Checklist de cierre (secrets)

- [ ] Secretos cargados en Supabase (Edge Functions).  
- [ ] Secretos cargados en GitHub Actions.  
- [ ] `.env.test` local actualizado y NO versionado.  
- [ ] Rotacion documentada en `docs/DECISION_LOG.md`.  
