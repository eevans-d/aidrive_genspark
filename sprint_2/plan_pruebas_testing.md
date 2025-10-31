# Plan de Pruebas y Estrategia de Testing Integral para el Sistema Mini Market

## 1. Resumen ejecutivo y objetivos del plan

El presente plan establece la estrategia integral de pruebas para el Sistema de Gestión del Mini Market, un monolito modular con una evolución planificada hacia microservicios. El alcance abarca el backend (Node.js/Express), frontend (React), base de datos (PostgreSQL), cache (Redis), mensajería (RabbitMQ), integraciones con proveedores (con foco en Maxiconsumo), y capacidades de reportes y dashboards. El objetivo es asegurar la calidad de los módulos críticos —Catálogo (Productos/Proveedores), Precios, Inventario (Stock/Depósito/Movimientos), Compras/Asignación Automática, Reportes y Dashboards— y garantizar la coherencia y disponibilidad de la información a lo largo del ciclo de vida de desarrollo y operación.

La arquitectura y los procesos de negocio establecidos requieren un régimen de pruebas que combine velocidad, estabilidad y realismo. Los criterios no funcionales clave definen el listón de calidad: disponibilidad mensual objetivo de 99.9%, latencia de APIs críticas en el percentil 95 (p95) inferior a 2 segundos, consistencia de inventario sin condiciones de carrera y cobertura de pruebas automatizadas igual o superior a 80%. Estos objetivos se apoyan en prácticas modernas de gestión de inventario y arquitecturas de referencia que recomiendan consistencia fuerte, baja latencia y desacople por colas para cargas retail con sincronizaciones frecuentes[^1][^3].

La estrategia se articula mediante la pirámide de pruebas moderna, con énfasis en una base sólida de pruebas unitarias, pruebas de integración y contract testing para APIs, pruebas end-to-end (E2E) sobre flujos críticos, y pruebas de rendimiento sistemáticas. La automatización en pipelines de integración y entrega continuas (CI/CD) —ya sea con GitHub Actions o GitLab CI— sostiene la calidad en cada despliegue. Este plan prioriza la simplicidad operacional del monolito modular, la robustez de datos en PostgreSQL, y la futura extracción controlada de servicios (Integración de Proveedores y Precios) en microservicios, sin perder la alineación con métricas de negocio (reducción de stock-outs, precisión de inventario, actualización automatizada de precios y latencias de consulta en UI).

KPIs técnicos de calidad y métricas objetivo (umbral de alerta):
- Cobertura de pruebas (línea): ≥ 80% (alerta < 70%).
- Cobertura de ramas: ≥ 75% (módulos críticos ≥ 90%).
- Flakiness de pruebas E2E: < 1%.
- Latencia p95 de APIs críticas: < 2 s (alerta > 3 s).
- Disponibilidad mensual: 99.9% (alerta < 99.0%).
- Throughput objetivo para sincronizaciones (precios/stock): definido por carga real con márgenes operacionales (ver sección 8).

Para visualizar el estado inicial de validación y responder a las necesidades de un sistema retail moderno, la Matriz 1 sintetiza los KPIs clave.

Tabla 1. Matriz de KPIs técnicos y objetivos
| KPI técnico                         | Línea base | Objetivo   | Umbral de alerta |
|-------------------------------------|------------|------------|------------------|
| Disponibilidad mensual (uptime)     | 95%        | 99.9%      | < 99.0%          |
| Latencia API p95 (precios/stock)    | Variable   | < 2 s      | > 3 s            |
| Actualización de precios            | Manual     | 15 min     | > 30 min         |
| Actualización de stock              | Manual     | 5 min      | > 15 min         |
| Cobertura de pruebas                | N/D        | ≥ 80%      | < 70%            |

Para asegurar trazabilidad, la Matriz 2 relaciona metas de negocio con objetivos de calidad verificables en pruebas.

Tabla 2. Mapa de metas de negocio → objetivos de calidad
| Meta de negocio                         | Objetivo de calidad (pruebas)                                  | Verificación/Evidencia en pipeline |
|-----------------------------------------|------------------------------------------------------------------|------------------------------------|
| Reducir stock-outs                      | Alertas de stock mínimo disparan motor de asignación            | Casos E2E con niveles de stock y generación de OC[^1] |
| Precisión de inventario ≥ 98%           | Movimientos de inventario sin race conditions; holds con expiración | Pruebas de concurrencia e integración de stock[^1][^3] |
| Automatización de precios (15 min)      | Sincronización con proveedor y cálculo con reglas por categoría | Pruebas de integración del conector + reglas de pricing[^8] |
| Latencia de consulta UI (p95 < 2s)      | Respuesta de APIs de precios/stock bajo carga                   | Pruebas de rendimiento (k6/JMeter) con umbrales[^11] |
| Trazabilidad y auditoría                | Historial de cambios de precio y movimientos persistidos        | Pruebas de auditoría sobre BD (constraints e índices)[^4] |

Brechas de información relevantes para cierre temprano:
- Volúmenes operacionales (SKUs, pedidos/día, concurrencia), SLAs reales de Maxiconsumo (base_url, rate limits), modelo de datos legado y calidad de datos, políticas de seguridad/compliance (ISO/PCI), capacidades del equipo, elección y dimensionamiento de cloud, políticas de auditoría y retención, y plan detallado de migración. Estas brechas se abordan en el roadmap y se controlan mediante gates de calidad y validaciones cruzadas, minimizando riesgos de despliegue y operación[^2][^24].

La estrategia se alinea con prácticas de arquitectura de inventario de alta disponibilidad y baja latencia, integrando testing continuo como parte del ciclo de vida de desarrollo[^1][^3][^8].

