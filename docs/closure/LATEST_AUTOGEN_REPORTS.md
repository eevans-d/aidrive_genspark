# Latest Autogen Reports

**Ultima actualizacion:** 2026-03-12
**Objetivo:** reducir ruido operativo en `docs/closure/` dejando una referencia unica a los artefactos autogenerados mas recientes.

## Referencia activa (ultima corrida conocida)

- Baseline:
  - `docs/closure/BASELINE_LOG_2026-03-12_033328.md`
- Technical analysis:
  - `docs/closure/TECHNICAL_ANALYSIS_2026-03-12_033857.md`
- Inventory report:
  - `docs/closure/INVENTORY_REPORT_2026-03-12_033859.md`
- DocuGuard:
  - `docs/closure/DOCUGUARD_REPORT_2026-03-05_060503.md`

## Referencias historicas inmediatas (mismo dia)

- `docs/closure/archive/historical/TECHNICAL_ANALYSIS_2026-03-12_033433.md`
- `docs/closure/archive/historical/INVENTORY_REPORT_2026-03-12_033434.md`

## Regla operativa

1. Para continuidad de trabajo usar siempre la seccion "Referencia activa".
2. Conservar historicos para trazabilidad, sin tomarlos como estado principal.
3. Si se genera una corrida nueva, ejecutar `node scripts/update-latest-autogen-reports.mjs` y commitear el cambio.
