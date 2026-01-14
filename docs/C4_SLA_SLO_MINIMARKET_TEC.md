# C4_SLA_SLO_MINIMARKET_TEC

**Fecha:** 2026-01-14  
**Dominio:** TEC  
**Nivel:** Intermedio  
**Estado:** Draft (revisar al habilitar prod)

## Objetivo
Definir SLO mínimos y una propuesta de SLA interna para el sistema minimarket, alineados al alcance actual (Supabase, Edge Functions, frontend Vite).

## SLO propuestos (operación)
| Métrica | Objetivo | Medición | Cobertura |
|---------|----------|----------|-----------|
| Disponibilidad API gateway | 99.0% mensual (fase pre-prod) | Uptime monitor simple (ping) | api-minimarket |
| Latencia P50/P95 (gateway) | P50 < 300 ms, P95 < 800 ms | Logs + cron-dashboard (cuando esté) | api-minimarket |
| Error rate 5xx | < 1% de requests | Logs estructurados | api-minimarket |
| Éxito cron jobs críticos | ≥ 95% ejecuciones sin error | cron_jobs_execution_log | cron-jobs-maxiconsumo |
| Tiempo de respuesta soporte (incidente P0) | < 1h aack | Manual (chat/issue) | Equipo técnico |

## SLA interno (propuesto)
- Alcance: entornos controlados (staging/prod cuando existan). 
- Soporte P0: aceptación en <1h, mitigación en <4h, resolución best-effort <12h.
- Soporte P1: aceptación en <4h, mitigación en <24h.
- Soporte P2/P3: según planificación de sprints.

## Métricas pendientes
- No hay monitoreo automatizado de uptime/latencia aún; requiere activar métricas en cron-dashboard o servicio externo.
- SLO de frontend: pendiente instrumentación (Web Vitals) y caché.

## Supuestos
- Sin credenciales prod aún; SLO aplican en staging/local controlado.
- No se asume multiregión; sin HA garantizada.

## Próximos pasos
- Instrumentar medición (uptime/latencia) en CI o cron-dashboard.
- Definir owners de monitoreo y oncall (ver Incident Response).
- Revisar objetivos tras primer mes de operación real.