[^1]: Cockroach Labs. Inventory Management Reference Architecture.  
[^2]: GoFTX. POS Migration Guide.  
[^3]: Shopify. How to Build Your Ultimate Retail Tech Stack (2025).  
[^4]: Redgate. Creating a Database Model for an Inventory Management System.  
[^8]: Cleo. How API Integration Creates Value for Wholesale Distributors.  
[^11]: Grafana Labs. Comparing k6 and JMeter for load testing.

---

## 2. Estrategia de testing integral (pirámide moderna y cobertura)

La estrategia propone una pirámide de pruebas moderna que equilibra velocidad, estabilidad y realismo operacional. Se enfatiza la base de pruebas unitarias y de integración, con una capa superior más selectiva de pruebas E2E sobre rutas críticas. El objetivo es maximizar feedback temprano, minimizar flakiness y sostener despliegues frecuentes con confianza, integrando seguridad y performance en el “shift-left”.

Distribución objetivo de la pirámide:
- Unit tests: 60–70% del total de pruebas.
- Integration tests (incluye contract testing, BD y colas): 20–25%.
- End-to-end (E2E) tests: 5–10%, centrados en flujos críticos.

Coberturas objetivo:
- Línea: ≥ 80%.
- Ramas: ≥ 75%; módulos críticos ≥ 90%.
- Funciones: ≥ 90%.

Tabla 3. Distribución objetivo de la pirámide
| Tipo de prueba     | % del total | Objetivo de cobertura | Frecuencia de ejecución |
|--------------------|-------------|------------------------|-------------------------|
| Unit tests         | 60–70%      | Línea ≥ 80%, ramas ≥ 75% | En cada commit/PR      |
| Integration tests  | 20–25%      | Cobertura de contratos y rutas críticas | Diaria                 |
| E2E tests          | 5–10%       | Flujos críticos estables (<1% flakiness) | Pre-release y nightly  |

Para garantizar el cumplimiento, el Mapa 1 vincula métricas clave con umbrales y alertas.

Tabla 4. Mapa de métricas de calidad → umbrales
| Métrica                         | Objetivo            | Alerta           | Fuente en CI/CD           |
|---------------------------------|---------------------|------------------|---------------------------|
| Cobertura línea                 | ≥ 80%               | < 70%            | Reporte de cobertura Jest |
| Cobertura ramas (críticos)      | ≥ 90%               | < 80%            | Reporte de cobertura Jest |
| Flakiness E2E                   | < 1%                | ≥ 2%             | Cypress + retry strategy  |
| Latencia p95 API                | < 2 s               | > 3 s            | k6/JMeter en CI[^11]      |
| Disponibilidad mensual          | 99.9%               | < 99.0%          | Observabilidad (Prom/Grafana) |

La implementación sigue lineamientos contemporáneos de la pirámide de pruebas aplicada a microservicios y arquitecturas cloud-nativas, priorizando contratos, aislamiento de dependencias y pruebas de rutas críticas[^27][^5][^6][^7].

[^27]: Full Scale. Modern Test Pyramid Guide.  
[^5]: AIMultiple. End-to-End Testing Best Practices.  
[^6]: IBM. 7 best practices for end-to-end testing.  
[^7]: BrowserStack. React Testing Tutorial.

### 2.1 Pruebas unitarias

Las pruebas unitarias cubren la lógica de negocio, validaciones de campos, cálculo de precios y reglas de stock, asegurando aislamiento de dependencias externas. Se utilizan Jest (Node.js) y React Testing Library (RTL) para frontend, con mocking de módulos, factories para datos de prueba y aserciones precisas. La ejecución es parte del gate de calidad en cada PR, con objetivos de tiempo de ejecución por test en el orden de sub-segundos, manteniendo el feedback inmediato. Jest y RTL se integran de forma natural con React y Node.js, consolidando prácticas de calidad sostenidas por la comunidad y documentación especializada[^27][^10].

[^10]: JavaCodeGeeks. JavaScript Testing: Jest and Cypress Best Practices.

### 2.2 Pruebas de integración (API/BD/Colas)

La integración valida contratos de APIs, esquemas y flujos transaccionales, incluyendo migraciones de BD y pruebas con colas (RabbitMQ) y sus mecanismos de reintento y dead letter queue (DLQ). Se recomienda:
- Contract testing (OpenAPI/CDC) para consumidores y proveedores.
- Pruebas de BD con transacciones de rollback, verificación de constraints, índices y auditoría.
- Integración de colas con simulación de reintentos, validación de esquemas de mensajes y DLQ.

Este enfoque asegura integridad de datos y resiliencia operativa en escenarios de integración con proveedores y sincronizaciones frecuentes[^27].

Tabla 5. Matriz de casos de integración (servicios, DB, colas)
| Área                    | Caso de integración                                  | Datos/Condiciones                        | Aserciones clave                         |
|-------------------------|-------------------------------------------------------|------------------------------------------|------------------------------------------|
| API Precios             | GET /v1/precios → precio vigente por SKU             | SKU existente/inactivo                   | Precio, timestamp, activo=true           |
| API Stock               | GET /v1/stock → stock por almacén                    | Producto con movimientos recientes       | stock_actual, holds con expiración       |
| BD Precios              | Insert/Update → historial y vigente                  | Transacciones concurrentes               | UNIQUE(activo), auditoría persistida     |
| BD Inventario           | Movimiento entrada/salida/transfer                   | Stock mínimo/máx configurado             | Consistencia sin race conditions         |
| Colas (RabbitMQ)        | Ingesta precios/stock → reintentos y DLQ             | Simulación de 5xx y timeouts             | Reintentos con backoff y DLQ controlada  |
| Conector Maxiconsumo    | Sync catálogo, precios, stock                        | Endpoints lógicos y credenciales         | Validación payloads y eventos de sync    |

