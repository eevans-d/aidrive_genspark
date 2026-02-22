# PROMPTS EJECUTABLES PARA DOCUMENTACION (FINAL DEFINITIVA)

Version: 5.2
Fecha: 2026-02-22
Estado: VERIFICADO

## Verificacion ejecutada (esta sesion)

| Check | Resultado |
|---|---|
| Rama activa | `docs/d150-cierre-documental-final` |
| Edge Functions detectadas | 14 (excluyendo `_shared`) |
| Skills detectadas | 22 |
| Archivos Markdown en `docs/` | 204 |
| Secretos hardcodeados (scan patrones) | 0 hallazgos |
| `console.*` en TS/TSX | solo `_shared/logger.ts` (uso intencional) |
| Links internos docs | PASS (`Doc link check OK (87 files)`) |
| Coherencia licencia | OK (`LICENSE=MIT` y `package.json=MIT`) |
| Sincronia API docs vs funciones | OK (incluye `backfill-faltantes-recordatorios`) |

## Decision operativa

1. `PROMPT 0 (FactPack)` es prerequisito bloqueante.
2. Objetivo documental prioritario: `MANUAL_USUARIO_FINAL`.
3. Usar este archivo como orquestador canonico de ejecucion.

---

## PROMPT 0 - FACTPACK (OBLIGATORIO Y BLOQUEANTE)

```text
Eres auditor tecnico. Antes de cualquier analisis, construye un FactPack REAL del repo.

REGLAS:
- Prohibido usar metricas heredadas sin verificar.
- No placeholders.
- No exponer secretos/JWT/keys.
- Si hay conflictos entre fuentes, marcarlos explicitamente.

CHECKS OBLIGATORIOS:
1) git branch --show-current
2) git status --short
3) find supabase/functions -mindepth 1 -maxdepth 1 -type d ! -name '_shared' | wc -l
4) find .agent/skills -mindepth 1 -maxdepth 1 -type d | wc -l
5) find docs -type f -name '*.md' | wc -l
6) wc -c README.md CHANGELOG.md SECURITY.md docs/OPERATIONS_RUNBOOK.md docs/DEPLOYMENT_GUIDE.md minimarket-system/README.md
7) test -f CONTRIBUTING.md; test -f CODE_OF_CONDUCT.md; test -f docs/TESTING.md; test -f docs/TROUBLESHOOTING.md; test -f docs/MONITORING.md; test -f docs/INSTALLATION.md
8) rg -n "console\.(log|debug|info)" supabase/functions/ minimarket-system/src/ --glob="*.{ts,tsx}"
9) rg -l -e "ey[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9\-_]{20,}" -e "sk[-_]live[-_][A-Za-z0-9]{20,}" -e "apikey\s*[:=]\s*['\"][A-Za-z0-9]" supabase/functions/ minimarket-system/src/ --glob="*.{ts,tsx}"
10) node scripts/validate-doc-links.mjs
11) Revisar: docs/ESTADO_ACTUAL.md, docs/DECISION_LOG.md, docs/closure/OPEN_ISSUES.md
12) Verificar si cada funcion de supabase/functions (excepto _shared) aparece en docs/API_README.md
13) Verificar coherencia licencia: LICENSE vs package.json vs README/docs

FORMATO DE SALIDA:
- Seccion "FactPack" en JSON valido.
- Seccion "Inconsistencias".
- Seccion "Riesgos de drift" priorizada.
```

---

## PROMPT 1 - EXTRACCION TECNICA COMPLETA

```text
Eres analista tecnico senior. Trabaja con FactPack + codigo real + docs canonicos.

Objetivo:
Generar informe tecnico completo para documentacion, evitando drift y datos historicos obsoletos.

Entradas obligatorias:
- FactPack
- docs/ESTADO_ACTUAL.md
- docs/DECISION_LOG.md
- docs/closure/OPEN_ISSUES.md
- docs/closure/CONTEXT_PROMPT_ENGINEERING_CLAUDE_CODE_CUADERNO_AUTOMATIZACIONES_2026-02-20.md
- docs/closure/CONTEXT_PROMPT_ENGINEERING_CLAUDE_CODE_BACKFILL_AUDITORIA_PRODUCCION_2026-02-21.md
- README.md
- package.json (raiz y minimarket-system/)
- supabase/functions/
- supabase/migrations/
- .github/workflows/

Reglas:
1) Si FactPack contradice docs: clasificar DESINCRONIZADO.
2) No declarar "produccion GO" sin evidencia actual.
3) No fijar conteos duros en texto final; citar "segun FactPack <fecha>".
4) No inventar endpoints ni rutas.
5) Clasificar cada item: REAL / DESINCRONIZADO / CODE_HUERFANO / DOC_FANTASMA.

Salida:
- Resumen ejecutivo (max 12 lineas).
- Matriz de sincronizacion documental.
- Inventario tecnico real.
- Backlog de correcciones P0/P1/P2.
```

---

## PROMPT 2 - AUDITORIA DOCUMENTAL (DOCUGUARD)

