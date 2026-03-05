> [ACTIVO_VERIFICADO: 2026-03-05] Documento activo. Revisado contra baseline actual y mantenido como referencia operativa.

# Mini Market API - Guía Rápida de Uso

## 🚀 Inicio Rápido

### URL Base
```
# Producción (Supabase Cloud)
https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket

# Desarrollo local (supabase start)
http://127.0.0.1:54321/functions/v1/api-minimarket
```

> Nota: este README cubre el gateway `api-minimarket`. Otras Edge Functions tienen su propia URL base (ver sección “Edge Functions independientes”).

### Headers Requeridos
```bash
# Todos los requests deben incluir:
Accept: application/json
Content-Type: application/json    # Solo para POST/PUT/PATCH

# Para endpoints protegidos:
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔐 CORS y Seguridad

### Orígenes Permitidos
Por defecto (desarrollo):
- `http://localhost:5173`
- `http://127.0.0.1:5173`

En producción, configurar `ALLOWED_ORIGINS` en variables de entorno de la Edge Function.

### Headers de Respuesta Estándar
Todas las respuestas incluyen:
```
Access-Control-Allow-Origin: <origin permitido>
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type, x-request-id
Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH
Access-Control-Max-Age: 86400
Vary: Origin
x-request-id: <uuid>
```

### Formato de Respuestas

**Éxito (2xx):**
```json
{
  "success": true,
  "data": [...],
  "message": "Descripción opcional",
  "requestId": "uuid"
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción del error"
  },
  "requestId": "uuid"
}
```

---

## 🧪 Smoke Test (CORS + requestId)

Para validar que el gateway está configurado correctamente:

```bash
BASE_URL='https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket'

# 1. GET con Origin permitido (debe responder 200 con CORS headers)
curl -i "$BASE_URL/categorias" \
  -H 'Origin: http://localhost:5173' \
  -H 'Accept: application/json'

# 2. GET con Origin bloqueado (debe responder 403)
curl -i "$BASE_URL/categorias" \
  -H 'Origin: https://evil.example' \
  -H 'Accept: application/json'

# 3. Ruta inexistente (debe responder 404 estándar con x-request-id)
curl -i "$BASE_URL/__nope__" \
  -H 'Origin: http://localhost:5173' \
  -H 'Accept: application/json'

# 4. OPTIONS preflight (debe responder 204 con CORS headers)
curl -i -X OPTIONS "$BASE_URL/categorias" \
  -H 'Origin: http://localhost:5173' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: content-type, x-request-id'
```

### Checklist de Validación
- [ ] `Access-Control-Allow-Origin` = origin enviado (si permitido)
- [ ] `Access-Control-Allow-Origin` = `null` (si bloqueado)
- [ ] `x-request-id` presente en headers de todas las respuestas
- [ ] `requestId` presente en JSON body
- [ ] 403 con `CORS_ORIGIN_NOT_ALLOWED` para origins no permitidos
- [ ] 404 con `NOT_FOUND` para rutas inexistentes
- [ ] OPTIONS devuelve 204 (sin body)

---

## 🧪 Modo Sin Credenciales (Desarrollo Local)

Esta sección documenta cómo trabajar con el proyecto sin acceso a credenciales de Supabase.

### ¿Qué puedo hacer sin credenciales?

| Acción | Comando | Disponible |
|--------|---------|------------|
| Tests unitarios | `npm run test:unit` | ✅ Sí |
| Tests Vitest completos | `npx vitest run tests/unit/` | ✅ Sí |
| Tests auxiliares (mock) | `npm run test:auxiliary` | ✅ Sí |
| Build frontend | `cd minimarket-system && pnpm build` | ✅ Sí |
| Lint | `cd minimarket-system && pnpm lint` | ✅ Sí |
| Verificar prereqs E2E | `bash scripts/run-e2e-tests.sh --dry-run` | ✅ Sí |
| Verificar prereqs integration | `bash scripts/run-integration-tests.sh --dry-run` | ✅ Sí |
| E2E frontend (Playwright + mocks) | `cd minimarket-system && pnpm test:e2e:frontend` | ✅ Sí |
| Tests de integración reales | `npm run test:integration` | ❌ Requiere `.env.test` |
| E2E smoke real | `npm run test:e2e` | ❌ Requiere `.env.test` |
| Scraping real | Llamar a api-proveedor | ❌ Requiere credenciales |

