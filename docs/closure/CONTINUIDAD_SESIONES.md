# CONTINUIDAD DE SESIONES — Documento Maestro

**Proposito:** punto de entrada unico para retomar trabajo sin perder contexto.

**Ultima actualizacion:** 2026-02-17T08:40:00Z
**Sesion activa:** `.agent/sessions/current/SESSION_ACTIVE` (si existe)
**Branch recomendado:** `main`

---

## 1. Uso rapido

### Si eres un agente IA
1. Leer este documento completo.
2. Leer `docs/ESTADO_ACTUAL.md`.
3. Leer `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/README.md`.
4. Leer `docs/closure/OPEN_ISSUES.md`.
5. Ejecutar la primera tarea pendiente real del plan activo.
6. Registrar evidencias y actualizar docs canonicos al cierre.

### Si eres usuario
- Para abrir una ventana nueva, usar la plantilla de la seccion 7.

---

## 2. Estado global canónico

| Campo | Valor |
|-------|-------|
| Proyecto | Mini Market System |
| Stack | React/Vite/TS + Supabase Edge Functions/Deno + PostgreSQL |
| Ref Supabase | dqaygmjpzoqjjrywdsxi |
| Veredicto operativo | APROBADO (P0 cerrados/verificados) |
| Score | 92/100 operativo, 78/100 forense snapshot (pre-remediación P0; ver `docs/AUDITORIA_FORENSE_DEFINITIVA_2026-02-15.md`) |
| Tests | 1165/1165 PASS (root), 45 auxiliary PASS + 4 skipped, frontend build PASS |
| Edge Functions | 13 activas (`api-minimarket v27`, `api-proveedor v19`, `scraper-maxiconsumo v20`) |
| Migraciones | 43 local / 43 remoto (sincronizado) |

### Fuentes de verdad
- `docs/ESTADO_ACTUAL.md`
- `docs/closure/OPEN_ISSUES.md`
- `docs/DECISION_LOG.md`
- `docs/closure/README_CANONICO.md`
- `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/README.md`
- `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/MATRIZ_CONTRASTE_PREPROD_VS_OBJETIVO.md`
- `docs/AUDITORIA_FORENSE_DEFINITIVA_2026-02-15.md`

---

## 3. Plan activo

### 3.1 Pendientes reales (vigentes)

| # | Tarea | Prioridad | Estado | Tipo | Siguiente accion |
|---|-------|-----------|--------|------|------------------|
| 1 | Configurar `SUPABASE_DB_URL` para backup automatizado (Gate 15) | P1 | PENDIENTE (owner) | Config externa | Cargar secret en GitHub y ejecutar workflow (`docs/closure/EVIDENCIA_GATE15_2026-02-12.md`) |
| 2 | Revocar API key anterior de SendGrid (si sigue activa) | P2 | RECOMENDADO (owner) | Operacion externa | Ejecutar revocacion en SendGrid y dejar evidencia sin valores |
| 3 | Ejecutar smoke real periodico de seguridad (`RUN_REAL_TESTS=true`) | P2 | RECOMENDADO | QA/Operacion | Programar corrida nightly/pre-release y anexar evidencia en `docs/closure/` |
| 4 | ~~Definir matriz por entorno para canales opcionales (`WEBHOOK_URL`, `SLACK_WEBHOOK_URL`, `TWILIO_*`)~~ | P2 | ✅ CERRADO (D-121) | Config/operacion | Evidencia: `docs/closure/EVIDENCIA_CHANNEL_MATRIX_2026-02-16.md` |
| 5 | ~~Deuda tecnica: `Proveedores.test.tsx` sin `QueryClientProvider`~~ | P2 | ✅ CERRADO (D-117) | Frontend tests | — |
| 6 | ~~Pre-commit/lint-staged: resolucion `eslint` fuera de `minimarket-system/node_modules`~~ | P2 | ✅ CERRADO (D-117) | DX/Tooling | — |

### 3.2 Cierres recientes relevantes
- Pre-Mortem Hardening D-126: 17 fixes criticos implementados, migración SQL + 5 edge functions desplegadas en remoto (2026-02-17). Evidencia: `docs/closure/EVIDENCIA_DEPLOY_HARDENING_2026-02-17.md`.
- P0 seguridad (RLS + `search_path`) cerrado y verificado en remoto (2026-02-15).
- P2 `precios_proveedor` cerrado con migracion `20260216040000_rls_precios_proveedor.sql`.
- P2 CORS cosmético en `scraper-maxiconsumo` cerrado; deploy remoto `v19`.
- `.env.example` sincronizado con variables usadas (EnvAuditOps, 2026-02-16).
- DX fixes (D-117): `Proveedores.test.tsx` + `Pedidos.test.tsx` + `lint-staged` eslint resolution.

---

## 4. Registro breve de sesiones

