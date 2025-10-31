# Especificación Integral de Integraciones con Proveedores (Foco en Maxiconsumo) para el Sistema Mini Market

## Resumen ejecutivo y decisiones clave

El Sistema Mini Market requiere integrar, a escala y con resiliencia, a su proveedor crítico Maxiconsumo y un conjunto de mayoristas adicionales para automatizar extremo a extremo los procesos de catálogo, precios, stock y órdenes. Esta especificación técnica establece la arquitectura de integración, los protocolos y formatos de datos, los mecanismos de resiliencia (timeouts, reintentos con jitter y circuit breakers), el sistema de monitoreo y alertas, las estrategias de caching y sincronización, y el marco de documentación técnica (OpenAPI, JSON Schema y EDI).

La decisión arquitectónica central es adoptar un enfoque de “API primero, EDI para transacciones de alto volumen, scraping responsable solo como último recurso y con salvaguardas”. Las APIs permiten operaciones近实时 y feeds de actualización eficientes para precios, stock y catálogo; EDI (Electronic Data Interchange) es idóneo para documentos transaccionales complejos (PO 850, ACK 855, factura 810, inventario 846, catálogo/precios 832) y flujos batch. Este patrón está alineado con las mejores prácticas del retail y la evidencia comparativa entre EDI y API, que recomiendan usar cada tecnología donde aporta más valor[^1]. Para la integración de Maxiconsumo, se privilegia la API (su presencia digital y e‑commerce hacen viable una integración programática), con EDI como alternativa para documentos y como contingencia si la API no está disponible o no cubre todos los casos[^2][^4]. Se formaliza un “plan B” de scraping responsable exclusivamente para información pública cuando no exista API/EDI, respetando robots.txt y TOS, aplicando rate limiting y gobernanza de cumplimiento[^3].

Los resultados esperados de esta especificación incluyen:
- Integración priorizada con Maxiconsumo y marco de conectores para otros proveedores mayoristas.
- Estándares de datos (GTIN/GLN, JSON/EDI) y contratos OpenAPI/JSON Schema consistentes.
- Patrones de resiliencia operativos: timeouts por capa, reintentos con backoff y jitter, circuit breaker con umbrales y observabilidad.
- Observabilidad integral: métricas, logs, trazas, monitoreo sintético y RUM; alertas accionables y SLOs por flujo crítico.
- Estrategia de caching y sincronización con Redis y Redis Data Integration (RDI) para rendimiento y frescura adecuada.
- Documentación técnica normativa para APIs y mapeos EDI, habilitando mantenibilidad y governance del ciclo de vida.

Esta especificación se ancla en el diagnóstico y el roadmap ya aprobados, que priorizan la integración con Maxiconsumo, la automatización de precios e inventario y un stack técnico con PostgreSQL, Redis, mensajería asíncrona y observabilidad (Prometheus/Grafana y ELK). Las principales brechas de información (endpoints/rate limits de Maxiconsumo, disponibilidad EDI, costos VAN/AS2 y políticas de scraping) se abordan mediante un plan de negociación, pruebas y salvaguardas, como se detalla en la sección de gaps y mitigaciones.

---

## Contexto y alcance del Sprint 2

El Sprint 2 se basa en los hallazgos del Sprint 1: existe una brecha de automatización del 50%, con precisión de inventario del 70% y procesos de compras, pricing e inventario mayormente manuales. La arquitectura objetivo contempla un monolito modular con evolución futura a microservicios, utilizando Node.js/Python para APIs, PostgreSQL como base de datos maestra, Redis para caching de baja latencia, RabbitMQ para desacoplar tareas asíncronas, y Prometheus/Grafana y ELK para observabilidad. La integración con proveedores se alinea con estas capacidades, y los objetivos no funcionales relevantes incluyen disponibilidad del 99.9%, latencia p95 menor a 2 segundos para APIs críticas, seguridad TLS, trazabilidad y consistencia de datos.

El alcance del Sprint 2 comprende:
- Diseñar e implementar la integración con Maxiconsumo (API, fallback EDI o scraping responsable).
- Establecer conectores genéricos para otros mayoristas (API/EDI/Scraping).
- Definir protocolos y formatos de datos (REST/OpenAPI/JSON Schema/EDI/AS2/VAN).
- Implementar resiliencia (timeouts, reintentos con jitter, circuit breaker).
- Desplegar observabilidad (métricas, logs, trazas, sintético, RUM) y alertas con SLOs por flujo.
- Establecer caching con Redis y sincronización con RDI.
- Documentar técnica y normativamente las integraciones (OpenAPI, JSON Schema, EDI, runbooks).

Para facilitar la lectura, el siguiente mapa relaciona requerimientos funcionales y no funcionales del diagnóstico con componentes de integración.