### Flujos Dry-Run

Los scripts de tests soportan `--dry-run` para validar configuración sin ejecutar tests reales:

```bash
# Verificar que Supabase CLI está instalado y configurado
bash scripts/run-integration-tests.sh --dry-run

# Verificar prerequisitos de E2E
bash scripts/run-e2e-tests.sh --dry-run
```

**Output esperado (dry-run exitoso):**
```
✅ Prerequisitos verificados:
  - Node.js: OK
  - npm: OK
  - Supabase CLI: OK (o warning si falta)
  - .env.test: MISSING (esperado sin credenciales)
⏭️ Dry-run completado. Para ejecutar tests reales, configure .env.test
```

### Configuración de `.env.test` (cuando obtienes credenciales)

```bash
# 1. Copiar template
cp .env.test.example .env.test

# 2. Iniciar Supabase local
supabase start

# 3. Obtener credenciales locales
supabase status
# Copiar valores:
# - API URL → SUPABASE_URL
# - Publishable key → SUPABASE_ANON_KEY  
# - Secret key → SUPABASE_SERVICE_ROLE_KEY

# 4. Editar .env.test con los valores
nano .env.test

# 5. Ejecutar tests reales
npm run test:integration
npm run test:e2e
```

### Variables de Entorno Requeridas

| Variable | Descripción | Requerido para |
|----------|-------------|----------------|
| `SUPABASE_URL` | URL de Supabase | Integration, E2E |
| `SUPABASE_ANON_KEY` | Public anon key | Integration, E2E |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | E2E |
| `API_PROVEEDOR_SECRET` | Secret compartido | api-proveedor |

### Comandos de Desarrollo Sin Credenciales

```bash
# 1. Tests unitarios (siempre funcionan)
npm run test:unit

# 2. Tests con coverage
npx vitest run tests/unit/ --coverage

# 3. Tests auxiliares (performance/security/contracts con mocks)
npm run test:auxiliary

# 4. E2E frontend con mocks (Playwright)
cd minimarket-system && pnpm test:e2e:frontend

# 5. Build frontend (usa variables VITE_ o placeholders)
cd minimarket-system && pnpm build

# 6. Dev server (funciona con mocks habilitados)
cd minimarket-system && VITE_USE_MOCKS=true pnpm dev
```

---

## 🔑 Autenticación

### Obtener Token JWT
```bash
curl -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d "{\"email\":\"$TEST_USER_ADMIN\",\"password\":\"$TEST_PASSWORD\"}"
```

**Nota (Edge Functions / JWT ES256):** los access tokens emitidos por Supabase Auth pueden ser **ES256**.  
Si al invocar una Function vía `.../functions/v1/...` recibes `401 Invalid JWT` (antes de entrar al handler), despliega la function con `--no-verify-jwt` y deja la validación en la app (ej: `api-minimarket` valida con `/auth/v1/user` + roles).

```bash
supabase functions deploy api-minimarket --no-verify-jwt --use-api
```

### Usar Token
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 Endpoints Principales

### Inventario del gateway (`api-minimarket`) — criterio explícito
Este documento usa dos conteos válidos para evitar contradicciones:

- **35 operaciones literales**: bloques `if (path === ... && method === ...)`.
- **23 operaciones regex**: bloques `if (path.match(...) && method === ...)`.
- **58 guards totales**: suma de operaciones literales + regex.

#### Inventario literal (35 operaciones)
Rutas **exactas** en `supabase/functions/api-minimarket/index.ts` (bloques `if (path === ...)`):

