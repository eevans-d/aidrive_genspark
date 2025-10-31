# Identificación de Proveedores y Productos para Mini Market: blueprint analítico y plan de implementación

## 1. Introducción y objetivos del análisis

La ambición del Sistema Mini Market para los próximos seis meses es elevar el nivel de automatización de la operación desde un 40% hacia al menos 90%, a la vez que reduce el tiempo de gestión manual en 60% y elimina el 90% de los errores en la actualización de precios. El diagnóstico integral realizado previamente mostró carencias críticas en cuatro frentes: base de datos de productos y proveedores, actualización automática de precios, gestión de inventario y asignación automática de faltantes. Este documento traduce esos hallazgos en un blueprint analítico y un plan de implementación que conectan estándares de datos, procesos de Supplier Relationship Management (SRM), automatización y mecanismos de integración B2B con una hoja de ruta concreta y medible.

El alcance del análisis cubre cinco dominios interdependientes: (1) catálogo y segmentación de proveedores con datos maestros y gobierno; (2) estructura de datos de productos y categorías apoyada en estándares GS1 y buenas prácticas de retail; (3) diseño e implantación de un SRM que instrumente la relación con proveedores y su evaluación continua; (4) motor de automatización para asignación de productos faltantes a proveedores óptimos; y (5) estrategia de integración B2B, con foco en EDI/API, el caso Maxiconsumo y el uso responsable de scraping. La priorización sigue el roadmap aprobado: Fundación (base de datos, APIs core, integración de precios), Gestión inteligente de stock (alertas y auto-reorden), y Analytics/Optimización (dashboards y mejora continua).

En síntesis, este blueprint articula cómo pasar del “qué” al “cómo” y al “para qué”: estándares y modelos de datos para una base sólida (qué), procesos y automatizaciones para reducir fricción y errores (cómo), y métricas/KPIs que justifican el ROI y orientan la mejora continua (para qué). La propuesta se alinea con los objetivos del roadmap y el diagnóstico, y asume el stack recomendado (PostgreSQL, FastAPI/Express, Redis, RabbitMQ, Prometheus/Grafana, ELK), la gobernanza del proyecto y un enfoque iterativo de implementación.

## 2. Metodología, fuentes y supuestos

La metodología se basa en investigación documental de estándares y guías de la industria, extracción de prácticas líderes y traducción de esas referencias a un contexto PyME retail. Se priorizaron fuentes con reconocimiento sectorial: estándares GS1 para identificación, captura y compartición de datos de producto; comparativas y guías sobre EDI vs API; marcos de SRM y evaluación de proveedores; y literatura sobre automatización e inteligencia artificial aplicada a compras y cadena de suministro[^1][^10][^3][^4][^5][^6][^7][^8][^9][^11][^12][^13][^14][^15][^16][^17].

Para asegurar la aplicabilidad, el análisis se mapea contra el diagnóstico y el roadmap internos, extrayendo las brechas críticas y definiciones funcionales ya consensuadas (por ejemplo, la necesidad de sincronizar precios cada 15 minutos, los objetivos de disponibilidad y tiempos de respuesta, y la segmentación esperada del catálogo de proveedores). Se adoptan supuestos explícitos: la disponibilidad de un equipo multidisciplinario, un esquema PostgreSQL inicial ya delineado, y un plan de CI/CD y monitoreo con Prometheus/Grafana y ELK, según el stack aprobado.

Limitaciones y plan para cerrarlas (information gaps):
- Endpoints oficiales y límites de rate de la API de Maxiconsumo Necochea: no documentados públicamente; se asume negociación de credenciales y SLA en Sprint 7, con pruebas de conectividad y resi­liencia (reintentos y fallback).
- Políticas de scraping de proveedores y cumplimiento legal local: se contempla auditoría legal previa y respeto estricto a robots.txt/TOS; el scraping queda como último recurso y bajo salvaguardas.
- Disponibilidad de EDI de proveedores y costos VAN/AS2: a relevar proveedor por proveedor; se prioriza integración API y, cuando no sea posible, EDI gestionado.
- Valores iniciales de pesos del algoritmo de asignación: se definen por categoría y se calibrarán con datos históricos (Sprints 11–12).
- Mapa de categorías propio y taxonomía específica: se construye con negocio en Sprint 1–2, alineado a GS1 GPC y prácticas de retail.
- Definición de umbrales de stock mínimo y políticas de seguridad de API: se formalizan con operaciones y seguridad en Sprint 3–6.

La trazabilidad de requerimientos se gestiona en un RACI de gobierno y un backlog priorizado por impacto en KPIs operativos y de negocio.

## 3. Mejores prácticas para catalogar proveedores (datos necesarios y categorización)

El catálogo de proveedores es la piedra angular del SRM y de cualquier automatización posterior. Un catálogo bien diseñado facilita la homologación, la evaluación y la colaboración con proveedores, y habilita comparaciones transparentes y auditables. Las prácticas recomendadas indican comenzar por delimitar el tipo de catálogo que se necesita (por tiempo, por tipo de producto/servicio y por ubicación), elegir un conjunto mínimo de campos, reunir la información con disciplina y establecer ciclos de actualización con responsables y evidencias[^2]. El proceso de homologación debe integrar una evaluación de desempeño y riesgo, y debe revisarse periódicamente para sostener la calidad y la gobernanza[^3][^4].

La segmentación de proveedores, inspirada en la matriz de Kraljic, distingue entre impacto en costo/beneficio y riesgo de suministro. En retail alimentario, esto se traduce en categorías estratégicas (por ejemplo, frescos con alta criticidad operativa, o marcas con fuerte efecto en la experiencia del cliente) frente a categorías de volumen o rutinarias. El objetivo es desarrollar estrategias diferenciadas por segmento: colaboración estrecha y acuerdos de largo plazo con estratégicos; eficiencia y automatizaciones con preferidos; y vigilancia activa con monitoreo de riesgo para nuevos o con desempeño inconsistente[^3].

La gobernanza del catálogo exige ownership claro (Compras/Legal/Operaciones), controles de calidad (duplicados, campos obligatorios, validaciones), versioning y auditoría de cambios. La seguridad y el cumplimiento (protección de PII, acuerdos de confidencialidad) deben incorporarse desde el diseño.

