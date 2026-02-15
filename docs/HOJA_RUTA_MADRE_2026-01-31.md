> [DEPRECADO: 2026-02-13] Documento historico. No usar como fuente primaria. Fuente vigente: `docs/ESTADO_ACTUAL.md`, `docs/closure/MEGA_PLAN_2026-02-13_042956.md`, `docs/closure/OPEN_ISSUES.md`.

# Hoja de Ruta MADRE — Producción 100% (histórico) / Cierre condicionado (2026-02-02)

**Última actualización:** 2026-02-04  
**Alcance:** desde el estado actual real hasta cierre total (100%) del proyecto en producción.  
**Fuente primaria:** `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` + `docs/ESTADO_ACTUAL.md` + `docs/DECISION_LOG.md` + `docs/CHECKLIST_CIERRE.md`.

---

## 🧭 Cómo usar esta Hoja de Ruta (para agentes)

- **Ejecución:** trabajar en orden por secciones (1.1 → 1.7), priorizando P0/P1.  
- **Evidencia mínima por tarea:** comando/log/captura + fecha + resultado.  
- **Actualizar siempre:**  
  1) `docs/ESTADO_ACTUAL.md` (estado general)  
  2) `docs/DECISION_LOG.md` (decisiones y cambios críticos)  
  3) `docs/CHECKLIST_CIERRE.md` (checklist final)  
- **Si toca Security Advisor:** agregar PARTE 9 en `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`.  
- **Si dudas:** NO marcar DONE; documentar bloqueo y siguiente paso.

---

## 0) Estado actual verificado (resumen)

- ✅ RLS role-based v2 aplicada y verificada en PROD (10/10 tablas core).  
- ✅ **RLS policies (public)** verificadas por COMET 2026-02-04: **33**.
- ✅ **Security Advisor** verificado por COMET 2026-02-04: ERROR=0, **WARN=1**, INFO=15.  
  - WARN único: leaked password protection deshabilitada.
  - INFO: tablas con RLS habilitada sin políticas (no bloqueante si solo `service_role`).
- ❌ Leaked password protection **NO DISPONIBLE** (COMET reporta que requiere **plan Pro**; SMTP ya está configurado).  
  - **Decisión (usuario):** diferir upgrade hasta producción.
- ✅ Migración `20260202000000` aplicada en PROD (2026-02-02) tras reconciliar historial.
- ✅ Mitigación Advisor (WARN search_path + tareas_metricas) ejecutada en PROD (2026-02-02).

### 0.1 Premortem operativo (nuevo)

**Plan fuente:** `docs/PLAN_EJECUCION_PREMORTEM.md`  
**Proximos pasos inmediatos (48–72h):**
- Ejecutar Preflight y registrar evidencia en `docs/ESTADO_ACTUAL.md`.
- WS1 hotfix: idempotency key en `/reservas` + constraint unico + bloqueo doble submit si aplica.
- WS2 lock por job en `cron-jobs-maxiconsumo` para evitar solapamientos.
- WS5 guardrail: bloquear deploy si `cron-notifications` queda en modo simulacion en PROD.
- Confirmar si existe flujo UI de reservas; si no, cambios solo backend.

### ✅ Tareas ya cerradas (no repetir)
- RLS role-based v2 aplicado y verificado en PROD.  
- Security Advisor mitigado (ERROR=0; anon grants internos revocados).  
- Documentación base de auditoría (Partes 1–8) en `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`.

---

## 1) Checklist MADRE — cierre final (re‑abierto por COMET 2026-02-02)

**Actualización 2026-02-02:** se re‑abren tareas críticas por hallazgos en panel.

> **Leyenda:**
> - [ ] Pendiente
> - [x] Completado
> - **Observación**: notas críticas por paso.

### 1.1 Seguridad (P0/P1)
- [ ] **Habilitar leaked password protection** en Dashboard → Auth → Settings (**requiere plan Pro según COMET**). *(Re‑abierto 2026-02-02; verificado 2026-02-04: SMTP OK, LPP no disponible; decisión: diferir hasta producción)*  
- [x] **Evaluar rotación de secretos** si hubo exposición histórica.  
- [x] **Confirmar WARN residual** en Security Advisor (post‑mitigación; WARN=1 por leaked password protection). *(Verificado COMET 2026-02-04)*  
- ✅ **Mitigar WARN search_path** en `public.sp_aplicar_precio` (migración aplicada 2026-02-02).
- ✅ **Mitigar WARN de vista materializada** `public.tareas_metricas` (endpoint migrado a `service_role` + REVOKE aplicado 2026-02-02).  
- [x] **Validar endpoint** `/reportes/efectividad-tareas` con JWT real (**200 OK**, 2026-02-04). *(Requirió redeploy `api-minimarket` con `--no-verify-jwt` por JWT ES256; validación queda en app con `/auth/v1/user` + roles)*  
- [x] **Plan operativo detallado (WARN residual):** `docs/PLAN_MITIGACION_WARN_STAGING_2026-01-31.md`.
- [x] **Aplicar/validar migración de mitigaciones** en entornos no‑PROD.  
- [x] **Reconfirmar Advisor** (panel) y registrar evidencia de estado final.  
- [x] **Revisión humana de módulos críticos P0** (security review manual).  

