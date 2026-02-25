# Sistema Mini Market

Sistema de gestion para mini markets con frontend React + backend Supabase (Edge Functions + PostgreSQL).

## Estado actual (2026-02-25)
- Veredicto: `GO INCONDICIONAL`
- Hallazgos abiertos: 0 (11/11 cerrados)
- Dep audit prod: 0 vulnerabilities
- Fuente ejecutiva: `docs/closure/INFORME_REMEDIACION_FINAL_2026-02-25_041847.md`

## Snapshot tecnico vigente
- Edge Functions en repo: 15 (excluye `_shared`)
- Migraciones SQL: 52
- Frontend productivo: https://aidrive-genspark.pages.dev
- Metricas vivas: `docs/METRICS.md`

## Documentacion canonica (fuente unica)
1. `docs/ESTADO_ACTUAL.md`
2. `docs/DECISION_LOG.md`
3. `docs/closure/OPEN_ISSUES.md`
4. `docs/API_README.md`
5. `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
6. `docs/METRICS.md`
7. `docs/closure/README_CANONICO.md`

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

## Inicio rapido
```bash
cd minimarket-system
cp .env.example .env
pnpm install
pnpm dev
```

## Comandos principales
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
pnpm -C minimarket-system lint
pnpm -C minimarket-system build
pnpm -C minimarket-system test:components
```
