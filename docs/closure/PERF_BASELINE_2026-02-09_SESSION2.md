# Performance Baseline — 2026-02-09 Session 2

**Fecha:** 2026-02-09 11:17 UTC
**Iteraciones:** 5 por endpoint
**Operador:** Claude Code (Opus 4)
**Resultado:** 7/7 endpoints OK, 0 errores, 0 rate limits

## Resultados

| Endpoint | OK | Err | 429 | Min | p50 | p95 | Max |
|----------|-----|-----|-----|-----|-----|-----|-----|
| health | 5 | 0 | 0 | 770ms | 839ms | 1973ms | 1973ms |
| search | 5 | 0 | 0 | 924ms | 1168ms | 1658ms | 1658ms |
| insights/arbitraje | 5 | 0 | 0 | 796ms | 875ms | 1174ms | 1174ms |
| clientes | 5 | 0 | 0 | 829ms | 942ms | 1186ms | 1186ms |
| cuentas-corrientes/resumen | 5 | 0 | 0 | 630ms | 887ms | 905ms | 905ms |
| ofertas/sugeridas | 5 | 0 | 0 | 845ms | 920ms | 1061ms | 1061ms |
| bitacora | 5 | 0 | 0 | 875ms | 895ms | 1218ms | 1218ms |

**Worst p95:** 1973ms (health — cold start probable en primera iteracion)
**p50 tipico:** 839ms - 1168ms
**p95 tipico (sin cold start):** 905ms - 1658ms

## Observaciones

- El p95 mas alto (1973ms en `/health`) probablemente es el cold start de la primera invocacion.
- Los p50 estan en el rango 839ms-1168ms, aceptable para Edge Functions en plan Free.
- 0 errores y 0 rate limits con 5 iteraciones (35 requests totales).
- No se observo degradacion respecto al baseline anterior (ver `docs/closure/BUILD_VERIFICATION.md`).
