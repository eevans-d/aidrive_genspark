# 🎯 PROMPTS ADAPTADOS PARA CODEX - PROYECTO MINI MARKET

**Fecha:** 4 de enero de 2026  
**Proyecto:** Mini Market (Frontend React + Supabase Edge Functions)  
**Repositorio:** `aidrive_genspark`

---

## 📋 ÍNDICE DE PROMPTS

| # | Prompt | Objetivo |
|---|--------|----------|
| 0 | Establecimiento de Contexto | Activar modo análisis exhaustivo |
| 1.1 | Análisis Arquitectónico Tricapa | Auditoría de estructura |
| 1.2 | Vulnerabilidades Estructurales | Detección de puntos débiles |
| 2.1 | Auditoría Microscópica de Código | Calidad línea por línea |
| 2.2 | Análisis de Rendimiento | Eficiencia algorítmica |
| 3.1 | Auditoría UX/DX | Experiencia usuario/desarrollador |
| 4.1 | Roadmap Estratégico | Plan de transformación |
| 4.2 | Estrategia de Implementación | Metodología segura |
| 5.1 | Sistema de Calidad Permanente | Sostenibilidad |

---

## 🚀 PROMPT 0: ESTABLECIMIENTO DE CONTEXTO CRÍTICO

```
ACTIVAR MODO ANÁLISIS EXHAUSTIVO NIVEL MÁXIMO - PROYECTO MINI MARKET

CONTEXTO OPERATIVO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROYECTO: Sistema Mini Market - Frontend React/Vite + Supabase Edge Functions (Deno)
ESTADO: Retomado tras inactividad; riesgo alto por decisiones apresuradas
PROBLEMA PRINCIPAL: 3 Edge Functions monolíticas críticas (>2000 líneas) con lógica mezclada
OBJETIVO: Transformación profunda → modularización, estabilización, observabilidad, migraciones completas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTRUCTURA (fuentes de verdad):
- minimarket-system/ → Frontend (App.tsx, 7 páginas, AuthContext, supabase client)
- supabase/functions/ → 11 Edge Functions
   • api-proveedor (3744 líneas) ⚠️ CRÍTICO
   • scraper-maxiconsumo (3212 líneas) ⚠️ CRÍTICO
   • cron-jobs-maxiconsumo (2900 líneas) ⚠️ CRÍTICO
   • cron-testing-suite, cron-notifications, cron-dashboard, cron-health-monitor (800-1413 líneas)
   • alertas-stock, reportes-automaticos, notificaciones-tareas (155-177 líneas)
- supabase/migrations/ → solo 2 migraciones; faltan tablas/vistas/RPC documentadas en docs/ESQUEMA_BASE_DATOS_ACTUAL.md
- docs/ → 13 archivos (API_README.md, PLAN_EJECUCION.md, ARCHITECTURE_DOCUMENTATION.md, OPERATIONS_RUNBOOK.md, etc.)

PROBLEMAS CONOCIDOS (confirmados):
1) Migraciones SQL faltantes (cron, scraping, vistas materializadas, RPC)
2) Testing fragmentado (test/ + tests/, Jest + Vitest, configs duplicadas)
3) 180 console.log en Edge Functions (sin logger estructurado)
4) Sin CI/CD ni métricas de calidad automáticas

DIRECTIVAS:
1) TOLERANCIA CERO A OMISIONES — leer código + docs; contrastar con migraciones
2) PROFUNDIDAD MÁXIMA — nivel línea en funciones críticas; visión holística en dependencias
3) SESGO OPTIMISTA OFF — asumir defectos; validar con evidencia

RESPONDE CON (breve):
1) Confirmación del contexto y alcance
2) Enfoque para las 3 funciones monolíticas (orden de ataque + criterio de partición)
3) Primer comando/consulta o análisis que ejecutarás y por qué
```

---

## 🔍 PROMPT 1.1: ANÁLISIS ARQUITECTÓNICO TRICAPA

