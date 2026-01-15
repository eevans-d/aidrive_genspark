# MPC v2.1 aplicado al proyecto Minimarket System (Parte 1/2)

**Proyecto:** Minimarket System  
**Dominio:** TEC (Software)  
**Nivel MPC:** Intermedio  
**Fecha base:** 2026-01-14  
**Índice MPC:** docs/MPC_INDEX.md  
**Artefactos actuales:**
- Capa 0: docs/C0_DISCOVERY_MINIMARKET_TEC_2026-01-14.md, docs/C0_RISK_REGISTER_MINIMARKET_TEC.md, docs/C0_STAKEHOLDERS_MINIMARKET_TEC.md, docs/C0_COMMUNICATION_PLAN_MINIMARKET_TEC.md, docs/C0_LESSONS_LEARNED_TEMPLATE.md
- Capa 1: docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md
- Capa 2: docs/PLAN_WS_DETALLADO.md (sub-planes por WS)
- Capa 3: docs/CHECKLIST_CIERRE.md, docs/VERIFICACION_2026-01-12.md, docs/VERIFICACION_FASES_7_8_9.md
- Capa 4: docs/C4_HANDOFF_MINIMARKET_TEC.md, docs/C4_SLA_SLO_MINIMARKET_TEC.md, docs/C4_INCIDENT_RESPONSE_MINIMARKET_TEC.md

**Notas de uso:**
- Etapas/fases vigentes: E1–E5 y F1.1–F5.3 (ver docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md).
- Las secciones INF/INV/EVT/CON/ORG se mantienen solo como referencia; no aplican a este proyecto.

# APÉNDICE A: TAXONOMÍA UNIVERSAL DE PROYECTOS

## DOMINIOS PRINCIPALES

### 1. TEC - Tecnológico/Software
- **Descripción:** Proyectos que involucran desarrollo, mantenimiento o integración de sistemas digitales
- **Ejemplos:** 
  - Desarrollo de APIs, aplicaciones web/móviles
  - Migraciones de infraestructura cloud
  - Implementación de sistemas empresariales (ERP, CRM)
  - Automatización de procesos mediante software
- **Artefactos típicos:** Código, repositorios, bases de datos, APIs, documentación técnica

### 2. INF - Infraestructura/Sistemas
- **Descripción:** Proyectos que involucran hardware, redes, o configuración de sistemas físicos/digitales
- **Ejemplos:**
  - Implementación de redes y telecomunicaciones
  - Configuración de data centers
  - Instalación de sistemas de seguridad física
  - Despliegue de hardware especializado
- **Artefactos típicos:** Diagramas de red, especificaciones técnicas, inventarios de hardware

### 3. INV - Investigación/Innovación
- **Descripción:** Proyectos centrados en descubrimiento, análisis o creación de nuevo conocimiento
- **Ejemplos:**
  - Proyectos de I+D (Investigación y Desarrollo)
  - Estudios científicos o de mercado
  - Desarrollo de prototipos experimentales
  - Análisis de datos complejos
- **Artefactos típicos:** Protocolos, datasets, papers, hipótesis, hallazgos

### 4. EVT - Eventos/Operaciones
- **Descripción:** Proyectos que organizan o ejecutan actividades con componentes logísticos y temporales
- **Ejemplos:**
  - Conferencias, lanzamientos de producto
  - Migraciones operacionales (ej: mudanza de oficina)
  - Ejecución de campañas de marketing
  - Coordinación de respuestas a incidentes
- **Artefactos típicos:** Agendas, checklists, listas de invitados, planes logísticos

### 5. CON - Construcción/Implementación Física
- **Descripción:** Proyectos que construyen, modifican o implementan estructuras o productos físicos
- **Ejemplos:**
  - Construcción o remodelación de espacios
  - Fabricación de productos
  - Instalación de equipos industriales
  - Implementación de infraestructura civil
- **Artefactos típicos:** Planos, especificaciones de materiales, cronogramas de construcción

### 6. ORG - Organizacional/Procesos
- **Descripción:** Proyectos que cambian estructuras, procesos o capacidades organizacionales
- **Ejemplos:**
  - Reestructuraciones organizativas
  - Implementación de nuevos procesos de negocio
  - Programas de transformación cultural
  - Desarrollo de capacidades organizacionales
