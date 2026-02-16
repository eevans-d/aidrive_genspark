# CONTINUIDAD DE SESIONES — Documento Maestro

**Proposito:** Este documento es el UNICO punto de entrada para cualquier sesion nueva (Claude Code, Copilot, u otro agente IA). Contiene todo lo necesario para retomar el trabajo sin perdida de contexto.

**Ultima actualizacion:** 2026-02-16T04:10:00Z
**Sesion activa:** `.agent/sessions/current/SESSION_ACTIVE`
**Branch:** `integrate/p0-sync-2026-02-15`

---

## 1. COMO USAR ESTE DOCUMENTO

### Si eres un agente IA iniciando sesion:
1. Lee este documento COMPLETO primero.
2. Luego lee `docs/ESTADO_ACTUAL.md` para el estado tecnico detallado.
3. Revisa la seccion "PLAN ACTIVO" abajo para saber que hacer.
4. Al terminar cualquier tarea, actualiza este documento (secciones 4, 5 y 6).

### Si eres el usuario (humano):
- Copia el contenido de la seccion "CONTEXT PROMPT PARA NUEVA VENTANA IA" (seccion 7) y pegalo en una nueva ventana para dar contexto instantaneo.

---

## 2. ESTADO GLOBAL DEL PROYECTO

| Campo | Valor |
|-------|-------|
| **Proyecto** | Mini Market System (inventario, ventas, tareas, proveedores) |
| **Stack** | React/Vite/TS + Supabase Edge Functions/Deno + PostgreSQL |
| **Ref Supabase** | dqaygmjpzoqjjrywdsxi |
| **Veredicto** | APROBADO (P0 cerrados y verificados en remoto; ver OPEN_ISSUES) |
| **Score** | 92/100 (operativo post-fix) / 78/100 (forense histórico pre-remediación) |
| **Tests** | 829/829 PASS, Build PASS, Lint PASS |
| **Edge Functions** | 13 activas (api-minimarket v26) |
| **Migraciones** | 40/40 local=remoto |

### Fuentes de verdad canonicas:
| Documento | Ruta | Para que sirve |
|-----------|------|----------------|
| Estado real | `docs/ESTADO_ACTUAL.md` | Estado tecnico actual verificado |
| Decisiones | `docs/DECISION_LOG.md` | Historial de 109+ decisiones |
| Issues abiertos | `docs/closure/OPEN_ISSUES.md` | Pendientes categorizados (P0/P1/P2) |
| Camino a produccion | `docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md` | Plan paso a paso |
| Auditoria forense | `docs/AUDITORIA_FORENSE_DEFINITIVA_2026-02-15.md` | Auditoria completa con hallazgos y remediaciones |
| Acta ejecutiva | `docs/closure/ACTA_EJECUTIVA_FINAL_2026-02-13.md` | Resumen ejecutivo de cierre |
| Navegacion closure | `docs/closure/README_CANONICO.md` | Indice canónico de docs de cierre |

---

## 3. PLAN ACTIVO (que hacer ahora)

### 3.1 Pendientes REALES (bloqueantes o semi-bloqueantes)

| # | Tarea | Prioridad | Estado | Tipo | Siguiente accion |
|---|-------|-----------|--------|------|------------------|
| 1 | SendGrid: (higiene) revocar API key anterior (si aun esta activa) | P2 | RECOMENDADO (owner/externo) | Manual/navegador | Ver `docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md` seccion "Paso 2" |
| 2 | Backups: activar/validar workflow (si aun no esta activado) | P1 | PENDIENTE (owner) | Config externa | Configurar `SUPABASE_DB_URL` en GitHub Secrets y ejecutar workflow (ver `docs/closure/EVIDENCIA_GATE15_2026-02-12.md`) |
| 3 | `precios_proveedor`: trazar en repo el RLS que ya está activo en remoto | P2 | ABIERTO | DB/migraciones | Crear migración idempotente `ENABLE RLS` + alineación de grants/policies para eliminar drift canónico. |
| 4 | `scraper-maxiconsumo`: remover default CORS wildcard (`*`) residual | P2 | ABIERTO | Edge Function hardening | Refactor menor en headers default para que solo `validateOrigin()` defina el origen. |
| 5 | Ejecutar smoke real periódico de seguridad (`RUN_REAL_TESTS=true`) | P2 | RECOMENDADO | QA/Operación | Programar corrida nightly/pre-release y anexar evidencia en `docs/closure/`. |
| 6 | Deuda técnica: `Proveedores.test.tsx` sin `QueryClientProvider` | P2 | ABIERTO | Frontend tests | Corregir harness del test para cerrar issue técnico conocido. |