### 2.3 Pruebas E2E (críticas)

Las pruebas E2E cubren flujos críticos de negocio y UI. Se diseñan sobre datos realistas y entornos con paridad respecto a producción, con estrategias anti-flaky: reintentos controlados, aislamiento de datos, esperas explícitas y Page Object Model en Cypress. La frecuencia de ejecución precede a releases y nightly builds, complementando la pirámide sin sobrecargar el pipeline. IBM y AIMultiple recomiendan mantener E2E focalizado en rutas críticas, documentado y con datos concretos, evitando la proliferación de casos costosos de mantener[^5][^6].

Tabla 6. Flujos E2E críticos por módulo
| Módulo        | Flujo crítico                                               | Datos de prueba                    | Aserciones clave                                        |
|---------------|--------------------------------------------------------------|------------------------------------|----------------------------------------------------------|
| Productos     | Creación/edición de producto (SKU/GTIN) y categorización    | SKU válido, categoría existente    | Unicidad, formato GTIN, jerarquía categoría              |
| Proveedores   | Alta de proveedor y configuración de integración            | Datos maestros válidos             | Endpoint lógicos y credenciales almacenados              |
| Precios       | Actualización desde proveedor → precio vigente               | Lista de precios actualizada       | Historial, precio anterior, timestamp, auditoría         |
| Stock         | Registro de movimientos → stock y alertas                    | Entrada/salida/transfer            | Niveles stock, alertas, holds con expiración             |
| Compras       | Asignación automática de faltantes → OC                      | Stock bajo mínimo                  | Generación de OC, envío por canal configurado            |
| Dashboards    | Visualización de KPIs (stock, ventas, roturas)               | Datos agregados recientes          | Latencia de carga, consistencia UI ↔ BD                  |

### 2.4 Pruebas de rendimiento

Se establecen objetivos de latencia p95/p99 para APIs críticas (precios y stock), y se definen escenarios de carga representativos, stress y picos (spike) para sincronizaciones de precios (cada 15 minutos) y stock (cada 5 minutos). Se comparan herramientas k6 y JMeter para seleccionar la más adecuada al contexto del proyecto, priorizando scripting amigable, integración con CI/CD y consumo de recursos. Las pruebas de rendimiento se integran en el pipeline con umbrales de aceptación y reporting automatizado[^11][^15].

Tabla 7. Matriz de endpoints y objetivos de rendimiento
| Endpoint/API           | Operación crítica                     | p95 objetivo | p99 objetivo | Observabilidad clave                      |
|------------------------|---------------------------------------|--------------|--------------|-------------------------------------------|
| GET /v1/precios        | Precio vigente por SKU                | < 150 ms     | < 300 ms     | Hit ratio cache, tiempo consulta BD        |
| GET /v1/stock          | Consultar stock por almacén           | < 200 ms     | < 400 ms     | Concurrencia, locks, índices              |
| Sync Precios (batch)   | Ingesta de precios (E2E scheduler)    | < 5 min      | < 6 min      | Throughput, errores/reintentos, DLQ       |
| Sync Stock (batch)     | Actualización periódica               | < 5 min      | < 6 min      | Lag de cola, latencia por recurso         |
| Reportes/Alertas       | Generación y envío                    | < 10 s       | < 15 s       | Tiempos de agregación, colas              |

[^15]: StepMediaSoftware. Types of Performance Testing in Software Testing (2025).

### 2.5 Pruebas de seguridad

Se integran escaneos estáticos (SAST) y dinámicos (DAST) de dependencias y APIs; pruebas automatizadas sobre endpoints críticos para inyección, XSS, CSRF y control de acceso; y verificación de datos sensibles (cifrado TLS y en reposo). OWASP ZAP se emplea como línea base en CI/CD, complementado por validaciones de seguridad en contratos y credenciales. La evidencia se captura en reportes, con gates que impiden la promoción de builds con vulnerabilidades críticas, siguiendo buenas prácticas del stack retail y estándares de seguridad en desarrollo continuo[^8][^3].

---

## 3. Casos de prueba específicos para módulos críticos

El catálogo de casos se mapea a requerimientos funcionales (RF) y no funcionales (RNF), con trazabilidad hacia evidencias en pipeline. La prioridad es asegurar calidad de datos maestros, reglas de negocio, consistencia de inventario, trazabilidad de auditoría y la latencia en consultas y visualizaciones UI.

Tabla 8. Matriz Módulo → Caso → Prioridad → Datos → Aserciones → Evidencia
| Módulo            | Caso de prueba                                              | Prioridad | Datos de prueba                         | Aserciones clave                                           | Evidencia en pipeline              |
|-------------------|--------------------------------------------------------------|-----------|-----------------------------------------|-------------------------------------------------------------|------------------------------------|
| Productos         | CRUD y validaciones (SKU, GTIN, categoría)                   | Alta      | SKU/GTIN válidos e inválidos            | Unicidad, formato, jerarquía categoría                      | Reporte Jest + cobertura           |
| Proveedores       | Alta y configuración de integración                          | Alta      | Datos maestros, API endpoint lógico     | Credenciales, endpoints, scopes mínimos                     | Pruebas API (Postman/Newman)       |
| Precios           | Actualización automática y cálculo por reglas                | Crítica   | Lista de precios, reglas por categoría  | Precio vigente, historial, timestamp, auditoría             | Integración + auditoría en BD      |
| Stock             | Movimientos entrada/salida/transfer y alertas                | Crítica   | Movimientos y niveles mínimos/máximos   | Stock consistente, alertas disparadas, holds con expiración | Integración BD + E2E stock         |
| Compras           | Asignación automática de faltantes y generación de OC        | Alta      | Stock bajo mínimo, proveedores scoring  | Selección proveedor, OC creada y enviada                    | E2E compras + colas (reintentos)   |
| Dashboards        | KPIs y latencia de carga                                     | Media     | Datos agregados recientes               | Latencia < objetivo, consistencia UI ↔ BD                   | E2E UI + métricas de rendimiento   |