Para visualizar el alcance de datos y controles, se proponen tres artefactos: el diccionario de campos del proveedor, la matriz de segmentación y un calendario de mantenimiento.

Antes de presentar las tablas, conviene notar que estos instrumentos no son un fin en sí mismos; son la infraestructura de gobierno que permite que la evaluación de desempeño y el SRM sean objetivos y accionables.

Tabla 1. Diccionario de datos del proveedor (mínimos y atributos clave)

| Campo                               | Tipo       | Obligatorio | Validación / Ejemplo                                 | Fuente                   |
|-------------------------------------|------------|-------------|------------------------------------------------------|--------------------------|
| Razón social                        | Texto      | Sí          | Sin小男孩es, verificar inscripción legal             | Onboarding / Legal       |
| Nombre comercial                    | Texto      | Sí          | Estándar de nombre, sin小男孩es                      | Proveedor                |
| Identificación fiscal (CUIT/CIF...) | Texto      | Sí          | Formato y dígito verificador                         | Proveedor / Legal        |
| Representante legal                 | Texto      | Sí          | Nombre y cargo                                       | Proveedor                |
| Contacto compras                    | Texto      | Sí          | Email válido, teléfono                               | Proveedor                |
| Teléfono                            | Texto      | Sí          | Formato local/Internacional                          | Proveedor                |
| Dirección                           | Texto      | Sí          | Calle, número, localidad, país                       | Proveedor                |
| Correo electrónico                  | Texto      | Sí          | Validación SMTP básica                               | Proveedor                |
| Sitio web                           | Texto      | No          | Formato URL                                          | Proveedor                |
| Ubicación (cobertura)               | Texto      | No          | Local/Nacional/Internacional                         | Proveedor                |
| Tipo de negocio                     | Lista      | Sí          | Mayorista/Distribuidor/Fabricante                   | Proveedor                |
| Estado (activo/inactivo)            | Lista      | Sí          | Cambios con fecha y responsable                      | Compras                  |
| Configuración API (si aplica)       | JSON       | No          | Endpoints, auth, rate limits                         | Integración              |
| Condiciones comerciales             | JSON       | No          | Incoterms, términos de pago                          | Compras                  |
| Evaluaciones y KPIs                 | JSON       | No          | OTIF, calidad, costo, servicio                       | SRM                      |
| Certificaciones / Compliance        | Lista      | No          | Alimentario, seguridad, sostenibilidad               | Legal / Calidad          |

Fuente: mejores prácticas de catálogo y homologación[^2][^3][^4].

La tabla anterior fija el estándar mínimo. El valor está en su uso: validaciones y evidencias en onboarding, y su integración con contratos, evaluaciones y configuraciones de integración.

Tabla 2. Matriz de segmentación de proveedores (Kraljic adaptado)

| Categoría         | Criterios principales                                      | Estrategia recomendada                                   | Ejemplos indicativos              |
|-------------------|-------------------------------------------------------------|----------------------------------------------------------|-----------------------------------|
| Estratégicos      | Alto impacto en ventas/experiencia; alto riesgo/escases     | Acuerdos marco, VMI/CPFR, innovación conjunta           | Lácteos frescos, marcas líderes   |
| Preferidos        | Buen desempeño; riesgo moderado; volumen consistente        | Órdenes automatizadas, renovación programada             | Bebidas, limpieza                  |
| Transaccionales   | Bajo riesgo; volumen rutinario                             | Eficiencia, automatizar RFQ/PO, mínima intervención     | Descartables,灯泡s                 |
| Emergentes        | Potencial no comprobado; riesgo incierto                    | Pilotos, scoring intensivo, objetivos de mejora          | Nuevos proveedores regionales     |

Fuente: proceso SRM y segmentación[^3][^4].

La segmentación guía la asignación de recursos del SRM y las reglas del motor de asignación. Debe revisarse trimestralmente para capturar cambios de riesgo y desempeño.

Tabla 3. Calendario de mantenimiento del catálogo

| Tarea                               | Frecuencia | Responsable | Evidencia/Control de cambio                |
|-------------------------------------|------------|------------|--------------------------------------------|
| Validación de datos maestros        | Mensual    | Compras    | Reporte de validación y tickets            |
| Actualización de KPIs SRM           | Mensual    | SRM Lead   | Scorecard y tendencias                     |
| Revisión legal/contratos            | Semestral  | Legal      | Checklist de cumplimiento                  |
| Auditoría de usuarios y accesos     | Trimestral | Seguridad  | Matriz de accesos                          |
| Verificación de endpoints/API       | Trimestral | Integración| Prueba de salud y límites de rate          |

Fuente: gobierno de SRM y catálogo[^3][^4].

### 3.1 Segmentación y scoring

Un sistema de scoring robusto combina métricas cuantitativas y cualitativas, con ponderaciones transparentes y normalización para evitar sesgos. Métricas típicas incluyen OTIF (On-Time In-Full), tasa de defectos, costo por unidad, tiempo de entrega, cumplimiento regulatorio, huella de carbono y velocidad de comunicación. La evaluación debe ocurrir en tres horizontes: homologación inicial, revisiones trimestrales y reevaluaciones triggered por incidentes. La comunicación de resultados se hace de forma individual, con planes de mejora acordados, y alimenta la segmentación (recompensar, desarrollar, colaborar, monitorear)[^4].

Tabla 4. Cuadro de métricas de desempeño de proveedores

| Métrica                 | Definición                                 | Fórmula/Medición                  | Fuente de datos       | Frecuencia | Ponderación sugerida |
|-------------------------|---------------------------------------------|-----------------------------------|-----------------------|------------|----------------------|
| OTIF                    | Entrega a tiempo y completa                 | % pedidos OTIF                    | EDI/API, WMS          | Mensual    | 25%                  |
| Tasa de defectos        | Calidad de producto/servicio                | % unidades defectuosas            | QA/Receiving          | Mensual    | 20%                  |
| Costo por unidad (CPU)  | Eficiencia de precio                        | Precio unitario                   | PO/Invoice            | Mensual    | 20%                  |
| Lead time               | Velocidad de entrega                        | Días desde PO a recepción         | EDI/API               | Mensual    | 15%                  |
| Cumplimiento regulatorio| Adhesión a normas                           | % auditorías cumplidas            | Legal/QA              | Semestral  | 10%                  |
| Capacidad de respuesta  | Agilidad de comunicación                    | SLA de respuesta                  | SRM system            | Mensual    | 10%                  |

