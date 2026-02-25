# Guia Para Agentes IA (Canonica)

**Proyecto:** Mini Market System
**Ultima actualizacion:** 2026-02-25

## Estado rapido
| Metrica | Valor |
|---|---|
| Veredicto | `GO INCONDICIONAL` |
| Hallazgos abiertos | 0 (11/11 cerrados) |
| Migraciones | 52/52 synced remoto |
| Edge Functions activas | 15 |
| Prompt canonico | 1 |
| Docs markdown en `docs/` | depurado y consolidado |

## Fuente de verdad (orden de prioridad)
1. `docs/ESTADO_ACTUAL.md`
2. `docs/DECISION_LOG.md`
3. `docs/closure/OPEN_ISSUES.md`
4. `docs/METRICS.md`
5. `docs/closure/README_CANONICO.md`
6. `docs/closure/CONTINUIDAD_SESIONES.md`
7. `docs/closure/INFORME_REMEDIACION_FINAL_2026-02-25_041847.md`

## Guardrails no negociables
1. No imprimir secretos/JWTs (solo nombres).
2. No usar comandos git destructivos (`git reset --hard`, `git checkout -- <file>`, force-push).
3. Si se redeploya `api-minimarket`, mantener `--no-verify-jwt`.
4. No cerrar tareas sin evidencia en `docs/closure/` o `test-reports/`.
5. Si un bloqueo depende de tercero/proveedor: marcar `BLOCKED` y continuar.

## Flujo recomendado de sesion
1. ` .agent/scripts/p0.sh session-start "<objetivo>"`
2. ` .agent/scripts/p0.sh extract --with-gates --with-supabase`
3. Ejecutar sobre el prompt canonico unico.
4. ` .agent/scripts/p0.sh session-end`

## Politica documental unica
- Mantener solo documentacion canonica activa + ultimo paquete de auditoria.
- Evitar duplicados de prompts/reportes.
- Registrar limpieza y cambios estructurales en `docs/DECISION_LOG.md`.