| # | Método | Ruta |
|---:|:------|:-----|
| 1 | GET | `/search` |
| 2 | GET | `/productos/dropdown` |
| 3 | GET | `/proveedores/dropdown` |
| 4 | GET | `/categorias` |
| 5 | GET | `/productos` |
| 6 | POST | `/productos` |
| 7 | GET | `/proveedores` |
| 8 | POST | `/proveedores` |
| 9 | POST | `/precios/aplicar` |
| 10 | POST | `/precios/redondear` |
| 11 | GET | `/stock` |
| 12 | GET | `/stock/minimo` |
| 13 | GET | `/reportes/efectividad-tareas` |
| 14 | POST | `/tareas` |
| 15 | POST | `/deposito/movimiento` |
| 16 | GET | `/deposito/movimientos` |
| 17 | POST | `/deposito/ingreso` |
| 18 | POST | `/reservas` |
| 19 | POST | `/compras/recepcion` |
| 20 | GET | `/pedidos` |
| 21 | POST | `/pedidos` |
| 22 | GET | `/insights/arbitraje` |
| 23 | GET | `/insights/compras` |
| 24 | GET | `/clientes` |
| 25 | POST | `/clientes` |
| 26 | GET | `/cuentas-corrientes/resumen` |
| 27 | GET | `/cuentas-corrientes/saldos` |
| 28 | POST | `/cuentas-corrientes/pagos` |
| 29 | POST | `/ventas` |
| 30 | GET | `/ventas` |
| 31 | GET | `/ofertas/sugeridas` |
| 32 | POST | `/ofertas/aplicar` |
| 33 | POST | `/bitacora` |
| 34 | GET | `/bitacora` |
| 35 | GET | `/health` |

### Criterio de conteo de endpoints (evita discrepancias)
- **Inventario literal (35)**: incluye solo bloques `if (path === ... && method === ...)`.
- **Inventario regex (23)**: incluye bloques `if (path.match(...) && method === ...)`.
- **Inventario tecnico base (58)**: suma literal + regex.
- **Consolidación de alias**: `/pedidos/items/{id}` y `/pedidos/items/{id}/preparado` se cuentan como una misma operación funcional.
- **Excluye** Edge Functions independientes (`reposicion-sugerida`, `alertas-vencimientos`, `backfill-faltantes-recordatorios`, cron/scraper) y endpoints PostgREST directos a tablas.
- `api-proveedor` tiene **9 endpoints** definidos en `schemas.ts` (ver sección al final).  
Si aparece la cifra historica de "52 endpoints", tratarla como criterio normalizado antiguo. Para auditoria tecnica actual usar `58` guards (`35` literales + `23` regex).

### Edge Functions independientes (no pertenecen a `api-minimarket`)
Base (producción): `https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/<function>`

Inventario verificado en repo (16 funciones excluyendo `_shared`; 14 independientes a este gateway):

| Function | Auth de entrada | Uso principal |
|---|---|---|
| `alertas-stock` | `requireServiceRoleAuth` | Alertas de stock bajo |
| `alertas-vencimientos` | `requireServiceRoleAuth` | Alertas de vencimientos |
| `api-assistant` | JWT usuario (validación interna via Auth API) | Asistente IA (Sprint 3: 7 read + 4 write intents, plan/confirm flow, audit log) |
| `backfill-faltantes-recordatorios` | `requireServiceRoleAuth` | Backfill diario idempotente de recordatorios para faltantes críticos |
| `cron-dashboard` | `requireServiceRoleAuth` | Métricas/estado de cron jobs |
| `cron-health-monitor` | `requireServiceRoleAuth` | Health checks de cron |
| `cron-jobs-maxiconsumo` | `requireServiceRoleAuth` | Orquestación scraping/alertas/trends |
| `cron-notifications` | `requireServiceRoleAuth` | Envío de notificaciones (email/slack/webhook) |
| `cron-testing-suite` | `requireServiceRoleAuth` | Suite de tests operativos |
| `facturas-ocr` | `requireServiceRoleAuth` | Extracción OCR de facturas (Google Cloud Vision API) |
| `notificaciones-tareas` | `requireServiceRoleAuth` | Notificaciones de tareas |
| `reportes-automaticos` | `requireServiceRoleAuth` | Reportes programados |
| `reposicion-sugerida` | `requireServiceRoleAuth` | Sugerencias de reposición |
| `scraper-maxiconsumo` | `validateApiSecret` (`x-api-secret`) | Scraping proveedor externo |

Funciones no incluidas en esta tabla:
- `api-minimarket` (documentada en este archivo como gateway principal).
- `api-proveedor` (documentada en su sección específica).

