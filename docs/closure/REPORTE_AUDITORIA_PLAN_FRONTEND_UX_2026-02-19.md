# REPORTE AUDITORIA PLAN FRONTEND UX 2026-02-19

- Fecha: `2026-02-19`
- Objetivo auditado: plan frontend/dashboard/UI-UX/IA para adopción real del dueño (60+, baja alfabetización digital).
- Método: fact-check estricto contra código real + rúbrica de calidad + rediseño ejecutivo del plan.

## 1) Alcance y fuentes

### 1.1 Documentos auditados

1. `docs/REALITY_CHECK_UX.md`
2. `docs/closure/MEGA_PLAN_2026-02-19_063458.md`
3. `docs/closure/OBJETIVO_FINAL_PRODUCCION.md`
4. `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/README.md`
5. `docs/ESTADO_ACTUAL.md`
6. `docs/closure/OPEN_ISSUES.md`
7. `docs/DECISION_LOG.md`

### 1.2 Código contrastado (mínimo requerido)

- `minimarket-system/src/App.tsx`
- `minimarket-system/src/components/Layout.tsx`
- `minimarket-system/src/components/GlobalSearch.tsx`
- `minimarket-system/src/components/AlertsDrawer.tsx`
- `minimarket-system/src/components/ErrorMessage.tsx`
- `minimarket-system/src/components/errorMessageUtils.ts`
- `minimarket-system/src/hooks/queries/useDashboardStats.ts`
- `minimarket-system/src/pages/Dashboard.tsx`
- `minimarket-system/src/pages/Pos.tsx`
- `minimarket-system/src/pages/Pocket.tsx`
- `minimarket-system/src/pages/Pedidos.tsx`
- `minimarket-system/src/pages/Clientes.tsx`
- `minimarket-system/src/pages/Deposito.tsx`
- `minimarket-system/src/pages/Kardex.tsx`
- `minimarket-system/src/pages/Proveedores.tsx`
- `minimarket-system/src/pages/Rentabilidad.tsx`
- `minimarket-system/src/pages/Ventas.tsx`

## 2) FASE A - Fact-check estricto (plan actual vs código)

### 2.1 Hallazgos críticos confirmados

- Conteos del dashboard pueden subestimar datos reales por límites de query (`limit(5)` y `limit(100)`), mientras UI muestra estos valores como totales: `minimarket-system/src/hooks/queries/useDashboardStats.ts:24`, `minimarket-system/src/hooks/queries/useDashboardStats.ts:30`, `minimarket-system/src/hooks/queries/useDashboardStats.ts:36`, `minimarket-system/src/pages/Dashboard.tsx:113`.
- POS y Pocket existen como rutas protegidas, pero no aparecen en la navegación principal: `minimarket-system/src/App.tsx:170`, `minimarket-system/src/App.tsx:179`, `minimarket-system/src/components/Layout.tsx:25`.
- La navegación móvil está sobrecargada (11 módulos con grilla `grid-cols-8`): `minimarket-system/src/components/Layout.tsx:26`, `minimarket-system/src/components/Layout.tsx:268`.
- Las quick actions están confinadas al modal de búsqueda global, no en la pantalla base operativa: `minimarket-system/src/components/GlobalSearch.tsx:43`, `minimarket-system/src/components/GlobalSearch.tsx:325`, `minimarket-system/src/pages/Dashboard.tsx:73`.
- Skeleton incompleto en páginas operativas clave; varias siguen con `Cargando...` o spinner simple: `minimarket-system/src/pages/Clientes.tsx:150`, `minimarket-system/src/pages/Kardex.tsx:86`, `minimarket-system/src/pages/Proveedores.tsx:109`, `minimarket-system/src/pages/Rentabilidad.tsx:101`, `minimarket-system/src/pages/Ventas.tsx:109`, `minimarket-system/src/pages/Pocket.tsx:141`.

### 2.2 Tabla de auditoría item por item (Plan original)