```
EJECUTAR AUDITORÍA ARQUITECTÓNICA TRICAPA - MINI MARKET

CAPA 1: INVENTARIO FÍSICO COMPLETO
• Mapear TODO el repo (estructura limpia, sin _archive/). Clasificar: activo / legacy / dudoso.
• Validar contra docs/PLAN_EJECUCION.md y docs/ARCHITECTURE_DOCUMENTATION.md.
• Destacar tamaños extremos y “archivos hub”.

Estructura focal:
├ minimarket-system/src/
│ ├ pages/ (7 páginas: Dashboard, Stock, Deposito, Productos, Proveedores, Tareas, Login)
│ ├ components/ (ErrorBoundary, Layout)
│ ├ contexts/ (AuthContext)
│ ├ lib/ (supabase client)
│ └ types/ (database.ts)
├ supabase/functions/ (11 Edge Functions)
│ ├ CRÍTICAS (>2000): api-proveedor/index.ts, scraper-maxiconsumo/index.ts, cron-jobs-maxiconsumo/index.ts
│ ├ MEDIANAS (800-1500): cron-testing-suite, cron-notifications, cron-dashboard, cron-health-monitor
│ └ LIGERAS (<200): alertas-stock, reportes-automaticos, notificaciones-tareas
├ supabase/migrations/ (solo 2; revisar gaps con ESQUEMA_BASE_DATOS_ACTUAL.md)
└ test/ + tests/ (config fragmentada)

CAPA 2: DEPENDENCIAS Y FLUJOS
• Grafo archivo→archivo para supabase/functions y minimarket-system/src.
• Identificar ciclos, módulos hub, y dependencias cruzadas frontend↔edge.
• Señalar dependencias en tiempo de ejecución (envs, rutas HTTP, tablas/vistas) y hardcodes.

CAPA 3: PATRONES / ANTI-PATRONES
• Localizar God Files (los 3 monolitos) y zonas Lava Flow.
• Duplicaciones entre cron-* y entre api-proveedor/scraper.
• Inconsistencias de CORS, manejo de errores y routing.

ENTREGABLES CONCRETOS:
1) Diagrama/grafo de dependencias con ciclos marcados (ascii o tabla clara).
2) Top 10 problemas arquitectónicos con ruta y línea aproximada.
3) Plan de modularización inicial para los 3 monolitos (qué extraer primero y a qué carpeta: routes/services/utils/_shared).
```

---

## 🔍 PROMPT 1.2: DETECCIÓN DE VULNERABILIDADES ESTRUCTURALES

```
EJECUTAR ANÁLISIS FORENSE DE PUNTOS DÉBILES - MINI MARKET

1) PUNTOS ÚNICOS DE FALLA (SPOF)
   • api-proveedor: ¿qué pasa si falla? ¿hay degradación controlada o cola de reintentos?
   • scraper-maxiconsumo: ¿retry/backoff/circuit breaker? ¿usa cache_proveedor antes de fallar?
   • cron-jobs-maxiconsumo: ¿dead letter queue / logging de fallas? ¿reintentos idempotentes?
   • Frontend: dependencia única de supabase client (AuthContext) sin fallback offline.

2) ACOPLAMIENTO PELIGROSO
   • Listar TODAS las dependencias circulares (edge-edge, edge-_shared si existe, frontend-edge).
   • Hardcodes de URLs/config: supabase/functions/*/index.ts y minimarket-system/src/pages/*.tsx.
   • Uso de service role key: validar que no se exponga en frontend; revisar envs .env.example.

3) COMPLEJIDAD Y TAMAÑO
   • Para cada función (11): complejidad ciclomática, profundidad de anidación, funciones >100 líneas, >10 params.
   • Señalar rutas y líneas; proponer partición inmediata (handlers, servicios, helpers).

4) MANEJO DE ERRORES
   • try-catch vacíos o silenciosos en todas las Edge Functions.
   • Validación de input en api-minimarket y api-proveedor (body, query, headers).
   • 180 console.log: identificar los que engullen errores o exponen datos sensibles.

5) GAPS DE BASE DE DATOS (REFERENCIA: docs/ESQUEMA_BASE_DATOS_ACTUAL.md)
   • Tablas sin migración: cron_jobs_execution_log, cron_jobs_alerts, cron_jobs_metrics, cron_jobs_tracking, cron_jobs_notifications, configuracion_proveedor, estadisticas_scraping.
   • Vistas/materializadas faltantes: vista_cron_jobs_dashboard, vista_alertas_activas, vista_cron_jobs_metricas_semanales, vista_oportunidades_ahorro, tareas_metricas (materialized view).
   • RPC/funciones ausentes: fnc_deteccion_cambios_significativos, fnc_limpiar_datos_antiguos, fnc_redondear_precio, fnc_margen_sugerido, fnc_productos_bajo_minimo, fnc_stock_disponible, sp_movimiento_inventario.

CLASIFICACIÓN DE RIESGO:
🔴 CRÍTICO = caída/pérdida de datos o exposición de secretos
🟡 ALTO = degradación severa / reintentos sin control
🟢 BAJO = mantenibilidad / consistencia

ENTREGA: Matriz de vulnerabilidades con criticidad, ruta y línea aproximada + acción inmediata recomendada (fallback, refactor, migración, validación, logger).
```