Tabla 1. Mapa de requerimientos → componentes de integración
| Requerimiento | Componente de integración | Descripción breve |
|---|---|---|
| RF-005 (precios automáticos) | Conector API Maxiconsumo; Scheduler | Polling cada 15 min a endpoints de precios, validación de esquema y actualización con auditoría[^4] |
| RF-008 (movimientos inventario) | Conector inventario EDI 846; colas | Ingestión de stock y publicación en colas para procesamiento asíncrono y actualización[^4] |
| RF-012/013 (asignación y PO) | Motor de asignación; Conector PO (EDI 850/API) | Generación de OC y envío por API/EDI, registro de ACK 855[^1][^4] |
| RNF-001 (uptime 99.9%) | Observabilidad + resiliencia | SLOs por flujo, circuit breaker, reintentos y alertas basadas en SLOs[^5][^6] |
| RNF-002 (latencia p95 < 2s) | Redis caching; bulkheads | Cache-Aside para precios/stock y aislamiento de recursos por proveedor[^11] |
| RNF-004 (TLS, OAuth2/JWT) | Seguridad en conectores | Autenticación/API keys, TLS, RBAC y auditoría en flujos críticos[^12] |
| RNF-006 (auditoría) | Logs estructurados; EDI trace | Logs JSON, correlaciones EDI↔API, retención y evidencias de cumplimiento[^12] |

Este mapa orienta el diseño y la implementación hacia resultados operativos concretos, evitando esfuerzos aislados sin impacto en los KPIs.

---

## Arquitectura de integración con Maxiconsumo (scraping avanzado vs API directa)

La integración con Maxiconsumo se rige por un principio “API primero”. La presencia de Maxiconsumo en e‑commerce, con catálogo y precios publicados, refuerza la viabilidad de una integración basada en servicios web para consulta de precios, stock y catálogo, y creación de pedidos. No obstante, dado que no se dispone públicamente de documentación de endpoints, autenticación y rate limits, la estrategia contempla una fase de negociación técnica y pruebas (POC), en paralelo a la definición de resiliencia y seguridad.

La elección entre API directa, EDI y scraping responsable responde a criterios de cumplimiento, calidad de datos, latencia, estabilidad del canal y volumen. En particular, las APIs son superiores para consultas rápidas y sincronización incremental (precios, stock), mientras que EDI es el canal apropiado para transacciones complejas y batch (OC, factura, inventario). El scraping —solo para información pública y con cumplimiento de robots.txt/TOS— queda como último recurso, sujeto a salvaguardas técnicas (rate limiting, respeto de carga del sitio) y auditoría legal[^2][^3].

Para establecer el marco de decisión, se presenta la matriz de evaluación.

Tabla 2. Matriz de decisión: API vs EDI vs Scraping (criterios ponderados)
| Criterio | Peso | API (Maxiconsumo) | EDI | Scraping |
|---|---:|---|---|---|
| Cumplimiento TOS/robots | 0.25 | Alto (si autorizado) | Alto (estándar) | Medio (requiere salvaguardas)[^3] |
| Frescura/latencia | 0.20 | Alta (near real-time) | Media (batch) | Variable (polling) |
| Calidad/estabilidad de datos | 0.20 | Alta (esquema formal) | Alta (mapeo EDI) | Media (estructura cambiante) |
| Estabilidad del canal | 0.15 | Media‑Alta (si SLA) | Alta (VAN/AS2) | Baja (cambios UI) |
| Volumen transaccional | 0.10 | Media | Alta (850/810/846/832) | Baja |
| Costo/operación | 0.10 | Media | Media/Alta (VAN) | Baja (pero con riesgos) |
| Total (estimado) | 1.00 | Alto | Alto (para documentos) | Bajo/Medio |

La interpretación es clara: priorizar API para datos maestros y consultas de precio/stock, usar EDI para PO/factura/inventario y establecer scraping responsable solo ante ausencia de API/EDI y bajo controles.

La arquitectura lógica del conector Maxiconsumo contempla capas bien definidas:
- Capa de autenticación/seguridad: API keys/OAuth2/TLS, headers obligatorios (por ejemplo, X-Location), políticas de rotación de credenciales.
- Capa de cliente HTTP: timeouts por operación (conexión, solicitud), manejo de códigos de estado y semántica idempotente.
- Capa de resiliencia: reintentos con backoff exponencial y jitter, circuit breaker por proveedor/endpoint, y fallback controlado.
- Capa de observabilidad: métricas por endpoint, logs estructurados, correlaciones y trazas distribuidas.
- Capa de datos: validación con JSON Schema, enriquecimiento con GTIN/GLN, y persistencia en el modelo maestro.

