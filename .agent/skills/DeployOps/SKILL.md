---
name: DeployOps
description: Standardized procedures for secure deployment and environment management in aidrive_genspark.
---

# DeployOps Skill (Universal Standard)

## 1. Objetivo
Gestionar el ciclo de vida de despliegue (dev, staging, prod) asegurando que **código inseguro nunca llegue a producción**. Implementa protocolos de "Iron-Clad Security".

## 2. Configuración del Proyecto
**⚠️ OBLIGATORIO:** Antes de ejecutar, lee `.agent/skills/project_config.yaml` para obtener las rutas exactas.
*   **Script de Deploy:** Ver clave `scripts.deploy_script` (Default: `./deploy.sh`)
*   **Logs:** Ver clave `outputs.deploy_log` (Default: `logs/deployment-*.json`)
*   **Políticas:** Ver clave `policies` para ramas permitidas.

## 3. Criterios de Activación (Usar cuando...)
*   Has completado una feature y necesitas subirla a `staging`.
*   Has verificado una release en `staging` y necesitas promoverla a `production`.
*   Necesitas rotar secretos/variables de entorno.
*   Necesitas ejecutar un rollback de emergencia.

## 4. Criterios de NO uso (No usar cuando...)
*   Tests fallan (ejecuta `TestMaster` primero).
*   No estás en una rama permitida (ver `config.policies.allowed_branches`).
*   No hay cambios que desplegar (repo limpio sin commits nuevos).

## 5. Inputs Requeridos
1.  **Environment:** `dev`, `staging`, `production`.
2.  **Commit SHA:** Hash corto del commit a desplegar (para trazabilidad).
3.  **Mode:** `dry_run` (simulación) o `execute` (real).
4.  **Confirmación:** Explícita para producción.

## 6. Protocolo de Ejecución
1.  **Check Branch:** Valida que estés en la rama correcta (`main` o `staging`).
2.  **Pre-Flight Check (TestMaster):** Ejecuta `TestMaster` en modo "Green Check".
3.  **Dry Run (OBLIGATORIO en Prod):**
    ```bash
    # Args: Env, BuildID, CommitSHA, DryRun, Force
    {{scripts.deploy_script}} <ENV> $(date +%s) $(git rev-parse --short HEAD) true false
    ```
4.  **Review Plan:** Analiza la salida del dry-run. ¿Se van a tocar migraciones peligrosas?
5.  **Execute:**
    ```bash
    {{scripts.deploy_script}} <ENV>
    ```
6.  **Verify:** Revisa `gcloud run services list` y haz un smoke test con curl.

## 7. Quality Gates (DONE Verificable)
*   [ ] **Tests Passed:** `TestMaster` pasó 100% antes del deploy.
*   [ ] **Dry Run OK:** La simulación no mostró errores.
*   [ ] **Health Check:** El servicio responde 200 OK después del deploy.
*   [ ] **Logs Clean:** No hay errores FATAL en los logs de arranque.

## 8. Anti-Loop / Stop-Conditions
*   **Retry Max:** `{{policies.retry_max}}` intentos.
*   **Error Handling:**
    *   Si falla el build -> **STOP**, revisa logs de npm.
    *   Si falla el deploy (Cloud Run) -> **STOP**, ejecuta Rollback manual.
    *   Si el script pide input y no puedes dárselo -> **STOP**.

### Plantilla REPORTE DE BLOQUEO
> **BLOQUEO DEPLOYOPS**
> * **Target Env:** [ENV]
> * **Fase:** [Build/Deploy/Verify]
> * **Error:** [PEGA EL ERROR]
> * **Estado del Servicio:** [Activo/Caído]
> * **Acción Tomada:** [Rollback/Nada]

## 9. Salida Requerida (Artefactos)
*   Log de despliegue: `{{outputs.deploy_log}}`
*   URL del servicio activo.
*   Confirmación de Health Check exitoso.

## 10. Emergency Rollback (Nivel 3)
En caso de desastre, ejecuta **INMEDIATAMENTE**:
1.  **Git Revert:** `git revert HEAD` + `git push`.
2.  **Cloud Run Rollback:**
    ```bash
    gcloud run services update-traffic <SERVICE> --to-revisions=<PREV>=100
    ```
