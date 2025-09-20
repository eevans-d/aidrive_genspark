# API del Dashboard Mini Market

Esta guía documenta los endpoints, autenticación, parámetros y respuestas del Dashboard Web (FastAPI).

## Autenticación
- Tipo: API Key en header
- Header: `X-API-Key: <tu_api_key>`
- Cobertura: Requerido para todos los endpoints bajo `/api/*` y `/metrics`.
- Error:
  - Falta/incorrecta → 401 Unauthorized

## Headers de trazabilidad
- Opcional: `X-Request-ID` (se propaga a la respuesta). Útil para correlación de logs.

## Endpoints HTML (no requieren API Key)
- GET `/` → Página principal del dashboard
- GET `/providers` → Vista de proveedores
- GET `/analytics` → Vista de analytics con filtros `start_date`, `end_date`, `proveedor`

## Endpoints JSON (requieren API Key)
- GET `/api/summary`
  - Resumen general (proveedores, pedidos, movimientos, etc.)
- GET `/api/providers`
  - Estadísticas por proveedor
- GET `/api/stock-timeline?days=7`
  - Línea de tiempo de movimientos de stock
  - Parámetros: `days` (1-90)
- GET `/api/top-products?limit=10&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&proveedor=texto`
  - Top de productos más pedidos con filtros opcionales
  - Parámetros: `limit` (1-100), `start_date`, `end_date`, `proveedor` (máx 60 chars)
- GET `/api/trends?months=6&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&proveedor=texto`
  - Tendencias mensuales con filtros opcionales
  - Parámetros: `months` (1-24), `start_date`, `end_date`, `proveedor` (máx 60 chars)
- GET `/api/stock-by-provider?limit=10`
  - Stock o volumen aproximado por proveedor
  - Parámetros: `limit` (1-100)
- GET `/api/weekly-sales?weeks=8`
  - Evolución semanal de ventas/pedidos
  - Parámetros: `weeks` (1-52)

Notas de validación y sanitización:
- Fechas deben ser válidas calendario (YYYY-MM-DD). Fechas inválidas se ignoran (None).
- Texto `proveedor` se limpia y se trunca a 60 chars.
- Números se encapsulan con límites seguros.

## Exportaciones CSV (requieren API Key)
- GET `/api/export/summary.csv`
- GET `/api/export/providers.csv`
- GET `/api/export/top-products.csv?limit=10&start_date=...&end_date=...&proveedor=...`

Formato: `text/csv` con encabezados y filas; en caso de error: `error,message`.

## Métricas (Prometheus)
- GET `/metrics`
  - Protegido por API Key
  - Devuelve counters por total, por path y suma de duración en formato Prometheus `text/plain; version=0.0.4`.

## Health Check
- GET `/health` (sin API Key)
  - Retorna estado general y verificación básica a la base de datos.

## Ejemplos rápidos con curl

```bash
curl -H 'X-API-Key: $DASHBOARD_API_KEY' http://localhost:8080/api/summary
curl -H 'X-API-Key: $DASHBOARD_API_KEY' 'http://localhost:8080/api/top-products?limit=5&proveedor=Coca'
curl -H 'X-API-Key: $DASHBOARD_API_KEY' http://localhost:8080/metrics
```
