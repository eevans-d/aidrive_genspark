# Context Prompt (Claude Code / Copilot) - Ejecutor del Plan Maestro de Auditoria v4.1 (2026-02-10)

Copiar y pegar estos prompts en una nueva ventana de Claude Code y/o GitHub Copilot Chat.

Objetivo: ejecutar COMPLETO `docs/PLAN_MAESTRO_EJECUCION_AUDITORIA_v1.md` (SP-A -> SP-Omega) dejando evidencia verificable y un veredicto final por gates.

Importante: este es un trabajo de AUDITORIA. No implementes fixes salvo que el usuario lo pida explicitamente. Si detectas bloqueos P0, documenta y continua con el resto.

---

## Como usar (recomendado)

- Ejecuta `PROMPT 0` primero (setup + baseline + estructura de evidencia).
- Luego ejecuta `PROMPT 1..15` en orden.
- Si tenes multiples ventanas/agentes, podes correr en paralelo:
  - SP-A (PROMPT 1-3) y SP-C (PROMPT 4-7)
  - Luego SP-B (PROMPT 8-11)
  - Luego SP-D (PROMPT 12), SP-E (PROMPT 13), SP-F (PROMPT 14) y SP-Omega (PROMPT 15)

## Estimacion (del plan)

- SP-A: 4-6h
- SP-C: 4-6h
- SP-B: 6-8h
- SP-D: 4-6h
- SP-E: 3-4h
- SP-F: 2-3h
- SP-Omega: 1-2h
- Total: ~24-35h

## Quality Gates (recomendado)

Backend (raiz):
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

Frontend:
```bash
pnpm -C minimarket-system lint
pnpm -C minimarket-system build
pnpm -C minimarket-system test:components
```

---

## PROMPT 0 - CONTEXTO, GUARDRAILS, BASELINE Y EVIDENCIA

```text
Actuas como AGENTE EJECUTOR DE AUDITORIA en este repositorio.

Workspace real: /home/eevan/ProyectosIA/aidrive_genspark
Supabase project ref (remoto): dqaygmjpzoqjjrywdsxi

Fuentes de verdad (orden):
1) docs/PLAN_MAESTRO_EJECUCION_AUDITORIA_v1.md (plan a ejecutar)
2) docs/BATERIA_PROMPTS_v4.1_FINAL.md (fuente)
3) docs/ESTADO_ACTUAL.md (estado y evidencias previas)
4) docs/DECISION_LOG.md (decisiones vigentes)

Reglas no negociables:
1) NO exponer secretos/JWTs: nunca imprimir valores. Solo NOMBRES de variables/secretos.
2) NO usar comandos destructivos: prohibido git reset --hard, git checkout -- <file>, force-push.
3) Si se redeployea api-minimarket, debe quedar verify_jwt=false. Usar --no-verify-jwt.
4) Si no hay acceso remoto (Supabase CLI no auth / red bloqueada), marcar como BLOCKED y hacer analisis estatico igual.

Protocolo:
0) Crear carpeta/archivos de evidencia (si no existen):
   - docs/audit/EXECUTION_LOG_AUDITORIA_2026-02-10.md
   - docs/audit/EVIDENCIA_SP-A.md
   - docs/audit/EVIDENCIA_SP-C.md
   - docs/audit/EVIDENCIA_SP-B.md
   - docs/audit/EVIDENCIA_SP-D.md
   - docs/audit/EVIDENCIA_SP-E.md
   - docs/audit/EVIDENCIA_SP-F.md
   - docs/audit/EVIDENCIA_SP-OMEGA.md

1) Baseline (pegar resultados resumidos en docs/audit/EXECUTION_LOG_AUDITORIA_2026-02-10.md; NO pegar secrets):
   - git status --porcelain=v1
   - git log -1 --oneline
   - wc -l docs/PLAN_MAESTRO_EJECUCION_AUDITORIA_v1.md docs/BATERIA_PROMPTS_v4.1_FINAL.md
   - find docs -type f | wc -l
   - find tests -type f \( -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.test.js' \) | wc -l
   - find minimarket-system/src -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) | wc -l
   - (si es posible) correr Quality Gates basicos y registrar PASS/FAIL (sin pegar logs enormes):
     - npm run test:unit
     - pnpm -C minimarket-system lint
     - pnpm -C minimarket-system build

2) Intentar baseline Supabase (si CLI disponible). Si falla: marcar BLOCKED y seguir:
   - supabase migration list --linked
   - supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json
   - supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi --output json  (SOLO nombres)

3) Estructura del log:
   - Seccion por sub-plan (SP-A, SP-C, SP-B, SP-D, SP-E, SP-F, SP-Omega)
   - Para cada prompt ejecutado: comandos, hallazgos, evidencia, y link al archivo EVIDENCIA_SP-*.md

Al terminar, confirmar:
- Baseline listo
- Archivos de evidencia creados
- Listo para arrancar SP-A (PROMPT 1)
```

