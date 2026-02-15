# EVIDENCIA M8.S1 - Deploy safety por rama (T04)

**Fecha:** 2026-02-13  
**Estado:** PASS

## Implementación

- Se agregó allowlist de ramas para producción con `ALLOWED_PROD_BRANCHES`.
- Se incorporó validación fail-fast en precondiciones.

## Archivos tocados

- `deploy.sh`

## Verificación

### Dry-run rama inválida

```bash
printf 'yes\ny\n' | ALLOWED_PROD_BRANCHES=main ./deploy.sh production 106 testsha true false
```

Resultado:

- Falla esperada:
  - `Branch 'session-close-2026-02-11' no permitida para deploy productivo`

### Dry-run rama permitida

```bash
printf 'yes\n' | ALLOWED_PROD_BRANCHES=session-close-2026-02-11 ./deploy.sh production 107 testsha true true
```

Resultado:

- Gate de rama pasa:
  - `Branch 'session-close-2026-02-11' permitida para producción`
- Luego falla por prerequisito de entorno (esperado):
  - `SUPABASE_SERVICE_ROLE_KEY requerida para producción`

## Riesgo residual

- El deploy real a producción sigue dependiente de variables secretas correctamente configuradas.

## Siguiente paso

- T05: hardening de Auth preproducción.