### 3.1 Módulo Catálogo (Productos/Proveedores)

Casos de creación/edición, validaciones de identificadores y relaciones de categorías. Se valida unicidad de SKU/GTIN y el formato esperado. La estructura de datos maestros sigue prácticas de modelado de inventario y catálogos de producto[^4].

Tabla 9. Casos de prueba del catálogo (SKU/GTIN/categorías)
| Caso                                      | Precondiciones          | Pasos                              | Datos                | Resultado esperado                                 | RF relacionado |
|-------------------------------------------|-------------------------|-------------------------------------|----------------------|----------------------------------------------------|----------------|
| Alta de producto con SKU/GTIN válidos     | Categorías existentes   | Crear producto                      | SKU, GTIN válidos    | Producto creado; unicidad y formato verificados    | RF-001, RF-004 |
| Duplicado de SKU                          | Producto existente      | Intentar crear con mismo SKU        | SKU duplicado        | Rechazo por unicidad; mensaje claro               | RF-001, RF-004 |
| Cambio de categoría                       | Producto existente      | Editar categoría                    | Nueva categoría      | Relación actualizada; jerarquía preservada         | RF-003         |
| Alta de proveedor                         | N/A                     | Crear proveedor                     | Datos maestros       | Proveedor creado; configuración API en JSONB       | RF-002         |

### 3.2 Módulo de Gestión de Precios

Se valida la ingesta de precios desde proveedor (Maxiconsumo), cálculo del precio de venta por reglas (márgenes por categoría/producto) y persistencia del historial. La auditoría registra quién, cuándo y qué valores anterior/nuevo, con restricciones y índices adecuados en BD[^8].

Tabla 10. Casos de prueba de precios (actualización, reglas, auditoría)
| Caso                                           | Precondiciones              | Pasos                                           | Datos                   | Resultado esperado                                                | RF relacionado |
|------------------------------------------------|-----------------------------|-------------------------------------------------|-------------------------|-------------------------------------------------------------------|----------------|
| Sincronización de precios (15 min)             | Conector activo             | Ejecutar sync programada                        | Lista de precios        | Precio vigente actualizado; precio_anterior y timestamp persistidos | RF-005, RF-007 |
| Regla de margen por categoría                  | Categoría con margen definido | Recalcular precio de venta                     | Costo + margen          | Precio de venta recalculado; auditoría de cambios                 | RF-006         |
| Historial de cambios por producto/proveedor    | Múltiples actualizaciones   | Consultar historial                              | Producto/proveedor      | Historial ordenado por fecha; consistencia y trazabilidad         | RF-007         |

### 3.3 Módulo de Gestión de Inventario

Se cubren movimientos de entrada/salida/transfer, stock por ubicación y niveles mínimo/máx, y alertas automáticas ante stock bajo. La consistencia se garantiza mediante validaciones de negocio y patrones de “holds” para evitar sobreventa[^1][^4].

Tabla 11. Casos de prueba de stock (movimientos, alertas, auditoría)
| Caso                                      | Precondiciones                    | Pasos                                | Datos                       | Resultado esperado                                             | RF relacionado |
|-------------------------------------------|-----------------------------------|--------------------------------------|-----------------------------|----------------------------------------------------------------|----------------|
| Registro de entrada                       | Producto y depósito existentes    | Ingresar cantidad                    | Entrada con remito          | stock_actual aumenta; movimiento auditado                      | RF-008         |
| Registro de salida                        | Stock disponible                  | Registrar salida por venta/merma     | Salida                      | stock_actual disminuye; sin race conditions                    | RF-008, RNF-005|
| Transferencia entre depósitos             | Dos depósitos definidos           | Transferir cantidad                  | Producto, cantidad          | Origen decrementa; destino incrementa; auditoría completa      | RF-008         |
| Alerta de stock mínimo                    | Nivel mínimo configurado          | Simular descenso bajo mínimo         | Producto, nivel mínimo      | Alerta generada (UI/notificación); motor de asignación disparado | RF-010, RF-011 |
| Holds con expiración                      | Carrito/operación en curso        | Mantener hold y expirar              | Producto, cantidades        | Stock retenido временно; liberación al expirar; sin overselling | RNF-005        |

### 3.4 Módulo de Compras y Asignación Automática

El motor de asignación pondera precio, disponibilidad, lead time y desempeño (OTIF), generando órdenes de compra y enviándolas por el canal configurado (API/EDI). Se prueban escenarios de score y selección, generación/envío de OC y trazabilidad completa[^8].

Tabla 12. Casos de prueba de compras (asignación, OC, trazabilidad)
| Caso                                              | Precondiciones                         | Pasos                                              | Datos                                 | Resultado esperado                                                  | RF relacionado |
|---------------------------------------------------|----------------------------------------|----------------------------------------------------|----------------------------------------|----------------------------------------------------------------------|----------------|
| Selección de proveedor óptimo                     | Stock bajo mínimo; proveedores activos | Ejecutar motor de asignación                        | Scores ponderados                      | Proveedor seleccionado por score; razones registradas               | RF-012         |
| Generación automática de OC                       | Motor de asignación ejecutado          | Crear OC                                           | Items y cantidades                     | OC creada con detalle y estado “pendiente”; auditoría               | RF-013         |
| Envío de OC por canal configurado (API/EDI)       | Canal disponible                        | Enviar OC                                          | Payload OC                             | Confirmación de recepción; logs de envío; reintentos si aplica      | RF-014         |
| Trazabilidad de OC                                | OC enviada                              | Consultar trazabilidad                             | ID OC                                  | Historial de estados; correlación con integración                   | RNF-006        |

