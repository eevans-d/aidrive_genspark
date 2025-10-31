# Plan integral de pruebas y estrategia de testing para el Sistema Mini Market

Este documento constituye el blueprint maestro de pruebas y estrategia de calidad para el Sistema de Gestión del Mini Market. Su propósito es ofrecer una guía ejecutable y trazable a los objetivos de negocio y los requerimientos no funcionales, de modo que el sistema alcance y sostenga una disponibilidad del 99.9%, latencias p95 < 2 s en APIs críticas y una cobertura de pruebas automatizadas ≥ 80%. La estrategia se alinea con la arquitectura técnica propuesta y el roadmap del proyecto, y se articula en torno a una pirámide de pruebas moderna que equilibra velocidad, estabilidad y realismo operacional[^1][^2].

## 1. Resumen ejecutivo y objetivos del plan

La situación de partida —automatización en torno al 40%, procesos mayormente manuales y disponibilidad actual del 95%— exige una intervención integral que eleve el listón de calidad desde la fundación técnica hasta los flujos críticos de negocio. El plan persigue cuatro resultados operativos: i) consistencia del inventario sin race conditions, ii) actualización automatizada de precios y stock con frecuencias definidas, iii) latencias bajas en consultas UI y APIs, y iv) gobernanza del cambio con gates de calidad en CI/CD y evidencia auditora.

Los KPIs técnicos se concretan en: uptime 99.9% mensual; latencia p95 de precios/stock < 2 s (p99 < 3.5 s); sincronización de precios cada 15 minutos y de stock cada 5 minutos; catálogo actualizado diariamente; cobertura automatizada ≥ 80%; uptime de integraciones > 99%. Para facilitar la ejecución y el control ejecutivo, la Tabla 1 sintetiza metas y umbrales.

Tabla 1. KPIs técnicos y objetivos
| KPI técnico                         | Línea base | Objetivo   | Umbral de alerta |
|-------------------------------------|------------|------------|------------------|
| Disponibilidad mensual (uptime)     | 95%        | 99.9%      | < 99.0%          |
| Latencia API p95 (precios/stock)    | Variable   | < 2 s      | > 3 s            |
| Actualización de precios            | Manual     | 15 min     | > 30 min         |
| Actualización de stock              | Manual     | 5 min      | > 15 min         |
| Cobertura de pruebas                | N/D        | ≥ 80%      | < 70%            |

La definición de estos objetivos se sustenta en arquitecturas de referencia para inventario de alto volumen y baja latencia, que recomiendan la “verdad única” de inventario, colas para desacoplar sincronizaciones y prácticas de observabilidad que permitan detectar y corregir desviaciones con rapidez[^1][^2].

## 2. Estrategia de testing integral (pirámide moderna y cobertura)

La estrategia adopta una pirámide de pruebas moderna, con una base amplia de pruebas unitarias deterministas, un estrato medio de integración (APIs, bases de datos, colas) con contract testing, y una cúspide reducida pero estratégica de pruebas end-to-end sobre rutas críticas. La seguridad y el rendimiento se integran desde el principio (shift-left), con escaneos SAST/DAST y pruebas de carga en CI/CD.

Distribución objetivo:
- Unit tests: 60–70%.
- Integration tests (APIs, BD, colas): 20–25%.
- E2E tests (rutas críticas): 5–10%.

Objetivos de cobertura:
- Línea ≥ 80%; ramas ≥ 75% (≥ 90% en módulos críticos); funciones ≥ 90%.
- Flakiness E2E < 1%.

Ejecución y gates:
- Unitarias en cada commit/PR.
- Integración diaria.
- E2E pre-release y nightly.
- Gates de cobertura y calidad en CI/CD bloquean promociones deficientes.

Esta configuración refleja la evolución de la pirámide clásica hacia modelos adaptados a microservicios y cloud-native, donde la rapidez y estabilidad de las suites de pruebas son esenciales para ciclos de despliegue frecuentes[^3][^4][^5].

