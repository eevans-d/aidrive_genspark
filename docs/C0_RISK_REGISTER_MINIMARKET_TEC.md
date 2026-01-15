# C0_RISK_REGISTER_MINIMARKET_TEC

**Fecha:** 2026-01-15  
**Dominio:** TEC  
**Nivel:** Intermedio  
**Estado:** Draft (actualizar en cada checkpoint)

| ID | Riesgo | Sev | Prob | Impacto | Mitigación | Owner | Estado |
|----|--------|-----|------|---------|------------|-------|--------|
| R1 | Sin credenciales staging/prod → no se puede auditar RLS ni verificar migraciones | Alta | Alta | Exposición de datos, fallos en deploy | Mantener modo "sin credenciales"; gate en CI; planificar ventana en cuanto se otorguen claves; checklist RLS y migraciones listos | DevOps/DBA | Abierto |
| R2 | RLS tablas P0 no auditada | Alta | Media | Accesos indebidos a datos críticos | Ejecutar scripts rls_audit.sql y checklist al tener credenciales; evidenciar en CHECKLIST_CIERRE | DBA | Abierto |
| R3 | Migraciones no verificadas en prod | Alta | Media | Inconsistencia de schema y downtime | WS3.1 con evidencia por entorno; rollback documentado en DEPLOYMENT_GUIDE | DBA/Ops | Abierto |
| R4 | Runner Jest legacy puede generar resultados ambiguos | Media | Media | Confusión en suites y cobertura falsa | Migrar o desactivar Jest en tests/package.json; documentar ADR; usar Vitest único | QA/Backend | Abierto |
| R5 | Observabilidad parcial en cron auxiliares | Media | Media | Dificultad para diagnosticar fallos | WS1.6/WS4.2 adopción _shared/logger y métricas; eliminar console.* | Backend | Abierto |
| R6 | Validación runtime de alertas/comparaciones pendiente | Alta | Media | Alertas falsas/ausentes | WS4.1 con validadores y logging; tests de integración cuando haya datos | Backend | Abierto |
| R7 | Arquitectura desactualizada | Media | Media | Decisiones erróneas de diseño | Actualizar ARCHITECTURE_DOCUMENTATION (WS8.1) a estado real | Arquitectura/Backend | Abierto |
| R8 | Falta SLO/SLA e Incident Response formal | Media | Media | Tiempo de respuesta incierto ante incidentes | Crear C4_SLA_SLO y C4_INCIDENT_RESPONSE; definir oncall | Ops | Abierto |
| R9 | Paginación/select mínimo pendiente en frontend | Media | Media | Carga excesiva y riesgo de timeouts | WS5.5 implementar paginación y columnas mínimas | Frontend | Abierto |
| R10 | Dependencia de service role para lecturas | Media | Baja | Exposición de key y abuso | Aplicar D-017/D-018: ANON para lecturas, service solo escrituras | Backend | En progreso |