---

## PROMPT 1 - SP-A / A1 INVENTARIO FUNCIONAL REAL VS DECLARADO

```text
Ejecuta A1 del plan maestro y documenta resultados en docs/audit/EVIDENCIA_SP-A.md (seccion A1).

Objetivo: inventario REAL (Edge Functions, Frontend, DB/migraciones) con evidencia.

Pasos (minimo):
1) Edge Functions (filesystem):
   - Listar funciones (excluyendo _shared): ls -1 supabase/functions | rg -v '^_shared$' | sort
   - Para cada funcion (13): confirmar index.ts existe; contar lineas (wc -l) del index y total del directorio.
   - Identificar imports _shared: rg -n \"../_shared/\" supabase/functions/<fn> --glob='*.ts'
   - Trigger real:
     - Frontend caller: rg -n \"functions/v1/<fn>|<fn>\" minimarket-system/src --glob='*.ts' --glob='*.tsx'
     - Cron SQL: rg -n \"<fn>\" supabase/cron_jobs --glob='*.sql'
     - Caller desde otras funciones: rg -n \"functions/v1/<fn>|<fn>\" supabase/functions --glob='*.ts'
   - Tests relacionados: rg -n \"<fn>|<nombre_handler>|<endpoint>\" tests --glob='*.ts' --glob='*.js'

2) Edge Functions (remoto, si disponible):
   - Extraer verify_jwt/ACTIVE desde supabase functions list (si BLOCKED, anotarlo).

3) Frontend:
   - Listar paginas: ls -1 minimarket-system/src/pages | sort
   - Verificar rutas: ubicar en minimarket-system/src/App.tsx (rg \"<PageName>\" y revisar routes).
   - Por pagina (13): identificar fuente de datos (apiClient vs supabase directo) y patrones de error (ErrorMessage vs toast/div).

4) DB/migraciones:
   - Contar migraciones: ls -1 supabase/migrations | wc -l
   - Identificar ultimas 5 migraciones (ls -1 supabase/migrations | tail -n 5)
   - (si hay acceso DB) validar tablas criticas existen (stock/productos/ventas/pedidos/cron logs).

Salida requerida (copiar como tabla en EVIDENCIA_SP-A.md):
Tabla A1: Funcionalidad | Declarada en | Codigo existe | Invocable/trigger | Testeada | Evidencia | Veredicto (REAL/PARCIAL/FANTASMA)

No implementes nada. Solo evidencia y veredicto por item.
Al finalizar: resumen de 5 riesgos P0 detectados (si hay) y 5 items P1.
```

---

## PROMPT 2 - SP-A / A2 MAPA DE PENDIENTES CON CRITICIDAD

```text
Ejecuta A2 y documenta en docs/audit/EVIDENCIA_SP-A.md (seccion A2).

Objetivo: capturar pendientes reales (codigo + docs) y clasificarlos por impacto operador.

Pasos:
1) Scan de pendientes en repo:
   - rg -n \"TODO|FIXME|HACK|XXX|PENDIENTE\" . 
   - rg -n \"console\\.log|console\\.warn\" supabase/functions minimarket-system/src --glob='*.ts' --glob='*.tsx'

2) Confirmar gaps verificados del plan (no asumir, re-chequear con comandos):
   - adopcion _shared/response.ts, errors.ts, audit.ts, cors.ts (conteos por funcion).
   - ErrorMessage ausente en paginas (conteo y lista).
   - Skeleton en paginas (conteo y lista).
   - Discrepancia supabase-js (frontend vs edge) desde package files.

3) Revisar docs de roadmap/decisiones:
   - docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md (pendientes)
   - docs/DECISION_LOG.md (decisiones pendientes de ejecutar)

Salida requerida:
Tabla A2: Pendiente | Ubicacion | Criticidad (ROJO/AMARILLO/VERDE) | Impacto operador | Esfuerzo (h) | Evidencia

Al final: Top 5 pre-produccion (ROJO) con recomendacion concreta (sin implementar).
```

---

## PROMPT 3 - SP-A / A3 DETECCION DE FUNCIONALIDAD FANTASMA