Para sostener la operación, se definen SLIs/SLOs por flujo.

Tabla 3. SLIs/SLOs de la integración con Maxiconsumo
| Flujo | SLI | SLO | Observabilidad |
|---|---|---|---|
| Precios (GET /precios) | Disponibilidad; Latencia p95; Freshness | 99.9%; < 2s; ≤ 15 min | Métricas Prometheus; Grafana dashboard; alertas por freshness[^5] |
| Stock (GET /stock) | Disponibilidad; Latencia p95; Freshness | 99.9%; < 2s; ≤ 5 min | Idem |
| Catálogo (GET /productos) | Disponibilidad; Integridad | 99.5%; > 99% | Validaciones de esquema y reconciliación con GS1[^7][^8] |
| Pedido (POST /pedidos) | Tasa de éxito; Latencia p95 | > 99%; < 2s | ACK 855 correlacionado; logs estructurados[^4] |

### Diseño del conector API (prioridad)

El conector API se implementa como cliente REST con autenticación, paginación, rate limit handling y validaciones de esquema. Los reintentos aplican backoff exponencial con jitter para errores 5xx/429, respetando headers como Retry‑After cuando existan. La idempotencia se asegura con tokens de solicitud y claves naturales (SKU/GTIN + timestamp), especialmente para operaciones con efectos secundarios (por ejemplo, creación de pedidos), siguiendo la práctica de diseñar APIs reintentables de forma segura[^9][^6].

La normalización de datos se basa en GTIN/GLN y el uso de JSON Schema para validar campos, unidades y monedas, con mapeos coherentes al modelo interno (SKU, marca, categoría, precios por proveedor, stock por depósito)[^7][^8]. Se adoptan patrones de conectores REST consolidados, con soporte de autenticación estándar (OAuth2, API key), formatos JSON y extracción de objetos anidados mediante JSONPath, y mecanismos de paginación y límites de tasa integrados[^10].

### Plan de fallback y scraping responsable

El fallback escalona alternativas: API → EDI → cache → degradación elegante. La degradación puede implicar publicar precios “congelados” por TTL en Redis y sinalizar a los usuarios la última actualización; se prioriza no vender sobre datos no confirmados. El scraping responsable se aplica únicamente a información pública, con auditoría legal previa, respeto de robots.txt y TOS, rate limiting y límites de concurrencia, sin captura de datos sensibles ni evasión de controles. Este plan se activa solo ante ausencia de API/EDI o interrupciones prolongadas, y deja evidencia de cumplimiento para auditorías[^3].

---

## Conectores con otros proveedores mayoristas

Para el resto de los proveedores, se adopta un framework genérico de conectores que soporta API REST/GraphQL, EDI (850/855/810/846/832) y scraping controlado. La selección del canal se basa en criterios de madurez digital del proveedor, volumen y complejidad de documentos, SLA requerido y costo total (incluyendo VAN/AS2 cuando aplique). La gobernanza del catálogo de proveedores establece lineamientos de onboarding técnico, evaluación y monitoreo, con segmentación (estratégicos, preferidos, transaccionales) y responsabilidades claras (Compras, Legal, Operaciones, Integración, Seguridad), en línea con prácticas de SRM (Supplier Relationship Management)[^15].

Tabla 4. Framework de conectores: capability matrix por proveedor
| Proveedor | API (catálogo/precios/stock) | EDI (PO/ACK/invoice/inventario) | Scraping | SLA esperado | Notas |
|---|---|---|---|---|---|
| Maxiconsumo | Sí (preferido) | Potencial | No (salvo público) | Alta | POC y negociación técnica |
| Proveedor A | Sí | Sí (VAN) | No | Media | Onboarding EDI con VAN |
| Proveedor B | Parcial | No | Sí (público) | Baja | Salvo si API se habilita |
| Proveedor C | No | Sí (AS2 directo) | No | Media | Costos controlados[^1][^16] |

La decisión EDI vs API para cada socio se guía por el uso típico de cada tecnología: APIs para consultas rápidas y e‑commerce; EDI para documentos complejos y batch en B2B mayorista[^1].

Tabla 5. Selección de canal por caso de uso (proveedor)
| Caso de uso | Canal preferido | Alternativa | Comentarios |
|---|---|---|---|
| Consulta de precio/stock | API | Cache + batch EDI | Near real-time para pricing y disponibilidad[^1] |
| Orden de compra (PO) | EDI 850 | API (si habilita proveedor) | Documentos con múltiples líneas y metadatos[^4] |
| Factura | EDI 810 | API | Requiere trazabilidad y reconciliación contable[^4] |
| Inventario | EDI 846 | API | Actualizaciones batch o near real-time según SLA[^4] |

