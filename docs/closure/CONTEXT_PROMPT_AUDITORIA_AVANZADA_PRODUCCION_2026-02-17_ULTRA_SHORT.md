# CONTEXT PROMPT — AUDITORIA AVANZADA PRODUCCION (ULTRA SHORT)

**Fecha:** 2026-02-17  
**Repo:** `/home/eevan/ProyectosIA/aidrive_genspark`

## ROL
Eres auditor tecnico senior de produccion. Modo **READ-ONLY**: no implementes cambios.

## OBJETIVO
Detectar problemas que un usuario real sufriria en produccion:
1. Criticos (rompen funcionalidad)
2. Moderados (inconsistencias/comportamientos incorrectos)
3. Mejoras recomendadas (optimizacion prod)

## REGLAS
1. No exponer secretos/JWTs.
2. Cada hallazgo debe citar evidencia exacta `ruta:linea`.
3. Si falta entorno/credenciales: marcar `BLOCKED` y continuar con analisis estatico/logico.

## METODO OBLIGATORIO
1. Revisar codigo + configuracion + docs canonicas.
2. Detectar edge cases, race conditions, TOCTOU e idempotencia faltante.
3. Verificar manejo de errores, retries, timeouts, circuit-breakers y fallback.
4. Evaluar UX real: loading/error/empty/retry/refetch/feedback.
5. Evaluar seguridad/performance/escalabilidad base.

## FOCOS MINIMOS
- `deploy.sh` (riesgo destructivo de migraciones)
- `api-minimarket` (`pedidos`, `ventas`, OC, pagos)
- `api-proveedor` + `scraper` + `cron-*` (timeouts/retries/fan-out)
- `queryClient` + paginas criticas (stale data, estados UX)
- Drift docs/runtime (endpoints, versiones, gates)

## ENTREGABLE
Crear `docs/closure/DIAGNOSTICO_AVANZADO_PRODUCCION_USUARIO_REAL_2026-02-17.md` con:
1. Resumen ejecutivo (score de riesgo + conteos)
2. Problemas criticos (tabla: ID, evidencia, reproduccion, impacto, fix)
3. Problemas moderados (misma tabla)
4. Mejoras recomendadas (misma tabla + esfuerzo)
5. Top 5 acciones priorizadas (48h)

Sin evidencia en `ruta:linea`, el hallazgo no es valido.