### 3.5 Módulo de Reportes y Dashboards

Se validan KPIs clave (stock, ventas, roturas), la latencia de carga y consistencia entre la UI y la base de datos. En performance, se verifica el throughput y tiempos de agregación bajo carga, evitando cuellos de botella en consultas y métricas de observabilidad[^3].

Tabla 13. Casos de prueba de reportes (KPIs, consistencia, latencia)
| Caso                              | Precondiciones                  | Pasos                         | Datos                   | Resultado esperado                                     | RF relacionado |
|-----------------------------------|---------------------------------|-------------------------------|-------------------------|--------------------------------------------------------|----------------|
| Dashboard de stock                | Movimientos recientes           | Cargar dashboard              | Productos/almacenes     | Visualiza stock correcto; latencia < objetivo          | RF-015         |
| Roturas de stock                  | Niveles mínimos configurados    | Consultar KPI de roturas      | Productos bajo mínimo   | KPI actualizado; correlación con alertas               | RF-016         |
| Ventas del día                    | Ventas registradas              | Cargar ventas del día         | Tickets de venta        | Suma y agregaciones correctas; consistencia BD/UI      | RF-015, RF-016 |

---

## 4. Configuración de entornos de testing (dev, staging, prod)

Se establecen namespaces y configuración por entorno (variables, secretos, credenciales, endpoints) con paridad respecto a producción. Los datos de prueba se generan sintéticamente o se anonimizan, y se mantienen datasets controlados para E2E y performance. La estrategia incluye staging con mirrors de producción para validar migraciones, backups y planes de recuperación (DR), mitigando riesgos de transición y aseguran-do operación estable[^12][^24].

Tabla 14. Comparativa de entornos
| Entorno   | Propósito                         | Paridad con prod | Datos                    | Accesos                         | Promociones                       |
|-----------|-----------------------------------|------------------|--------------------------|----------------------------------|-----------------------------------|
| Dev       | Desarrollo e integración local     | Media            | Sintéticos factories     | Equipo desarrollo                | Automática a dev/integration      |
| QA/Test   | Pruebas de integración y E2E       | Alta             | Sintéticos + anonimizados| QA, Dev, SRE                     | Automática tras gates             |
| Staging   | Validación pre-producción          | Muy alta         | Anonimizados/mirror      | Dev, QA, SRE, Producto           | Manual con approval               |
| Prod      | Operación en vivo                  | N/A              | Reales                   | SRE/Operaciones, roles mínimos  | Manual con canary y rollback      |

Tabla 15. Plan de seeding de datos
| Dataset                       | Fuente              | Entornos                     | Controles de limpieza                         |
|------------------------------|---------------------|------------------------------|-----------------------------------------------|
| Productos y categorías       | Generado + reglas   | Dev/QA/Staging               | Reset por suite; factories idempotentes       |
| Proveedores y config API     | Sintético + mock    | Dev/QA/Staging               | Limpieza de credenciales test; rotación       |
| Precios y historial          | Generado + scheduled| QA/Staging                   | Truncado por fecha; snapshots controlados     |
| Stock por depósito           | Generado + movimientos| QA/Staging                 | Reset de movimientos; holds expirados         |
| Movimientos de inventario    | Simulados           | QA/Staging                   | Rollback transacción; auditoría verificable   |

[^12]: AB Tasty. Test Environments: Differences Between Dev, Staging, Preprod....  
[^24]: Square. When and How to Switch Your POS System.

---

## 5. Pipeline CI/CD (GitHub Actions o GitLab CI)

Se propone una topología de pipeline con gates de calidad: lint, pruebas unitarias y de integración, E2E, seguridad (SAST/DAST), build, deploy a staging, smoke tests y promoción a producción con aprobación. Los reportes de pruebas y cobertura se publican en cada ejecución; se adoptan estrategias de canary y rollback en producción; y se aprovechan runners autohospedados para performance (k6/JMeter) si la carga lo exige. La automatización sigue las guías oficiales para Node.js, complementadas por prácticas de despliegue y secret management[^13][^14].

Tabla 16. Mapa de jobs/steps → herramientas → artefactos → criterios de éxito
| Job/Step                  | Herramientas                     | Artefactos                        | Criterio de éxito                               |
|---------------------------|----------------------------------|-----------------------------------|-------------------------------------------------|
| Lint                      | ESLint                           | Reporte lint                      | Sin errores críticos                            |
| Unit + Integration        | Jest, RTL, msw, Postman/Newman   | JUnit/XML, cobertura              | Cobertura línea ≥ 80%; contratos válidos        |
| E2E                       | Cypress                          | Videos/screenshots, JUnit         | Flujos críticos sin fallos; flakiness < 1%      |
| Security (SAST/DAST)      | OWASP ZAP, Dependency scanning   | Reporte vulnerabilidades          | 0 vulnerabilidades críticas                     |
| Build                     | npm, Docker                      | Artefacto/imagen Docker           | Build exitoso; imagen publicada                 |
| Deploy Staging            | kubectl/Docker Compose           | Manifests, logs                   | Despliegue estable; smoke tests OK              |
| Performance (opcional)    | k6/JMeter                        | Reporte HTML/JSON, métricas       | p95 < 2 s; errores bajo umbral                  |
| Promote to Prod           |kubectl/GitOps                    | Artefacto versionado              | Aprobación; canary sin alertas críticas         |

