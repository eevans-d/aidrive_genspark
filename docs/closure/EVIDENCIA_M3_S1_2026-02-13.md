# EVIDENCIA M3.S1 - Guard interno uniforme cron (T01)

**Fecha:** 2026-02-13  
**Estado:** PASS

## Implementación

- Se agregó control uniforme con `requireServiceRoleAuth` en el entrypoint de `cron-jobs-maxiconsumo`.
- Se normalizó uso de CORS compartido con helper interno.

## Archivos tocados

- `supabase/functions/cron-jobs-maxiconsumo/index.ts`

## Verificación

### Contrato auth interno (unit/security)

Comando:

```bash
npm run test:security
```

Resultado:

- `Test Files 1 passed`
- `Tests 6 passed | 1 skipped`
- Se valida 401 sin credenciales y autorización válida con `Bearer`.

## Riesgo residual

- Quedan funciones cron legacy fuera de este alcance con mecanismos mixtos, pero el objetivo de T01 quedó cumplido en el módulo priorizado.

## Siguiente paso

- T02: consolidar suite de seguridad contractual real.
