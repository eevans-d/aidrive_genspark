# CONTEXT PROMPT — CLAUDE CODE (CONTINUIDAD OCR)
## Proyecto: `aidrive_genspark`
## Fecha: 2026-03-01

Actua como ejecutor tecnico senior, orientado a evidencia y continuidad.
No teorices: ejecuta, valida y documenta.

## Objetivo de sesion
1. Continuar OCR de facturas sin perder contexto.
2. No bloquearse por GCV/billing: avanzar en todo lo que no dependa de OCR real.
3. Dejar estado documentado y handoff accionable.

## Guardrails
1. No imprimir secretos/JWT/API keys (solo nombres).
2. No usar git destructivo (`git reset --hard`, `git checkout -- <file>`, force-push).
3. Si redeployas `api-minimarket`, mantener `verify_jwt=false` (`--no-verify-jwt`).
4. No borrar originales del lote; solo clasificar duplicados.

## Contexto canonico (usar este orden)
1. `docs/ESTADO_ACTUAL.md`
2. `docs/DECISION_LOG.md`
3. `docs/closure/OPEN_ISSUES.md`
4. `docs/API_README.md`
5. `docs/PLAN_FUSIONADO_FACTURAS_OCR.md`
6. `docs/closure/LATEST_AUTOGEN_REPORTS.md`

## Estado ancla (verificar, no asumir)
- Backlog OCR: 9/10 completadas, 1/10 parcial (T7).
- Bloqueante externo: OCR-007 (GCV timeout/billing).
- Lote nuevo en `proveedores_facturas_temp/nuevos`.
- Handoff sesión OCR: `docs/closure/archive/historical/OCR_NUEVOS_HANDOFF_2026-03-01.md` (21/21 pendiente, 5 supplier profiles, 4 grupos temporales).
- Scripts listos: `scripts/ocr-procesar-nuevos.mjs`, `scripts/ocr-reasignar-proveedor.mjs`, `scripts/seed-supplier-profiles.mjs`.

## Plan de ejecucion
### Fase 0 — Baseline
```bash
git status --short
git rev-parse --short HEAD
date -u +"%Y-%m-%d %H:%M:%S UTC"
```

### Fase 1 — Continuidad sin GCV
- Auditar T7 y completar hardening en `/facturas/{id}/aplicar` con evidencia y tests.
- Verificar UI/UX OCR (mismatch CUIT, reintento, errores) sin romper flujos existentes.
- Ejecutar smoke sobre scripts OCR en `--dry-run`.

### Fase 2 — Si GCV sigue bloqueado
- Dejar resultados como `PARCIAL (BLOCKED)` con evidencia reproducible.
- Preparar checklist exacto para reanudar apenas billing quede activo.

### Fase 3 — Validacion obligatoria
```bash
npm run test:unit
npm run test:integration
pnpm -C minimarket-system test:components
npm run test:contracts
node scripts/validate-doc-links.mjs
```

### Fase 4 — Cierre documental
Actualizar solo si hubo cambios reales:
- `docs/ESTADO_ACTUAL.md`
- `docs/closure/OPEN_ISSUES.md`
- `docs/DECISION_LOG.md`
- `docs/API_README.md` y `docs/api-openapi-3.1.yaml` (si aplica)

## Entrega final esperada
1. `Estado final`: `COMPLETADO` o `PARCIAL (BLOCKED)`
2. Hallazgos por severidad
3. Evidencia (`archivo:linea` y comandos)
4. Archivos tocados
5. Siguiente paso inmediato (uno solo)