### EDI vs API por proveedor

Para determinar el canal dominante, se ponderan criterios: volumen, SLA, complejidad de datos, costo y tiempo de onboarding. La evidencia sugiere que el uso combinado suele ser necesario: API para datos y e‑commerce; EDI para transacciones pesadas[^1][^4]. Se adjunta un checklist de onboarding técnico que abarca autenticación, endpoints/documentos, mapeos, pruebas y seguridad.

Tabla 6. Checklist de onboarding técnico (por proveedor)
| Área | Ítem | Estado |
|---|---|---|
| Seguridad | TLS, OAuth2/API key, RBAC | Pendiente/OK |
| API | Endpoints, versión, rate limits | Pendiente/OK |
| EDI | Documentos (850/855/810/846/832), mapeo | Pendiente/OK |
| Pruebas | Casos sintéticos, volumen y regresión | Pendiente/OK |
| Observabilidad | Logs JSON, métricas y trazas | Pendiente/OK |
| Legal | TOS/robots, contratos y SLA | Pendiente/OK |

---

## Protocolos de comunicación y formatos de datos

Las integraciones API utilizan REST con contratos OpenAPI 3.1 y validación mediante JSON Schema. Los Security Schemes incluyen API key, HTTP bearer y OAuth2, y la documentación debe describir claramente endpoints, parámetros, cuerpos, respuestas y ejemplos. Para EDI, los documentos prioritarios en retail son PO 850, ACK 855, factura 810, inventario 846 y catálogo/precios 832, que se mapean al modelo interno (pedidos, factura_items, stock_deposito, precios_proveedor)[^12][^4][^13].

El transporte EDI puede ser AS2 directo o a través de una VAN, evaluando control/costo/onboarding y soporte. AS2 ofrece control directo y menor costo recurrente, mientras que una VAN simplifica el onboarding con múltiples socios y da visibilidad y soporte, a cambio de costos recurrentes y dependencia de terceros[^16].

Para estandarizar los contratos, se presentan las siguientes tablas de mapeo.

Tabla 7. OpenAPI/JSON Schema ↔ Modelo interno (campos clave)
| Concepto | Campo OpenAPI/Schema | Campo interno | Validación/Notas |
|---|---|---|---|
| Producto | sku (string) | productos.codigo_barras | pattern y unicidad |
| Producto | gtin (string) | productos.gtin | Validación GS1[^7][^8] |
| Producto | name/brand | productos.nombre/marca | CommonMark en descripción[^12] |
| Categoría | category (string) | categorias.nombre | Jerarquía y enum |
| Precio | price (number) | precios_proveedor.precio | >= 0; moneda ISO 4217 |
| Moneda | currency (string) | precios_proveedor.moneda | ISO 4217 |
| Unidad | unit_measure (string) | productos.unidad_medida | Tabla de conversión SI |
| Vigencia | valid_from/to (string) | precios_proveedor.vigencia | ISO 8601; end ≥ start |
| Atributos | attributes (object) | productos.atributos | additionalProperties true[^12] |

Tabla 8. Documentos EDI ↔ Modelo interno (mapeo lógico)
| Documento | Campos clave | Tablas internas | Observaciones |
|---|---|---|---|
| 850 (PO) | Nro PO, líneas (SKU, qty, price) | pedidos, pedido_items | Origen de OC |
| 855 (ACK) | PO number, status | pedidos.status | Confirmación/rechazo |
| 810 (Invoice) | Invoice number, taxes, total | facturas, factura_items | Reconciliación contable |
| 846 (Inventory) | SKU, on-hand, available | stock_deposito | Vista de inventario |
| 832 (Price/Catalog) | SKU, price, validity | productos, precios_proveedor | Actualización de catálogo/precios |

### Contratos y validación

El versionado de endpoints sigue semántica clara (por ejemplo, /v1), con políticas de deprecación y ejemplos de migración. Los JSON Schema validan tipos, formatos y restricciones; OpenAPI describe security schemes y requisitos (API key, bearer, OAuth2), y la documentación expone casos de prueba y respuestas típicas. Estos contratos normativos habilitan generación de SDKs, pruebas automatizadas y linting de integraciones[^12].

---

## Resiliencia: manejo de errores, timeouts y reintentos automáticos

Las integraciones deben tolerar fallos transitorios y evitar que degraden el sistema. Se establecen timeouts por capa: conexión, solicitud y por endpoint, con valores iniciales alineados a latencias observadas y límites razonables. Los reintentos aplican backoff exponencial con jitter y límites de intentos, reintentando solo errores reintentables (5xx, 429), nunca 4xx salvo políticas específicas (por ejemplo, 401 con refresh de token). El circuit breaker se configura con umbrales de fallos y periodos en abierto/semiabierto, integrados con el gateway y las colas para prevenir efectos de manada y sobrecarga[^9][^6][^14].