Tabla 2. Distribución objetivo y objetivos de cobertura
| Tipo de prueba     | % del total | Objetivo de cobertura | Frecuencia de ejecución |
|--------------------|-------------|------------------------|-------------------------|
| Unit tests         | 60–70%      | Línea ≥ 80%, ramas ≥ 75% | En cada commit/PR      |
| Integration tests  | 20–25%      | Contratos y rutas críticas | Diaria                 |
| E2E tests          | 5–10%       | Rutas críticas (<1% flakiness) | Pre-release y nightly  |

## 3. Casos de prueba específicos para módulos críticos

Los casos se derivan de los requerimientos funcionales (RF) y no funcionales (RNF), y se trazan a evidencias verificables en pipeline. Se priorizan datos realistas en E2E, y se cubren escenarios válidos, inválidos y límites. La matriz siguiente resume el foco por módulo.

Tabla 3. Matriz Módulo → Caso → Prioridad → Datos → Aserciones → Evidencia
| Módulo            | Caso de prueba                                              | Prioridad | Datos de prueba                         | Aserciones clave                                           | Evidencia en pipeline              |
|-------------------|--------------------------------------------------------------|-----------|-----------------------------------------|------------------------------------------------------------|------------------------------------|
| Productos         | CRUD y validaciones (SKU/GTIN, categoría)                   | Alta      | SKU/GTIN válidos e inválidos            | Unicidad, formato, jerarquía categoría                     | Reporte Jest + cobertura           |
| Proveedores       | Alta y configuración de integración                          | Alta      | Datos maestros, API endpoint lógico     | Credenciales, endpoints, scopes mínimos                    | Pruebas API (Postman/Newman)       |
| Precios           | Actualización automática y cálculo por reglas               | Crítica   | Lista de precios, reglas por categoría  | Precio vigente, historial, timestamp, auditoría            | Integración + auditoría en BD      |
| Stock             | Movimientos entrada/salida/transfer y alertas              | Crítica   | Movimientos y niveles mínimos/máximos   | Stock consistente, alertas, holds con expiración           | Integración BD + E2E stock         |
| Compras           | Asignación automática de faltantes y generación de OC      | Alta      | Stock bajo mínimo, proveedores scoring  | Selección proveedor, OC creada y enviada                   | E2E compras + colas (reintentos)   |
| Dashboards        | KPIs y latencia de carga                                    | Media     | Datos agregados recientes               | Latencia < objetivo, consistencia UI ↔ BD                  | E2E UI + métricas de rendimiento   |

La selección de casos y su evidencia aseguran cumplimiento de RF y RNF, reforzados por modelos de datos y reglas de integridad propias de sistemas de inventario[^6][^1][^7].

### 3.1 Módulo Catálogo (Productos/Proveedores)

- Alta/edición de productos con validación de SKU y GTIN.
- Gestión de categorías y relaciones.
- Alta de proveedores y configuración de integración (endpoints, credenciales).

Tabla 4. Casos de catálogo
| Caso                                      | Precondiciones          | Pasos                              | Datos                | Resultado esperado                                 | RF relacionado |
|-------------------------------------------|-------------------------|-------------------------------------|----------------------|----------------------------------------------------|----------------|
| Alta de producto con SKU/GTIN válidos     | Categorías existentes   | Crear producto                      | SKU, GTIN válidos    | Producto creado; unicidad y formato verificados    | RF-001, RF-004 |
| Duplicado de SKU                          | Producto existente      | Intentar crear con mismo SKU        | SKU duplicado        | Rechazo por unicidad; mensaje claro               | RF-001, RF-004 |
| Cambio de categoría                       | Producto existente      | Editar categoría                    | Nueva categoría      | Relación actualizada; jerarquía preservada         | RF-003         |
| Alta de proveedor                         | N/A                     | Crear proveedor                     | Datos maestros       | Proveedor creado; configuración API en JSONB       | RF-002         |

### 3.2 Módulo de Gestión de Precios

- Ingesta automática desde Maxiconsumo.
- Reglas de cálculo por categoría/producto.
- Historial y auditoría de cambios.

