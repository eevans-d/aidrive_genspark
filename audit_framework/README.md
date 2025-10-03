# 🔍 Framework de Auditoría Pre-Despliegue

## Descripción

Framework no invasivo para auditoría exhaustiva del sistema multi-agente retail argentino, implementando las Etapas 0-2 del protocolo MEGA PLANIFICACIÓN DE AUDITORÍA.

## Principios Rectores

### 🔒 FREEZE Compliance
- ❌ **NO modificar** lógica core en `inventario-retail/`
- ❌ **NO renombrar** directorios existentes
- ❌ **NO agregar** dependencias pesadas al core
- ❌ **NO realizar** refactors amplios
- ✅ **SÍ crear** herramientas de análisis externas
- ✅ **SÍ documentar** hallazgos y recomendaciones
- ✅ **SÍ preservar** arquitectura multi-agente existente

### 🎯 Objetivos
1. **ETAPA 0**: Consolidar ProjectProfile con ≥98% completitud
2. **ETAPA 1**: Mapear arquitectura multi-agente con ≥95% cobertura
3. **ETAPA 2**: Identificar y priorizar Top-7 riesgos críticos

## Estructura del Framework

```
audit_framework/
├── stage0_ingestion/          # ETAPA 0: Ingesta y Validación
│   ├── project_profile.py     # Extracción de metadatos del proyecto
│   └── validation.py          # Validación de consistencia
├── stage1_mapping/            # ETAPA 1: Mapeo Estructural
│   ├── dependency_graph.py    # Grafo de dependencias multi-agente
│   ├── fsm_analyzer.py        # Análisis de máquinas de estado
│   └── jwt_analyzer.py        # Análisis de comunicación JWT
├── stage2_risk_analysis/      # ETAPA 2: Análisis de Riesgo
│   ├── risk_detector.py       # Detección multi-vector
│   ├── risk_scoring.py        # Priorización con scoring contextual
│   └── roi_calculator.py      # Cálculo ROI para mitigaciones
├── lib/                       # Utilidades compartidas
│   ├── scoring.py             # Funciones de scoring
│   └── control_envelope.py    # Control de iteraciones
├── reports/                   # Reportes generados
│   ├── stage0_profile.json
│   ├── stage1_architecture.json
│   └── stage2_risks.json
└── run_audit.py               # Script principal de ejecución
```

## Contexto del Proyecto

### Arquitectura Multi-Agente (7 Servicios)
1. **agente_deposito** (Puerto 8001) - Gestión de inventario
2. **agente_negocio** (Puerto 8002) - OCR multi-engine + AFIP
3. **ml_service** (Puerto 8003) - Predicción con ajuste inflación 4.5%
4. **web_dashboard** (Puerto 8080) - Orquestador con WebSockets
5. **nginx** (Puertos 80/443) - Reverse proxy con SSL
6. **postgres** (Puerto 5432) - Base de datos compartida
7. **redis** (Puerto 6379) - Cache compartido

### Contexto Argentino Específico
- **Inflación mensual**: 4.5% (hardcoded en ML)
- **Validación AFIP**: CUIT/CUIL en facturas
- **Timezone**: America/Argentina/Buenos_Aires
- **OCR Multi-Engine**: EasyOCR, Tesseract, PaddleOCR

### Comunicación Inter-Agente
- **Autenticación**: JWT único (`JWT_SECRET_KEY`) compartido
- **Protocolo**: REST HTTP entre agentes
- **Orquestación**: Dashboard → Todos los agentes

## Uso

### Ejecución Completa
```bash
python3 audit_framework/run_audit.py
```

### Ejecución por Etapas
```bash
# ETAPA 0: Ingesta y Validación
python3 audit_framework/run_audit.py --stage=0

# ETAPA 1: Mapeo Estructural
python3 audit_framework/run_audit.py --stage=1

# ETAPA 2: Análisis de Riesgo
python3 audit_framework/run_audit.py --stage=2
```

### Resultados
Los reportes se generan en `audit_framework/reports/`:
- `stage0_profile.json` - ProjectProfile consolidado
- `stage1_architecture.json` - Mapeo arquitectónico completo
- `stage2_risks.json` - Riesgos priorizados con scoring

## Métricas de Calidad

### Control de Iteraciones
- **Límite global**: 22 iteraciones máximo
- **Límite por etapa**: 2 iteraciones de refinamiento
- **Umbral de mejora**: 12% mínimo
- **Criterio de suficiencia**: ≥92% completitud en componentes críticos

### Scoring de Riesgos
```
Score = (Severidad × 0.4) + (Impacto × 0.35) + (Probabilidad × 0.25)
```

**Multiplicadores Contextuales:**
- Container security: ×1.3 (crítico identificado)
- Multi-agent communication: ×1.25 (JWT único)
- AFIP/retail context: ×1.2 (lógica de negocio específica)
- Business continuity: ×1.4 (auditoría forense crítica)

### ROI de Mitigaciones
```
ROI = (Beneficio Cuantificable × Multiplicador Contexto) / Esfuerzo (horas)
```

**Aprobación requiere**: ROI ≥1.6, Beneficio >18%, Esfuerzo <7h

## Hallazgos Críticos Esperados

Basado en análisis forense previo, se esperan identificar:

1. **R1_CONTAINER_ROOT_EXECUTION** - Containers ejecutando como root
2. **R2_JWT_SINGLE_SECRET** - JWT único compromete todos los agentes
3. **R3_OCR_ENGINE_TIMEOUT** - Timeouts OCR sin configuración explícita
4. **R4_ML_HARDCODED_INFLATION** - Inflación 4.5% hardcodeada
5. **R5_FORENSIC_CASCADE_FAILURE** - Fallo en fase → auditoría perdida
6. **R6_NO_DEPENDENCY_SCANNING** - Sin escaneo de vulnerabilidades
7. **R7_WEBSOCKET_MEMORY_LEAK** - Conexiones sin cleanup explícito

## Validación de No-Invasividad

### Antes de Ejecutar
```bash
# Backup del estado actual
git status
git diff
```

### Después de Ejecutar
```bash
# Verificar que NO hay cambios en inventario-retail/
git status inventario-retail/
git diff inventario-retail/

# Debe mostrar: "nothing to commit, working tree clean"
```

El framework SOLO crea archivos en `audit_framework/` y NO modifica código existente.

## Referencias

- **Documento base**: MEGA PLANIFICACIÓN DE AUDITORÍA PRE-DESPLIEGUE (Parte 1/2)
- **Análisis forense**: `FORENSIC_ANALYSIS_REPORT_16_PROMPTS.md`
- **Docker compose**: `inventario-retail/docker-compose.production.yml`
- **Contexto AFIP**: `CONFIGURACIONES_PRODUCCION_INVENTARIO_RETAIL.md`

## Estado de Implementación

- [x] Estructura de directorios creada
- [ ] ETAPA 0: Project Profile y Validación
- [ ] ETAPA 1: Mapeo Estructural Multi-Agente
- [ ] ETAPA 2: Análisis y Priorización de Riesgos
- [ ] Reportes consolidados generados
- [ ] Validación de no-invasividad completada