### 3.2 Auditoria Forense (C-01..C-07, R-01..R-18)

Estado actual (2026-02-16): **CERRADO + VERIFICADO EN REMOTO**. Referencias:
- `docs/AUDITORIA_FORENSE_DEFINITIVA_2026-02-15.md`
- `docs/closure/OPEN_ISSUES.md`

### 3.3 Mejoras opcionales (no bloqueantes)

| Tarea | Prioridad | Detalle |
|-------|-----------|---------|
| Smoke real periodico (`RUN_REAL_TESTS=true`) | P2 | Programar nightly o pre-release |
| Consolidacion artefactos historicos | P2 | Unificar indice de `docs/closure/` y `docs/archive/` |
| `precios_proveedor` RLS drift (repo vs remoto) | P2 | Agregar migración explícita para trazabilidad |
| `scraper-maxiconsumo` CORS default `*` | P2 | Limpieza cosmética/hardening de headers default |
| Domain Authentication SendGrid | P3 | DNS para `minimarket-system.com` |

---

## 4. REGISTRO DE SESIONES RECIENTES

| Fecha | Objetivo | Estado | Artefactos clave |
|-------|----------|--------|------------------|
| 2026-02-16 | Integración P0 (sync + remote fix) y normalización documental | EN CURSO | `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_REMOTE_POST_FIX.md`, `docs/closure/BASELINE_LOG_2026-02-16_034546.md` |
| 2026-02-15 | Establecer sistema de continuidad documentada | COMPLETADA | Este documento, BRIEFING actualizado |
| 2026-02-14 | Auditoria pragmatica + remediaciones (P0a/P0b/P1a/P1b/P3) + Sentry | COMPLETADA | `ESTADO_ACTUAL.md` s5, `EVIDENCIA_GATE16_2026-02-14.md` |
| 2026-02-13 | Verificacion final consistencia documental + rigor tests | COMPLETADA | Mega Plan T01-T10, Baseline, Session archive |
| 2026-02-12 | Ejecucion gates (3,4,15,18) + hardening 5 pasos | COMPLETADA | Evidencias Gate3/4/15/18 |

### Sesion actual (2026-02-16) — Pasos completados:

| # | Paso | Estado | Evidencia |
|---|------|--------|-----------|
| 1 | Archivar sesion anterior (2026-02-13) | COMPLETADO | `.agent/sessions/archive/20260213-061916-completada/` |
| 2 | Inicializar nueva sesion | COMPLETADO | `.agent/sessions/current/SESSION_ACTIVE`, `BRIEFING.md` |
| 3 | Crear documento de continuidad | COMPLETADO | Este documento (`docs/closure/CONTINUIDAD_SESIONES.md`) |
| 4 | Actualizar ESTADO_ACTUAL con referencia | COMPLETADO | `docs/ESTADO_ACTUAL.md` seccion 8 |
| 5 | Crear SESSION_LOG con tracking en vivo | COMPLETADO | `.agent/sessions/current/SESSION_LOG.md` |
| 6 | Validar sistema de continuidad | COMPLETADO | 80+ archivos referenciados verificados, 0 links rotos |
| 7 | Aplicar remediación P0 RLS/search_path y verificar remoto | COMPLETADO | `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_REMOTE_POST_FIX.md` |
| 8 | Sincronización documental canónica (DocuGuard) | EN CURSO | `docs/ESTADO_ACTUAL.md`, `docs/closure/OPEN_ISSUES.md`, `docs/closure/README_CANONICO.md` |

---

## 5. PROTOCOLO DE CONTINUIDAD (para agentes IA)