Tabla 9. Timeouts por operación (inicial, ajustar con métricas)
| Operación | Timeout de conexión | Timeout de solicitud | Comentarios |
|---|---:|---:|---|
| GET precios | 2s | 5s | Polling cada 15 min, evitar bloqueos[^9] |
| GET stock | 2s | 5s | Frecuencia 5 min, jitter en scheduler[^9] |
| GET catálogo | 3s | 10s | Lotes y paginación |
| POST pedido | 2s | 7s | Idempotencia y ACK 855 correlacionado |
| EDI AS2/VAN | N/A | N/A | Batch y SLA de VAN; monitoreo de colas[^16] |

Tabla 10. Política de reintentos por tipo de error
| Tipo de error | Reintentar? | Backoff | Jitter | Límite | Header Retry‑After |
|---|---|---:|---:|---:|---|
| 5xx (servidor) | Sí | Exponencial (cap) | Sí (full jitter) | 3–5 | Respetar si presente[^9] |
| 429 (rate limit) | Sí | Exponencial (cap) | Sí | 3–5 | Respetar Retry‑After[^9] |
| 401/403 (auth) | Condicional | Token refresh | N/A | 1–2 | Rotar credenciales |
| 4xx (cliente) | No | N/A | N/A | 0 | Corregir solicitud |
| Timeout | Sí | Exponencial (cap) | Sí | 3–5 | N/A |

Tabla 11. Parámetros de circuit breaker por dependencia
| Dependencia | Umbral de fallos | Periodo evaluación | Tiempo abierto | Umbral éxitos (half‑open) | Observaciones |
|---|---:|---:|---:|---:|---|
| Maxiconsumo API | 5 errores/60s | 60s | 30s | 3 successes | Ajuste adaptativo según tráfico[^6] |
| Proveedor A EDI VAN | 10 errores/300s | 300s | 120s | 5 successes | Considerar SLA del VAN[^16] |
| Endpoint /stock | 3 errores/30s | 30s | 20s | 2 successes | Más sensible por freshness |

Los principios operativos recomiendan evitar la multiplicación de reintentos en múltiples capas (para no amplificar la carga), usar idempotencia en operaciones con efectos secundarios y aplicar jitter a tareas programadas (polling y jobs batch) para evitar sincronización de carga[^9].

---

## Observabilidad, monitoreo y alertas de integraciones

La observabilidad se diseña para “ver” el comportamiento de las integraciones y reaccionar antes de que impacte al cliente. Se instrumentan métricas, logs y trazas en conectores, gateways y colas; se configura monitoreo sintético y de usuarios reales (RUM), y se establecen alertas basadas en SLOs por flujo (precios, stock, PO, factura). La telemetría se centraliza en Prometheus/Grafana y ELK, con dashboards y páginas de estado internas. IBM ofrece una visión útil de las dimensiones del monitoreo de APIs (disponibilidad, rendimiento, seguridad, integración, cumplimiento, versiones), que se adoptan para construir los tableros y alertas[^5].

Tabla 12. Catálogo de métricas por flujo
| Flujo | Métricas | Descripción |
|---|---|---|
| Precios | availability, latency_p95, freshness, error_rate | Salud de GET /precios y actualización |
| Stock | availability, latency_p95, freshness, error_rate | Salud de GET /stock y freshness |
| Catálogo | availability, integrity, schema_errors | Validación de esquema y reconciliación |
| PO/ACK | success_rate, latency_p95, ack_latency | Creación PO y confirmación 855 |
| Factura | success_rate, latency_p95, reconciliation_rate | Ingesta 810 y conciliación |
| EDI | queue_lag, throughput, error_rate | Salud de mensajería y VAN/AS2 |

Tabla 13. Catálogo de alertas
| Condición | Severidad | Canal | Responsable |
|---|---|---|---|
| Freshness de precios > 20 min | Alta | Slack + Email | Integración/Operaciones |
| Latencia p95 > 2s por 15 min | Media | PagerDuty | TI/Gestión |
| Tasa de error > 1% por 10 min | Alta | PagerDuty + Incident | TI/Negocio |
| Circuit breaker abierto > 5 min | Alta | Slack | Arquitectura/Integración |
| ACK 855 no recibido en SLA | Media | Email | Compras/Operaciones |

