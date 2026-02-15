> [DEPRECADO: 2026-02-13] Documento histórico de contexto/snapshot. Usar solo para trazabilidad. Fuente vigente: `docs/ESTADO_ACTUAL.md` + `docs/closure/README_CANONICO.md`.

# Prompts Paralelos (Canónico) — Cierre de Gates Pendientes

> Fecha de actualización: 2026-02-11
> Fuente de verdad: `docs/closure/CONTEXTO_CANONICO_AUDITORIA_2026-02-11.md`

Usar estos prompts para ejecutar en paralelo solo lo pendiente de cierre Piloto.

Reglas globales:
- No imprimir secretos/JWTs, solo nombres.
- No usar comandos git destructivos.
- Si se redeploya `api-minimarket`: usar `--no-verify-jwt`.
- Salida obligatoria por prompt: `Estado`, `Evidencia`, `Archivos tocados`, `Gate impactado`.

---

## P1 — Gate 3 (E2E POS completo)

```text
Actúa como QA engineer en /home/eevan/ProyectosIA/aidrive_genspark.

Objetivo:
Cerrar Gate 3 con evidencia E2E real de venta POS.

Tareas:
1) Ejecutar flujo end-to-end: cargar productos -> agregar carrito -> cobrar -> confirmar impacto en stock/kardex.
2) Registrar comandos y resultados reproducibles.
3) Si falla, clasificar causa exacta (datos, credenciales, runtime, lógica) y dejar fix mínimo o bloqueo explícito.
4) Actualizar:
   - docs/audit/EVIDENCIA_SP-B.md
   - docs/audit/EVIDENCIA_SP-OMEGA.md
   - docs/closure/OPEN_ISSUES.md

Criterio de cierre:
- Gate 3 en PASS o PARCIAL justificado con evidencia real, sin ambigüedad.
```

---

## P2 — Gate 4 (canal real alertas operador)

```text
Actúa como backend/ops engineer en /home/eevan/ProyectosIA/aidrive_genspark.

Objetivo:
Cerrar el gap final de Gate 4: alerta de stock bajo debe llegar al operador por canal real.

Tareas:
1) Mantener cron runtime (Vault) y agregar canal operativo (email/push/dashboard actionable).
2) Ejecutar prueba de punta a punta y capturar evidencia de recepción.
3) Documentar fallback si canal externo falla.
4) Actualizar:
   - docs/audit/EVIDENCIA_SP-E.md
   - docs/audit/EVIDENCIA_SP-OMEGA.md
   - docs/ESTADO_ACTUAL.md

Criterio de cierre:
- Evidencia de recepción real por parte del operador y estado defendible de Gate 4.
```

---

## P3 — Gate 16 (monitoreo real)

```text
Actúa como observability engineer en /home/eevan/ProyectosIA/aidrive_genspark.

Objetivo:
Pasar Gate 16 de FAIL a estado defendible con monitoreo real.

Tareas:
1) Activar Sentry solo si existe DSN real (no mocks falsos).
2) Configurar monitoreo externo para /health con alerting.
3) Definir runbook mínimo de incidentes (owner, severidad, acción inicial).
4) Actualizar:
   - docs/audit/EVIDENCIA_SP-E.md
   - docs/audit/EVIDENCIA_SP-OMEGA.md
   - docs/OPERATIONS_RUNBOOK.md

Criterio de cierre:
- Gate 16 en PASS o PARCIAL justificado con evidencia operativa concreta.
```

---

## P4 — Gate 18 (CI legacy endurecido)

```text
Actúa como CI engineer en /home/eevan/ProyectosIA/aidrive_genspark.

Objetivo:
Endurecer Gate 18 para que legacy suites no queden como check decorativo.

Tareas:
1) Revisar job legacy actual y definir política verificable (manual/scheduled con criterio de aprobación claro).
2) Ejecutar al menos una suite legacy y registrar resultado reproducible.
3) Si no se puede endurecer aún, documentar exclusión formal con owner + fecha de activación.
4) Actualizar:
   - docs/audit/EVIDENCIA_SP-E.md
   - docs/audit/EVIDENCIA_SP-OMEGA.md
   - docs/closure/OPEN_ISSUES.md

Criterio de cierre:
- Gate 18 reclasificado con evidencia trazable y política CI explícita.
```
