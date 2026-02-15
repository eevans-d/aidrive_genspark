> [ACTIVO_VERIFICADO: 2026-02-13] Documento activo. Revisado contra baseline actual y mantenido como referencia operativa.

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

### Inventario real del gateway (`api-minimarket`) — 34 rutas (source of truth)
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
| 8 | POST | `/precios/aplicar` |
| 9 | POST | `/precios/redondear` |
| 10 | GET | `/stock` |
| 11 | GET | `/stock/minimo` |
| 12 | GET | `/reportes/efectividad-tareas` |
| 13 | POST | `/tareas` |
| 14 | POST | `/deposito/movimiento` |
| 15 | GET | `/deposito/movimientos` |
| 16 | POST | `/deposito/ingreso` |
| 17 | POST | `/reservas` |
| 18 | POST | `/compras/recepcion` |
| 19 | GET | `/pedidos` |
| 20 | POST | `/pedidos` |
| 21 | GET | `/insights/arbitraje` |
| 22 | GET | `/insights/compras` |
| 23 | GET | `/clientes` |
| 24 | POST | `/clientes` |
| 25 | GET | `/cuentas-corrientes/resumen` |
| 26 | GET | `/cuentas-corrientes/saldos` |
| 27 | POST | `/cuentas-corrientes/pagos` |
| 28 | POST | `/ventas` |
| 29 | GET | `/ventas` |
| 30 | GET | `/ofertas/sugeridas` |
| 31 | POST | `/ofertas/aplicar` |
| 32 | POST | `/bitacora` |
| 33 | GET | `/bitacora` |
| 34 | GET | `/health` |

### Criterio de conteo de endpoints (evita discrepancias)
- **Incluye** solo rutas **expresamente** enrutadas en `api-minimarket/index.ts`.
- **Excluye** rutas documentadas abajo que hoy **no** existen como `if (path === ...)` (ej.: `/productos/{id}`, `/categorias/{id}`, `/ventas/{id}`, `/ofertas/{id}/desactivar`).
- **Excluye** Edge Functions independientes (`reposicion-sugerida`, `alertas-vencimientos`, cron/scraper) y endpoints PostgREST directos a tablas.
- `api-proveedor` tiene **9 endpoints** definidos en `schemas.ts` (ver sección al final).  
Si alguien reporta “52 endpoints”, no existe inventario en el repo; el criterio probable mezcla gateway + api-proveedor + funciones independientes y/o PostgREST.

### Edge Functions independientes (no pertenecen a `api-minimarket`)
Base (producción): `https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/<function>`
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
GET /productos/dropdown            # Lista mínima para select (id, nombre, codigo_barras)
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
GET /proveedores                   # Listar activos
GET /proveedores/{id}              # Detalle
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

### Pedidos (requiere autenticación) ✨ NUEVO
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

### Búsqueda Global (requiere autenticación) ✨ NUEVO
```bash
GET /search?q=texto&limit=10        # Busca en productos/proveedores/tareas/pedidos/clientes
```

**Notas `/search`:**
- `q` es requerido (mínimo 2 caracteres).
- `limit` es opcional (1–20). El límite real por entidad está capado para evitar payloads grandes.

### Insights (Arbitraje / Comprar Ahora) ✨ NUEVO
```bash
GET /insights/arbitraje             # Riesgo de pérdida / margen bajo (por reposición proveedor)
GET /insights/compras               # “Comprar ahora”: stock bajo + caída de costo >= 10%
GET /insights/producto/{id}         # Payload unificado por producto (POS/Pocket)
```

### Clientes + Cuentas Corrientes (requiere rol `admin|ventas`) ✨ NUEVO
```bash
GET /clientes                       # Listar clientes (filtro: ?q, paginación: ?limit&offset)
POST /clientes                      # Crear cliente
PUT /clientes/{id}                  # Actualizar cliente

GET /cuentas-corrientes/resumen     # “Dinero en la calle”
GET /cuentas-corrientes/saldos      # Saldos por cliente (filtros: ?q, ?solo_deuda=true)
POST /cuentas-corrientes/pagos      # Registrar pago (monto > 0) -> retorna saldo actualizado
```

### POS / Ventas (requiere rol `admin|ventas`) ✨ NUEVO
```bash
POST /ventas                        # Crear venta POS (idempotente)
GET /ventas                         # Listado de ventas (paginación: ?limit&offset)
GET /ventas/{id}                    # Detalle de venta + items
```

**Notas `/ventas` (idempotencia):**
- `POST /ventas` requiere header `Idempotency-Key` (obligatorio) para prevenir duplicados en reintentos.
- Error esperado: `409 LOSS_RISK_CONFIRM_REQUIRED` si el producto está en riesgo de pérdida y falta `confirmar_riesgo=true`.

### Ofertas (Anti-mermas) ✨ NUEVO
```bash
GET /ofertas/sugeridas              # Stock con vencimiento <= 7 días (sugiere 30% OFF)
POST /ofertas/aplicar               # Aplica oferta por stock_id (default 30%)
POST /ofertas/{id}/desactivar       # Desactiva oferta
```

### Bitácora de Turno ✨ NUEVO
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
| Ver productos/stock | ✅ | ✅ | ✅ | ✅ |
| Crear productos | ❌ | ❌ | ✅ | ✅ |
| Aplicar precios | ❌ | ❌ | ❌ | ✅ |
| Movimientos depósito | ❌ | ❌ | ✅ | ✅ |
| Eliminar productos | ❌ | ❌ | ❌ | ✅ |
| POS / Ventas | ❌ | ✅ | ❌ | ✅ |
| Clientes / Cuenta Corriente | ❌ | ✅ | ❌ | ✅ |
| Ofertas anti-mermas | ❌ | ✅ | ✅ | ✅ |
| Bitácora (crear) | ❌ | ✅ | ✅ | ✅ |
| Bitácora (listar) | ❌ | ❌ | ❌ | ✅ |

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

*Última actualización: 2026-02-06*
