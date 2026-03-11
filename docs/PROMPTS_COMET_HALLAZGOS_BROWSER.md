# Prompts para Comet — Hallazgos ejecutables desde el navegador

Este documento contiene **un prompt por plataforma** para que el asistente de navegador **Comet** ejecute las tareas pendientes identificadas en las auditorías de producción y seguridad del proyecto **aidrive_genspark** (minimarket-system).

**Uso:** Comparte **un solo prompt** a la vez con Comet. Cada prompt es autosuficiente y no requiere contexto adicional.

---

## PLATAFORMA 1: Supabase Dashboard

**URL base:** https://supabase.com/dashboard (inicia sesión con la cuenta del proyecto)

---

### PROMPT 1 — Supabase: Seguridad Auth y sesiones

```
Eres Comet, asistente de navegador. Tu tarea es configurar la seguridad de autenticación en el proyecto Supabase del minimarket-system (aidrive_genspark).

CONTEXTO: Es un sistema interno de gestión. El signup abierto permite que cualquiera cree cuentas; debe restringirse. Además, las sesiones sin timeout representan riesgo si un usuario deja la app abierta en un dispositivo compartido.

PASOS A EJECUTAR (en orden):

1. Navega a https://supabase.com/dashboard y selecciona el proyecto correspondiente (aidrive_genspark o el nombre que tenga en tu cuenta).

2. DESHABILITAR SIGNUP:
   - Ve a: Authentication → Providers (o Configuration → Auth)
   - Localiza la sección "Email" (o "Email provider")
   - Desactiva el toggle "Enable email signup" / "Allow new users to sign up"
   - Si existe un toggle global "Enable signups", desactívalo también
   - Guarda los cambios

3. HABILITAR CAPTCHA (protección contra bots):
   - En Authentication → Providers (o Configuration → Auth)
   - Busca la sección "Captcha" o "Bot protection"
   - Activa el proveedor disponible (hCaptcha o Cloudflare Turnstile según lo que ofrezca Supabase)
   - Si requiere Site Key y Secret: obtén las credenciales del proveedor (hCaptcha: https://hcaptcha.com, Turnstile: https://dash.cloudflare.com → Turnstile)
   - Introduce Site Key y Secret en los campos correspondientes
   - Guarda los cambios

4. CONFIGURAR SESSION TIMEOUTS:
   - En Authentication → Configuration (o Settings)
   - Busca "Session timeout", "JWT expiry" o "Session management"
   - Configura:
     - "Timebox" o "Force log out after": 24h (o el valor que prefieras para cerrar sesión tras X tiempo)
     - "Inactivity timeout": 8h (cierra sesión si el usuario está inactivo X tiempo)
   - Si no existe esta sección en la UI, documenta que debe configurarse vía config.toml en el repo (auth.sessions.timebox / inactivity_timeout)
   - Guarda los cambios

5. VERIFICACIÓN:
   - Confirma que "Enable signup" está OFF
   - Confirma que Captcha está ON (si se configuró)
   - Confirma que los timeouts están aplicados
   - Toma captura de pantalla o anota los valores finales para documentar

RESULTADO ESPERADO: Signup deshabilitado, CAPTCHA activo (si el plan lo permite), y sesiones con timeout configurado. Los nuevos usuarios solo podrán crearse por invitación (invite) desde el dashboard.
```

---

### PROMPT 2 — Supabase: Connection pooler y restricciones de red

```
Eres Comet, asistente de navegador. Tu tarea es habilitar el connection pooler y las restricciones de red para la base de datos del proyecto Supabase (aidrive_genspark / minimarket-system).

CONTEXTO: En producción, el connection pooler reduce la carga en PostgreSQL y mejora la escalabilidad. Las restricciones de red limitan qué IPs pueden conectarse a la base de datos, reduciendo superficie de ataque.

PASOS A EJECUTAR (en orden):

1. Navega a https://supabase.com/dashboard y selecciona el proyecto.

2. CONNECTION POOLER:
   - Ve a: Project Settings → Database (o Database → Connection string)
   - Busca "Connection pooler" o "Pooler"
   - Si está disponible (Supabase Pro/Team puede requerirlo):
     - Activa el connection pooler
     - Anota la URL de conexión "pooler" (puerto 6543) para uso en producción
     - Modo recomendado: "Transaction" para serverless/Edge Functions
   - Si no aparece la opción: verifica el plan (Free puede no incluir pooler) y documenta que está pendiente

3. NETWORK RESTRICTIONS:
   - Ve a: Project Settings → Database → Network restrictions (o Database → Settings)
   - Busca "Restrict database access" o "Allowed IP addresses"
   - Activa las restricciones de red
   - Configura las IPs permitidas:
     - Si conoces la IP del servidor de Edge Functions / CI: añádela
     - Si usas Cloudflare Pages: considera las IPs de Cloudflare o deja un rango amplio inicialmente
     - Para desarrollo: puedes añadir tu IP actual
   - IMPORTANTE: No bloquees 0.0.0.0/0 si no tienes IPs concretas; primero documenta las IPs necesarias y luego restringe
   - Guarda los cambios

4. VERIFICACIÓN:
   - Confirma que el pooler está activo (si aplica)
   - Confirma que las restricciones están configuradas
   - Anota cualquier URL o configuración nueva para el equipo

RESULTADO ESPERADO: Connection pooler habilitado para producción y restricciones de red configuradas según las IPs conocidas del proyecto.
```