[^13]: GitHub Docs. Building and testing Node.js.  
[^14]: Varseno. Build CI/CD Pipeline for Node.js with GitHub Actions [2025 Guide].

### 5.1 Ejemplo con GitHub Actions

Estructura del workflow en .github/workflows/ con stages: lint → test (unit/integration) → e2e → build → deploy → smoke. Secretos en GitHub Secrets (tokens, API keys) y publicación de reportes (coverage, JUnit). Patrón de promoción manual a producción con canary en un subconjunto de pods o usuarios, rollback automatizado ante alertas críticas[^13][^14].

### 5.2 Consideraciones con GitLab CI

Stages equivalentes (build, test, security, deploy) con despliegue a entornos y approval manual para producción. Cache de dependencias y artefactos para optimizar tiempos. Integración de Performance/Load con k6/JMeter como job dedicado, separado por filtros de cambios (solo rutas relevantes). GitLab CI es una alternativa plenamente válida si el repositorio y la operación así lo requieren.

---

## 6. Herramientas de testing automatizado y mapeo por tipo de prueba

El set recomendado es: Jest (unitarias), React Testing Library (componentes), Cypress (E2E UI), Postman/Newman (APIs), k6 o JMeter (rendimiento), OWASP ZAP (seguridad). MSW (Mock Service Worker) se emplea para simular APIs y aislar el frontend durante pruebas. La estrategia contempla data factories, Page Object Model en Cypress, y utilidades compartidas para reducir mantenimiento y flakiness[^10][^7][^11].

Tabla 17. Matriz herramienta → tipo de prueba → capa → pros/contras
| Herramienta     | Tipo de prueba     | Capa                | Pros                                           | Contras/Consideraciones                          |
|-----------------|--------------------|---------------------|------------------------------------------------|--------------------------------------------------|
| Jest            | Unitarias          | Backend/Frontend    | Rápido, cobertura, DX                          | Requiere buen aislamiento de dependencias        |
| RTL             | Unit/Integración   | Frontend UI         | Pruebas de componentes y estado                | Curva para patrones avanzados de UI              |
| Cypress         | E2E                | UI end-to-end       | Rápido, anti-flaky con POM y retries           | Mantenimiento de selectores y datos              |
| Postman/Newman  | APIs               | Backend/API         | Contratos, colecciones reutilizables           | Versionado de colecciones y credenciales         |
| k6              | Performance        | APIs/Servicios      | Ligero, scripting JS, CI/CD-friendly           | Sin GUI; enfoque programático                    |
| JMeter          | Performance        | APIs/Protocolos     | GUI, múltiples protocolos                      | Más pesado; modo no-GUI recomendado              |
| OWASP ZAP       | Seguridad          | APIs/UI             | Automatizable, DAST                            | Requiere configuración de autenticación          |
| MSW             | Mock API           | Frontend            | Aislamiento y estabilidad                      | Cohesión con contratos reales                     |

---

## 7. Criterios de aceptación y Definition of Done (DoD)

Los criterios de aceptación por módulo vinculan RF/RNF con evidencias y umbrales. La DoD de historias incluye cobertura mínima, lint/SAST limpio, pruebas pasadas (unit/integración/E2E), documentación actualizada y approval QA. Los defectos bloqueantes impiden promoción, y se exige trazabilidad de auditoría en cambios de precio/stock, alineada con prácticas de retail moderno[^5][^3].

Tabla 18. Criterios de aceptación por módulo (RF/RNF → evidencia → umbral)
| Módulo        | Criterio (RF/RNF)                             | Evidencia                      | Umbral                                    |
|---------------|-----------------------------------------------|--------------------------------|-------------------------------------------|
| Productos     | RF-001, RF-003, RF-004                         | Reportes Jest + RTL            | Cobertura línea ≥ 80%; validación SKU/GTIN|
| Proveedores   | RF-002, RNF-004                                | Colecciones Postman/Newman     | 100% casos críticos pasan; secrets gestionados |
| Precios       | RF-005, RF-006, RF-007, RNF-006                | Auditoría BD + contratos API   | Precio vigente y historial trazable       |
| Stock         | RF-008, RF-009, RF-010, RNF-005                | Integración BD + E2E           | Sin race conditions; holds validados      |
| Compras       | RF-012, RF-013, RF-014                         | E2E + colas (DLQ/retry)        | OC generadas y enviadas; trazabilidad     |
| Reportes      | RF-015, RF-016, RNF-002                        | E2E UI + k6/JMeter             | p95 < 2 s; KPIs correctos                 |

Tabla 19. Definition of Done checklist (artefactos, pruebas, reportes, aprobaciones)
| Artefacto/Actividad            | Criterio                                     | Aprobación             |
|--------------------------------|----------------------------------------------|------------------------|
| Código                         | Lint/format sin errores; SAST limpio         | Tech Lead/QA           |
| Pruebas unit/integración       | Cobertura línea ≥ 80%; contratos validados   | QA                     |
| Pruebas E2E                    | Flujos críticos sin fallos; flakiness < 1%   | QA + Producto          |
| Documentación                  | Actualizada (Runbooks, API, pruebas)         | Tech Writer/QA         |
| Seguridad                      | OWASP ZAP sin vulnerabilidades críticas      | SRE/DevSecOps          |
| Observabilidad                 | Dashboards y alertas configurados            | SRE                    |
| Approvals                      | QA sign-off; Producto acceptance             | QA + Producto          |

---

## 8. Plan de testing de carga y stress testing

