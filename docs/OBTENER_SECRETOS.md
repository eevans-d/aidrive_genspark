# Guia para obtener secretos (Mini Market)

**Fecha:** 2026-01-29  
**Estado:** Guia autosuficiente (no requiere leer otros archivos)  
**Proyecto Supabase:** minimarket-system (ref: dqaygmjpzoqjjrywdsxi)

---

## Objetivo
Esta guia explica, paso a paso y en lenguaje simple, como obtener y configurar **todos los secretos/credenciales** necesarios para desbloquear pruebas, despliegues y tareas pendientes. No requiere conocimientos avanzados.

> Si delegas la obtención en un asistente, genera el prompt en la sesión actual (no hay archivo fijo).

## Requisitos previos
- Acceso al proyecto en **Supabase Dashboard** (staging y/o prod).
- Acceso a **GitHub** con permisos para editar *Secrets* del repo.
- Acceso local para crear/editar `.env.test` (en tu maquina).

Si no tienes alguno de estos accesos, solicita permisos al responsable del proyecto.

---

## 1) Lista completa de secretos que debes obtener

### 1.1 Supabase (staging/prod)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (o `SUPABASE_DB_URL` si tu equipo usa alias)

### 1.2 Frontend (build/deploy)
- `VITE_SUPABASE_URL` (igual a `SUPABASE_URL`)
- `VITE_SUPABASE_ANON_KEY` (igual a `SUPABASE_ANON_KEY`)

### 1.3 API Proveedor (backend interno)
- `API_PROVEEDOR_SECRET` (minimo 32 caracteres, ideal 64+)

### 1.4 Usuarios de prueba (E2E auth real)
- `TEST_USER_ADMIN`
- `TEST_USER_DEPOSITO`
- `TEST_USER_VENTAS`
- `TEST_PASSWORD` (misma para los 3 usuarios)

### 1.5 Opcionales (solo si se usan modulos especificos)
- `SENDGRID_API_KEY` (emails)
- `TWILIO_AUTH_TOKEN` o `SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN` (SMS)
- `CAPTCHA_PROVIDER` y `CAPTCHA_API_KEY` (scraper si se habilita)
- `SEMGREP_APP_TOKEN` (Semgrep Cloud)
- `OPENAI_API_KEY` (si se activa integracion)

---

## 2) Paso a paso para obtener credenciales en Supabase

### 2.1 Entrar al proyecto correcto
1. Abre el dashboard: https://supabase.com/dashboard
2. Selecciona el proyecto **minimarket-system** (ref `dqaygmjpzoqjjrywdsxi`).
3. Verifica que estas en **staging** si vas a probar.

### 2.2 Obtener URL y keys del proyecto
1. Ve a **Project Settings → API**.
2. Copia y guarda:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY` (puede figurar en “Claves API” o “Claves API heredadas”)
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (normalmente en “Legacy API Keys / Claves API heredadas”)

### 2.3 Obtener DATABASE_URL
1. Ve a **Project Settings → Database**.
2. Busca **Connection string** y copia la URL completa.
3. Guarda el valor como `DATABASE_URL`.

---

## 3) Crear usuarios de prueba (Auth)

1. Ve a **Authentication → Users**.
2. Crea estos usuarios (o verifica que existan):
   - `admin@staging.minimarket.test`
   - `deposito@staging.minimarket.test`
   - `ventas@staging.minimarket.test`
3. Asigna **la misma contraseña** a los tres. Guardala como `TEST_PASSWORD`.

> Consejo: si el panel lo permite, marca el email como confirmado.

---

## 4) Generar API_PROVEEDOR_SECRET (seguro y facil)

Opcion simple (recomendada):
- Usa el generador de contraseñas de tu navegador/gestor de contraseñas y crea una cadena de 64 caracteres.

Opcion tecnica (si tienes terminal):
```bash
python - <<'PY'
import secrets
print(secrets.token_urlsafe(48))
PY
```
Guarda el resultado como `API_PROVEEDOR_SECRET`.

---

## 5) Cargar secretos en Supabase (Edge Functions)

1. Ve a **Project Settings → Edge Functions → Secrets**.
2. Crea o actualiza estos secretos (si no existen, crearlos manualmente con el nombre exacto):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `ALLOWED_ORIGINS` (ejemplo local: `http://localhost:5173,http://127.0.0.1:5173`; producción con dominio real confirmado por usuario 2026-02-01)
   - `API_PROVEEDOR_SECRET`

---

## 6) Cargar secretos en GitHub (CI/CD)

1. En GitHub, entra al repo → **Settings → Secrets and variables → Actions**.
2. En **Repository secrets**, agrega o actualiza:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `API_PROVEEDOR_SECRET`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## 7) Crear/actualizar `.env.test` local

En la raiz del repo, crea un archivo llamado `.env.test` con este contenido (sin comillas):

```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...

TEST_USER_ADMIN=admin@staging.minimarket.test
TEST_USER_DEPOSITO=deposito@staging.minimarket.test
TEST_USER_VENTAS=ventas@staging.minimarket.test
TEST_PASSWORD=...

API_PROVEEDOR_SECRET=...
```

**Importante:** no subas `.env.test` al repo.

---

## 8) Verificacion minima (sin riesgo)

Ejecuta estos comandos desde la raiz del repo:

```bash
bash migrate.sh status staging
bash scripts/run-integration-tests.sh --dry-run
cd minimarket-system && VITE_USE_MOCKS=false pnpm exec playwright test auth.real
```

- Si falla algo, revisa que las variables esten bien copiadas.
- No deberias ver secretos impresos en consola.

---

## 9) Checklist rapido (para saber que quedo listo)

- [ ] Tengo `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`.
- [ ] Cree/valide `TEST_USER_ADMIN`, `TEST_USER_DEPOSITO`, `TEST_USER_VENTAS`.
- [ ] Guarde `TEST_PASSWORD` y lo puse en `.env.test`.
- [ ] Configure `API_PROVEEDOR_SECRET` (64 caracteres ideal).
- [ ] Cargue secretos en Supabase (Edge Functions).
- [ ] Cargue secretos en GitHub (Actions).
- [ ] `.env.test` existe en mi maquina y no esta versionado.
- [ ] Corri las verificaciones minimas.

---

## Reglas de seguridad (muy importantes)
- Nunca pegues secretos en chats o issues.
- No hagas commits con `.env` o `.env.test`.
- El `SUPABASE_SERVICE_ROLE_KEY` **nunca** debe ir al frontend.
- Si sospechas exposicion, rota el secreto y actualiza Supabase + GitHub + `.env.test`.

---

## Datos de referencia (no sensibles)
- Supabase URL (staging/prod): `https://dqaygmjpzoqjjrywdsxi.supabase.co`
- Gateway API (prod): `https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket`
- Dashboard: https://supabase.com/dashboard/project/dqaygmjpzoqjjrywdsxi
