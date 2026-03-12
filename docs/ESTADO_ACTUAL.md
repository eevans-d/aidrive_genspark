# ESTADO ACTUAL DEL PROYECTO

**Ultima actualizacion:** 2026-03-12 (continuidad de produccion, cierre PERF-001 y poda canonica incremental)
**Veredicto general:** `LISTO PARA PRODUCCION`
**Fuente ejecutiva:** `docs/PRODUCTION_GATE_REPORT.md`

## 1) Resumen ejecutivo
- El sistema mantiene estado operativo estable con quality gates en verde y sin regresiones funcionales en endpoints criticos.
- Se cerro `PERF-001`: build frontend sin warnings residuales de chunking/PWA tras ajuste de `manualChunks` + `workbox.inlineWorkboxRuntime=true`.
- Se inicio poda incremental de documentacion canonica (`DOCS-CTX-001`) para converger a `<=2000` palabras por documento sin perder trazabilidad (snapshots completos archivados en `docs/closure/archive/historical/`).
- Permanecen pendientes externos ya conocidos: `OCR-007` (bloqueante OCR), `AUTH-001`, `AUTH-002`, `DB-001`.

## 2) Evidencia tecnica verificada (baseline 2026-03-12)
### Quality gates
- Unit tests (root): `1959/1959 PASS`
- Integration tests: `68/68 PASS`
- E2E smoke: `4/4 PASS`
- Component tests frontend: `257/257 PASS`
- Lint frontend: `0 errors` (`72 warnings` en tests/mocks)
- Build frontend: `PASS`
- Doc links: `PASS`
- Closure policy check: `PASS`

### Build y performance (frontend)
- Bundle con split por dominios pesados (`scanner`, `charts`, `supabase`, `react-core`, etc.) y sin warning circular.
- `scanner` queda bajo umbral de warning configurado por build.
- Paso PWA/Workbox sin warning `Unknown input options: manualChunks`.

### Runtime local vs remoto
- Paridad validada para endpoint critico de salud:
  - `GET /api-minimarket/health` responde `200` local y remoto.
- `api-minimarket` mantiene politica operativa requerida: `verify_jwt=false` en despliegue.

## 3) Estado funcional por dominio
### Core gateway / inventario / pedidos
- Endpoints principales operativos y cubiertos por tests.
- `PUT /pedidos/:id/estado` conserva lock optimista y respuesta `409 CONFLICT` en carrera.

### OCR de facturas
- Backlog tecnico OCR cerrado (10/10), flujo y hardenings implementados en codigo.
- Bloqueante funcional externo vigente: `OCR-007` por billing GCP inactivo.

### Asistente IA
- Sprint 3 implementado y operativo: 7 intents read + 4 intents write con plan→confirm y auditoria persistente.

## 4) Pendientes abiertos (seguimiento vigente)
### Bloqueante externo
- `OCR-007` (CRITICO): OCR end-to-end bloqueado por billing inactivo en GCP para Cloud Vision.

### Hardening externo no bloqueante
- `AUTH-001`: CAPTCHA de Auth pendiente en Supabase.
- `AUTH-002`: timeouts server-side nativos no disponibles en plan actual (mitigado client-side).
- `DB-001`: network restrictions de PostgreSQL pendientes de allowlist.

### Deuda documental
- `DOCS-CTX-001`: poda canonica en progreso. Esta corrida reduce tamaño de docs canónicas y mantiene detalle historico en archivos archivados.

## 5) Context engineering y gobernanza documental
- Entrada de sesion recomendada: `docs/CONTEXT0_EJECUTIVO.md`.
- Budget objetivo por doc canonico: `<=2000` palabras (`CONTEXT0`: 600-1000).
- Exclusiones por defecto de contexto: `node_modules/`, `logs/`, `test-reports/`, `supabase/.temp/`, `docs/closure/archive/historical/`.
- Script de control: `npm run docs:context-budget`.

## 6) Fuentes canonicas vigentes
1. `docs/CONTEXT0_EJECUTIVO.md`
2. `docs/ESTADO_ACTUAL.md`
3. `docs/DECISION_LOG.md`
4. `docs/closure/OPEN_ISSUES.md`
5. `docs/API_README.md`
6. `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
7. `docs/PRODUCTION_GATE_REPORT.md`
8. `docs/api-openapi-3.1.yaml`

## 7) Guardrails activos
1. No imprimir secretos/JWTs (solo nombres de variables).
2. No usar git destructivo (`reset --hard`, `checkout -- <file>`, force-push).
3. Si se redeploya `api-minimarket`, mantener `--no-verify-jwt`.
4. No cerrar issues sin evidencia tecnica verificable.

## 8) Nota de continuidad
El sistema se mantiene en `LISTO PARA PRODUCCION` con evidencia reciente y reproducible. La operacion diaria no esta bloqueada salvo el OCR end-to-end por dependencia externa de billing (`OCR-007`).
