# Comet Browser Findings - Supabase Auth, DB y GCP OCR (2026-03-08)

## Contexto
- Fuente: outputs compartidos por el usuario tras ejecutar `PROMPT 1`, `PROMPT 2` y `PROMPT 5` de `docs/PROMPTS_COMET_HALLAZGOS_BROWSER.md`.
- Naturaleza de evidencia: `EXTERNAL_DASHBOARD` (verificada en navegador por Comet, no reproducible desde el filesystem del repo).
- Alcance: configuracion Auth de Supabase, ajustes operativos de base de datos y diagnostico externo de Google Cloud Vision para OCR.

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

### GCP OCR
- Proyecto nuevo creado por Comet: `aidrive-genspark` (`1030231636936`), pero **sin billing activo** y por tanto inutilizable para habilitar Vision API en este momento.
- Proyecto realmente usado por OCR hasta ahora: `gen-lang-client-0312126042` (`Nano banana pro`).
- En `gen-lang-client-0312126042`, **Cloud Vision API ya estaba habilitada**; el problema no era falta de enablement.
- La unica cuenta de facturacion detectada (`0156DA-EB3EB0-9C9339`) esta **cerrada/inactiva** tras expirar la prueba gratuita.
- La key `GCV_API_KEY` en el proyecto activo ya existia y tenia restricciones correctas:
  - API restriction: solo `Cloud Vision API`
  - Application restriction: ninguna
- En Supabase (`dqaygmjpzoqjjrywdsxi`), el secret `GCV_API_KEY` fue **reemplazado/actualizado** externamente con el valor confirmado desde Google Cloud.
- Diagnostico refinado: el timeout OCR observado (`504 OCR_TIMEOUT`) es **consistente con billing inactivo**, no con una key ausente o mal restringida.

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
- Activar billing en Google Cloud para la cuenta `0156DA-EB3EB0-9C9339` y vincularlo al proyecto OCR activo `gen-lang-client-0312126042`.
- Reejecutar `POST /facturas/{id}/extraer` una vez restablecido billing para confirmar salida del estado `OCR_TIMEOUT`.

## Clasificacion Protocol Zero
- `REAL`:
  - mitigacion frontend de expiracion de sesion
  - existencia de evidencia externa compartida
  - Cloud Vision API habilitada en el proyecto OCR activo
  - `GCV_API_KEY` existente con restricciones correctas
  - secret `GCV_API_KEY` actualizado externamente en Supabase
- `A_CREAR`:
  - credenciales CAPTCHA
  - allowlist de IPs para DB
  - reactivacion de billing GCP en la cuenta existente
- `NO_VERIFICABLE_DESDE_REPO`:
  - valor actual de `DATABASE_URL` en servicios externos
  - estado runtime post-billing del endpoint OCR hasta ejecutar un nuevo intento real
