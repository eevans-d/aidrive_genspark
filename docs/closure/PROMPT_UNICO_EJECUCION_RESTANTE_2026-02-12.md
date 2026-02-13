# Prompt Único - Cierre Final a Producción Piloto (2026-02-12)

Usa este prompt tal cual en una nueva ventana de chat para ejecutar TODO lo pendiente (real) sin que el usuario tenga que enviar prompts adicionales.

```text
Contexto operativo
- Repo: /home/eevan/ProyectosIA/aidrive_genspark
- Fecha de referencia: 2026-02-12
- Estado actual: CON RESERVAS (defendible para producción piloto)
- Fuente canónica de trabajo (NO inventar): 
  - docs/ESTADO_ACTUAL.md
  - docs/closure/OPEN_ISSUES.md
  - docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md
- Estado base ya verificado (evidencia en docs/closure):
  - Migraciones local/remoto: 38/38
  - Edge Functions activas: 13 (api-minimarket v21 verify_jwt=false)
  - Mini-plan hardening 5/5 cerrado (scripts/verify_5steps.sh PASS)
  - Gate 3/4/15/18 cerrados con evidencia; Gate 16 PARCIAL por DSN Sentry pendiente del owner

Objetivo obligatorio
Cerrar end-to-end TODO lo que siga realmente pendiente para pasar de "CON RESERVAS" a "LISTO" (o dejarlo explícitamente BLOCKED por dependencias externas).

Guardrails obligatorios
1. NO imprimir secretos/JWTs (solo nombres de variables).
2. NO usar comandos git destructivos.
3. api-minimarket debe permanecer verify_jwt=false (si redeploy, usar --no-verify-jwt).
4. No usar `--no-verify-jwt` en otras Edge Functions (ej. `cron-notifications`, `cron-testing-suite`): deben permanecer con `verify_jwt=true`.
5. NO revertir cambios no relacionados.
6. Toda afirmación debe tener evidencia concreta (ruta + comando + resultado).
7. No pedir confirmación intermedia: ejecutar en cadena, pausar solo ante blocker real externo.

Regla de autonomía
- Debes ejecutar paso por paso y resolver blockers por cuenta propia.
- Si un paso depende de acceso externo (ej. DSN Sentry, credenciales proveedor), clasificar como BLOCKED con checklist exacta para owner y continuar con el siguiente paso.
- No detener la sesión hasta cerrar todos los pasos posibles y actualizar docs canónicas.

Plan de ejecución detallado

PASO 1 - RealityCheck + QA rápido (revalidación local)
Ejecuta y registra resultados:
- bash scripts/verify_5steps.sh
- supabase migration list --linked
- supabase functions list --project-ref dqaygmjpzoqjjrywdsxi
- npm run test:unit
- npm run test:security
- pnpm -C minimarket-system lint
- pnpm -C minimarket-system build
- (E2E POS) cd minimarket-system && npx playwright test e2e/pos.e2e.spec.ts --reporter=list

PASO 2 - Gate 16 (Monitoreo real - Sentry)
1) Verificar en código que Sentry está integrado de forma condicional:
   - minimarket-system/src/main.tsx
   - minimarket-system/src/lib/observability.ts
2) Determinar si el owner ya configuró DSN:
   - Si NO hay DSN disponible: marcar BLOCKED y dejar checklist exacta para owner.
   - Si SÍ hay DSN disponible: ejecutar un smoke test que genere un evento real y confirmar aparición en Sentry.
3) Actualizar/crear evidencia:
   - docs/closure/EVIDENCIA_GATE16_YYYY-MM-DD.md
   - (sin pegar DSN ni tokens)

Checklist exacta para owner (si Gate 16 queda BLOCKED)
1) Crear cuenta Sentry (plan free sirve).
2) Crear proyecto React.
3) Obtener DSN.
4) Configurar `VITE_SENTRY_DSN` en el entorno de despliegue (ej. Vercel) y redeploy.
5) Confirmar evento: provocar un error controlado y verificar que aparece en Sentry.

PASO 3 - Activación backup/restore (si aún no está activado)
1) Confirmar que existe `.github/workflows/backup.yml` y scripts:
   - scripts/db-backup.sh
   - scripts/db-restore-drill.sh
2) Si hay acceso a GitHub:
   - Confirmar secret `SUPABASE_DB_URL` configurado (solo nombre, nunca valor).
   - Ejecutar workflow "Scheduled Database Backup" (manual).
   - Confirmar artifact creado y retención.
3) Validar restore drill contra DB staging (requiere `SUPABASE_DB_URL` staging):
   - RESTORE_CONFIRMED=yes ./scripts/db-restore-drill.sh <backup.sql.gz>
4) Si no hay acceso a GitHub o falta secret: marcar como OWNER ACTION REQUIRED con checklist.

PASO 4 - DocuGuard (cierre canónico)
Actualizar SIEMPRE:
- docs/ESTADO_ACTUAL.md
- docs/closure/OPEN_ISSUES.md
- docs/DECISION_LOG.md
- docs/REALITY_CHECK_UX.md (si cambian clasificaciones REAL/A_CREAR)

Veredicto final requerido
- LISTO: Gate 16 cerrado con evidencia (evento real en Sentry confirmado).
- CON RESERVAS: Gate 16 sigue BLOCKED por DSN (owner).

Comandos base sugeridos (ejecutar y adaptar según cambios)
- npm run test:unit
- npm run test:security
- pnpm -C minimarket-system lint
- pnpm -C minimarket-system build
- bash scripts/verify_5steps.sh

Formato de entrega final (obligatorio)
1) Resumen por paso (QA rápido + Gate 16 + Backups + DocuGuard) con estado: PASS / PARCIAL / BLOCKED / FAIL.
2) Archivos modificados por paso.
3) Comandos ejecutados y resultado.
4) Evidencias creadas en docs/closure.
5) Riesgos residuales.
6) Próximos pasos exactos para lo que quede BLOCKED.
7) Confirmación explícita de si el sistema pasa o no a estado defendible para producción.
```
