# EXECUTION LOG — Auditoría Forense 2026-02-10

> Commit base: `3b1a8b0` (main)
> Ejecutor: Claude Code (Opus 4)
> Plan: `docs/PLAN_MAESTRO_EJECUCION_AUDITORIA_v1.md`

---

## BASELINE

### Git
- Commit: `3b1a8b0` — Merge pull request #57
- Branch: `main`
- Estado: Archivos modificados + untracked del sistema agéntico

### Conteos verificados
| Dato | Valor |
|------|-------|
| Líneas Plan Maestro | 1234 |
| Líneas Batería v4.1 | 611 |
| Archivos docs | 116 |
| Archivos test (tests/) | 55 |
| Archivos test (frontend) | 16 |
| **Total test files** | **71** |

### Quality Gates
| Gate | Estado | Notas |
|------|--------|-------|
| Unit tests | **PASS** | 46 archivos, 812 tests passing, 21.57s |
| Frontend lint | **PASS** | Sin errores ESLint |
| Frontend build | **PASS** | Build exitoso en 9.90s, 27 entradas PWA precache |

### Supabase remoto
| Check | Estado | Notas |
|-------|--------|-------|
| CLI disponible | **OK** | v2.72.7 (update v2.75.0 disponible) |
| Functions list | **OK** | 13 funciones ACTIVE confirmadas remotamente |
| Migration list | BLOCKED | Requiere `supabase link` (no ejecutado para no alterar estado) |
| Secrets list | BLOCKED | Idem |

### Edge Functions confirmadas remotamente (13/13 ACTIVE)
| Función | Versión | Estado |
|---------|---------|--------|
| api-minimarket | v20 | ACTIVE |
| api-proveedor | v11 | ACTIVE |
| scraper-maxiconsumo | v11 | ACTIVE |
| cron-jobs-maxiconsumo | v12 | ACTIVE |
| alertas-stock | v10 | ACTIVE |
| notificaciones-tareas | v10 | ACTIVE |
| reportes-automaticos | v10 | ACTIVE |
| alertas-vencimientos | v10 | ACTIVE |
| reposicion-sugerida | v10 | ACTIVE |
| cron-notifications | v12 | ACTIVE |
| cron-dashboard | v10 | ACTIVE |
| cron-health-monitor | v10 | ACTIVE |
| cron-testing-suite | v10 | ACTIVE |

---

## SP-A — AUDITORÍA FORENSE

**Estado:** COMPLETADO
**Duración:** ~15 min (3 agentes en paralelo)
**Evidencia:** `docs/audit/EVIDENCIA_SP-A.md`

### Resumen ejecutivo

| Sub-prompt | Estado | Hallazgos clave |
|------------|--------|----------------|
| A1 — Inventario Funcional | DONE | 7 REAL + 6 PARTIAL EFs; 13/13 pages REAL; 33 migrations; 3/3 SPs confirmed |
| A2 — Pendientes con Criticidad | DONE | 21 pendientes: 6 ROJO, 12 AMARILLO, 4 VERDE; HC-2 y HC-3 confirmados |
| A3 — Funcionalidad Fantasma | DONE | ~7,943 líneas ghost/orphan; routers/ (1023 loc) nunca importado; 3 crons sin auth |

### Hallazgos ROJO (pre-producción)

1. **deploy.sh** no filtra `_shared` ni pasa `--no-verify-jwt` para api-minimarket (HC-2 CONFIRMADO)
2. **Pedidos.tsx** mutations solo console.error — operador sin feedback (HC-3 CONFIRMADO)
3. **Rotación de secretos** no ejecutada (API_PROVEEDOR_SECRET, SENDGRID_API_KEY, SMTP_PASS)
4. **SendGrid** sender verification pendiente
5. **SMTP_FROM vs EMAIL_FROM** mismatch en cron-notifications
6. **3 cron jobs** sin Authorization header (HC-1 CONFIRMADO)

### Hallazgos NUEVOS (no en documentación previa)

