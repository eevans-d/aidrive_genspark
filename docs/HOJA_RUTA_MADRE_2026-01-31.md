# Hoja de Ruta MADRE — Producción 100% (2026-01-31)

**Última actualización:** 2026-02-01  
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

- ✅ RLS role-based v2 aplicada y verificada en PROD (10/10 tablas core, 30 policies, 0 anon grants).  
  Evidencia: `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` (Partes 4 y 5).
- ✅ Security Advisor mitigado (alertas no críticas):  
  - ERROR: 0 (vistas SECURITY DEFINER mitigadas)  
  - WARN: 0 (confirmación usuario 2026-02-01; leaked password protection habilitado)  
  - INFO: 15 (tablas internas sin policies; aceptable si solo usa service_role)  
  Evidencia: Parte 8 en `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`.
- ✅ Migraciones versionadas:  
  - `supabase/migrations/20260131000000_rls_role_based_policies_v2.sql` (aplicada PROD).  
  - `supabase/migrations/20260131020000_security_advisor_mitigations.sql` (validada en no‑PROD por confirmación usuario).

### ✅ Tareas ya cerradas (no repetir)
- RLS role-based v2 aplicado y verificado en PROD.  
- Security Advisor mitigado (ERROR=0; anon grants internos revocados).  
- Documentación base de auditoría (Partes 1–8) en `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`.

---

## 1) Checklist MADRE — cierre final (completado)

**Actualización 2026-02-01:** ítems marcados como completados por confirmación del usuario (evidencia manual).

> **Leyenda:**
> - [ ] Pendiente
> - [x] Completado
> - **Observación**: notas críticas por paso.

### 1.1 Seguridad (P0/P1)
- [x] **Habilitar leaked password protection** en Dashboard → Auth → Settings.  
- [x] **Evaluar rotación de secretos** si hubo exposición histórica.  
- [x] **Confirmar WARN residual** en Security Advisor (post‑mitigación).  
- [x] **Plan operativo detallado (WARN residual):** `docs/PLAN_MITIGACION_WARN_STAGING_2026-01-31.md`.
- [x] **Aplicar/validar migración de mitigaciones** en entornos no‑PROD.  
- [x] **Reconfirmar Advisor** (panel) y registrar evidencia de estado final.  
- [x] **Revisión humana de módulos críticos P0** (security review manual).  

### 1.2 Base de datos y consistencia
- [x] **Sincronizar estado de migraciones** en staging/prod.  
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

**Observación:** estas tareas se cerraron (confirmación usuario 2026-02-01). El proyecto queda en estado “Producción 100%” con riesgos residuales documentados.

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
