# Changelog

Todos los cambios notables de este proyecto se documentan aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2025-11-03

### Added - PRs Mergeados desde Codex

#### PR #14: Métricas de Tareas (SHA: 75f5cdd)
- Vista materializada `tareas_metricas` versionada en `supabase/migrations/20260104020000_create_missing_objects.sql` (antes en `supabase/sql/`)
- Endpoint `/reportes/efectividad-tareas` para reportes de eficiencia
- Calcula métricas como tiempo promedio de resolución y tasa de éxito

#### PR #15: Cache de Proveedor con Fallback (SHA: 426fb2c)
- Nueva tabla `cache_proveedor` con migración `20251103_create_cache_proveedor.sql`
- Fallback persistente cuando circuit breaker está en estado OPEN
- Mejora resiliencia del sistema ante fallas de proveedores externos

#### PR #17: Validación de Precio Mínimo (SHA: 28d3688)
- Validación `precio_compra > 0` obligatoria en stored procedure
- Verificación de margen mínimo configurable (default: 5%)
- Migración `20260202000000_version_sp_aplicar_precio.sql`

#### PR #18: Stock en Tránsito (SHA: b069148)
- Nuevas tablas `stock_reservado` y `ordenes_compra`
- Función `calcular_stock_disponible()` que considera reservas
- RPC endpoint para tracking de stock en tránsito

### Removed

#### PR #16: Módulo External API (SHA: db3d1ec)
- Eliminado directorio completo `supabase/functions/external_api/`
- 17 archivos removidos (pertencían a proyecto Matrix Agent, no a Mini Market)
- Limpieza de código no relacionado con el dominio

### Changed - Limpieza de Repositorio
- Eliminada carpeta `archive/` completa (contenido obsoleto)
- Eliminados reportes de sesión temporales de raíz
- Eliminados archivos de test temporales y capturas de browser
- Actualizado `.gitignore` con reglas específicas del proyecto
- Eliminado JWT token expuesto en `shell_output_save/` (issue de seguridad)

## [1.4.0] - 2025-10-24

### Added
- Dashboard web con KPIs en tiempo real
- Sistema de notificaciones integrado
- OCR preview para facturas de proveedores
- Tests de seguridad de headers HTTP

### Changed
- Migración completa a Supabase Edge Functions
- Consolidación de documentación en estructura limpia

## [1.3.0] - 2025-10-20

### Added
- Sistema de agentes (negocio + depósito)
- Integración con base de datos PostgreSQL
- Scripts de deployment para staging/production

### Security
- Implementación de headers CSP
- Rotación de API keys automatizada
- Validación de inputs en todos los endpoints

---

## Estructura del Proyecto

```
minimarket-system/          # Frontend React + Vite + TypeScript
├── src/                    # Código fuente React

supabase/                   # Edge Functions + migraciones + cron jobs
├── functions/              # Edge Functions (Deno)
├── migrations/             # Migraciones SQL versionadas
├── cron_jobs/              # Configuración de jobs

docs/                       # Documentación técnica
tests/                      # Tests (unit/integration/e2e/performance)
.github/workflows/          # CI/CD
deploy.sh                   # Script de deployment
setup.sh                    # Script de configuración
migrate.sh                  # Script de migraciones
test.sh                     # Runner legacy de tests
```

## Convenciones

- Todas las migraciones SQL en `supabase/migrations/`
- Edge Functions en TypeScript bajo `supabase/functions/`
- Tests deben pasar antes de merge a main
- Documentación actualizada en cada PR