Fuente: prácticas de evaluación y scoring[^4][^3].

Las ponderaciones son un punto de partida; deben afinarse con datos y con el negocio (por ejemplo, en frescos la frescura/lead time puede tener más peso).

### 3.2 Gobierno del catálogo

El gobierno define quién hace qué, con qué controles y en qué plazos. Se propone el siguiente RACI y un checklist de calidad.

Tabla 5. RACI del catálogo de proveedores

| Actividad                        | Negocio (Compras) | Legal | Operaciones | Integración | SRM Lead | Seguridad |
|----------------------------------|-------------------|-------|-------------|-------------|----------|-----------|
| Definición de campos y validaciones| A                 | C     | C           | C           | R        | C         |
| Onboarding y due diligence        | R                 | A     | C           | C           | C        | C         |
| Contratos y T&C                   | C                 | A     | C           | C           | C        | C         |
| Configuración API/EDI             | C                 | C     | C           | A           | C        | R         |
| Evaluación y scoring              | C                 | C     | C           | C           | A        | C         |
| Auditoría de acceso               | C                 | C     | C           | C           | C        | A         |

A: Approver, R: Responsible, C: Consulted.

Tabla 6. Checklist de calidad de datos del proveedor

| Regla                                     | Validación automática | Responsable |
|-------------------------------------------|-----------------------|-------------|
| Campos obligatorios completos              | Sí                    | Compras     |
| Formato de email/teléfono                  | Sí                    | Compras     |
| Identificación fiscal válida               | Sí                    | Legal       |
| No duplicados (razón social/CUIT)          | Sí                    | SRM Lead    |
| Estado coherente con última actividad      | Sí                    | SRM Lead    |
| Configuración API consistente y segura     | Sí                    | Integración |

Fuente: disciplina de catálogo y SRM[^2][^3][^4].

## 4. Estructuras de datos para productos y categorías

La calidad del catálogo de productos determina la eficacia de la gestión de precios, stock y asignación. La referencia GS1 (Global Standards 1) proporciona un lenguaje común para identificar, capturar y compartir datos, con claves como GTIN (Global Trade Item Number) para productos, GLN (Global Location Number) para ubicaciones y SSCC (Serial Shipping Container Code) para unidades logísticas. Complementariamente, los Application Identifiers (AI) definen el significado y formato de los atributos, y el GS1 Digital Link conecta identidades con contenido digital estandarizado. La clasificación de productos se apoya en el Global Product Classification (GPC), y el intercambio de datos puede realizarse vía GDSN, EPCIS o mensajes EDI/XML según el caso de uso[^1][^17].

En el plano semántico, schema.org/Product ofrece un esquema ampliamente aceptado para describir productos en e‑commerce, mientras que la práctica de retail sugiere limitar la profundidad de categorías de primer nivel, usar subcategorías y breadcrumbs, y definir filtros y colecciones inteligentes que reflejen cómo compra el cliente. Esto mejora la navegación, el SEO y la analítica de surtido[^5]. Para interoperabilidad y validaciones, JSON Schema y OpenAPI 3.0 brindan reglas de validación y documentación de modelos/contratos; y Vertex AI Retail y Google Retail API ilustran patrones modernos de estructuración de catálogos y atributos de producto en plataformas de búsqueda y recomendación[^14][^13][^15][^16].

El diagnóstico interno propone un esquema PostgreSQL con tablas para proveedores, productos, precios por proveedor, stock por depósito y categorías, con índices y triggers de auditoría. Ese diseño se integra de forma natural con los estándares y prácticas señalados.

Para alinear el modelo interno con las claves GS1 y los requisitos EDI, se presentan dos tablas de mapeo.

Tabla 7. Mapeo de campos internos ↔ GS1 ↔ schema.org

| Concepto interno     | Campo interno (ej.)         | GS1 (clave/atributo)     | schema.org/Product (atributo)     | Notas de implementación                   |
|----------------------|-----------------------------|---------------------------|-----------------------------------|-------------------------------------------|
| Producto             | productos.codigo_barras     | GTIN + AI                 | sku / gtin                        | Validar GTIN y AIs en recepción           |
| Producto             | productos.nombre            | —                         | name                              | Estándar de nombre y marca                |
| Producto             | productos.marca             | —                         | brand                             | Normalizar marca                          |
| Producto             | productos.unidad_medida     | AI (peso/volumen)         | measurementTechnique / offers     | Unificar unidades SI                      |
| Categoría            | categorias.nombre           | GPC (Brick/Segment)       | category                          | Mapa propio ↔ GPC                         |
| Ubicación            | proveedores.ubicacion       | GLN                       | address / areaServed              | GLN si aplica a almacenajes               |
| Unidad logística     | —                           | SSCC                      | —                                 | En recepción y despachos                  |
| Precios por proveedor| precios_proveedor.precio    | —                         | offers.price                      | Moneda, impuestos                         |
| Imágenes             | —                           | GS1 Digital Link          | image / url                       | Resolución, CDN                           |
| Trazabilidad         | —                           | EPCIS                     | —                                 | Eventos de movimiento/estado              |

Fuente: estándares GS1 y schema.org[^1][^17].

Tabla 8. Mapa de atributos EDI (850/855/810/846/832) ↔ modelo interno

| Documento EDI | Uso típico                        | Campos clave                                  | Tablas internas impactadas           |
|---------------|-----------------------------------|-----------------------------------------------|--------------------------------------|
| 850           | Orden de compra                   | Nro. PO, líneas (SKU, qty, price)             | pedidos, pedido_items                |
| 855           | Acknowledgement de PO             | Aceptación/rechazo, motivos                   | pedidos.status                       |
| 810           | Factura                           | Invoice number, taxes, total, líneas          | facturas, factura_items              |
| 846           | Inventario/Stock                  | SKU, on-hand, available                       | stock_deposito                       |
| 832           | Catálogo/Precios                  | SKU, price, validity, product description     | productos, precios_proveedor         |

