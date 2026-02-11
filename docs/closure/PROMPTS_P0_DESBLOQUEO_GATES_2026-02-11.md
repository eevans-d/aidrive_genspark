# Prompts P0 — Desbloqueo de Gates Obligatorios (2026-02-11)

Usar estos prompts en una nueva ventana de Claude Code/Copilot. Ejecutar en orden.

## Prompt 1 — HC-1 (Cron auth) + maintenance schedule

```text
Actúa como ejecutor técnico en /home/eevan/ProyectosIA/aidrive_genspark.

Objetivo P0: corregir HC-1 (cron jobs sin Authorization header) y dejar mantenimiento programado.

Restricciones:
- NO imprimir secretos/JWTs (solo nombres de variables).
- NO comandos git destructivos.
- NO deploy directo; solo dejar SQL/migración lista y evidencia.

Tareas:
1) Auditar `supabase/cron_jobs/deploy_all_cron_jobs.sql`.
2) Corregir estos jobs para incluir header Authorization con service role:
   - `notificaciones-tareas_invoke`
   - `alertas-stock_invoke`
   - `reportes-automaticos_invoke`
3) Agregar schedule para `maintenance_cleanup` (semanal) invocando `cron-jobs-maxiconsumo` con auth.
4) Generar migración SQL en `supabase/migrations/` con rollback explícito (unschedule + reschedule).
5) Actualizar evidencia:
   - `docs/audit/EVIDENCIA_SP-E.md`
   - `docs/audit/EVIDENCIA_SP-OMEGA.md`
   - `docs/audit/EXECUTION_LOG_AUDITORIA_2026-02-10.md`

Criterio de cierre:
- grep de Authorization en todos los net.http_post de cron SQL = completo.
- Gate 4 y Gate 10 recalculados con evidencia (si quedó pendiente de aplicar en remoto, marcar PARCIAL con motivo).
```

## Prompt 2 — HC-2 (deploy.sh seguro)

```text
Actúa como ejecutor técnico en /home/eevan/ProyectosIA/aidrive_genspark.

Objetivo P0: corregir `deploy.sh` para no romper producción.

Restricciones:
- NO imprimir secretos/JWTs.
- NO comandos destructivos.

Tareas:
1) Editar `deploy.sh` para que en el loop de Edge Functions:
   - excluya `_shared/`
   - excluya archivos no-función
2) Garantizar deploy de `api-minimarket` con `--no-verify-jwt`.
3) Mantener deploy estándar para el resto de funciones.
4) Verificar con dry-run local (sin deploy real): mostrar lista de funciones objetivo.
5) Actualizar evidencia:
   - `docs/audit/EVIDENCIA_SP-D.md`
   - `docs/audit/EVIDENCIA_SP-E.md`
   - `docs/audit/EXECUTION_LOG_AUDITORIA_2026-02-10.md`

Criterio de cierre:
- `deploy.sh` contiene filtro `_shared` y uso explícito de `--no-verify-jwt` para `api-minimarket`.
- Gate de deploy seguro actualizado.
```

## Prompt 3 — HC-3 + 401 global + UX mínimo crítico

```text
Actúa como ejecutor técnico en /home/eevan/ProyectosIA/aidrive_genspark.

Objetivo P0: eliminar mutaciones silenciosas y asegurar manejo global de 401.

Restricciones:
- NO cambiar lógica de negocio, solo UX/errores.
- NO imprimir secretos.

Tareas:
1) En `minimarket-system/src/pages/Pedidos.tsx`:
   - mantener `console.error` para debug
   - agregar `toast.error(...)` en los 3 catches de mutaciones
2) Implementar manejo global de 401 de `ApiError('AUTH_REQUIRED')`:
   - en `apiClient` o capa compartida
   - forzar flujo consistente a login/signOut
3) Añadir manejo de error persistente (ErrorMessage) en páginas críticas sin romper layout.
4) Ejecutar verificación:
   - `pnpm -C minimarket-system build`
   - `rg -n "console.error" minimarket-system/src/pages/Pedidos.tsx`
   - `rg -n "AUTH_REQUIRED|401" minimarket-system/src`
5) Actualizar evidencia:
   - `docs/audit/EVIDENCIA_SP-B.md`
   - `docs/audit/EVIDENCIA_SP-D.md`
   - `docs/audit/EVIDENCIA_SP-OMEGA.md`
   - `docs/audit/EXECUTION_LOG_AUDITORIA_2026-02-10.md`

Criterio de cierre:
- HC-3 resuelto (0 mutaciones críticas sin feedback al operador).
- Riesgo de sesión expirada reclasificado con evidencia.
```

## Prompt 4 — Recalcular gates y veredicto

```text
Actúa como auditor de cierre en /home/eevan/ProyectosIA/aidrive_genspark.

Objetivo: recalcular 18 gates tras fixes P0 y emitir veredicto consistente con el criterio del Plan Maestro.

Tareas:
1) Releer:
   - `docs/PLAN_MAESTRO_EJECUCION_AUDITORIA_v1.md`
   - `docs/audit/EVIDENCIA_SP-A.md` a `EVIDENCIA_SP-OMEGA.md`
2) Actualizar tabla de gates en `docs/audit/EVIDENCIA_SP-OMEGA.md`.
3) Aplicar criterio formal:
   - Piloto: gates 1,2,3,4,7,8,11,17,18 en ✅
   - Producción: Piloto + 15 y 16 en ✅
4) Actualizar `docs/audit/EXECUTION_LOG_AUDITORIA_2026-02-10.md` y `docs/ESTADO_ACTUAL.md`.

Criterio de cierre:
- Veredicto final y perfil Piloto/Producción sin contradicciones internas.
- Cada gate con evidencia concreta.
```