Tabla 5. Casos de precios
| Caso                                           | Precondiciones              | Pasos                                           | Data                   | Resultado esperado                                                | RF relacionado |
|------------------------------------------------|-----------------------------|-------------------------------------------------|------------------------|-------------------------------------------------------------------|----------------|
| Sincronización de precios (15 min)             | Conector activo             | Ejecutar sync programada                        | Lista de precios        | Precio vigente actualizado; precio_anterior y timestamp persistidos | RF-005, RF-007 |
| Regla de margen por categoría                  | Categoría con margen definido | Recalcular precio de venta                     | Costo + margen          | Precio de venta recalculado; auditoría de cambios                 | RF-006         |
| Historial de cambios por producto/proveedor    | Múltiples actualizaciones   | Consultar historial                              | Producto/proveedor      | Historial ordenado por fecha; consistencia y trazabilidad         | RF-007         |

### 3.3 Módulo de Gestión de Inventario

- Movimientos (entrada/salida/transfer).
- Niveles mínimo/máx, alertas.
- Holds temporales para evitar overselling.

Tabla 6. Casos de inventario
| Caso                                      | Precondiciones                    | Pasos                                | Data                       | Resultado esperado                                             | RF relacionado |
|-------------------------------------------|-----------------------------------|--------------------------------------|-----------------------------|----------------------------------------------------------------|----------------|
| Registro de entrada                       | Producto y depósito existentes    | Ingresar cantidad                    | Entrada con remito          | stock_actual aumenta; movimiento auditado                      | RF-008         |
| Registro de salida                        | Stock disponible                  | Registrar salida por venta/merma     | Salida                      | stock_actual disminuye; sin race conditions                    | RF-008, RNF-005|
| Transferencia entre depósitos             | Dos depósitos definidos           | Transferir cantidad                  | Producto, cantidad          | Origen decrementa; destino incrementa; auditoría completa      | RF-008         |
| Alerta de stock mínimo                    | Nivel mínimo configurado          | Simular descenso bajo mínimo         | Producto, nivel mínimo      | Alerta generada (UI/notificación); motor de asignación disparado | RF-010, RF-011 |
| Holds con expiración                      | Carrito/operación en curso        | Mantener hold y expirar              | Producto, cantidades        | Stock retenido temporalmente; liberación al expirar; sin overselling | RNF-005        |

### 3.4 Módulo de Compras y Asignación Automática

- Motor de scoring de proveedores.
- Generación y envío de OC (API/EDI).
- Trazabilidad de estados.

Tabla 7. Casos de compras
| Caso                                              | Precondiciones                         | Pasos                                              | Data                                 | Resultado esperado                                                  | RF relacionado |
|---------------------------------------------------|----------------------------------------|----------------------------------------------------|----------------------------------------|----------------------------------------------------------------------|----------------|
| Selección de proveedor óptimo                     | Stock bajo mínimo; proveedores activos | Ejecutar motor de asignación                        | Scores ponderados                      | Proveedor seleccionado por score; razones registradas               | RF-012         |
| Generación automática de OC                       | Motor de asignación ejecutado          | Crear OC                                           | Items y cantidades                     | OC creada con detalle y estado “pendiente”; auditoría               | RF-013         |
| Envío de OC por canal configurado (API/EDI)       | Canal disponible                        | Enviar OC                                          | Payload OC                             | Confirmación de recepción; logs de envío; reintentos si aplica      | RF-014         |
| Trazabilidad de OC                                | OC enviada                              | Consultar trazabilidad                             | ID OC                                  | Historial de estados; correlación con integración                   | RNF-006        |

### 3.5 Módulo de Reportes y Dashboards

- KPIs de stock, ventas, roturas.
- Latencia de carga bajo umbrales.
- Consistencia UI ↔ BD.

Tabla 8. Casos de reportes
| Caso                              | Precondiciones                  | Pasos                         | Data                   | Resultado esperado                                     | RF relacionado |
|-----------------------------------|---------------------------------|-------------------------------|-------------------------|--------------------------------------------------------|----------------|
| Dashboard de stock                | Movimientos recientes           | Cargar dashboard              | Productos/almacenes     | Visualiza stock correcto; latencia < objetivo          | RF-015         |
| Roturas de stock                  | Niveles mínimos configurados    | Consultar KPI de roturas      | Productos bajo mínimo   | KPI actualizado; correlación con alertas               | RF-016         |
| Ventas del día                    | Ventas registradas              | Cargar ventas del día         | Tickets de venta        | Suma y agregaciones correctas; consistencia BD/UI      | RF-015, RF-016 |

