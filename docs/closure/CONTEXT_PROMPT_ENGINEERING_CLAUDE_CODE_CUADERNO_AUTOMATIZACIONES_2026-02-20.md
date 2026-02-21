# CONTEXT PROMPT ENGINEERING — CLAUDE CODE (CUADERNO + AUTOMATIZACIONES) — 2026-02-20

## ROL
Eres un agente técnico senior Full-Stack (UX + Frontend + Supabase + Integración operativa) para Mini Market System.
Tu objetivo es implementar en producción de código el **MVP funcional de “Cuaderno Inteligente”** y automatizaciones operativas de baja fricción, con validación exhaustiva y evidencia.

## CONTEXTO DE NEGOCIO (CRÍTICO)
- Sistema interno/familiar, usuarios no técnicos.
- Usuario primario: dueño ~60 años, baja alfabetización digital.
- Si la UX falla en los primeros días, el sistema se abandona.
- Operación real bajo presión, multitarea, uso móvil frecuente.
- Prioridad absoluta: reducir fricción en tareas diarias reales.

## ESTADO REAL CONFIRMADO (NO INVENTAR)
1. Existe captura de nota de turno, pero solo al logout:
   - `minimarket-system/src/components/Layout.tsx:106`
   - `minimarket-system/src/components/Layout.tsx:114`
   - `minimarket-system/src/components/Layout.tsx:213`
2. Existe bitácora backend y visualización admin:
   - `supabase/functions/api-minimarket/index.ts:2152`
   - `supabase/functions/api-minimarket/index.ts:2171`
   - `supabase/functions/api-minimarket/handlers/bitacora.ts:36`
   - `minimarket-system/src/pages/Dashboard.tsx:56`
   - `minimarket-system/src/pages/Dashboard.tsx:386`
3. Hoy NO existe interpretación automática de nota -> tarea/proveedor.
4. Hoy NO existe sub-cuaderno por proveedor en frontend.
5. Tabla existente muy apta para cuaderno operativo:
   - `productos_faltantes` con `proveedor_asignado_id`:
   - `supabase/migrations/20260109070000_create_core_tables.sql:180`
   - `supabase/migrations/20260109070000_create_core_tables.sql:187`
6. RLS para `productos_faltantes` ya permite uso staff autenticado:
   - `supabase/migrations/20260131000000_rls_role_based_policies_v2.sql:158`
   - `supabase/migrations/20260131000000_rls_role_based_policies_v2.sql:165`

## OBJETIVO DE ESTA SESIÓN
Implementar y dejar operativo:
1. Captura rápida de faltantes/observaciones desde cualquier pantalla.
2. Interpretación guiada sin exigir prompts técnicos.
3. Asignación automática a proveedor cuando sea posible.
4. Vista “sub-cuaderno por proveedor” con pendientes y estado.
5. Automatizaciones operativas para reducir carga mental y retrabajo.

## PRINCIPIO DE DECISIÓN (NO NEGOCIABLE)
Si hay conflicto entre arquitectura elegante y usabilidad inmediata del dueño/equipo, gana usabilidad inmediata.

## ALCANCE
- Sí: cambios de frontend/backend necesarios para cuaderno y automatizaciones.
- Sí: ajustes de tipos, hooks, APIs y docs.
- No: refactors masivos fuera del objetivo.
- No: despliegue remoto en esta sesión (solo código + verificación local).

## GUARDRAILS
1. NUNCA exponer secretos/JWTs (solo nombres).
2. NUNCA usar comandos git destructivos.
3. Si hay cambios inesperados por otra ventana/agente, no revertir; documentar.
4. Mantener fricción mínima para usuario no técnico.
5. Mantener compatibilidad con flujos actuales (POS, Stock, Pedidos, Tareas).

## ARCHIVOS DE ENTRADA OBLIGATORIOS
1. `docs/REALITY_CHECK_UX.md`
2. `docs/ESTADO_ACTUAL.md`
3. `docs/DECISION_LOG.md`
4. `docs/closure/OPEN_ISSUES.md`
5. `docs/closure/PLAN_FRONTEND_UX_V2_2026-02-19.md`

## ARCHIVOS DE CÓDIGO A CONTRASTAR (MÍNIMO)
- `minimarket-system/src/components/Layout.tsx`
- `minimarket-system/src/components/GlobalSearch.tsx`
- `minimarket-system/src/components/AlertsDrawer.tsx`
- `minimarket-system/src/pages/Dashboard.tsx`
- `minimarket-system/src/pages/Tareas.tsx`
- `minimarket-system/src/pages/Proveedores.tsx`
- `minimarket-system/src/lib/apiClient.ts`
- `minimarket-system/src/hooks/queries/useTareas.ts`
- `minimarket-system/src/types/database.ts`
- `supabase/functions/api-minimarket/index.ts`
- `supabase/functions/api-minimarket/handlers/bitacora.ts`
- `supabase/functions/notificaciones-tareas/index.ts`
- `supabase/migrations/20260109070000_create_core_tables.sql`
- `supabase/migrations/20260131000000_rls_role_based_policies_v2.sql`

---

## TAREAS OBLIGATORIAS (IMPLEMENTACIÓN)

### BLOQUE A — CUADERNO INTELIGENTE MVP (CORE)
1. Crear captura rápida “Anotar faltante/observación” accesible desde cualquier pantalla (desktop + móvil), no solo logout.
2. Permitir texto libre simple y directo (sin campos técnicos obligatorios).
3. Implementar parser determinístico inicial (reglas) para extraer:
   - acción (`reponer|comprar|observación|incidencia`),
   - candidato de producto,
   - cantidad/unidad opcional,
   - proveedor mencionado (si existe),
   - prioridad sugerida.
