# EVIDENCIA M6.S2 - Cierre owner (Sentry + SendGrid) (T09)

**Fecha:** 2026-02-13  
**Estado:** BLOCKED (dependencia externa real)

## Alcance

- Verificar cierre de dependencias externas:
  - `VITE_SENTRY_DSN`
  - Rotación `SENDGRID_API_KEY` y `SMTP_PASS`

## Resultado

- **Sentry:** código integrado, pero sin evidencia de DSN operativo en entorno objetivo.
- **SendGrid/SMTP:** queda pendiente confirmación de rotación final en entorno owner-managed.

## Evidencia previa relacionada

- `docs/closure/EVIDENCIA_GATE16_2026-02-12.md`
- `docs/closure/SECRET_ROTATION_2026-02-13_031253.md`

## Checklist exacta para owner

1. Configurar `VITE_SENTRY_DSN` en entorno de deploy frontend.
2. Desplegar y validar recepción de al menos 1 evento en Sentry.
3. Rotar `SENDGRID_API_KEY` y `SMTP_PASS` en proveedor y en secretos remotos.
4. Ejecutar smoke de `cron-notifications` en modo `real` y confirmar entrega.
5. Registrar evidencia final en `docs/closure/`.

## Siguiente paso

- T10: sincronización documental final con estado BLOCKED explícito para T09.
