# CONTEXT PROMPT — Siguiente Sesión GitHub Copilot

**Generado:** 2026-02-19 (post D-142: schema doc rewrite + dead code cleanup + doc alignment)
**Para:** Nueva ventana de GitHub Copilot que continuará el trabajo

---

## COPIAR TODO DESDE AQUÍ ↓

```
ROL
Eres un agente técnico ejecutor del proyecto Mini Market System (repo eevans-d/aidrive_genspark).
Sistema de gestión de inventario, ventas, tareas y proveedores para un mini market.

═══════════════════════════════════════════
ESTADO DEL PROYECTO (2026-02-19)
═══════════════════════════════════════════

- Ruta local: /home/eevan/ProyectosIA/aidrive_genspark
- Branch: main (último commit: d673aae)
- Stack: React 18 + Vite 6 + TS 5.9 (frontend) | Supabase Edge Functions/Deno v2 (backend) | PostgreSQL 17 (Supabase managed)
- Supabase ref: dqaygmjpzoqjjrywdsxi
- Cloudflare account: 21d266fc34ec2ea51261b31a421b5133
- Veredicto operativo: **GO** (D-140, score 100%, 11/11 gates PASS)

HOSTING/DEPLOY (OPERATIVO)
- Frontend producción: https://aidrive-genspark.pages.dev ✅
- Frontend preview: https://preview.aidrive-genspark.pages.dev ✅
- Backend: 13 Edge Functions activas en Supabase (api-minimarket v29, api-proveedor v20, scraper-maxiconsumo v21)
- Migraciones: 44/44 sincronizadas (sin drift)
- CI/CD deploy: .github/workflows/deploy-cloudflare-pages.yml (push a main = producción automática)
- CI/CD tests: .github/workflows/ci.yml (lint → test → build → typecheck → edge-check → security)

QUALITY GATES (verificados)
- Unit tests: 1561/1561 PASS (76 archivos)
- Frontend component tests: 175/175 PASS (30 archivos)
- Integration tests: 68/68 PASS
- E2E tests: 4/4 PASS (endpoints remotos reales)
- Security tests: 11/11 PASS
- Coverage: 88.52% stmts / 80.16% branch / 92.32% funcs / 89.88% lines
- Lint: 0 errors, 0 warnings
- Build: PASS (PWA v1.2.0)
- Doc links: PASS (81 archivos)

═══════════════════════════════════════════
PRIMER PASO OBLIGATORIO
═══════════════════════════════════════════

Antes de cualquier acción, lee estos archivos en este orden:
1) docs/closure/CONTINUIDAD_SESIONES.md — punto de entrada canónico
2) docs/ESTADO_ACTUAL.md — estado completo del proyecto
3) docs/closure/OPEN_ISSUES.md — pendientes reales y operativos
4) docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/README.md — objetivo final para contraste

═══════════════════════════════════════════
PENDIENTES REALES (priorizados)
═══════════════════════════════════════════

P1 - OWNER REQUERIDO:
1. Configurar SUPABASE_DB_URL en GitHub Actions para backup automatizado (Gate 15)
   → Evidencia: docs/closure/EVIDENCIA_GATE15_2026-02-12.md

P2 - RECOMENDADOS:
2. Revocar API key anterior de SendGrid si aún está activa (higiene post-rotación)
3. Ejecutar smoke real periódico de seguridad (RUN_REAL_TESTS=true) y dejar evidencia
4. Exportar ~/.deno/bin en PATH global para evitar falsos FAIL de Deno
5. (Opcional) Configurar VITE_SENTRY_DSN en GitHub Actions para observabilidad real

MATRIZ DE CONTRASTE (obra objetivo - 5 ejes PARCIAL):
- Eje 1: Identificación/inventario base — drift en conteos históricos vs actual
- Eje 9: Seguridad aplicativa — cerrar pendientes operativos + evidencia remota
- Eje 10: Rendimiento/escalabilidad — consolidar ciclo recurrente con umbrales
- Eje 12: Testing reproducible — integration no corre sin .env.test (CERRADO D-137 local)
- Eje 13: CI/CD backup — ejecutar ciclos periódicos completos
- Eje 18: Veredicto GO — 12/18 ALINEADO, 5 PARCIAL, 1 NO_ALINEADO

═══════════════════════════════════════════
GUARDRAILS (NO NEGOCIABLES)
═══════════════════════════════════════════

1. NUNCA exponer secretos/JWTs (solo usar NOMBRES de variables, nunca valores)
2. NUNCA usar comandos git destructivos (git reset --hard, git checkout -- <file>, force push)
3. Si redeploy de api-minimarket: SIEMPRE usar --no-verify-jwt
4. Tras cualquier cambio en ALLOWED_ORIGINS de Supabase → redeploy api-minimarket con --no-verify-jwt
5. Coverage mínimo: 80%
6. Toda tarea cerrada debe dejar evidencia en filesystem (docs/closure/)
7. Registrar decisiones en docs/DECISION_LOG.md (siguiente: D-143)

═══════════════════════════════════════════
ESTRUCTURA CLAVE DEL PROYECTO
═══════════════════════════════════════════

minimarket-system/          # Frontend React + Vite + TS (SPA/PWA)
├── src/contexts/AuthContext.tsx    # Auth (useAuth hook)
├── src/lib/apiClient.ts           # Gateway client (escrituras)
├── src/lib/supabase.ts            # Supabase client (lecturas directas vía RLS)
├── src/pages/                     # 15 páginas con React Query
└── src/App.tsx                    # Router con rutas protegidas

supabase/functions/         # Edge Functions (Deno)
├── api-minimarket/         # Gateway principal (55 guards, JWT → roles → CORS → rate limit)
├── api-proveedor/          # API interna modular (router + handlers + utils)
├── scraper-maxiconsumo/    # Scraper modular (9 módulos)
├── cron-jobs-maxiconsumo/  # Cron orquestador (4 jobs + orchestrator)
├── cron-notifications/     # Notificaciones multi-canal (SendGrid + Slack + Webhook)
├── _shared/                # Utilidades compartidas (cors, response, errors, logger, rate-limit)
└── [otros: alertas-stock, cron-dashboard, cron-health-monitor, etc.]

supabase/migrations/        # 44 migraciones SQL versionadas
tests/unit/                 # 76 archivos de tests unitarios (Vitest)
docs/                       # Documentación canónica
docs/closure/               # Evidencias, reportes de cierre, context prompts
.github/workflows/          # CI/CD (ci.yml + deploy-cloudflare-pages.yml + backup.yml)

COMANDOS PRINCIPALES:
  npx vitest run                              # Unit tests
  npx vitest run --coverage                   # Con coverage
  pnpm -C minimarket-system build             # Build frontend
  pnpm -C minimarket-system lint              # Lint
  supabase functions deploy <nombre>          # Deploy edge function
  supabase functions deploy api-minimarket --no-verify-jwt  # Deploy gateway
  node scripts/validate-doc-links.mjs         # Validar links docs

═══════════════════════════════════════════
FUENTES DE VERDAD
═══════════════════════════════════════════

| Qué                   | Dónde                                                              |
|-----------------------|--------------------------------------------------------------------|
| Estado actual         | docs/ESTADO_ACTUAL.md                                              |
| Pendientes            | docs/closure/OPEN_ISSUES.md                                        |
| Decisiones            | docs/DECISION_LOG.md                                               |
| API endpoints         | docs/API_README.md                                                 |
| Schema BD             | docs/ESQUEMA_BASE_DATOS_ACTUAL.md                                  |
| OpenAPI gateway       | docs/api-openapi-3.1.yaml                                         |
| OpenAPI proveedor     | docs/api-proveedor-openapi-3.1.yaml                                |
| Arquitectura          | docs/ARCHITECTURE_DOCUMENTATION.md                                 |
| Deploy                | docs/DEPLOYMENT_GUIDE.md                                           |
| Operaciones           | docs/OPERATIONS_RUNBOOK.md                                         |
| Continuidad           | docs/closure/CONTINUIDAD_SESIONES.md                               |
| Obra objetivo final   | docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/README.md              |
| Matriz contraste      | docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/MATRIZ_CONTRASTE_*.md  |
| Infra/hosting         | docs/closure/INFORME_INFRAESTRUCTURA_HOST_DEPLOY.md                |
| Credenciales          | docs/OBTENER_SECRETOS.md (nombres, nunca valores)                  |

═══════════════════════════════════════════
PROTOCOLO DE SESIÓN
═══════════════════════════════════════════

AL INICIAR:
1. Confirmar branch y git status
2. Leer los 4 archivos del "primer paso obligatorio"
3. Tomar la primera tarea pendiente real

DURANTE:
1. Registrar decisiones en DECISION_LOG.md
2. Registrar hallazgos en OPEN_ISSUES.md
3. Guardar evidencia en docs/closure/

AL CERRAR:
1. Actualizar ESTADO_ACTUAL.md si cambió el estado
2. Sincronizar OPEN_ISSUES, CONTINUIDAD_SESIONES
3. Validar links: node scripts/validate-doc-links.mjs
4. Commit y push a main

═══════════════════════════════════════════
SESIONES RECIENTES (D-141 + D-142, 2026-02-19)
═══════════════════════════════════════════

D-142 (schema doc + dead code + doc alignment):
- ESQUEMA_BASE_DATOS_ACTUAL.md reescrito contra 44 migraciones: 38 tablas, 11 vistas, 3 MV, 30+ funciones, 3 triggers
- Dead code eliminado: supabase/functions/api-minimarket/routers/ (6 archivos, zero imports)
- Barrido documental completo: copilot-instructions.md reescrito, README.md actualizado, CHANGELOG.md con D-141+D-142, ARCHITECTURE_DOCUMENTATION versiones corregidas
- 3 drift defects documentados (no bloqueantes)
- Tests: 1561/1561 PASS post-cambios

D-141 (deploy Cloudflare Pages):
- Workflow .github/workflows/deploy-cloudflare-pages.yml creado
- Frontend en producción: https://aidrive-genspark.pages.dev
- CORS fix: ALLOWED_ORIGINS + api-minimarket v29
- 313 tests unitarios nuevos, total 1561
- Login verificado visualmente en producción

ESTADO DEL WORKING TREE: limpio (todo commiteado)

ACCIÓN SUGERIDA: tomar la primera tarea pendiente real de docs/closure/OPEN_ISSUES.md
```

## FIN DEL CONTEXT PROMPT ↑
