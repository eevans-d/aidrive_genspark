# CHECKLIST: Camino a Produccion Efectiva

**Creado:** 2026-03-02 (sesion auditoria cruzada)
**Contexto:** Tier 1 (6/6) + Tier 2 parcial (6/12) ejecutados. Tests 1905 PASS, build OK, lint 0.
**Documento de referencia:** `CLAUDECODE_FASES.AUDITORIA_DEFINITIVA_2026-03-02.md`

---

## FASE 1: Aplicar migraciones SQL (BLOQUEANTE)

Las 3 migraciones estan en el repo pero NO aplicadas a la BD remota.

```bash
supabase db push
```

Migraciones pendientes:
- [ ] `20260302010000_add_idempotency_movimientos_deposito.sql` — columna + indice UNIQUE + SP actualizado
- [ ] `20260302020000_fk_cascade_to_restrict.sql` — 2 FK criticas cambiadas a RESTRICT
- [ ] `20260302030000_add_check_constraints_and_rls_cache.sql` — 3 CHECK + RLS cache_proveedor

**IMPORTANTE:** Verificar que no haya datos existentes que violen los nuevos CHECK constraints antes de aplicar:
```sql
-- Verificar antes de migrar
SELECT id, nombre, precio_costo FROM productos WHERE precio_costo < 0;
SELECT id, stock_minimo, stock_maximo FROM stock_deposito WHERE stock_maximo < stock_minimo;
SELECT id, monto_pagado, monto_total FROM pedidos WHERE monto_pagado > monto_total;
```

---

## FASE 2: Deploy Edge Functions actualizadas

- [ ] `supabase functions deploy api-minimarket` — contiene: idempotencia deposito, state machine tareas, audit trail financiero
- [ ] Verificar con `supabase functions list` que esten ACTIVE
- [ ] Smoke test manual: POST /deposito/movimiento con `Idempotency-Key` header → debe retornar `idempotent: false` la primera vez, `idempotent: true` la segunda

---

## FASE 3: Deploy Frontend (Cloudflare Pages)

- [ ] `pnpm build` en `minimarket-system/`
- [ ] Deploy a Cloudflare Pages (verifica que `_headers` se copia al `dist/`)
- [ ] Verificar headers en produccion: `curl -I https://[tu-dominio]` → debe mostrar CSP + HSTS
- [ ] Verificar POS cross-tab: abrir en 2 pestañas → debe mostrar banner amber de advertencia

---

## FASE 4: Tier 2 restante (6 items pendientes)

### Seguridad / Base de datos
- [ ] **Atomic margin validation:** `/precios/aplicar` deberia hacer SELECT FOR UPDATE antes de aplicar margen (evita stale reads)
- [ ] **OCR rollback integral:** si `facturas/aplicar` falla a mitad, los items parciales ya aplicados quedan en estado inconsistente (ya tiene compensacion parcial en D-171, evaluar si es suficiente o necesita mas)

### Backend
- [ ] **Audit trail expansion:** cubrir endpoints restantes que manejan datos financieros (ofertas/aplicar, ofertas/desactivar, clientes/update, proveedores/update)

### Frontend
- [ ] (Ninguno pendiente critico — todos los fixes frontend de Tier 2 ya se aplicaron)

### Documentacion / Compliance
- [ ] **DATA_HANDLING_POLICY.md:** crear documento de politica de manejo de datos personales (PII) — nombres, telefonos, emails de clientes. Definir: retencion, acceso, soft-delete strategy, derecho al olvido
- [ ] **CORS ALLOWED_ORIGINS:** verificar que en produccion solo el dominio real esta permitido (no `*`, no `localhost`)

---

## FASE 5: Tier 3 — Mejoras de backlog (priorizadas)

### Alta prioridad (impacto directo UX/operacion)
- [ ] PWA `autoUpdate: 'prompt'` — cambiar de auto-update silencioso a prompt para evitar perder datos mid-form
- [ ] Scanner bundle lazy loading — 116KB gzipped carga siempre, deberia ser lazy
- [ ] Offline indicator en PWA UI — el usuario no sabe cuando esta offline

### Media prioridad (calidad de codigo)
- [ ] Reducir `as any` gradualmente (41 instancias, mayoria en tests)
- [ ] Reducir `console.error` — migrar a sistema de observabilidad
- [ ] Rentabilidad: aclarar que la formula es markup, no margen (UX fix en labels)

### Baja prioridad (nice-to-have)
- [ ] Agregar indice compuesto `tareas_pendientes(prioridad, created_at)`
- [ ] Actualizar README con count de tests (1733 → 1905)
- [ ] Agregar `VITE_API_ASSISTANT_URL` a `.env.example`
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

### Documentacion
| Archivo | Contenido |
|---------|-----------|
| `CLAUDECODE_FASES.AUDITORIA_DEFINITIVA_2026-03-02.md` | Auditoria cruzada completa |
| `docs/closure/CODEX_*.md` (2) | Reportes Codex |
| `docs/ESTADO_ACTUAL.md` | Actualizado con estado Tier 1/2 |
| `docs/DECISION_LOG.md` | D-184 agregada |
