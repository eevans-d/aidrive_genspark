# IA Usage Guide

**Estado:** EN DESARROLLO  
**Última actualización:** 2026-02-02  

## Objetivo
Documentar **cómo se usa IA en este repositorio**, con evidencia y controles de revisión humana.

## Evidencias disponibles (fuentes en repo)
- `docs/AGENTS.md` (guía rápida y roles de agentes IA).  
- `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` (ejecución documentada por GitHub Copilot MCP).  
- `docs/ESTADO_ACTUAL.md` (menciones de ejecuciones por Copilot/COMET).  

## Herramientas IA documentadas
| Herramienta | Evidencia | Estado |
|-------------|-----------|--------|
| GitHub Copilot (modo agente) | `docs/ESTADO_ACTUAL.md` | Documentada |
| GitHub Copilot (MCP Supabase) | `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` | Documentada |
| Otras herramientas (OpenAI, Claude, etc.) | NO ENCONTRADO | PENDIENTE |

## Checklist de revisión humana (obligatorio)
1) Verificar **auth/roles** en frontend y edge functions (`AuthContext`, helpers/auth).  
2) Revisar **RLS / migrations** y grants en `supabase/migrations/`.  
3) Confirmar **CORS y rate limiting** en `_shared/` y funciones críticas.  
4) Validar **handling de errores** y propagación de requestId.  
5) Re-ejecutar **tests/linters/build** antes de merge.  
6) Verificar que **no se expongan secretos** ni valores reales en docs/logs.  

## Registro recomendado (para nuevas sesiones)
Cuando se use IA en tareas relevantes:
- Registrar fecha, objetivo y herramientas en `docs/ESTADO_ACTUAL.md`.  
- Adjuntar evidencia (ruta + archivo/log).  
- Si hay cambios, actualizar `docs/closure/PROJECT_CLOSURE_REPORT.md` y `docs/closure/BUILD_VERIFICATION.md`.  

## Notas
Si se incorpora una nueva herramienta IA, agregar evidencia y actualizar esta guía.
