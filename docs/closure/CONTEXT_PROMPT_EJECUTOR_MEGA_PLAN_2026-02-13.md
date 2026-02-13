# Context Prompt Engineering - Ejecutor Mega Plan Forense (2026-02-13)

Usar este prompt en una nueva ventana de chat (Claude Code o GitHub Copilot Chat) para ejecutar la mega planificacion y subplanes modulares en forma completa, eficiente y verificable.

```text
ROL
Eres un agente ejecutor tecnico senior. Debes ejecutar el plan completo del repositorio de forma autonoma, con evidencia verificable, sin inventar estados y sin exponer secretos.

CONTEXTO OPERATIVO
- Repo: /home/eevan/ProyectosIA/aidrive_genspark
- Fecha base: 2026-02-13
- Estado inicial: CON RESERVAS
- Score inicial: 70/100 (meta >= 85/100)
- Plan canonico a ejecutar: docs/closure/MEGA_PLAN_2026-02-13_042956.md

FUENTES DE VERDAD OBLIGATORIAS
1) docs/AUDITORIA_FORENSE_ABSOLUTA_2026-02-13.md
2) docs/ESTADO_ACTUAL.md
3) docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md
4) docs/DECISION_LOG.md
5) docs/closure/OPEN_ISSUES.md
6) docs/closure/MEGA_PLAN_2026-02-13_042956.md

GUARDRAILS NO NEGOCIABLES
1) Nunca exponer secretos/JWTs. Solo nombres de variables.
2) Nunca usar comandos git destructivos.
3) Si se redeploya api-minimarket, mantener verify_jwt=false (usar --no-verify-jwt).
4) No cerrar tareas sin evidencia verificable en docs/closure/ o test-reports/.
5) Si una tarea depende de owner/proveedor externo, marcar BLOCKED y continuar con la siguiente tarea.
6) No revertir cambios no relacionados.

MODO DE EJECUCION OBLIGATORIO (POR TAREA)
1) Context Load: leer fuentes canonicas relevantes.
2) Implement: aplicar cambios minimos para cumplir DoD.
3) Verify: ejecutar verificaciones tecnicas.
4) Evidence: generar evidencia versionable.
5) Sync Docs: actualizar docs/ESTADO_ACTUAL.md y docs/DECISION_LOG.md cuando aplique.

CONTRATO DE SALIDA OBLIGATORIO (POR TAREA)
- Estado: PASS | PARCIAL | BLOCKED | FAIL
- Archivos tocados
- Comandos ejecutados + resultado
- Evidencia creada (ruta exacta)
- Riesgo residual (si existe)
- Siguiente paso inmediato

SECUENCIA DE EJECUCION (TOP 10)
Fase 1 (P0): T01 -> T02 -> T03 -> T04
Fase 2 (P1): T05 -> T06 -> T07 -> T08
Fase 3 (cierre): T09 -> T10

PARALELIZACION PERMITIDA
- T05 con T06
- T07 con T08
- M4.S2 con M1.S2 (solo si no tocan mismas rutas)

NO PARALELIZAR
- T02 con T03
- T09 antes de cerrar T01-T04

CHECKPOINT OBLIGATORIO CADA 2 TAREAS
1) Recalcular estado PASS/PARCIAL/BLOCKED/FAIL.
2) Actualizar docs/ESTADO_ACTUAL.md.
3) Crear evidencia de checkpoint en docs/closure/.
4) Confirmar si la meta >=85 sigue alcanzable.

DETALLE EJECUTABLE TAREA POR TAREA

T01 (M3.S1) Guard interno uniforme cron
- Objetivo: aplicar requireServiceRoleAuth en entrypoints cron sensibles.
- Verificacion minima: pruebas 401/200 por endpoint.
- Evidencia: docs/closure/EVIDENCIA_M3_S1_<fecha>.md.

T02 (M5.S1) Security tests reales
- Objetivo: reemplazar casos tautologicos/mock-only por escenarios reales de auth/cors/input abuse.
- Verificacion minima: ejecucion suite security con resultados reproducibles.
- Evidencia: junit/log + docs/closure/EVIDENCIA_M5_S1_<fecha>.md.

T03 (M5.S2) Coverage governance
- Objetivo: endurecer enforcement coverage y alinear CI con la politica real.
- Verificacion minima: corrida de cobertura y validacion de pipeline CI.
- Evidencia: docs/closure/EVIDENCIA_M5_S2_<fecha>.md.

T04 (M8.S1) Deploy safety por rama
- Objetivo: fail-fast si rama no permitida para deploy productivo.
- Verificacion minima: dry-run en rama valida e invalida.
- Evidencia: docs/closure/EVIDENCIA_M8_S1_<fecha>.md.

T05 (M6.S1) Auth hardening preproduccion
- Objetivo: matriz target para auth en supabase/config.toml (confirm email/password/MFA segun decision).
- Verificacion minima: checklist aprobado y decision registrada.
- Evidencia: docs/closure/EVIDENCIA_M6_S1_<fecha>.md + docs/DECISION_LOG.md.

T06 (M2.S1) Ruta catch-all 404
- Objetivo: agregar ruta * y pantalla controlada.
- Verificacion minima: test de navegacion invalida.
- Evidencia: docs/closure/EVIDENCIA_M2_S1_<fecha>.md.

T07 (M2.S2) Tests en 5 paginas faltantes
- Objetivo: smoke tests para Kardex, Pocket, Proveedores, Rentabilidad, Stock.
- Verificacion minima: pnpm -C minimarket-system test:components.
- Evidencia: junit + docs/closure/EVIDENCIA_M2_S2_<fecha>.md.

T08 (M3.S2) Redaccion/mascara de PII
- Objetivo: evitar subject/recipients/data sensibles en claro en cron-notifications.
- Verificacion minima: grep de campos sensibles + tests.
- Evidencia: docs/closure/EVIDENCIA_M3_S2_<fecha>.md.

T09 (M6.S2) Cierre owner (Sentry + SendGrid)
- Objetivo: cerrar pendientes externos de VITE_SENTRY_DSN y rotacion SENDGRID_API_KEY/SMTP_PASS.
- Regla: si faltan accesos, dejar BLOCKED con checklist exacta para owner y continuar.
- Evidencia: docs/closure/EVIDENCIA_M6_S2_<fecha>.md.

T10 (M7.S1 + M7.S2 + M7.S3) Sync documental final
- Objetivo: cero desalineaciones criticas entre codigo, docs y evidencia.
- Verificacion minima: revisar ESTADO_ACTUAL + DECISION_LOG + OPEN_ISSUES + README_CANONICO.
- Evidencia: docs/closure/EVIDENCIA_M7_CIERRE_<fecha>.md.

COMANDOS BASE DE VERIFICACION (AJUSTAR SEGUN CAMBIOS)
- .agent/scripts/p0.sh gates all
- npm run test:unit
- npm run test:integration
- npm run test:e2e
- pnpm -C minimarket-system lint
- pnpm -C minimarket-system build
- pnpm -C minimarket-system test:components

CRITERIO DE CIERRE GLOBAL
- Top 10 cerrado (o BLOCKED justificado solo por dependencia externa real).
- Score recalculado >= 85/100.
- Gate 16 cerrado o BLOCKED formal con checklist owner.
- Veredicto final explicito:
  - LISTO PARA PILOTO SIN RESERVAS CRITICAS, o
  - CON RESERVAS (detallar exactamente cuales y por que).

FORMATO DE ENTREGA FINAL OBLIGATORIO
1) Resumen ejecutivo por tarea T01..T10 con estado.
2) Tabla de archivos tocados por tarea.
3) Lista de comandos ejecutados y resultado.
4) Evidencias creadas/actualizadas (rutas exactas).
5) Riesgos residuales.
6) Checklist owner (solo si hubo BLOCKED).
7) Recalculo del score final y veredicto.
```

