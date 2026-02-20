# PLAN FRONTEND UX V2 - DEFINITIVO (2026-02-19)

- Estado: `CANONICO_ACTIVO`
- Version: `v2.3-final`
- Fecha base: `2026-02-19`
- Validacion final: `2026-02-20`
- Sustituye: `v2.2-final` (mismo archivo, versionado inline)
- Auditoria de cierre: `docs/closure/REPORTE_AUDITORIA_PLAN_FRONTEND_UX_2026-02-19.md`
- Evidencia de cierre tecnico: `docs/closure/EVIDENCIA_CIERRE_UX_V2_2026-02-19.md`
- Prioridad de negocio: adopcion real del dueno en primera semana (vender, stock, pedidos, fiado).
- Regla no negociable: si hay conflicto entre arquitectura elegante y usabilidad inmediata, gana usabilidad inmediata.

## 0) Gobierno de este plan

1. Este documento es la unica fuente de planificacion UX/Frontend activa para esta linea de trabajo.
2. Ninguna tarea entra a ejecucion si no tiene DoD verificable + comando + evidencia esperada.
3. Toda tarea con riesgo `medio/alto` debe incluir rollback explicito antes de empezar.
4. Cualquier item nuevo fuera de este Top 10 pasa a backlog hasta cerrar Bloque A.

## 1) Definicion concreta de "Dia 1 usable"

Se considera **Dia 1 usable** unicamente si se cumple todo:

1. Desde dashboard, `Vender` esta disponible en <= 2 toques (`Dashboard -> Vender -> POS`).
2. Desde dashboard, `Stock` y `Pedidos` estan en <= 2 toques.
3. El flujo de `fiado` es visible y guiado: dashboard -> POS -> metodo fiado -> seleccionar cliente, sin navegacion escondida.
4. No hay pantallas criticas en blanco durante carga (siempre skeleton o estado claro).
5. Ante error operativo, el usuario ve mensaje simple + accion sugerida + referencia trazable.

Evidencia obligatoria de Dia 1:

- `docs/closure/EVIDENCIA_DIA1_USABLE_YYYY-MM-DD.md`
- Capturas movil + desktop de rutas criticas.
- Video corto: login -> vender -> fiado -> pedidos.

## 2) Top 10 definitivo

Nota: la columna **Prioridad** indica impacto operativo (3=maximo). La columna **Bloque** indica orden de ejecucion.

| Prioridad | ID | Item | Impacto | Esfuerzo | Riesgo | Bloque |
|---|---|---|---|---|---|---|
| 1 | V2-01 | Integridad de metricas de dashboard | 3 | M | Medio | B |
| 2 | V2-02 | Navegacion operativa 1 toque (`POS`/`Pocket` visibles + movil 4+Mas) | 3 | M | Medio | A |
| 3 | V2-03 | Hub dashboard con acciones criticas (`Vender`, `Stock`, `Pedidos`, `Clientes`, `Fiado`) | 3 | S | Medio | A |
| 4 | V2-04 | Skeleton fase 1 (Clientes, Ventas, Proveedores, Kardex) | 2 | S | Bajo | A |
| 5 | V2-07 | Formato monetario consistente en Pedidos (5 instancias) | 2 | S | Bajo | A |
| 6 | V2-06 | Errores operativos estandarizados + logout con feedback | 2 | M | Bajo | B |
| 7 | V2-05 | Skeleton fase 2 (Deposito, Pocket, Rentabilidad, Login/Suspense) | 2 | S | Bajo | B |
| 8 | V2-08 | IA guiada fase 1 (chips de intencion + CTA, sobre base existente) | 3 | M | Medio | C |
| 9 | V2-09 | Onboarding silencioso de primer uso (3 pasos) | 2 | S | Bajo | C |
| 10 | V2-10 | Accesibilidad funcional 60+ en flujos criticos | 2 | M | Medio | D |

## 3) Bloques de ejecucion y dependencias