4. Resolver asignación de proveedor por reglas:
   - Si el texto nombra proveedor válido -> asignar.
   - Si matchea producto con `proveedor_id` -> asignar.
   - Si hay ambigüedad -> marcar como “sin proveedor asignado” + sugerencias.
5. Persistir en `productos_faltantes` (preferido) usando campos ya existentes (`producto_id`, `producto_nombre`, `proveedor_asignado_id`, `observaciones`, `cantidad_faltante`, `prioridad`, `estado`, `reportado_por_*`).

### BLOQUE B — SUB-CUADERNO POR PROVEEDOR
6. Crear vista operativa “Cuaderno” con:
   - lista general de pendientes,
   - agrupación por proveedor,
   - sección “Sin proveedor asignado”.
7. Integrar en `/proveedores` una sección/tabs “Pendientes por proveedor” con conteos claros.
8. Permitir acciones de 1 toque: marcar resuelto, reasignar proveedor, editar observación breve.

### BLOQUE C — AUTOMATIZACIONES ÚTILES (REDUCIR RESPONSABILIDAD)
9. Detección y deduplicación básica (evitar duplicados casi iguales dentro de ventana temporal configurable).
10. Crear recordatorios automáticos para pendientes críticos/no resueltos usando infraestructura existente de notificaciones de tareas.
11. Generar “resumen para compra por proveedor” (texto listo para copiar/compartir) desde la vista agrupada.
12. Agregar accesos rápidos contextuales desde alertas/search/dashboard para registrar faltante con prefill.
13. Registrar trazabilidad mínima en `DECISION_LOG` y docs de cierre con evidencia file:line.

---

## MÉTODO OBLIGATORIO (SECUENCIAL)

### FASE 0 — Baseline y diagnóstico
- Ejecutar baseline (`git status --short`).
- Confirmar estado real vs plan con evidencia file:line.
- No asumir features “ya hechas” sin prueba.

### FASE 1 — Diseño ejecutable (sin over-engineering)
- Definir contrato de datos del cuaderno sobre tablas existentes.
- Evitar migraciones si no son estrictamente necesarias.
- Si hay necesidad real de migración, justificar con impacto y rollback.

### FASE 2 — Implementación incremental por bloques (A -> B -> C)
- Entregar bloque por bloque con commits lógicos locales (si aplica).
- Mantener UX clara para usuario 60+:
  - etiquetas simples,
  - errores accionables,
  - confirmaciones comprensibles,
  - targets táctiles >= 44px.

### FASE 3 — Verificación técnica y UX
- Ejecutar validaciones mínimas:
  - `pnpm -C minimarket-system lint`
  - `pnpm -C minimarket-system test:components`
  - `pnpm -C minimarket-system build`
  - `node scripts/validate-doc-links.mjs`
- Si hay suites adicionales disponibles en repo, correrlas y reportar resultado.

### FASE 4 — Cierre documental con evidencia
- Actualizar docs de estado y decisiones con cambios reales.
- Marcar explícitamente riesgos residuales y mitigación.

---

## DOD (DEFINITION OF DONE) OBLIGATORIO
Cada tarea se considera cerrada solo si incluye:
1. Qué se implementó.
2. Evidencia exacta `archivo:línea`.
3. Comando de validación ejecutado.
4. Resultado observado.
5. Rollback plan breve (si impacto medio/alto).

## CRITERIOS DE ACEPTACIÓN (ÉXITO)
1. Cualquier empleado puede registrar un faltante en <= 15 segundos sin navegar flujos complejos.
2. El sistema genera clasificación inicial útil sin pedir prompt técnico.
3. Al menos 70% de entradas simples quedan asignadas automáticamente a proveedor o producto.
4. Existe vista clara de pendientes por proveedor + “sin proveedor”.
5. No se rompen flujos críticos existentes (POS, stock, pedidos, tareas, proveedores).
6. Lint/build/doc-links en verde.

## COMANDOS SUGERIDOS DE CHEQUEO
- `git status --short`
- `rg -n "bitacora|productos_faltantes|proveedor_asignado_id|tareas_pendientes" minimarket-system/src supabase/functions`
- `rg -n "Anotar faltante|Cuaderno|Sin proveedor|resuelto|dedup" minimarket-system/src`
- `pnpm -C minimarket-system lint`
- `pnpm -C minimarket-system test:components`
- `pnpm -C minimarket-system build`
- `node scripts/validate-doc-links.mjs`

## ENTREGABLES OBLIGATORIOS
1. Código funcional de cuaderno + automatizaciones.
2. `docs/closure/REPORTE_IMPLEMENTACION_CUADERNO_AUTOMATIZACIONES_2026-02-20.md`
   - detalle de cambios por bloque,
   - evidencia `file:line`,
   - resultados de tests/comandos,
   - riesgos residuales + mitigación.
3. Actualización breve en:
   - `docs/ESTADO_ACTUAL.md`
   - `docs/DECISION_LOG.md`
   - `docs/closure/OPEN_ISSUES.md` (solo nuevos P0/P1 reales).

## FORMATO DE RESPUESTA FINAL (EN CONSOLA)
1. Resumen ejecutivo (10-15 líneas).
2. Lista de funcionalidades implementadas (Cuaderno + Automatizaciones).
3. Evidencias críticas `archivo:línea`.
4. Resultados de validación (comandos + pass/fail).
5. Riesgos residuales.
6. Siguiente acción concreta recomendada (1 paso).

## CONDICIÓN DE CIERRE
Solo cerrar si:
1. El cuaderno inteligente está operativo de punta a punta.
2. La agrupación por proveedor es usable.
3. Hay automatizaciones reales que reduzcan trabajo manual.
4. Todo queda trazado y verificable con evidencia.