- **Artefactos típicos:** Organigramas, flujos de proceso, matrices de responsabilidad

### 7. HIB - Híbrido/Multidominio
- **Descripción:** Proyectos que combinan elementos de múltiples dominios
- **Ejemplos:**
  - Digitalización de procesos físicos (TEC + ORG)
  - Investigación con implementación técnica (INV + TEC)
  - Eventos con componente tecnológico (EVT + TEC)
- **Artefactos típicos:** Combinación según dominios involucrados

## NIVELES DE APLICACIÓN MPC

### Nivel COMPLETO (5 Capas)
- **Para:** Proyectos > 3 meses, equipos > 5 personas, presupuesto significativo, alto impacto/riesgo
- **Documentos requeridos:** C0, C1, C2 (por etapa), C3 (por fase), C4
- **Checkpoints:** Todos (0, 1, 2, 3, Final)
- **Recomendado cuando:** Trazabilidad completa es crítica, múltiples stakeholders, regulaciones estrictas

### Nivel INTERMEDIO (3 Capas)
- **Para:** Proyectos 1-3 meses, equipos 3-5 personas, riesgo moderado
- **Documentos requeridos:** C0, C1, C4 (C2 y C3 como documentos combinados)
- **Checkpoints:** 0, 1, Final
- **Recomendado cuando:** Equipo experimentado, dominio bien comprendido, cambios limitados esperados

### Nivel ESENCIAL (2 Capas)
- **Para:** Proyectos < 1 mes, equipos 1-3 personas, bajo riesgo, alcance bien definido
- **Documentos requeridos:** C1 (simplificado), C4 (breve)
- **Checkpoints:** 1, Final
- **Recomendado cuando:** Proyectos repetitivos, alto nivel de confianza, necesidad de ejecución rápida

## GLOSARIO DE TÉRMINOS NEUTRALES

### Término | Definición Universal | Ejemplos por Dominio
|----------|----------------------|---------------------|
| **Activo (Asset)** | Cualquier recurso, elemento o componente necesario para el proyecto | TEC: Código, APIs<br>INF: Hardware, licencias<br>INV: Datasets, equipos<br>EVT: Locaciones, permisos |
| **Interfaz/Integración** | Punto de contacto o conexión entre componentes del sistema | TEC: APIs, webhooks<br>INF: Puertos, protocolos<br>ORG: Handoffs entre departamentos<br>EVT: Puntos de contacto con proveedores |
| **Configuración Crítica** | Parámetros, ajustes o condiciones necesarias para operación | TEC: Variables de entorno<br>INF: Configuraciones de red<br>CON: Especificaciones de materiales<br>EVT: Configuraciones de espacio |
| **Artefacto de Entrega** | Producto, documento o resultado tangible generado | TEC: Código desplegado<br>INF: Sistema funcionando<br>INV: Paper publicado<br>EVT: Evento ejecutado |
| **Verificación/Validación** | Proceso de confirmar que criterios se cumplen | TEC: Tests automatizados<br>CON: Inspecciones físicas<br>ORG: Revisiones de proceso<br>INV: Revisión por pares |
| **Rollback/Reversión** | Plan para restaurar estado anterior si algo falla | TEC: Revertir deployment<br>EVT: Plan B alternativo<br>ORG: Restaurar procesos anteriores<br>CON: Desmontar/remover |

🎛️ MATRIZ DE ADAPTACIÓN POR DOMINIO
# MATRIZ DE ADAPTACIÓN MPC v2.1 - TEMPLATES POR DOMINIO

## CAPA 0: DESCUBRIMIENTO Y CONTEXTO

### Inventario de Activos por Dominio:

| Dominio | Activos Técnicos | Activos Humanos | Activos Físicos | Activos Legales/Financieros |
|---------|------------------|-----------------|-----------------|---------------------------|
| **TEC** | Monorepo, minimarket-system/, supabase/functions/, supabase/migrations/, tests/, CI GitHub Actions | Backend/DevOps, QA, Frontend, DBA | N/A (cloud/SaaS) | Supabase/hosting, licencias y contratos cloud |
| **INF** | Especificaciones, diagramas | Ingenieros, técnicos | Hardware, cables, racks | Permisos, garantías |
| **INV** | Protocolos, metodologías | Investigadores, analistas | Laboratorios, equipos | Aprobaciones éticas, grants |
| **EVT** | Agendas, diseños | Coordinadores, logística | Locaciones, equipos AV | Permisos, seguros, contratos |
| **CON** | Planos, especificaciones | Constructores, arquitectos | Materiales, herramientas | Permisos municipales, fianzas |
| **ORG** | Procesos actuales, métricas | Líderes, equipos afectados | Espacios, mobiliario | Contratos laborales, políticas |

## CAPA 1: MEGA PLANIFICACIÓN

### Estructura de Etapas por Dominio:

**Plantilla Base (adaptar según dominio):**
Etapa E1: Fundación y Gobierno
Etapa E2: Observabilidad y QA
Etapa E3: Datos y Seguridad
Etapa E4: Producto y UX
Etapa E5: Cierre y Transferencia


### Criterios SMART por Dominio:

| Dominio | Específico (S) | Medible (M) | Alcanzable (A) | Relevante (R) | Temporal (T) |
|---------|----------------|-------------|----------------|---------------|--------------|
| **TEC** | Logging estructurado + auditoría RLS P0 | 0 console.* y checklist firmado | Con equipo actual | Estabilidad/seguridad prod | Hito C (12 semanas) |
| **INF** | Instalar 50 nodos de red | 0% downtime durante | Con equipo disponible | Mejora performance | Para fecha X |
| **INV** | Validar hipótesis X | 95% intervalo confianza | Con metodología viable | Responde pregunta investigación | En 8 semanas |
| **EVT** | Ejecutar conferencia | 90% satisfacción asistentes | Con presupuesto asignado | Genera leads/awareness | Fecha específica |
| **CON** | Construir estructura | Cumplir especificaciones | Con materiales disponibles | Satisface necesidad cliente | Según cronograma |
| **ORG** | Implementar proceso | Reducir tiempo 30% | Con apoyo stakeholders | Mejora eficiencia | En próximo trimestre |

## CAPA 2: SUB-PLANIFICACIÓN

### Templates Intercambiables:

**Template TEC (Software):**
Archivos Involucrados:
- minimarket-system/src/pages/Dashboard.tsx: conteo con count real
- minimarket-system/src/pages/Deposito.tsx: movimiento de stock atómico
- supabase/functions/api-minimarket/index.ts: gateway, auth, CORS, rate limit
- supabase/functions/api-proveedor/router.ts: rutas proveedor
- supabase/functions/scraper-maxiconsumo/*: parsing/matching/storage
- supabase/migrations/*.sql: cambios en DB

Endpoints/Puntos Entrada:
- GET /categorias
- GET /productos
- POST /productos (rol deposito/admin)
- GET /proveedores

Modelos de Datos:
- minimarket-system/src/types/* (Producto, Proveedor, Stock, etc.)
- docs/ESQUEMA_BASE_DATOS_ACTUAL.md


**Template INF (Infraestructura):**
Equipos/Componentes:
Switch Cisco Catalyst 9300 (Serial: XXX): Configuración VLANs

Configuraciones Críticas:
VLAN 10: 192.168.1.0/24 - Departamento A

Diagramas de Conexión:
[Referencia a diagrama físico/lógico]


**Template INV (Investigación):**
Protocolos/Metodologías:
Método: Doble ciego aleatorizado

Tamaño muestra: n=100 por grupo

Variables/Parámetros:
Variable independiente: Dosis (0mg, 50mg, 100mg)

Variable dependiente: Tiempo respuesta (ms)

Análisis Planificado:
ANOVA de una vía, post-hoc Tukey


**Template EVT (Eventos):**
Áreas/Estaciones:
Recepción: Mesa registro, 2 voluntarios

Auditorio: 200 sillas, sistema AV

Cronograma Minuto a Minuto:
09:00-09:30: Registro

09:30-09:45: Bienvenida

Listas de Verificación:
Confirmar catering (48h antes)

Probar equipo AV (24h antes)


**Template CON (Construcción):**
Materiales Requeridos:
Concreto: 50m³, resistencia 3000psi

Acero de refuerzo: #4, 200 barras

Equipos/Herramientas:
Mezcladora: Capacidad 1m³

Andamios: 20 unidades, 3m altura

Secuencia Constructiva:
Excavación y nivelación

Armado de formaletas

Colado de cimentación


**Template ORG (Organizacional):**
Procesos/Flujos:
Proceso actual: [Diagrama AS-IS]

Proceso nuevo: [Diagrama TO-BE]

Roles/Responsabilidades:
Owner proceso: Manager Depto X

Ejecutores: Equipo Y (5 personas)

Comunicaciones Planificadas:
Kick-off: Fecha, participantes

Sesiones de entrenamiento: 3 sesiones de 2h


## CAPA 3: EJECUCIÓN

### Estrategias de Ejecución por Dominio:

| Dominio | Estrategia Recomendada | Checkpoints Típicos | Artefactos de Progreso |
|---------|------------------------|---------------------|------------------------|
| **TEC** | Iterativa/incremental | Por commit, por feature | Commits, builds, test results |
| **INF** | Por fases secuenciales | Por componente instalado | Fotos progreso, tests conectividad |
| **INV** | Metodológica/por hipótesis | Por experimento/completado | Datasets, análisis preliminares |
| **EVT** | Por hitos temporales | 24h antes, 1h antes, inicio | Checklists completados, asistencia |
| **CON** | Secuencial crítica | Por etapa constructiva | Fotos, inspecciones, certificados |
| **ORG** | Piloto-escalamiento | Pre-piloto, post-piloto, escalamiento | Feedback, métricas de adopción |

## CAPA 4: CIERRE

### Métricas de Éxito por Dominio:

| Dominio | Técnicas | Proceso | Negocio |
|---------|----------|---------|---------|
| **TEC** | Performance, bugs, uptime | Adherencia timeline, scope creep | ROI, adopción usuarios |
| **INF** | Disponibilidad, latency | Cumplimiento cronograma | TCO, reducción incidentes |
| **INV** | Validez estadística, reproducibilidad | Seguimiento protocolo | Publicaciones, patentes |
| **EVT** | Logística perfecta, timing | Ejecución según agenda | Satisfacción, conversión |
| **CON** | Calidad constructiva, especificaciones | Cumplimiento presupuesto | Satisfacción cliente, durabilidad |
| **ORG** | Adopción, eficiencia proceso | Participación, comunicación | Impacto en KPIs de negocio |

🔄 PROMPTS BASE - MINIMARKET SYSTEM
Instrucciones para agentes IA:
# CONFIGURACIÓN INICIAL PARA AGENTE MPC
Cuando proceses prompts MPC, sigue estos principios:

1. IDENTIFICA DOMINIO: Clasifica el proyecto usando taxonomía MPC
2. SELECCIONA NIVEL: Determina nivel de aplicación (Completo/Intermedio/Essencial)
3. ADAPTA TERMINOLOGÍA: Usa términos del dominio correspondiente
4. APLICA TEMPLATES: Usa templates de la matriz de adaptación
5. MANTIENE ESTRUCTURA: Conserva formato MPC pero con contenido adaptado

Prompt 0.1 Universal: Análisis Inicial del Ecosistema
Analiza el ecosistema de un proyecto siguiendo MPC v2.1 - Capa 0: Descubrimiento y Contexto.

**Información del Proyecto:**
- Nombre: Minimarket System
- Dominio: TEC (Software)
- Herramientas/Recursos Principales: React 18, Vite, TypeScript, Supabase (PostgreSQL + Edge Functions Deno), Vitest, GitHub Actions
- Objetivo Principal: estabilizar y endurecer el sistema para producción (ver docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md)

**Contexto adicional:**
docs/INVENTARIO_ACTUAL.md, docs/BASELINE_TECNICO.md, docs/ESTADO_ACTUAL.md, docs/ROADMAP.md, docs/DECISION_LOG.md, docs/CHECKLIST_CIERRE.md

**Tu tarea:**

1. **Inventario de Activos:**
   - Activos Técnicos/Digitales: [Componentes principales]
   - Activos Humanos: [Roles, habilidades, disponibilidad]
   - Activos Físicos: [Equipos, espacios, materiales]
   - Activos Legales/Financieros: [Permisos, presupuesto, contratos]

2. **Análisis del Stack/Entorno:**
   - Documenta herramientas, métodos o tecnologías principales
   - Identifica versiones, capacidades y limitaciones
   - Señala elementos obsoletos o con riesgo

3. **Extracción de Requerimientos:**
   - Requerimientos Funcionales/Operacionales (Qué debe hacer)
   - Requerimientos No Funcionales/Calidad (Cómo debe funcionar)
   - Restricciones identificadas
   - "Deuda" acumulada (técnica, operacional, de proceso)

4. **Mapeo de Stakeholders:**
   - Roles clave y responsabilidades
   - Nivel de involucramiento necesario
   - Canales de comunicación recomendados

5. **Identificación de Restricciones:**
   - Técnicas/Operacionales
   - Organizacionales (presupuesto, timeline, recursos)
   - Regulatorias/Compliance

**Formato de salida:**
Documento estructurado con:
- Sección 1: Inventario de Activos (por categoría)
- Sección 2: Stack/Entorno Principal
- Sección 3: Matriz de Requerimientos
- Sección 4: Matriz de Stakeholders  
- Sección 5: Registro de Restricciones
- Sección 6: Mapa de "Deuda" Acumulada

**Nombre documento:** docs/C0_DISCOVERY_MINIMARKET_TEC_2026-01-14.md

Comienza el análisis.

Prompt 0.2 Universal: Profundización en "Deuda" Acumulada
Basándote en el análisis de Capa 0 para Minimarket System, profundiza en la "deuda" identificada.

**Deuda acumulada detectada:**
[Lista items encontrados]

**Para cada item, analiza:**

1. **Impacto:**
   - Severidad: Crítico / Alto / Medio / Bajo
   - Áreas afectadas: Funcionalidad, Calidad, Riesgo, Mantenibilidad
   - Consecuencias si no se resuelve

2. **Esfuerzo de remediación:**
   - Tiempo estimado (horas/días/semanas)
   - Recursos necesarios
   - Dependencias con otros componentes

3. **Priorización:**
   - Usa matriz impacto vs esfuerzo:
     * Quick Wins (bajo esfuerzo, alto impacto)
     * Proyectos Mayores (alto esfuerzo, alto impacto)
     * Fill-ins (bajo esfuerzo, bajo impacto)
     * Thankless Tasks (alto esfuerzo, bajo impacto)

4. **Estrategia de remediación:**
   - ¿Abordar ahora o diferir?
   - ¿Parte del proyecto actual o iniciativa separada?
   - ¿Mejora incremental o cambio completo?

**Formato de salida:**
Tabla con columnas: ID | Item | Severidad | Impacto | Esfuerzo | Cuadrante | Estrategia

Proporciona el análisis.

Prompt 0.3 Universal: Validación de Prerequisitos
Hemos completado el análisis de descubrimiento para Minimarket System. Valida si tenemos toda la información necesaria antes de Capa 1.

**Documento Capa 0:**
[Contenido de docs/C0_DISCOVERY_MINIMARKET_TEC_2026-01-14.md]

**Checklist de validación - verifica:**

✅ **Inventario de Activos:**
- [ ] Al menos 80% de componentes principales identificados
- [ ] Activos humanos mapeados (roles, habilidades)
- [ ] Activos físicos documentados (si aplica)
- [ ] Aspectos legales/financieros identificados

✅ **Stack/Entorno:**
- [ ] Herramientas/métodos principales documentados
- [ ] Capacidades y limitaciones claras
- [ ] Elementos de riesgo identificados

✅ **Requerimientos:**
- [ ] Al menos 5 requerimientos funcionales/operacionales
- [ ] Al menos 3 requerimientos no funcionales/de calidad
- [ ] Restricciones claramente documentadas
- [ ] "Deuda" priorizada

✅ **Stakeholders:**
- [ ] Roles clave identificados (mínimo: Sponsor, Líder, Ejecutores)
- [ ] Niveles de involucramiento definidos
- [ ] Canales de comunicación establecidos

✅ **Restricciones:**
- [ ] Restricciones técnicas/operacionales documentadas
- [ ] Budget y recursos clarificados
- [ ] Timeline establecido
- [ ] Requerimientos regulatorios identificados

**Tu tarea:**
1. Revisa cada item del checklist
2. Marca con ✅ o ❌ según completitud
3. Para items ❌, especifica qué información falta
4. Evalúa readiness para Capa 1

**Decisión final:**
- ✅ **LISTO PARA CAPA 1**: Todos criterios cumplidos
- ⚠️ **PROCEDER CON PRECAUCIÓN**: 80-90% completado, gaps menores
- ❌ **REQUIERE MÁS TRABAJO**: Menos del 80% completado

Proporciona evaluación.

Prompt 1.1 Universal: Creación del Mega Plan
Crea el Mega Plan General (Capa 1) para Minimarket System siguiendo MPC v2.1.

**Documento base (Capa 0):**
[Contenido de docs/C0_DISCOVERY_MINIMARKET_TEC_2026-01-14.md]

**Dominio del proyecto:** TEC (Software)
**Objetivo principal:** estabilizar y endurecer el sistema para producción (ver docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md)
**Restricciones críticas:** sin credenciales staging/prod, RLS no auditada, CI gated para integración/E2E

**Tu tarea - crear Mega Plan estructurado con:**

### 1. Consolidación del Alcance
- Sintetiza hallazgos de Capa 0 en 2-3 párrafos
- Define objetivos SMART del proyecto
- Establece límites claros: in-scope vs out-of-scope

### 2. Arquitectura Multinivel
- **Identifica Etapas Maestras (E1, E2, E3...):**
  - Divide en 3-7 bloques lógicos de alto nivel
  - Cada etapa agrupa actividades relacionadas
  - Asigna nombres descriptivos

- **Define Fases por Etapa (F1, F2, F3...):**
  - Subdivide cada etapa en 2-5 fases ejecutables
  - Granularidad media (cada fase = 1-3 días idealmente)
  - Establece inputs/outputs de cada fase

- **Grafo de Dependencias:**
  - Usa notación ASCII para mostrar secuencias
  - Ejemplo: E1 → E2 → E3
                    ↓
                   E4

### 3. Matriz RAID
Crea tabla completa con:
- **Risks:** Mínimo 5 riesgos con probabilidad, impacto, mitigación
- **Assumptions:** Mínimo 3 supuestos críticos que necesitan validación
- **Issues:** Problemas actuales conocidos con severidad y owner
- **Dependencies:** Dependencias externas con tipo y ETA

### 4. Criterios de Éxito SMART
Define criterios específicos y medibles para el proyecto completo.
Usa framework apropiado según dominio (referenciar matriz de adaptación).

### 5. Matriz de Priorización
Crea tabla con columnas: Etapa | Prioridad | Fase | Criticidad | Esfuerzo | Valor | Score
- Prioriza usando P0 (crítico), P1 (alto), P2 (medio), P3 (bajo)
- Ordena por score descendente

### 6. Orden de Ejecución
Propón estrategia de ejecución:
- Opción 1: Secuencial por etapa
- Opción 2: Por prioridad global  
- Opción 3: Paralela (si aplicable)
- Opción 4: [Otra según dominio]
Recomienda la mejor opción con justificación

### 7. Gaps y Solapamientos
- Lista gaps por categoría relevantes al dominio
- Identifica solapamientos con iniciativas existentes
- Propón resolución para cada item

### 8. Log ADR Inicial
Documenta decisiones clave ya tomadas o que deben tomarse

**Formato de salida:**
Documento markdown estructurado siguiendo template de Mega Plan MPC v2.1

**Nombre documento:** docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md

Genera el Mega Plan.

Prompt 1.2 Universal: Refinamiento de Priorización
Refina la matriz de priorización del Mega Plan para Minimarket System.

**Mega Plan actual:**
[Matriz de priorización actual]

**Dominio:** TEC (Software)
**Factores adicionales:**
- Dependencias entre etapas/fases
- Recursos disponibles: [EQUIPO Y SKILLS]
- Constraints de tiempo: [DEADLINES ESPECÍFICOS]
- Valor por componente/feature
- Riesgos de cada etapa (según matriz RAID)

**Tu tarea:**

1. **Re-evalúa cada etapa/fase usando scoring multi-dimensional:**
   - Criticidad (1-5): Importancia para éxito general
   - Valor (1-5): Beneficio entregado
   - Esfuerzo (1-5, inverso: 5=bajo esfuerzo)
   - Riesgo (1-5, inverso: 5=bajo riesgo)
   - Dependencias (1-5, inverso: 5=sin dependencias)

   Score Total = (Criticidad × 2) + (Valor × 2) + Esfuerzo + Riesgo + Dependencias

2. **Identifica el "camino crítico":**
   - ¿Qué etapas/fases son bloqueantes para otras?
   - ¿Cuál es la secuencia mínima viable para tener valor entregable?

3. **Propón un "MCP" (Minimum Credible Product):**
   - Subconjunto que entrega valor mínimo creíble
   - Típicamente 30-40% del alcance total
   - Completable en 1/3 del tiempo total

4. **Identifica "Quick Wins":**
   - Componentes de bajo esfuerzo y alto impacto
   - Candidatos para primeras ejecuciones (generar momentum)

**Salida esperada:**
- Matriz de priorización actualizada con nuevo scoring
- Orden de ejecución revisado con justificación
- Definición clara del MCP path
- Lista de Quick Wins para inicio

Proporciona el análisis refinado.

Prompt 1.3 Universal: Validación del Mega Plan
Valida el Mega Plan completo para Minimarket System antes de Capa 2.

**Mega Plan actual:**
[Contenido de docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md]

**Checklist de Validación - Capa 1:**

✅ **Estructura:**
- [ ] Todas las etapas tienen nombre descriptivo
- [ ] Cada etapa tiene 2-5 fases definidas
- [ ] Grafo de dependencias es claro y sin ciclos
- [ ] Nomenclatura consistente (E1-F1, E1-F2, etc.)

✅ **Completitud:**
- [ ] Matriz RAID tiene mínimo 3 items por categoría
- [ ] Cada riesgo tiene estrategia de mitigación
- [ ] Cada supuesto tiene plan de validación
- [ ] Dependencies tienen owner y ETA

✅ **Criterios de Éxito:**
- [ ] Criterios son SMART
- [ ] Cada etapa tiene criterios de completitud claros
- [ ] Métricas son verificables objetivamente
- [ ] Thresholds están definidos

✅ **Priorización:**
- [ ] Orden de ejecución tiene justificación clara
- [ ] Criticidad P0/P1/P2/P3 está bien distribuida
- [ ] Esfuerzo estimado es realista
- [ ] Dependencias están reflejadas en orden

✅ **Viabilidad:**
- [ ] Plan es ejecutable con recursos disponibles
- [ ] Timeline es realista (no comprimido artificialmente)
- [ ] Riesgos críticos tienen plan de contingencia
- [ ] Hay buffer incorporado (15-30%)

✅ **Gaps:**
- [ ] Todos los gaps tienen owner asignado
- [ ] Gaps críticos tienen plan de resolución
- [ ] Solapamientos identificados y resueltos

**Tu tarea:**
1. Evalúa cada item objetivamente
2. Marca ✅ o ❌ con justificación
3. Para cada ❌, propón corrección específica
4. Identifica riesgos no contemplados
5. Sugiere mejoras adicionales

**Decisión final:**
- ✅ **APROBADO PARA CAPA 2**: Plan robusto
- ⚠️ **APROBADO CON OBSERVACIONES**: Ajustes menores necesarios
- ❌ **REQUIERE REVISIÓN**: Problemas estructurales

**Scoring de calidad (1-10):**
- Claridad: __/10
- Completitud: __/10
- Viabilidad: __/10
- Trazabilidad: __/10
- **Total: __/40**

Proporciona validación completa.

FIN DE PARTE 1/2

En la Parte 2 se cubren:
- Sub-planificación, ejecución y cierre alineados al proyecto.
- Plantillas TEC con rutas y comandos reales del repo.
- Integración con artefactos existentes en docs/ (MPC_INDEX, PLAN_WS_DETALLADO, CHECKLIST_CIERRE).