## 4. Configuración de entornos de testing (dev, staging, prod)

Se definen namespaces y variables por entorno, con políticas de acceso y segregación de privilegios. La paridad respecto a producción es alta en staging (mirror de esquema, datos anonimizados), y se establece seeding controlado por dataset. Se incluyen validaciones de backup/restore y DR en staging. Git y promover builds a través de entornos con gates claros reduce riesgo de migración y asegura continuidad operativa[^8][^9].

Tabla 9. Comparativa de entornos
| Entorno   | Propósito                         | Paridad con prod | Data                    | Accesos                         | Promociones                       |
|-----------|-----------------------------------|------------------|-------------------------|----------------------------------|-----------------------------------|
| Dev       | Desarrollo e integración local     | Media            | Sintéticos factories    | Equipo desarrollo                | Automática a dev/integration      |
| QA/Test   | Pruebas de integración y E2E       | Alta             | Sintéticos + anonimizados| QA, Dev, SRE                     | Automática tras gates             |
| Staging   | Validación pre-producción          | Muy alta         | Anonimizados/mirror     | Dev, QA, SRE, Producto           | Manual con approval               |
| Prod      | Operación en vivo                  | N/A              | Reales                  | SRE/Operaciones, roles mínimos  | Manual con canary y rollback      |

Tabla 10. Plan de seeding de datos
| Dataset                       | Fuente              | Entornos                     | Controles de limpieza                         |
|------------------------------|---------------------|------------------------------|-----------------------------------------------|
| Productos y categorías       | Generado + reglas   | Dev/QA/Staging               | Reset por suite; factories idempotentes       |
| Proveedores y config API     | Sintético + mock    | Dev/QA/Staging               | Limpieza de credenciales test; rotación       |
| Precios e historial          | Generado + scheduled| QA/Staging                   | Truncado por fecha; snapshots controlados     |
| Stock por depósito           | Generado + movimientos| QA/Staging                 | Reset de movimientos; holds expirados         |
| Movimientos de inventario    | Simulados           | QA/Staging                   | Rollback transacción; auditoría verificable   |

## 5. Pipeline CI/CD (GitHub Actions o GitLab CI)

El pipeline incluye gates de calidad: lint, unit/integration, E2E, seguridad (SAST/DAST), build, deploy a staging, smoke tests y promoción a producción con aprobación y canarios. Se publican reportes (cobertura, JUnit, artifacts) y se habilita rollback ante alertas. La selección de plataforma (GitHub Actions o GitLab CI) se basa en preferencias del equipo y el repositorio, manteniendo principios de calidad, seguridad y despliegue controlado[^10][^11].

Tabla 11. Mapa jobs/steps → herramientas → artefactos → criterios de éxito
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

## 6. Herramientas de testing automatizado y mapeo por tipo de prueba

La selección de herramientas se alinea con el stack y la necesidad de automatización continua:
- Jest + React Testing Library para componentes y lógica frontend.
- Cypress para E2E UI con Page Object Model y estrategias anti-flaky.
- Postman/Newman para pruebas de APIs y contratos.
- k6 o JMeter para rendimiento (selección según scripting y consumo de recursos).
- OWASP ZAP para seguridad (DAST).
- MSW para mock de APIs en frontend.

Tabla 12. Matriz herramienta → tipo de prueba → capa → pros/contras
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

Esta selección se fundamenta en guías contemporáneas de testing JS, tutoriales de React y comparativas de herramientas de rendimiento, priorizando integración CI/CD y mantenibilidad[^12][^13][^14].

## 7. Criterios de aceptación y Definition of Done (DoD)

Por módulo, los criterios de aceptación derivan de RF/RNF y exigen evidencia en pipeline. La DoD de historias incluye cobertura mínima, lint/SAST limpio, pruebas pasadas (unit/integración/E2E), documentación y approval QA. La auditoría de cambios de precio/stock es obligatoria. La matriz y el checklist siguiente operan como contratos de calidad en cada promoción[^4][^2].

