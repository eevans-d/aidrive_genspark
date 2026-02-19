# INFORME TECNICO DE INFRAESTRUCTURA Y HOST DEPLOY

**Fecha de verificacion:** 2026-02-19  
**Repositorio:** `eevans-d/aidrive_genspark`  
**Base verificada:** rama local (`HEAD f0dffd9`, con cambios locales sin commit)

## 0. Resumen Ejecutivo

1. **Solo debes hostear el frontend estatico** (`minimarket-system/dist`).
2. El backend ya corre en Supabase (13 Edge Functions + PostgreSQL + Auth).
3. Las **3 alternativas mas eficientes** para tu caso son:
- **Cloudflare Pages** (recomendada por costo/rendimiento para SPA estatica).
- **Netlify** (muy buena DX y routing SPA simple).
- **Vercel** (excelente DX/previews, costo variable segun trafico).
4. El principal riesgo operativo no es de CPU/RAM, sino de configuracion:
- Fallback SPA (`/* -> /index.html`).
- `ALLOWED_ORIGINS` y `REQUIRE_ORIGIN` en Edge Functions.
- Build en modo correcto (`BUILD_MODE=prod`) para evitar sobrecarga innecesaria en frontend.

## 1. Verificacion Tecnica Contra Codigo

### 1.1 Stack y runtime

| Componente | Valor verificado | Evidencia |
|---|---|---|
| Node.js CI | `20` | `.github/workflows/ci.yml:32` |
| pnpm CI | `9` | `.github/workflows/ci.yml:33` |
| Python CI (skills lint) | `3.11` | `.github/workflows/ci.yml:102` |
| Deno runtime Edge | `2` (`v2.x` en CI) | `supabase/config.toml:335`, `.github/workflows/ci.yml:310` |
| Frontend | React + Vite SPA | `minimarket-system/package.json:96`, `minimarket-system/package.json:133` |
| DB | PostgreSQL 17 | `supabase/config.toml:34` |

### 1.2 Dependencias relevantes

| Area | Paquete | Version |
|---|---|---|
| UI base | `@radix-ui/*` (27 paquetes) | `minimarket-system/package.json:54-80` |
| Data fetching | `@tanstack/react-query` | `^5.90.17` |
| PWA | `vite-plugin-pwa` | `^1.2.0` |
| Monitoring frontend | `@sentry/react` | `^10.38.0` |
| Tipado | `typescript` | `~5.9.3` |
| Unit/component tests | `vitest` | `^4.0.17` |
| E2E frontend | `@playwright/test` | `^1.57.0` |

## 2. Arquitectura Real de Despliegue

| Capa | Estado real |
|---|---|
| Frontend | SPA estatica (Vite) |
| Backend | Supabase Edge Functions (serverless) |
| DB/Auth | Supabase gestionado |
| Servidor propio persistente | No requerido |
| Contenedores Docker | No encontrados en el repo |

Evidencias:
- No hay `Dockerfile` ni `docker-compose*.yml` en el arbol del proyecto (`rg --files` sin resultados).
- Build SPA en `minimarket-system/package.json:8-9`.

## 3. Edge Functions y Jobs (validado)

### 3.1 Edge Functions detectadas (13)

`alertas-stock`, `alertas-vencimientos`, `api-minimarket`, `api-proveedor`, `cron-dashboard`, `cron-health-monitor`, `cron-jobs-maxiconsumo`, `cron-notifications`, `cron-testing-suite`, `notificaciones-tareas`, `reportes-automaticos`, `reposicion-sugerida`, `scraper-maxiconsumo`.

Evidencia: `supabase/functions/` (conteo de directorios excluyendo `_shared`).

### 3.2 Cron jobs realmente desplegados por SQL

| Job | Cron expression | Timeout |
|---|---|---|
| `daily_price_update` | `0 2 * * *` | `300000 ms` |
| `weekly_trend_analysis` | `0 3 * * 0` | `600000 ms` |
| `realtime_change_alerts` | `*/15 * * * *` | `120000 ms` |
| `notificaciones-tareas_invoke` | `0 */2 * * *` | `10000 ms` |
| `alertas-stock_invoke` | `0 * * * *` | `10000 ms` |
| `reportes-automaticos_invoke` | `0 8 * * *` | `10000 ms` |

Evidencia: `supabase/cron_jobs/deploy_all_cron_jobs.sql:34`, `supabase/cron_jobs/deploy_all_cron_jobs.sql:63`, `supabase/cron_jobs/deploy_all_cron_jobs.sql:93`, `supabase/cron_jobs/deploy_all_cron_jobs.sql:113`, `supabase/cron_jobs/deploy_all_cron_jobs.sql:133`, `supabase/cron_jobs/deploy_all_cron_jobs.sql:153`.

### 3.3 Aclaracion importante

`maintenance_cleanup` **existe en catalogo de config**, pero **no aparece en el SQL de deploy** actual.

- Definido en: `supabase/functions/cron-jobs-maxiconsumo/config.ts:63-79`.
- No programado en: `supabase/cron_jobs/deploy_all_cron_jobs.sql`.

Esto implica que no esta activo por `pg_cron` salvo programacion manual adicional.

### 3.4 Cron opcional de refresh de vistas

El cron opcional de `fn_refresh_stock_views()` esta definido como:
- `7 * * * *` (no `0 * * * *`).

