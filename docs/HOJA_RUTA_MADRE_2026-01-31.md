# Hoja de Ruta MADRE — Producción 100% (2026-01-31)

**Última actualización:** 2026-01-31  
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
  - WARN: 2 (pendiente manual: leaked password protection + 1 WARN residual no especificado)  
  - INFO: 15 (tablas internas sin policies; aceptable si solo usa service_role)  
  Evidencia: Parte 8 en `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`.
- ✅ Migraciones versionadas:  
  - `supabase/migrations/20260131000000_rls_role_based_policies_v2.sql` (aplicada PROD).  
  - `supabase/migrations/20260131020000_security_advisor_mitigations.sql` (creada; aplicar/validar en entornos no-PROD si corresponde).

### ✅ Tareas ya cerradas (no repetir)
- RLS role-based v2 aplicado y verificado en PROD.  
- Security Advisor mitigado (ERROR=0; anon grants internos revocados).  
- Documentación base de auditoría (Partes 1–8) en `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`.

---

## 1) Checklist MADRE — pasos pendientes hasta 100%

> **Leyenda:**
> - [ ] Pendiente
> - [x] Completado
> - **Observación**: notas críticas por paso.

### 1.1 Seguridad (P0/P1)
- [ ] **Habilitar leaked password protection** en Dashboard → Auth → Settings.  
  **Observación:** no es posible por SQL; requiere panel.
- [ ] **Evaluar rotación de secretos** si hubo exposición histórica.  
  **Observación:** coordinar rotación Supabase + CI + Edge Functions y registrar en DECISION_LOG.
- [ ] **Confirmar WARN residual** en Security Advisor (post‑mitigación).  
  **Observación:** el reporte indica WARN=2 pero solo se detalla 1; verificar el segundo.
- [ ] **Plan operativo detallado (WARN residual):** `docs/PLAN_MITIGACION_WARN_STAGING_2026-01-31.md`.
- [ ] **Aplicar/validar migración de mitigaciones** en entornos no‑PROD si corresponde:  
  `supabase/migrations/20260131020000_security_advisor_mitigations.sql`.
- [ ] **Reconfirmar Advisor** (panel) y registrar evidencia de estado final.
- [ ] **Revisión humana de módulos críticos P0** (security review manual).  
  **Alcance mínimo:**  
  - `supabase/functions/api-minimarket/index.ts` (timeouts, edge cases)  
  - `supabase/functions/_shared/cors.ts` (ALLOWED_ORIGINS en todas las funciones)  
  - `supabase/functions/_shared/rate-limit.ts` (estrategia y límites)  
  - `supabase/migrations/20260110100000_fix_rls_security_definer.sql` (uso de SECURITY DEFINER)  
  - `minimarket-system/src/contexts/AuthContext.tsx` (refresh tokens, expiración, CSRF)  
  - `supabase/functions/scraper-maxiconsumo/` (rate limiting externo, errores de red)

### 1.2 Base de datos y consistencia
- [ ] **Sincronizar estado de migraciones** en staging/prod: `./migrate.sh status` o `supabase db push`.  
  **Observación:** asegurar que ambas migraciones 20260131 estén registradas.
- [ ] **Verificar aplicación de migración de constraints/indexes**:  
  `supabase/migrations/20260110000000_fix_constraints_and_indexes.sql` (si no está en PROD, aplicar).
- [ ] **Actualizar evidencias RLS** si se ejecuta en staging/local:  
  - `scripts/rls_audit.sql`  
  - actualizar `docs/AUDITORIA_RLS_CHECKLIST.md` si aplica.
- [ ] **Recuperar/crear `REPORTE_REVISION_DB.md`** y resolver hallazgos (P0/P1/P2) referenciados en `docs/DB_GAPS.md`.

### 1.3 Operaciones / Backups / DR
- [ ] **Definir y documentar Backup/DR** (procedimiento y prueba).  
  **Observación:** Supabase Free no soporta PITR; dejar claro el alcance.
- [ ] **Configurar monitoring externo** (alertas operativas críticas).
- [ ] **Confirmar dashboard de métricas en vivo** (cron/jobs) o documentar ausencia.
- [ ] **Ejecutar baseline performance real (k6)** y registrar resultados.