| Bloque | Objetivo operativo | Items | Dependencias | Gate de pase |
|---|---|---|---|---|
| A | Quitar friccion inmediata de uso diario | V2-02, V2-03, V2-04, V2-07 | Ninguna | lint + build + tests PASS |
| B | Recuperar confianza de datos y errores | V2-01, V2-06, V2-05 | A completo | lint + build + tests PASS + metricas dashboard verificadas |
| C | Interaccion guiada y adopcion asistida | V2-08, V2-09 | A + B parcial (V2-06 minimo) | lint + build + tests PASS |
| D | Cierre de usabilidad para 60+ | V2-10 | A + B + C | lint + build + tests PASS + checklist manual a11y |

Regla de avance entre bloques:

- No avanzar al bloque siguiente con gates fallidos del bloque actual.

## 4) Trazabilidad base a codigo real (verificada 2026-02-19)

Todas las referencias verificadas contra commit `9f314a7`.

- Metricas truncadas que afectan confianza: `useDashboardStats.ts:30` (.limit(5) tareas), `useDashboardStats.ts:36` (.limit(100) stock), `Dashboard.tsx:113` (tareasPendientes.length como total), `useDashboardStats.ts:55,59` (sub-metricas urgentes/completadas sobre datos limitados).
- POS/Pocket fuera de navegacion principal: `App.tsx:179` (ruta /pos), `App.tsx:171` (ruta /pocket), `Layout.tsx:25` (NAV_ITEMS sin POS ni Pocket).
- Navegacion movil saturada: `Layout.tsx:268` (grid-cols-8 con hasta 11 items).
- Quick actions confinadas a modal de busqueda: `GlobalSearch.tsx:43` (QUICK_ACTIONS), `GlobalSearch.tsx:329` (render).
- Skeleton incompleto en pantallas criticas: `Ventas.tsx:109` (spinner), `Kardex.tsx:87` (texto), `Proveedores.tsx:110` (texto), `Pocket.tsx:141` (spinner), `Rentabilidad.tsx:102` (texto), `Deposito.tsx` (sin indicador).
- Parser de error heuristico: `errorMessageUtils.ts:32` (includes-based). Mejora parcial D-126: `errorMessageUtils.ts:27` (ApiError+requestId passthrough).
- console.error en logout: `Layout.tsx:88`.
- Formato monetario ambiguo: `Pedidos.tsx:222,588,601,693,699` (5 instancias de `.toLocaleString()` sin locale ni utility `money()`).
- IA features existentes: semaforo precio (`GlobalSearch.tsx:519-563`, `Pocket.tsx:134-225`), arbitraje/oportunidades (`AlertsDrawer.tsx:190-336`).
- Modales sin a11y: Pedidos (NuevoPedido + Detalle), Proveedores (crear/editar), AlertsDrawer panel, Layout (logout).
- Componente Skeleton reutilizable: `Skeleton.tsx` exporta `SkeletonCard`, `SkeletonTable`, `SkeletonText`, `SkeletonList`.

## 5) Fichas de ejecucion (DoD + verificacion + rollback)

### V2-01 Integridad de metricas dashboard

- Archivos:
  - `minimarket-system/src/hooks/queries/useDashboardStats.ts`
  - `minimarket-system/src/pages/Dashboard.tsx`
  - tests asociados
- DoD:
  - Tarjetas muestran total real (count query o label explicito "Top N").
  - Sub-metricas (urgentes, completadas) calculadas sobre datos completos, no sobre subset limitado.
  - Si se mantiene Top N visual, etiquetado como "Top N" con indicador de total real.
- Verificacion:
  - `pnpm -C minimarket-system test:components -- useDashboardStats.test.tsx Dashboard.test.tsx`
  - `pnpm -C minimarket-system build`
- Evidencia: `docs/closure/EVIDENCIA_V2_01_DASHBOARD_METRICAS_YYYY-MM-DD.md`
- Rollback: revert de hook + etiquetado temporal "Top" en UI.

### V2-02 Navegacion operativa 1 toque

- Archivos:
  - `minimarket-system/src/components/Layout.tsx`
  - `minimarket-system/src/App.tsx`
  - tests asociados
- DoD:
  - `POS` y `Pocket` visibles en sidebar/nav para roles habilitados.
  - Movil: maximo 4 accesos visibles + boton "Mas" que despliega el resto.
  - Targets tactiles moviles >= 48px (py-3 minimo con padding, consistente con V2-10).
  - Sin regresion de permisos por rol.
