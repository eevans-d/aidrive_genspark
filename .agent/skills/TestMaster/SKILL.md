---
name: TestMaster
description: Standardized procedures for executing, analyzing, and maintaining tests in the aidrive_genspark project.
---

# TestMaster Skill (Universal Standard)

## 1. Objetivo
Centralizar y verificar la calidad del código mediante la ejecución controlada de pruebas (Unit, Integration, E2E, Security), asegurando que ningún cambio rompa la funcionalidad existente.

## 2. Configuración del Proyecto
**⚠️ OBLIGATORIO:** Antes de ejecutar, lee `.agent/skills/project_config.yaml` para obtener las rutas exactas.
*   **Script de Test:** Ver clave `scripts.test_script` (Default: `./test.sh`)
*   **Reporte de Salida:** Ver clave `outputs.test_report` (Default: `test-reports/test-summary.json`)
*   **Políticas:** Ver clave `policies.retry_max` (Default: 2)

## 3. Criterios de Activación (Usar cuando...)
*   Has modificado código fuente (`src/`, `supabase/functions/`).
*   Necesitas verificar si una funcionalidad sigue funcionando (Regression Testing).
*   Antes de cualquier operación de `DeployOps`.
*   Necesitas depurar un error reportado.

## 4. Criterios de NO uso (No usar cuando...)
*   Solo has modificado documentación (`docs/`, `*.md`).
*   Necesitas validar sintaxis simple (usa `npm run lint` o el linter del IDE).
*   No tienes entorno de ejecución (ej: Docker caído) -> Primero repara el entorno.

## 5. Inputs Requeridos
1.  **Scope/Type:** ¿Qué vas a probar? (`unit`, `integration`, `all`, `security`, `ui`).
2.  **Target File (Opcional):** Ruta absoluta si es una prueba enfocada.
3.  **Flags:** `coverage` (bool), `verbose` (bool).

## 6. Protocolo de Ejecución
1.  **Check Environment:** Verifica que el entorno esté listo (ej: Docker para tests de integración).
2.  **Select Command:**
    *   *Standard:* `{{scripts.test_script}} unit false false true` (Unitarios rápidos)
    *   *Green Check:* `{{scripts.test_script}} unit && {{scripts.test_script}} integration`
    *   *Debug Single File:* `npx vitest run <Target File>`
3.  **Execute:** Corre el comando seleccionado.
4.  **Analyze Report:** Lee `test-reports/test-summary.json` o la salida estándar.

## 7. Quality Gates (DONE Verificable)
*   [ ] **Exit Code 0:** El comando terminó exitosamente.
*   [ ] **Pass Rate:** 100% de los tests ejecutados pasaron.
*   [ ] **Coverage (si aplica):** > `{{policies.coverage_min}}%` en código nuevo.
*   [ ] **No Regressions:** Funcionalidades no relacionadas no se vieron afectadas.

## 8. Anti-Loop / Stop-Conditions
*   **Retry Max:** `{{policies.retry_max}}` intentos.
*   **Error Handling:**
    *   Si fallo es "Command not found" -> Instala deps (`npm install`).
    *   Si fallo es "Connection refused" -> Levanta Docker.
    *   Si falla 2 veces -> **STOP** y genera REPORTE DE BLOQUEO.

### Plantilla REPORTE DE BLOQUEO
> **BLOQUEO TESTMASTER**
> * **Intenté:** Ejecutar [COMANDO]
> * **Error:** [PEGA EL ERROR AQUÍ]
> * **Causa:** [TU ANÁLISIS]
> * **Fix Sugerido:** [TU SUGERENCIA]

## 9. Salida Requerida (Artefactos)
*   Archivo JSON de reporte: `{{outputs.test_report}}`
*   Logs en terminal confirmando "PASS".