### Al iniciar cualquier sesion:
1. Leer `docs/closure/CONTINUIDAD_SESIONES.md` (este documento).
2. Leer `docs/ESTADO_ACTUAL.md`.
3. Verificar `docs/closure/OPEN_ISSUES.md` por cambios.
4. Revisar seccion "PLAN ACTIVO" (arriba) para determinar que hacer.
5. Actualizar `.agent/sessions/current/BRIEFING.md` con objetivo de la sesion.

### Durante la sesion:
1. Actualizar la tabla "Sesion actual — Pasos completados" (seccion 4) despues de cada paso.
2. Si se toman decisiones arquitectonicas, agregar a `docs/DECISION_LOG.md`.
3. Si se encuentran nuevos issues, agregar a `docs/closure/OPEN_ISSUES.md`.

### Al cerrar sesion:
1. Marcar todos los pasos completados en la tabla de la sesion.
2. Actualizar `docs/ESTADO_ACTUAL.md` con cambios reales.
3. Actualizar seccion "PLAN ACTIVO" con lo que queda pendiente.
4. Crear una nueva fila en "REGISTRO DE SESIONES RECIENTES" (seccion 4).
5. Guardar SESSION_REPORT en `.agent/sessions/current/SESSION_REPORT.md`.
6. Archivar la sesion en `.agent/sessions/archive/YYYYMMDD-HHMMSS/`.

---

## 6. INVENTARIO DE CONTEXT PROMPTS DISPONIBLES

Estos documentos estan disenados para copiar/pegar en ventanas IA nuevas:

| Documento | Para que sirve | Fecha |
|-----------|---------------|-------|
| `docs/closure/CONTEXT_PROMPT_EJECUTOR_MEGA_PLAN_2026-02-13.md` | Ejecutar Mega Plan T01-T10 (ya completado) | 2026-02-13 |
| (Nota) Prompts operativos ad-hoc | Removidos tras ejecucion para evitar ruido | 2026-02-15 |

---

## 7. CONTEXT PROMPT PARA NUEVA VENTANA IA

> Copiar y pegar este bloque completo en una nueva ventana de Claude Code, Copilot, o cualquier agente IA:

```text
ROL
Eres un agente tecnico ejecutor trabajando en el proyecto Mini Market System.

CONTEXTO RAPIDO
- Repo: /home/eevan/ProyectosIA/aidrive_genspark
- Stack: React/Vite/TS + Supabase Edge Functions/Deno + PostgreSQL
- Estado: APROBADO (P0 cerrados; ver OPEN_ISSUES)
- Tests: 829/829 PASS, Build PASS
- Branch actual: integrate/p0-sync-2026-02-15

PRIMER PASO OBLIGATORIO
Lee estos documentos en orden ANTES de hacer cualquier cosa:
1. docs/closure/CONTINUIDAD_SESIONES.md  ← plan activo + pasos completados
2. docs/ESTADO_ACTUAL.md                 ← estado tecnico detallado
3. docs/closure/OPEN_ISSUES.md           ← pendientes categorizados

GUARDRAILS
1. No exponer secretos/JWTs (solo nombres de variables).
2. No usar comandos git destructivos.
3. Si redeploy api-minimarket: usar --no-verify-jwt.
4. Toda tarea completada debe tener evidencia en filesystem.
5. Actualizar docs/closure/CONTINUIDAD_SESIONES.md al terminar.

QUE HACER
Consulta la seccion "PLAN ACTIVO" de CONTINUIDAD_SESIONES.md para la lista
priorizada de tareas pendientes. Ejecuta la que corresponda segun las
instrucciones del usuario.
```

---

## 8. GUARDRAILS PERMANENTES

- **Secretos:** NUNCA exponer valores. Solo nombres de variables.
- **Git:** NUNCA usar `reset --hard`, `checkout -- <file>`, force push.
- **api-minimarket:** SIEMPRE usar `--no-verify-jwt` en redeploy.
- **Evidencia:** TODA tarea completada deja evidencia en `docs/closure/` o `test-reports/`.
- **Clasificacion:** marcar outputs como REAL / A CREAR / PROPUESTA FUTURA.
- **Coverage minimo:** 80%.
- **Max reintentos por error:** 2.

---

_Documento generado: 2026-02-16. Mantener actualizado en cada sesion._
