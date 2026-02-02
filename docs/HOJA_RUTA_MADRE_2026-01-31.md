# Hoja de Ruta MADRE — Producción 100% (2026-01-31)

**Última actualización:** 2026-02-02  
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
- ⚠️ COMET reporta **18 políticas** en tablas críticas (esperado 30 según auditoría 2026-01-31) — requiere verificación.
- ⚠️ Security Advisor (COMET 2026-02-02): ERROR=0, **WARN=3**, INFO=15.  
  - WARN: search_path mutable en `public.sp_aplicar_precio` + vista materializada pública `tareas_metricas` + leaked password protection.
  - Mitigación aplicada en PROD (Antigravity 2026-02-02). **Pendiente verificación visual** (WARN debería bajar a 1).
- ❌ Leaked password protection **DESACTIVADO** (requiere **SMTP personalizado**; el toggle no aparece sin esto).
- ✅ Migración `20260202000000` aplicada en PROD (2026-02-02) tras reconciliar historial.
- ✅ Mitigación Advisor (WARN search_path + tareas_metricas) ejecutada en PROD (2026-02-02).

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
- [ ] **Habilitar leaked password protection** en Dashboard → Auth → Settings (**requiere SMTP personalizado**). *(Re‑abierto 2026-02-02)*  
- [x] **Evaluar rotación de secretos** si hubo exposición histórica.  
- [ ] **Confirmar WARN residual** en Security Advisor (post‑mitigación; debería quedar WARN=1). *(Pendiente evidencia visual)*  
- ✅ **Mitigar WARN search_path** en `public.sp_aplicar_precio` (migración aplicada 2026-02-02).
- ✅ **Mitigar WARN de vista materializada** `public.tareas_metricas` (endpoint migrado a `service_role` + REVOKE aplicado 2026-02-02).  
- [ ] **Validar endpoint** `/reportes/efectividad-tareas` con JWT real (200 OK).
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
- [x] **Confirmar licencia oficial** (LICENSE verificado).
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
- [x] Rate limit por usuario (además de IP).  
- [x] OpenAPI para endpoints nuevos.  
- [x] Mejoras scraper (retry inteligente, métricas, headless si aplica).  
- [x] Dashboard de cron + backoff + alertas por fallo.  
- [x] Notificaciones push/email + dashboard frontend.  
- [x] Validar `apiClient.ts` (JWT en headers, manejo de errores, reintentos).
- [x] Validar orquestador cron (`cron-jobs-maxiconsumo/orchestrator.ts`) con fallos y retries.

---

## 2) Ruta mínima hasta “100% Producción” (secuencia ejecutada)

1) **Seguridad:** activar leaked password protection (panel).  
2) **Verificación Advisor:** revisar WARN residual y capturar evidencia final.  
3) **DB Consistencia:** validar migraciones 20260131 + fix_constraints en staging/prod.  
4) **CI/CD:** configurar secrets en GitHub y decidir integración/E2E en CI.  
5) **Backups/DR:** documentar y probar procedimiento mínimo.  
6) **Revisión humana P0:** completar checklist de módulos críticos.  
7) **Docs:** confirmar limpieza de referencias legacy y actualizar docs de API/Postman si cambió el API.  

**Observación:** el cierre de 2026-02-01 queda **condicionado** por hallazgos COMET del 2026-02-02.

---

## 3) Evidencia mínima capturada/confirmada (para cierre definitivo)

- Captura/registro del Security Advisor sin alertas críticas relevantes (confirmación usuario).  
- Registro de leaked password protection habilitado (confirmación usuario).  
- `migrate.sh status` o `supabase db push` confirmando migraciones 20260131 (confirmación usuario).  
- Evidencia de revisión humana P0 (checklist firmado o log).  
- Actualización en `docs/DECISION_LOG.md` y `docs/ESTADO_ACTUAL.md`.

---

## 4) Notas finales

- Las 10 tablas core están protegidas y verificadas en PROD.  
- Los INFO del Advisor corresponden a tablas internas y no son bloqueantes si el acceso es solo `service_role`.  
- La mitigación de Advisor ya está aplicada en PROD; la migración 20260131020000 fue validada en no‑PROD (confirmación usuario) para mantener trazabilidad.