---

## 📊 PROMPT 2.1: AUDITORÍA MICROSCÓPICA DE CÓDIGO

```
EJECUTAR ANÁLISIS LÍNEA POR LÍNEA - EDGE FUNCTIONS CRÍTICAS

ARCHIVOS OBJETIVO (100% cobertura):
1) supabase/functions/api-proveedor/index.ts (3744 líneas)
2) supabase/functions/scraper-maxiconsumo/index.ts (3212 líneas)
3) supabase/functions/cron-jobs-maxiconsumo/index.ts (2900 líneas)

DIMENSIONES A EVALUAR:

1) LEGIBILIDAD Y CLARIDAD
   • Nombres descriptivos; detectar abreviaturas crípticas.
   • Comentarios útiles vs obsoletos; código comentado que debe eliminarse.
   • Números/strings mágicos (fechas, URLs, códigos de estado) sin constantes.

2) DUPLICACIÓN REAL
   • Lógica repetida de CORS, routing, fetch Supabase, manejo de errores.
   • Repetición entre cron-* (especialmente notificaciones/dashboard/testing) y con api-proveedor/scraper.
   • Candidatos para extraer a supabase/functions/_shared/ (crear si no existe).

3) CODE SMELLS CRÍTICOS
   • Long Method >50 líneas, Large File >2000 líneas, funciones con >10 params.
   • Switch/if-else profundos que piden polimorfismo o tablas de dispatch.
   • Feature Envy / Data Clumps / Primitive Obsession.

4) SEGURIDAD Y VALIDACIÓN
   • Entradas sin validación de esquema (body/query/headers) en endpoints.
   • SQL/raw queries sin parámetros; uso inseguro de service role key.
   • Sanitización de datos antes de logs/respuestas.

5) MANEJO DE ERRORES
   • try-catch que silencian errores o pierden stack.
   • Respuestas HTTP inconsistentes (status/cuerpo) entre funciones.
   • console.log en lugar de logger estructurado.

MUESTREO 50% ADICIONAL:
- minimarket-system/src/pages/*.tsx (7 páginas) → foco en manejo de estado, fetch a Supabase, re-renders.
- supabase/functions/cron-*/index.ts (4 funciones medianas) → patrones comunes y duplicación.

ENTREGABLES:
1) Puntaje 1-10 por archivo (claridad, duplicación, seguridad, errores).
2) Lista de problemas por archivo con línea aproximada + breve fix propuesto.
3) Tres ejemplos concretos de extracción a _shared/ o módulos dedicados.
```

---

## 📊 PROMPT 2.2: ANÁLISIS DE RENDIMIENTO Y OPTIMIZACIÓN

```
EJECUTAR EVALUACIÓN DE EFICIENCIA - MINI MARKET

1) COMPLEJIDAD ALGORÍTMICA
   scraper-maxiconsumo:
   • Búsquedas O(n²) en procesamiento de catálogo/precios; detectar oportunidades O(n log n).
   • Uso de cache_proveedor: aciertos vs misses; evitar refetch redundante.
   • Serialización/deserialización JSON dentro de loops.

   cron-jobs-maxiconsumo:
   • Jobs en batch vs uno a uno; ¿hay backpressure?
   • Queries N+1 hacia Supabase; consolidar selects/updates.
   • Idempotencia y tamaño de lote configurable.

   api-proveedor:
   • Endpoints con múltiples queries secuenciales que pueden agruparse.
   • Transformaciones redundantes de payloads; parsing repetido.

2) OPERACIONES REDUNDANTES Y I/O
   • Cálculos repetidos sin memo/cache (precios, métricas cron).
   • Llamadas a Supabase sin reuse de filtros o sin paginación.
   • Validaciones duplicadas en capas; normalizar en un middleware.

3) FRONTEND (minimarket-system)
   • Re-renders innecesarios en páginas con tablas/listas (Stock, Deposito, Productos).
   • Falta de debounce en búsquedas/filtrado hacia Supabase.
   • Tamaño de bundle: medir con `pnpm build --analyze`; identificar dependencias pesadas.

4) BASE DE DATOS
   • Índices necesarios vs existentes (ver ESQUEMA_BASE_DATOS_ACTUAL.md); proponer índices para queries frecuentes de cron y proveedor.
   • Vistas materializadas ausentes (tareas_metricas) vs vistas normales usadas.
   • Detección de consultas N+1 o full scans evidentes en código.

PRIORIZACIÓN POR IMPACTO/ESFUERZO
• 🚀 Quick Wins: reducir N+1, cachear resultados, agregar índices obvios.
• ⚡ Medias: re-batching jobs, dividir etapas de scraping, memoizar cálculos.
• 🔧 Arquitecturales: rediseñar flujos monolíticos o pipelines.

ENTREGABLE: Matriz de optimizaciones con impacto estimado (latencia/ms o % CPU/IO) y esfuerzo (horas), ordenada por ROI.
```