### 1.4 CI/CD y calidad
- [ ] **Validación de envs requeridas** antes de build/deploy (WS6.2).  
- [ ] **Habilitar integration/E2E en CI** o dejar decisión documentada.  
- [ ] **Security scanning automatizado** (CodeQL/Snyk o equivalente).
- [ ] **Configurar secrets en GitHub** (SUPABASE_URL/KEYS, API_PROVEEDOR_SECRET, VITE_*).  
  **Observación:** desbloquea integration/E2E en CI.
- [ ] **Staging pipeline completo** (deploy + tests automatizados) si aplica.

### 1.5 Documentación y gobernanza
- [ ] **Resolver referencias faltantes**:  
  - `PLAN_EJECUCION.md` (referenciado en CHECKLIST)  
  - `REPORTE_REVISION_DB.md` (referenciado en DB_GAPS)
- [ ] **Resolver documentos base faltantes**:  
  - `INVENTARIO_ACTUAL.md`  
  - `BASELINE_TECNICO.md`  
  - `PLAN_WS_DETALLADO.md`  
  **Observación:** crear o eliminar referencias según decisión.
- [ ] **Confirmar licencia oficial** (actualmente pendiente en LICENSE).  
- [ ] **Onboarding guide** para nuevos devs (si aplica).
- [ ] **Runbook operacional expandido** (si aplica: incidentes, rollback, soporte).
- [ ] **Postman collections**: confirmar vigencia / actualizar si cambió el API.
- [ ] **Documentation site** (opcional) para centralizar docs técnicas.

### 1.6 Producto/UX (no bloqueante)
- [ ] Gráficos en Rentabilidad.  
- [ ] Skeleton loaders.  
- [ ] PWA offline básico.  
- [ ] Shortcuts teclado.  

### 1.7 Backend / Scraper / Cron / Notificaciones (no bloqueante)
- [ ] Dividir `api-minimarket/index.ts` en routers.  
- [ ] Rate limit por usuario (además de IP).  
- [ ] OpenAPI para endpoints nuevos.  
- [ ] Mejoras scraper (retry inteligente, métricas, headless si aplica).  
- [ ] Dashboard de cron + backoff + alertas por fallo.  
- [ ] Notificaciones push/email + dashboard frontend.  
- [ ] Validar `apiClient.ts` (JWT en headers, manejo de errores, reintentos).
- [ ] Validar orquestador cron (`cron-jobs-maxiconsumo/orchestrator.ts`) con fallos y retries.

---

## 2) Ruta mínima hasta “100% Producción” (secuencia recomendada)

1) **Seguridad:** activar leaked password protection (panel).  
2) **Verificación Advisor:** revisar WARN residual y capturar evidencia final.  
3) **DB Consistencia:** validar migraciones 20260131 + fix_constraints en staging/prod.  
4) **CI/CD:** configurar secrets en GitHub y decidir integración/E2E en CI.  
5) **Backups/DR:** documentar y probar procedimiento mínimo.  
6) **Revisión humana P0:** completar checklist de módulos críticos.  
7) **Docs:** cerrar referencias faltantes (PLAN_EJECUCION / REPORTE_REVISION_DB) y registrar decisiones.  

**Observación:** si estas tareas se cierran, el proyecto queda en estado “Producción 100%” con riesgos residuales documentados.

---

## 3) Evidencia mínima a capturar (para cierre definitivo)

- Captura/registro del Security Advisor sin alertas críticas relevantes.  
- Registro de leaked password protection habilitado.  
- `migrate.sh status` o `supabase db push` confirmando migraciones 20260131.  
- Evidencia de revisión humana P0 (checklist firmado o log).  
- Actualización en `docs/DECISION_LOG.md` y `docs/ESTADO_ACTUAL.md`.

---

## 4) Notas finales

- Las 10 tablas core están protegidas y verificadas en PROD.  
- Los INFO del Advisor corresponden a tablas internas y no son bloqueantes si el acceso es solo `service_role`.  
- La mitigación de Advisor ya está aplicada en PROD; la migración 20260131020000 debe usarse para sincronizar entornos y mantener trazabilidad.
