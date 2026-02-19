# GUIA OPERATIVA - DEPLOY EN CLOUDFLARE PAGES

**Fecha:** 2026-02-19  
**Decision adoptada:** Cloudflare Pages (frontend estatico)

## 1. Conclusion ejecutiva

Para este repositorio, Cloudflare Pages es la opcion mas adecuada por:
- Frontend SPA puro (`minimarket-system/dist`).
- CDN global incluida.
- Operacion simple sin servidor persistente.
- Coste inicial bajo para trafico moderado.

## 2. Lo que ya quedo configurado en el repo

1. Fallback SPA para rutas de React Router:
- `minimarket-system/deploy/cloudflare/_redirects`

2. Headers base de seguridad/cache:
- `minimarket-system/deploy/cloudflare/_headers`

3. Script de deploy por CLI:
- `scripts/deploy-cloudflare-pages.sh`
- comando npm: `npm run deploy:cloudflare:pages`

4. Pipeline delegado por GitHub Actions:
- `.github/workflows/deploy-cloudflare-pages.yml`
- soporta `push` a `main` (produccion) y `workflow_dispatch` (preview/prod manual).

## 3. Parametros y variables que debes configurar

## 3.1 En GitHub (Settings -> Secrets and variables -> Actions)

### Secrets obligatorios
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Secret opcional
- `VITE_SENTRY_DSN`

### Variable/Secret de proyecto Pages
- `CLOUDFLARE_PAGES_PROJECT` (recomendado como Variable)
- alternativa: `CLOUDFLARE_PAGES_PROJECT` como Secret

### Variable opcional
- `VITE_API_GATEWAY_URL` (si no la defines, el frontend usa default `/api-minimarket`)

## 3.2 En Cloudflare Pages (Dashboard)

En Workers & Pages -> tu proyecto -> Settings -> Builds & deployments:

- Framework preset: `Vite` (o `None` con comando custom)
- Build command: `pnpm build:pages`
- Build output directory: `dist`
- Root directory: `minimarket-system`

## 4. Configuracion en Supabase que no debes omitir

El frontend desplegado en Pages cambiara de dominio. Debes actualizar:

1. `ALLOWED_ORIGINS` en Edge Functions para incluir:
- `https://<tu-proyecto>.pages.dev`
- `https://<tu-dominio-custom>` (si aplica)
- dominios locales que uses para desarrollo

2. Mantener `REQUIRE_ORIGIN=true` salvo necesidad puntual de integracion server-to-server.

3. Guardrail del proyecto:
- `api-minimarket` debe conservar `verify_jwt=false` en redeploy (`--no-verify-jwt`).

## 5. Flujo recomendado de despliegue (mas eficiente)

## 5.1 Opcion recomendada: GitHub Actions (delegacion completa)

1. Configuras secrets/variables una sola vez.
2. Haces push a `main` para produccion.
3. O ejecutas `workflow_dispatch` para preview/prod manual.

Ventaja: no depende de tener sesion local activa ni credenciales en tu maquina.

## 5.2 Opcion local por CLI (cuando quieras control manual)

Prerequisitos locales:
- `pnpm`
- `npx`
- autenticacion Wrangler (`wrangler login`) o token exportado

Variables minimas (nombres, no valores):
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Comando:

```bash
npm run deploy:cloudflare:pages
```

Preview branch:

```bash
bash scripts/deploy-cloudflare-pages.sh preview
```

## 6. Checklist de verificacion post-deploy

1. URL Pages responde HTTP 200.
2. Navegacion directa a rutas SPA funciona (ej: `/stock`, `/pedidos`).
3. Login y llamadas al gateway responden correctamente.
4. Sin errores CORS en browser.
5. PWA carga assets y service worker sin 404.
6. `api-minimarket` operativo y con guardrail de `verify_jwt=false`.

## 7. Rollback rapido

Si un deploy falla en produccion:

1. Desde Cloudflare Pages -> Deployments -> promover deployment previo estable.
2. Si el problema es de config del frontend:
- corrige variables de build en GitHub
- relanza workflow manual a preview
- valida
- relanza a produccion.

## 8. Delegacion desde esta sesion, MCP y VS Code Copilot

## 8.1 Desde esta sesion (Codex)

Puedo ejecutar el deploy completo desde aqui si hay autenticacion:
- `npx wrangler whoami` debe devolver sesion activa.
- ahora mismo en esta sesion no hay auth activa, por eso se dejo listo el pipeline y script.

## 8.2 MCP de Cloudflare

Para operativa de deploy de Pages, la via mas estable hoy en este repo es:
- **Wrangler CLI + GitHub Actions**.

Si quieres MCP, usalo como complemento (docs/observabilidad), no como reemplazo del deploy autenticado.

Referencias Cloudflare MCP (oficiales):
- Docs MCP: `https://docs.mcp.cloudflare.com/mcp`
- Observability MCP: `https://observability.mcp.cloudflare.com/mcp`

## 8.3 GitHub Copilot en VS Code (ventana paralela)

Copilot puede ayudarte a:
- editar workflow/scripts/docs
- generar checks
- preparar cambios para PR

Pero el despliegue real igualmente lo ejecuta:
- GitHub Actions (recomendado), o
- terminal local con Wrangler.

## 9. Comandos utiles

Validar auth Cloudflare local:

```bash
npx wrangler whoami
```

Deploy manual directo (sin script):

```bash
npx wrangler pages deploy minimarket-system/dist --project-name <CLOUDFLARE_PAGES_PROJECT> --branch main
```

Build local previa:

```bash
pnpm -C minimarket-system build:pages
```

## 10. Evidencia de archivos relacionados

- `.github/workflows/deploy-cloudflare-pages.yml`
- `scripts/deploy-cloudflare-pages.sh`
- `minimarket-system/deploy/cloudflare/_redirects`
- `minimarket-system/deploy/cloudflare/_headers`
- `docs/closure/INFORME_INFRAESTRUCTURA_HOST_DEPLOY.md`