| # | Item original (plan) | Decisión | Evidencia (fact-check) | Ajuste aplicado en V2 |
|---|---|---|---|---|
| 1 | Corregir integridad de métricas dashboard (`docs/closure/MEGA_PLAN_2026-02-19_063458.md:37`) | `REORDER` | Métricas truncadas y mostradas como total: `minimarket-system/src/hooks/queries/useDashboardStats.ts:24`, `minimarket-system/src/hooks/queries/useDashboardStats.ts:36`, `minimarket-system/src/pages/Dashboard.tsx:113` | Sube a prioridad #1 de ejecución real. |
| 2 | Dashboard operativo de 1 toque (`docs/closure/MEGA_PLAN_2026-02-19_063458.md:48`) | `MERGE` | Dashboard actual no tiene CTA de navegación operativa: `minimarket-system/src/pages/Dashboard.tsx:73` | Se fusiona con item 5 en “Hub Operativo Día 1”. |
| 3 | Rediseñar navegación baja carga cognitiva (`docs/closure/MEGA_PLAN_2026-02-19_063458.md:59`) | `REORDER` | 11 ítems y `grid-cols-8`: `minimarket-system/src/components/Layout.tsx:26`, `minimarket-system/src/components/Layout.tsx:268` | Pasa al bloque inicial (48h) por impacto directo en adopción. |
| 4 | Asistente IA guiado (`docs/closure/MEGA_PLAN_2026-02-19_063458.md:71`) | `SPLIT` | Hay APIs y CTAs parciales (`minimarket-system/src/lib/apiClient.ts:739`, `minimarket-system/src/components/AlertsDrawer.tsx:473`, `minimarket-system/src/components/GlobalSearch.tsx:430`), pero no ruta/pantalla dedicada en router (`minimarket-system/src/App.tsx:65`) | Se divide en Fase 1 (embebido inmediato) + Fase 2 (ruta dedicada a backlog). |
| 5 | Quick actions fuera del buscador (`docs/closure/MEGA_PLAN_2026-02-19_063458.md:82`) | `MERGE` | Quick actions viven en modal search: `minimarket-system/src/components/GlobalSearch.tsx:43`, `minimarket-system/src/components/GlobalSearch.tsx:327` | Se integra al Hub Operativo (item #2 V2). |
| 6 | Skeleton en 8 páginas faltantes (`docs/closure/MEGA_PLAN_2026-02-19_063458.md:92`) | `REORDER` | Loading inconsistente sin Skeleton en páginas críticas: `minimarket-system/src/pages/Kardex.tsx:86`, `minimarket-system/src/pages/Proveedores.tsx:109`, `minimarket-system/src/pages/Ventas.tsx:109` | Se mueve a quick win (<=48h) por bajo riesgo y alto impacto perceptivo. |
| 7 | Estandarizar mensajes de error (`docs/closure/MEGA_PLAN_2026-02-19_063458.md:103`) | `KEEP` | Parser actual por `includes(...)`: `minimarket-system/src/components/errorMessageUtils.ts:32`; requestId UI existe pero no se propaga desde páginas: `minimarket-system/src/components/ErrorMessage.tsx:88`, `minimarket-system/src/pages/Dashboard.tsx:55` | Se mantiene, reforzando DoD con mapeo por status/code + requestId visible. |
| 8 | Onboarding silencioso primer uso (`docs/closure/MEGA_PLAN_2026-02-19_063458.md:115`) | `REORDER` | No implementación en dashboard actual: `minimarket-system/src/pages/Dashboard.tsx:73` | Se baja detrás de quick wins de flujo diario. |
| 9 | Accesibilidad funcional 60+ (`docs/closure/MEGA_PLAN_2026-02-19_063458.md:125`) | `KEEP` | Ya hay botones grandes en POS/Pocket (`minimarket-system/src/pages/Pos.tsx:549`, `minimarket-system/src/pages/Pocket.tsx:520`), pero navegación móvil sigue saturada (`minimarket-system/src/components/Layout.tsx:268`) | Se mantiene con foco en consistencia entre módulos críticos. |
| 10 | Performance UX y estabilidad (`docs/closure/MEGA_PLAN_2026-02-19_063458.md:137`) | `DROP` | Impacto declarado bajo (`Impacto 1`) y sin relación directa a fricción Día 1 (`docs/REALITY_CHECK_UX.md:27`) | Sale del Top 10 y pasa a backlog post-adopción. |

## 3) FASE B - Auditoría de calidad del plan (rúbrica 0-5)

| Criterio | Puntaje | Evidencia | Gap detectado |
|---|---:|---|---|
| Reducción real de fricción operativa | 3/5 | El plan ataca P0 correctos (`docs/closure/MEGA_PLAN_2026-02-19_063458.md:29`) | Duplicación de iniciativas (items 2 y 5) diluye foco de ejecución. |
| Claridad para usuario 60+ | 3/5 | Incluye a11y y onboarding (`docs/closure/MEGA_PLAN_2026-02-19_063458.md:115`, `docs/closure/MEGA_PLAN_2026-02-19_063458.md:125`) | Falta definición operacional explícita de “Día 1 usable”. |
| Velocidad de tareas frecuentes (1-2 toques) | 2/5 | POS/Pocket no están en navegación principal (`minimarket-system/src/App.tsx:170`, `minimarket-system/src/components/Layout.tsx:25`) | El plan no fuerza primero visibilidad de vender/fiado antes de mejoras secundarias. |
| Feedback y recuperación de errores | 3/5 | Existe `ErrorMessage` transversal (`minimarket-system/src/pages/Dashboard.tsx:55`) | Parser todavía heurístico por texto (`minimarket-system/src/components/errorMessageUtils.ts:32`) y requestId no visible en consumo real. |
| Riesgo de regresión técnica | 2/5 | Ítems medianos/altos con rollback genérico | No hay feature flags obligatorios para todos los cambios de navegación/hub. |
| Verificabilidad (DoD + tests + evidencia) | 3/5 | El plan original incluye comandos y evidencias (`docs/closure/MEGA_PLAN_2026-02-19_063458.md:42`) | Varios DoD son aspiracionales y no mapean métricas por flujo crítico. |

**Score total:** `16/30`

### Brechas clave que explican el 16/30

1. Duplicación funcional entre dashboard 1-toque y quick actions fuera de buscador.
2. Secuencia de ejecución no obliga resolver antes la fricción de venta (POS/fiado visible).
3. Falta contrato medible de adopción inicial (primera semana, tareas críticas, tiempos/taps).
4. DoD y validación insuficientemente ligados a rutas/archivos por flujo operativo.

## 4) FASE C - Optimización ejecutiva aplicada

- Priorización recalibrada por impacto operativo (no por elegancia técnica).
- Separación explícita entre “hacer ahora” y backlog.
- Top 10 final sin duplicados (items 2+5 fusionados, item 10 movido a backlog).
- Dependencias explícitas por bloque para evitar retrabajo.
- Rollback definido para cada item de riesgo medio/alto.

## 5) Quick wins <=48h identificados (sin tocar lógica de negocio)

1. Exponer accesos directos a `POS`/`Pocket` y compactar navegación móvil (`minimarket-system/src/components/Layout.tsx:25`).
2. Agregar Hub Operativo en Dashboard con CTA visibles de tareas diarias (`minimarket-system/src/pages/Dashboard.tsx:73`).
3. Completar Skeleton en páginas de mayor uso diario (`minimarket-system/src/pages/Clientes.tsx:150`, `minimarket-system/src/pages/Ventas.tsx:109`, `minimarket-system/src/pages/Proveedores.tsx:109`).
4. Normalizar formato monetario explícito en Pedidos (`minimarket-system/src/pages/Pedidos.tsx:222`).
5. Reemplazar `console.error` de logout por feedback visible al usuario (`minimarket-system/src/components/Layout.tsx:88`).

## 6) Riesgos residuales y mitigación

| Riesgo residual | Nivel | Mitigación recomendada |
|---|---|---|
| Regresión de navegación por roles al simplificar menú | Medio | Feature flag `NAV_V2` + tests de `Layout`/`App` por rol antes de merge. |
| Sobrecarga visual en dashboard al añadir CTAs | Medio | Limitar a 4 acciones críticas + test de usabilidad móvil (pantalla pequeña). |
| Inconsistencia de copy de errores al extender mapeo | Bajo | Suite unitaria para `parseErrorMessage` por status/code + snapshot de componentes. |
| IA guiada genere expectativas de “chat libre” | Medio | Mantener IA fase 1 en formato chips/acciones concretas, sin prompt abierto obligatorio. |

## 7) Gap nuevo P1 detectado (no documentado en OPEN_ISSUES)

- **P1 UX soporte:** `requestId` existe en `ApiError` y en `ErrorMessage`, pero no se está mostrando en consumo real de páginas, reduciendo trazabilidad de soporte.
- Evidencia: `minimarket-system/src/lib/apiClient.ts:30`, `minimarket-system/src/components/ErrorMessage.tsx:88`, `minimarket-system/src/pages/Dashboard.tsx:55`.
- Acción: agregado breve en `docs/closure/OPEN_ISSUES.md`.