---

## PLATAFORMA 2: Cloudflare Dashboard

**URL base:** https://dash.cloudflare.com

---

### PROMPT 3 — Cloudflare: Headers de seguridad COOP, COEP, CORP

```
Eres Comet, asistente de navegador. Tu tarea es agregar los headers de seguridad COOP, COEP y CORP al sitio desplegado en Cloudflare Pages (proyecto minimarket-system / aidrive-genspark).

CONTEXTO: Estos headers protegen contra ataques de cross-origin (Cross-Origin-Opener-Policy, Cross-Origin-Embedder-Policy, Cross-Origin-Resource-Policy). Actualmente el sitio usa _headers en el repo, pero Cloudflare permite añadirlos también vía Transform Rules para mayor control.

PASOS A EJECUTAR (en orden):

1. Navega a https://dash.cloudflare.com e inicia sesión.

2. Selecciona la cuenta y el dominio/proyecto donde está desplegado el frontend (Cloudflare Pages → aidrive-genspark o similar).

3. AÑADIR HEADERS CON TRANSFORM RULES:
   - Ve a: Rules → Transform Rules (o Configuration → Rules)
   - Clic en "Create rule" → "Modify response header"
   - Nombre: "Security headers COOP COEP CORP"
   - Cuando aplicar: "All incoming requests" (o el hostname del sitio si prefieres restringir)
   - Añade los siguientes headers (uno por campo):
     - Header name: Cross-Origin-Opener-Policy
       Header value: same-origin
     - Header name: Cross-Origin-Embedder-Policy
       Header value: require-corp
     - Header name: Cross-Origin-Resource-Policy
       Header value: same-origin
   - NOTA: Si "require-corp" rompe recursos externos (ej. Supabase, Sentry), usa "credentialless" en COEP:
     - Cross-Origin-Embedder-Policy: credentialless
   - Guarda y despliega la regla

4. VERIFICACIÓN:
   - Visita la URL de producción del sitio (ej. https://aidrive-genspark.pages.dev)
   - Abre DevTools → Network → selecciona el documento principal → Headers → Response Headers
   - Confirma que aparecen: Cross-Origin-Opener-Policy, Cross-Origin-Embedder-Policy, Cross-Origin-Resource-Policy
   - Si algo no carga (imágenes, scripts externos), cambia COEP a "credentialless" y vuelve a verificar

RESULTADO ESPERADO: Los tres headers de seguridad están presentes en todas las respuestas del sitio en producción.
```

---

## PLATAFORMA 3: GitHub (interfaz web)

**URL base:** https://github.com (repositorio del proyecto)

---

### PROMPT 4 — GitHub: Pin de Actions a SHA y frozen-lockfile en Nightly

```
Eres Comet, asistente de navegador. Tu tarea es modificar los workflows de GitHub Actions del repositorio aidrive_genspark para mejorar la seguridad y reproducibilidad de los builds.

CONTEXTO: Usar @v4 en las acciones hace que cada ejecución pueda obtener una versión distinta si el tag se actualiza. Pinnear al SHA garantiza builds reproducibles. Además, el workflow nightly-gates usa "pnpm install --prefer-offline" en lugar de "--frozen-lockfile", lo que puede instalar versiones no fijadas en el lockfile.

PASOS A EJECUTAR (en orden):

1. Navega a https://github.com y abre el repositorio del proyecto (aidrive_genspark o la ruta completa según tu org).

2. OBTENER SHAs DE ACCIONES:
   - Para cada acción usada, visita su página de releases y obtén el SHA del commit de la última release v4:
     - actions/checkout: https://github.com/actions/checkout/releases → clic en v4.x.x → copia el SHA corto (7 chars) o completo (40 chars)
     - actions/setup-node: https://github.com/actions/setup-node/releases
     - pnpm/action-setup: https://github.com/pnpm/action-setup/releases
     - actions/upload-artifact: https://github.com/actions/upload-artifact/releases
     - actions/cache: https://github.com/actions/cache/releases
     - supabase/setup-cli: https://github.com/supabase/setup-cli/releases
   - Formato a usar: uses: owner/repo@<SHA_COMPLETO>

3. EDITAR .github/workflows/ci.yml:
   - Ve a la carpeta .github/workflows
   - Abre ci.yml
   - Clic en el ícono de editar (lápiz)
   - Reemplaza TODAS las ocurrencias de @v4, @v5, @v1 por @<SHA> correspondiente
   - Ejemplo: - uses: actions/checkout@v4  →  - uses: actions/checkout@b4ffde65f4ce4d9551beb0c4e6b4a5e8e8e8e8e8
   - Haz lo mismo para deploy-cloudflare-pages.yml, nightly-gates.yml, security-nightly.yml, backup.yml (si existen)
   - Commit: "chore(ci): pin GitHub Actions to commit SHA for reproducibility"

4. EDITAR .github/workflows/nightly-gates.yml:
   - Abre el archivo
   - Busca la línea: run: pnpm install --prefer-offline
   - Reemplázala por: run: pnpm install --frozen-lockfile
   - Asegúrate de que el working-directory sea minimarket-system (ya está en el paso "Install frontend dependencies")
   - Commit: "chore(ci): use frozen-lockfile in nightly gates"

5. VERIFICACIÓN:
   - Tras el push, revisa que el workflow CI se dispare y pase
   - Revisa que nightly-gates (si se ejecuta manualmente) también pase
   - Confirma que no hay errores de "action not found" por SHA inválido

RESULTADO ESPERADO: Todas las acciones usan SHA en lugar de tag, y nightly-gates usa --frozen-lockfile para instalaciones deterministas.
```

