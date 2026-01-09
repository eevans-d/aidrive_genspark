# BASELINE TECNICO (v1)

**Estado:** reporte inicial de lint/tests (histórico)
**Nota:** no refleja el estado actual del repo; ver `docs/ROADMAP.md` y `docs/CHECKLIST_CIERRE.md`.

---

## Lint (frontend)
**Comando:** `pnpm lint` (desde `minimarket-system/`)

**Resultado:** warning
- `src/contexts/AuthContext.tsx`: warning `react-refresh/only-export-components`

---

## Tests (runner actual)
**Comando:** `pnpm test` (desde `minimarket-system/`) -> `bash ../test.sh`

**Resultado general:** suite completa finaliza con warnings

**Hallazgos:**
- `.env` no encontrado.
- Jest/Vitest/Cypress no disponibles en el root (segun el runner actual).
- Tests unitarios: no se encontro framework.
- Tests integracion: directorio no encontrado (segun runner).
- Tests E2E: Cypress no disponible.
- Tests de carga: Artillery no disponible; k6 ok.
- Seguridad: `npm audit` falla por falta de lockfile.
- Safety (python) falla por falta de `pydantic`.

**Reporte generado:** `test-reports/test-summary.json`

---

## Notas
- El runner usa dependencias fuera de `minimarket-system/`.
- Se requiere decision de framework y setup unico (Jest o Vitest).
