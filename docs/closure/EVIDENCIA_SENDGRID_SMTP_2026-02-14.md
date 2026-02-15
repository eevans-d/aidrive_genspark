# EVIDENCIA - SendGrid/SMTP (bloqueo tecnico, historico) (2026-02-14)

**Fecha:** 2026-02-14  
**Objetivo:** registrar el bloqueo tecnico observado al intentar envio real via SendGrid, sin exponer secretos.  
**Estado:** HISTORICO (el cierre final quedo consolidado el 2026-02-15).

---

## 1) Contexto

- Gate 4 habia quedado en PASS historico (2026-02-12): `docs/closure/EVIDENCIA_GATE4_2026-02-12.md`
- Luego se detecto una regresion operativa asociada a rotacion/estado de credenciales SendGrid.
- Este documento captura el estado "NO CERRADO" de esa fecha.

## 2) Sintoma observado

- Smoke real contra `cron-notifications` resulto en error HTTP `401` (credencial invalida/expirada/revocada).
- Implicancia: envio real via SendGrid NO operativo en ese momento; Gate 4 no se considera cerrado.

> Nota: este artefacto no incluye el body exacto del error por higiene (evitar cualquier leak accidental).

## 3) Diagnostico probable (no concluyente)

- Key nueva creada en SendGrid pero aun NO aplicada correctamente en Supabase (secrets) y/o faltaba redeploy.
- Alternativamente, key aplicada pero con permisos incorrectos o key revocada.

## 4) Accion recomendada

1. Crear/confirmar una API key valida en SendGrid con permiso "Mail Send".
2. Aplicar en Supabase (solo por nombres): `SENDGRID_API_KEY` y `SMTP_PASS` (mismo valor) + `SMTP_USER=apikey`.
3. Redeploy de funciones que envian:
   - `cron-notifications`
   - `notificaciones-tareas`
4. Repetir smoke real y confirmar en Email Activity `delivered`.

## 5) Cierre posterior (referencia)

- Evidencia externa pre-cierre (Comet): `docs/closure/EVIDENCIA_SENDGRID_COMET_2026-02-14.md`
- Evidencia final (cierre completo): `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`