---

## PLATAFORMA 4: Google Cloud Console

**URL base:** https://console.cloud.google.com

---

### PROMPT 5 — Google Cloud: Habilitar Cloud Vision API y configurar API Key

```
Eres Comet, asistente de navegador. Tu tarea es habilitar la API de Google Cloud Vision y configurar una API Key restringida para el proyecto aidrive_genspark (módulo OCR de facturas).

CONTEXTO: El módulo OCR de facturas usa Google Cloud Vision (GCV) para extraer texto de imágenes y PDFs. Actualmente GCV_API_KEY no responde (timeout) — típicamente por: API no habilitada, billing inactivo, o restricciones incorrectas en la key.

PASOS A EJECUTAR (en orden):

1. Navega a https://console.cloud.google.com e inicia sesión con la cuenta que tenga permisos de billing y administración del proyecto.

2. SELECCIONAR O CREAR PROYECTO:
   - En el selector de proyectos (arriba), selecciona el proyecto asociado a aidrive_genspark
   - Si no existe, crea uno: "Select project" → "New Project" → nombre "aidrive-genspark" o similar

3. HABILITAR CLOUD VISION API:
   - Ve a: APIs & Services → Library (o busca "Cloud Vision API")
   - Busca "Cloud Vision API"
   - Clic en "Enable" / "Habilitar"
   - Espera a que se habilite

4. HABILITAR BILLING:
   - Ve a: Billing → Link a billing account
   - Si el proyecto no tiene billing, enlázalo a una cuenta de facturación
   - Cloud Vision tiene tier gratuito (1000 requests/mes) pero requiere billing activo para funcionar

5. CREAR O CONFIGURAR API KEY:
   - Ve a: APIs & Services → Credentials
   - Si ya existe una API Key para este proyecto:
     - Clic en la key → Restrict key
     - En "API restrictions": selecciona "Restrict key" y marca solo "Cloud Vision API"
     - En "Application restrictions" (opcional pero recomendado): restringe por IP o por HTTP referrer si conoces el dominio de las Edge Functions (ej. *.supabase.co)
   - Si no existe:
     - Clic en "Create credentials" → "API key"
     - Copia la key generada (guárdala en Supabase Edge Function secrets como GCV_API_KEY)
     - Clic en "Restrict key" y aplica las restricciones anteriores

6. VERIFICAR EN SUPABASE:
   - La key debe estar en Supabase Dashboard → Project Settings → Edge Functions → Secrets como GCV_API_KEY
   - Si no está, añádela manualmente

7. VERIFICACIÓN:
   - Tras configurar, el equipo puede probar el endpoint OCR (POST /facturas/extraer) con una imagen
   - Si sigue timeout: revisa firewall, cuotas de la API, y que la key tenga permisos correctos

RESULTADO ESPERADO: Cloud Vision API habilitada, billing activo, API Key creada/restringida y guardada en Supabase secrets. El OCR de facturas debería responder correctamente.
```

---

## Resumen de plataformas y prompts

| # | Plataforma        | Prompt | Hallazgo principal                          |
|---|-------------------|--------|---------------------------------------------|
| 1 | Supabase          | 1      | Deshabilitar signup, CAPTCHA, session timeouts |
| 2 | Supabase          | 2      | Connection pooler, network restrictions     |
| 3 | Cloudflare        | 3      | Headers COOP, COEP, CORP                    |
| 4 | GitHub            | 4      | Pin Actions a SHA, frozen-lockfile nightly  |
| 5 | Google Cloud      | 5      | Cloud Vision API, billing, API Key          |

---

## Notas para el usuario

- **Orden sugerido:** Ejecuta los prompts en el orden indicado si hay dependencias (ej. Supabase antes de verificar flujos).
- **Credenciales:** Algunos pasos requieren que el usuario haya iniciado sesión previamente (Supabase, Cloudflare, GitHub, GCP).
- **Permisos:** Comet necesita permisos para modificar archivos en GitHub (editar workflows) si usas el Prompt 4.
- **Rollback:** Si algo falla, las configuraciones en dashboards suelen poder revertirse desde la misma UI.

---

*Documento generado el 2026-03-08. Referencia: docs/ESTADO_ACTUAL.md, auditorías de producción y seguridad.*
