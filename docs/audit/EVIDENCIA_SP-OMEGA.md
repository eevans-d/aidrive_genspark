# EVIDENCIA SP-Ω — Snapshot Final de Gates

> Fecha: 2026-02-11
> Ejecutor: Antigravity (implementación) + Codex (revalidación y consolidación)
> Objetivo: eliminar contradicciones y dejar un único estado de gates defendible.

---

## Revalidación ejecutada (2026-02-11)

Comandos usados en esta pasada final:

- `supabase migration list --linked`
- `supabase db push --linked`
- `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output pretty`
- `pnpm -C minimarket-system lint`
- `pnpm -C minimarket-system build`
- `bash scripts/verify-cors.sh`
- `curl -I https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket/health`
- `curl -I -H "Origin: https://aidrive-genspark.vercel.app" https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket/health`
- `rg "ErrorMessage" minimarket-system/src/pages/*.tsx`

Hechos verificados:

- Migraciones remotas aplicadas: `36` (local=remoto).
- Frontend lint/build: PASS.
- `Pos.tsx` ahora usa `ErrorMessage` y `Skeleton`.
- CORS productivo corregido: origen esperado (`https://aidrive-genspark.vercel.app`) responde `200` con `Access-Control-Allow-Origin` correcto.
- Origen no permitido se bloquea con `403` y `Access-Control-Allow-Origin: null`.
- ErrorMessage en páginas: `9/13`.

---

## Matriz final de 18 gates (snapshot único)

| # | Gate | Estado final | Evidencia consolidada |
|---|------|--------------|-----------------------|
| 1 | Auth funciona E2E | ✅ OK | JWT manual + interceptor 401 global documentado; sin regresión detectada en esta pasada. |
| 2 | CRUD Stock funciona | ✅ OK | No se introdujeron cambios regresivos en handlers/cliente API durante esta fase. |
| 3 | POS venta completa | ⚠️ PARCIAL | UX mejorada en `Pos.tsx` (ErrorMessage+Skeleton), pero no hubo E2E funcional completo de venta en esta pasada. |
| 4 | Alertas stock bajo llegan al operador | ⚠️ PARCIAL | Cron auth con Vault resuelto (`20260211055140`, `20260211062617`), falta canal real push/email al operador. |
| 5 | Alertas vencimientos funcional | ❌ FALLA | Sigue como función huérfana sin trigger productivo. |
| 6 | Reposición sugerida funcional | ❌ FALLA | Sigue como función huérfana sin trigger productivo. |
| 7 | RLS correcto en tablas sensibles | ⚠️ PARCIAL | `20260211100000` aplicada en remoto: RLS enabled + validación de policies mínimas y sin grants `anon`. Pendiente validación fina por reglas de negocio/rol. |
| 8 | No hay secrets expuestos en código | ✅ OK | No se detectó exposición de secretos en cambios de esta pasada. |
| 9 | Rate-limit efectivo | ⚠️ PARCIAL | Cobertura de rate-limit no está extendida a todas las funciones públicas. |
| 10 | Cron jobs ejecutan sin error | ⚠️ PARCIAL | Runtime de auth mejoró con Vault; falta verificación operativa integral de todos los jobs objetivo. |
| 11 | Migraciones aplicadas en producción | ✅ OK | `supabase migration list --linked` confirma local=remoto (`36/36`). |
| 12 | Errores en español comprensible | ⚠️ PARCIAL | Mejora parcial; no hay cobertura completa uniforme en todas las vistas. |
| 13 | ErrorMessage en 13 páginas | ⚠️ PARCIAL | Estado actual verificado: `9/13`. |
| 14 | Operador usa sin capacitación | ⚠️ PARCIAL | UX sube, pero falta onboarding/empty states/cobertura completa de mensajes. |
| 15 | Rollback documentado y probado | ⚠️ PARCIAL | `scripts/db-backup.sh` + runbook manual, sin backup automatizado/PITR. |
| 16 | Monitoreo activo con alertas reales | ❌ FALLA | Sin Sentry activo (sin DSN) y sin canal operativo de alertas confirmado en producción. |
| 17 | 13 Edge Functions healthy | ✅ OK | `supabase functions list` confirma 13/13 ACTIVE. |
| 18 | CI pipeline verde + legacy defendible | ⚠️ PARCIAL | Core CI ok; legacy en job opcional con `continue-on-error`, no endurecido como gate efectivo. |

---

## Resumen consolidado

| Resultado | Conteo |
|-----------|--------|
| ✅ OK | 5/18 |
| ⚠️ PARCIAL | 10/18 |
| ❌ FALLA | 3/18 |

Perfil Piloto (gates 1,2,3,4,7,8,11,17,18):

- ✅ OK: 5/9
- ⚠️ PARCIAL: 4/9
- ❌ FALLA: 0/9

---

## Veredicto final

# ❌ NO LISTO (Piloto y Producción)

Motivo formal: existen gates obligatorios del perfil Piloto aún en estado ⚠️ PARCIAL.

Bloqueantes activos más relevantes:

1. Completar verificación funcional de Gate 3 (POS) con evidencia E2E completa.
2. Cerrar Gate 4 con canal real de alertas al operador (push/email/dashboard actionable).
3. Endurecer Gate 18 (legacy en CI con criterio verificable, no solo opcional con continue-on-error).
4. Activar monitoreo real (Sentry/alerting) para cerrar Gate 16.
