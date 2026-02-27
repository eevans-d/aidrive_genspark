# Guia Para Agentes IA (Canonica)

**Proyecto:** Mini Market System
**Ultima actualizacion:** 2026-02-27

## Estado rapido
| Metrica | Valor |
|---|---|
| Veredicto global | `GO INCONDICIONAL` |
| Estado OCR facturas | `BACKLOG ABIERTO PRIORIZADO` |
| Tests unitarios | `1733/1733 PASS` |
| Migraciones SQL | `52` |
| Edge Functions activas en repo | `15` |
| Skills en `.agent/skills` | `22` |

## Fuente de verdad (orden)
1. `docs/ESTADO_ACTUAL.md`
2. `docs/DECISION_LOG.md`
3. `docs/closure/OPEN_ISSUES.md`
4. `docs/API_README.md`
5. `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
6. `docs/METRICS.md`
7. `docs/PLAN_FUSIONADO_FACTURAS_OCR.md` (roadmap OCR)

## Guardrails no negociables
1. No imprimir secretos/JWTs (solo nombres).
2. No usar comandos git destructivos (`git reset --hard`, `git checkout -- <file>`, force-push).
3. Si se redeploya `api-minimarket`, mantener `--no-verify-jwt`.
4. No cerrar tareas sin evidencia en `docs/closure/` o `test-reports/`.
5. Si un bloqueo depende de tercero/proveedor: marcar `BLOCKED` y continuar.

## Flujo recomendado de sesion
1. `.agent/scripts/p0.sh session-start "<objetivo>"`
2. `.agent/scripts/p0.sh extract --with-gates --with-supabase`
3. Ejecutar cambios + evidencia
4. `.agent/scripts/p0.sh session-end`

## Politica documental
- Mantener una sola fuente activa por tema.
- No eliminar docs historicos sin decision explicita: marcar `[DEPRECADO: YYYY-MM-DD]`.
- Registrar cambios de criterio en `docs/DECISION_LOG.md`.
