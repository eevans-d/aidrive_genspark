# Latest Autogen Reports

**Ultima actualizacion:** 2026-03-11
**Objetivo:** reducir ruido operativo en `docs/closure/` dejando una referencia unica a los artefactos autogenerados mas recientes.

## Referencia activa (ultima corrida conocida)

- Baseline:
  - `docs/closure/BASELINE_LOG_2026-03-11_125314.md`
- Technical analysis:
  - `docs/closure/TECHNICAL_ANALYSIS_2026-03-11_125318.md`
- Inventory report:
  - `docs/closure/INVENTORY_REPORT_2026-03-11_130005.md`
- DocuGuard:
  - `docs/closure/DOCUGUARD_REPORT_2026-03-05_060503.md`

## Referencias historicas inmediatas (mismo dia)

- `docs/closure/archive/historical/BASELINE_LOG_2026-03-11_065739.md`

## Regla operativa

1. Para continuidad de trabajo usar siempre la seccion "Referencia activa".
2. Conservar historicos para trazabilidad, sin tomarlos como estado principal.
3. Si se genera una corrida nueva, ejecutar `node scripts/update-latest-autogen-reports.mjs` y commitear el cambio.
