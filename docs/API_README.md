# Mini Market API - Guía Rápida de Uso

## 🚀 Inicio Rápido

### URL Base
```
# Producción (Supabase Cloud)
https://htvlwhisjpdagqkqnpxg.supabase.co/functions/v1/api-minimarket

# Desarrollo local (supabase start)
http://127.0.0.1:54321/functions/v1/api-minimarket
```

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
BASE_URL='https://htvlwhisjpdagqkqnpxg.supabase.co/functions/v1/api-minimarket'

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

## 🔑 Autenticación

### Obtener Token JWT
```bash
curl -X POST https://htvlwhisjpdagqkqnpxg.supabase.co/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email":"admin@minimarket.com","password":"password123"}'
```

### Usar Token
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 Endpoints Principales

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

### Reservas y Compras
```bash
POST /reservas                     # Crear reserva
POST /compras/recepcion            # Registrar recepción de OC
```

### Reportes
```bash
GET /reportes/efectividad-tareas   # Métricas de tareas
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

## 📖 Documentación Adicional

| Recurso | Archivo |
|---------|---------|
| OpenAPI 3.1 | `docs/api-openapi-3.1.yaml` |
| Postman Collection | `docs/postman-collection.json` |
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

*Última actualización: 2026-01-10*
