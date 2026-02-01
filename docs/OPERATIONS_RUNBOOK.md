# OPERATIONS RUNBOOK - MINI MARKET SYSTEM

**Fecha:** 2026-02-01  
**Estado:** Documento operativo

---

## 1) Alcance
Runbook operativo para soporte diario, validaciones basicas y ejecucion de tests.

Fuentes de verdad:
- `docs/ESTADO_ACTUAL.md`
- `docs/HOJA_RUTA_MADRE_2026-01-31.md`
- `docs/archive/ROADMAP.md` (histórico)
- `docs/DEPLOYMENT_GUIDE.md`
- `docs/C4_INCIDENT_RESPONSE_MINIMARKET_TEC.md`

---

## 2) Variables de entorno (resumen)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS`
- `API_PROVEEDOR_SECRET`

Nota: No versionar `.env.test`.

---

## 3) Operacion diaria

### 3.1 Frontend (dev)
```bash
cd minimarket-system
npm run dev
```

### 3.2 Build
```bash
cd minimarket-system
npm run build
```

### 3.3 Health checks
- Gateway: `/functions/v1/api-minimarket/health`
- Proveedor: `/functions/v1/api-proveedor/status`

---

## 4) Testing

### Unit tests
```bash
npm run test:unit
```

### Integration tests (gated)
```bash
scripts/run-integration-tests.sh --dry-run
# Requiere .env.test real
```

### E2E frontend (auth real)
```bash
cd minimarket-system
VITE_USE_MOCKS=false pnpm exec playwright test auth.real
```

---

## 5) Modo mocks
- `VITE_USE_MOCKS=true` activa mocks en frontend.
- `E2E_GATEWAY=true` habilita tests de deposito con gateway real.

---

## 6) Logs y observabilidad
- Usar `createLogger()` en Edge Functions (no `console.log`).
- Revisar logs en Supabase Dashboard > Functions.
- Cron jobs registran en `cron_jobs_execution_log`.

---

## 7) Incidentes
- Ver `docs/C4_INCIDENT_RESPONSE_MINIMARKET_TEC.md`.
- Registrar severidad y evidencia.

---

## 8) Seguridad basica
- No exponer `SERVICE_ROLE_KEY` en frontend.
- Rotar secretos si hay sospecha de exposure.
- Mantener `ALLOWED_ORIGINS` en la lista vigente (local-only) y registrar cambios en `docs/DECISION_LOG.md`.
