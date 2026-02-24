# CONTEXT PROMPT ENGINEERING - SISTEMA INTEGRAL DE CALIDAD Y CIERRE (CODEX-ONLY)
## Proyecto: eevans-d/aidrive_genspark
## Fecha de referencia: 2026-02-24
## Version: definitiva optimizada
## Objetivo: auditoria integral 0-8 con evidencia reproducible y veredicto final accionable

---

> INSTRUCCION MAESTRA:
> Opera como auditor tecnico implacable con escepticismo por defecto.
> No asumas funcionamiento sin evidencia verificable en codigo, tests, CI o configuracion real.
> Ejecuta las fases en orden estricto (0-8), registra evidencia en `docs/closure/` y no cierres la sesion con hallazgos criticos abiertos.

---

## 0) CONTEXTO OPERATIVO ANCLA (A FECHA 2026-02-24)

- Estado registrado en fuente primaria: `GO CON CONDICION`.
- Condicion operativa principal: OCR depende de `GCV_API_KEY` con valor real en entorno remoto.
- Guardrail permanente: `api-minimarket` debe permanecer con `verify_jwt=false` si se redeploya.
- CI ya incorpora controles fail-fast de dependency governance.

Regla de vigencia:
- Este contexto ancla no se sobreescribe sin evidencia nueva en fuentes primarias.

---

## 1) GUARDRAILS NO NEGOCIABLES

1. No imprimir secretos/JWTs/tokens/keys. Solo nombres de variables.
2. No usar comandos git destructivos (`git reset --hard`, `git checkout -- <file>`, force-push).
3. Si hay redeploy de `api-minimarket`, usar `--no-verify-jwt`.
4. No marcar `APROBADO` si existe algun hallazgo `CRITICO`.
5. Todo hallazgo debe incluir `archivo:linea`, severidad y accion concreta.
6. No cerrar tareas sin evidencia en `docs/closure/` o `test-reports/`.
7. Si una dependencia externa bloquea cierre (owner/proveedor), marcar `BLOCKED` y continuar con lo demas.
8. No saltar fases ni pasos criticos dentro de cada fase.

---

## 2) FUENTES DE VERDAD (ORDEN DE PRIORIDAD)

1. `docs/ESTADO_ACTUAL.md`
2. `docs/DECISION_LOG.md`
3. `docs/closure/OPEN_ISSUES.md`
4. `docs/AGENTS.md`
5. `AGENTS.md`
6. `docs/closure/ACTA_EJECUTIVA_FINAL_2026-02-13.md`
7. `docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md`
8. `docs/closure/README_CANONICO.md`
9. `docs/closure/CONTINUIDAD_SESIONES.md`
10. `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md` (contexto historico, no primario)

Regla de conflicto:
- Si hay contradiccion, prevalece la fuente con mayor prioridad.

---

## 3) PROTOCOLO P0 OBLIGATORIO DE SESION

Ejecutar al inicio:

```bash
.agent/scripts/p0.sh bootstrap
.agent/scripts/p0.sh session-start "auditoria codex-only: sistema integral de calidad y cierre"
.agent/scripts/p0.sh extract --with-gates --with-supabase
```

Ejecutar al cierre:

```bash
.agent/scripts/p0.sh session-end
```

Fallback:
- Si algun comando falla, documentar el fallo como `BLOCKED`, registrar evidencia CLI y continuar manualmente con el mismo esquema de fases.

---

## 4) SKILLS PERMITIDOS (SOLO SKILLS DE CODEX)

Para esta estrategia se permite unicamente el uso de skills de Codex. Quedan excluidos los skills locales de `.agent/skills/*` salvo instruccion explicita del usuario en otra sesion.

Skills Codex habilitados por tipo de trabajo:
- `playwright`: validacion UI/rutas/flujo en navegador real.
- `gh-fix-ci`: diagnostico y correccion de fallas en GitHub Actions.
- `gh-address-comments`: resolucion de comentarios de PR.
- `sentry`: lectura de errores y estado productivo (solo lectura).
- `security-best-practices`: hardening de seguridad cuando se solicite.
- `security-threat-model`: threat modeling cuando se solicite.
- `openai-docs`: solo para temas OpenAI.
- `cloudflare-deploy`, `netlify-deploy`, `render-deploy`, `vercel-deploy`: solo para tareas de deploy en esos providers.
- `doc`: solo para manejo de `.docx`.

---

## 5) SEVERIDAD OBLIGATORIA

- `CRITICO`: bloquea despliegue o integridad operativa.
- `ALTO`: riesgo funcional/seguridad significativo pre-despliegue.
- `MEDIO`: deuda tecnica relevante con impacto acotado.
- `BAJO`: mejora recomendada sin impacto inmediato.

---

## 6) ARQUITECTURA OPERATIVA CODEX-ONLY

Flujo unico:
1. Auditoria estructural + semantica completa en Codex.
2. Registro incremental en checklist de continuidad.
3. Consolidacion de reporte final con plan priorizado.

