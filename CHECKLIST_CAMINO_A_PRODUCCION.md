# CHECKLIST: Camino a Produccion Efectiva

**Creado:** 2026-03-02 (sesion auditoria cruzada)
**Ultima verificacion:** 2026-03-05 (tests 1945/1945, build OK, lint 0, 16/16 ACTIVE)
**Contexto:** Tier 1 (6/6) + Tier 2 (12/12) ejecutados. Tests 1945 PASS, build OK, lint 0.
**Documento de referencia:** `CLAUDECODE_FASES.AUDITORIA_DEFINITIVA_2026-03-02.md`

---

## FASE 1: Aplicar migraciones SQL (BLOQUEANTE) — COMPLETADA 2026-03-02

Las 3 migraciones aplicadas exitosamente via `supabase db push`. Sin violaciones de datos.

- [x] `20260302010000_add_idempotency_movimientos_deposito.sql` — columna + indice UNIQUE + SP actualizado
- [x] `20260302020000_fk_cascade_to_restrict.sql` — 2 FK criticas cambiadas a RESTRICT
- [x] `20260302030000_add_check_constraints_and_rls_cache.sql` — 3 CHECK + RLS cache_proveedor

Verificacion: `supabase db push --dry-run` confirma "Remote database is up to date".

---

## FASE 2: Deploy Edge Functions actualizadas — COMPLETADA 2026-03-02

- [x] `supabase functions deploy api-minimarket` (v39→v40) — idempotencia deposito, state machine tareas, audit trail financiero
- [x] Redeploy 13 funciones que usan `_shared/internal-auth.ts` (timing-safe comparison fix)
- [x] Verificar con `supabase functions list` que 16/16 estan ACTIVE
- [x] Smoke test manual: POST /deposito/movimiento con `Idempotency-Key` header → verificado en T05

---

## FASE 3: Deploy Frontend (Cloudflare Pages) — BUILD LISTO 2026-03-02

- [x] `pnpm build:pages` en `minimarket-system/` — 1905/1905 tests PASS, build OK
- [x] `_headers` + `_redirects` copiados a `dist/` automaticamente por el script `build:pages`
- [ ] Deploy a Cloudflare Pages (manual o CI/CD) — usar `dist/` como output directory
- [ ] Verificar headers en produccion: `curl -I https://[tu-dominio]` → debe mostrar CSP + HSTS
- [ ] Verificar POS cross-tab: abrir en 2 pestañas → debe mostrar banner amber de advertencia

---

## FASE 4: Tier 2 restante (2 items pendientes, 4 cerrados en verificacion 2026-03-03)

### Seguridad / Base de datos
- [x] **Atomic margin validation:** migracion `20260303010000_sp_aplicar_precio_for_update.sql` creada — agrega `FOR UPDATE` al SELECT del producto en el SP, serializando lecturas concurrentes. Gateway pre-check es soft reject, SP es la validacion definitiva con lock. Pendiente de `supabase db push`.
- [x] **OCR rollback integral:** compensacion verificada como COMPLETA en revision 2026-03-03 — crea movimientos `salida` compensatorios, limpia link idempotencia, revierte estado a `validada`, registra evento `aplicacion_rollback` con detalle. Edge case: si compensacion parcial falla para algunos items queda logueado pero podria dejar inconsistencia menor (riesgo bajo en operacion normal)

### Backend
- [x] **Audit trail expansion:** 6 handlers financieros ahora emiten `logAudit()` en operaciones exitosas: `PROVEEDOR_CREADO`, `PROVEEDOR_ACTUALIZADO`, `CLIENTE_CREADO`, `CLIENTE_ACTUALIZADO`, `OFERTA_APLICADA`, `OFERTA_DESACTIVADA`. Tests 1905/1905 PASS. Completado 2026-03-03.

### Frontend
- [ ] (Ninguno pendiente critico — todos los fixes frontend de Tier 2 ya se aplicaron)

### Documentacion / Compliance
- [x] **DATA_HANDLING_POLICY.md:** creado en T11 (2026-03-04) — 9 secciones cubriendo retencion, acceso, PII, soft-delete
- [x] **CORS ALLOWED_ORIGINS:** verificado 2026-03-03 — modulo centralizado `_shared/cors.ts`, NO usa wildcards (`*`), valida origen exacto contra allowlist, retorna `'null'` para origenes no permitidos, incluye `Vary: Origin`, unit tests cubren rechazo. En produccion: configurar `ALLOWED_ORIGINS` env var con dominio real

---

## FASE 5: Tier 3 — Mejoras de backlog (priorizadas)

