# Evidencia Smoke Roles - 2026-02-13

- Alcance: `GET /clientes` y `GET /pedidos` por rol (`admin`, `ventas`, `deposito`).
- Fuente de auth: usuarios de prueba en variables de entorno (solo nombres, sin valores).
- Nota: previa al smoke se ejecutó `scripts/supabase-admin-sync-role.mjs` para alinear `app_metadata.role` y `public.personal.rol`.

| Actor | Login | /clientes | /pedidos | PASS | Notes |
|---|---|---|---|---|---|
| admin | OK | 200 (exp 200) | 200 (exp 200) | YES | ok |
| ventas | OK | 200 (exp 200) | 200 (exp 200) | YES | ok |
| deposito | OK | 403 (exp 403) | 200 (exp 200) | YES | ok |

- Resumen: 3/3 PASS, 0 FAIL.