- NEW-1: `api-minimarket/routers/` (6 archivos, 1,023 loc) NUNCA importado por index.ts — ghost code
- NEW-2: Cron SQL referencia URL `htvlwhisjpdagqkqnpxg` ≠ project ref `dqaygmjpzoqjjrywdsxi`
- NEW-3: SMTP_FROM vs EMAIL_FROM mismatch
- NEW-4: 3 legacy test suites migradas a Vitest pero NO en CI (1,072 loc)
- NEW-5: VITE_USE_MOCKS solo afecta tareasApi

### Métricas clave

| Métrica | Valor |
|---------|-------|
| Edge Functions REAL / PARTIAL | 7 / 6 |
| Ghost/orphan lines | ~7,943 |
| Pendientes ROJO | 6 |
| Coverage | 69.39% (< 80% política) |
| _shared audit adoption | 1/13 |
| Gateway endpoints sin caller | ~20 de ~46 |

---

## SP-C — ANÁLISIS DE DETALLES

**Estado:** COMPLETADO
**Duración:** ~25 min (4 agentes en paralelo)
**Evidencia:** `docs/audit/EVIDENCIA_SP-C.md`

### Resumen ejecutivo

| Sub-prompt | Estado | Hallazgos clave |
|------------|--------|----------------|
| C1 — Manejo de Errores | DONE | 14 escenarios auditados: 2 OK, 8 PARCIAL, 4 MAL; Pedidos.tsx console.error P0 confirmado; sin interceptor 401 global |
| C2 — Consistencia de Datos | DONE | 6/12 entidades DRIFT (5 críticas sin tipos en database.ts); 8/9 hooks bypasean gateway; dual-path data access |
| C3 — UX No Técnico | DONE | Gate 14: 3/6 PASS; 7/10 formato moneda OK; 5/13 Skeleton; 7/13 ErrorMessage |
| C4 — Dependencias Externas | DONE | 4/7 cron jobs exceden timeout Free plan 60s; scraper regex frágil; rate-limit in-memory inefectivo en 3/4 funciones |

### Hallazgos ROJO / P0 (nuevos en SP-C)

1. **NEW-C1:** No hay interceptor 401 global en frontend — sesión expirada no redirige a login
2. **NEW-C7:** 4/7 cron jobs con timeout > 60s del Free plan (scraping probablemente nunca completa)
3. **Pedidos.tsx console.error** reconfirmado como P0 (ver SP-A)

### Hallazgos NUEVOS (no en SP-A ni docs previos)

- NEW-C1: Sin interceptor 401 global en frontend
- NEW-C2: apiClient.ts no traduce errores backend a español para toast.error()
- NEW-C3: 5 entidades críticas (ventas, pedidos, clientes, CC, bitacora) sin tipos en database.ts
- NEW-C4: 8/9 hooks bypasean gateway — sin rate-limit, circuit-breaker ni audit
- NEW-C5: Pedidos.tsx usa .toLocaleString() sin locale 'es-AR'
- NEW-C6: Productos, Proveedores, Rentabilidad usan .toFixed() sin separador de miles
- NEW-C7: 4/7 cron jobs configurados con timeout > 60s del Free plan
- NEW-C8: maintenance_cleanup no puede ejecutarse — datos crecen sin poda

### Métricas clave SP-C

| Métrica | Valor |
|---------|-------|
| Escenarios error OK/PARCIAL/MAL | 2 / 8 / 4 |
| Páginas con ErrorMessage | 7/13 |
| Páginas con Skeleton | 5/13 |
| Entidades con DRIFT | 6/12 |
| Hooks bypasean gateway | 8/9 |
| Gate 14 PASS | 3/6 |
| Formato moneda correcto | 7/10 |
| Riesgos externos CRÍTICO | 2 |
| Rate-limit/CB cross-instance | 1/5 funciones |
| @supabase/supabase-js gap | ~56 minor versions |

---

## SP-B — VALIDACIÓN FUNCIONAL

_Pendiente de ejecución._

---

## SP-D — OPTIMIZACIÓN

_Pendiente de ejecución._

---

## SP-E — PRODUCCIÓN

_Pendiente de ejecución._

---

## SP-F — UTILIDAD REAL

_Pendiente de ejecución._

---

## SP-Ω — CIERRE

_Pendiente de ejecución._
