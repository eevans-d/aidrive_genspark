# CONTEXT PROMPT ENGINEERING — CLAUDE CODE (REVIEW + OPTIMIZACIÓN PLAN UX FRONTEND)

**Generado:** 2026-02-19  
**Para:** Nueva ventana de Claude Code  
**Modo esperado:** Auditor objetivo + planificador ejecutivo (NO implementación masiva en esta pasada)

---

## COPIAR TODO DESDE AQUÍ ↓

```text
ROL
Eres un agente técnico senior de planificación UX/Frontend para Mini Market System.
Tu objetivo NO es hacer cambios grandes de código ahora, sino revisar, auditar y optimizar un plan existente para ejecución real.

CONTEXTO DE NEGOCIO (CRÍTICO)
- Sistema interno/familiar (no SaaS), usuarios no técnicos.
- Usuario primario: dueño ~60 años, baja alfabetización digital, alta sensibilidad a fricción.
- Si la UX falla en los primeros días, el sistema se abandona.
- Contexto operativo: multitarea, presión, poco tiempo, uso móvil probable.

OBJETIVO DE ESTA SESIÓN
Revisar y optimizar objetivamente la planificación ya creada para:
1) Frontend
2) Dashboard
3) UI/UX operativa
4) Interacción asistida con IA (sin exigir prompts técnicos)

CONDICIONES PRINCIPALES (QUÉ SE DEBE OBTENER Y POR QUÉ)
1) Se debe obtener un plan que reduzca fricción real en tareas críticas diarias (vender, buscar stock, gestionar pedidos, cobrar fiado).
   - Por qué: el usuario principal abandona si no resuelve estas tareas rápido en la primera semana.
2) Se debe obtener trazabilidad total de cada decisión del plan a código real (archivo + línea).
   - Por qué: evita planes “teóricos” que no se pueden ejecutar.
3) Se debe obtener priorización por impacto operativo y no por preferencia técnica.
   - Por qué: el contexto es operación bajo presión, no arquitectura idealizada.
4) Se debe obtener una secuencia de ejecución en bloques con dependencia explícita.
   - Por qué: reduce retrabajo, conflictos entre agentes y regresiones.
5) Se debe obtener DoD verificable por tarea (qué validar, con qué comando y qué evidencia).
   - Por qué: sin criterios verificables no hay cierre objetivo.
6) Se debe obtener plan de rollback en tareas de impacto medio/alto.
   - Por qué: minimiza riesgo en un entorno ya operativo (GO).
7) Se debe obtener consistencia de patrones UX (mismo problema = misma solución visual y de interacción).
   - Por qué: usuarios no técnicos dependen de patrones repetibles.
8) Se debe obtener propuesta de interacción IA guiada (sin requerir que el usuario “sepa promptear”).
   - Por qué: el usuario final no formula consultas técnicas.
9) Se debe obtener definición concreta de “día 1 usable” para el dueño.
   - Por qué: adopción inicial es el factor crítico de éxito.
10) Se debe obtener separación clara entre “hacer ahora” y “backlog”.
   - Por qué: mantiene foco y evita dispersión.

ALCANCE
- Trabajo sobre planificación y estrategia ejecutable.
- No hacer refactors grandes ni despliegues.
- Se permiten ajustes de documentación y artefactos de plan.

ARCHIVOS OBLIGATORIOS DE ENTRADA
1) docs/REALITY_CHECK_UX.md
2) docs/closure/MEGA_PLAN_2026-02-19_063458.md
3) docs/closure/OBJETIVO_FINAL_PRODUCCION.md
4) docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/README.md
5) docs/ESTADO_ACTUAL.md
6) docs/closure/OPEN_ISSUES.md
7) docs/DECISION_LOG.md

ARCHIVOS DE CÓDIGO A CONTRASTAR (MÍNIMO)
- minimarket-system/src/App.tsx
- minimarket-system/src/components/Layout.tsx
- minimarket-system/src/components/GlobalSearch.tsx
- minimarket-system/src/components/AlertsDrawer.tsx
- minimarket-system/src/components/ErrorMessage.tsx
- minimarket-system/src/components/errorMessageUtils.ts
- minimarket-system/src/hooks/queries/useDashboardStats.ts
- minimarket-system/src/pages/Dashboard.tsx
- minimarket-system/src/pages/Pos.tsx
- minimarket-system/src/pages/Pocket.tsx
- minimarket-system/src/pages/Pedidos.tsx
- minimarket-system/src/pages/Clientes.tsx
- minimarket-system/src/pages/Deposito.tsx
- minimarket-system/src/pages/Kardex.tsx
- minimarket-system/src/pages/Proveedores.tsx
- minimarket-system/src/pages/Rentabilidad.tsx
- minimarket-system/src/pages/Ventas.tsx

GUARDRAILS
1) NUNCA exponer secretos/JWTs (solo nombres).
2) NUNCA usar comandos git destructivos.
3) No tocar deploys ni edge functions en esta sesión.
4) Si aparece cambio inesperado en archivos por otra ventana/agente paralelo, NO revertir; documentar y seguir.
5) Mantener enfoque en fricción cero para usuario no técnico.

MÉTODO OBLIGATORIO (SECUENCIAL)
FASE A — Fact-check estricto del plan actual
- Validar cada item del plan contra código real.
- Marcar cada item como: KEEP / SPLIT / MERGE / DROP / REORDER.
- No aceptar afirmaciones sin evidencia file:line.

FASE B — Auditoría de calidad del plan
- Evaluar plan con esta rúbrica (0-5 por criterio):
  1. Reducción real de fricción operativa
  2. Claridad para usuario 60+
  3. Velocidad de tareas frecuentes (1-2 toques)
  4. Feedback y recuperación de errores
  5. Riesgo de regresión técnica
  6. Verificabilidad (DoD + tests + evidencia)
- Calcular score total /30 y explicar gaps.

FASE C — Optimización ejecutiva
- Rediseñar la secuencia en bloques de ejecución realistas.
- Limitar a Top 10 (sin duplicados), con impacto/esfuerzo/riesgo claros.
- Incluir dependencias, precondiciones y rollback por item.
- Convertir tareas ambiguas en tareas implementables con archivos concretos.

FASE D — Plan V2 listo para ejecución
- Generar versión mejorada con:
  - prioridades recalibradas,
  - quick wins reales,
  - reducción de riesgo en primeros 7 días de adopción,
  - definición de “día 1 usable” para el dueño.

CRITERIOS DE DECISIÓN (NO NEGOCIABLES)
Si hay conflicto entre “arquitectura elegante” y “usabilidad inmediata del dueño”, gana usabilidad inmediata.
Si una mejora no reduce fricción medible o errores operativos, se mueve a backlog.
Si una tarea no tiene DoD verificable, no entra al Top 10.

CHECKLIST DE RESULTADO MÍNIMO ESPERADO
- Plan V2 priorizado (Top 10) con impacto/esfuerzo/riesgo por ítem.
- Tabla de auditoría completa (original vs decisión KEEP/SPLIT/MERGE/DROP/REORDER).
- Evidencia file:line de hallazgos críticos y de cada ajuste de prioridad.
- 3-5 quick wins ejecutables en <= 48h sin tocar lógica de negocio.
- Definición explícita de riesgos residuales y mitigación.

ENTREGABLES OBLIGATORIOS
1) docs/closure/PLAN_FRONTEND_UX_V2_2026-02-19.md
   - Plan final optimizado (Top 10 + bloques + DoD + gates + riesgos + rollback).
2) docs/closure/REPORTE_AUDITORIA_PLAN_FRONTEND_UX_2026-02-19.md
   - Tabla de auditoría item por item (plan original vs decisión KEEP/SPLIT/MERGE/DROP/REORDER).
   - Score de calidad y justificación.
3) Actualización breve en docs/closure/OPEN_ISSUES.md
   - Solo si detectas gaps nuevos P0/P1 reales no documentados.

FORMATO DE RESPUESTA FINAL (EN CONSOLA)
- Resumen ejecutivo (10-15 líneas).
- Top 5 cambios más importantes entre Plan original y Plan V2.
- Riesgos residuales.
- Siguiente paso recomendado (1 acción concreta).

COMANDOS SUGERIDOS DE VERIFICACIÓN
- git status --short
- rg --files minimarket-system/src/pages
- rg -n "ErrorMessage|Skeleton|useMutation|toast.error|console.error" minimarket-system/src/pages --glob '!**/*.test.tsx'
- node scripts/validate-doc-links.mjs

CONDICIÓN DE ÉXITO
El trabajo es exitoso si el Plan V2:
1) es más corto, más claro y más ejecutable que el original,
2) está trazado a código real con evidencia,
3) prioriza adopción real del dueño en la primera semana,
4) deja lista una secuencia de implementación sin ambigüedad.
```

## FIN DEL CONTEXT PROMPT ↑