Ejemplos de endpoints independientes:
```bash
GET /reposicion-sugerida           # Edge Function: reposicion-sugerida
  # Query params:
  #   - dias_analisis: Días para calcular rotación (default: 30)
  #   - umbral_reposicion: % de stock mínimo (default: 100)
  #   - incluir_proximo: Incluir próximos al umbral (default: true)
  
GET /alertas-vencimientos          # Edge Function: alertas-vencimientos
  # Query params:
  #   - warning_days: Días de advertencia (default: 30)
  #   - urgent_days: Días urgentes (default: 7)
```

### Dropdowns (Gateway)
```bash
GET /productos/dropdown            # Lista mínima para select (id, nombre, sku, codigo_barras, precio_actual)
GET /proveedores/dropdown          # Lista mínima para select (id, nombre)
```

### Categorías
```bash
GET /categorias                    # Listar todas
GET /categorias/{id}               # Detalle
```

### Productos
```bash
GET /productos                     # Listar (soporta ?activo, ?categoria, ?search)
GET /productos/{id}                # Detalle
POST /productos                    # Crear (requiere rol deposito/admin)
PUT /productos/{id}                # Actualizar
DELETE /productos/{id}             # Soft delete (requiere admin)
```

### Proveedores
```bash
GET /proveedores                   # Listar activos (requiere rol admin/deposito)
GET /proveedores/{id}              # Detalle
POST /proveedores                  # Crear proveedor (requiere admin)
PUT /proveedores/{id}              # Actualizar proveedor (requiere admin)
```

### Precios
```bash
GET /precios/producto/{id}         # Historial/estado de precios del producto
GET /precios/margen-sugerido/{id}  # Margen sugerido por producto
POST /precios/aplicar              # Aplicar precio (requiere admin)
POST /precios/redondear            # Redondear precio
```

### Stock
```bash
GET /stock                         # Stock general
GET /stock/minimo                  # Productos bajo mínimo
GET /stock/producto/{id}           # Stock de un producto
```

### Depósito (requiere autenticación)
```bash
POST /deposito/movimiento          # Registrar movimiento
GET /deposito/movimientos          # Historial
POST /deposito/ingreso             # Ingreso de mercadería
```

### Tareas (requiere autenticación)
```bash
POST /tareas                       # Crear tarea
PUT /tareas/{id}/completar         # Completar tarea
PUT /tareas/{id}/cancelar          # Cancelar tarea
```

### Pedidos (requiere autenticación)
```bash
GET /pedidos                       # Listar pedidos (filtros: ?estado, ?estado_pago, ?fecha_desde, ?fecha_hasta)
POST /pedidos                      # Crear pedido
GET /pedidos/{id}                  # Detalle del pedido con items
PUT /pedidos/{id}/estado           # Actualizar estado (pendiente → preparando → listo → entregado/cancelado)
PUT /pedidos/{id}/pago             # Registrar pago (calcula estado_pago automáticamente)
PUT /pedidos/items/{id}            # Marcar item como preparado/no preparado
```

**Request Body `/pedidos` (POST):**
```json
{
  "cliente_nombre": "Juan Pérez",
  "cliente_telefono": "+54 9 2262 123456",
  "tipo_entrega": "domicilio",
  "direccion_entrega": "Calle 123",
  "edificio": "Torre A",
  "piso": "2",
  "departamento": "B",
  "horario_entrega_preferido": "18:00-20:00",
  "observaciones": "Llamar antes de entregar",
  "items": [
    {"producto_nombre": "Salchichas FELA x6", "cantidad": 2, "precio_unitario": 1500},
    {"producto_nombre": "Queso cremoso 250g", "cantidad": 1, "precio_unitario": 2000}
  ]
}
```

**Estados de Pedido:** `pendiente` → `preparando` → `listo` → `entregado` | `cancelado`  
**Estados de Pago:** `pendiente` | `parcial` | `pagado` (calculado automáticamente según monto_pagado vs monto_total)

### Búsqueda Global (requiere autenticación)
```bash
GET /search?q=texto&limit=10        # Busca en productos/proveedores/tareas/pedidos/clientes
```

**Notas `/search`:**
- `q` es requerido (mínimo 2 caracteres).
- `limit` es opcional (1–20). El límite real por entidad está capado para evitar payloads grandes.

