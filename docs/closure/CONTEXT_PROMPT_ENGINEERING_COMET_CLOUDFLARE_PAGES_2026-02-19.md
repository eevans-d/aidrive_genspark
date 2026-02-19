# CONTEXT PROMPT ENGINEERING — COMET (BROWSER ASSISTANT)

## Rol esperado de Comet

Actúa como **operador de plataforma Cloudflare/GitHub** para validaciones desde dashboard y ajustes no disponibles por CLI local.

## Contexto del proyecto

- Repo: `eevans-d/aidrive_genspark`
- Frontend: `minimarket-system` (React + Vite + TypeScript)
- Estrategia de hosting: **Cloudflare Pages** (preview + producción)
- Fecha de referencia: **2026-02-19**

## Estado actual (ya realizado)

1. Workflow remoto activo en GitHub Actions:
   - `Deploy Frontend to Cloudflare Pages`
2. Secrets/variables requeridos ya configurados en GitHub Actions (solo nombres):
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_PAGES_PROJECT`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_GATEWAY_URL` (configurada por Comet: apunta a gateway de Supabase)
3. Proyecto Pages creado:
   - `aidrive-genspark`
4. Deploys exitosos:
   - Preview run: `22169188933` (success)
   - Production run: `22169213093` (success)
   - Production run #4: `22169586975` (success — con `VITE_API_GATEWAY_URL`)
5. URLs operativas verificadas:
   - Producción: `https://aidrive-genspark.pages.dev`
   - Preview: `https://preview.aidrive-genspark.pages.dev`
6. Smoke test rutas SPA OK (HTTP 200):
   - `/`, `/login`, `/stock`, `/pedidos`, `/dashboard`, `/productos`
7. CORS resuelto:
   - `ALLOWED_ORIGINS` actualizado en Supabase por Comet
   - `api-minimarket` redeployada con `--no-verify-jwt` por Copilot
   - Preflight OPTIONS validado: `204` con `access-control-allow-origin` correcto para ambos dominios
8. Headers de seguridad validados en producción:
   - `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`
   - Assets: `Cache-Control: public, max-age=31536000, immutable`

## Objetivo de Comet

Realizar una **auditoría de plataforma** y completar **hardening operativo no bloqueante** directamente en Cloudflare/GitHub UI, sin romper despliegue actual.

## Restricciones críticas

1. **No exponer secretos** ni copiar valores en texto plano.
2. **No modificar** lógica funcional del frontend ni backend.
3. **No alterar** guardrail del proyecto:
   - si hay redeploy de `api-minimarket`, debe mantenerse `verify_jwt=false` (flag `--no-verify-jwt`).
4. Si una acción requiere decisión humana (dominio, DNS, billing), detenerse y reportar con checklist mínimo.

## Tareas exactas para ejecutar (orden obligatorio)

### T1) Validación Cloudflare Pages (Dashboard)

- Abrir Pages project `aidrive-genspark`.
- Verificar en *Builds & deployments*:
  - Production branch: `main`
  - Build command: `pnpm build:pages`
  - Build output directory: `dist`
  - Root directory: `minimarket-system`
- Verificar que preview deployments están habilitados.
- Confirmar que los últimos dos deployments (`preview` y `production`) figuran sanos.

**Salida esperada T1:** tabla PASS/FAIL con cada ítem y captura textual de estado (sin secretos).

### T2) Hardening de configuración en GitHub Actions

- Revisar que `CLOUDFLARE_PAGES_PROJECT` esté definido como Variable o Secret (si hay ambos, documentar cuál prevalece).
- Validar que no existan nombres duplicados/conflictivos para Cloudflare deploy.
- Confirmar que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén asignados a entorno de deploy usado por workflow.

**Salida esperada T2:** matriz de variables/secrets con estado `present/missing/conflict`.

### T3) Validación de runtime web (manual + headers)

- Abrir:
  - `https://aidrive-genspark.pages.dev`
  - `https://preview.aidrive-genspark.pages.dev`
- Navegar manualmente a:
  - `/`
  - `/stock`
  - `/pedidos`
- Confirmar que no hay 404 por routing SPA.
- Revisar headers básicos esperados:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` presente

**Salida esperada T3:** checklist PASS/FAIL por URL/ruta/header.

### T4) Observabilidad y mejoras opcionales (sin bloquear)

- Confirmar si conviene activar:
  - `VITE_SENTRY_DSN` (si existe proyecto Sentry real)
  - `VITE_API_GATEWAY_URL` explícita (si se desea evitar fallback `/api-minimarket`)
- Si falta info/valor, no inventar: listar como *owner input required*.

**Salida esperada T4:**
- Recomendación concreta por cada variable opcional: `activar ahora` / `dejar pendiente`.

### T5) Reporte final ejecutable

Entregar un informe breve con:
1. Estado general: `GREEN` / `YELLOW` / `RED`.
2. Hallazgos críticos (si existen).
3. Ajustes aplicados por Comet (exactos).
4. Pendientes exclusivos del owner (máx. 3).
5. Próximo comando sugerido para validar desde CLI local.

## Formato de respuesta requerido de Comet

- Máximo 35 líneas.
- En español.
- Sin secretos.
- Con secciones:
  - `Resumen`
  - `Validaciones`
  - `Cambios aplicados`
  - `Pendientes owner`
  - `Siguiente paso`

## Criterio de éxito

Se considera éxito si:
- Producción y preview siguen operativas,
- no se detectan regresiones de routing SPA,
- configuración de deploy permanece consistente,
- y cualquier pendiente queda claramente delimitado al owner con acciones mínimas.
