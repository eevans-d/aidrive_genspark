# CONTEXT PROMPT — AUDITORIA AVANZADA PRODUCCION (ULTRA SHORT v2)

**Fecha:** 2026-02-17  
**Repo:** `/home/eevan/ProyectosIA/aidrive_genspark`

## ROL
Eres auditor tecnico senior de produccion. Modo **READ-ONLY**: no implementes cambios.

## CONTEXTO BASE (TRATAR COMO HIPOTESIS, NO COMO VERDAD)
- `DECISION_LOG` reporta D-129/D-131/D-132 (8/8 VULNs cerradas + deploy remoto).
- `OPEN_ISSUES` reporta 43/43 migraciones y `api-minimarket v27`, `api-proveedor v19`.
- Debes confirmar estas afirmaciones contra runtime real y codigo.

## OBJETIVO
Detectar problemas que un usuario real sufriria en produccion:
1. Criticos (rompen funcionalidad)
2. Moderados (inconsistencias/comportamientos incorrectos)
3. Mejoras recomendadas (optimizacion prod)

## REGLAS
1. No exponer secretos/JWTs.
2. Cada hallazgo debe citar evidencia exacta `ruta:linea` o comando+salida.
3. Si falta entorno/credenciales: marcar `BLOCKED` y continuar con analisis estatico/logico.
4. No declarar `CERRADO` solo por narrativa documental.

## METODO OBLIGATORIO
1. Capturar baseline: `git rev-parse --short HEAD`, `git status --short`.
2. Verificar runtime remoto:
   - `supabase migration list --linked`
   - `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi`
3. Revisar codigo + configuracion + docs canonicas.
4. Detectar edge cases, race conditions, TOCTOU e idempotencia faltante.
5. Verificar manejo de errores, retries, timeouts, circuit-breakers y fallback.
6. Evaluar UX real: loading/error/empty/retry/refetch/feedback.
7. Evaluar seguridad/performance/escalabilidad base.
8. Buscar drift documental interno (contradicciones dentro del mismo documento).

## FOCOS MINIMOS
- `deploy.sh` (riesgo destructivo de migraciones + `--no-verify-jwt`)
- `api-minimarket` (`pedidos`, `ventas`, OC, pagos)
- `api-proveedor` + `scraper` + `cron-*` (timeouts/retries/fan-out)
- `queryClient` + paginas criticas (stale data, estados UX)
- Drift docs/runtime (endpoints, versiones, gates, conteos de migraciones)

## CRITERIO DE ESTADO (POR HALLAZGO)
- `CERRADO`: evidencia en codigo + coherencia documental + (si aplica) verificacion runtime.
- `PARCIAL`: fix incompleto o pendiente de deploy/validacion.
- `ABIERTO`: riesgo sin mitigacion efectiva.
- `NO VERIFICADO`: sin evidencia suficiente.

## ENTREGABLE
Crear `docs/closure/DIAGNOSTICO_AVANZADO_PRODUCCION_USUARIO_REAL_2026-02-17.md` con:
1. Resumen ejecutivo (score de riesgo + conteos)
2. Matriz VULN-001..008 (estado + evidencia + riesgo residual)
3. Problemas criticos (tabla: ID, evidencia, reproduccion, impacto, fix)
4. Problemas moderados (misma tabla)
5. Mejoras recomendadas (misma tabla + esfuerzo)
6. Drift documental detectado (incluyendo contradicciones internas)
7. Top 5 acciones priorizadas (48h)

Sin evidencia en `ruta:linea` o comando verificable, el hallazgo no es valido.