Fuente: transacciones EDI comunes en retail[^9].

Además, para asegurar consistencia y calidad, se definen reglas de validación.

Tabla 9. Reglas de validación de catálogo de productos

| Regla                               | Tipo       | Validación                                          | Severidad |
|-------------------------------------|------------|-----------------------------------------------------|-----------|
| GTIN válido                         | GS1        | Longitud y dígito verificador según symbology       | Alta      |
| Campos obligatorios                 | Schema     | name, brand, category, gtin                         | Alta      |
| Unidad de medida normalizada        | Schema     | Tabla de conversión (kg, lt, unidad)                | Media     |
| Fechas válidas (vigencia de precio) | Schema     | ISO 8601, fecha fin ≥ fecha inicio                  | Media     |
| Moneda e impuestos coherentes       | Schema     | ISO 4217, taxes included/excluded                   | Alta      |
| Relaciones (FK)                     | DB         | producto_id, proveedor_id, categoria_id             | Alta      |

Fuente: GS1, JSON Schema, Google Retail/Vertex AI[^1][^14][^13][^15][^16].

### 4.1 Modelo lógico y relaciones

El modelo lógico propuesto en el diagnóstico se refuerza con claves GS1 y semantic web. Las entidades núcleo —Proveedor, Producto, Categoría, Stock (por depósito), Precios por proveedor— se relacionan de forma que permitan trazabilidad: el precio es una vista contextual del proveedor y del momento; el stock refleja disponibilidad por ubicación física; y las categorías se modelan como jerarquías con roles (atracción de tráfico, rotación, rentabilidad), alineados a la gestión de categorías en retail[^5]. Los metadatos (versionado, validaciones y auditoría) se instrumentan con triggers y campos “updated_at”.

Tabla 10. Relaciones y cardinalidades

| Relación                      | Cardinalidad | Notas                                                   |
|------------------------------|--------------|---------------------------------------------------------|
| Proveedor–Precios            | 1:N          | Un proveedor, múltiples precios por producto y vigencia |
| Producto–Precios             | 1:N          | Variantes por proveedor y condiciones comerciales       |
| Producto–Stock (depósito)    | 1:N          | Múltiples depósitos/ubicaciones                         |
| Categoría–Producto           | 1:N          | Jerarquía, soporte de breadcrumbs                       |
| Producto–Atributos (SEO)     | 1:1          | Schema.org Product                                      |

Fuente: diagnóstico interno y prácticas de retail[^5].

### 4.2 Taxonomía y gestión de categorías

Una buena taxonomía reduce la fricción del cliente y mejora la analítica. Se recomienda limitar las categorías de primer nivel y profundizar en subcategorías; utilizar breadcrumbs y colecciones inteligentes (por ejemplo, más vendidos, nuevos, promociones), y definir filtros útiles como precio, marca, tamaño y atributos relevantes del segmento. Las páginas de categoría deben tener plantillas consistentes, imágenes y descripciones optimizadas para SEO, con estructura de metacampos y enlaces internos que ayuden a la indexación y la navegación[^5].

Tabla 11. Jerarquía propuesta de categorías (ejemplo)

| Nivel 1     | Nivel 2                 | Nivel 3 (ej.)                | Observaciones de gestión de surtido     |
|-------------|-------------------------|------------------------------|-----------------------------------------|
| Alimentos   | Lácteos                 | Leche, Yogur, Quesos         | Rotación alta; cadenas de frío          |
| Bebidas     | Sin alcohol             | Gaseosas, Jugos, Aguas       | Promociones y estacionalidad            |
| Limpieza    | Detergentes             | Ropa, Vajilla, Multiusos     | Marcas sustitutas                       |
| Higiene     | Cuidado personal        | Shampoo, Pasta dental        | Sensibilidad a importado/local          |
| Hogar       | Descartables            | Pañuelos, Platos              | Volumen y márgenes                      |

Fuente: principios de gestión de categorías en retail[^5].

## 5. Sistema de Gestión de Relaciones con Proveedores (SRM)

Un SRM efectivo no es un “registro de proveedores”, sino un marco vivo que segmenta, define estrategias, construye relaciones, ejecuta y mejora de forma continua. Este ciclo —segmentación, estrategia, construcción de relaciones, ejecución y monitoreo— permite pasar de la compra transaccional a la creación de valor conjunto, con menores costos, mayor resiliencia y mejor servicio[^3][^4].

Los componentes tecnológicos abarcan homologación y calificación, evaluación de riesgo, scorecards, workflows de contratos y comunicación/presupuestos. La práctica en retail muestra la utilidad de plataformas que integren la colaboración (por ejemplo, solicitudes de presupuesto, comparación y aprobación, conversión a órdenes gestionables), y que brinden visibilidad de desempeño, alertas y analítica en tiempo real[^4].

Tabla 12. Proceso SRM paso a paso (entradas/salidas, responsables, métricas)

| Paso                        | Entradas                               | Salidas                                   | Responsable    | Métricas clave               |
|----------------------------|----------------------------------------|-------------------------------------------|----------------|------------------------------|
| Segmentación               | Spend, riesgo, criticidad              | Matriz Kraljic actualizada                | SRM Lead       | % proveedores por categoría  |
| Estrategia por segmento    | KPIs, objetivos de negocio             | Plan de relación/contratos                | Compras        | Savings, plazo, TCO          |
| Homologación/Calificación  | Datos, auditorías, desempeño histórico | Proveedor aprobado/preferido              | Compras/Legal  | Tiempo de onboarding         |
| Construcción de relación   | Objetivos compartidos, roadmaps        | Acuerdos de servicio y mejora             | SRM Lead       | OTIF, NPS proveedor          |
| Ejecución y monitoreo      | Orders, ASNs, incidencias              | Scorecards y alertas                      | Operaciones    | OTIF, Defects, SLA           |
| Mejora continua            | Resultados y feedback                   | Ajustes de estrategia/pesos               | PMO/SRM        | Tendencias KPI               |

