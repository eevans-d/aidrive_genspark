# Guía de Usuario - Dashboard Mini Market

## Páginas
- Inicio (`/`): métricas generales, tarjetas, alertas y gráficos.
- Proveedores (`/providers`): listado con KPIs por proveedor.
- Analytics (`/analytics`): filtros y gráficos avanzados; top productos con paginación en cliente.

## Filtros
- En Analytics puedes usar:
  - `start_date` y `end_date` (YYYY-MM-DD)
  - `proveedor` (texto, hasta 60 caracteres)
- Los filtros impactan gráficos y exportaciones.

## Exportaciones
- CSVs disponibles (requieren API Key a nivel API, no desde UI):
  - `/api/export/summary.csv`
  - `/api/export/providers.csv`
  - `/api/export/top-products.csv?limit=10&start_date=...&end_date=...&proveedor=...`

## Buenas prácticas de uso
- Para depurar o correlacionar solicitudes, puedes enviar `X-Request-ID` desde el cliente.
- La tabla de "Top productos" en Analytics se pagina a 5 filas por página para mejor lectura.

## Errores comunes
- Fechas inválidas son ignoradas (se muestran datos generales).
- Si ves un error de seguridad en APIs, probablemente falta el header `X-API-Key`.