```text
Eres DocuGuard. Audita docs con trazabilidad estricta y evidencia por archivo:linea.

Objetivo:
Detectar gaps de consistencia entre codigo y documentacion operativa/canonica.

Entradas canonicas:
1) docs/ESTADO_ACTUAL.md
2) docs/DECISION_LOG.md
3) docs/closure/OPEN_ISSUES.md
4) docs/API_README.md
5) docs/ESQUEMA_BASE_DATOS_ACTUAL.md
6) README.md

Checks obligatorios:
- Freshness de docs/ESTADO_ACTUAL.md
- Coherencia de licencia
- Sincronia funciones Edge vs docs/API_README.md
- Existencia real de docs "faltantes" declaradas
- Enlaces internos docs

Salida:
1) Tabla de hallazgos (categoria, evidencia, severidad, accion).
2) Gates:
   - QG1 Seguridad
   - QG2 Freshness
   - QG3 Consistencia
   - QG4 Enlaces
   - QG5 Reporte
3) Plan de reparacion por fases (rapida/media/profunda).
```

---

## PROMPT 3 - GENERAR/ACTUALIZAR 1 DOCUMENTO

```text
Eres escritor tecnico del repo. Genera o actualiza UN documento objetivo con evidencia real.

DOCUMENTO_OBJETIVO: <reemplazar>
RUTA_OBJETIVO: <reemplazar>

Objetivo recomendado por defecto:
- MANUAL_USUARIO_FINAL

Opciones:
- docs/MANUAL_USUARIO_FINAL.md
- docs/GUIA_RAPIDA_OPERACION_DIARIA.md
- README.md
- minimarket-system/README.md
- docs/TESTING.md
- docs/TROUBLESHOOTING.md
- docs/MONITORING.md
- docs/INSTALLATION.md
- CONTRIBUTING.md
- CODE_OF_CONDUCT.md
- docs/OPERATIONS_RUNBOOK.md
- docs/DEPLOYMENT_GUIDE.md
- SECURITY.md
- docs/API_README.md (cuando haya funciones nuevas)

Reglas:
1) Basado en FactPack + codigo + canonicos.
2) Cifras con sello temporal: "segun FactPack <fecha>".
3) Referenciar comandos/rutas reales.
4) Integrar explicitamente cambios paralelos de Claude Code (D-146/D-147/D-148) cuando afecten el documento objetivo.
5) Si hay conflicto no resoluble: seccion "Conflictos abiertos".
6) Evitar duplicacion sin valor.

Salida:
- Documento final listo para guardar.
- "Validaciones usadas" (comandos/resultados).
- "Supuestos" (idealmente vacio).
```

---

## PROMPT 4 - READINESS DE DOCUMENTACION OPERATIVA

```text
Eres SRE + auditor documental. Evalua si la documentacion permite operar y recuperar el sistema sin memoria tribal.

Importante:
- No validar solo codigo; validar capacidad operativa documentada.
- No heredar "GO" historico sin FactPack actual.

Evalua 5 ejes:
1) Operacion diaria (runbook, monitoreo, troubleshooting)
2) Incidentes (health checks, logs, alertas, rollback)
3) Continuidad (backup, RPO/RTO, restore)
4) Seguridad operativa (secretos, CORS, JWT policy, RLS docs)
5) Mantenibilidad (canonicos vs historicos)

Salida:
- Score por eje (0-10 + criterio)
- Bloqueantes reales
- Riesgos no bloqueantes
- Plan 30/60/90 dias
- Checklist ejecutable proxima sesion
```

---

## PROMPT 5 - AUDITORIA INTENSIVA DE PENDIENTES OCULTOS (CLAUDE CODE)

```text
Eres auditor tecnico + executor de cierre. Tu tarea es detectar y cerrar pendientes ocultos no explicitados en backlog activo.

Contexto obligatorio:
- docs/ESTADO_ACTUAL.md
- docs/DECISION_LOG.md
- docs/closure/OPEN_ISSUES.md
- docs/closure/REPORTE_AUDITORIA_INTENSIVA_PENDIENTES_OCULTOS_<fecha>.md (si existe)

Objetivos:
1) Revalidar decisiones historicas con estado PARCIAL/BLOQUEADA y normalizar su estado final.
2) Detectar duplicaciones o ambiguedades en OPEN_ISSUES.
3) Cerrar drift entre snapshot canónico y FactPack vigente.
4) Emitir prompt/contexto ejecutable para siguiente ventana Claude Code.

Pendientes ocultos minimos a revisar:
- D-007, D-010
- D-058, D-059, D-060
- D-082, D-099 (consistencia contra cierres posteriores)
- Deno PATH global
- FAB `/pos` y `/pocket`
- periodicidad de smoke real de seguridad

Salida obligatoria:
1) Tabla de pendientes ocultos (estado, evidencia, accion).
2) Lista de cambios aplicados en docs canonicas.
3) Prompt final listo para ejecutar en nueva ventana Claude Code.
4) Reporte en docs/closure con gates PASS/FAIL.
```

---

## Checklist final de calidad

- [ ] Se uso FactPack de la sesion.
- [ ] No hay contradiccion con `docs/ESTADO_ACTUAL.md` sin explicacion.
- [ ] Se diferencian artefactos canonicos vs historicos.
- [ ] Cero exposicion de secretos.
- [ ] Se adjunta evidencia verificable.
- [ ] Todo drift incluye accion concreta y prioridad.
