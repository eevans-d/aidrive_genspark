# VERIFICACION_[ETAPA]_[FASE]_[FECHA].md

Plantilla para registrar la verificación de una fase/WS. Úsala para Capa 3 (ejecución) y enlázala desde `docs/CHECKLIST_CIERRE.md`.

## 1. Datos de la fase
- **Etapa/Fase:** [E#/F#.#]
- **Workstream:** [WS#.#]
- **Owner:** [Rol/Persona]
- **Fecha:** [YYYY-MM-DD]
- **Contexto:** [Resumen breve de qué se verificó]

## 2. Alcance y criterios de aceptación
- **Objetivo de la fase:** [Texto]
- **Criterios de aceptación:**  
  - [ ] Criterio 1  
  - [ ] Criterio 2  
  - [ ] Criterio 3  
- **Dependencias:** [scripts/archivos/env vars]

## 3. Verificaciones ejecutadas
- **Unidad/Componente:**  
  - Pasos: [ ] …  
  - Resultado: ✅/⚠️/❌  
- **Integración:**  
  - Pasos: [ ] …  
  - Resultado: ✅/⚠️/❌  
- **E2E/Manual (si aplica):**  
  - Pasos: [ ] …  
  - Resultado: ✅/⚠️/❌  

## 4. Evidencia
- Logs/comandos: [Referencias a archivos, snippets o hashes]
- Capturas/artefactos: [Paths en repo o links]
- Métricas/queries: [Resultados relevantes]

## 5. Hallazgos y acciones
- Hallazgos:  
  - [ID] Descripción — Severidad (P0/P1/P2/P3)
- Acciones correctivas:  
  - [ ] Acción 1 (Owner, ETA)

## 6. Rollback / Contingencia
- ¿Se requirió rollback? Sí/No  
- Pasos ejecutados (si aplica): [Detalle]  
- Estado final tras rollback: [Texto]

## 7. Decisión
- Resultado fase: ✅ PASS / ⚠️ PASS WITH CONDITIONS / ❌ FAIL  
- Notas finales: [Texto]

## 8. Actualizaciones de trazabilidad
- CHECKLIST_CIERRE: [Sección/ítem actualizado]
- DECISION_LOG (si hubo decisiones): [ID/nota]
- ROADMAP/PLAN_WS_DETALLADO (si cambia alcance): [Descripción]
