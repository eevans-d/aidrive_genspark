# Mini Market API - Guía Rápida de Uso

## 🚀 Inicio Rápido

### URL Base (Después del Despliegue)
```
https://htvlwhisjpdagqkqnpxg.supabase.co/functions/v1/api-minimarket
```

### Autenticación
La mayoría de endpoints son públicos. Para endpoints protegidos:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### Obtener Token JWT
```bash
# Login en el sistema Mini Market
curl -X POST https://htvlwhisjpdagqkqnpxg.supabase.co/auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@minimarket.com","password":"password123"}'
```

---

## 📋 Endpoints Más Usados

### 1. Consultar Productos
```bash
# Todos los productos activos
GET /productos?activo=true

# Por categoría
GET /productos?categoria=SAL

# Búsqueda
GET /productos?search=salchicha
```

### 2. Ver Stock
```bash
# Stock general
GET /stock

# Productos con stock bajo
GET /stock/minimo

# Stock de producto específico
GET /stock/producto/{id}
```

### 3. Consultar Precios
```bash
# Historial de precios
GET /precios/producto/{id}

# Redondear un precio
POST /precios/redondear
Body: {"precio": 2345.67}
```

### 4. Operaciones de Depósito (Requiere Token)
```bash
# Registrar ingreso de mercadería
POST /deposito/ingreso
Headers: Authorization: Bearer TOKEN
Body: {
  "producto_id": "uuid",
  "cantidad": 100,
  "proveedor_id": "uuid",
  "precio_compra": 1500.00
}

# Ver historial de movimientos
GET /deposito/movimientos?limit=50
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

## 📖 Documentación Completa

- **OpenAPI 3.1:** `/workspace/docs/api-openapi-3.1.yaml`
- **Postman Collection:** `/workspace/docs/postman-collection.json`
- **Reporte Sprint 5:** `/workspace/docs/SPRINT_5_COMPLETADO.md`

---

## 🧪 Testing con Postman

1. Importar colección: `postman-collection.json`
2. Configurar variables:
   - `baseUrl`: URL de la Edge Function
   - `token`: Tu JWT token
3. Ejecutar requests por carpeta

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

---

## 📞 Soporte

Para más información, consultar:
- Especificación OpenAPI completa
- Colección de Postman con ejemplos
- Reporte detallado del Sprint 5
