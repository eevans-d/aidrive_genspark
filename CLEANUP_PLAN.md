# PLAN DE LIMPIEZA Y OPTIMIZACIÓN DEL REPOSITORIO

**Fecha:** October 18, 2025 - 02:30 UTC  
**Objetivo:** Reducir confusión, eliminar duplicados y archivos obsoletos

---

## 📊 ANÁLISIS INICIAL

### Estadísticas Actuales
- **124** archivos .md en root (demasiados)
- **4** archivos Zone.Identifier (metadata Windows)
- **10** archivos .log en root
- **3** archivos ABC_EXECUTION_STATUS*
- **5** archivos CONTINUAR_MANANA*

### Problemas Identificados
1. ❌ Múltiples archivos de estado de sesiones antiguas
2. ❌ Documentos "CONTINUAR_MANANA" obsoletos (ya continuamos)
3. ❌ Análisis duplicados/fragmentados
4. ❌ Logs de ejecución antiguos mezclados con documentación
5. ❌ Metadata de Windows innecesaria
6. ❌ Múltiples versiones de documentación similar

---

## 🎯 ESTRATEGIA DE LIMPIEZA

### PRESERVAR (Documentación Crítica)
✅ `AUDITORIA_PRE_DESPLIEGUE/` - Auditoría actual (5 reportes + plan OPCIÓN C)
✅ `ESTADO_ACTUAL.md` - Estado consolidado
✅ `CHANGELOG.md` - Historial de cambios
✅ `README*.md` - Documentación de deployment
✅ `RUNBOOK_*.md` - Runbooks operacionales
✅ `ESPECIFICACION_TECNICA.md` - Specs actualizadas
✅ `DOCUMENTACION_MAESTRA_MINI_MARKET.md` - Doc maestra consolidada
✅ Código fuente (`inventario-retail/`, `app/`, `tests/`)
✅ Configuraciones de producción

### MOVER A ARCHIVO (Histórico)
📦 Crear carpeta `archive/` para:
- Archivos de sesión antiguos (ABC_EXECUTION, CONTINUAR_MANANA)
- Análisis antiguos pre-auditoría
- Logs de ejecución de tracks
- Documentos de etapas completadas
- Checkings antiguos
- Planes obsoletos

### ELIMINAR (Sin valor)
🗑️ Borrar permanentemente:
- `*:Zone.Identifier` - Metadata Windows
- Scripts de análisis temporales (`.js` de análisis)
- Archivos de backup duplicados
- Documentación fragmentada reemplazada por maestra

---

## 📋 CATEGORÍAS DE LIMPIEZA

### CATEGORÍA 1: Archivos de Sesión Antiguos → ARCHIVAR
```
ABC_EXECUTION_STATUS_LIVE.md
ABC_EXECUTION_STATUS_SESSION2.md
ABC_EXECUTION_STATUS_SESSION2_LIVE.md
ABC_LIVE_MONITOR_SESSION2.sh
CONTINUAR_MANANA.md
CONTINUAR_MANANA_OCT17.md
CONTINUAR_MANANA_OCT18.md
CONTINUAR_MANANA_OCT5.md
CONTINUAR_MANANA_OCT8.md
```
**Razón:** Sesiones completadas, reemplazadas por AUDITORIA_PRE_DESPLIEGUE/

### CATEGORÍA 2: Metadata Windows → ELIMINAR
```
archive(1) (1).zip:Zone.Identifier
archive(3).zip:Zone.Identifier
Doc-2 logica y gestion nego..docx:Zone.Identifier
Doc1 logica y gestion nego..docx:Zone.Identifier
```
**Razón:** Metadata sin valor en Linux, no afecta funcionalidad

### CATEGORÍA 3: Logs de Ejecución → ARCHIVAR
```
TRACK_B1_EXECUTION.log
TRACK_B2_EXECUTION.log
TRACK_C2_EXECUTION.log
TRACK_C3_EXECUTION.log
TRACK_C4_EXECUTION.log
TRACK_A3_EXECUTION.log
(y otros logs de tracks)
```
**Razón:** Tracks completados exitosamente, logs históricos

### CATEGORÍA 4: Análisis Fragmentados → CONSOLIDAR/ARCHIVAR
```
ANALISIS_PROYECTO.md
ANALISIS_TECNICO_RETAIL_ARGENTINA.md
ANALISIS_OPTIMIZACIONES_REPOSITORIO.md
ANALISIS_PAUSA_AFIP_ENTERPRISE.md
ANALISIS_PROGRESO_PRODUCCION.md
ANALISIS_R5_R7_APLICABILIDAD.md
EJEMPLO_ANALISIS_*.md (múltiples)
```
**Razón:** Análisis pre-auditoría, consolidados en FASE_0_BASELINE.md

### CATEGORÍA 5: Documentación Fragmentada → CONSOLIDAR
```
DOCUMENTACION_API_DASHBOARD.md
DOCUMENTACION_CI_CD.md
DOCUMENTACION_DASHBOARD_WEB_COMPLETO.md
DOCUMENTACION_DESPLIEGUE_DASHBOARD.md
DOCUMENTACION_OBSERVABILIDAD.md
```
**Razón:** Consolidar en DOCUMENTACION_MAESTRA_MINI_MARKET.md