- Verificacion:
  - `pnpm -C minimarket-system test:components -- Layout.test.tsx App.test.tsx`
  - `pnpm -C minimarket-system lint`
- Evidencia: `docs/closure/EVIDENCIA_V2_02_NAV_1TOQUE_YYYY-MM-DD.md`
- Rollback: feature flag `NAV_V2=false`.

### V2-03 Hub dashboard de tareas criticas

- Archivos:
  - `minimarket-system/src/pages/Dashboard.tsx`
  - tests asociados
- DoD:
  - Dashboard con botones grandes permanentes (>= 48px touch target) para flujos del dia.
  - Acciones: `Vender` (-> /pos), `Stock` (-> /stock), `Pedidos` (-> /pedidos), `Clientes` (-> /clientes).
  - Fiado accesible sin menus ocultos: hub -> POS (1 toque), metodo "Fiado" visible en opciones de pago (1 toque), picker de cliente integrado (1 toque). Total navegacion: <= 3 toques de decision.
  - Maximo 5 acciones en hub, orden fijo.
- Verificacion:
  - `pnpm -C minimarket-system test:components -- Dashboard.test.tsx`
  - `pnpm -C minimarket-system build`
- Evidencia: `docs/closure/EVIDENCIA_V2_03_DASHBOARD_HUB_YYYY-MM-DD.md`
- Rollback: flag `DASHBOARD_HUB_V2=false`.

### V2-04 Skeleton fase 1

- Archivos:
  - `minimarket-system/src/pages/Clientes.tsx`
  - `minimarket-system/src/pages/Ventas.tsx`
  - `minimarket-system/src/pages/Proveedores.tsx`
  - `minimarket-system/src/pages/Kardex.tsx`
  - `minimarket-system/src/components/Skeleton.tsx` (existente, 4 variantes reutilizables)
- DoD:
  - Las 4 paginas muestran skeleton consistente (SkeletonTable o SkeletonList segun contexto) en carga inicial.
  - Reemplaza spinners y texto plano "Cargando..." existentes.
- Verificacion:
  - `pnpm -C minimarket-system test:components -- Clientes.test.tsx Ventas.test.tsx Proveedores.test.tsx Kardex.test.tsx`
  - `rg -n "Skeleton" minimarket-system/src/pages/Clientes.tsx minimarket-system/src/pages/Ventas.tsx minimarket-system/src/pages/Proveedores.tsx minimarket-system/src/pages/Kardex.tsx`
- Evidencia: `docs/closure/EVIDENCIA_V2_04_SKELETON_FASE1_YYYY-MM-DD.md`
- Rollback: no requerido (adicion pura).

### V2-07 Formato monetario consistente en Pedidos

- Archivos:
  - `minimarket-system/src/pages/Pedidos.tsx`
  - tests asociados
- DoD:
  - Las 5 instancias de `.toLocaleString()` (lineas 222, 588, 601, 693, 699) reemplazadas por utility `money()` de `../utils/currency`.
  - Agregar `import { money } from '../utils/currency'` (actualmente no existe en Pedidos.tsx).
  - Montos usan formato `$X.XXX,XX` consistente con resto de la app.
- Verificacion:
  - `pnpm -C minimarket-system test:components -- Pedidos.test.tsx`
  - `rg -n "toLocaleString" minimarket-system/src/pages/Pedidos.tsx` (debe retornar 0 resultados)
  - `rg -n "money(" minimarket-system/src/pages/Pedidos.tsx` (debe retornar >= 5 resultados)
- Evidencia: `docs/closure/EVIDENCIA_V2_07_MONEDA_PEDIDOS_YYYY-MM-DD.md`
- Rollback: no requerido (cambio de formato sin logica).

### V2-06 Errores operativos + trazabilidad soporte

- Archivos:
  - `minimarket-system/src/components/errorMessageUtils.ts`
  - `minimarket-system/src/components/ErrorMessage.tsx`
  - `minimarket-system/src/components/Layout.tsx`
- Estado base (D-126 ya implementado):
  - `errorMessageUtils.ts:27`: ApiError con requestId ya muestra mensaje backend directamente.
  - `ErrorMessage.tsx:88`: prop `requestId` ya existe y se renderiza.