Tabla 13. Criterios de aceptación por módulo (RF/RNF → evidencia → umbral)
| Módulo        | Criterio (RF/RNF)                             | Evidencia                      | Umbral                                    |
|---------------|-----------------------------------------------|--------------------------------|-------------------------------------------|
| Productos     | RF-001, RF-003, RF-004                         | Reportes Jest + RTL            | Cobertura línea ≥ 80%; validación SKU/GTIN|
| Proveedores   | RF-002, RNF-004                                | Colecciones Postman/Newman     | 100% casos críticos pasan; secrets gestionados |
| Precios       | RF-005, RF-006, RF-007, RNF-006                | Auditoría BD + contratos API   | Precio vigente y historial trazable       |
| Stock         | RF-008, RF-009, RF-010, RNF-005                | Integración BD + E2E           | Sin race conditions; holds validados      |
| Compras       | RF-012, RF-013, RF-014                         | E2E + colas (DLQ/retry)        | OC generadas y enviadas; trazabilidad     |
| Reportes      | RF-015, RF-016, RNF-002                        | E2E UI + k6/JMeter             | p95 < 2 s; KPIs correctos                 |

Tabla 14. DoD checklist (artefactos, pruebas, reportes, aprobaciones)
| Artefacto/Actividad            | Criterio                                     | Aprobación             |
|--------------------------------|----------------------------------------------|------------------------|
| Código                         | Lint/format sin errores; SAST limpio         | Tech Lead/QA           |
| Pruebas unit/integración       | Cobertura línea ≥ 80%; contratos validados   | QA                     |
| Pruebas E2E                    | Flujos críticos sin fallos; flakiness < 1%   | QA + Producto          |
| Documentación                  | Actualizada (Runbooks, API, pruebas)         | Tech Writer/QA         |
| Seguridad                      | OWASP ZAP sin vulnerabilidades críticas      | SRE/DevSecOps          |
| Observabilidad                 | Dashboards y alertas configurados            | SRE                    |
| Approvals                      | QA sign-off; Producto acceptance             | QA + Producto          |

## 8. Plan de testing de carga y stress testing

Los escenarios cubren sincronización de precios (cada 15 minutos), stock (cada 5 minutos), consultas UI y reportes, y picos por promociones. La selección de k6 o JMeter se basa en scripting, consumo de recursos y protocolos soportados; ambos se integran en CI/CD con reporting. Los umbrales se articulan en latencias p95/p99, throughput, tasa de error y saturación; se emplea observabilidad para detectar degradaciones en pipelines y producción[^14][^15].

Tabla 15. Plan de escenarios
| Escenario                     | Objetivo                            | Perfil de carga                  | Métricas clave               | Umbrales de aceptación                    |
|------------------------------|-------------------------------------|----------------------------------|------------------------------|-------------------------------------------|
| Lectura de precios           | p95 < 150 ms, p99 < 300 ms          | Rampa hasta 200 RPS              | Latencia, errores, hit cache | Errores < 0.5%; p95 < 150 ms              |
| Lectura de stock             | p95 < 200 ms, p99 < 400 ms          | Rampa hasta 150 RPS              | Latencia, locks, índices     | Errores < 0.5%; p95 < 200 ms              |
| Ingesta batch de precios     | E2E < 5 min                         | Carga distribuida (k6 cloud)     | Throughput, reintentos, DLQ  | E2E < 5 min; DLQ < 1% del total           |
| Ingesta batch de stock       | E2E < 5 min                         | Carga distribuida                 | Lag de cola, latencia         | Lag < 60 s; errores < 1%                  |
| Reportes/alertas             | p95 < 10 s                          | Carga sostenida 50 RPS           | Tiempos de agregación        | p95 < 10 s; errores < 0.5%                |
| Spike de ventas/promociones  | Degradación controlada              | Spike x3 en 60 s                 | Saturación, latencia p99      | p99 < 3.5 s; sin timeouts críticos        |

Tabla 16. k6 vs JMeter
| Criterio            | k6                                        | JMeter                                   |
|---------------------|-------------------------------------------|------------------------------------------|
| Integración CI/CD   | Alta (CLI, Docker, scripts JS)            | Media (headless, XML, más configuración) |
| Consumo de recursos | Bajo                                       | Alto en pruebas grandes                   |
| Protocolos          | HTTP/WebSockets/gRPC                      | HTTP, JDBC, FTP, SOAP, REST               |
| DX                  | Amigable para desarrolladores             | GUI para modelado, menos developer-friendly |
| Escalabilidad       | Nativa cloud-native                       | Distribuido con maestro-esclavo           |
| Mejor uso           | DevOps y CI/CD continuo                   | Entornos con múltiples protocolos         |