| Fecha | Objetivo | Estado | Evidencia |
|-------|----------|--------|----------|
| 2026-02-17 | Deploy D-132 + drift documental + matriz contraste actualizada | COMPLETADA | D-132 en `docs/DECISION_LOG.md` |
| 2026-02-17 | Fase C Observabilidad: VULN-005/006/007 cerradas (D-131) | COMPLETADA | D-131 en `docs/DECISION_LOG.md` |
| 2026-02-17 | Validacion post-remediacion D-130 | COMPLETADA | `docs/closure/VALIDACION_POST_REMEDIACION_2026-02-17.md` |
| 2026-02-17 | Fase B Safety/Infra: VULN-003/004 + method enforcement + OpenAPI sync (D-129) | COMPLETADA | D-129 en `docs/DECISION_LOG.md` |
| 2026-02-17 | Unificacion canonica + remediacion VULN-001 (D-128) | COMPLETADA | `docs/closure/EVIDENCIA_UNIFICACION_CANONICA_2026-02-17.md` |
| 2026-02-17 | Deploy hardening D-126 (migración + 5 edge functions) | COMPLETADA | `docs/closure/EVIDENCIA_DEPLOY_HARDENING_2026-02-17.md` |
| 2026-02-17 | Pre-Mortem Hardening D-126 (17 fixes criticos) | COMPLETADA | D-126 en `docs/DECISION_LOG.md` |
| 2026-02-16 | Matriz canales opcionales por entorno (D-121) | COMPLETADA | `docs/closure/EVIDENCIA_CHANNEL_MATRIX_2026-02-16.md` |
| 2026-02-16 | Coverage global ≥80% (11 test files, 274 tests nuevos) | COMPLETADA | D-116, `test-reports/junit.xml` |
| 2026-02-16 | Cierre P2 remoto + sync documental/env | COMPLETADA | `docs/closure/EVIDENCIA_P2_FIXES_2026-02-16_REMOTE.md`, `docs/closure/ENV_AUDIT_2026-02-16_045120.md` |
| 2026-02-15 | Auditoria forense + remediaciones + limpieza | COMPLETADA | `docs/AUDITORIA_FORENSE_DEFINITIVA_2026-02-15.md`, D-108/D-109 |
| 2026-02-13/14 | Mega Plan T01..T10 + gates 3/4/15/16/18 | COMPLETADA | evidencias en `docs/closure/` |

---

## 5. Protocolo operativo para continuidad

### Al iniciar sesion
1. Confirmar branch y `git status`.
2. Leer `CONTINUIDAD_SESIONES` -> `ESTADO_ACTUAL` -> `OPEN_ISSUES`.
3. Tomar la primera tarea pendiente real.

### Durante sesion
1. Registrar decisiones en `docs/DECISION_LOG.md`.
2. Registrar issues/hallazgos en `docs/closure/OPEN_ISSUES.md`.
3. Guardar evidencia en `docs/closure/`.

### Al cerrar sesion
1. Actualizar `docs/ESTADO_ACTUAL.md` si cambia el estado real.
2. Sincronizar `OPEN_ISSUES`, `README_CANONICO` y `DECISION_LOG`.
3. Validar links con `node scripts/validate-doc-links.mjs`.

---

## 6. Inventario de context prompts

- `docs/closure/CONTEXT_PROMPT_DEPLOY_HARDENING_2026-02-17.md` — Deploy migracion + 5 edge functions + smoke tests + documentacion (COMPLETADO)
- `docs/closure/CONTEXT_PROMPT_COVERAGE_AND_HARDENING_2026-02-16.md` — 25 tareas: coverage ≥80%, DX fixes, docs (COMPLETADO)
- `docs/closure/CONTEXT_PROMPT_EJECUTOR_MEGA_PLAN_2026-02-13.md` (histórico, referencia)
- Prompts ad-hoc antiguos: removidos en D-109

---

## 7. Context prompt para nueva ventana IA

```text
ROL
Eres un agente tecnico ejecutor del proyecto Mini Market System.

CONTEXTO
- Repo: usar la ruta real del checkout activo (ejemplo actual: /home/eevan/ProyectosIA/aidrive_genspark)
- Branch objetivo: main
- Estado: APROBADO (P0 cerrados; ver OPEN_ISSUES)
- Tests base: 1165/1165 PASS (root)

PRIMER PASO OBLIGATORIO
Lee en este orden:
1) docs/closure/CONTINUIDAD_SESIONES.md
2) docs/ESTADO_ACTUAL.md
3) docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/README.md
4) docs/closure/OPEN_ISSUES.md

GUARDRAILS
1. No exponer secretos/JWTs (solo nombres).
2. No usar comandos git destructivos.
3. Si redeploy de api-minimarket: usar --no-verify-jwt.
4. Toda tarea cerrada debe dejar evidencia en filesystem.

EJECUCION
Tomar la primera tarea pendiente real del plan activo y cerrarla end-to-end.
```

---

## 8. Guardrails permanentes

- NUNCA exponer secretos/JWTs.
- NUNCA usar `git reset --hard`, `git checkout -- <file>`, force push.
- `api-minimarket` debe permanecer con `verify_jwt=false` en redeploy (`--no-verify-jwt`).
- Coverage minimo objetivo: 80%.

---

_Documento canónico de continuidad. Actualizar en cada cierre de sesion._