3. FRONTEND (minimarket-system):
   • Re-renders innecesarios en páginas React
   • Queries a Supabase sin debounce en búsquedas
   • Imágenes/assets sin optimizar
   • Bundle size (ejecutar: pnpm build --analyze)

4. BASE DE DATOS:
   • Índices definidos vs índices necesarios
   • Queries lentas potenciales (JOINs complejos)
   • Vistas materializadas vs vistas normales

PRIORIZACIÓN:
• 🚀 Quick Wins: Alto impacto, bajo esfuerzo
• ⚡ Optimizaciones Medias
• 🔧 Refactorizaciones Arquitecturales

ENTREGA: Matriz de optimizaciones con impacto estimado (ms/%) y esfuerzo (horas)
```

---

## 🎨 PROMPT 3.1: AUDITORÍA UX/DX COMPLETA

```
EJECUTAR EVALUACIÓN DE EXPERIENCIA - MINI MARKET

EXPERIENCIA DE USUARIO (UX)
Revisar las 7 páginas en minimarket-system/src/pages/ con foco en flujos principales (login → dashboard → stock/productos/proveedores → tareas).

1) Dashboard.tsx
   • ¿Métricas accionables? ¿Estados vacíos/loading claros?
   • Consistencia visual con Layout.tsx.

2) Stock.tsx + Deposito.tsx
   • Flujo de ajuste de inventario: pasos, validaciones, feedback de éxito/error.
   • Visibilidad de stock mínimo/máximo y alertas.

3) Productos.tsx + Proveedores.tsx
   • CRUD: validaciones de formularios, mensajes de error, confirmaciones.
   • Búsqueda/filtrado: debounce, paginación, estados sin resultados.

4) Tareas.tsx
   • Claridad de estados (pendiente/en progreso/completado).
   • Relación visible con cron jobs (origen/última ejecución).

5) Login.tsx
   • Credenciales demo expuestas (admin@minimarket.com) — marcar riesgo.
   • Manejo de errores Supabase (auth) y bloqueo de reintentos.

Heurísticas transversales
• Mensajes de error, loading y empty states en todas las páginas.
• Accesibilidad: contraste, foco, navegación por teclado, labels.
• Consistencia de componentes comunes (botones, tablas, modales).

EXPERIENCIA DE DESARROLLADOR (DX)
1) Onboarding: claridad en README.md y envs (.env.example raíz y frontend).
2) Feedback loop: tiempos de pnpm dev/build y ejecución de test.sh.
3) Debugging: ruido de 180 console.log; disponibilidad de stack traces y source maps.
4) Mantenibilidad: facilidad para entender cada Edge Function y correspondencia con docs/ (13 archivos).

ENTREGABLES
1) Heatmap de fricción UX por página/flujo con severidad.
2) Top 5 mejoras UX priorizadas (impacto/ esfuerzo breve).
3) Top 5 mejoras DX priorizadas (onboarding, feedback loop, debugging).
```

---

## 🎯 PROMPT 4.1: ROADMAP ESTRATÉGICO DE REFACTORIZACIÓN

```
DESARROLLAR PLAN DE TRANSFORMACIÓN - MINI MARKET

PASO 1: CONSOLIDAR HALLAZGOS
• Agrupar por tipo (Arquitectura, Código, Rendimiento, UX, DX, DB) y por ubicación (función/frontend).
• Vincular cada hallazgo con la evidencia (archivo:línea, query, métrica).

