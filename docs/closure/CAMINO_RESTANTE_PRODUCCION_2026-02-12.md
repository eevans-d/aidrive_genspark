# Camino Restante Producción (2026-02-12)

## Estado
Documento canónico actualizado el 2026-02-13 para mantener trazabilidad + cierre de restos.

## Foto vigente
- Ver estado integral: `docs/ESTADO_ACTUAL.md`.
- Ver pendientes operativos actuales: `docs/closure/OPEN_ISSUES.md`.
- Ver revalidación RLS más reciente: `docs/closure/EVIDENCIA_RLS_REVALIDACION_2026-02-13.md`.
- Ver barrido de restos y limpieza ejecutada: `docs/closure/RESTOS_CIERRE_2026-02-13.md`.

## Pendientes activos al cierre
1. Configurar `VITE_SENTRY_DSN` (Gate 16).
2. Ejecutar rotación preventiva de secretos pre-producción.
3. Re-ejecutar validación SQL RLS (`scripts/rls_audit.sql`, `scripts/rls_fine_validation.sql`) desde runner con conectividad IPv6.

## Ejecución mínima recomendada (sin refactor grande)
1. **Owner/Observabilidad**: configurar DSN real y verificar captura en Sentry (`captureException`).
2. **Owner/Security Ops**: ejecutar rotación preventiva según `docs/SECRET_ROTATION_PLAN.md`.
3. **Infra/DB**: correr batería RLS en staging con runner IPv6 y publicar evidencia de 0 FAIL.
4. **DocuGuard final**: actualizar `OPEN_ISSUES` + `ESTADO_ACTUAL` con fecha/evidencia nuevas.