Se diseñan escenarios realistas con endpoints críticos de precios y stock, sincronizaciones batch con colas, picos alineados a ventas y promociones, y validaciones de degradación controlada. La selección entre k6 y JMeter se realiza por facilidad de scripting, consumo de recursos, escalabilidad y soporte de protocolos; el objetivo es automatizar en CI/CD con umbrales de latencia, throughput y errores, y reporting consistente[^11][^15].

Tabla 20. Plan de escenarios (objetivo, carga, métricas, umbrales)
| Escenario                     | Objetivo                            | Perfil de carga                  | Métricas clave               | Umbrales de aceptación                    |
|------------------------------|-------------------------------------|----------------------------------|------------------------------|-------------------------------------------|
| Lectura de precios           | p95 < 150 ms, p99 < 300 ms          | Rampa hasta 200 RPS              | Latencia, errores, hit cache | Errores < 0.5%; p95 < 150 ms              |
| Lectura de stock             | p95 < 200 ms, p99 < 400 ms          | Rampa hasta 150 RPS              | Latencia, locks, índices     | Errores < 0.5%; p95 < 200 ms              |
| Ingesta batch de precios     | E2E < 5 min                         | Carga distribuida (k6 cloud)     | Throughput, reintentos, DLQ  | E2E < 5 min; DLQ < 1% del total           |
| Ingesta batch de stock       | E2E < 5 min                         | Carga distribuida                 | Lag de cola, latencia         | Lag < 60 s; errores < 1%                  |
| Reportes/alertas             | p95 < 10 s                          | Carga sostenida 50 RPS           | Tiempos de agregación        | p95 < 10 s; errores < 0.5%                |
| Spike de ventas/promociones  | Degradación controlada              | Spike x3 en 60 s                 | Saturación, latencia p99      | p99 < 3.5 s; sin timeouts críticos        |

Tabla 21. k6 vs JMeter (selección)
| Criterio            | k6                                        | JMeter                                   |
|---------------------|-------------------------------------------|------------------------------------------|
| Integración CI/CD   | Alta (CLI, Docker, scripts JS)            | Media (headless, XML, más configuración) |
| Consumo de recursos | Bajo                                       | Alto en pruebas grandes                   |
| Protocolos          | HTTP/WebSockets/gRPC                      | HTTP, JDBC, FTP, SOAP, REST               |
| DX                  | Amigable para desarrolladores             | GUI para modelado, menos developer-friendly |
| Escalabilidad       | Nativa cloud-native                       | Distribuido con maestro-esclavo           |
| Mejor uso           | DevOps y CI/CD continuo                   | Entornos con múltiples protocolos         |

---

## 9. Documentación de testing procedures

Se establecen Runbooks de ejecución de pruebas, generación y gestión de datos de prueba, y procedimientos de gestión de secretos y configuración. La documentación se versiona junto al código, se mantiene actualizada por sprint, e incluye guías para troubleshooting, cleanup de datos y paridad de entornos[^14].

Tabla 22. Runbooks y comandos clave (librería viva)
| Contexto              | Procedimiento                          | Comandos/Notas                                |
|-----------------------|----------------------------------------|-----------------------------------------------|
| Ejecución unit/integration | npm ci; npm test; jest --coverage      | Publicar JUnit y cobertura                    |
| Ejecución E2E         | cypress run                            | Videos/screenshots; retry flaky tests         |
| API testing           | newman run collection.json             | Variables de entorno; secret management       |
| Performance (k6)      | k6 run script.js                       | Umbrales en CI; resultados JSON/HTML          |
| Security (ZAP)        | zap-baseline.py -t target              | DAST en CI; manejo de autenticación           |
| Seeding de datos      | Factories (scripts)                    | Reset por suite; anonimización en staging     |
| Despliegue staging    | kubectl apply -f manifests/            | Smoke tests y promoción manual                |

---

## 10. Roadmap de implementación por fases

La ejecución se organiza en cuatro fases, alineadas con el roadmap del proyecto. Cada fase tiene entregables de pruebas, criterios de salida (gate criteria) y owners definidos. La migración se gestiona mediante validaciones cruzadas, fallback y canarios, siguiendo guías de transición POS que minimizan riesgo operacional[^2].

Tabla 23. Cronograma por fases (gate criteria, owners)
| Fase                          | Duración | Entregables de pruebas                      | Gate criteria                                      | Owners                   |
|-------------------------------|----------|----------------------------------------------|----------------------------------------------------|--------------------------|
| Fase 1: Fundación y BD        | 8 sem    | Esquema DB, APIs core, pruebas unitarias     | Cobertura ≥ 80%; latencias < objetivo; contratos OK | Backend, QA, DBA, DevOps |
| Fase 2: Stock Inteligente     | 6 sem    | Alertas stock, integración, E2E stock        | Consistencia inventario; E2E críticos OK           | Backend, Frontend, QA    |
| Fase 3: Analytics y Optimiz.  | 8 sem    | Dashboards, KPIs, performance                | p95 < 2 s; performance estable; reportes correctos | Data/BI, Backend, QA     |
| Fase 4: Go-live y Estabiliz. | 4 sem    | Despliegue prod, monitoreo, soporte          | Uptime 99.9%; incidentes críticos = 0; canarios OK | DevOps, QA, SRE          |

Tabla 24. Matriz de riesgos de migración y mitigaciones
| Riesgo                          | Prob. | Impacto | Mitigación                                                  |
|---------------------------------|-------|---------|-------------------------------------------------------------|
| Integración con Maxiconsumo     | Media | Alto    | POC temprano, contratos/SLAs, pruebas de resiliencia        |
| Calidad y migración de datos    | Alta  | Alto    | Limpieza y validación; staging mirror; rollback plan        |
| Resistencia al cambio           | Alta  | Medio   | Capacitación, champions, comunicación continua              |
| Rendimiento en picos            | Media | Alto    | Pruebas de carga/stress; autoscaling; caching               |