Fuente: marcos SRM y guías de implementación[^3][^4].

Tabla 13. Catálogo de KPIs del SRM y su cálculo

| KPI                      | Descripción                          | Fórmula                                      | Fuente           | Frecuencia |
|--------------------------|--------------------------------------|----------------------------------------------|------------------|------------|
| OTIF                     | Entrega a tiempo y completa          | Entregas OTIF / Total entregas                | EDI/API, WMS     | Mensual    |
| Tasa de defectos         | Calidad de recepción                 | Unidades defectuosas / Total recibidas       | QA               | Mensual    |
| Ahorros (Savings)        | Mejora de costo                      | (Costo base − Costo actual) × Volumen        | PO/Invoice       | Mensual    |
| Lead time                | Tiempo de entrega                    | Fecha recepción − Fecha PO                    | EDI/API          | Mensual    |
| Cumplimiento regulatorio | Auditorías cumplidas                 | Auditorías cumplidas / Auditorías totales    | Legal/QA         | Semestral  |

Fuente: marcos SRM y mejores prácticas[^3][^4].

### 5.1 Implementación en Mini Market

Se propone un roadmap de adopción en tres oleadas: pilotos con proveedores clave, estandarización de procesos y despliegue progresivo. La medición y comunicación de desempeño a los proveedores es bidireccional: ellos reciben su scorecard y pueden aportar feedback sobre nuestra propia ejecución (evaluación 360°). La automatización de alertas por desviaciones (por ejemplo, OTIF < objetivo) permite acciones correctivas oportunas. La selección de herramientas SRM debe privilegiar capacidades de colaboración, trazabilidad, integraciones y gobierno de datos[^4][^3].

## 6. Automatización en asignación de productos a proveedores

El problema de negocio es claro: cuando un producto está por debajo del stock mínimo, el sistema debe identificar el mejor proveedor en tiempo casi real, considerando precio, disponibilidad, lead time, desempeño histórico y urgencia. La literatura de compras sugiere combinar optimización con software centralizado, predicción basada en datos y enfoque de costo total de propiedad (TCO); la automatización en cadena de suministro aporta RPA, WMS, ERP y ML/IA para reducir errores, acelerar procesos y escalar sin degradar la calidad[^6][^7]. Las técnicas de ML para selección de proveedores y optimización de compras han madurado, con revisiones sistemáticas y frameworks que combinan scoring multicriterio y aprendizaje para mejorar precisión y resiliencia[^11][^12].

El motor propuesto compone un score ponderado normalizado y un mecanismo de reglas para condiciones especiales (por ejemplo, cortesía de stocks en emergencias, exclusividades temporales). La salida del motor no es sólo el proveedor seleccionado: se generan PO/OCR, se actualizan estados y se registran evidencias para auditoría.

Tabla 14. Matriz de criterios y pesos por categoría (valores iniciales)

| Categoría   | Precio | Stock/Disponibilidad | Lead time | OTIF | Calidad | Innovación | Riesgo | Observaciones                   |
|-------------|--------|----------------------|-----------|------|---------|------------|--------|---------------------------------|
| Frescos     | 20%    | 30%                  | 30%       | 10%  | 5%      | 5%         | 0%     | Crítico el tiempo y la frescura |
| Bebidas     | 30%    | 20%                  | 20%       | 15%  | 5%      | 5%         | 5%     | Volumen, promociones            |
| Limpieza    | 35%    | 15%                  | 15%       | 15%  | 10%     | 5%         | 5%     | Sustitución fácil               |
| Higiene     | 30%    | 20%                  | 20%       | 15%  | 5%      | 5%         | 5%     | Sensible a regulaciones         |
| Hogar       | 35%    | 15%                  | 15%       | 15%  | 10%     | 5%         | 5%     | Margen y rotación               |

Nota: Pesos iniciales propuestos; se calibrarán en Sprints 11–12 con datos reales[^6][^7][^11][^12].

Tabla 15. Mapa de eventos y reglas (ejemplos)

| Evento                                 | Condición                                | Acción                                  | Prioridad |
|----------------------------------------|------------------------------------------|-----------------------------------------|-----------|
| Stock por debajo de mínimo             | Stock ≤ Stock mínimo                      | Ejecutar motor de asignación            | Alta      |
| Lead time proveedor > SLA categoría    | Lead time > umbral por categoría         | Recalcular score y reordenar           | Media     |
| OTIF proveedor < objetivo              | OTIF < objetivo dos ciclos               | Penalizar score y sugerir backup        | Alta      |
| Emergencia (pedido urgente)           | Urgencia = “same-day”                     | Seleccionar proveedor con menor lead    | Crítica   |
| Precio superior a techo por categoría  | Precio > precio máx.                      | Buscar proveedor alterno                | Media     |

Fuente: prácticas de optimización y automatización en cadena de suministro[^6][^7].

### 6.1 Diseño del motor de asignación

La función de utilidad combina criterios cuantitativos (precio, stock, lead time, OTIF, calidad) y cualitativos (innovación, colaboración) con pesos por categoría. Los pasos: normalización, aplicación de pesos, cálculo de penalizaciones por SLA incumplidos, tie‑break por desempeño reciente, y generación de la PO. El mecanismo aprende con datos: ajusta pesos y umbrales por categoría en función de outcomes (por ejemplo, quiebres de stock evitados, savings efectivos, tiempos reales vs estimados)[^11].

Tabla 16. Definición de umbrales y SLA por categoría (ejemplos)

| Categoría | Stock mínimo (días) | Lead time máx. (días) | OTIF objetivo | Observaciones                  |
|-----------|----------------------|------------------------|---------------|-------------------------------|
| Frescos   | 1–2                  | 1                      | 95%           | VMI donde aplique             |
| Bebidas   | 3–5                  | 2–3                    | 93%           | Volumen y estacionalidad      |
| Limpieza  | 5–7                  | 3                      | 92%           | Sustitución y marcas          |
| Higiene   | 5–7                  | 3                      | 93%           | Regulación y trazabilidad     |
| Hogar     | 7–10                 | 4                      | 92%           | Rotación y espacio en góndola |

