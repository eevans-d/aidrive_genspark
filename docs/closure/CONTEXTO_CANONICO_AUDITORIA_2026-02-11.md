# Contexto Canónico de Auditoría (2026-02-11)

> Documento de arranque recomendado para nuevas sesiones con agentes.
> Fuente consolidada de estado real post-ejecución Copilot + Antigravity + Codex.

---

## 1) Estado real actual

- Proyecto: `aidrive_genspark` (React/Vite/TS + Supabase Edge Functions/Deno + PostgreSQL).
- Veredicto global: **NO LISTO (Piloto)** por gates obligatorios aún en `PARCIAL`.
- Snapshot gates (SP-Ω consolidado):
  - `✅ 5/18`
  - `⚠️ 10/18`
  - `❌ 3/18`
- Piloto (gates obligatorios):
  - `✅ 5/9`
  - `⚠️ 4/9`

### Hechos verificados en remoto (2026-02-11)

- Migraciones sincronizadas: `36/36` (`supabase migration list --linked`).
- `20260211100000_audit_rls_new_tables.sql` aplicada en remoto.
- CORS productivo corregido:
  - origin permitido (`https://aidrive-genspark.vercel.app`) -> `HTTP 200` + ACAO correcto.
  - origin no permitido -> `HTTP 403` + ACAO `null`.
- 13 Edge Functions en estado `ACTIVE`.
- Cron auth vía Vault aplicado (`20260211055140`, `20260211062617`).

---

## 2) Gates pendientes críticos

1. **Gate 3 (PARCIAL)**
- Falta evidencia E2E funcional completa de POS (no solo build/lint + UX).

2. **Gate 4 (PARCIAL)**
- Runtime cron mejoró, pero falta canal real de alerta al operador (push/email/dashboard actionable).

3. **Gate 16 (FALLA)**
- Monitoreo real no activo (Sentry bloqueado por DSN; sin canal de alerta operativo).

4. **Gate 18 (PARCIAL)**
- Legacy suites en CI existen como opcionales con `continue-on-error`; falta endurecimiento como gate efectivo.

---

## 3) Guardrails no negociables

- No exponer secretos/JWTs (solo nombres).
- No usar comandos destructivos de git.
- `api-minimarket` debe mantenerse con `verify_jwt=false`.
- Si se redeploya `api-minimarket`, usar siempre `--no-verify-jwt`.

---

## 4) Archivos clave a leer primero

1. `docs/ESTADO_ACTUAL.md`
2. `docs/audit/EVIDENCIA_SP-OMEGA.md`
3. `docs/audit/EVIDENCIA_SP-E.md`
4. `docs/audit/EXECUTION_LOG_AUDITORIA_2026-02-10.md` (ver último addendum)
5. `docs/closure/OPEN_ISSUES.md`
6. `docs/closure/PROMPTS_PARALELOS_COPILOT_ANTIGRAVITY_2026-02-11.md` (para ejecución delegada)

---

## 5) Comandos de verificación rápida

```bash
# Estado migraciones
supabase migration list --linked

# Estado funciones
supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output pretty

# Frontend quality
pnpm -C minimarket-system lint
pnpm -C minimarket-system build

# CORS productivo
bash scripts/verify-cors.sh
```

---

## 6) Definición de Done para siguiente sesión

Para pasar de `NO LISTO (Piloto)` a estado defendible:

1. Gate 3: evidencia E2E POS completa y reproducible.
2. Gate 4: canal real de alertas de stock bajo activo y probado.
3. Gate 16: monitoreo real activo (Sentry con DSN real + alerting).
4. Gate 18: legacy tests con política CI verificable (no solo opcional tolerante).
