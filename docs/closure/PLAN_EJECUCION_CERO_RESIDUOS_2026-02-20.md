# Plan De Ejecucion Cero-Residuos (Post Cierre UX/Frontend V2)

- Fecha: 2026-02-20
- Estado base: `GO` (D-145)
- Objetivo: detectar y cerrar residuos tecnicos/UX ocultos antes de que afecten operación diaria del dueño.

## 1) Alcance y principio operativo

- Alcance: frontend, edge functions, tests, documentación canónica.
- No alcance: deploys manuales no planificados, cambios de arquitectura grandes.
- Regla: mismo problema, mismo patrón visual/operativo.

## 2) Plan de ejecución (secuencial)

| Fase | Frecuencia | Objetivo | Comandos obligatorios | Criterio de pase |
|---|---|---|---|---|
| F0 Baseline | Al inicio de sesión | Detectar drift de estado | `git status --short`, `node scripts/validate-doc-links.mjs` | Sin links rotos, estado de cambios identificado |
| F1 Gates rápidos | Diario | Detectar regresiones inmediatas | `pnpm -C minimarket-system lint`, `pnpm -C minimarket-system test:components`, `pnpm -C minimarket-system build` | 3/3 PASS |
| F2 Gates profundos | Diario (cierre) | Validar estabilidad funcional | `npm run test:unit`, `npm run test:integration`, `npm run test:e2e` | 3/3 PASS |
| F3 Riesgo oculto | 2 veces por semana | Detectar deuda silenciosa | `npm run test:security`, `npm run test:contracts`, `npm run test:performance` | PASS o `skipped` documentados |
| F4 UX residuales | Diario | Evitar fricción textual/visual | `rg -n "Cargando\\.\\.\\.|Cargando…" minimarket-system/src --glob '!**/*.test.tsx'`, `rg -n "console\\.error" minimarket-system/src/pages minimarket-system/src/components --glob '!**/*.test.tsx'` | 0 matches en carga textual; excepciones de `console.error` justificadas |
| F5 Cierre documental | Al final de sesión | Evitar contradicción docs vs código | actualizar `docs/closure/OPEN_ISSUES.md`, `docs/DECISION_LOG.md`, `docs/ESTADO_ACTUAL.md` | 1 sola versión de verdad y trazabilidad `archivo:linea` |

## 3) Lista de chequeo anti-residuos (obligatoria)

1. Cargas iniciales en rutas críticas sin texto plano de carga.
2. Estados de error con `ErrorMessage` + `requestId` en rutas operativas.
3. Empty states con acción sugerida (no solo texto suelto).
4. Acciones táctiles críticas `>=48px` en móviles.
5. Tipografía de acciones primarias `>=16px`.
6. Navegación de operación diaria en <=2 toques desde dashboard.
7. Pruebas A11y mínimas activas (`vitest-axe`) y en verde.
8. No contradicciones entre `OPEN_ISSUES`, `ESTADO_ACTUAL`, `DECISION_LOG`.
9. No drift de scripts/gates documentados vs ejecutados.
10. Evidencia de cierre guardada en `docs/closure/`.

## 4) Umbrales de escalación

- P0: un gate crítico falla (`lint`, `build`, `unit`, `integration`, `e2e`) -> no cerrar sesión como GO.
- P1: fricción UX en tareas núcleo (vender/stock/pedidos/fiado) -> abrir issue inmediata.
- P2: desalineación docs/código sin impacto runtime -> corregir en la misma sesión.
- P3: cosmético sin impacto operativo -> registrar y calendarizar.

## 5) Evidencia mínima por corrida

Crear/actualizar un reporte con:
- resumen de comandos ejecutados,
- resultados PASS/FAIL,
- hallazgos con `archivo:linea`,
- acciones aplicadas,
- riesgos residuales (si quedan),
- veredicto final (`GO` o `GO condicionado`).

Plantilla recomendada: `docs/closure/VALIDACION_EXHAUSTIVA_CERO_RESIDUOS_YYYY-MM-DD.md`.

## 6) Estado actual y siguientes dos acciones

- Estado actual: residuos UX de carga textual cerrados (D-145).
- Acción 1 (operativa): automatizar en CI el barrido de `Cargando...` en rutas críticas.
- Acción 2 (seguridad): programar smoke real periódico con `RUN_REAL_TESTS=true` y evidencia en `docs/closure/`.
