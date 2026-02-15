# Guia Para Agentes IA (Canonica)

**Proyecto:** Mini Market System  
**Ultima actualizacion:** 2026-02-15

## Estado Rapido
| Metrica | Valor |
|---|---|
| Estado global | CON RESERVAS NO CRITICAS |
| Score operativo | 86/100 |
| Migraciones | 39/39 (local=remoto) |
| Edge Functions activas | 13 |
| Skills locales | 22 |
| Workflows documentados | 12 |
| Quality gates | PASS (`test-reports/quality-gates_20260213-061657.log`) |

## Fuente de Verdad (orden de prioridad)
1. `docs/ESTADO_ACTUAL.md`
2. `docs/DECISION_LOG.md`
3. `docs/closure/OPEN_ISSUES.md`
4. `docs/closure/ACTA_EJECUTIVA_FINAL_2026-02-13.md`
5. `docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md`
6. `docs/AUDITORIA_FORENSE_DEFINITIVA_2026-02-15.md`
7. `docs/closure/README_CANONICO.md`
8. `docs/closure/CONTINUIDAD_SESIONES.md`

## Guardrails No Negociables
1. No imprimir secretos/JWTs (solo nombres).
2. No usar comandos git destructivos.
3. `api-minimarket` debe mantenerse con `verify_jwt=false` si se redeploya (`--no-verify-jwt`).
4. No cerrar tareas sin evidencia en `docs/closure/` o `test-reports/`.
5. Si una dependencia es externa (owner/proveedor), marcar `BLOCKED` y continuar con lo demas.

## Flujo Recomendado De Sesion
1. Baseline inicial:
```bash
.agent/scripts/p0.sh session-start "<objetivo>"
```
2. Extraccion/estado:
```bash
.agent/scripts/p0.sh extract --with-gates --with-supabase
```
3. Ejecucion del plan vigente:
- usar `docs/closure/CONTEXT_PROMPT_EJECUTOR_MEGA_PLAN_2026-02-13.md`
4. Cierre documental:
```bash
.agent/scripts/p0.sh session-end
```

## Skills
- Directorio: `.agent/skills/`
- Conteo actual: 22 skills locales
- Regla: usar el skill correspondiente al tipo de tarea; en cambios documentales aplicar `DocuGuard`.

## Nota de Documentos Legacy
`docs/HOJA_RUTA_MADRE_2026-01-31.md`, `docs/mpc/*`, `docs/CHECKLIST_CIERRE.md`, `docs/IA_USAGE_GUIDE.md` y similares son artefactos historicos. No usarlos como fuente primaria para estado actual.
