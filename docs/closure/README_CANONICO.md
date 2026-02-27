# README Canonico de Cierre

**Ultima actualizacion:** 2026-02-27

## Objetivo
Mantener una unica fuente documental limpia, sin duplicados de prompts ni resultados historicos innecesarios.

## Fuente unica activa
1. `docs/ESTADO_ACTUAL.md`
2. `docs/DECISION_LOG.md`
3. `docs/closure/OPEN_ISSUES.md`
4. `docs/API_README.md`
5. `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
6. `docs/METRICS.md`
7. `docs/PLAN_FUSIONADO_FACTURAS_OCR.md` (solo roadmap OCR)

## Prompt canonico unico
- `docs/closure/CONTEXT_PROMPT_ENGINEERING_CODEX_SISTEMA_INTEGRAL_CIERRE_2026-02-24.md`

## Paquete de auditoria vigente
- `docs/closure/AUDIT_CHECKLIST_CODEX_2026-02-25.md`
- `docs/closure/AUDIT_F0_BASELINE_2026-02-25.md`
- `docs/closure/AUDIT_F1_SOURCE_2026-02-25.md`
- `docs/closure/AUDIT_F2_FLOWS_2026-02-25.md`
- `docs/closure/AUDIT_F3_TESTS_2026-02-25.md`
- `docs/closure/AUDIT_F4_INTEGRATIONS_2026-02-25.md`
- `docs/closure/AUDIT_F5_ROUTING_UI_2026-02-25.md`
- `docs/closure/AUDIT_F6_SECURITY_2026-02-25.md`
- `docs/closure/AUDIT_F7_DOCS_2026-02-25.md`
- `docs/closure/FINAL_REPORT_CODEX_GO_LIVE_2026-02-25.md`
- `docs/closure/INFORME_REMEDIACION_FINAL_2026-02-25_041847.md`

## Politica de retencion documental
- Se conserva solo el ultimo paquete de auditoria vigente.
- Se conserva un unico prompt canonico activo.
- Artefactos historicos duplicados/obsoletos se marcan `[DEPRECADO: YYYY-MM-DD]` para mantener trazabilidad sin ruido operativo.
- Toda nueva depuracion documental debe registrarse en `docs/DECISION_LOG.md`.
- Evidencia base de depuracion previa: `docs/closure/DEPURACION_DOCUMENTAL_2026-02-25.md`.