## 9. Documentación de testing procedures

Se documentan runbooks de ejecución y limpieza, gestión de secretos y configuración, y se automatiza la publicación de reportes (cobertura, JUnit). La documentación se versiona con el código y se mantiene por sprint. Se prioriza la orquestación de limpieza (rollback, factories idempotentes) para preservar la estabilidad de suites y entornos[^11].

Tabla 17. Runbooks y comandos clave
| Contexto              | Procedimiento                          | Comandos/Notas                                |
|-----------------------|----------------------------------------|-----------------------------------------------|
| Ejecución unit/integration | npm ci; npm test; jest --coverage      | Publicar JUnit y cobertura                    |
| Ejecución E2E         | cypress run                            | Videos/screenshots; retry flaky tests         |
| API testing           | newman run collection.json             | Variables de entorno; secret management       |
| Performance (k6)      | k6 run script.js                       | Umbrales en CI; resultados JSON/HTML          |
| Security (ZAP)        | zap-baseline.py -t target              | DAST en CI; manejo de autenticación           |
| Seeding de datos      | Factories (scripts)                    | Reset por suite; anonimización en staging     |
| Despliegue staging    | kubectl apply -f manifests/            | Smoke tests y promoción manual                |

## 10. Roadmap de implementación por fases y gobernanza

El roadmap se alinea con la ejecución del proyecto en cuatro fases: Fundación y BD; Stock Inteligente; Analytics y Optimización; Go-live y Estabilización. Cada fase tiene gate criteria de pruebas y métricas de éxito, con owners definidos. La gobernanza se apoya en ceremonies ágiles y reportes regulares de métricas, y las mitigaciones de riesgo cubren integración, migración y rendimiento[^9][^2].

Tabla 18. Cronograma por fases
| Fase                          | Duración | Entregables de pruebas                      | Gate criteria                                      | Owners                   |
|-------------------------------|----------|----------------------------------------------|----------------------------------------------------|--------------------------|
| Fase 1: Fundación y BD        | 8 sem    | Esquema DB, APIs core, pruebas unitarias     | Cobertura ≥ 80%; latencias < objetivo; contratos OK | Backend, QA, DBA, DevOps |
| Fase 2: Stock Inteligente     | 6 sem    | Alertas stock, integración, E2E stock        | Consistencia inventario; E2E críticos OK           | Backend, Frontend, QA    |
| Fase 3: Analytics y Optimiz.  | 8 sem    | Dashboards, KPIs, performance                | p95 < 2 s; performance estable; reportes correctos | Data/BI, Backend, QA     |
| Fase 4: Go-live y Estabiliz. | 4 sem    | Despliegue prod, monitoreo, soporte          | Uptime 99.9%; incidentes críticos = 0; canarios OK | DevOps, QA, SRE          |

Tabla 19. Matriz de riesgos y mitigaciones
| Riesgo                          | Prob. | Impacto | Mitigación                                                  |
|---------------------------------|-------|---------|-------------------------------------------------------------|
| Integración con Maxiconsumo     | Media | Alto    | POC temprano, contratos/SLAs, pruebas de resiliencia        |
| Calidad y migración de datos    | Alta  | Alto    | Limpieza y validación; staging mirror; rollback plan        |
| Resistencia al cambio           | Alta  | Medio   | Capacitación, champions, comunicación continua              |
| Rendimiento en picos            | Media | Alto    | Pruebas de carga/stress; autoscaling; caching               |

## 11. KPIs de calidad y gobernanza del plan

La gobernanza define KPIs técnicos y de negocio, con fuentes en CI/CD y observabilidad. Se仪表盘 mediante Prometheus/Grafana, con alertas por servicio/dominio y revisiones periódicas para mejora continua. Los objetivos y alertas aseguran que desviaciones se corrigan antes de impactar la operación[^3][^1].