Tabla 14. SLOs por flujo (propuesta inicial)
| Flujo | Disponibilidad | Latencia p95 | Freshness | Error rate |
|---|---:|---:|---:|---:|
| Precios | 99.9% | < 2s | ≤ 15 min | < 0.5% |
| Stock | 99.9% | < 2s | ≤ 5 min | < 0.5% |
| Catálogo | 99.5% | < 2s | ≤ 24h | < 0.5% |
| PO/ACK | 99.9% | < 2s | ACK ≤ 30 min | < 0.3% |
| Factura | 99.9% | < 2s | Conciliación ≤ 48h | < 0.3% |

Se recomienda complementar con monitoreo sintético de rutas críticas (login, consulta de stock, creación de PO) y RUM para comprender la experiencia real del usuario en tienda y operaciones. El monitoreo de seguridad incluye intentos fallidos de autenticación, anomalías en patrones de llamadas y validación de esquemas, con alertas específicas[^5].

---

## Estrategias de caching y sincronización

Redis se adopta como capa de caching para lograr latencias submilisegundas, escalabilidad y alta disponibilidad, aplicando patrones adecuados por caso de uso: Cache‑Aside para precios/stock, Write‑Through/Write‑Behind para persistencia desde colas, Query Caching para consultas frecuentes y Pre‑fetching para prepoblar catálogos en ventanas programadas[^11]. Redis Data Integration (RDI) se integra para sincronizar datos desde PostgreSQL hacia Redis en tiempo casi real, manteniendo vistas materializadas y estructuras optimizadas para lectura rápida[^18].

Las políticas de invalidación combinan TTLs por entidad (por ejemplo, precios 15 min, stock 5 min) con eventos de actualización (webhooks o triggers de cambios), garantizando frescura adecuada sin sacrificar rendimiento. Los keys y namespaces se diseñan para aislamiento por proveedor, categoría y tienda.

Tabla 15. Matriz de estrategias de caching por entidad
| Entidad | Estrategia | TTL | Invalidación | Notas |
|---|---|---:|---|---|
| Precio proveedor | Cache‑Aside | 15 min | Evento actualización + TTL | Jitter en scheduler[^9] |
| Stock depósito | Cache‑Aside | 5 min | Evento actualización + TTL | Prioridad freshness |
| Catálogo producto | Query Caching + Pre‑fetch | 24 h | Rebuild nocturno | Enriquecimiento GS1 |
| PO/ACK | Write‑Through (colas) | N/A | ACK recibido | Persistencia en DB |
| Factura | Write‑Behind | N/A | Conciliación | Auditoría y cumplimiento |

Tabla 16. Políticas de sincronización
| Frecuencia | Trigger | Fuente | Destino | Validación |
|---|---|---|---|---|
| 15 min (precios) | Scheduler + jitter | Maxiconsumo API | Redis + DB | JSON Schema + diff[^12] |
| 5 min (stock) | Scheduler + jitter | Maxiconsumo API | Redis + DB | JSON Schema |
| Diario (catálogo) | Batch | API/EDI | DB + Redis | GS1 + reconciliación[^7][^8] |
| Near real‑time (PO) | Evento | App/ERP | EDI/API | ACK correlacionado[^4] |
| Batch (factura) | VAN/AS2 | Proveedor | DB | Mapeo EDI 810[^4] |

---

## Documentación técnica de integraciones

La documentación técnica es un componente crítico para la mantenibilidad y la gobernanza del ciclo de vida de las integraciones. Se definen contratos OpenAPI 3.1 para cada conector, describiendo endpoints, parámetros, cuerpos, respuestas, ejemplos y esquemas. JSON Schema valida payloads y errores; EDI se documenta con mapeos lógicos y guías de implementación. Se incluyen guías de operación (runbooks) para escenarios de error y degradación, y lineamientos de versionado, seguridad y pruebas.

Tabla 17. Estructura de documentación por conector
| Sección | Contenido |
|---|---|
| Info y servidores | Título, versión, base URLs, contact/license |
| Security | Schemes (API key, bearer, OAuth2), scopes, RBAC[^12] |
| Paths y operaciones | GET/POST/PUT/DELETE con parámetros y cuerpos |
| Schemas | Definiciones de producto, precio, stock, error |
| Examples | Ejemplos de request/response por operación |
| Error model | Estructura JSON de error, códigos y semántica |
| EDI mapping | Documentos 850/855/810/846/832 y tablas internas[^4][^13] |
| Runbooks | Procedimientos de incidentes y degradación |
| Testing | Casos sintéticos, datasets y criterios de aceptación |
| Changelog | Versiones, deprecación y migración |

Tabla 18. Matriz de versionado
| Componente | Versión | Política de deprecación | Migración |
|---|---:|---|---|
| API Maxiconsumo | v1 | 6–12 meses | Guía de cambios + SDK |
| OpenAPI/Schema | 3.1 | N/A | Compatibilidad hacia atrás |
| EDI docs | 2025.1 | Con aviso de VAN | Nuevos mapeos y pruebas |
| Conectores | 1.0.x | Releases mensuales | Hotfix y features |