PASO 2: SCORE DE PRIORIZACIÓN
SCORE = (Impacto × 2 + Riesgo + BeneficioUsuario) / Esfuerzo
• Normalizar Impacto/Riesgo/Beneficio/Escenario 1-10; Esfuerzo 1-10.
• Marcar dependencias (requiere migración, requiere modularización previa).

PASO 3: ESTRATIFICACIÓN (NIVELES)
NIVEL 1 (Semana 1-2):
• Modularizar api-proveedor (3744 → rutas/servicios/utils ~500 líneas c/u).
• Modularizar scraper-maxiconsumo.
• Crear migraciones SQL faltantes (cron, scraping, vistas, RPC, materialized view tareas_metricas).
• Unificar testing (test/ + tests/, framework elegido).

NIVEL 2 (Semana 3-4):
• Modularizar cron-jobs-maxiconsumo; extraer jobs a archivos separados.
• Extraer _shared/ (logging, CORS, fetch Supabase, validación input, respuestas HTTP).
• Reemplazar 180 console.log por logger estructurado.
• Consolidar duplicaciones en cron-* (notifications/dashboard/testing).

NIVEL 3 (Semana 5-6):
• Optimizaciones de rendimiento (N+1, batching, cache, índices).
• Mejoras UX priorizadas (Top 5 del prompt 3.1).
• CI básico (lint + tests + build) y documentación actualizada.

NIVEL 4 (Backlog):
• Refinamientos cosméticos, optimizaciones menores, nuevas features.

PASO 4: SECUENCIACIÓN Y GATES
• Migraciones antes de refactors dependientes.
• Orden sugerido: api-proveedor → scraper → cron-jobs-maxiconsumo → cron-* medianas → frontend ajustes.
• Gates semanales alineados con docs/PLAN_EJECUCION.md (salida obligatoria por fase).

ENTREGABLES
1) Roadmap detallado (épicas + tareas) alineado con docs/PLAN_EJECUCION.md.
2) Estimaciones en días y dependencias explícitas.
3) Criterios de éxito por nivel (tests verdes, métricas de complejidad, reducción de líneas en monolitos, migraciones aplicadas).
```

---

## 🎯 PROMPT 4.2: ESTRATEGIA DE IMPLEMENTACIÓN SEGURA

```
DESARROLLAR METODOLOGÍA DE IMPLEMENTACIÓN - MINI MARKET

PRINCIPIOS
1) INCREMENTALIDAD: PRs pequeños y verificables.
2) REVERSIBILIDAD: cada paso con rollback claro (git y DB).
3) VALIDACIÓN: tests antes/durante/después y comparación de comportamiento.

METODOLOGÍA POR TIPO

A) MODULARIZACIÓN EDGE FUNCTIONS (ej: api-proveedor 3744 líneas)
1. Estructura objetivo:
   supabase/functions/api-proveedor/
   ├ index.ts (entry ~100 líneas)
   ├ routes/ (handlers por recurso)
   ├ services/ (lógica de negocio)
   └ utils/ (helpers comunes)
2. Extraer por secciones (routing → handlers → services → utils), verificando equivalencia tras cada extracción.
3. Tests: ejecutar tests/unit/api-proveedor.test.js en cada paso; añadir tests faltantes mínimos.
4. Repetir patrón para scraper-maxiconsumo y cron-jobs-maxiconsumo.

B) MIGRACIONES SQL
1. Naming: YYYYMMDDHHMMSS_descripcion.sql con UP/DOWN.
2. Cubrir tablas/vistas/RPC faltantes (cron, scraping, vistas materializadas, funciones).
3. Probar local con supabase db push y registrar resultados.

C) UNIFICACIÓN DE TESTS
1. Elegir framework único (Vitest sugerido si es viable con suite actual; si no, mantener Jest donde ya está).
2. Consolidar en tests/ y actualizar configs/imports.
3. Asegurar que test.sh ejecute la suite unificada; medir cobertura.

D) LOGGING ESTRUCTURADO
1. Crear supabase/functions/_shared/logger.ts (si no existe) con formato {timestamp, level, message, context, requestId}.
2. Reemplazar console.log gradualmente; prohibir logs de secretos.
3. Unificar manejo de errores para incluir requestId/jobId.