Nota: Valores de referencia; se calibran con históricos y acuerdos con proveedores[^6].

### 6.2 Flujo operativo end-to-end

El flujo inicia con la detección de stock bajo (evento), invoca el motor de asignación (REST/queue), que consulta datos maestros (productos, proveedores, KPIs), consulta disponibilidad y precios (EDI/API), selecciona el mejor proveedor, genera la PO (EDI 850 o API de proveedor), confirma la recepción (855), registra evidencias, actualiza el tablero de estado y emite alertas si hay desvíos. La observabilidad incluye trazabilidad de decisiones y auditoría de cambios.

Tabla 17. Mapa de estados de la solicitud y trazabilidad

| Estado                 | Descripción                          | Eventos de transición                | Evidencias                    |
|------------------------|--------------------------------------|--------------------------------------|-------------------------------|
| Solicitado             | Detección de stock bajo              | Trigger desde WMS                    | Log de evento                 |
| En evaluación          | Motor ejecutando                     | Completar scoring                    | Score detallado               |
| Aprobado               | Proveedor seleccionado               | Validaciones de negocio              | PO generada                   |
| Enviado                | PO enviada al proveedor              | EDI 850 / API POST                   | ACK 855 / respuesta API       |
| Confirmado             | Confirmación de recepción            | 855 recibida / API ack               | Documento EDI / log           |
| Recebido               | Mercadería recepcionada              | ASN/Receiving                        | Guía de remisión / invoice    |
| Cerrado                | Operación completada                 | Sin incidencias                      | Registro de auditoría         |

Fuente: transacciones EDI comunes y automatización de POs[^9][^6].

## 7. Integración con plataformas de proveedores (scraping, APIs, EDI)

La integración B2B combina dos paradigmas: EDI (Electronic Data Interchange), estándar industrial para documentos de alto volumen y complejidad (por ejemplo, órdenes de compra, facturas, estatus de inventario), y APIs (Application Programming Interfaces), más adecuadas para datos ligeros y operaciones en tiempo real, especialmente en e‑commerce y marketplaces. En la práctica, muchas cadenas minoristas operan con ambos: EDI para B2B “pesado” y APIs para e‑commerce; elegir o combinar depende del volumen, complejidad, SLA y el ecosistema de cada socio[^10][^9].

El canal de transporte más común para EDI es AS2 (Applicability Statement 2) sobre HTTPS con adjuntos S/MIME, o el uso de una VAN (Value-Added Network) que intercone las partes y gestione mapeos, cumplimiento y visibilidad. La decisión AS2 directo vs VAN implica trade‑offs de control, costo, onboarding y soporte[^18][^19].

Tabla 18. Comparativa EDI vs API

| Criterio                | EDI                                            | API                                             |
|-------------------------|------------------------------------------------|-------------------------------------------------|
| Estandarización         | Estándar de industria                          | Sin estándar; específico por socio              |
| Complejidad de datos    | Alta, documentos con múltiples líneas y campos | Baja/media, payloads acotados                   |
| Volumen/SLA             | Alto volumen, batch                            | Tiempo real, latencias bajas                    |
| Mantenimiento           | Mapeos/versiones de documentos                 | Versiones de endpoints                          |
| Onboarding              | Puede ser lento sin plataforma gestionada      | Puede ser rápido con API bien documentadas      |
| Uso típico              | 850/855/810/846/832                            | Pedidos e‑commerce, pricing/stock en tiempo real|

Fuente: guías EDI vs API y transacciones retail[^10][^9][^20].

Tabla 19. Documentos EDI prioritarios y mapeo a tablas internas

| Documento | Propósito               | Mapeo a modelo interno                         |
|-----------|-------------------------|-----------------------------------------------|
| 850/855   | PO y acknowledgment     | pedidos, pedido_items, pedidos.status         |
| 810       | Facturación             | facturas, factura_items                        |
| 846       | Inventario              | stock_deposito                                 |
| 832       | Catálogo y precios      | productos, precios_proveedor                   |

Fuente: EDI en retail e integración con sistemas[^9][^20].

Tabla 20. AS2 vs VAN: escenarios y criterios

| Opción | Pros                                           | Contras                                  | Escenario recomendado                |
|--------|------------------------------------------------|-------------------------------------------|--------------------------------------|
| AS2 directo | Control directo, menor costo recurrente     | Mayor esfuerzo de mapeo y operación       | Pocos socios, alto control           |
| VAN    | Onboarding simplificado, visibilidad y soporte| Costo recurrente, dependencia de tercero   | Muchos socios, urgencia de go‑live   |

Fuente: protocolos EDI y comparación AS2/VAN[^18][^19].

Scraping responsable: se utiliza únicamente cuando no hay API/EDI disponibles y la información es pública. Siempre se debe verificar robots.txt y TOS, aplicar rate limiting, evitar PII y respetar la carga del sitio; el cumplimiento legal y ético es innegociable[^21][^22][^23][^24].

### 7.1 Caso Maxiconsumo: integración propuesta

Para Maxiconsumo, se asume integración API como canal principal con autenticación tipo API Key y headers de ubicación (por ejemplo, X-Location: necochea), una vez negociadas credenciales y SLA. El plan contempla sincronización de precios, stock y catálogo, y creación de pedidos. En paralelo, se valida la alternativa EDI para ciertos documentos si el proveedor la habilita. Se propone un plan de pruebas y resiliencia.

Tabla 21. Plan de integración Maxiconsumo

| Actividad                   | Entregable                          | Responsable      | Riesgo                     |
|----------------------------|-------------------------------------|------------------|---------------------------|
| Negociación de credenciales| API Key y términos de uso           | Legal/Compras    | Demora en onboarding      |
| Conectividad y seguridad   | Autenticación y rate limiting       | Integración      | Rate limit no documentado |
| Endpoints de catálogo      | /productos, /precios, /stock        | Integración      | Cambios de esquema        |
| Flujo de pedidos           | /pedidos (crear)                    | Integración      | Validaciones del lado loro|
| Resiliencia                | Retrys, backoff, fallback           | Integración/DevOps| Timeouts, errores         |
| Pruebas de aceptación      | Casuística y volumen                 | QA               | Regresiones               |