- DoD:
  - Mapeo por `status/code` completo: 401, 403, 429, timeout, network, 5xx con mensajes accionables en espanol.
  - `Layout.tsx:88`: `console.error` en logout reemplazado por feedback visible (toast o inline).
  - Paginas criticas (Dashboard, POS, Pedidos) propagan `requestId` a `ErrorMessage`.
- Verificacion:
  - `pnpm -C minimarket-system test:components -- ErrorMessage.test.tsx Layout.test.tsx`
  - `rg -n "console\.error" minimarket-system/src/components/Layout.tsx` (debe retornar 0)
- Evidencia: `docs/closure/EVIDENCIA_V2_06_ERROR_HANDLING_YYYY-MM-DD.md`
- Rollback: fallback al parser previo (revert de errorMessageUtils.ts).

### V2-05 Skeleton fase 2

- Archivos:
  - `minimarket-system/src/pages/Deposito.tsx`
  - `minimarket-system/src/pages/Pocket.tsx`
  - `minimarket-system/src/pages/Rentabilidad.tsx`
  - `minimarket-system/src/pages/Login.tsx`
  - `minimarket-system/src/components/Skeleton.tsx`
- Nota: el fallback Suspense en `App.tsx:61` (texto plano "Cargando...") es P2 y queda en backlog (§8).
- DoD:
  - Cobertura skeleton en todas las paginas funcionales.
  - Deposito, Pocket, Rentabilidad y Login muestran skeleton en carga inicial.
- Verificacion:
  - `pnpm -C minimarket-system test:components -- Deposito.test.tsx Pocket.test.tsx Rentabilidad.test.tsx Login.test.tsx`
  - `rg -n "Skeleton" minimarket-system/src/pages/*.tsx`
- Evidencia: `docs/closure/EVIDENCIA_V2_05_SKELETON_FASE2_YYYY-MM-DD.md`
- Rollback: no requerido.

### V2-08 IA guiada fase 1 (sin prompt libre)

- Archivos:
  - `minimarket-system/src/pages/Dashboard.tsx`
  - `minimarket-system/src/components/AlertsDrawer.tsx`
  - `minimarket-system/src/components/GlobalSearch.tsx`
- Base existente (REAL, no tocar):
  - Semaforo de precio con insights (GlobalSearch + Pocket).
  - Arbitraje y oportunidades de compra con CTA (AlertsDrawer).
  - QUICK_ACTIONS con 4 shortcuts de navegacion (GlobalSearch).
- DoD (A CREAR sobre base existente):
  - Dashboard y/o hub incluyen chips de intencion frecuentes: "Que me falta reponer?", "Productos con riesgo de perdida?", "Resumen del dia".
  - Cada chip ejecuta accion concreta (navegar, filtrar, o mostrar dato) sin exigir escritura libre.
  - Cada salida IA incluye CTA de accion inmediata (boton, no solo texto).
- Verificacion:
  - `pnpm -C minimarket-system test:components -- Dashboard.test.tsx`
  - `pnpm -C minimarket-system build`
- Evidencia: `docs/closure/EVIDENCIA_V2_08_IA_GUIADA_FASE1_YYYY-MM-DD.md`
- Rollback: flag `IA_GUIDED_V1=false`.

### V2-09 Onboarding silencioso primer uso

- Archivos:
  - `minimarket-system/src/pages/Dashboard.tsx`
  - tests asociados
- DoD:
  - Primer ingreso muestra guia corta (3 pasos) con CTA directas: "Vender" -> POS, "Ver stock" -> Stock, "Ver pedidos" -> Pedidos.
  - Se desactiva automaticamente tras primer flujo completo (localStorage flag).
  - No bloquea acciones — es dismissable en cualquier paso.
- Verificacion:
  - `pnpm -C minimarket-system test:components -- Dashboard.test.tsx`
  - `pnpm -C minimarket-system build`
- Evidencia: `docs/closure/EVIDENCIA_V2_09_ONBOARDING_YYYY-MM-DD.md`
- Rollback: flag/toggle local.

### V2-10 Accesibilidad funcional 60+

