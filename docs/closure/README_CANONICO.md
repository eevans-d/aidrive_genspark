# README Canonico de Cierre

**Ultima actualizacion:** 2026-03-12

## Objetivo
Mantener una unica fuente documental limpia, sin duplicados de prompts ni resultados historicos innecesarios.

## Fuente unica activa
1. `docs/CONTEXT0_EJECUTIVO.md`
2. `docs/ESTADO_ACTUAL.md`
3. `docs/DECISION_LOG.md`
4. `docs/closure/OPEN_ISSUES.md`
5. `docs/API_README.md`
6. `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
7. `docs/METRICS.md`
8. `docs/PLAN_FUSIONADO_FACTURAS_OCR.md` (solo roadmap OCR)

## Fuente canonica extendida (cargar solo si aplica)
1. `docs/PLAN_ASISTENTE_IA_DASHBOARD.md`
2. `docs/PRODUCTION_GATE_REPORT.md`
3. `docs/PROMPTS_COMET_HALLAZGOS_BROWSER.md`
4. `docs/audit/EXHAUSTIVE_SCAN_REPORT_2026-03-12_FINAL.md` (solo auditoria operativa Parallel B)

## Budget de contexto
- Target por doc canonico: `<= 2000` palabras.
- Entrada ejecutiva de sesion (`CONTEXT0`) debe mantenerse entre `600-1000` palabras.
- Validacion automatica:
  - `npm run docs:context-budget`
  - `node scripts/check-context-budget.mjs --strict`

## Exclusiones por defecto (no cargar en contexto inicial)
- `docs/closure/archive/historical/`
- `node_modules/`
- `minimarket-system/node_modules/`
- `logs/`
- `test-reports/`
- `supabase/.temp/`

## Prompts canonicos activos
- `docs/closure/CONTEXT_PROMPT_ENGINEERING_CODEX_SISTEMA_INTEGRAL_CIERRE_2026-02-24.md`
- Prompt de continuidad OCR (sesiones operativas OCR):
  - `docs/closure/CONTEXT_PROMPT_CLAUDE_CODE_OCR_NUEVOS_2026-03-01.md`

## Reportes autogenerados (latest pointer)
- Usar `docs/closure/LATEST_AUTOGEN_REPORTS.md` como indice unico de baseline/technical/inventory/docuguard vigentes.
- Para auditoria operativa Parallel B, usar como referencia primaria `docs/audit/EXHAUSTIVE_SCAN_REPORT_2026-03-12_FINAL.md`.
- Higiene documental actual: `docs/closure/CLOSURE_HYGIENE_REPORT_2026-03-01.md`.
- Indice de historicos archivados: `docs/closure/archive/INDEX.md`.

## Prompts deprecados (no usar para continuidad)
- `docs/closure/CONTEXT_PROMPT_CLAUDE_CODE_OCR_NUEVOS_2026-02-28.md`
- `docs/closure/PROMPT_CLAUDE_CODE_GO_INCONDICIONAL_2026-02-27.md`

## Paquete de auditoria vigente
- `docs/closure/archive/historical/AUDIT_CHECKLIST_CODEX_2026-02-25.md`
- `docs/closure/archive/historical/AUDIT_F0_BASELINE_2026-02-25.md`
- `docs/closure/archive/historical/AUDIT_F1_SOURCE_2026-02-25.md`
- `docs/closure/archive/historical/AUDIT_F2_FLOWS_2026-02-25.md`
- `docs/closure/archive/historical/AUDIT_F3_TESTS_2026-02-25.md`
- `docs/closure/archive/historical/AUDIT_F4_INTEGRATIONS_2026-02-25.md`
- `docs/closure/archive/historical/AUDIT_F5_ROUTING_UI_2026-02-25.md`
- `docs/closure/archive/historical/AUDIT_F6_SECURITY_2026-02-25.md`
- `docs/closure/archive/historical/AUDIT_F7_DOCS_2026-02-25.md`
- `docs/closure/archive/historical/FINAL_REPORT_CODEX_GO_LIVE_2026-02-25.md`
- `docs/closure/archive/historical/INFORME_REMEDIACION_FINAL_2026-02-25_041847.md`

## Politica de retencion documental
- Se conserva solo el ultimo paquete de auditoria vigente.
- Se conserva un unico prompt canonico activo.
- Para OCR se permite un prompt de continuidad operativo adicional.
- Los historicos se mueven a `docs/closure/archive/historical/` (no se eliminan).
- Artefactos historicos duplicados/obsoletos se marcan `[DEPRECADO: YYYY-MM-DD]` para mantener trazabilidad sin ruido operativo.
- Toda nueva depuracion documental debe registrarse en `docs/DECISION_LOG.md`.
- Evidencia base de depuracion previa: `docs/closure/archive/historical/DEPURACION_DOCUMENTAL_2026-02-25.md`.

## Comando operativo recomendado
- `npm run docs:closure-maintenance`