### Insights (Arbitraje / Comprar Ahora)
```bash
GET /insights/arbitraje             # Riesgo de pérdida / margen bajo (por reposición proveedor)
GET /insights/compras               # “Comprar ahora”: stock bajo + caída de costo >= 10%
GET /insights/producto/{id}         # Payload unificado por producto (POS/Pocket)
```

### Clientes + Cuentas Corrientes (requiere rol `admin|ventas`)
```bash
GET /clientes                       # Listar clientes (filtro: ?q, paginación: ?limit&offset)
POST /clientes                      # Crear cliente
PUT /clientes/{id}                  # Actualizar cliente

GET /cuentas-corrientes/resumen     # “Dinero en la calle”
GET /cuentas-corrientes/saldos      # Saldos por cliente (filtros: ?q, ?solo_deuda=true)
POST /cuentas-corrientes/pagos      # Registrar pago (monto > 0) -> retorna saldo actualizado
```

### POS / Ventas (requiere rol `admin|ventas`)
```bash
POST /ventas                        # Crear venta POS (idempotente)
GET /ventas                         # Listado de ventas (paginación: ?limit&offset)
GET /ventas/{id}                    # Detalle de venta + items
```

**Notas `/ventas` (idempotencia):**
- `POST /ventas` requiere header `Idempotency-Key` (obligatorio) para prevenir duplicados en reintentos.
- Error esperado: `409 LOSS_RISK_CONFIRM_REQUIRED` si el producto está en riesgo de pérdida y falta `confirmar_riesgo=true`.

### Ofertas (Anti-mermas)
```bash
GET /ofertas/sugeridas              # Stock con vencimiento <= 7 días (sugiere 30% OFF)
POST /ofertas/aplicar               # Aplica oferta por stock_id (default 30%)
POST /ofertas/{id}/desactivar       # Desactiva oferta
```

### Bitácora de Turno
```bash
POST /bitacora                      # Crear nota (antes de logout)
GET /bitacora                       # Listar notas (solo admin)
```

### Reservas y Compras
```bash
POST /reservas                     # Crear reserva
POST /reservas/{id}/cancelar       # Cancelar reserva
POST /compras/recepcion            # Registrar recepción de OC
```

### Facturas OCR (requiere rol `admin|deposito`)
```bash
POST /facturas/{id}/extraer        # Invocar extracción OCR (estado pendiente|error)
PUT  /facturas/items/{id}/validar  # Confirmar/rechazar item OCR
POST /facturas/{id}/aplicar        # Aplicar items confirmados a stock
```

**Notas `/facturas/{id}/extraer`:**
- Gateway hacia Edge Function `facturas-ocr` (server-to-server via service_role).
- El gateway valida `factura_id` y exige estado `pendiente|error` antes de invocar OCR.
- Si la factura no esta en `pendiente|error`, retorna `409 INVALID_STATE`.
- La Edge Function revalida estado permitido, existencia de factura e `imagen_url`.
- Si la factura estaba en `error`, se ejecuta limpieza previa de `facturas_ingesta_items` y se registra evento `ocr_reintento`.
- Soporta imagenes y PDF: usa `TEXT_DETECTION` para imagen y `DOCUMENT_TEXT_DETECTION` para PDF.
- Si el archivo no es soportado, retorna `400 UNSUPPORTED_FILE_TYPE`.
- Matching con cache in-memory por request (barcode/SKU -> alias -> fuzzy) para evitar consultas repetidas por item.
- Inserta items con `batch insert`; si falla, usa fallback individual y reporta `items_failed`.
- Timeout: 35s (OCR puede demorar).
- Respuesta exitosa:
```json
{
  "success": true,
  "data": {
    "factura_id": "uuid",
    "items_count": 5,
    "items_failed_count": 0,
    "items_failed": [],
    "insert_mode": "batch",
    "items_previos_eliminados": 0,
    "estado": "extraida"
  }
}
```
- Requiere secret `GCV_API_KEY` configurado en Supabase.
- La factura se crea previamente vía Supabase client SDK (`facturas_ingesta` INSERT directo con RLS).

**Notas `/facturas/items/{id}/validar`:**
- Body: `{ "estado_match": "confirmada"|"rechazada", "producto_id": "uuid", "guardar_alias": true, "alias_texto": "texto" }`
- `producto_id` requerido si `estado_match` = `confirmada`.
- `guardar_alias` + `alias_texto` opcionales: persisten en `producto_aliases` para futuro matching automatico.
- Cuando todos los items de una factura estan confirmados/rechazados, la factura transiciona automaticamente a estado `validada`.