Evidencia: `supabase/migrations/20260208010000_add_refresh_stock_views_rpc_and_cron.sql:53`.

## 4. Timeouts y Comportamiento Operativo

| Componente | Valor |
|---|---|
| `api-minimarket` PostgREST | `DEFAULT_TIMEOUT = 10_000` |
| `notificaciones-tareas` PostgREST | `FETCH_TIMEOUT_MS = 8000` |
| `cron-dashboard` fetch interno | `FETCH_TIMEOUT_MS = 8_000` |
| Frontend API client | `DEFAULT_TIMEOUT_MS = 30_000` |
| Scraper timeout base | default `25000` (rango `5000-60000`) |
| Scraper retries | `maxRetries=5` global + `maxRetries=3` por fetch avanzado |

Evidencia:
- `supabase/functions/api-minimarket/helpers/supabase.ts:22`
- `supabase/functions/notificaciones-tareas/index.ts:14`
- `supabase/functions/cron-dashboard/index.ts:25`
- `minimarket-system/src/lib/apiClient.ts:13`
- `supabase/functions/scraper-maxiconsumo/config.ts:58-64`
- `supabase/functions/scraper-maxiconsumo/config.ts:163`
- `supabase/functions/scraper-maxiconsumo/anti-detection.ts:277`

## 5. Red y estadoful connections

- No se encontro uso de `WebSocket`, `EventSource` ni canales realtime en frontend/backend (`rg` sin resultados en `minimarket-system/src` y `supabase/functions`).
- `realtime` esta habilitado en config de Supabase, pero no hay consumo aplicativo hoy.

Evidencia: `supabase/config.toml:75-76`.

## 6. Variables de Entorno que Impactan Hosting

### 6.1 Frontend (host estatico)

| Variable | Estado |
|---|---|
| `VITE_SUPABASE_URL` | requerida en runtime frontend (si no mocks) |
| `VITE_SUPABASE_ANON_KEY` | requerida en runtime frontend (si no mocks) |
| `VITE_API_GATEWAY_URL` | opcional (default `/api-minimarket`) |
| `VITE_USE_MOCKS` | opcional |
| `VITE_SENTRY_DSN` | opcional |
| `VITE_BUILD_ID` | opcional |

Evidencia: `minimarket-system/src/lib/supabase.ts:4-13`, `minimarket-system/src/lib/apiClient.ts:9-10`.

### 6.2 Edge Functions (en Supabase, no en tu host)

Variables operativas relevantes detectadas:
- `ALLOWED_ORIGINS`
- `REQUIRE_ORIGIN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `API_PROVEEDOR_SECRET`
- `NOTIFICATIONS_MODE`
- `SMTP_FROM` / `EMAIL_FROM`

Nota critica de despliegue: `api-minimarket` debe mantenerse con `verify_jwt=false` si se redeploya (`--no-verify-jwt`) segun politica del proyecto.

Evidencia: `docs/AGENTS.md:30`, `docs/ESTADO_ACTUAL.md:222`.

## 7. Top 3 Alternativas de Hosting (seleccion optimizada)

| Ranking | Plataforma | Ajuste con este repo | Pros clave | Consideraciones |
|---|---|---|---|---|
| 1 | **Cloudflare Pages** | Excelente para SPA Vite + CDN global | costo inicial muy bajo, edge global, buen rendimiento | configurar fallback SPA y vars de build |
| 2 | **Netlify** | Excelente para SPA y previews | routing SPA simple (`_redirects`), DX madura | revisar limites del plan segun trafico |
| 3 | **Vercel** | Muy buena para frontend puro | previews por PR, integracion GitHub fluida | costo puede crecer mas rapido en ciertos patrones |

## 8. Requisitos Minimos del Host Elegido

1. Build command: `cd minimarket-system && pnpm build:pages`.
2. Publish dir: `minimarket-system/dist`.
3. SPA fallback obligatorio: `/* -> /index.html`.
4. Servir correctamente assets PWA y service worker.
5. Configurar vars `VITE_*` en el entorno de build.
6. Agregar dominio final del frontend en `ALLOWED_ORIGINS` de Edge Functions.

## 9. Ajustes Aplicados a Este Informe

1. Se elimino contenido residual no tecnico al inicio del archivo.
2. Se corrigio corrupcion de caracteres en el diagrama CI y se normalizo redaccion.
3. Se corrigio discrepancia de cron `maintenance_cleanup` (definido en config pero no programado en SQL actual).
4. Se corrigio cron opcional de refresh de vistas a `7 * * * *`.
5. Se reemplazo enfoque basado en links fijos a commit antiguo por evidencia local verificable.
6. Se actualizo la recomendacion final a un top 3 accionable para decision de hosting.

## 10. Conclusión

La arquitectura actual esta bien preparada para **hosting estatico puro**. No necesitas VM, contenedores ni backend propio para publicar el sistema. La decision real de plataforma puede tomarse por costo/operacion, no por limitaciones tecnicas.

Recomendacion final:
1. Cloudflare Pages si priorizas costo-rendimiento.
2. Netlify si priorizas simplicidad operativa en SPA.
3. Vercel si priorizas experiencia de previews y flujo frontend.

Implementacion elegida y guia operativa:
- `docs/closure/GUIA_DEPLOY_CLOUDFLARE_PAGES_2026-02-19.md`
