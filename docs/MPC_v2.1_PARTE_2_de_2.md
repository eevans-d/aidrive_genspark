# MPC v2.1 aplicado al proyecto Minimarket System (Parte 2/2)

**Proyecto:** Minimarket System  
**Dominio:** TEC (Software)  
**Nivel MPC:** Intermedio  
**Fecha base:** 2026-01-14  
**Índice MPC:** docs/MPC_INDEX.md  
**Capa 2 en este proyecto:** docs/PLAN_WS_DETALLADO.md (workstreams WS1-WS9)  
**Capa 3 (ejecución):** docs/CHECKLIST_CIERRE.md, docs/VERIFICACION_2026-01-12.md, docs/VERIFICACION_FASES_7_8_9.md

**Notas de uso:**
- Etapas/fases vigentes: E1–E5 y F1.1–F5.3 (ver docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md).
- Sub-planes Capa 2 se mantienen en docs/PLAN_WS_DETALLADO.md (no se generan C2_* individuales).

## CAPA 2: SUB-PLANIFICACIONES DETALLADAS - PROMPTS BASE

### Prompt 2.1: Sub-Planificación de Etapa
Profundiza en la etapa específica del proyecto Minimarket System para crear Sub-Planificación Detallada (Capa 2).

**Información del proyecto:**
- Proyecto: Minimarket System
- Dominio: TEC (Software)
- Etapa a detallar: [E1–E5 según C1]
- Mega Plan: docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md

**Contexto de la etapa:**
[Descripción de qué se logrará, extraída del Mega Plan]

**Fases identificadas en Capa 1:**
[Lista las fases F1, F2, F3... de esta etapa según Mega Plan]

**Tu tarea es crear Sub-Planificación detallada con:**

### 1. Objetivo y Prerequisitos
- Objetivo específico de la etapa (1 párrafo)
- Prerequisitos técnicos/operacionales (herramientas, accesos, configuración)
- Prerequisitos de proceso (aprobaciones, recursos)
- Estado actual vs estado deseado

### 2. Desglose Detallado por Fase

Para cada fase (F1, F2, F3...):

**Estructura por Fase:**
Fase FX: [Nombre Descriptivo]
Descripción: [2-3 párrafos explicando qué se hará]

Sub-tareas:

[Sub-tarea específica 1] (estimado: Xh)

[Sub-tarea específica 2] (estimado: Xh)

[Sub-tarea específica 3] (estimado: Xh)
[Total: X horas/días]

Input (Entrada):

[Artefacto o información necesaria 1]

[Artefacto o información necesaria 2]

Output (Salida):

[Artefacto generado 1]

[Resultado entregable 2]

[Documentación actualizada 3]

Criterios de Aceptación:

[Criterio verificable 1]

[Criterio verificable 2]

[Criterio verificable 3]


### 3. Especificaciones por Dominio

**SELECCIONAR TEMPLATE SEGÚN DOMINIO:**

[TEC] **Especificaciones Técnicas (Software):**
Archivos Involucrados:

- minimarket-system/src/pages/Dashboard.tsx: conteos con count real
- minimarket-system/src/pages/Deposito.tsx: movimiento de stock atómico
- supabase/functions/api-minimarket/index.ts: gateway, auth, CORS, rate limit
- supabase/functions/api-proveedor/router.ts: rutas proveedor
- supabase/functions/scraper-maxiconsumo/*: parsing/matching/storage
- supabase/migrations/*.sql: cambios en DB

Endpoints/Puntos Interfaz:
| Método | Ruta/Interfaz | Descripción | Auth | Rate Limit |
| GET | /categorias | Listar categorías | JWT opcional | 60/min |
| GET | /productos | Listar productos | JWT opcional | 60/min |
| POST | /productos | Crear producto | JWT (rol deposito/admin) | 60/min |
| GET | /proveedores | Listar proveedores | JWT opcional | 60/min |

Modelos de Datos:
- minimarket-system/src/types/* (Producto, Proveedor, Stock, etc.)
- docs/ESQUEMA_BASE_DATOS_ACTUAL.md

Variables de Entorno/Config:
| Variable | Descripción | Valor por defecto | Dónde obtener |
| VITE_SUPABASE_URL | URL Supabase frontend | N/A | .env (minimarket-system) |
| VITE_SUPABASE_ANON_KEY | Anon key frontend | N/A | .env (minimarket-system) |
| ALLOWED_ORIGINS | CORS allowlist | localhost | Config Edge Function |
| API_PROVEEDOR_SECRET | Auth API proveedor | N/A | Secrets Supabase |
| SUPABASE_URL | URL Supabase backend | N/A | Secrets Supabase |
| SUPABASE_ANON_KEY | Anon key backend | N/A | Secrets Supabase |
| SUPABASE_SERVICE_ROLE_KEY | Service role key | N/A | Secrets Supabase |


[INF] **Especificaciones de Infraestructura:**
Componentes/Equipos:

[Componente 1]: Especificaciones, ubicación, configuración

Diagramas de Conexión:

[Referencia a diagramas de red/instalación]

Configuraciones Críticas:
| Configuración | Valor | Impacto si incorrecta |


[INV] **Especificaciones de Investigación:**
Metodología/Protocolo:

Método: [Descripción]

Variables: Independiente, Dependiente, Control

Instrumentos/Herramientas:

[Instrumento 1]: Características, calibración

Análisis Planificado:

[Tipo de análisis]: Software, parámetros


[EVT] **Especificaciones de Evento:**
Áreas/Estaciones:

[Área 1]: Responsable, recursos, checklist

Cronograma Detallado:
| Hora | Actividad | Responsable | Recursos |

Logística Crítica:
| Item | Proveedor | Contacto | Fecha Entrega |


[CON] **Especificaciones de Construcción:**
Materiales Requeridos:

[Material 1]: Cantidad, especificaciones, proveedor

Secuencia Constructiva:

[Paso 1]: Duración, equipos, personal

Planos/Diagramas:

[Referencia a planos con revisiones]


[ORG] **Especificaciones Organizacionales:**
Procesos/Flujos:

Proceso Actual: [Descripción o diagrama]

Proceso Nuevo: [Descripción o diagrama]

Roles/Responsabilidades:
| Rol | Responsabilidades | Autoridad |

Comunicaciones Planificadas:
| Tipo | Audiencia | Frecuencia | Canal |


### 4. Plan de Verificación/Validación

**Verificaciones por Nivel:**

**Nivel 1: Por Sub-tarea**
- [ ] Verificación inmediata después de cada sub-tarea
- [ ] Criterio: [CRITERIO ESPECÍFICO]

**Nivel 2: Por Fase**
- [ ] Verificación completa de fase
- [ ] Criterio: [CRITERIO ESPECÍFICO]

**Nivel 3: Por Etapa**
- [ ] Verificación integral
- [ ] Criterio: [CRITERIO ESPECÍFICO]

### 5. Plan de Implementación Paso a Paso

Para cada sub-tarea, define:
Paso X: [Título]

Acción: [Descripción detallada]

Comando/Procedimiento: [Si aplica, snippet o instrucción]

Verificación: [Cómo confirmar que funcionó]

Criterio de éxito: [Qué debe ocurrir]

Rollback: [Cómo revertir si falla]


### 6. Plan de Rollback/Reversión

**Estrategia de reversión por fase:**
- Pasos para revertir cambios
- Tiempo estimado de rollback
- Datos/resultados que se perderían (si aplica)
- Checkpoints de "no retorno"

### 7. Evidencia y Referencias

**Referencias a activos existentes:**
- [Ubicación/Referencia] → Descripción

**Verificaciones realizadas:**
- ✅ o ⚠️ con descripción

**Discrepancias encontradas:**
- Lista de inconsistencias

### 8. Criterios de Completitud de la Etapa

Checklist final para considerar esta etapa "done":
- [ ] Criterio técnico/operacional 1
- [ ] Criterio de proceso 1
- [ ] Criterio de calidad 1
- [ ] Criterio de negocio 1

**Formato de salida:**
Documento markdown siguiendo template de Sub-Plan MPC v2.1

**Nombre del documento:** docs/PLAN_WS_DETALLADO.md (sub-planes WS1–WS9)

Genera la Sub-Planificación ahora.

Prompt 2.2 Universal: Profundización en Plan de Verificación
Profundiza en la estrategia de verificación/validación para [ETAPA] de Minimarket System.

**Sub-Plan actual:**
[Adjunta sección relevante de docs/PLAN_WS_DETALLADO.md]

**Dominio:** TEC (Software)
**Contexto específico:**
- [Contexto relevante al dominio]

**Tu tarea:**

### 1. Estrategia de Verificación Multi-Nivel

**Verificaciones de Unidad/Componente:**
Para cada componente/parte crítica:
- Componente: [Nombre]
- Verificaciones a realizar:
  * Funcionalidad básica (happy path)
  * Casos límite/edge cases
  * Manejo de errores/fallos
- Métodos de verificación: [Observación, prueba, inspección]
- Criterio de aprobación: [Criterio específico]

**Verificaciones de Integración:**
Para cada integración/flujo:
- Componentes involucrados
- Dependencias externas
- Setup necesario
- Escenarios a verificar
- Método de verificación

**Verificaciones E2E/Sistema:**
Para escenarios críticos de uso:
- Escenario completo
- Pasos del flujo
- Datos de entrada
- Resultado esperado
- Método de verificación

### 2. Matriz de Cobertura

Crea tabla:
| Componente/Área | Tipo de Verificación | Cobertura Objetivo | Prioridad | Status |
|-----------------|----------------------|-------------------|-----------|--------|
| [Componente 1] | Unidad/Componente | 100% | P0 | ⏳ |
| [Integración 1] | Integración | 90% | P0 | ⏳ |
| [Escenario 1] | E2E/Sistema | Critical paths | P1 | ⏳ |

### 3. Plan de Datos/Entradas de Prueba

- ¿Qué datos/entradas necesitas para verificación?
- ¿Cómo generar datos/entradas realistas?
- ¿Estrategia de limpieza/restauración después?

### 4. Integración en Proceso (si aplica)

- ¿Qué verificaciones corren en cada etapa?
  * Pre-implementación: [Verificaciones rápidas]
  * Durante implementación: [Verificaciones continuas]
  * Post-implementación: [Verificaciones completas]

- Thresholds de aceptación:
  * Unidad/Componente: [X%]
  * Integración: [X%]
  * Global: [X%]

### 5. Verificaciones de Regresión

- ¿Qué verificaciones existentes pueden verse afectadas?
- Plan para correr suite completa de regresión
- Tiempo estimado de ejecución

Proporciona el plan de verificación profundizado.

Prompt 2.3 Universal: Validación de Sub-Plan
Valida la Sub-Planificación Detallada para [ETAPA] de Minimarket System antes de Capa 3.

**Sub-Plan actual:**
[Adjunta la sección relevante de docs/PLAN_WS_DETALLADO.md]

**Checklist de Validación - Capa 2:**

✅ **Completitud:**
- [ ] Cada fase tiene al menos 3 sub-tareas concretas
- [ ] Sub-tareas tienen estimación de tiempo
- [ ] Input/output claramente definidos por fase
- [ ] Criterios de aceptación son verificables

✅ **Viabilidad Técnica/Operacional:**
- [ ] Todos los activos mencionados existen y son accesibles
- [ ] Especificaciones son consistentes con arquitectura general
- [ ] Configuraciones críticas están documentadas
- [ ] No hay dependencias circulares

✅ **Verificación:**
- [ ] Plan de verificación cubre al menos 80% de funcionalidad crítica
- [ ] Verificaciones de unidad/componente definidas para partes críticas
- [ ] Verificaciones de integración cubren puntos de interfaz
- [ ] Verificaciones E2E para flujos críticos

✅ **Rollback:**
- [ ] Cada fase tiene plan de reversión claro
- [ ] Tiempo de rollback estimado
- [ ] Checkpoints de "no retorno" identificados
- [ ] Estrategia de backup/restore si aplica

✅ **Evidencia:**
- [ ] Referencias a activos existentes son exactas
- [ ] Verificaciones de configuración realizadas
- [ ] Discrepancias documentadas
- [ ] Contratos/interfaces validados

✅ **Implementabilidad:**
- [ ] Pasos de implementación son ejecutables secuencialmente
- [ ] Procedimientos/instrucciones son correctos
- [ ] Verificación por paso está clara
- [ ] Dependencias de orden respetadas

**Tu tarea:**
1. Revisa cada criterio objetivamente
2. Marca ✅ (cumple), ⚠️ (cumple parcialmente), ❌ (no cumple)
3. Para ⚠️ y ❌, especifica qué falta o está mal
4. Identifica riesgos técnicos/operacionales no considerados
5. Evalúa si la estimación de tiempo es realista

**Análisis de Riesgos:**
Identifica potenciales blockers:
- Dependencias externas no controladas
- Complejidad técnica/operacional subestimada
- Falta de expertise en el equipo
- Ambigüedad en especificaciones

**Decisión final:**
- ✅ **LISTO PARA EJECUCIÓN**: Plan sólido, iniciar Capa 3
- ⚠️ **PROCEDER CON PRECAUCIÓN**: Ajustes menores, documentar riesgos
- ❌ **REQUIERE REVISIÓN**: Problemas estructurales, volver a Capa 2

**Scoring de calidad del sub-plan (1-10):**
- Completitud técnica/operacional: __/10
- Viabilidad: __/10
- Cobertura de verificación: __/10
- Claridad de implementación: __/10
- **Score total: __/40**

Proporciona tu validación completa.

🚀 CAPA 3: EJECUCIÓN CONTROLADA - PROMPTS UNIVERSALES
Prompt 3.1 Universal: Setup Pre-Ejecución
Prepara el setup y entorno para ejecutar [ETAPA]-[FASE] de Minimarket System.

**Sub-Plan aprobado:**
[Referencia a docs/PLAN_WS_DETALLADO.md]

**Dominio:** TEC (Software)
**Fase a ejecutar:** [FX - NOMBRE DE LA FASE]

**Tu tarea:**

### 1. Checklist Pre-Ejecución

Genera checklist completo y ejecutable para preparar el entorno:

**Entorno de Trabajo:**
1. Verificar estado base
[ ] Confirmar que prerequisitos de fase están cumplidos
[ ] Verificar estado de activos/componentes base

2. Preparar herramientas/recursos
[ ] Herramientas necesarias: [LISTAR]
[ ] Recursos disponibles: [LISTAR]
[ ] Configurar elementos necesarios

3. Configurar entorno específico
[ ] [PASOS DE CONFIGURACIÓN ESPECÍFICOS AL DOMINIO]

4. Verificar dependencias
[ ] Dependencias funcionando correctamente
[ ] Conexiones/configuraciones verificadas

5. Correr baseline de verificación
[ ] [PROCEDIMIENTO DE VERIFICACIÓN BASELINE]
[ ] Todas pasan ANTES de empezar: ✅

6. Preparar log de sesión
[ ] Crear/actualizar archivo: docs/VERIFICACION_[FECHA].md y docs/CHECKLIST_CIERRE.md


**Herramientas y Accesos:**
- [ ] Herramientas principales configuradas
- [ ] Acceso a recursos necesarios (sistemas, espacios, materiales)
- [ ] Credenciales/permisos disponibles
- [ ] Documentación abierta y accesible

**Comunicación:**
- [ ] Notificar a equipo inicio de trabajo en [FASE]
- [ ] Bloquear tiempo para trabajo enfocado
- [ ] Preparar canal de comunicación si hay blocker

### 2. Procedimientos de Verificación

Proporciona procedimientos específicos para verificar que todo está listo:
Verificar versiones/estados
[PROCEDIMIENTO - ej: confirmar versiones de software]

Verificar servicios/componentes
[PROCEDIMIENTO - ej: verificar que componentes críticos funcionan]

Verificar conectividad/acceso
[PROCEDIMIENTO - ej: probar conexiones a sistemas dependientes]

Verificar permisos/accesos
[PROCEDIMIENTO - ej: confirmar permisos necesarios]


### 3. Plan de Sesión de Trabajo

Estructura sugerida para la sesión:
SESIÓN DE EJECUCIÓN - [FASE]
Duración estimada: [X horas]

🎯 Objetivo: [Completar FX con criterios de aceptación]

📋 Sub-tareas a completar:

[Sub-tarea 1] (estimado: Xh)

[Sub-tarea 2] (estimado: Xh)

[Sub-tarea 3] (estimado: Xh)

⏰ Breaks planificados:

Después de sub-tarea 1: 10 min

Después de sub-tarea 2: 10 min

[Otros breaks según duración]

🧪 Verificaciones a realizar:

Después de cada sub-tarea: [Verificaciones específicas]

Al final: [Suite completa]

📝 Documentación a actualizar:

[Tipo de documentación 1]: [Archivos a actualizar]

[Tipo de documentación 2]: [Archivos a actualizar]

Log: Progreso en execution log


### 4. Template de Execution Log Universal

Proporciona template inicial para el log:

```markdown
# Execution Log - [ETAPA]-[FASE] - TEC - [FECHA]

## 📊 Información de Sesión
- **Fecha:** [YYYY-MM-DD]
- **Hora inicio:** [HH:MM]
- **Hora fin estimada:** [HH:MM]
- **Ejecutor(es):** [NOMBRE(S)]

## 🎯 Objetivo
[Descripción breve de qué se logrará]

## 📋 Sub-tareas Planificadas
- [ ] [Sub-tarea 1]
- [ ] [Sub-tarea 2]
- [ ] [Sub-tarea 3]

## 📝 Log de Progreso

### [HH:MM] - Inicio de sesión
- Setup completado ✅
- Baseline verificaciones: [X/X passed]

### [HH:MM] - [Descripción de avance]
- Acción realizada: [DESCRIPCIÓN]
- Activo(s) modificado(s): [LISTA]
- Registro: [REFERENCIA A REGISTRO - ej: commit, ticket, documento]
- Verificaciones: ✅ [X/X passed] / ⚠️ [X failed]
- Notas: [OBSERVACIONES]

[Continuar agregando entradas por cada avance significativo]

## ⚠️ Problemas Encontrados
| Tiempo | Problema | Resolución | Impacto |
|--------|----------|------------|---------|
| [HH:MM] | [DESCRIPCIÓN] | [CÓMO SE RESOLVIÓ] | [TIEMPO/DESVIACIÓN] |

## ✅ Completado
- [Listar lo logrado]

## 🔜 Próximos Pasos
- [Siguientes acciones]

## 📊 Métricas
- Tiempo total: [X horas]
- Desviación de plan: [± X%]
- Verificaciones realizadas: [N]
- Incidencias/errores: [N]
Proporciona el setup completo ahora.


### Prompt 3.2 Universal: Asistencia Durante Implementación
Estoy ejecutando [ETAPA]-[FASE] de Minimarket System y necesito asistencia en tiempo real.

Contexto actual:

Dominio: TEC (Software)

Sub-tarea en progreso: [SUB-TAREA X]

Elemento trabajando: [COMPONENTE/ÁREA ESPECÍFICA]

Ubicación específica: [UBICACIÓN/DETALLE]

Situación:
[Describe qué estás haciendo, qué problema encontraste, o qué duda tienes]

Elemento relevante:

[Proporciona información relevante - código, configuración, diagrama, etc.]
Error/Problema (si aplica):

[Describe el error o problema completo]
Lo que he intentado:

[Acción 1] - [Resultado]

[Acción 2] - [Resultado]

Tu ayuda:

Por favor proporciona:

Diagnóstico:

¿Cuál es la causa raíz del problema?

¿Es un issue de lógica, configuración, proceso, o dependencia?

Solución:

Corrección/mejora propuesta

Explicación de qué cambiar y por qué

Procedimientos a ejecutar (si aplica)

Verificación:

¿Cómo puedo confirmar que funciona?

¿Qué verificaciones debo realizar?

¿Hay side effects potenciales?

Documentación:

¿Qué debo documentar en el log?

¿Hay algo que agregar a documentación técnica/operacional?

Continuación:

¿Puedo proceder a siguiente sub-tarea?

¿Hay prerequisitos adicionales que se revelaron?

Proporciona tu asistencia ahora.


### Prompt 3.3 Universal: Validación Post-Fase (Gate Check)
Valida que [ETAPA]-[FASE] para Minimarket System está lista para considerar "done".

Execution Log de la fase:
[Adjunta contenido de docs/CHECKLIST_CIERRE.md o de docs/VERIFICACION_*.md según la fase]

Dominio: TEC (Software)
Criterios de Aceptación (del Sub-Plan):
[Lista los criterios que se definieron en Capa 2]

Tu tarea:

1. Validación de Criterios Técnicos/Operacionales
Verifica cada criterio de aceptación:

[Criterio 1]: ✅ / ⚠️ / ❌ - [Evidencia]

[Criterio 2]: ✅ / ⚠️ / ❌ - [Evidencia]

[Criterio 3]: ✅ / ⚠️ / ❌ - [Evidencia]

2. Validación de Verificaciones
Verificaciones de Unidad/Componente:

Cobertura actual: [X%]

Target: [X%]

Status: ✅ / ⚠️ / ❌

Fallos: [Listar si hay]

Verificaciones de Integración:

Status: ✅ / ⚠️ / ❌

Verificaciones ejecutadas: [N]

Fallos: [Listar si hay]

Verificaciones E2E/Sistema (si aplica):

Status: ✅ / ⚠️ / ❌

Escenarios cubiertos: [N/Total]

3. Validación de Calidad
Verificaciones de Calidad Específicas:

[Procedimiento específico de verificación de calidad]
Errores: [N]

Warnings: [N]

Status: ✅ / ❌

Validaciones Especializadas:

[Procedimiento - ej: revisión de seguridad, auditoría, etc.]
Hallazgos: [N]

Status: ✅ / ❌

4. Validación de Documentación
Elementos tienen documentación/instrucciones explicativas

Documentación principal actualizada (si aplica)

Documentación de interfaz/API actualizada (si aplica)

Execution log completado con todos los cambios

ADRs creados para decisiones importantes

5. Validación de Performance/Desempeño (si aplica)
[Métrica 1]: [X] (target: [X]) ✅ / ❌

[Métrica 2]: [X] (target: [X]) ✅ / ❌

Optimizaciones realizadas: ✅ / ❌

6. Validación de Rollback
Plan de rollback revisado

Rollback testeado (dry-run): ✅ / ❌

Backup realizado (si aplica): ✅ / N/A

Tiempo de rollback confirmado: [X min/horas]

7. Validación de Registros/Trazabilidad
Todos los cambios registrados apropiadamente

Registros son claros y descriptivos

Estado actualizado en sistemas de tracking

No hay conflictos/inconsistencias

8. Gate Decision Matrix
Evalúa readiness para proceder:

Criterio	Status	Bloqueante	Peso
Criterios de aceptación	✅/⚠️/❌	Sí	Alto
Verificaciones	✅/⚠️/❌	Sí	Alto
Calidad	✅/⚠️/❌	Sí	Medio
Documentación	✅/⚠️/❌	No	Bajo
Performance/Desempeño	✅/⚠️/❌	Depende	Medio
Rollback	✅/⚠️/❌	Sí	Alto
Decisión final:

✅ PASS - Proceder a siguiente fase: Todos criterios bloqueantes cumplidos

⚠️ PASS WITH CONDITIONS: Algunos items ⚠️, documentar y monitorear

❌ FAIL - Requiere más trabajo: Criterios bloqueantes no cumplidos

Si FAIL, proporciona:

Lista específica de items a corregir

Estimación de tiempo adicional necesario

Riesgos de proceder sin corregir

Proporciona validación completa del gate ahora.


---

## 📖 CAPA 4: CIERRE Y CONSOLIDACIÓN - PROMPTS UNIVERSALES

### Prompt 4.1 Universal: Retrospectiva de Proyecto
Facilita retrospectiva completa para Minimarket System (o etapa mayor [ETAPA]).

Contexto del proyecto:

Dominio: TEC (Software)

Duración: [X semanas/meses]

Etapas completadas: [Listar E1, E2, E3...]

Equipo: [Tamaño y roles]

Objetivo original: estabilizar y endurecer el sistema para producción (ver docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md)

Estado final: [Completado / Parcialmente / En progreso]

Documentos disponibles:

Mega Plan: [Referencia]

Sub-Planes: [Referencias]

Execution Logs: [Referencias]

Tu tarea es facilitar retrospectiva estructurada:

1. Análisis de Objetivos vs Resultados
Crea tabla comparativa:

Objetivo Original	Target	Resultado Logrado	Varianza	Razón de varianza
[Obj 1]	[Target]	[Actual]	[± X%]	[Explicación]
2. Timeline Analysis
Planificado: [X semanas]

Actual: [X semanas]

Varianza: [± X semanas / ± X%]

Desglose de tiempo:

Etapa	Estimado	Actual	Varianza	Principales delays
E1	[X días]	[X días]	[± X%]	[Razón]
3. What Went Well 🟢
Identifica y categoriza lo que funcionó:

Proceso:

[Item 1 que funcionó bien]

Impacto: [Descripción]

Replicable: Sí / No

Recomendación: [Cómo usar en futuros proyectos]

Técnico/Operacional:

[Item que funcionó]

Por qué funcionó: [Explicación]

Aprendizaje: [Qué aprendimos]

Colaboración:

[Aspecto de colaboración exitoso]

Ejemplo concreto: [Situación]

Valor generado: [Beneficio]

4. What Went Wrong 🔴
Identifica problemas con causa raíz:

Problema 1:

Descripción: [Qué salió mal]

Causa raíz: [Por qué ocurrió - usar 5 Whys]

Impacto: [Consecuencias concretas]

Prevención futura: [Cómo evitarlo]

5. Lessons Learned 💡
Documenta aprendizajes específicos:

[Categoría 1]:

[Lección 1]

Contexto: [Cuándo aprendimos esto]

Acción futura: [Qué haremos diferente]

[Categoría 2]:

[Lección 2]

Evidencia: [Datos que lo respaldan]

Ajuste: [Cómo calibrar futuras estimaciones]

6. What Will We Do Differently 🔄
Compromisos concretos para próximos proyectos:

Cambio	Categoría	Prioridad	Owner	Implementar desde
[Cambio 1]	Proceso	Alta	[Rol]	[Próximo proyecto]
7. Métricas del Proyecto
Técnicas/Operacionales:

Métrica	Target	Actual	Status
[Métrica 1]	> X%	[X%]	✅/⚠️/❌
De Proceso:

Métrica	Target	Actual	Status
Adherencia al plan	> 80%	[X%]	✅/⚠️/❌
De Equipo:

Métrica	Target	Actual	Status
Satisfacción del equipo	> 4/5	[X/5]	✅/⚠️/❌
8. Recomendaciones para Proyectos Futuros
Proporciona lista accionable:

[Recomendación específica 1]

Rationale: [Por qué]

Esfuerzo: [Bajo/Medio/Alto]

Impacto esperado: [Beneficio]

Genera la retrospectiva completa ahora.


### Prompt 4.2 Universal: Consolidación de Documentación Final
Consolida toda la documentación para cierre formal del proyecto Minimarket System.

Dominio: TEC (Software)
Documentos generados durante el proyecto:

Capa 0: docs/C0_DISCOVERY_MINIMARKET_TEC_2026-01-14.md; docs/C0_RISK_REGISTER_MINIMARKET_TEC.md; docs/C0_STAKEHOLDERS_MINIMARKET_TEC.md; docs/C0_COMMUNICATION_PLAN_MINIMARKET_TEC.md

Capa 1: docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md

Capa 2: docs/PLAN_WS_DETALLADO.md (WS1–WS9)

Capa 3: docs/CHECKLIST_CIERRE.md; docs/VERIFICACION_2026-01-12.md; docs/VERIFICACION_FASES_7_8_9.md

Capa 4: docs/C4_HANDOFF_MINIMARKET_TEC.md; docs/C4_SLA_SLO_MINIMARKET_TEC.md; docs/C4_INCIDENT_RESPONSE_MINIMARKET_TEC.md

Estado final:

Versión/estado final: [v1.0.0 o similar]

Fecha de finalización: [YYYY-MM-DD]

Tu tarea:

1. Actualización de Documentación Principal
Documento Resumen del Proyecto:
Genera/actualiza documento completo con:

# Minimarket System - Documentación Final

## 📋 Descripción
[Descripción concisa]

## 🎯 Resultados Logrados
- [Resultado 1]
- [Resultado 2]

## 🏗️ Arquitectura/Enfoque
[Descripción de arquitectura/enfoque utilizado]

## 🚀 Setup & Operación
[Instrucciones para setup y operación si aplica]

## ⚙️ Configuración
[Configuraciones críticas si aplica]

## 📚 Documentación Adicional
- [Link a documentación técnica/operacional]
- [Link a Architecture Decision Records]
- [Link a runbooks/procedimientos]

## 🤝 Contribución
[Guidelines si aplica]

## 📄 Información de Cierre
- Fecha finalización: [YYYY-MM-DD]
- Estado: [Completado/Parcial]
- Lecciones clave: [2-3 puntos]
Documentación Técnica/Operacional Específica:
Según dominio, asegurar documentación apropiada:

TEC: API docs, diagrams, deployment procedures

INF: Network diagrams, configuration guides

INV: Research protocols, data dictionaries

EVT: Event runbooks, checklists

CON: As-built drawings, maintenance manuals

ORG: Process documentation, role definitions

Architecture Decision Records (ADRs):
Consolidar todos los ADRs creados durante el proyecto.

2. Runbooks/Procedimientos Operacionales
Crear/actualizar runbooks para operación continua:

Runbook Operacional:

# Operational Procedures - Minimarket System

## Prerequisites
- [ ] [Prerequisito 1]
- [ ] [Prerequisito 2]

## Procedures
1. [Procedimiento 1]
2. [Procedimiento 2]

## Troubleshooting
[Cómo diagnosticar y resolver problemas comunes]

## Escalation
[Proceso de escalación para problemas]
3. Registro de Cambios Consolidado
Generar registro de cambios:

# Registro de Cambios - Minimarket System

## [Versión/Estado] - [YYYY-MM-DD]

### Agregado
- [Nuevo elemento implementado]

### Cambiado
- [Cambio en elemento existente]

### Corregido
- [Problemas resueltos]
4. Transferencia de Conocimiento
Crear documento de handoff:

# Knowledge Transfer Document - Minimarket System

## Overview
[Descripción de alto nivel]

## Critical Components
| Componente | Ubicación | Responsable | Documentación |
|-----------|----------|-------------|---------------|
| [Comp 1] | [Path] | [Role] | [Link] |

## Configuraciones Clave
| Configuración | Ubicación | Propósito | Riesgo si mal configurado |
|---------|----------|---------|---------------------|
| [Config] | [File] | [Purpose] | [Risk] |

## Procedimientos Operacionales
- [Procedimiento 1]: [Link to runbook]

## Issues Conocidos y Workarounds
| Issue | Workaround | Fix permanente planificado |
|-------|------------|---------------------|
| [Issue] | [Workaround] | [Yes/No - details] |

## Contactos
- [Rol clave]: [Nombre - contacto]
5. Backlog Remanente
Documentar items que quedaron fuera de scope:

# Backlog - Post-Proyecto

## Alta Prioridad (próximo ciclo)
1. [Item 1]
   - Rationale: [Por qué es importante]
   - Effort: [Estimación]

## Prioridad Media (próximo trimestre)
[Mismo formato]

## Deuda Técnica/Operacional
| Item | Impacto si no se aborda | Esfuerzo para resolver |
|------|------------------------|---------------|
| [Debt 1] | [Impact] | [Effort] |
6. Métricas Finales Consolidadas
Tabla final de métricas:

# Project Metrics - Final Report

## Entrega
- Duración planificada: [X weeks]
- Duración actual: [X weeks]
- Varianza: [± X%]
- Alcance entregado: [X%]

## Calidad
- [Métrica de calidad 1]: [X%]
- [Métrica de calidad 2]: [N]

## Proceso
- Adherencia al plan: [X%]
- Blockers mayores encontrados: [N]

## Negocio
- [Métrica de negocio 1]: [X%]
- ROI (si calculable): [X%]
Genera toda la documentación de cierre ahora.


### Prompt 4.3 Universal: Post-Mortem del Proyecto
Crea Post-Mortem completo y objetivo para Minimarket System siguiendo MPC v2.1.

Información del proyecto:

Dominio: TEC (Software)

Duración: [DURACIÓN]

Complejidad: [Baja/Media/Alta]

Tamaño del equipo: [N personas]

Resultado final: [Éxito / Parcial / Falló / Cancelado]

Incidentes mayores (si hubo):
[Lista cualquier incidente significativo]

Documentos previos:
[Referencias a retrospectiva, documentación, execution logs]

Tu tarea es crear post-mortem estructurado:

1. Executive Summary
Resumen ejecutivo (2-3 párrafos):

¿Qué se intentaba lograr?

¿Qué se logró realmente?

¿Cuáles fueron los principales desafíos?

¿Cuál fue el impacto final?

2. Timeline de Eventos Clave
Tabla cronológica de hitos y problemas:
| Fecha | Evento | Tipo | Impacto | Resolución |

3. Análisis de Root Cause (para problemas mayores)
Para cada problema significativo:

Problema: [Descripción]

Análisis de Causa Raíz:

¿Por qué ocurrió esto? [Razón 1]

¿Por qué [razón 1]? [Razón 2]

¿Por qué [razón 2]? [Razón 3]

¿Por qué [razón 3]? [Razón 4]

¿Por qué [razón 4]? [Root cause]

Factores Contribuyentes:

[Factor 1]

[Factor 2]

Acciones de Mitigación Tomadas:

[Acción inmediata 1]

Prevención a Largo Plazo:

[Cambio sistémico 1]

4. What Worked vs What Didn't
✅ What Worked:
| Área | Qué funcionó | Por qué funcionó | Replicar en futuro |

❌ What Didn't Work:
| Área | Qué falló | Por qué falló | Cómo mejorar |

5. Estimación vs Realidad
Análisis de Estimaciones:
| Etapa | Estimado | Real | Varianza | Razón principal |

Patrones identificados:

¿Qué tipo de tareas subestimamos? [Análisis]

Calibración futura:

[Ajuste sugerido 1]

6. Decision Review
Revisa decisiones clave:

Decisión 1: [Descripción]

Tomada el: [Fecha]

Rationale en ese momento: [Por qué se tomó]

Resultado en retrospectiva: ✅ Correcta / ⚠️ Mixta / ❌ Incorrecta

Aprendizaje: [Qué aprendimos]

7. Team Health
Análisis de dinámica del equipo:

Positive:

[Aspecto positivo 1 de colaboración]

Areas for Improvement:

[Área de mejora 1]

Evidencia: [Ejemplo concreto]

Sugerencia: [Cómo mejorar]

8. Action Items
Lista concreta de acciones con ownership:

Immediate (this sprint):
| Action | Owner | Due Date | Priority |

9. Metrics and Success Criteria
Original Success Criteria:
| Criterio | Target | Achieved | Met |

Unexpected Outcomes:

Positive: [Outcomes no planificados pero buenos]

10. Recommendations
Para proyectos similares futuros:

[Recomendación específica 1]

Context: [Cuándo aplica]

Expected impact: [Beneficio esperado]

Genera el post-mortem completo ahora.


---

## 🤖 SISTEMA DE AGENTE IA MPC v2.1

### Instrucciones de Configuración para Agentes IA:

```yaml
# CONFIGURACIÓN AGENTE MPC v2.1
version: "2.1.0"
agent_capabilities:
  - domain_classification
  - level_selection
  - template_adaptation
  - cross_domain_reasoning
  - risk_assessment
  - validation_gating

processing_rules:
  1. RECIBIR_SOLICITUD:
     - Identificar parámetros: Minimarket System, TEC, objetivo vigente
     - Clasificar dominio usando taxonomía MPC
     - Determinar nivel de aplicación (Completo/Intermedio/Essencial)

  2. SELECCIONAR_FLUJO:
     - Si solicitud específica: Usar prompt correspondiente
     - Si solicitud general: Empezar con Prompt 0.1
     - Adaptar terminología según dominio detectado

  3. PROCESAR_CON_TEMPLATE:
     - Usar template de dominio correspondiente
     - Mantener estructura MPC pero contenido adaptado
     - Referenciar matriz de adaptación cuando sea necesario

  4. VALIDAR_OUTPUT:
     - Verificar que output es agnóstico del dominio
     - Confirmar que incluye elementos de la capa correspondiente
     - Asegurar trazabilidad entre capas

  5. PROPORCIONAR_NEXT_STEPS:
     - Indicar siguiente prompt/capa recomendado
     - Sugerir documentos a generar
     - Recomendar checkpoints

templates_available:
  - discovery_templates: Por dominio (TEC, INF, INV, EVT, CON, ORG, HIB)
  - planning_templates: Mega Plan, Sub-Plan por dominio
  - execution_templates: Logs, checklists por dominio
  - closure_templates: Retrospectivas, post-mortems

validation_rules:
  - Cada documento debe incluir: Minimarket System, TEC, versión, fecha
  - Checkpoints deben ser verificables objetivamente
  - Riesgos deben tener owner y mitigación
  - Decisiones deben ser documentadas en ADRs

Sistema de Decisión Automatizado:
# PSEUDOCODE - AGENTE MPC DECISION ENGINE
def mpc_agent_decision(project_query, context=None):
    """
    Procesa consultas MPC y determina acción óptima
    """

    # 1. Clasificar dominio
    domain = classify_domain(project_query)

    # 2. Determinar nivel de aplicación
    complexity = assess_complexity(project_query)
    team_size = extract_team_size(project_query)
    application_level = determine_application_level(complexity, team_size)

    # 3. Seleccionar template base
    base_template = select_base_template(domain, application_level)

    # 4. Adaptar contenido
    adapted_content = adapt_to_domain(base_template, domain)

    # 5. Generar respuesta estructurada
    response = {
        "domain": domain,
        "application_level": application_level,
        "recommended_start": "Prompt 0.1" if not context else determine_next_step(context),
        "templates_to_use": get_domain_templates(domain),
        "estimated_timeline": estimate_timeline(complexity, application_level),
        "critical_checkpoints": get_checkpoints(application_level),
        "generated_content": adapted_content
    }

    return response

# Matriz de Decisión por Dominio
DOMAIN_DECISION_MATRIX = {
    "TEC": {
        "primary_focus": "technical_specifications",
        "risk_categories": ["technical_debt", "integration_failures", "security_vulnerabilities"],
        "success_metrics": ["test_coverage", "performance_metrics", "uptime"],
        "validation_methods": ["automated_testing", "code_review", "security_scan"]
    },
    "INF": {
        "primary_focus": "reliability_availability",
        "risk_categories": ["downtime", "configuration_errors", "capacity_issues"],
        "success_metrics": ["uptime", "latency", "throughput"],
        "validation_methods": ["monitoring", "load_testing", "failover_testing"]
    },
    # ... configuraciones para otros dominios
}

## Integración en este proyecto

**Tracking/gestión:** no hay integración activa con Jira/Asana; el seguimiento se mantiene en docs/ROADMAP.md, docs/PLAN_WS_DETALLADO.md y docs/DECISION_LOG.md.

**Documentación (repo):**
aidrive_genspark/
├── docs/
│   ├── MPC_INDEX.md
│   ├── C0_DISCOVERY_MINIMARKET_TEC_2026-01-14.md
│   ├── C0_RISK_REGISTER_MINIMARKET_TEC.md
│   ├── C0_STAKEHOLDERS_MINIMARKET_TEC.md
│   ├── C0_COMMUNICATION_PLAN_MINIMARKET_TEC.md
│   ├── C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md
│   ├── PLAN_WS_DETALLADO.md
│   ├── CHECKLIST_CIERRE.md
│   ├── VERIFICACION_2026-01-12.md
│   ├── VERIFICACION_FASES_7_8_9.md
│   ├── C4_HANDOFF_MINIMARKET_TEC.md
│   ├── C4_SLA_SLO_MINIMARKET_TEC.md
│   └── C4_INCIDENT_RESPONSE_MINIMARKET_TEC.md
├── minimarket-system/
├── supabase/
├── tests/
└── scripts/

**CI/CD real:**
- .github/workflows/ci.yml: lint, test (unit), build, typecheck, edge-functions-check.
- scripts/run-integration-tests.sh y scripts/run-e2e-tests.sh (gated).

---

## Resumen de implementación MPC v2.1 en Minimarket System

- Dominio TEC y nivel intermedio (C0, C1, C4; C2/C3 consolidados en PLAN_WS_DETALLADO y CHECKLIST_CIERRE).
- Fuente de verdad: docs/MPC_INDEX.md; planificación en docs/ROADMAP.md y docs/PLAN_WS_DETALLADO.md.
- Evidencias y validaciones: docs/CHECKLIST_CIERRE.md y docs/VERIFICACION_*.md.

## Métricas de éxito (adaptadas al proyecto)
- Observabilidad: 0 console.* en funciones críticas; logging estructurado con requestId/jobId/runId.
- Calidad: unit/integration/e2e reproducibles (gated cuando falten credenciales).
- Seguridad: auditoría RLS P0 con evidencia en CHECKLIST_CIERRE.
- UX/Producto: conteo correcto en Dashboard y movimiento de depósito atómico.

---

## Próximos pasos recomendados (alineados al roadmap)

1. **Actualizar arquitectura:** docs/ARCHITECTURE_DOCUMENTATION.md con estado real (WS8.1).
2. **Cerrar D-016:** migrar suites Jest legacy a Vitest y limpiar runners/tests/package.json.
3. **RLS y migraciones:** completar auditoría RLS P0 y verificación de migraciones (WS3.1/WS3.2) cuando existan credenciales.
4. **Runner integración/E2E:** activar scripts `scripts/run-integration-tests.sh` y `scripts/run-e2e-tests.sh` cuando haya `.env.test` válido.

---

**MPC v2.1 aplicado a Minimarket System queda alineado al repo y a docs/MPC_INDEX.md.**