Tabla 20. Catálogo de KPIs
| KPI                         | Definición                                | Objetivo     | Umbral de alerta  | Fuente                         |
|----------------------------|--------------------------------------------|--------------|-------------------|--------------------------------|
| Cobertura de pruebas       | % línea/ramas/funciones                    | ≥ 80%        | < 70%             | Reportes Jest                  |
| Flakiness E2E              | % tests inestables                         | < 1%         | ≥ 2%              | Cypress + retry metrics        |
| Latencia p95/p99           | Tiempo de respuesta APIs críticas          | p95 < 2 s    | > 3 s             | k6/JMeter + observabilidad     |
| Disponibilidad mensual     | Uptime servicios críticos                  | 99.9%        | < 99.0%           | Prometheus/Grafana             |
| Defectos escapados         | Defectos detectados en prod                | < 5%         | ≥ 10%             | Incidentes y post-mortems      |
| Lead time y frecuencia de despliegue | Tiempo a prod y cadencia           | Mejora continua | Tendencia adversa | CI/CD y release notes          |

## Brechas de información y acciones propuestas

- Documentación y SLAs de la API de Maxiconsumo: base_url, límites de tasa, autenticación, versionado.
- Volúmenes operacionales: SKUs totales, pedidos/día, frecuencia real de sincronización, picos estacionales, concurrencia.
- Modelo de datos legado y procedimientos de calidad de datos.
- RNF detallados (SLO por flujo, RTO/RPO, políticas de seguridad/compliance).
- Capacidades del equipo en el stack (Node.js/React/Python/FastAPI, Kubernetes, PostgreSQL, RabbitMQ).
- Cloud provider y dimensionamiento (instancias, almacenamiento, tráfico).
- Políticas de auditoría (trazabilidad, retención, acceso).
- Plan de migración (formatos, conteos cíclicos, fallback, canarios).

Acciones: workshops con stakeholders, POC con proveedor, discovery técnico-operativo y pruebas de carga con datos anonimizados.

---

## Referencias

[^1]: Cockroach Labs. Inventory Management Reference Architecture. https://www.cockroachlabs.com/blog/inventory-management-reference-architecture/  
[^2]: Shopify. How to Build Your Ultimate Retail Tech Stack (2025). https://www.shopify.com/ph/retail/retail-tech-stack  
[^3]: Full Scale. Modern Test Pyramid Guide. https://fullscale.io/blog/modern-test-pyramid-guide/  
[^4]: IBM. 7 best practices for end-to-end testing. https://www.ibm.com/think/insights/end-to-end-testing-best-practices  
[^5]: AIMultiple. 7 End-to-End Testing Best Practices. https://research.aimultiple.com/end-to-end-testing-best-practices/  
[^6]: Redgate. Creating a Database Model for an Inventory Management System. https://www.red-gate.com/blog/data-model-for-inventory-management-system  
[^7]: Cleo. How API Integration Creates Value for Wholesale Distributors. https://www.cleo.com/blog/api-integration-wholesale-distribution  
[^8]: AB Tasty. Test Environments: Differences Between Dev, Staging, Preprod... https://www.abtasty.com/blog/test-environment/  
[^9]: GoFTX. POS Migration Guide. https://goftx.com/blog/pos-migration/  
[^10]: GitHub Docs. Building and testing Node.js. https://docs.github.com/actions/guides/building-and-testing-nodejs  
[^11]: Varseno. Build CI/CD Pipeline for Node.js with GitHub Actions [2025 Guide]. https://www.varseno.com/ci-cd-github-actions-nodejs-deploy/  
[^12]: JavaCodeGeeks. JavaScript Testing: Jest and Cypress Best Practices. https://www.javacodegeeks.com/2025/03/javascript-testing-jest-and-cypress-best-practices.html  
[^13]: BrowserStack. React Testing: How to test React components? https://www.browserstack.com/guide/react-testing-tutorial  
[^14]: Grafana Labs. Comparing k6 and JMeter for load testing. https://grafana.com/blog/2021/01/27/k6-vs-jmeter-comparison/  
[^15]: StepMediaSoftware. 6 Types of Performance Testing in Software Testing (2025). https://stepmediasoftware.com/blog/types-of-performance-testing-in-software-testing/