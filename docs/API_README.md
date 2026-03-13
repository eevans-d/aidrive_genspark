> [ACTIVO_VERIFICADO: 2026-03-13] Guia canonica compacta para operacion diaria del gateway `api-minimarket`.

# Mini Market API - Guia Operativa

## 1) Alcance y fuente de verdad
- Este documento resume la operacion de `api-minimarket`.
- Contrato detallado de requests/responses: `docs/api-openapi-3.1.yaml`.
- Endpoints fuera de este gateway:
  - `api-assistant` (chat/acciones IA)
  - `facturas-ocr` (extraccion OCR, llamada server-to-server)
  - `api-proveedor` (integracion proveedor externo)

## 2) Base URLs
```bash
# Produccion
https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket

# Local (supabase start)
http://127.0.0.1:54321/functions/v1/api-minimarket
```

## 3) Seguridad y autenticacion
- Header base requerido en todas las llamadas:
  - `Accept: application/json`
  - `Content-Type: application/json` (cuando hay body)
- Endpoints protegidos: `Authorization: Bearer <JWT>`.
- Politica vigente (D-086):
  - `api-minimarket` opera con `verify_jwt=false` a nivel Edge Function.
  - La validacion de usuario/rol se hace dentro del handler.
  - No cambiar este criterio en redeploys.
- Contrato operativo relacionado:
  - `api-proveedor` **no** hereda esta excepcion; mantiene `verify_jwt=true`.
  - Para smoke remoto de `api-proveedor/health`, el contrato tecnico vigente es:
    - `Authorization: Bearer <token tecnico>`
    - `x-api-secret: <API_PROVEEDOR_SECRET>`
  - En CI/nightly, ese smoke usa `SUPABASE_SERVICE_ROLE_KEY` como bearer tecnico y `API_PROVEEDOR_SECRET` como shared secret.

## 4) Contrato de respuesta estandar
### Exito (2xx)
```json
{
  "success": true,
  "data": {},
  "message": "opcional",
  "requestId": "uuid"
}
```

### Error (4xx/5xx)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "descripcion"
  },
  "requestId": "uuid"
}
```

## 5) Invariantes operativos criticos
- CORS bloquea origenes no permitidos (`403 CORS_ORIGIN_NOT_ALLOWED`).
- Todas las respuestas exponen `x-request-id` en header y `requestId` en body.
- Endpoints OCR/pedidos sensibles mantienen control de concurrencia/idempotencia.
- `PUT /pedidos/{id}/estado` usa lock optimista y responde `409 CONFLICT` en carrera.

## 6) Superficie de endpoints (resumen por dominio)
La lista exacta y schemas estan en `docs/api-openapi-3.1.yaml`. Resumen operativo:

- Catalogo:
  - `/categorias`, `/productos`, `/proveedores`
  - `/productos/dropdown`, `/proveedores/dropdown`
- Precios y ofertas:
  - `/precios/aplicar`, `/precios/producto/{id}`, `/precios/redondear`, `/precios/margen-sugerido/{id}`
  - `/ofertas/sugeridas`, `/ofertas/aplicar`, `/ofertas/{id}/desactivar`
- Stock/deposito/compras:
  - `/stock`, `/stock/minimo`, `/stock/producto/{id}`
  - `/deposito/movimiento`, `/deposito/movimientos`, `/deposito/ingreso`
  - `/compras/recepcion`
- Reservas/tareas:
  - `/reservas`, `/reservas/{id}/cancelar`
  - `/tareas`, `/tareas/{id}/completar`, `/tareas/{id}/cancelar`
- Pedidos/clientes/ventas:
  - `/pedidos`, `/pedidos/{id}`, `/pedidos/{id}/estado`, `/pedidos/{id}/pago`, `/pedidos/items/{id}`
  - `/clientes`, `/clientes/{id}`
  - `/ventas`, `/ventas/{id}`
- Cuentas corrientes:
  - `/cuentas-corrientes/resumen`, `/cuentas-corrientes/saldos`, `/cuentas-corrientes/pagos`
- OCR:
  - `/facturas/{id}/extraer`, `/facturas/items/{id}/validar`, `/facturas/{id}/aplicar`
- Analytics/utilitarios:
  - `/reportes/efectividad-tareas`, `/insights/arbitraje`, `/insights/compras`, `/insights/producto/{id}`
  - `/search`, `/bitacora`, `/health`

## 7) Smoke minimo recomendado
```bash
BASE_URL='https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket'

# Salud del gateway
curl -i "$BASE_URL/health" -H 'Accept: application/json'

# CORS permitido
curl -i "$BASE_URL/categorias" \
  -H 'Origin: http://localhost:5173' \
  -H 'Accept: application/json'

# CORS bloqueado
curl -i "$BASE_URL/categorias" \
  -H 'Origin: https://evil.example' \
  -H 'Accept: application/json'
```

## 8) Desarrollo local sin credenciales completas
- Funciona sin credenciales reales:
  - `npm run test:unit`
  - `npm run test:auxiliary`
  - `pnpm -C minimarket-system test:components`
  - `pnpm -C minimarket-system build`
- Requiere `.env.test` para integración/E2E reales:
  - `npm run test:integration`
  - `npm run test:e2e`

## 9) Relacion con issues abiertos
- `OCR-007`: billing GCP ya fue reactivado; queda pendiente solo la revalidacion runtime del OCR (no es un problema de contrato del gateway).
- `AUTH-001`, `AUTH-002`, `DB-001`: hardening externo de plataforma; en `DB-001` el `SSL enforcement` ya fue activado y resta la allowlist de IPs.
- `CI-REMOTE-001`: **cerrado**. `main` ya genera `ops-smoke-report` + `migration-drift-report` (run `23038842082`); la unica nota remota vigente es el `401` no critico de `cron-health-monitor/health-check` en fase warning-only.
- Estado vigente de severidad/acciones: `docs/closure/OPEN_ISSUES.md`.

## 10) Trazabilidad historica
El detalle extenso previo se mantiene disponible en el historial de git del archivo.