ROLLOUT Y CONTROL DE CAMBIOS
• Branch por feature (ej: feature/modularize-api-proveedor).
• Commits atómicos con descripción de ámbito.
• PR checklist: tests verdes, sin aumento de complejidad >15, sin reducción de cobertura.
• Validar equivalencia funcional comparando respuestas HTTP y efectos en DB.

ENTREGABLES
1) Checklists por tipo de cambio (modularización, migraciones, tests, logging).
2) Template de PR con secciones: alcance, riesgos, pruebas realizadas, rollback.
3) Scripts de verificación post-cambio (lint, tests, build si aplica).
```

---

## 🛡️ PROMPT 5.1: SISTEMA DE CALIDAD PERMANENTE

```
ESTABLECER SISTEMA DE GARANTÍA DE CALIDAD - MINI MARKET

1) MÉTRICAS AUTOMATIZADAS (CI)
Configurar .github/workflows/ci.yml:
• Lint: pnpm lint (minimarket-system) + lint de Edge Functions si aplica.
• Tests: ejecutar test.sh o suite unificada (Vitest/Jest) desde raíz.
• Build: pnpm build en minimarket-system.
• Cobertura: 60% inicial → 80% objetivo; fallar PR si baja.
Gates de calidad: complejidad <15, archivo <500 líneas (Edge Functions), duplicación <5%, sin reducción de métricas.

2) REVISIONES PROGRAMADAS
• Arquitectura: mensual (crecimiento de archivos y dependencias).
• Dependencias: quincenal (pnpm outdated + seguridad).
• Seguridad: mensual (pnpm audit / revisión de envs).
• Rendimiento: bimestral (N+1, tiempos de jobs, bundle size).

3) DOCUMENTACIÓN VIVA
• Actualizar docs/ESQUEMA_BASE_DATOS_ACTUAL.md con cada migración.
• Actualizar docs/API_README.md al cambiar endpoints.
• Actualizar docs/ARCHITECTURE_DOCUMENTATION.md tras refactors estructurales.
• README.md raíz y minimarket-system/README.md para setup y scripts.

4) MONITOREO Y OBSERVABILIDAD
• Usar logger estructurado en Edge Functions; incluir requestId/jobId.
• Usar cron_jobs_alerts y cron-health-monitor para alertas básicas.
• Registrar métricas mínimas de ejecución en cron-jobs-maxiconsumo (tiempos y errores).

5) ESTÁNDARES DE CÓDIGO
Documentar en CONTRIBUTING.md:
• Estructura de Edge Functions (entry, routes, services, utils, _shared).
• Convenciones de naming y manejo de errores/respuestas HTTP.
• Patrones aprobados (modularización) y anti-patrones (monolitos, copy-paste, console.log).
• Guía de refactorización y checklist de PR.

