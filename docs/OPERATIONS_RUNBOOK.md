# Operations Runbook - Mini Market System

Estado: Activo
Audiencia: Operacion + soporte interno
Ultima actualizacion: 2026-03-12
Fuente de verdad: docs/ESTADO_ACTUAL.md
Owner documental: Operacion + Infra

> Este documento reemplaza la version corta previa y queda alineado al paquete documental V1.
> Referencias de estado: segun FactPack 2026-03-12.

## Objetivo
Definir pasos operativos estandar para:
- operacion diaria
- respuesta a incidentes
- continuidad (backup/restore)
- verificacion tecnica minima antes de cambios

## Procedimiento Paso A Paso
### A. Inicio de jornada
1. Confirmar acceso a frontend productivo.
2. Ejecutar smoke operativo estandar.
3. Revisar alertas/tareas urgentes.
4. Confirmar que POS y Cuaderno abren.

Comandos sugeridos:
```bash
OPS_SMOKE_TARGET=remote SUPABASE_URL="https://<project-ref>.supabase.co" node scripts/ops-smoke-check.mjs
```

### B. Operacion continua
1. Monitorear eventos criticos:
   - errores de cobro en POS
   - acumulacion de faltantes criticos
   - errores de login/permisos
2. Registrar evidencia minima de incidentes:
   - hora
   - ruta/endpoint
   - mensaje
   - requestId (si existe)

### C. Cierre de jornada
1. Validar que no haya tickets activos en POS.
2. Revisar faltantes pendientes en Cuaderno.
3. Confirmar estado de alertas y tareas.
4. Registrar nota de bitacora si hubo novedad.

## Playbook De Triage (Primeros 10-15 Minutos)
### Minuto 0-3: Confirmar alcance rapido
1. Ejecutar smoke check:
   - `OPS_SMOKE_TARGET=remote SUPABASE_URL="https://<project-ref>.supabase.co" node scripts/ops-smoke-check.mjs`
2. Capturar evidencia base:
   - timestamp UTC
   - endpoint(s) en FAIL
   - status HTTP
   - latencia
   - intento donde falla

### Minuto 3-8: Aislar dominio de la falla
1. Si falla solo `api-proveedor/health`, tratar como incidente de proveedor/scraper.
2. Si el fallo de proveedor es `401`, validar primero credencial operativa:
   - `OPS_SMOKE_API_PROVEEDOR_SECRET` (o variable base `API_PROVEEDOR_SECRET` en el entorno de ejecucion).
3. Si falla solo `api-minimarket/health`, tratar como incidente de gateway principal.
4. Si fallan ambos endpoints criticos, tratar como incidente de plataforma (Supabase/infra/red).
5. Si falla solo `cron-health-monitor/health-check` y los criticos estan PASS, registrar warning operativo y mantener servicio online.

### Minuto 8-15: Contencion y escalacion
1. Revisar logs recientes de Edge Functions afectadas.
2. Confirmar impacto en operaciones clave (POS, Cuaderno, Tareas).
3. Definir estado del incidente:
   - `SEV-2`: una API critica degradada sin caida total.
   - `SEV-1`: ambas APIs criticas caidas o errores 5xx sostenidos.
4. Escalar con evidencia minima estandar:
   - comando ejecutado
   - salida resumen
   - hora de inicio
   - impacto funcional observado

## Runbooks Por Tipo De Incidente
### R1 - Login o permisos
1. Reintentar sesion.
2. Verificar rol efectivo del usuario.
3. Confirmar que la ruta este permitida para ese rol.
4. Si persiste, escalar con evidencia.

### R2 - POS no permite cobrar
1. Revisar carrito no vacio.
2. Si modo fiado, seleccionar cliente.
3. Verificar mensajes (`stock insuficiente`, `limite credito`, etc).
4. Reintentar una vez.
5. Si persiste, escalar a soporte tecnico.

### R3 - Faltantes no se guardan o no aparecen
1. Confirmar ruta `/cuaderno`.
2. Probar alta simple desde FAB o busqueda global.
3. Revisar tabs (`Todos`, `Por Proveedor`, `Resueltos`).
4. Escalar si la operacion no persiste.

### R4 - Health check en rojo
1. Ejecutar smoke check operativo:
   - `OPS_SMOKE_TARGET=remote SUPABASE_URL="https://<project-ref>.supabase.co" node scripts/ops-smoke-check.mjs`
2. Revisar logs de Functions en Supabase.
3. Confirmar si afecta solo un servicio o todo el flujo.
4. Activar incidente interno y seguir continuidad.

### R5 - Continuidad de datos (backup/restore)
Backup:
```bash
./scripts/db-backup.sh
```

Restore drill:
```bash
./scripts/db-restore-drill.sh
```

Si el entorno usa Supabase plan con PITR, priorizar PITR sobre rollback manual.

## Validaciones Pre-Release Documentales
```bash
pnpm -C minimarket-system lint
pnpm -C minimarket-system build
npm run test:unit
npm run test:integration
npm run test:e2e
node scripts/validate-doc-links.mjs
```

## Errores Comunes
1. Ejecutar acciones de rollback sin backup.
2. Mezclar entornos (local/staging/prod) en el mismo procedimiento.
3. No documentar evidencia de incidente.
4. Asumir que error de UI siempre es problema de frontend.

## Verificacion
Checklist de salud operativa:
- [ ] Frontend accesible
- [ ] `ops-smoke-check` en PASS para checks criticos
- [ ] POS operativo
- [ ] Cuaderno operativo
- [ ] Alertas y tareas visibles

## Escalacion
Nivel 1 - Turno:
- Ejecuta runbook del incidente.

Nivel 2 - Responsable interno:
- Evalua impacto de negocio y decide contencion temporal.

Nivel 3 - Soporte tecnico:
- Adjuntar evidencia tecnica completa.
- Registrar issue en `docs/closure/OPEN_ISSUES.md` cuando el impacto sea recurrente o critico.