Persistencia obligatoria:
- `docs/closure/AUDIT_CHECKLIST_CODEX_YYYY-MM-DD.md`
- `docs/closure/AUDIT_F0_BASELINE_YYYY-MM-DD.md`
- `docs/closure/AUDIT_F1_SOURCE_YYYY-MM-DD.md`
- `docs/closure/AUDIT_F2_FLOWS_YYYY-MM-DD.md`
- `docs/closure/AUDIT_F3_TESTS_YYYY-MM-DD.md`
- `docs/closure/AUDIT_F4_INTEGRATIONS_YYYY-MM-DD.md`
- `docs/closure/AUDIT_F5_ROUTING_UI_YYYY-MM-DD.md`
- `docs/closure/AUDIT_F6_SECURITY_YYYY-MM-DD.md`
- `docs/closure/AUDIT_F7_DOCS_YYYY-MM-DD.md`
- `docs/closure/FINAL_REPORT_CODEX_GO_LIVE_YYYY-MM-DD.md`

Regla de trazabilidad:
- Cada fase debe registrar: comando(s), salida relevante, conclusion y hallazgos.

---

## 7) FASES 0-8 ADAPTADAS AL PROYECTO

### FASE 0 - Mapeo total y baseline real

Objetivo:
- Confirmar realidad de repo, infraestructura y docs canonicas.

Acciones:
1. Inventariar root, `minimarket-system/`, `supabase/functions/`, `supabase/migrations/`, `.github/workflows/`.
2. Cruzar funcionalidades declaradas en docs primarias vs codigo implementado.
3. Construir matriz `documentada | implementada | invocada | testeada`.
4. Identificar fantasmas, esqueletos y huerfanos.

Salida:
- `AUDIT_F0_BASELINE_YYYY-MM-DD.md`

Criterio de salida:
- Matriz completa y trazable por funcionalidad.

---

### FASE 1 - Auditoria de codigo fuente

Objetivo:
- Detectar implementaciones incompletas y patrones de riesgo.

Acciones:
1. Escanear TODO/FIXME/HACK/PLACEHOLDER/STUB/TEMP.
2. Detectar funciones vacias y retornos por defecto sin logica de negocio.
3. Detectar `catch` vacios o manejo de error insuficiente.
4. Detectar imports no usados y bloques comentados extensos.
5. Clasificar cada hallazgo con severidad y accion.

Salida:
- `AUDIT_F1_SOURCE_YYYY-MM-DD.md`

Criterio de salida:
- Sin `CRITICO` abierto de implementacion vacia en flujos core.

---

### FASE 2 - Auditoria de flujos funcionales E2E

Objetivo:
- Validar continuidad real de extremo a extremo.

Flujos minimos:
1. Auth + permisos por rol.
2. POS venta + impacto en stock + trazabilidad.
3. Deposito/movimientos/ajustes.
4. Facturas OCR (`facturas-ocr` + `api-minimarket` + tablas asociadas).
5. Cron jobs y automatizaciones (`backfill`, notificaciones, jobs programados).

Acciones:
1. Trazar entrada -> validacion -> logica -> DB/API -> respuesta.
2. Verificar contratos de datos entre capas.
3. Registrar rupturas de flujo, incoherencias de contrato o fallas de control de errores.

Salida:
- `AUDIT_F2_FLOWS_YYYY-MM-DD.md`

Criterio de salida:
- Todos los flujos core trazados y clasificados (OK, RIESGO, BLOCKED).

---

### FASE 3 - Auditoria de tests y cobertura real

Objetivo:
- Verificar calidad ejecutable real y no declarativa.

Acciones:
1. Ejecutar suites vigentes (`unit`, `components`, `security`, `auxiliary/perf` cuando aplique).
2. Registrar PASS/FAIL/SKIP por suite.
3. Auditar todos los `skip` relevantes con justificacion.
4. Validar cobertura global y cobertura en modulos criticos.

Salida:
- `AUDIT_F3_TESTS_YYYY-MM-DD.md`

Criterio de salida:
- Sin fallos en suites bloqueantes y skips criticos justificados.

---

### FASE 4 - Integraciones, dependencias y entorno

Objetivo:
- Eliminar drift tecnico entre capas y entornos.

Acciones:
1. Verificar alineacion de `@supabase/supabase-js` root/frontend/edge/import_map.
2. Ejecutar y validar guards de dependencia (`check-supabase-js-alignment`, `check-critical-deps-alignment`).
3. Detectar deps declaradas no usadas y deps usadas no declaradas.
4. Verificar sincronia de migraciones local/remoto.
5. Auditar env referenciadas vs definidas (solo nombres).
6. Validar readiness de integraciones externas criticas (OCR, SMTP/SendGrid, Supabase).

Salida:
- `AUDIT_F4_INTEGRATIONS_YYYY-MM-DD.md`

Criterio de salida:
- Sin drift critico de dependencias ni env faltantes de produccion.

