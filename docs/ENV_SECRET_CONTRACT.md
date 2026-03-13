# ENV Secret Contract

Estado: Activo  
Ultima actualizacion: 2026-03-12  
Fuente de verdad de maquina: [ENV_SECRET_CONTRACT.json](ENV_SECRET_CONTRACT.json)

## Objetivo
Fijar que variables backend deben tratarse como `required` u `optional` por entorno para que `env_audit.py` deje de reportar todos los faltantes como si tuvieran la misma severidad.

## Alcance
- Este contrato cubre las variables comparadas por `python3 .agent/scripts/env_audit.py --with-supabase --supabase-scope backend-only`.
- `optional` significa una de estas dos cosas:
  - existe fallback seguro en codigo;
  - la variable es feature-gated y no debe bloquear deploy si la feature esta deshabilitada.

## Gate operativo
Comando recomendado para predeploy o auditoria manual:

```bash
npm run ops:env-contract
```

Comportamiento esperado:
- PASS si no faltan variables `required` para `prod`.
- FAIL solo si faltan variables `required`.
- Las `optional` siguen reportandose, pero no bloquean el gate.

## Matriz resumida

| Variable | dev | staging | prod | Nota |
|---|---|---|---|---|
| `SUPABASE_URL` | required | required | required | Base de todos los clientes/backend calls. |
| `SUPABASE_ANON_KEY` | required | required | required | Lecturas anon y contexto auth. |
| `SUPABASE_SERVICE_ROLE_KEY` | required | required | required | Cron jobs, writes internas y smoke tecnico. |
| `ALLOWED_ORIGINS` | optional | required | required | En local hay defaults seguros; en no-local debe fijarse explicitamente. |
| `API_PROVEEDOR_SECRET` | optional | required | required | Requerido para writes y smoke tecnico fuera de local. |
| `GCV_API_KEY` | optional | required | required | Solo mientras OCR GCV siga en scope operativo. |
| `API_PROVEEDOR_READ_MODE` | optional | optional | optional | Default `anon`. |
| `EMAIL_FROM` | optional | optional | optional | Alias legacy de `SMTP_FROM`. |
| `ENVIRONMENT` | optional | optional | optional | Fallback por contexto de despliegue. |
| `INTERNAL_ORIGINS_ALLOWLIST` | optional | optional | optional | Extension del allowlist interno. |
| `LOG_LEVEL` | optional | optional | optional | Default `info`. |
| `NOTIFICATIONS_MODE` | optional | optional | optional | Default `simulation`. |
| `OCR_MIN_SCORE_APPLY` | optional | optional | optional | Default `0.70`. |
| `REQUIRE_ORIGIN` | optional | optional | optional | Default `true`. |
| `SCRAPER_READ_MODE` | optional | optional | optional | Default `anon`. |
| `SENDGRID_API_KEY` | optional | optional | optional | Solo si se activa envio real. |
| `SMTP_HOST` | optional | optional | optional | Solo si email real esta activo. |
| `SMTP_PORT` | optional | optional | optional | Solo si email real esta activo. |
| `SMTP_USER` | optional | optional | optional | Solo si email real esta activo. |
| `SMTP_PASS` | optional | optional | optional | Solo si email real esta activo. |
| `SMTP_FROM` | optional | optional | optional | Solo si email real esta activo. |
| `SLACK_WEBHOOK_URL` | optional | optional | optional | Canal Slack opcional. |
| `TEST_ENVIRONMENT` | optional | optional | optional | Solo `cron-testing-suite`. |
| `TWILIO_ACCOUNT_SID` | optional | optional | optional | Canal SMS opcional. |
| `TWILIO_AUTH_TOKEN` | optional | optional | optional | Canal SMS opcional. |
| `TWILIO_FROM_NUMBER` | optional | optional | optional | Canal SMS opcional. |
| `WEBHOOK_URL` | optional | optional | optional | Canal webhook opcional. |

## Notas de uso
- Si una variable pasa de `optional` a `required`, primero hay que justificarlo con evidencia de codigo o decision vigente.
- Si una feature deja de estar en scope, el contrato debe ajustarse antes de endurecer gates en CI.
- Este contrato clasifica nombres. Nunca almacena valores.