Fuente: prácticas de integración y automatización de POs[^10][^6].

## 8. Roadmap de implementación (alineado al proyecto Mini Market)

El roadmap se organiza en cuatro fases con entregables, responsables y KPIs asociados. La gobernanza del proyecto ya definida —ritmos de comunicación, gestión de cambios y reportes— sustenta la ejecución disciplinada.

Tabla 22. Hitos y entregables por fase (Semanas 1–22)

| Fase (Sprints)       | Entregables clave                                                                 | KPIs de aceptación                            |
|----------------------|------------------------------------------------------------------------------------|-----------------------------------------------|
| Fundación (1–8)      | Esquema DB, APIs core, integración de precios, conector Maxiconsumo               | Disponibilidad ≥ 99.5%; latencia < 2s         |
| Stock inteligente (9–12)| Alertas de stock, motor de asignación, auto‑reorden, pruebas E2E                 | Stock‑outs −70%; asignación automática ≥ 85%  |
| Analytics (13–18)    | Dashboard y KPIs, modelos predictivos, optimización de performance                 | Precisión inventario 99%; savings instrumentado|
| Go‑live (19–22)      | Producción, migración, monitoreo 24/7, estabilización                              | Uptime ≥ 99.9%; tiempo de respuesta < 2s      |

Fuente: roadmap y métricas del proyecto.

Tabla 23. Matriz de riesgos y mitigaciones (extracto)

| Riesgo                               | Probabilidad | Impacto | Plan de mitigación                                      |
|--------------------------------------|--------------|---------|---------------------------------------------------------|
| Integración Maxiconsumo compleja     | Media‑Alta   | Alto    | POC temprano, SLA, fallback EDI/API                     |
| Migración de datos y calidad         | Media        | Alto    | Backups, dry‑runs, validaciones                         |
| Performance en picos                 | Media        | Medio   | Tests de carga, índices, caching                        |
| Resistencia al cambio                | Media        | Medio   | Capacitación, champions, feedback continuo              |

Fuente: gestión de riesgos del proyecto.

Tabla 24. RACI de implementación (tareas críticas)

| Tarea                           | PM  | Arquitecto | DBA | Backend | QA | DevOps | SRM Lead | Compras | Legal |
|---------------------------------|-----|------------|-----|---------|----|--------|----------|---------|-------|
| Esquema de DB                   | C   | A          | R   | C       | C  | C      | C        | C       | C     |
| APIs core                       | C   | A          | C   | R       | C  | C      | C        | C       | C     |
| Conector Maxiconsumo            | C   | A          | C   | R       | C  | C      | C        | C       | A     |
| Motor de asignación             | C   | A          | C   | R       | C  | C      | C        | C       | —     |
| SRM y scorecards                | C   | C          | —   | C       | C  | —      | A        | R       | C     |
| Monitoreo y alertas             | C   | C          | —   | C       | C  | A      | —        | —       | —     |

### 8.1 Prioridades y dependencias

Las dependencias técnicas clave incluyen: (1) el esquema de base de datos antes de APIs y conectores, (2) la normalización de catálogos antes del motor de asignación, (3) la disponibilidad de integraciones (API/EDI) antes de la automatización de POs, y (4) el monitoreo desde el inicio para observar la transición y detectar regresiones. La estrategia de pruebas cubre unitarias, integración, E2E y performance, con criterios de aceptación explícitos en el checklist de producción del roadmap.

## 9. KPIs y métricas de éxito

Las métricas deben reflejar objetivos operativos, de negocio y técnicos. Operativamente, se busca reducir tiempo de gestión manual, errores de precios y stock‑outs; tecnicamente, asegurar disponibilidad, latencia y performance; estratégicamente, elevar savings, TCO y ROI.

Tabla 25. Definición de KPIs (fórmulas y fuentes)

| KPI                         | Fórmula / Definición                                        | Fuente        | Objetivo         |
|-----------------------------|--------------------------------------------------------------|---------------|------------------|
| Tiempo de gestión manual    | Horas invertidas por periodo                                 | Timesheets    | −60%             |
| Errores de precios          | # incidentes de precio / # actualizaciones                   | QA/Logs       | −90%             |
| Stock‑outs                  | # productos sin stock / # SKUs                               | WMS           | −70%             |
| Disponibilidad (uptime)     | % tiempo operativo                                           | Monitoring    | ≥ 99.9%          |
| Latencia API p95            | Percentil 95 de tiempo de respuesta                          | Monitoring    | < 2s             |
| Precisión de inventario     | 1 − |Δ inventario| / inventario físico                        | WMS/QA        | 99%             |
| OTIF                        | Ver Tabla 13                                                 | EDI/API       | ≥ 93–95%         |
| Savings                     | Σ (Costo base − Costo actual) × Volumen                      | PO/Invoice    | +40%             |
| ROI                         | (Beneficios − Inversión) / Inversión                         | Finanzas      | > 300% a 18 meses|

Fuente: objetivos del roadmap y buenas prácticas[^6][^3][^5].

Tabla 26. Tablero de métricas operativas vs objetivos

| Métrica                  | Actual (diagnóstico) | Objetivo              | Estado inicial | Progreso |
|--------------------------|----------------------|-----------------------|----------------|----------|
| Automatización           | 40%                  | 90%                   | Bajo           | —        |
| Disponibilidad           | 95%                  | 99.9%                 | Medio          | —        |
| Precisión inventario     | 70%                  | 99%                   | Bajo           | —        |
| Stock‑outs               | —                    | −80%                  | —              | —        |
| OTIF                     | —                    | ≥ 93–95%              | —              | —        |

## 10. Anexos técnicos (modelos, JSON schemas, mapeos EDI)

Los anexos proveen plantillas y validaciones para acelerar el desarrollo y asegurar consistencia entre equipos y proveedores.

Tabla 27. Mapeo de campos JSON Schema ↔ modelo interno