### CATEGORÍA 6: Checklists/Planes Completados → ARCHIVAR
```
CHECKLIST_DEPLOYMENT_COMPLETO.md
CHECKLIST_FASE1_ETAPA3.md
CHECKLIST_STAGING_DEPLOYMENT_V0.10.0.md
CI_CD_ENHANCEMENT_PLAN.md
ETAPA2_*.md (múltiples)
ETAPA3_*.md (múltiples)
```
**Razón:** Etapas completadas, reemplazadas por auditoría actual

### CATEGORÍA 7: Auditorías Antiguas → ARCHIVAR
```
AUDITORIA_AGENTE_NEGOCIO.md
AUDITORIA_COMPLIANCE.md
AUDITORIA_INTEGRACIONES.md
AUDITORIA_SCHEDULERS.md
DICTAMEN_AUDITORIA_APLICADO_2025-09-13.md
```
**Razón:** Auditorías pre-deployment, consolidadas en FASE_1 y FASE_5

### CATEGORÍA 8: Configuraciones Antiguas → ARCHIVAR
```
CONFIGURACIONES_PRODUCCION_BI_ORCHESTRATOR.md
CONFIGURACIONES_PRODUCCION_INVENTARIO_RETAIL.md
```
**Razón:** Configuraciones históricas, actuales en archivos de config

### CATEGORÍA 9: Scripts Temporales → ELIMINAR
```
analyze_specific_project.js
create_clean_spec.js
backup_minimarket.sh (si obsoleto)
```
**Razón:** Scripts de análisis temporal, ya no necesarios

### CATEGORÍA 10: Opciones/Continuaciones Antiguas → ARCHIVAR
```
CONTINUACION_OPCIONES_OCT18.md
deployment_basic_report.json
aidrive_genspark_analysis.json
```
**Razón:** Decisiones tomadas, documentadas en OPCION_C_IMPLEMENTATION_PLAN.md

---

## 🚀 PLAN DE EJECUCIÓN

### FASE 1: Crear Estructura de Archivo (5 min)
```bash
mkdir -p archive/{session_logs,old_analysis,old_checklists,old_audits,old_docs,old_configs,execution_logs}
```

### FASE 2: Mover Archivos a Archivo (10 min)
- Mover archivos de sesión a `archive/session_logs/`
- Mover logs de ejecución a `archive/execution_logs/`
- Mover análisis antiguos a `archive/old_analysis/`
- Mover checklists completados a `archive/old_checklists/`
- Mover auditorías antiguas a `archive/old_audits/`
- Mover documentación fragmentada a `archive/old_docs/`
- Mover configuraciones antiguas a `archive/old_configs/`

### FASE 3: Eliminar Archivos Sin Valor (2 min)
- Eliminar `*:Zone.Identifier`
- Eliminar scripts temporales `.js`
- Eliminar archivos de análisis `.json` obsoletos

### FASE 4: Consolidar Documentación (15 min)
- Verificar que DOCUMENTACION_MAESTRA contenga info de docs fragmentadas
- Crear índice en README principal
- Actualizar referencias en archivos que apunten a docs movidas

### FASE 5: Crear Registro y Commit (5 min)
- Generar `CLEANUP_REGISTRY.md` con lo eliminado/movido
- Commit con mensaje descriptivo
- Push a feature/resilience-hardening

---

## 📈 RESULTADOS ESPERADOS

### Antes
- 124 archivos .md en root
- Confusión por múltiples versiones
- Difícil encontrar documentación actual

### Después
- ~30-40 archivos .md en root (documentación crítica)
- Estructura clara y organizada
- Fácil navegación
- Archivo histórico preservado en `archive/`

### Reducción Estimada
- **-70% archivos en root** (~90 archivos movidos/eliminados)
- **-100% metadata Windows** (4 archivos eliminados)
- **-100% logs en root** (10 archivos movidos)
- **+100% claridad** en estructura

---

## ✅ CHECKLIST DE EJECUCIÓN

- [ ] Crear estructura `archive/` con subcarpetas
- [ ] Mover archivos de sesión (9 archivos)
- [ ] Mover logs de ejecución (10+ archivos)
- [ ] Mover análisis antiguos (15+ archivos)
- [ ] Mover checklists completados (10+ archivos)
- [ ] Mover auditorías antiguas (5+ archivos)
- [ ] Mover documentación fragmentada (5+ archivos)
- [ ] Mover configuraciones antiguas (2+ archivos)
- [ ] Eliminar Zone.Identifier (4 archivos)
- [ ] Eliminar scripts temporales (2+ archivos)
- [ ] Crear CLEANUP_REGISTRY.md
- [ ] Actualizar README con nueva estructura
- [ ] Commit y push cambios
- [ ] Verificar que nada crítico fue movido

---

## ⚠️ PRECAUCIONES

1. **NO TOCAR:**
   - `inventario-retail/` (código fuente)
   - `app/` (código fuente)
   - `tests/` (tests)
   - `AUDITORIA_PRE_DESPLIEGUE/` (auditoría actual)
   - `docs/runbooks/` (runbooks operacionales)
   - Archivos de configuración activos

2. **VERIFICAR ANTES DE ELIMINAR:**
   - Buscar referencias en código activo
   - Confirmar que no son dependencias de scripts

3. **PRESERVAR HISTÓRICO:**
   - Todo va a `archive/`, no se borra permanentemente
   - Mantener estructura para referencia futura

---

*Plan generado: October 18, 2025 - 02:30 UTC*
