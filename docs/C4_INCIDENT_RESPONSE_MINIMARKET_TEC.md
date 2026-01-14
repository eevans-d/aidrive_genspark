# C4_INCIDENT_RESPONSE_MINIMARKET_TEC

**Fecha:** 2026-01-14  
**Dominio:** TEC  
**Nivel:** Intermedio  
**Estado:** Draft

## Severidades (propuesta)
- SEV0: Caída total de API/cron o fuga de datos potencial.
- SEV1: Funcionalidad crítica degradada (stock, precios, cron alertas) sin workaround.
- SEV2: Degradación parcial con workaround aceptable.
- SEV3: Incidente menor o bug sin impacto crítico.

## Flujo de respuesta
1) Detectar y clasificar severidad.  
2) Notificar en canal técnico (issue + chat) con título `[SEVx]`.  
3) Asignar Incident Lead (IL) y Scribe.  
4) Contener: deshabilitar job/endpoint si necesario; revisar rate limit/circuit breaker.  
5) Mitigar: aplicar fix temporal (feature flag, rollback, revert).  
6) Resolver: fix definitivo; validar con tests relevantes.  
7) Documentar: resumen, línea de tiempo, root cause preliminar; actualizar CHECKLIST_CIERRE si aplica.  
8) Programar RCA/post-mortem (para SEV0/SEV1) en <72h.

## Roles
- Incident Lead: coordina, decide mitigación/rollback.
- Scribe: documenta tiempos, acciones, evidencias.
- Owners por dominio: Backend/DevOps (Edge/CI), QA (tests), DBA (DB/RLS), Frontend (UI), Seguridad (RLS/CORS).

## Canales
- Primario: GitHub Issue etiquetado `incident` con template breve (impacto, sev, ETA).
- Chat: uso para coordinación en vivo; decisiones finales vuelcan al issue.

## Runbooks rápidos
- Rollback migraciones: docs/DEPLOYMENT_GUIDE.md (WS3.2).
- Desactivar cron crítico: pausar job en cron orchestrator o comentar entrada (temporal, registrar en issue).
- Revisar RLS/grants: scripts/rls_audit.sql (solo lectura); no aplicar cambios sin checklist.
- Revisar gateway: toggles env (ALLOWED_ORIGINS, RATE_LIMIT); verificar JWT.

## Cierre del incidente
- Reunir evidencia: logs, métricas, capturas, commits.
- Actualizar DECISION_LOG si hubo cambios estructurales.
- Crear acciones de seguimiento en backlog (P0/P1) y asignar owners.
- Preparar post-mortem (ver template en MPC v2.1) para SEV0/SEV1.