- Archivos:
  - `minimarket-system/src/components/Layout.tsx`
  - `minimarket-system/src/pages/Dashboard.tsx`
  - `minimarket-system/src/pages/Pos.tsx`
  - `minimarket-system/src/pages/Pocket.tsx`
  - `minimarket-system/src/pages/Pedidos.tsx`
  - `minimarket-system/src/pages/Clientes.tsx`
  - `minimarket-system/src/pages/Proveedores.tsx`
- DoD:
  - Targets tactiles criticos >= 48px en acciones primarias y controles de cierre de modales.
  - Tipografia critica:
    - Acciones primarias (botones submit, CTA, titulos de pagina) >= 16px (text-base o mayor).
    - Nav movil compacto (grid-cols-5) y table headers: permitido >= 14px (text-sm) — justificacion: el espacio horizontal del grid/tabla no soporta 16px sin overflow; las labels son cortas (1-2 palabras) y acompanadas de icono, lo que compensa el factor de lectura para usuario 60+.
    - No se permite text-xs en etiquetas de accion interactiva.
  - Nav movil: text-sm + min-h-[48px] aplicados en Layout.tsx.
  - Contraste AA en acciones primarias.
  - Modales faltantes reciben `role="dialog"` + `aria-modal="true"`: Pedidos (NuevoPedido, DetallePedido), Proveedores (crear/editar), AlertsDrawer panel, Layout (logout), Clientes (ClienteModal, PagoModal).
  - Cobertura a11y basica con vitest-axe en paginas criticas (Dashboard, Clientes).
- Verificacion:
  - `pnpm -C minimarket-system test:components`
  - Checklist manual movil/desktop documentada en evidencia.
- Evidencia: `docs/closure/EVIDENCIA_V2_10_A11Y_60PLUS_YYYY-MM-DD.md`
- Rollback: reversion por clases utilitarias por componente.

## 6) Gates de calidad para cierre de bloque

```bash
pnpm -C minimarket-system lint
pnpm -C minimarket-system test:components
pnpm -C minimarket-system build
npm run test:unit
node scripts/validate-doc-links.mjs
```

Criterio de pase por bloque:

- Todos los comandos PASS.
- Evidencia del bloque creada en `docs/closure/EVIDENCIA_V2_XX_*.md`.

## 7) Riesgos residuales y mitigacion

| Riesgo | Nivel | Mitigacion |
|---|---|---|
| Regresion de navegacion por simplificacion | Medio | Feature flags + tests por rol + smoke manual movil. |
| Exceso de carga visual en dashboard | Medio | Limitar hub a 5 acciones maximas y orden fijo. |
| Deriva de copy de errores entre pantallas | Bajo | Fuente unica en `errorMessageUtils` + tests de regresion. |
| IA guiada sin onboarding genera confusion | Medio | V2-09 obligatorio detras de V2-08 (Bloque C). |
| Skeleton inconsistente entre paginas | Bajo | Reutilizar componentes de `Skeleton.tsx` existente (4 variantes). |

## 8) Verificacion final de ejecucion (2026-02-20)

Comandos ejecutados y estado:

```bash
pnpm -C minimarket-system lint                                  # PASS
pnpm -C minimarket-system test:components                       # PASS (30/30 files, 175/175 tests)
pnpm -C minimarket-system build                                 # PASS
npm run test:unit                                               # PASS (76/76 files, 1561/1561 tests)
node scripts/validate-doc-links.mjs                             # PASS (81 files)
```

Evidencia de consola/logs:

- `test-reports/uxv2_closure_git_status_20260220.log`
- `test-reports/uxv2_closure_lint_20260220.log`
- `test-reports/uxv2_closure_test_components_20260220.log`
- `test-reports/uxv2_closure_build_20260220.log`
- `test-reports/uxv2_closure_test_unit_20260220.log`
- `test-reports/uxv2_closure_validate_doc_links_20260220.log`

## 9) Backlog explicito (NO ejecutar ahora)

1. Ruta dedicada `/asistente` conversacional (fase 2 IA).
2. Optimizacion de performance no critica de adopcion semana 1.
3. Atajos avanzados para operador experto (keyboard shortcuts).
4. Telemetria de adopcion por flujo (sin PII).
5. Suspense fallback global mejorado con Skeleton (P2, App.tsx:61).