La especificación OpenAPI habilita modularidad (componentes reutilizables), ejemplos ricos y descripción de seguridad; los documentos EDI incluyen mapeos normativos y pruebas de conformidad[^12][^4][^13].

---

## Plan de pruebas, despliegue y operación

El plan de pruebas abarca unitarias, integración, end‑to‑end (E2E), performance y resiliencia (chaos). Se definen datasets sintéticos y reales, criterios de aceptación por flujo y dashboards de resultados. El despliegue utiliza entornos dev/test/stage/prod, políticas de feature flags y canary releases para conectores; se prevé rollback y reindexación de cachés. La operación incluye runbooks, monitoreo 24/7, gestión de incidentes y la función de “página de estado” interna.

Tabla 19. Matriz de pruebas
| Tipo de prueba | Cobertura | Datos | Herramientas | Criterios de aceptación |
|---|---|---|---|---|
| Unitarias | Lógica de conectores | Sintéticos | Jest/PyTest | > 90% cobertura |
| Integración | API/EDI | Sintéticos + sandbox | Postman/Newman | Endpoints OK |
| E2E | Flujos críticos | Reales (staging) | Scripts automatizados | KPIs: freshness/latency |
| Performance | Carga/estrés | Mix de operaciones | k6/JMeter | p95 < 2s sin errors |
| Resiliencia | Chaos y fallos | Inducidos | Fault injection | Circuit breaker y retries OK |
| Seguridad | Auth/esquemas | Pentest/validación | OWASP ZAP | Cumplimiento políticas |

Tabla 20. Plan de despliegue/rollback por conector
| Entorno | Paso | Validación | Rollback |
|---|---|---|---|
| Dev | Despliegue conector API | Tests unit/integration | Revertir commit |
| Test | Prueba E2E | KPIs y alertas | Rollback + limpieza |
| Stage | Canary release | Métricas y trazas | Flag off + revert |
| Prod | Despliegue completo | Observabilidad estable | Reindexar cachés |

---

## Riesgos, cumplimiento y gobernanza

Los riesgos abarcan legales y de TOS (robots.txt), disponibilidad de proveedores, límites de tasa, calidad de datos y performance. La mitigación combina pruebas POC, acuerdos de nivel de servicio (SLA), fallbacks (EDI/cache/degradación) y auditorías de cumplimiento. La gobernanza del catálogo de proveedores (SRM) define responsabilidades y rituales de revisión (RACI), segmentación y KPIs de desempeño. La estrategia de scraping responsable se somete a auditoría legal, con respeto de robots.txt/TOS, rate limiting y políticas de privacidad[^3][^15][^5].

Tabla 21. Registro de riesgos (extracto)
| Riesgo | Probabilidad | Impacto | Plan de mitigación | Responsable | Estado |
|---|---|---|---|---|---|
| API Maxiconsumo no disponible | Media | Alto | POC, SLA, fallback EDI/cache | Integración/Compras | Abierto |
| Rate limit no documentado | Media | Medio | Token bucket + reintentos | Arquitectura/TI | Abierto |
| Calidad de datos maestros | Alta | Alto | Gobernanza + validaciones | Operaciones/SRM | Abierto |
| Performance en picos | Media | Medio | Bulkheads + caching | TI/Arquitectura | Abierto |
| Scraping no conforme | Baja | Alto | Auditoría legal + salvaguardas | Legal/Integración | Abierto |

Tabla 22. RACI de gobernanza (integraciones y SRM)
| Actividad | Compras | Legal | Operaciones | Integración | SRM Lead | Seguridad |
|---|---|---|---|---|---|---|
| Onboarding proveedor | R | A | C | C | C | C |
| Contratos/SLA | C | A | C | C | C | C |
| Configuración API/EDI | C | C | C | A | C | R |
| Evaluación y scoring | C | C | C | C | A | C |
| Monitoreo/alertas | C | C | R | A | C | C |

---

## Gaps de información y plan de cierre

Se reconocen brechas específicas que requieren acciones concretas:

- Endpoints oficiales, autenticación y rate limits de la API de Maxiconsumo: no documentados públicamente. Acción: negociación de credenciales y POC técnico con pruebas de conectividad, latencia y resiliencia; registro de límites observados y acuerdos de SLA[^2].
- Disponibilidad de EDI de Maxiconsumo y otros proveedores: por confirmar. Acción: relevamiento por proveedor; pruebas con VAN/AS2 donde aplique[^16].
- Políticas de scraping y cumplimiento legal: por definir. Acción: auditoría legal previa, respeto de robots.txt/TOS y rate limiting; registro de evidencias[^3].
- VAN/AS2: costos y SLA. Acción: evaluación de opciones (AS2 directo vs VAN), TCO y onboarding; decisión informada por volumen/socios[^16].
- Pesos del motor de asignación: valores iniciales propuestos; calibración con históricos. Acción: calibración por categoría en sprints posteriores.
- Mapa de categorías propio y taxonomía GS1 GPC: pendiente de construcción con negocio; alineación GS1 para interoperabilidad[^7][^8].
- Umbrales de stock mínimo y políticas de seguridad (IAM, rotación de API keys): formalización con Operaciones y Seguridad.

El cierre de estos gaps es prerrequisito para la estabilización de la operación y la extensión a más proveedores con bajo costo de mantenimiento.

---

## Anexos técnicos

Los anexos consolidan plantillas y mapeos para acelerar el desarrollo y asegurar consistencia entre equipos y proveedores.

Tabla 23. Plantilla de mapeo JSON Schema ↔ modelo interno
| JSON/Schema | Tipo | Regla | Tabla interna |
|---|---|---|---|
| sku | string | required, pattern | productos.codigo_barras |
| gtin | string | length/dv | productos.gtin |
| name | string | minLength | productos.nombre |
| brand | string | required | productos.marca |
| category | string | enum | categorias.nombre |
| price | number | minimum 0 | precios_proveedor.precio |
| currency | string | enum ISO 4217 | precios_proveedor.moneda |
| unit_measure | string | enum SI | productos.unidad_medida |
| valid_from/to | string | ISO 8601 | precios_proveedor.vigencia |
| attributes | object | additionalProperties | productos.atributos |

Tabla 24. Mapeo EDI 850/855/810/846/832 ↔ tablas internas
| Documento | Campo EDI | Tabla/Columna |
|---|---|---|
| 850 | BEG03 (PO Date) | pedidos.fecha |
| 850 | PO1 (SKU, Qty, Price) | pedido_items.sku, cantidad, precio |
| 855 | ACK (PO Number, Status) | pedidos.status |
| 810 | INV (Invoice Number, Total) | facturas.numero, total |
| 846 | LIN (SKU, Qty) | stock_deposito.producto_id, stock_actual |
| 832 | LIN (SKU, Price, Descripción) | productos, precios_proveedor |

---

## Referencias

[^1]: Choosing between EDI vs API? - SPS Commerce. https://www.spscommerce.com/edi-guide/edi-vs-api/  
[^2]: Maxiconsumo (Sitio Oficial). https://www.maxiconsumo.com/  
[^3]: Web Scraping Best Practices - Zyte. https://www.zyte.com/learn/web-scraping-best-practices/  
[^4]: Electronic Data Interchange (EDI) Transactions Guide - Cleo. https://www.cleo.com/blog/knowledge-base-edi-transactions  
[^5]: ¿Qué es el monitoreo de API? - IBM. https://www.ibm.com/mx-es/think/topics/api-monitoring  
[^6]: Circuit Breaker Pattern - Azure Architecture Center. https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker  
[^7]: GS1 Standards. https://www.gs1.org/standards  
[^8]: GS1 General Specifications (PDF). https://www.gs1jp.org/assets/img/pdf/GS1_General_Specifications.pdf  
[^9]: Timeouts, retries and backoff with jitter - AWS Builders Library. https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/  
[^10]: Top 15 REST API Connectors For ETL Use Cases - Integrate.io. https://www.integrate.io/blog/rest-api-connectors/  
[^11]: Caché - Redis. https://redis.io/es/soluciones/casos-de-uso/cache/  
[^12]: OpenAPI Specification - Version 3.1.0 - Swagger. https://swagger.io/specification/  
[^13]: EDI Standards and Protocols: What You Need to Know - Epicor. https://www.epicor.com/en-us/blog/supply-chain-management/edi-standards-and-protocols-what-you-need-to-know/  
[^14]: Reliability Patterns Through an API Gateway. https://medium.com/@aishahsofea/reliability-patterns-through-an-api-gateway-44a9d9784232  
[^15]: What is Supplier Relationship Management (SRM)? - SAP. https://www.sap.com/products/spend-management/supplier-relationship-management-srm.html  
[^16]: Direct EDI (AS2) vs. VANs: Pros, Cons and The Basics - CData Arc. https://arc.cdata.com/blog/20190405-direct-as2-vs-van-edi  
[^17]: Configuración de Redis como memoria caché - IBM Cloud Docs. https://cloud.ibm.com/docs/databases-for-redis?topic=databases-for-redis-redis-cache&locale=es  
[^18]: Redis Data Integration (RDI). https://redis.io/es/data-integration/