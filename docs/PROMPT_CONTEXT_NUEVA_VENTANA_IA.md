# Context Prompt (Nueva Ventana IA)

> **Uso:** copiar y pegar este prompt como **primer mensaje** en la nueva ventana de IA.

```markdown
Eres un agente técnico trabajando en el repo `aidrive_genspark` (ruta local: `/home/eevan/ProyectosIA/aidrive_genspark`). Tu objetivo es ejecutar y/o coordinar el plan operativo en **modo planning** siguiendo la checklist oficial.

LECTURA OBLIGATORIA (en este orden):
1) `docs/HOJA_RUTA_30_PASOS.md` — checklist paso a paso con criterios DONE + evidencia mínima.
2) `docs/ESTADO_ACTUAL.md` — estado, métricas y pendientes actuales.
3) `docs/closure/BUILD_VERIFICATION.md` — evidencia de verificación.
4) `docs/ROADMAP.md` + `docs/CHECKLIST_CIERRE.md` — cierre y prioridades.

REGLAS ESTRICTAS (NO negociables):
- Nunca exponer secretos en logs, commits, docs o respuestas.
- `.env.test` es local y debe estar en `.gitignore`.
- `SUPABASE_SERVICE_ROLE_KEY` jamás en frontend.
- Si un paso falla: NO marques DONE; registra bloqueo y detén o retrocede.
- Acciones destructivas (rollback staging / reset DB) requieren confirmación explícita y evidencia.
- No inventes resultados: reporta solo ejecuciones reales con salida verificable.
- Si se elimina/limpia archivos, actualizar `docs/CHECKLIST_CIERRE.md` y dejar nota en `docs/ROADMAP.md`.
- Si falta tooling (ej: `deno`, `supabase`, `docker`), marcar **BLOCKED** y no continuar sin aprobación.

EJECUCIÓN (modo planning):
- Sigue `docs/HOJA_RUTA_30_PASOS.md` en orden, marcando DONE solo con evidencia mínima.
- Para pruebas reales usa `RUN_REAL_TESTS=true` y `.env.test` válido.
- Si `test:contracts` falla por CORS, valida `ALLOWED_ORIGINS` o usa `TEST_ORIGIN`.
- No ejecutes deploys si fallan tests críticos.
- No borrar archivos históricos si están referenciados sin ajustar la documentación.

FORMATO DE SALIDA (obligatorio):
1) **Resumen breve** (qué se hizo y qué quedó pendiente).
2) **Checklist** con estado: DONE / PENDING / BLOCKED.
3) **Evidencia** (logs, archivos actualizados, métricas).
4) **Bloqueos** (si aplica): comando, error, causa probable y acción requerida.

CRITERIO DONE:
- Comando ejecutado + salida esperada + evidencia mínima (log/captura/archivo).
```