---

### FASE 5 - UI, routing y control de acceso

Objetivo:
- Confirmar rutas funcionales y proteccion de acceso por rol.

Acciones:
1. Extraer rutas y mapear componente real.
2. Verificar guardas y restricciones por rol/permisos.
3. Detectar rutas ciegas, componentes huerfanos y placeholders.
4. Verificar estados de error, vacio y fallback (404/500/empty/skeleton).

Salida:
- `AUDIT_F5_ROUTING_UI_YYYY-MM-DD.md`

Criterio de salida:
- Cada ruta productiva con componente funcional y control de acceso correcto.

---

### FASE 6 - Seguridad base y hardening

Objetivo:
- Reducir riesgo de seguridad por regresion o configuracion incorrecta.

Acciones:
1. Escaneo de secretos hardcodeados (sin exponer valores).
2. Verificar auth/authorization en endpoints sensibles.
3. Verificar CORS y manejo uniforme de errores en edge functions.
4. Verificar cumplimiento de guardrail `verify_jwt=false` en `api-minimarket` cuando aplique.
5. Revisar vulnerabilidades de dependencias y excepciones documentadas.

Salida:
- `AUDIT_F6_SECURITY_YYYY-MM-DD.md`

Criterio de salida:
- Cero secretos hardcodeados y cero `CRITICO` de auth/autorizacion.

---

### FASE 7 - Consistencia documental

Objetivo:
- Alinear narrativa documental con realidad tecnica actual.

Acciones:
1. Validar coherencia entre `README.md`, `ESTADO_ACTUAL`, `DECISION_LOG`, `TESTING`, `METRICS`.
2. Verificar que decisiones cerradas/abiertas coincidan con evidencia.
3. Actualizar riesgos residuales y condiciones operativas reales.

Salida:
- `AUDIT_F7_DOCS_YYYY-MM-DD.md`

Criterio de salida:
- Sin discrepancias criticas entre docs canonicas y estado real.

---

### FASE 8 - Consolidacion final y veredicto

Objetivo:
- Emitir decision ejecutiva con plan accionable.

Acciones:
1. Consolidar hallazgos por fase y severidad.
2. Emitir veredicto binario: `APROBADO` o `REQUIERE ACCION`.
3. Generar plan priorizado (`CRITICO -> ALTO -> MEDIO -> BAJO`).
4. Registrar riesgos residuales, items `BLOCKED` y owner actions.

Salida:
- `FINAL_REPORT_CODEX_GO_LIVE_YYYY-MM-DD.md`

Criterio de salida:
- Veredicto con evidencia trazable y acciones priorizadas.

---

## 8) REGLA DE VEREDICTO + ESTADO OPERATIVO

Veredicto binario obligatorio:
- `APROBADO`
- `REQUIERE ACCION`

`APROBADO` solo si:
1. `0` hallazgos `CRITICO`.
2. `0` hallazgos `ALTO` sin mitigacion o plan aprobado.
3. Suites bloqueantes en verde.
4. Sin violaciones a guardrails.

Campo adicional recomendado (informativo, no reemplaza el binario):
- `GO`
- `GO CON CONDICION`
- `NO-GO`

Si OCR esta en alcance:
- Incluir estado operativo de `GCV_API_KEY` (solo nombre, nunca valor) y su impacto en GO.

---

## 9) FORMATO OBLIGATORIO DE SALIDA FINAL

1. Resultado ejecutivo (2-4 lineas).
2. Hallazgos por severidad (tabla breve).
3. Cambios/acciones aplicadas (lista por archivo).
4. Validaciones ejecutadas (PASS/FAIL/SKIP).
5. Riesgos residuales y `BLOCKED`.
6. Veredicto final.
7. Siguiente paso inmediato (owner/equipo).

---

## 10) PLANTILLA MINIMA - AUDIT CHECKLIST CODEX

```markdown
# AUDIT_CHECKLIST_CODEX_YYYY-MM-DD

## Metadata
- Proyecto: aidrive_genspark
- Fecha inicio:
- Fase actual:
- Auditor: Codex

## Estado por fase
- [ ] F0 Baseline
- [ ] F1 Source
- [ ] F2 Flows
- [ ] F3 Tests
- [ ] F4 Integrations
- [ ] F5 Routing/UI
- [ ] F6 Security
- [ ] F7 Docs
- [ ] F8 Final report

## Hallazgos acumulados
| # | Fase | Severidad | Archivo:Linea | Tipo | Accion | Estado |
|---|------|-----------|---------------|------|--------|--------|

## Contexto de continuidad
- Ultimo bloque ejecutado:
- Bloqueadores activos:
- Owner actions pendientes:
- Proximo paso concreto:
```

---

## 11) NOTA FINAL DE OPERACION

Este documento define el esquema definitivo `Codex-only` para auditoria integral y cierre.
Mantiene compatibilidad con guardrails de Protocol Zero y exige trazabilidad completa en `docs/closure/`.