```text
Ejecuta A3 y documenta en docs/audit/EVIDENCIA_SP-A.md (seccion A3).

Objetivo: identificar codigo que existe pero no se ejecuta en flujos reales.

Pasos:
1) Edge Functions: confirmar trigger real (frontend, cron, caller interno, externo/manual). Marcar:
   - PROD (caller/cron confirmado)
   - EXTERNO/MANUAL (sin caller en repo)
   - NO-PROD (sin trigger productivo)

2) Frontend: detectar paginas/componentes sin ruta o sin acceso real:
   - buscar imports no usados, rutas no conectadas.

3) _shared: detectar modulos casi no usados y justificar:
   - audit.ts, errors.ts, response.ts, circuit-breaker.ts, rate-limit.ts

4) Tests: detectar suites legacy o no ejecutadas en CI (segun ci.yml / READMEs).

Salida requerida:
Lista A3: Que | Donde | Por que es fantasma | Accion (ELIMINAR/CONECTAR/DOCUMENTAR/INVESTIGAR) | Evidencia

No borrar nada. Solo inventario y recomendacion.
```

---

## PROMPT 4 - SP-C / C1 MANEJO DE ERRORES Y FEEDBACK

```text
Ejecuta C1 y documenta en docs/audit/EVIDENCIA_SP-C.md (seccion C1).

Objetivo: validar cadena de errores end-to-end (backend -> apiClient -> UI) y feedback al operador.

Pasos:
1) Backend:
   - Revisar _shared/errors.ts y _shared/response.ts (interface de errores, status codes, sanitizacion).
   - Identificar funciones que NO usan response.ts y/o errors.ts; muestrear como devuelven errores.

2) Frontend:
   - Mapear en que paginas se usa ErrorMessage y en cuales no, y el patron alternativo (toast/div/console.error).
   - Revisar si apiClient.ts traduce errores tecnicos a mensajes accionables/espanol.

3) Auth errors:
   - Revisar helpers/auth.ts en api-minimarket: mensajes para JWT invalido/expirado y comportamiento del breaker/cache.
   - Revisar interceptores/handle 401 en frontend (AuthContext/useAuth/apiClient).

Salida requerida:
Tabla C1: Escenario de error | Backend manejo | Frontend manejo | Mensaje operador | Veredicto (OK/PARCIAL/MAL) | Evidencia
Inclui minimo 10 escenarios (auth, red, 500, timeout, validacion, RLS/permiso, etc.).
```

---

## PROMPT 5 - SP-C / C2 CONSISTENCIA DE DATOS

```text
Ejecuta C2 y documenta en docs/audit/EVIDENCIA_SP-C.md (seccion C2).

Objetivo: detectar drift entre TS types, queries, edge handlers y migraciones.

Pasos (pragmatico):
1) Tipos:
   - Revisar src/types/database.ts (interfaces) y apiClient.ts (tipos inline).
   - Listar entidades criticas: productos, stock, ventas, pedidos, clientes, cuentas_corrientes, tareas, bitacora.

2) DB:
   - Identificar migraciones que crean/modifican esas tablas (rg por nombre de tabla en supabase/migrations).
   - (si DB accesible) validar columnas claves con consultas select limit 1.

3) Frontend:
   - Revisar hooks principales (useStock/useProductos/useKardex/useDashboardStats/usePedidos/useClientes, etc.) y comparar selects con DB/tipos.

4) Backend:
   - Muestrear handlers api-minimarket relevantes (ventas, pedidos, stock, deposito) y comparar con migraciones/tipos.

Salida requerida:
Tabla C2: Entidad | database.ts | apiClient.ts | Migracion/SQL | Handler/Hook | Status (ALINEADO/DRIFT/FALTA) | Evidencia
```

---

## PROMPT 6 - SP-C / C3 UX PARA USUARIO NO TECNICO

```text
Ejecuta C3 y documenta en docs/audit/EVIDENCIA_SP-C.md (seccion C3).

Objetivo: evaluar UX con checklist y rubricas medibles del plan.

Pasos:
1) Idioma:
   - verificar textos en espanol en 13 paginas (labels, errores, placeholders).

2) Formato:
   - buscar uso de toLocaleString('es-AR') y detectar inconsistencias (precios/cantidades/fechas).

3) Navegacion:
   - confirmar <=3 clicks a funciones principales desde Dashboard (si no hay app corriendo, hacer analisis estatico de rutas/menus).

4) Estados:
   - loading (skeleton/spinner), empty states, error states por pagina.

5) Mobile:
   - Pos/Pocket: usability mobile-first (inputs, botones, scroll).

6) Rubrica Gate 14:
   - aplicar la rubrica del plan (C3.7) y documentar resultado con evidencia.

Salida requerida:
Tabla C3: Pagina | Espanol | Formato $ | Skeleton | Empty state | Mobile | Veredicto | Evidencia
```