### 1.2 Base de datos y consistencia
- [x] **Sincronizar historial de migraciones** en prod (alinear versiones remotas y aplicar/registrar `20260202000000`). *(Resuelto 2026-02-02)*  
- [x] **Verificar aplicación de migración de constraints/indexes**.  
- [x] **Actualizar evidencias RLS** si se ejecuta en staging/local.  
- [x] **Confirmar N/A de `REPORTE_REVISION_DB.md`**: `docs/DB_GAPS.md` indica que no existe.

### 1.3 Operaciones / Backups / DR
- [x] **Definir y documentar Backup/DR** (procedimiento y prueba).  
- [x] **Configurar monitoring externo** (alertas operativas críticas).  
- [x] **Confirmar dashboard de métricas en vivo** (cron/jobs).  
- [x] **Ejecutar baseline performance real (k6)** y registrar resultados.  

### 1.4 CI/CD y calidad
- [x] **Validación de envs requeridas** antes de build/deploy.
- [x] **Habilitar integration/E2E en CI** o dejar decisión documentada.  
- [x] **Security scanning automatizado**.
- [x] **Configurar secrets en GitHub** (SUPABASE_URL/KEYS, API_PROVEEDOR_SECRET, VITE_*).  
- [x] **Staging pipeline completo** (deploy + tests automatizados).

### 1.5 Documentación y gobernanza
- [x] **Referencias legacy removidas** (ya no existen en repo).
- [x] **Confirmar licencia oficial** (MIT, `ORIGEN•AI`) — 2026-02-04.
- [x] **Onboarding guide** para nuevos devs.
- [x] **Runbook operacional expandido** (incidentes, rollback, soporte).
- [x] **Postman collections**: confirmar vigencia / actualizar si cambió el API.
- [x] **Documentation site** (opcional) para centralizar docs técnicas.

### 1.6 Producto/UX (no bloqueante)
- [x] Gráficos en Rentabilidad.  
- [x] Skeleton loaders.  
- [x] PWA offline básico.  
- [x] Shortcuts teclado.  

### 1.7 Backend / Scraper / Cron / Notificaciones (no bloqueante)
- [x] Dividir `api-minimarket/index.ts` en routers.  
- [x] Rate limit por usuario en `api-proveedor` (usa `x-user-id`/`authorization`).  
- [ ] Rate limit por usuario en gateway `api-minimarket` (pendiente; ver `docs/PLAN_EJECUCION_PREMORTEM.md` WS3).  
- [x] OpenAPI para endpoints nuevos.  
- [x] Mejoras scraper (retry inteligente, métricas, headless si aplica).  
- [x] Dashboard de cron + backoff + alertas por fallo.  
- [x] Notificaciones push/email + dashboard frontend.  
- [x] Validar `apiClient.ts` (JWT en headers, manejo de errores, reintentos).
- [x] Validar orquestador cron (`cron-jobs-maxiconsumo/orchestrator.ts`) con fallos y retries.

---

## 2) Ruta mínima hasta “100% Producción” (objetivo / pendiente de cierre)

1) **Seguridad:** activar leaked password protection (panel) — **pendiente** (requiere plan Pro; decisión: diferir hasta producción).  
2) **Verificación Advisor:** confirmar WARN=0 (o 1 si aún falta LPP) y capturar evidencia final — **pendiente** hasta activar LPP.  
3) **DB Consistencia:** validar migraciones 20260131 + fix_constraints en staging/prod.  
4) **CI/CD:** configurar secrets en GitHub y decidir integración/E2E en CI.  
5) **Backups/DR:** documentar y probar procedimiento mínimo.  
6) **Revisión humana P0:** completar checklist de módulos críticos.  
7) **Docs:** confirmar limpieza de referencias legacy y actualizar docs de API/Postman si cambió el API.  

**Observación:** el cierre de 2026-02-01 queda **condicionado** por hallazgos COMET del 2026-02-02.

---

## 3) Evidencia mínima capturada/confirmada (para cierre definitivo)

- Verificación Security Advisor (COMET 2026-02-04): ERROR=0, WARN=1, INFO=15.  
- Registro de leaked password protection habilitado — **pendiente** (requiere plan Pro; decisión: diferir hasta producción).  
- `migrate.sh status` o `supabase db push` confirmando migraciones 20260131 (confirmación usuario).  
- Evidencia de revisión humana P0 (checklist firmado o log).  
- Actualización en `docs/DECISION_LOG.md` y `docs/ESTADO_ACTUAL.md`.

---

## 4) Notas finales

- Las 10 tablas core están protegidas y verificadas en PROD.  
- Los INFO del Advisor corresponden a tablas internas y no son bloqueantes si el acceso es solo `service_role`.  
- La mitigación de Advisor ya está aplicada en PROD; la migración 20260131020000 fue validada en no‑PROD (confirmación usuario) para mantener trazabilidad.