**Notas `/facturas/{id}/aplicar`:**
- Solo facturas en estado `validada`. Idempotente (unique index `factura_ingesta_item_id` en `movimientos_deposito`).
- Lock optimista: transicion `validada -> aplicada` por PATCH condicionado (`id + estado`); si afecta 0 filas retorna `409 CONFLICT`.
- Guard de confianza OCR: bloquea con `400 OCR_CONFIDENCE_BELOW_THRESHOLD` cuando `score_confianza < OCR_MIN_SCORE_APPLY` (fallback `0.70`).
- Crea movimientos de entrada via `sp_movimiento_inventario` para cada item confirmado.
- Persiste `precios_compra` por item (trigger `trg_update_precio_costo` actualiza `productos.precio_costo`).
- **Hardening parcial (T7):** ante error en algun item, los movimientos ya creados se compensan con movimientos `salida` inversos, se limpia el link de idempotencia (`factura_ingesta_item_id = null`) para permitir reintento limpio, y el estado de la factura revierte a `validada`. El evento `aplicacion_rollback` en `facturas_ingesta_eventos` registra `items_compensados` y `items_compensacion_fallida`.
- Respuesta:
```json
{
  "factura_id": "uuid",
  "items_aplicados": 3,
  "items_ya_aplicados": 0,
  "items_errores": 0,
  "results": [{ "item_id": "uuid", "status": "applied", "movimiento_id": "uuid" }],
  "errors": []
}
```
- Status `207` si hay errores parciales (movimientos compensados, estado revertido a `validada`), `200` si todo OK, `409` si ya fue aplicada o una solicitud concurrente gano el lock.

**Notas `/reservas` (hardening WS1):**
- Requiere header `Idempotency-Key` (obligatorio) para prevenir duplicados en reintentos.
- La respuesta incluye campos top-level `idempotent` y `stock_disponible`.
- Errores esperados: `400 IDEMPOTENCY_KEY_REQUIRED` si falta el header; `409 INSUFFICIENT_STOCK` si no hay stock disponible; `503 RESERVA_UNAVAILABLE` si el RPC `sp_reservar_stock` no está disponible.

### Reportes
```bash
GET /reportes/efectividad-tareas   # Métricas de tareas
```

### Health
```bash
GET /health                        # Healthcheck del gateway
```

---

## 👥 Roles y Permisos

| Operación | Público | Ventas | Deposito | Admin |
|-----------|---------|--------|----------|-------|
| Ver productos/stock | ❌ | ✅ | ✅ | ✅ |
| Ver stock bajo mínimo | ❌ | ❌ | ✅ | ✅ |
| Crear productos | ❌ | ❌ | ✅ | ✅ |
| Aplicar precios | ❌ | ❌ | ❌ | ✅ |
| Movimientos depósito | ❌ | ❌ | ✅ | ✅ |
| Eliminar productos | ❌ | ❌ | ❌ | ✅ |
| POS / Ventas | ❌ | ✅ | ❌ | ✅ |
| Clientes / Cuenta Corriente | ❌ | ✅ | ❌ | ✅ |
| Proveedores (listar/detalle) | ❌ | ❌ | ✅ | ✅ |
| Proveedores (crear/editar) | ❌ | ❌ | ❌ | ✅ |
| Ofertas anti-mermas | ❌ | ✅ | ✅ | ✅ |
| Bitácora (crear) | ❌ | ✅ | ✅ | ✅ |
| Bitácora (listar) | ❌ | ❌ | ❌ | ✅ |
| Facturas OCR | ❌ | ❌ | ✅ | ✅ |
| Asistente IA (api-assistant) | ❌ | ❌ | ❌ | ✅ |
| Health check | ✅ | ✅ | ✅ | ✅ |

---

## 💡 Características Especiales

### Redondeo Automático de Precios
Todos los precios se redondean a múltiplos de 50:
- 2345 → 2350
- 8627 → 8650
- 12384 → 12400

### Soft Delete
Los productos eliminados solo se marcan como inactivos, no se borran físicamente.

