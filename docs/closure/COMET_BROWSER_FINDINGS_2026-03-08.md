# Comet Browser Findings - Supabase Auth y DB (2026-03-08)

## Contexto
- Fuente: outputs compartidos por el usuario tras ejecutar `PROMPT 1` y `PROMPT 2` de `docs/PROMPTS_COMET_HALLAZGOS_BROWSER.md`.
- Naturaleza de evidencia: `EXTERNAL_DASHBOARD` (verificada en navegador por Comet, no reproducible desde el filesystem del repo).
- Alcance: configuracion Auth de Supabase y ajustes operativos de base de datos.

## Hallazgos confirmados en dashboard

### Auth
- `Signup` publico: **OFF**.
- `Confirm email`: **ON**.
- `CAPTCHA`: **PENDIENTE** por falta de credenciales del proveedor e integracion del widget en frontend.
- `Session timebox` / `inactivity timeout` nativos: **no disponibles en el plan actual del dashboard**.

### Database
- `Connection pooler` de Supabase (`Supavisor`): **activo**.
- Modo recomendado para servicios externos: **transaction pooler** (puerto `6543`).
- `Network restrictions`: **no configuradas**; la base directa sigue accesible desde todas las IPs hasta definir allowlist.

## Acciones derivadas

### Aplicado en este repo
- Se agrego mitigacion client-side para sesiones:
  - `timebox` por defecto: 24h
  - `inactivity timeout` por defecto: 8h
- Implementacion: `minimarket-system/src/contexts/AuthContext.tsx` + `minimarket-system/src/lib/authSessionPolicy.ts`
- Configuracion opcional: `VITE_AUTH_TIMEBOX_MS`, `VITE_AUTH_INACTIVITY_TIMEOUT_MS`
- Verificacion local:
  - `pnpm -C minimarket-system exec vitest run src/lib/__tests__/authSessionPolicy.test.ts src/contexts/AuthContext.test.tsx` -> **8/8 PASS**
  - `pnpm -C minimarket-system exec tsc --noEmit` -> **OK**

### Pendiente fuera del repo
- Crear credenciales CAPTCHA y conectar el widget en `minimarket-system/src/pages/Login.tsx`.
- Verificar fuera del filesystem que `DATABASE_URL` de Render/Railway/Vercel use el transaction pooler, no la conexion directa.
- Inventariar IPs salientes y aplicar `Network restrictions` sobre el host directo de PostgreSQL.

## Clasificacion Protocol Zero
- `REAL`:
  - mitigacion frontend de expiracion de sesion
  - existencia de evidencia externa compartida
- `A_CREAR`:
  - credenciales CAPTCHA
  - allowlist de IPs para DB
- `NO_VERIFICABLE_DESDE_REPO`:
  - valor actual de `DATABASE_URL` en servicios externos