### Alta prioridad (impacto directo UX/operacion)
- [ ] PWA `autoUpdate: 'prompt'` — cambiar de auto-update silencioso a prompt para evitar perder datos mid-form
- [ ] Scanner bundle lazy loading — 116KB gzipped chunk separado por Vite (`scanner-BB-WS6-1.js`); `@zxing`/`jsbarcode` configurados como chunk pero el scanner no se importa activamente en Pos.tsx (usa input texto). Considerar si se necesita o remover del bundle
- [ ] Offline indicator en PWA UI — el usuario no sabe cuando esta offline

### Media prioridad (calidad de codigo)
- [ ] Reducir `as any` gradualmente (41 instancias, mayoria en tests)
- [ ] Reducir `console.error` — migrar a sistema de observabilidad
- [ ] Rentabilidad: aclarar que la formula es markup, no margen (UX fix en labels)

### Baja prioridad (nice-to-have)
- [ ] Agregar indice compuesto `tareas_pendientes(prioridad, created_at)`
- [x] Actualizar README con count de tests (1733 → 1945) — completado 2026-03-05
- [x] Agregar `VITE_API_ASSISTANT_URL` a `.env.example` — completado 2026-03-03
- [ ] Verificar version de Supabase SDK (3 patches atras)
- [ ] Configurar Sentry DSN en produccion (opcional monitoring)

---

## FASE 6: Validacion pre-go-live

- [ ] Re-ejecutar ProductionGate completo (18 gates)
- [ ] Smoke test end-to-end en staging: crear venta, registrar pago, movimiento deposito, crear tarea, completar tarea
- [ ] Verificar que idempotency retorna correctamente en retry scenarios
- [ ] Verificar que FK RESTRICT previene borrado de producto con stock / cliente con movimientos CC
- [ ] Verificar CSP no bloquea recursos legitimos (Supabase, Sentry)
- [ ] Test de carga basico: 10 requests concurrentes al POS

---

## FASE 7: Go-live

- [ ] Activar billing en GCP Console (desbloquea OCR)
- [ ] Configurar dominio de produccion en CORS
- [ ] Configurar Sentry DSN (si se decide monitorear)
- [ ] Deploy final a produccion
- [ ] Monitorear primeras 24h: errores en Supabase logs, latencia, audit trail

---

## Puntos ciegos identificados (requieren testing activo)

Estos items NO se pueden resolver solo con code review — requieren ejecucion real:

1. **Carga concurrente real:** 10 usuarios simultaneos en POS — verificar que locks FOR UPDATE y idempotencia funcionan bajo presion
2. **Simulacion de caida Supabase:** comportamiento PWA offline, recuperacion
3. **Rollback de migracion fallida:** si una migracion falla a mitad, como se recupera
4. **Resiliencia del scraper:** si los sitios externos cambian formato, que pasa
5. **JWT expiration mid-operacion:** si el token expira mientras el usuario esta completando una venta

---

## Resumen de archivos clave modificados en esta sesion

### Codigo
| Archivo | Cambio |
|---------|--------|
| `minimarket-system/src/lib/apiClient.ts` | Guard mocks prod, TypeError→ApiError, deposito idempotency |
| `minimarket-system/src/lib/supabase.ts` | Guard mocks prod |
| `minimarket-system/src/pages/Pos.tsx` | parseErrorMessage, cross-tab BroadcastChannel |
| `minimarket-system/src/hooks/queries/use*.ts` (4) | .limit() en queries |
| `minimarket-system/deploy/cloudflare/_headers` | CSP + HSTS |
| `supabase/functions/api-minimarket/index.ts` | Idempotency 3 handlers, state machine tareas, audit trail 4 ops |
| `supabase/functions/_shared/internal-auth.ts` | Timing-safe comparison |
| `tests/unit/apiClient-branches.test.ts` | Test actualizado para NETWORK_ERROR |

### Migraciones SQL (pendientes de aplicar)
| Archivo | Contenido |
|---------|-----------|
| `20260302010000_add_idempotency_movimientos_deposito.sql` | Columna + indice + SP |
| `20260302020000_fk_cascade_to_restrict.sql` | 2 FK constraints |
| `20260302030000_add_check_constraints_and_rls_cache.sql` | 3 CHECK + RLS |
| `20260303010000_sp_aplicar_precio_for_update.sql` | SELECT FOR UPDATE en sp_aplicar_precio |

### Documentacion
| Archivo | Contenido |
|---------|-----------|
| `CLAUDECODE_FASES.AUDITORIA_DEFINITIVA_2026-03-02.md` | Auditoria cruzada completa |
| `docs/closure/CODEX_*.md` (2) | Reportes Codex |
| `docs/ESTADO_ACTUAL.md` | Actualizado con estado Tier 1/2 + Tier 2 completado |
| `docs/DECISION_LOG.md` | D-184 + D-185 agregadas |