### Trazabilidad
Todas las operaciones protegidas registran el usuario que las ejecutó.

### Request ID
Cada request genera un `x-request-id` único (UUID) que aparece en:
- Header de respuesta: `x-request-id`
- Body JSON: `requestId`

Usar este ID para debugging y correlación de logs.

### Rate Limiting (api-minimarket)
- 60 requests por minuto por IP/usuario
- Headers `RateLimit-*` indican estado del límite
- Error 429 cuando se excede el límite

---

## 🔗 API Proveedor (api-proveedor)

### URL Base
```
# Producción
https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-proveedor

# Desarrollo local
http://127.0.0.1:54321/functions/v1/api-proveedor
```

### Autenticación
`api-proveedor` usa **shared secret** en lugar de JWT. Enviar el header `x-api-secret`:

```bash
# Header requerido
x-api-secret: <valor de API_PROVEEDOR_SECRET>
```

### Lecturas (RLS opcional)
- Si se envía `Authorization: Bearer <jwt>`, las lecturas usan ese JWT y aplican RLS.
- Si no hay JWT, se usa `SUPABASE_ANON_KEY` por defecto.
- Para mantener el comportamiento legacy con service role en lecturas, configurar `API_PROVEEDOR_READ_MODE=service`.

### Endpoints Disponibles
Listado oficial según `supabase/functions/api-proveedor/schemas.ts`:

| Endpoint | Descripción | Requiere auth |
|----------|-------------|--------------|
| `/precios` | Consulta de precios actuales | Sí |
| `/productos` | Listado de productos disponibles | Sí |
| `/comparacion` | Comparación con inventario interno | Sí |
| `/sincronizar` | Trigger de sincronización manual | Sí |
| `/status` | Estado del sistema proveedor | Sí |
| `/alertas` | Alertas activas | Sí |
| `/estadisticas` | Métricas de scraping y proveedor | Sí |
| `/configuracion` | Configuración segura del proveedor | Sí |
| `/health` | Health check completo | No |

### Headers de Respuesta
Igual que `api-minimarket`:
- `x-request-id` en header y body
- Formato estándar `{ success, data/error, requestId }`

### Llamadas Server-to-Server (desde gateway)
Para llamar desde `api-minimarket`:
```ts
const proveedorSecret = Deno.env.get('API_PROVEEDOR_SECRET');
const response = await fetch(`${supabaseUrl}/functions/v1/api-proveedor/precios`, {
  method: 'GET',
  headers: {
    'x-api-secret': proveedorSecret,
    'Content-Type': 'application/json',
    'x-request-id': requestId, // propagar para tracing
  },
});
```

### Rate Limiting
- 120 requests por minuto por cliente
- Header `retry_after_ms` en error 429

### Circuit Breaker
- Se activa tras múltiples fallos
- Código `CIRCUIT_OPEN` con status 503

---

## 📖 Documentación Adicional

| Recurso | Archivo |
|---------|---------|
| OpenAPI 3.1 | `docs/api-openapi-3.1.yaml` |
| OpenAPI Proveedor | `docs/api-proveedor-openapi-3.1.yaml` |
| Postman Collection | `docs/postman-collection.json` |
| Postman Proveedor | `docs/postman-collection-proveedor.json` |
| Arquitectura | `docs/ARCHITECTURE_DOCUMENTATION.md` |
| Schema BD | `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` |
| Guía Deploy | `docs/DEPLOYMENT_GUIDE.md` |
| Operaciones | `docs/OPERATIONS_RUNBOOK.md` |

---

## 📞 Troubleshooting

### CORS bloqueado (403)
- Verificar que `Origin` esté en la lista de orígenes permitidos
- En desarrollo, usar `http://localhost:5173`
- En producción, configurar `ALLOWED_ORIGINS` en Supabase Dashboard

### 401 Unauthorized
- Verificar que el token JWT no haya expirado
- Incluir header `Authorization: Bearer <token>`

### 404 Not Found
- Verificar que la ruta sea correcta (case-sensitive)
- El gateway normaliza `/api-minimarket/...` a `/...`

### Error de Rate Limit
- Headers `RateLimit-*` indican límites y tiempo restante
- `RateLimit-Reset` indica segundos hasta reset

---

*Última actualización: 2026-03-05*