ENTREGABLES
1) .github/workflows/ci.yml operativo.
2) CONTRIBUTING.md con estándares y checklists.
3) Lista de métricas/gates y cómo se validan en CI.
```

---

## 📅 PROTOCOLO DE EJECUCIÓN RECOMENDADO

### Semana 1 — Diagnóstico
| Día | Prompt | Entregable esperado |
|-----|--------|---------------------|
| 1 | PROMPT 0 + 1.1 | Contexto confirmado + Inventario y grafo de dependencias |
| 2 | PROMPT 1.2 | Matriz de vulnerabilidades con criticidad |
| 3 | PROMPT 2.1 | Auditoría de código (3 monolitos) con puntajes y fixes |
| 4 | PROMPT 2.2 | Matriz de optimizaciones rendimiento |
| 5 | PROMPT 3.1 | Heatmap UX/DX + Top 5 mejoras |

### Semana 2 — Planificación y Cierre
| Día | Prompt | Entregable esperado |
|-----|--------|---------------------|
| 6-7 | PROMPT 4.1 | Roadmap estratégico alineado a PLAN_EJECUCION.md |
| 8 | PROMPT 4.2 | Checklists de implementación y template PR |
| 9 | PROMPT 5.1 | CI config, CONTRIBUTING.md, gates de calidad |
| 10 | Consolidación | Plan ejecutivo final listo para ejecución |

---

## ⚠️ REGLA DE ORO PARA CODEX

**ANTES de ejecutar cada prompt incluir:**
```
MODO ANÁLISIS EXHAUSTIVO ACTIVADO
TOLERANCIA CERO A OMISIONES
PROFUNDIDAD MÁXIMA
PROYECTO: MINI MARKET (aidrive_genspark)
FUENTES DE VERDAD: docs/PLAN_EJECUCION.md, docs/ESQUEMA_BASE_DATOS_ACTUAL.md, docs/API_README.md
```

**DESPUÉS de cada prompt verificar:**
```
1. ¿Se cubrieron TODOS los archivos/funciones indicados?
2. ¿Los hallazgos tienen ruta y línea aproximada?
3. ¿Los entregables están completos y accionables?
4. SI hay áreas sin cubrir → PROFUNDIZAR antes de cerrar.
5. VINCULAR hallazgos con docs/PLAN_EJECUCION.md y proponer ajustes si corresponde.
```

---

## 📚 REFERENCIAS DEL PROYECTO (FUENTES DE VERDAD)

| Recurso | Ubicación | Uso |
|---------|-----------|-----|
| API endpoints | docs/API_README.md | Validar endpoints y contratos |
| Schema BD | docs/ESQUEMA_BASE_DATOS_ACTUAL.md | Gaps de migraciones |
| OpenAPI spec | docs/api-openapi-3.1.yaml | Contratos formales |
| Arquitectura | docs/ARCHITECTURE_DOCUMENTATION.md | Patrones y diagramas |
| Plan de ejecución | docs/PLAN_EJECUCION.md | Alinear roadmap |
| Operaciones | docs/OPERATIONS_RUNBOOK.md | Troubleshooting |
| Cron jobs | docs/CRON_JOBS_COMPLETOS.md | Jobs y scheduling |
| Guía de deploy | docs/DEPLOYMENT_GUIDE.md | Ambientes y secrets |

---

## 🗂️ ESTRUCTURA CLAVE DEL REPOSITORIO (LIMPIA)

```
aidrive_genspark/               # ~3.6 MB contexto activo, ~81 archivos código/docs
├── minimarket-system/          # Frontend React + Vite + TS
│   ├── src/pages/              # 7 páginas (Dashboard, Stock, Deposito, Productos, Proveedores, Tareas, Login)
│   ├── src/contexts/           # AuthContext
│   ├── src/lib/supabase.ts     # Cliente Supabase
│   └── src/types/database.ts   # Tipos TS
├── supabase/
│   ├── functions/              # 11 Edge Functions (Deno)
│   │   ├── api-proveedor/      # 3744 líneas ⚠️
│   │   ├── scraper-maxiconsumo/# 3212 líneas ⚠️
│   │   ├── cron-jobs-maxiconsumo/ # 2900 líneas ⚠️
│   │   ├── cron-testing-suite/ # 1413 líneas
│   │   ├── cron-notifications/ # 1184 líneas
│   │   ├── cron-dashboard/     # 1130 líneas
│   │   ├── cron-health-monitor/# 898 líneas
│   │   ├── api-minimarket/     # 1050 líneas (Gateway)
│   │   ├── alertas-stock/      # 160 líneas ✓
│   │   ├── reportes-automaticos/# 177 líneas ✓
│   │   └── notificaciones-tareas/# 155 líneas ✓
│   ├── migrations/             # Solo 2 migraciones (INCOMPLETO)
│   └── cron_jobs/              # Scripts de scheduling
├── docs/                       # Documentación activa
├── tests/                      # Testing unificado
│   ├── unit/                   # Tests unitarios
│   ├── integration/            # Tests de integración
│   ├── e2e/                    # Tests end-to-end (edge-functions)
│   └── ...                     # security, performance, api-contracts
└── data/                       # Datos de catálogo
```

---

## ✅ CHECKLIST PRE-EJECUCIÓN PARA CODEX

Antes de iniciar la secuencia de prompts, confirmar:

- [x] Repositorio limpio (sin _archive/, tests consolidados)
- [ ] Acceso al repositorio completo
- [ ] Variables de entorno disponibles para pruebas locales (SUPABASE_URL, SERVICE_ROLE_KEY)
- [ ] Herramientas: node, pnpm, deno, supabase CLI
- [ ] Baseline de lint/tests ejecutado (pnpm lint, test.sh)
- [ ] Lectura previa de docs/PLAN_EJECUCION.md y docs/ANALISIS_EXHAUSTIVO_PROYECTO.md

---

*Documento preparado: 4 de enero de 2026*  
*Versión: 2.1 — Estructura limpia, contexto reducido 94%*  
*Próxima acción: Ejecutar PROMPT 0 + 1.1 y registrar hallazgos*