---

## PROMPT 7 - SP-C / C4 DEPENDENCIAS EXTERNAS

```text
Ejecuta C4 y documenta en docs/audit/EVIDENCIA_SP-C.md (seccion C4).

Objetivo: mapear riesgos externos (Supabase Free, scraping, npm deps, version gaps, rate limit real).

Pasos:
1) Supabase plan:
   - confirmar limites relevantes (timeout 60s, invocaciones) y comparar con cron/scraper.

2) Scraping Maxiconsumo:
   - revisar frecuencia de cron-jobs-maxiconsumo y riesgo de ToS/cambios HTML.
   - identificar plan B si scraper cae.

3) Dependencias:
   - revisar package.json (root + minimarket-system) y discrepancias de versiones.
   - validar npm audit (solo resumen; no pegar logs enormes).

4) Rate limit / breaker:
   - confirmar si rate-limit.ts y circuit-breaker.ts usan RPC/DB o solo memoria (segun estado actual del repo).

Salida requerida:
Tabla C4: Dependencia | Riesgo | Probabilidad | Impacto | Mitigacion existente | Accion | Evidencia
```

---

## PROMPT 8 - SP-B / B1 SIMULACION DE JORNADA DEL OPERADOR

```text
Ejecuta B1 y documenta en docs/audit/EVIDENCIA_SP-B.md (seccion B1).

Objetivo: simular jornada del operador (13 tareas) y marcar si se puede completar.

Modo A (preferido): con app y Supabase accesibles.
- levantar frontend si corresponde, loguear con usuario de prueba, y recorrer tareas.

Modo B (fallback): si no hay credenciales/runtime.
- hacer analisis estatico + tests existentes para inferir estado.
- marcar como PARCIAL/BLOCKED donde falte evidencia runtime.

Salida requerida:
Tabla B1: Tarea | Estado (OK/PARCIAL/FALLA/BLOCKED) | Bloqueantes | Gaps UX | Evidencia
```

---

## PROMPT 9 - SP-B / B2 FLUJOS CRITICOS E2E

```text
Ejecuta B2 y documenta en docs/audit/EVIDENCIA_SP-B.md (seccion B2).

Objetivo: verificar 5 flujos completos, paso por paso, detectando eslabones rotos.

Flujos (del plan):
1) Stock -> Alerta -> Notificacion (cron alertas-stock)
2) Scraping de precios (cron-jobs-maxiconsumo -> scraper-maxiconsumo -> storage)
3) Venta completa POS (idempotencia + stock + kardex + CC si aplica)
4) Pedido E2E (CRUD + estados + pago; y bug de feedback de mutaciones)
5) Monitoreo cron jobs (debe fallar por diseno si no hay panel; documentarlo)

Para cada flujo:
- definir Entrada, Salida esperada, y evidencia minima (log/SQL/captura).
- si hay cron jobs, confirmar si llevan Authorization header y si verify_jwt lo requiere.

Salida requerida:
Tabla B2 por flujo: Paso | Componente | Entrada | Salida | Funciona? | Eslabon roto? | Evidencia
```

---

## PROMPT 10 - SP-B / B3 UTILIDAD REAL DE OUTPUTS

```text
Ejecuta B3 y documenta en docs/audit/EVIDENCIA_SP-B.md (seccion B3).

Objetivo: evaluar si outputs son accionables para un operador.

Pasos:
- Listar outputs del plan (dashboard stats, alertas, reportes, recibo, bitacora, rentabilidad, insights).
- Para cada output: que decision permite tomar, que accion sugiere, y por que canal llega.

Salida requerida:
Tabla B3: Output | Contenido | Accionable (SI/PARCIAL/NO) | Canal de entrega | Veredicto | Evidencia
```

---

## PROMPT 11 - SP-B / B4 CONDICIONES ADVERSAS REALES

```text
Ejecuta B4 y documenta en docs/audit/EVIDENCIA_SP-B.md (seccion B4).

Objetivo: probar o analizar condiciones adversas (timeouts, HTML cambia, BD crece, sesion expira, concurrencia).

Pasos:
- cubrir los 7 escenarios del plan (aunque sea via analisis estatico si runtime no disponible).
- para cada escenario: que ve el operador, riesgo, mitigacion, y accion recomendada.

Salida requerida:
Tabla B4: Escenario | Comportamiento actual | Riesgo | Impacto operador | Mitigacion existente | Accion | Evidencia
```

---

## PROMPT 12 - SP-D / OPTIMIZACION (D2 -> D3 -> D1 -> D4)