| JSON (OpenAPI/JSON Schema) | Tipo     | Regla de validación                       | Notas                                      |
|----------------------------|----------|-------------------------------------------|--------------------------------------------|
| sku                        | string   | required, pattern [A-Z0-9]+               | Mapea a productos.codigo_barras            |
| gtin                       | string   | minLength 8, maxLength 14                 | Validación GTIN                            |
| name                       | string   | required, minLength 3                     | productos.nombre                           |
| brand                      | string   | required                                   | productos.marca                            |
| category                   | string   | enum (mapa GPC)                            | categorias.nombre                          |
| price                      | number   | minimum 0                                  | precios_proveedor.precio                   |
| currency                   | string   | enum ISO 4217                              | Moneda                                     |
| unit_measure               | string   | enum (kg, lt, unidad)                      | productos.unidad_medida                    |
| valid_from / valid_to      | string   | ISO 8601, end ≥ start                      | Vigencia de precio                         |
| attributes                 | object   | additionalProperties true                  | Atributos adicionales por categoría        |

Fuente: JSON Schema, OpenAPI, Google Retail API[^14][^13][^15][^16].

Tabla 28. Plantilla JSON para producto (con GTIN y atributos)

```json
{
  "sku": "SKU-12345",
  "gtin": "7790123456789",
  "name": "Leche Entera UHT 1L",
  "brand": "Marca X",
  "category": "Alimentos > Lácteos > Leche",
  "unit_measure": "lt",
  "price": 120.50,
  "currency": "ARS",
  "attributes": {
    "package": "caja",
    "shelf_life_days": 365,
    "storage": "ambiente"
  },
  "valid_from": "2025-11-01T00:00:00Z",
  "valid_to": "2025-12-31T23:59:59Z"
}
```

Tabla 29. Mapeo EDI 850/855/810/846/832 ↔ modelo interno

| Documento | Campo EDI                      | Tabla/Columna interna        |
|-----------|--------------------------------|------------------------------|
| 850       | BEG03 (PO Date)                | pedidos.fecha                |
| 850       | PO1 (SKU, Qty, Price)          | pedido_items (sku, cantidad, precio) |
| 855       | ACK (PO Number, Status)        | pedidos.status               |
| 810       | INV (Invoice Number, Total)    | facturas.numero, total       |
| 846       | LIN (SKU, Qty)                 | stock_deposito (producto_id, stock_actual) |
| 832       | LIN (SKU, Price, Descripción)  | productos, precios_proveedor |

Fuente: EDI transacciones y buenas prácticas de mapeo[^9][^20].

—

Referencias

[^1]: GS1 Standards. https://www.gs1.org/standards  
[^2]: ¿Qué es un catálogo de proveedores? Crea uno en 4 pasos. https://www.tiendanube.com/blog/catalogo-de-proveedores/  
[^3]: What is Supplier Relationship Management (SRM)? - SAP. https://www.sap.com/products/spend-management/supplier-relationship-management-srm.html  
[^4]: Guía de la gestión de las relaciones con los proveedores - Infraspeak. https://infraspeak.com/es/biblioteca-de-contenido/guia-gestion-relaciones-proveedores  
[^5]: Gestión de categorías en comercio minorista - Shopify. https://www.shopify.com/es/blog/gestion-de-categorias  
[^6]: Tu guía para la optimización de la cadena de suministro (2025) - Amazon Business. https://business.amazon.com/es/blog/supply-chain-optimization  
[^7]: Guía de automatización en la cadena de suministro: ejemplos, herramientas y beneficios - Element Logic. https://www.elementlogic.net/cl/blogs/guia-de-automatizacion-en-la-cadena-de-suministro-ejemplos-herramientas-y-beneficios/  
[^8]: Retail - EDI/API - Integration Exchange LLC. https://home.intgexchange.com/retail/  
[^9]: Choosing between EDI vs API? - SPS Commerce. https://www.spscommerce.com/edi-guide/edi-vs-api/  
[^10]: The Four Most Common EDI Protocols Explained - ecosio. https://ecosio.com/en/blog/the-4-most-common-edi-protocols/  
[^11]: A systematic review of machine learning applications in sustainable supplier selection (2010–2024). https://www.sciencedirect.com/science/article/pii/S2772662225000037  
[^12]: A Novel Machine Learning Framework for Optimized Supplier Selection (2025). https://www.tandfonline.com/doi/full/10.1080/29966892.2025.2474824  
[^13]: Data Models (Schemas) | Swagger Docs (OpenAPI 3.0). https://swagger.io/docs/specification/v3_0/data-models/data-models/  
[^14]: Creating your first schema - JSON Schema. https://json-schema.org/learn/getting-started-step-by-step  
[^15]: REST Resource: projects.locations.catalogs.branches.products (Google Retail API). https://cloud.google.com/retail/docs/reference/rest/v2/projects.locations.catalogs.branches/products  
[^16]: About catalogs and products | Vertex AI Search for commerce. https://docs.cloud.google.com/retail/docs/catalog  
[^17]: GS1 General Specifications (PDF). https://www.gs1jp.org/assets/img/pdf/GS1_General_Specifications.pdf  
[^18]: Direct EDI (AS2) vs. VANs: Pros, Cons and The Basics - CData Arc. https://arc.cdata.com/blog/20190405-direct-as2-vs-van-edi  
[^19]: EDI Standards and Protocols: What You Need to Know - Epicor. https://www.epicor.com/en-us/blog/supply-chain-management/edi-standards-and-protocols-what-you-need-to-know/  
[^20]: Electronic Data Interchange (EDI) Transactions Guide - Cleo. https://www.cleo.com/blog/knowledge-base-edi-transactions  
[^21]: Web Scraping Best Practices - Zyte. https://www.zyte.com/learn/web-scraping-best-practices/  
[^22]: Web Scraping Best Practices and Legal Compliance - Get Data For. https://getdataforme.com/blog/web-scraping-best-practices-legal-compliance/  
[^23]: Ethical Web Scraping: Principles and Practices - DataCamp. https://www.datacamp.com/blog/ethical-web-scraping  
[^24]: Is web scraping legal? Yes, if you know the rules. - Apify Blog. https://blog.apify.com/is-web-scraping-legal/