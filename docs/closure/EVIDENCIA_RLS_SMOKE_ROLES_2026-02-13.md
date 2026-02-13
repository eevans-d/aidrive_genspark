# Evidencia RLS Smoke por Rol - 2026-02-13

## Objetivo
Revalidar comportamiento operativo por rol vía gateway mientras la ejecución SQL directa (`psql`) permanece bloqueada por conectividad IPv6 en este host.

## Método
1. Obtener tokens (`auth/v1/token?grant_type=password`) para:
   - `TEST_USER_ADMIN`
   - `TEST_USER_DEPOSITO`
   - `TEST_USER_VENTAS`
2. Llamar endpoints del gateway `api-minimarket` con `Authorization: Bearer <token>`:
   - `GET /clientes?limit=1`
   - `GET /pedidos?limit=1`

## Resultados
| Escenario | HTTP esperado | HTTP real | Estado |
|---|---:|---:|---|
| admin -> `/clientes` | 200 | 200 | ✅ |
| ventas -> `/clientes` | 200 | 200 | ✅ |
| deposito -> `/clientes` | 403 | 403 | ✅ |
| admin -> `/pedidos` | 200 | 200 | ✅ |
| ventas -> `/pedidos` | 200 | 200 | ✅ |
| deposito -> `/pedidos` | 200 | 200 | ✅ |

## Conclusión
- Matriz operativa de acceso por rol verificada en gateway para `/clientes` y `/pedidos`.
- El alias legacy `jefe -> admin` se mantiene solo como compatibilidad, sin uso operativo en `checkRole([...])`.