```text
Ejecuta SP-D completo y documenta en docs/audit/EVIDENCIA_SP-D.md (secciones D2/D3/D1/D4).

Objetivo: producir lista priorizada de fixes (sin implementarlos).

Pasos:
1) D2 codigo muerto:
   - listar funciones sin trigger productivo, endpoints sin caller, carpetas/docs legacy, artefactos redundantes.

2) D3 seguridad:
   - auth verify_jwt=false (riesgos cache/breaker), RLS cobertura, CORS, rate-limit efectivo, secrets en repo, cron sin auth.

3) D1 performance:
   - cold start gateway, queries select *, indices, paginacion.

4) D4 UX:
   - estandarizar ErrorMessage y feedback de errores (incluye bug Pedidos.tsx), skeleton/empty states, mobile ergonomics.

Salida requerida:
- Tabla D2: Artefacto | Tipo | Accion | Justificacion | Evidencia
- Tabla D3: Vector | Riesgo (ALTO/MEDIO/BAJO) | Estado | Mitigacion | Accion | Evidencia
- Tabla D1: Aspecto | Estado | Riesgo | Impacto 6m | Accion | Evidencia
- Lista D4: Fix UX | Pagina | Severidad | Esfuerzo | Dependencias | Evidencia
```

---

## PROMPT 13 - SP-E / PRODUCCION (E2 -> E1 -> E3 -> E4)

```text
Ejecuta SP-E completo y documenta en docs/audit/EVIDENCIA_SP-E.md (secciones E2/E1/E3/E4).

Objetivo: checklist go/no-go para piloto y para go-live, con evidencia.

Pasos:
1) E2 secretos/env:
   - inventariar SOLO NOMBRES de env vars/secretos usados por frontend y edge.
   - verificar documentacion vs uso (si hay scripts de env audit, usarlos).

2) E1 checklist deploy:
   - migraciones, funciones healthy, verify_jwt (api-minimarket), CI verde, smoke tests.

3) E3 logging/monitoreo:
   - canales reales (si no existe, marcar gap y propuesta minima).

4) E4 rollback:
   - rollback DB (migraciones), rollback functions, rollback frontend; tiempos y riesgos.

Salida requerida:
- Tabla E2: Secret/Var (NOMBRE) | Donde se configura | Documentado | Usado por | Estado | Evidencia
- Checklist E1: item -> PASS/FAIL/PARCIAL/BLOCKED (con evidencia)
- Tabla E3: Canal | Configurado | Funcional | Cobertura | Accion | Evidencia
- Tabla E4: Componente | Rollback posible | Metodo | Tiempo | Riesgo data loss | Evidencia
```

---

## PROMPT 14 - SP-F / UTILIDAD REAL (F1 -> F2 -> F3)

```text
Ejecuta SP-F completo y documenta en docs/audit/EVIDENCIA_SP-F.md (secciones F1/F2/F3).

Objetivo: verificar utilidad real para operador y detectar overkill.

Pasos:
1) F1 problema real:
   - aplicar criterio medible del plan (P0/P1) y documentar.

2) F2 valor minuto 1:
   - aplicar metrica TTFV (<= 20 min) si runtime disponible; si no, evaluar fricciones.

3) F3 nadie usara:
   - listar features dev-only/overkill y accion recomendada (conservar/documentar/eliminar futuro).

Salida requerida:
- Tabla F1 (del plan)
- Lista F2 (del plan)
- Tabla F3 (del plan)
```

---

## PROMPT 15 - SP-OMEGA / 18 GATES + VEREDICTO FINAL

```text
Ejecuta SP-Omega y documenta en docs/audit/EVIDENCIA_SP-OMEGA.md.

Objetivo: consolidar evidencia en 18 gates binarios y emitir veredicto final:
- LISTO
- OPERABLE CON RESERVAS (piloto)
- NO LISTO

Pasos:
1) Crear tabla de 18 gates (copiar del plan maestro) y completar:
   Gate # | Gate | Evidencia concreta (link/consulta/log) | Resultado (OK/PARCIAL/FALLA/BLOCKED) | Nota

2) Aplicar perfiles:
   - Piloto (MVP): requiere gates 1,2,3,4,7,8,11,17,18 en OK
   - Produccion (go-live): Piloto + gates 15 y 16 en OK

3) Entregables finales:
   - Lista de fixes obligatorios pre-produccion
   - Lista de fixes recomendados post-MVP
   - Condiciones exactas para pasar de CON RESERVAS a LISTO

No implementar fixes. Solo veredicto y plan de accion.
```