---

## 11. KPIs de calidad y gobernanza del plan

El éxito del plan se mide mediante KPIs técnicos y de negocio, con paneles de control y alertas. La gobernanza incluye ceremonias de revisión de métricas y mejora continua, con ciclos de identificación de problemas, acción correctiva y seguimiento de impacto[^27].

Tabla 25. Catálogo de KPIs (definición, objetivo, umbral, fuente)
| KPI                         | Definición                                | Objetivo     | Umbral de alerta  | Fuente                         |
|----------------------------|--------------------------------------------|--------------|-------------------|--------------------------------|
| Cobertura de pruebas       | % línea/ramas/funciones                    | ≥ 80%        | < 70%             | Reportes Jest                  |
| Flakiness E2E              | % tests inestables                         | < 1%         | ≥ 2%              | Cypress + retry metrics        |
| Latencia p95/p99           | Tiempo de respuesta APIs críticas          | p95 < 2 s    | > 3 s             | k6/JMeter + observabilidad     |
| Disponibilidad mensual     | Uptime servicios críticos                  | 99.9%        | < 99.0%           | Prometheus/Grafana             |
| Defectos escapados         | Defectos detectados en prod                | < 5%         | ≥ 10%             | Incidentes y post-mortems      |
| Lead time y frecuencia de despliegue | Tiempo a prod y cadencia           | Mejora continua | Tendencia adversa | CI/CD y release notes          |

---

## 12. Anexos

### A. Plantillas y artefactos
- Contratos OpenAPI para endpoints lógicos (/v1/precios, /v1/stock).
- Colecciones Postman para APIs críticas (Precios, Stock, Proveedores, Compras).
- Scripts k6/JMeter por endpoint crítico.
- Configuraciones de pipelines (GitHub Actions/GitLab CI) y dashboards (Prometheus/Grafana).

### B. Scripts y configuraciones de referencia
- Pipeline YAML con gates de calidad, cobertura y reportes (JUnit/XML).
- Manifests Kubernetes por entorno (dev/staging/prod) y variables de entorno segregadas.
- Runbooks de incidentes (integración, latencia, overselling).

### C. Gaps de información y plan de cierre
- Volúmenes operacionales y picos: recopilar métricas en staging y prod; pruebas de carga piloto.
- SLAs y rate limits Maxiconsumo: acordar con proveedor; pruebas controladas con reintentos y circuit breaker.
- Modelo de datos legado: auditoría y limpieza; scripts de migración y validación cruzada.
- Política de seguridad/compliance: definir ISO/PCI; ajustar gates y evidencias en CI/CD.
- Capacidades del equipo: evaluación de skills; capacitación en Jest/RTL/Cypress/Postman/k6/JMeter.
- Cloud y dimensionamiento: selección AWS/GCP; pruebas de capacidad y costo.
- Políticas de auditoría y retención: formalizar y documentar; asegurar trazabilidad en BD.
- Plan de migración (canarios, fallback, cronogramas de conteos): ejecutar en staging; aprobado por negocio y operaciones.

---

## Referencias

[^1]: Cockroach Labs. Inventory Management Reference Architecture. https://www.cockroachlabs.com/blog/inventory-management-reference-architecture/  
[^2]: GoFTX. POS Migration Guide. https://goftx.com/blog/pos-migration/  
[^3]: Shopify. How to Build Your Ultimate Retail Tech Stack (2025). https://www.shopify.com/ph/retail/retail-tech-stack  
[^4]: Redgate. Creating a Database Model for an Inventory Management System. https://www.red-gate.com/blog/data-model-for-inventory-management-system  
[^5]: AIMultiple. 7 End-to-End Testing Best Practices. https://research.aimultiple.com/end-to-end-testing-best-practices/  
[^6]: IBM. 7 best practices for end-to-end testing. https://www.ibm.com/think/insights/end-to-end-testing-best-practices  
[^7]: BrowserStack. React Testing: How to test React components? https://www.browserstack.com/guide/react-testing-tutorial  
[^8]: Cleo. How API Integration Creates Value for Wholesale Distributors. https://www.cleo.com/blog/api-integration-wholesale-distribution  
[^9]: DCKAP. Top 7 Seamless Integration for Wholesale Distributors. https://www.dckap.com/blog/seamless-integration-for-wholesale-distributors/  
[^10]: JavaCodeGeeks. JavaScript Testing: Jest and Cypress Best Practices. https://www.javacodegeeks.com/2025/03/javascript-testing-jest-and-cypress-best-practices.html  
[^11]: Grafana Labs. Comparing k6 and JMeter for load testing. https://grafana.com/blog/2021/01/27/k6-vs-jmeter-comparison/  
[^12]: AB Tasty. Test Environments: Differences Between Dev, Staging, Preprod... https://www.abtasty.com/blog/test-environment/  
[^13]: GitHub Docs. Building and testing Node.js. https://docs.github.com/actions/guides/building-and-testing-nodejs  
[^14]: Varseno. Build CI/CD Pipeline for Node.js with GitHub Actions [2025 Guide]. https://www.varseno.com/ci-cd-github-actions-nodejs-deploy/  
[^15]: StepMediaSoftware. 6 Types of Performance Testing in Software Testing (2025). https://stepmediasoftware.com/blog/types-of-performance-testing-in-software-testing/  
[^27]: Full Scale. Modern Test Pyramid Guide. https://fullscale.io/blog/modern-test-pyramid-guide/