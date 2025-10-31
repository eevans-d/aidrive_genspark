# Blueprint de Especificación de APIs Internas para el Sistema Mini Market

## 1. Propósito, alcance y contexto

Este documento define, con enfoque de ejecución, la especificación técnica y la guía de diseño de las APIs internas del Sistema Mini Market para los dominios de Productos, Proveedores, Stock e Inventario, y Precios. El objetivo es estandarizar contratos, patrones de diseño, seguridad, gobernanza de cambios, observabilidad y validaciones, de manera que las interfaces sirvan tanto al monolito modular inicial como a los microservicios hacia los que evolucionará el sistema.

La especificación se fundamenta en tres pilares de contexto:
- Los procesos actuales del Mini Market muestran alta fricción manual, baja trazabilidad y una brecha importante frente a estándares de retail moderno; priorizar una API consistente, segura y observable es clave para elevar la automatización y reducir errores operativos, especialmente en inventario y precios.[^1]
- La arquitectura técnica propuesta adopta un stack moderno (Node.js/Express o Python/FastAPI, PostgreSQL, Redis, RabbitMQ), con metas explícitas de disponibilidad (99.9%), latencia p95 < 2 s en consultas críticas, y patrones de consistencia que eviten sobreventa (overselling) y garanticen una única fuente de verdad del inventario.[^2]
- El diseño de APIs se alinea con prácticas reconocidas de diseño REST, seguridad y documentación contract-first bajo OpenAPI 3.1, con versionado explícito y semántica estable para facilitar la evolución controlada y el consumo por clientes internos y externos.[^3][^4]

Alcance de la versión inicial (v1):
- Recursos: Productos, Proveedores, Stock e Inventario, Precios, y Seguridad/Usuarios (para autenticación y autorización).
- Patrones transversales: paginación, filtrado, ordenación, selección de campos, idempotencia en operaciones sensibles, caché por lectura pesada, rate limiting, validaciones, manejo de errores y auditoría.
- Exclusiones de la v1: funciones avanzadas de analítica, integración EDI con proveedores no-API, y capacidades de e-commerce; se aborda integración con proveedores vía API y se dejan puntos de extensión para EDI según disponibilidad.[^10]

Criterios de aceptación:
- Contratos OpenAPI 3.1 publicados y versionados, con ejemplos y esquemas firmados por los equipos de arquitectura y QA.
- Cobertura de pruebas contractuales (consumer-driven) y validaciones de seguridad y performance alineadas a SLO.

Brechas de información (conocidas) que deben cerrarse antes del hardening de producción:
- Documentación oficial y SLAs de la API del proveedor Maxiconsumo Necochea (autenticación, límites, base_url, versión).
- Volúmenes operacionales (SKUs, TPS pico, pedidos/día) para calibrar índices, cachés y rate limits.
- Políticas definitivas de seguridad y cumplimiento (retención, ISO/PCI, RTO/RPO).
- Definición final de roles y permisos RBAC por entorno y módulo.
- Plantillas de labeling y estándares de trazabilidad (lotes, ubicaciones) que impactan validaciones y auditoría.
- Estrategia cloud y presupuesto (selección de proveedor, dimensionamiento).
- Estrategia de auditoría y retención (log de cambios de precios/stock, acceso).

Estas brechas no impiden el avance de la definición y prototipos, pero condicionan valores concretos (cuotas, TTLs, índices, políticas) y su validación final.

Principales referencias en esta sección: mejores prácticas de inventario y procesos retail,[^1] arquitectura de referencia para inventario y consistencia,[^2] y patrones de API unificada para retail.[^5]

---

## 2. Principios de diseño y arquitectura REST

El diseño REST interno sigue principios que maximizan claridad, previsibilidad y seguridad, reduciendo el costo de integración y mantenimiento.

Primero, las convenciones de recursos y URIs priorizan sustantivos en plural, minúsculas, guiones para legibilidad, y anidamiento limitado a una profundidad para preservar estabilidad y evitar acoplamientos frágiles.[^6][^7] La semántica HTTP se respeta: GET para lectura, POST para creación o acciones no idempotentes, PUT para reemplazo total, PATCH para modificaciones parciales, DELETE para eliminación (con safeguard). El versionado se expresa en la ruta base (/v1), evitando romper clientes ante evoluciones necesarias.[^6][^7]

Segundo, el modelo de recursos evita URIs verbales; las acciones se modelan como subrecursos o se encapsulan mediante POST sobre endpoints de control, preservando la interpretatividad REST. Filtros, orden, paginación y selección de campos forman parte de los parámetros de consulta, con defaults seguros para no sobrecargar backend ni red.[^6]

Tercero, la especificación es contract-first: OpenAPI 3.1 describe componentes reutilizables (schemas, parameters, responses, securitySchemes) para asegurar consistencia, habilitar validación automatizada y generar documentación interactiva de alta calidad.[^4]

Para ilustrar las convenciones clave, se presenta la Tabla 1.

Tabla 1. Convenciones de naming y uso de métodos HTTP
| Recurso | URI base | Métodos principales | Ejemplos de operaciones | Anidamiento permitido |
|---|---|---|---|---|
| Productos | /v1/products | GET, POST, PUT, PATCH, DELETE | GET /v1/products?categoryId=...; POST /v1/products | 1 nivel: /v1/products/{id}/media |
| Proveedores | /v1/suppliers | GET, POST, PUT, PATCH, DELETE | GET /v1/suppliers?search=...; PATCH /v1/suppliers/{id} | 1 nivel: /v1/suppliers/{id}/credentials |
| Stock/Inventario | /v1/inventory | GET, POST, PATCH; DELETE en movimientos | POST /v1/inventory/movements (idempotente) | 1 nivel: /v1/inventory/locations/{id}/stock |
| Precios | /v1/prices | GET, POST, PATCH; POST /v1/prices/bulk-apply | GET /v1/prices?sku=...; POST /v1/prices/rules | 1 nivel: /v1/prices/history?sku=... |

Estas convenciones se apoyan en guías de diseño REST consolidadas.[^6][^7] En particular:
- Filtrado: parámetros query con nombres explícitos (ej., categoryId, active, q, minStock, maxStock).
- Orden: sort=field[,field]; dirección asc/desc o marcas implícitas; ejemplo sort=lastUpdated:desc.
- Paginación: page (>=1) y pageSize (20 por defecto, 100 máximo), o alternativa limit/offset (limit<=200, offset múltiplo de pageSize); se debe elegir una y mantenerla consistente.
- Selección de campos: fields=name,brand,category (reducir payload y costo de serialización).
- Idempotencia: claves de idempotencia (Idempotency-Key) para POST críticos (movimientos, precios masivos).

Tabla 2. Parámetros de consulta admitidos por recurso (síntesis)
| Recurso | Filtros comunes | Orden | Paginación | Selección de campos |
|---|---|---|---|---|
| Products | q, categoryId, brand, active, gtin | sort=lastUpdated,name | page/pageSize | fields=name,gtin,brand,category,status |
| Suppliers | q, type, active, location | sort=name | page/pageSize | fields=name,type,location,active |
| Inventory | sku, locationId, minStock, maxStock | sort=sku,lastUpdated | page/pageSize o limit/offset | fields=sku,location,available,reserved |
| Prices | sku, supplierId, active, effectiveDateFrom/To | sort=sku,lastUpdated | page/pageSize | fields=sku,supplierId,price,currency |

Referencias de diseño: mejores prácticas REST 2025 y guía Microsoft para APIs.[^6][^7]

---

## 3. Modelo de dominio y recursos API

El modelo de datos operativo para retail pequeño–mediano integra entidades y relaciones que permiten operar con precisión, trazabilidad y auditoría. Sobre un núcleo transaccional en PostgreSQL y cachés selectivos en Redis, los recursos API exponen vistas consistentes con las necesidades de lectura y escritura.[^8][^9]

Las entidades maestras clave son:
- Producto: sku, gtin (barcode), nombre, marca, categoría, unidad de medida, atributos (JSONB), estados (activo/inactivo), timestamps.
- Proveedor: nombre, contacto, ubicación, tipo, configuración_api (JSONB), estado activo/inactivo.
- Categoría: jerarquía y atributos (margenes mínimos/máximos, markup por defecto).
- Precio por proveedor: producto_id, proveedor_id, precio, precio_anterior, fecha_actualizacion, fuente, activo.
- Stock por ubicación (almacén/depósito): producto_id, ubicación, stock_actual, stock_mínimo/máximo, última_actualización.
- Movimientos de inventario: entradas, salidas, transferencias, ajustes; con referencia a usuario, timestamp y motivo.

Tabla 3. Entidades principales y atributos mínimos
| Entidad | Atributos mínimos | Notas |
|---|---|---|
| Producto | id, sku (唯一), gtin (唯一 opcional), nombre, marca, categoría_id, unidad, activo, timestamps | attributes JSONB para metadatos |
| Proveedor | id, nombre, ubicación, tipo, activo, configuracion_api, timestamps | integraciones y credenciales encapsuladas |
| Categoría | id, nombre, jerarquía, margen_min, margen_max, markup_default | reglas de pricing derivadas |
| Precio | id, producto_id, proveedor_id, precio, precio_anterior, fecha_actualizacion, fuente, activo | unicidad parcial (producto, proveedor, activo) |
| Stock | id, producto_id, ubicación, stock_actual, stock_mínimo, stock_máximo, última_actualización | constraints no negativos |
| Movimiento | id, producto_id, tipo, cantidad, origen/destino, fecha, usuario_id, motivo | auditoría y trazabilidad |

Tabla 4. Relaciones y cardinalidades
| Relación | Tipo | Comentario |
|---|---|---|
| Proveedor–Precio | 1:N | Un proveedor many precios por producto |
| Producto–Precio | 1:N | Precio por proveedor |
| Producto–Stock | 1:N | Stock por ubicación |
| Categoría–Producto | 1:N | Clasificación |
| Pedido–Detalle | 1:N | Órdenes de compra |
| Producto–Movimiento | 1:N | Auditoría operativa |

Tabla 5. Índices/constraints para consultas críticas
| Consulta | Índice/Constraint |
|---|---|
| Precio vigente por SKU y proveedor | UNIQUE parcial (producto_id, proveedor_id, activo=true) |
| Stock por producto y ubicación | ÍNDICE compuesto (producto_id, ubicación) |
| Búsqueda por barcode | ÍNDICE único en gtin |
| Historial de precios | ÍNDICE (producto_id, fecha_actualizacion DESC) |
| Productos por categoría | ÍNDICE (categoría_id) |

Diseño参考: modelos de inventario y catálogos retail.[^8][^9]

---

## 4. Autenticación, autorización (JWT + RBAC) y seguridad

La seguridad de las APIs sigue el modelo OAuth2 con tokens JSON Web Token (JWT), portados en el encabezado Authorization: Bearer. Los scopes se alinean a acciones por recurso y rol (RBAC), con autorización en middleware de backend y verificación en frontend para una UX coherente con permisos.[^11][^12][^4] Todas las comunicaciones van sobre TLS; secretos se almacenan en mecanismos gestionados; se registran accesos y cambios sensibles en auditoría inmutable.[^11]

Roles base propuestos: admin, operador, viewer, auditor, integrador. Permisos por recurso de forma explícita.

Tabla 6. Matriz RBAC (roles × permisos × recurso)
| Recurso | Acción | admin | operador | viewer | auditor | integrador |
|---|---|---|---|---|---|---|
| Products | read | ✓ | ✓ | ✓ | ✓ | ✓ |
|  | create/edit/delete | ✓ | ✓ |  |  |  |
| Suppliers | read | ✓ | ✓ | ✓ | ✓ | ✓ |
|  | create/edit/delete | ✓ |  |  |  |  |
| Inventory | read | ✓ | ✓ | ✓ | ✓ | ✓ |
|  | movimientos (POST) | ✓ | ✓ |  |  |  |
| Prices | read | ✓ | ✓ | ✓ | ✓ | ✓ |
|  | create/edit/apply | ✓ | ✓ |  |  | ✓ (solo vía conector) |
| Audit | read/export | ✓ |  |  | ✓ |  |

Implementación práctica:
- En backend: middleware verifica firma JWT, scopes y permisos por ruta/acción; deniega con 403 si aplica.[^11]
- En frontend: componentes y rutas protegidas consultan el rol desde el JWT (sin revelar lógica sensible); se ocultan acciones no permitidas.

Tabla 7. Cabeceras de seguridad y semántica
| Header | Uso | Requerido |
|---|---|---|
| Authorization: Bearer <jwt> | Autenticación por token | Sí (salvo endpoints públicos) |
| Idempotency-Key | Clave para idempotencia en POST sensibles | Recomendado (obligatorio en operaciones críticas) |
| X-Request-Id | Correlación de trazas end-to-end | Recomendado |
| X-Rate-Limit-* | Respuesta de límites (limit, remaining, reset) | Incluido por el gateway |

Los esquemas de seguridad se declaran en OpenAPI 3.1 (components/securitySchemes), alineados al estándar y a prácticas contract-first.[^4]

---

## 5. Endpoints específicos por dominio

Esta sección cataloga las rutas, métodos, parámetros y payloads de los recursos, respetando filtros, orden, paginación, idempotencia, y códigos HTTP. Las respuestas incluyen enlaces y metadatos de paginación consistentes.[^6][^7]

Tabla 8. Catálogo maestro de endpoints (resumen)
| Método | Ruta | Descripción | Auth | Rate limit (indicativo) |
|---|---|---|---|---|
| GET | /v1/products | Lista de productos con filtros y paginación | Bearer | Medio |
| POST | /v1/products | Crear producto | admin/operador | Bajo |
| GET | /v1/products/{id} | Detalle de producto | Bearer | Alto |
| PATCH | /v1/products/{id} | Actualización parcial | admin/operador | Medio |
| PUT | /v1/products/{id} | Reemplazo total | admin/operador | Bajo |
| DELETE | /v1/products/{id} | Desactivación lógica | admin | Bajo |
| GET | /v1/suppliers | Lista de proveedores | Bearer | Medio |
| POST | /v1/suppliers | Crear proveedor | admin | Bajo |
| GET | /v1/suppliers/{id} | Detalle de proveedor | Bearer | Alto |
| PATCH | /v1/suppliers/{id} | Editar proveedor | admin | Medio |
| GET | /v1/inventory | Stock por ubicación y filtros | Bearer | Alto |
| POST | /v1/inventory/movements | Registrar movimiento (idempotente) | admin/operador | Bajo (con clave) |
| GET | /v1/prices | Precios vigentes e históricos | Bearer | Alto |
| POST | /v1/prices/bulk-apply | Aplicar cambios masivos (idempotente) | admin/operador | Bajo (con clave) |

Tabla 9. Filtros, orden y paginación por recurso (síntesis)
| Recurso | Filtros | Orden | Paginación |
|---|---|---|---|
| Products | q, categoryId, brand, active, gtin | sort=name,lastUpdated | page/pageSize o limit/offset |
| Suppliers | q, type, active, location | sort=name | page/pageSize |
| Inventory | sku, locationId, minStock, maxStock | sort=sku,lastUpdated | page/pageSize o limit/offset |
| Prices | sku, supplierId, active, effectiveDateFrom/To | sort=sku,lastUpdated | page/pageSize |

El uso de Idempotency-Key es obligatorio para POST de movimientos y para operaciones bulk de precios (mitiga duplicidades bajo reintentos).[^6][^7]

### 5.1 Productos

Modelo de datos: Product { id, sku, gtin, name, brand, categoryId, unit, attributes (JSONB), status (active/inactive), createdAt, updatedAt }.

Endpoints:
- GET /v1/products
  - Filtros: q (texto libre en name/brand), categoryId, brand, active (true/false), gtin.
  - Orden: sort=name,lastUpdated.
  - Paginación: page/pageSize (por defecto 20, máx. 100).
  - Respuesta: lista con fields reducidos; metadatos de paginación; enlaces HATEOAS a detalle.
- GET /v1/products/{id}
  - Respuesta: Product completo; links a subrecursos (ej., media).
- POST /v1/products
  - Requiere: name, sku, unit; gtin único si se provee; categoría válida.
  - Idempotencia: aceptada con Idempotency-Key.
  - Seguridad: admin/operador.
- PATCH /v1/products/{id}
  - Campos editables: name, brand, categoryId, unit, attributes, status.
- PUT /v1/products/{id}
  - Reemplazo completo (validación de campos requeridos).
- DELETE /v1/products/{id}
  - Desactivación lógica; no elimina físicamente si hay relaciones vivas (auditable).

Tabla 10. Endpoints de Productos (método, ruta, parámetros, payload, respuesta)
| Método | Ruta | Parámetros clave | Request (resumen) | Response (resumen) |
|---|---|---|---|---|
| GET | /v1/products | q, categoryId, brand, active, gtin, sort, page, pageSize, fields | — | { data: [ProductLite], meta: { page, pageSize, total }, links: { self, next } } |
| GET | /v1/products/{id} | fields | — | Product |
| POST | /v1/products | Idempotency-Key | { sku, gtin?, name, brand, categoryId, unit, attributes? } | 201 Created + Location: /v1/products/{id} |
| PATCH | /v1/products/{id} | — | Partial<Product> | Product |
| PUT | /v1/products/{id} | — | Product | Product |
| DELETE | /v1/products/{id} | — | — | 204 No Content |

### 5.2 Proveedores

Modelo: Supplier { id, name, contact, address, location, type, active, apiConfig (JSONB), createdAt, updatedAt }.

Endpoints:
- GET /v1/suppliers
  - Filtros: q, type, active, location.
- POST /v1/suppliers
  - Requiere: name; validaciones de unicidad de nombre según políticas internas.
- GET /v1/suppliers/{id}
- PATCH /v1/suppliers/{id}
- GET /v1/suppliers/{id}/credentials
  - Respuesta sanitizada (sin secretos); solo metadatos y estado.

Tabla 11. Endpoints de Proveedores
| Método | Ruta | Parámetros | Request | Response |
|---|---|---|---|---|
| GET | /v1/suppliers | q, type, active, location, sort, page, pageSize | — | { data: [SupplierLite], meta, links } |
| POST | /v1/suppliers | — | { name, type, contact?, address?, location? } | 201 Created |
| GET | /v1/suppliers/{id} | fields | — | Supplier |
| PATCH | /v1/suppliers/{id} | — | Partial<Supplier> | Supplier |
| GET | /v1/suppliers/{id}/credentials | — | — | { name, lastRotatedAt, status } |

La gestión de relaciones con proveedores (SRM) y su scoring operativo se guía por principios de SRM.[^12]

### 5.3 Stock e Inventario

Modelo: Inventory { id, sku, locationId, available, reserved, minStock, maxStock, lastUpdated }. Movement { id, sku, type (entrada/salida/transfer), quantity, from/to, reason, userId, createdAt }.

Endpoints:
- GET /v1/inventory
  - Filtros: sku, locationId, minStock, maxStock; orden por sku/lastUpdated.
- GET /v1/inventory/stock-by-location
  - Vista agregada por ubicación y producto.
- GET /v1/inventory/alerts
  - Listado de productos bajo mínimos o en riesgo (según reglas de reorden).
- POST /v1/inventory/movements
  - Idempotencia obligatoria: Idempotency-Key; request body con sku, type, quantity, location(s), reason.
- GET /v1/inventory/movements?sku=...
  - Historial de movimientos para auditoría.

Tabla 12. Endpoints de Stock/Inventario
| Método | Ruta | Parámetros | Request | Response |
|---|---|---|---|---|
| GET | /v1/inventory | sku, locationId, minStock, maxStock, sort, page | — | { data: [Inventory], meta, links } |
| GET | /v1/inventory/stock-by-location | sku?, locationId? | — | [{ locationId, items: [...] }] |
| GET | /v1/inventory/alerts | riskWindow?, onlyUnderMin? | — | [{ sku, locationId, available, minStock, suggestedQty }] |
| POST | /v1/inventory/movements | Idempotency-Key | { sku, type, quantity, from?, to, reason } | 201 Created + { movementId } |
| GET | /v1/inventory/movements | sku, type?, page | — | { data: [Movement], meta } |

### 5.4 Precios

Modelo: Price { id, sku, supplierId, price, currency, validFrom, validTo, active, lastUpdatedBy?, source }.

Endpoints:
- GET /v1/prices
  - Filtros: sku, supplierId, active (true/false), effectiveDateFrom/To.
- GET /v1/prices/current?sku=...&supplierId=...
  - Precio vigente por SKU/proveedor; respuesta cacheable con ETag.
- GET /v1/prices/history?sku=...
  - Historial auditable (para reportes).
- POST /v1/prices/bulk-apply
  - Acepta lote de cambios con Idempotency-Key; valida reglas yaudita cada actualización.

Tabla 13. Endpoints de Precios
| Método | Ruta | Parámetros | Request | Response |
|---|---|---|---|---|
| GET | /v1/prices | sku, supplierId, active, effectiveDateFrom/To, sort, page | — | { data: [Price], meta } |
| GET | /v1/prices/current | sku, supplierId | — | { sku, supplierId, price, currency, validFrom, validTo, active } |
| GET | /v1/prices/history | sku, from?, to?, page | — | { data: [PriceSnapshot], meta } |
| POST | /v1/prices/bulk-apply | Idempotency-Key | [{ sku, supplierId, price, currency, validFrom? }] | 207 Multi-Status + detalles por ítem |

El diseño de precios masivos y su trazabilidad se alinea a prácticas de retail y control de cambios.[^5]

---

## 6. Contratos OpenAPI/Swagger (versionado y componentes)

La especificación OpenAPI 3.1 formaliza el contrato de las APIs. Se define un documento por versión mayor (/v1), con objetos principales: openapi, info (title, version, contact, license), servers, paths, components (schemas, parameters, responses, securitySchemes), tags, externalDocs.[^4][^13][^14][^15]

Componentes clave a normalizar:
- Schemas: Product, Supplier, Inventory, Price, Error, PageMeta.
- Parameters: sku (path/query), fields, sort, page, pageSize, limit, offset.
- Responses: BadRequest, NotFound, Conflict, Unauthorized, Forbidden, InternalError, RateLimited.
- securitySchemes: bearerAuth (HTTP bearer JWT), apiKey (x-api-key) para integradores externos selectivos.

Tabla 14. Inventario de componentes OAS reutilizables
| Tipo | Nombre | Propósito | Ejemplos de uso |
|---|---|---|---|
| schemas | Product | Modelo de producto | GET /v1/products |
| schemas | Supplier | Modelo de proveedor | GET /v1/suppliers |
| schemas | Inventory | Stock e inventario | GET /v1/inventory |
| schemas | Price | Precio por proveedor | GET /v1/prices/current |
| schemas | Error | Respuesta estándar de error | Todas las operaciones |
| parameters | fields | Selección de campos | GET /v1/products?fields=name,brand |
| parameters | sort | Ordenación | GET /v1/products?sort=name:asc |
| parameters | page, pageSize | Paginación | GET /v1/products?page=2&pageSize=50 |
| responses | NotFound | Entidad no hallada | GET /v1/products/{id} |
| responses | RateLimited | Límite excedido | Cualquier operación con 429 |
| securitySchemes | bearerAuth | OAuth2/JWT | global o por operación |
| securitySchemes | apiKey | Integradores | endpoints específicos |

Tabla 15. Matriz de versionado, compatibilidad y deprecación
| Versión | URI base | Cambios | Política de compatibilidad | Deprecación |
|---|---|---|---|---|
| v1 | /v1 | Contrato inicial | Mantener compatibilidad hacia atrás para fields y semantics | Anuncio con 180 días de antelación |
| v1.1 | /v1 | Adición de campos opcionales y endpoints auxiliares | Backward-compatible por diseño | Ventana de 90 días |
| v2 | /v2 | Cambios de semántica o remociones | No compatible con v1 | Coexistencia mínima 6 meses |

La documentación se sirve con Swagger UI para exploración interactiva y pruebas de parámetros.[^14][^15]

---

## 7. Manejo de errores, auditoría y trazabilidad

Se adopta un modelo de error consistente, con payload JSON estructurado que facilita diagnóstico y trazabilidad, y códigos HTTP alineados a la semántica estándar.[^16][^17][^18] La auditoría registra cambios en precios y movimientos de inventario con trazabilidad completa (quién, cuándo, qué antes/después).

Tabla 16. Mapa de códigos HTTP por escenario
| Escenario | Código | Significado |
|---|---|---|
| Validación fallida (400) | 400 Bad Request | Parámetros o payload inválido |
| No autenticado | 401 Unauthorized | Falta o token inválido |
| No autorizado | 403 Forbidden | Rol/permiso insuficiente |
| No encontrado | 404 Not Found | Recurso inexistente |
| Conflicto de negocio | 409 Conflict | Duplicidad, estado incompatible |
| Error de validación semántica | 422 Unprocessable Entity | Regla de negocio violada |
| Exceso de solicitudes | 429 Too Many Requests | Rate limit excedido |
| Error interno | 500 Internal Server Error | Condición inesperada |
| Servicio no disponible | 503 Service Unavailable | Sobrecarga o mantenimiento |

Tabla 17. Formato estándar de error (campos y semántica)
| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| error | string | Código estable del error | invalid-sku |
| message | string | Mensaje legible para humanos | El SKU proporcionado no es válido |
| detail | string | Información adicional para diagnóstico | SKU debe tener entre 4 y 32 alfanuméricos |
| traceId | string | Identificador de traza | 4f1e-... |
| retriable | boolean | Sugerencia de reintento | false |
| docsUrl | string | Enlace a documentación | https://api.example/docs/errors/invalid-sku |

Tabla 18. Eventos de auditoría (quién, cuándo, qué, antes/después)
| Recurso | Acción | Campos auditables | Política de retención |
|---|---|---|---|
| Price | create/update | sku, supplierId, precio_anterior, precio_nuevo, actor, timestamp | 24 meses (ajustable) |
| Inventory movement | create | sku, tipo, cantidad, origen/destino, motivo, actor | 24 meses |
| Product | create/update/delete | campos antes/después relevantes | 24 meses |
| Supplier | create/update | campos maestros relevantes | 24 meses |

La selección y semántica de códigos sigue buenas prácticas y guías de la industria.[^16][^17][^18]

---

## 8. Rate limiting, validaciones y protección

Las cuotas de uso protegen la estabilidad y la equidad del sistema. Se implementa un limitador por endpoint y por identidad (usuario/API key/IP) con ventana deslizante, almacenes compartidos en Redis para entornos multiinstancia y cabeceras de respuesta que orienten al cliente sobre el consumo.[^19][^20][^21][^22][^23]

Valores por defecto (indicativos; se calibrarán cuando se disponga de volúmenes reales):
- Lecturas (GET): 600 req/min por usuario; 1200 req/min por API key.
- Escrituras (POST/PUT/PATCH/DELETE): 120 req/min por usuario; 240 req/min por API key.
- Endpoints de integración con proveedores: 60 req/min por conector.
- Picos y bursts: permitir hasta 2× la cuota en 10 s (sliding window) con enfriamiento.

Encabezados de respuesta:
- X-Rate-Limit-Limit, X-Rate-Limit-Remaining, X-Rate-Limit-Reset (epoch seconds).

Tabla 19. Políticas de rate limiting por rol/endpoint (resumen)
| Rol | Endpoint | Límite/min | Ventana | Acción al exceder |
|---|---|---|---|---|
| admin/operador | /v1/products (POST) | 60 | 60 s | 429 + Retry-After |
| viewer | /v1/inventory (GET) | 600 | 60 s | 429 |
| integrador | /v1/prices/bulk-apply | 30 | 60 s | 429 |
| cualquier | /v1/suppliers (GET) | 300 | 60 s | 429 |

Validaciones de entrada:
- SKU: 4–32 caracteres alfanuméricos y guiones; no vacíos.
- GTIN: numérico de 8, 12, 13 o 14 dígitos; validación de dígito verificador si se provee.
- Precios: numéricos >= 0; currency ISO-4217.
- Fechas: RFC3339; rangos coherentes (effectiveDateFrom <= effectiveDateTo).
- Movimientos: quantities enteras > 0; tipos váljos; ubicaciones existentes.
- Paginación: page>=1; pageSize<=100 (o limit<=200 según elección).
- Idempotencia: requerido en POST críticos; se almacena hash de request y resultado durante 24 h.

Tabla 20. Reglas de validación por recurso y campo (síntesis)
| Recurso | Campo | Reglas |
|---|---|---|
| Product | sku | requerido, ^[A-Za-z0-9-]{4,32}$ |
| Product | gtin | opcional, dígitos 8/12/13/14, check digit si presente |
| Supplier | name | requerido, 2–120 caracteres |
| Inventory Movement | quantity | requerido, entero > 0 |
| Price | price | requerido, >= 0, precisión 2 |
| Price | currency | requerido, ISO-4217 |
| Paginación | pageSize | <= 100 (por defecto 20) |

Gestión ante 429 (Too Many Requests): retornar Retry-After (segundos o epoch) y un body Error con retriable=true. Aplicar circuit breaker en clientes de integraciones internas si se detectan cascades.

Implementación y referencias: estrategias de límites y optimización en Amazon SP-API, rate limiting con Redis (comandos y patrones), y bibliotecas maduras para middleware en Node/Express.[^19][^20][^21][^22][^23]

---

## 9. Observabilidad: métricas, logs, trazas y SLO

La operación confiable requiere visibilidad en los “golden signals”: latencia, tráfico, errores y saturación.[^2] Se capturan métricas por recurso y operación, logs estructurados con traceId/requestId, y trazas distribuidas para flujos que cruzan varios módulos (por ejemplo, aplicar precio masivo y disparar alertas).

Tabla 21. Catálogo de métricas, logs y trazas por servicio
| Servicio | Métricas | Logs | Trazas |
|---|---|---|---|
| Productos | latencia p95/p99, throughput, 5xx | validaciones fallidas, conflictos de SKU | create/update, validaciones |
| Proveedores | latencia, errores | cambios en maestros | sincronización y lectura |
| Inventario | latencia, waits/locks, errores | movimientos, discrepancias | movimientos end-to-end |
| Precios | latencia, hit de caché, reintentos | actualizaciones, reglas, bulk-apply | aplicación masiva y auditoría |

Tabla 22. Matriz SLO/SLA (objetivos y umbrales)
| Operación | Objetivo p95 | Objetivo p99 | Observabilidad |
|---|---|---|---|
| GET /v1/products | < 150 ms | < 300 ms | hit ratio, tiempo DB |
| GET /v1/inventory | < 200 ms | < 400 ms | locks, índices |
| GET /v1/prices/current | < 150 ms | < 300 ms | ETag hit/miss, caché |
| POST /v1/inventory/movements | < 250 ms | < 500 ms | colas, DLQ si aplica |
| POST /v1/prices/bulk-apply | < 2 s | < 4 s | throughput, fallos por ítem |

Las metas se alinean a arquitecturas de referencia de inventario y prácticas de diseño para baja latencia y consistencia.[^2]

---

## 10. Seguridad adicional y cumplimiento

Se adoptan controles para mitigar riesgos de la OWASP Top 10 API, especialmente Improper Inventory Management, que destaca la importancia de documentar autenticación, errores, límites, políticas CORS y todos los endpoints expuestos.[^24] Se recomienda:
- Gestión de inventario de APIs y versión; deprecación controlada.
- Validaciones fuertes en servidor; sanitización de entradas y salidas.
- CORS restrictivo por origen, método y cabecera.
- Rotación de secretos; minimización de scopes en tokens.
- Auditoría de accesos y cambios con retención definida.
- Backups cifrados; pruebas periódicas de restauración.
- Revisiones trimestrales de permisos y claves.

Tabla 23. Checklist de seguridad API (OWASP API9)
| Control | Estado | Evidencia |
|---|---|---|
| Autenticación y autorización (JWT + RBAC) | En diseño | Matriz RBAC, middleware |
| Rate limiting y anti-abuso | En diseño | Políticas y headers |
| Validación exhaustiva de entradas | En diseño | Reglas por recurso |
| Errores sin filtraciones | En diseño | Error schema |
| CORS mínimo | En diseño | Política por entorno |
| Auditoría y trazabilidad | En diseño | Eventos y retención |
| Cifrado TLS | Obligatorio | Config de terminación TLS |
| Gestión de secretos | Obligatorio | KMS/Secrets manager |
| Inventario de APIs y versionado | En diseño | OpenAPI /v1, /v2 plan |
| Deprecación y sunset | En diseño | Política y cronograma |

Referencia: OWASP API Security Top 10 – Improper Inventory Management.[^24]

---

## 11. Estrategia de integración con proveedores (foco Maxiconsumo)

Patrones:
- API para consultas críticas (precios, stock bajo demanda) con reintentos y circuit breaker.
- EDI o ingestion batch para catálogos y órdenes de compra cuando el proveedor lo soporte.
- Scheduling orquestado por colas (RabbitMQ); frecuencias objetivo: precios cada 15 minutos, stock cada 5 minutos, catálogo diario.[^25][^26][^10]

Autenticación del conector: API Key en headers; timeouts estrictos; normalización de SKU y atributos; registro de eventos de ingesta y de errores con DLQ (Dead Letter Queue).

Tabla 24. Frecuencia y uso por recurso (consulta API del proveedor)
| Recurso | Método | Frecuencia | Uso operativo |
|---|---|---|---|
| Productos | GET | Diario | Sincronización de catálogo |
| Precios | GET | 15 min | Actualización de costos |
| Stock | GET | 5 min | Disponibilidad y reorden |
| Pedidos/OC | POST | Bajo demanda | Creación/gestión de órdenes |

Tabla 25. Política de reintentos, backoff, DLQ y escalamiento
| Tipo de error | Estrategia | Backoff | Acción | Escalamiento |
|---|---|---|---|---|
| Timeout/transitorio | Reintentos con jitter | Exponencial (2^n) | Reintentar hasta tope | Alerta si supera N |
| 4xx cliente (p.ej., 401) | Validar credenciales/contrato | N/A | No reintentar | Alerta inmediata |
| 5xx servidor | Reintentos + circuit breaker | Exponencial con límite | Retry diferido | Abrir caso soporte |
| Datos inconsistentes | Validación y cuarentena | N/A | Quarantine + revisión | Revisión con proveedor |

La decisión API vs EDI depende de volumen, latencia y capacidades del proveedor; se elige por caso de uso, siguiendo comparativas de la industria.[^10] La integración crea valor al automatizar datos críticos y reducir fricción operacional.[^25][^26]

---

## 12. Plan de pruebas, validación y gobernanza de cambios

Pruebas:
- Contract testing (consumer-driven): cada cliente interno genera pactos que el proveedor API debe cumplir; verificación continua.
- Unit e integración: cobertura ≥ 80% para módulos críticos.
- Seguridad: pruebas de autenticación/autorización, inyección, límites y abuso.
- Performance: pruebas de carga y estrés por recurso; calibración de índices y cachés.

Gobernanza:
- Versionado semántico y de documento OpenAPI; política de compatibilidad hacia atrás y deprecación con aviso.
- Catálogo interno de APIs y ownership claro por dominio.
- Tablero de SLOs y revisiones post-lanzamiento.

Tabla 26. Matriz de pruebas por endpoint (funcionales, seguridad, performance)
| Endpoint | Funcional | Seguridad | Performance |
|---|---|---|---|
| GET /v1/products | filtros, paginación, fields | auth, RBAC, rate limit | p95, p99, throughput |
| POST /v1/products | validaciones, idempotencia | auth, RBAC, payload sanitization | TPS en picos |
| GET /v1/inventory | agregaciones | auth, RBAC | p95/locks |
| POST /v1/inventory/movements | reglas, auditoría | idempotencia, RBAC | latencia DB |
| GET /v1/prices/current | caché, ETag | auth, RBAC | hit ratio |
| POST /v1/prices/bulk-apply | reglas por ítem | idempotencia, RBAC | throughput batch |

Las pruebas y la disciplina de release se apoyan en guías de documentación y mejores prácticas de calidad.[^14][^4]

---

## 13. Anexos

### 13.1 Ejemplos de payloads (JSON) y cabeceras

Ejemplo: POST /v1/products
```json
{
  "sku": "ABC-123",
  "gtin": "7791234567890",
  "name": "Leche Entera 1L",
  "brand": "Lácteos SA",
  "categoryId": 42,
  "unit": "unit",
  "attributes": { "package": "tetra-brik", "refrigerated": true }
}
```

Ejemplo: POST /v1/inventory/movements (con Idempotency-Key)
```json
{
  "sku": "ABC-123",
  "type": "entrada",
  "quantity": 24,
  "to": "DEPOT-MAIN",
  "reason": "receiving",
  "reference": "OC-2025-0001"
}
```

Ejemplo: Error 429
```json
{
  "error": "rate-limit-exceeded",
  "message": "Se superó la cuota de solicitudes",
  "detail": "Limite: 600/min; usuario: u-123; ventana actual exhausta",
  "traceId": "3b3f-...",
  "retriable": true,
  "docsUrl": "https://api.example/docs/errors/rate-limit-exceeded"
}
```

Cabeceras:
- Authorization: Bearer eyJhbGciOi...
- Idempotency-Key: 9c1e... (uuid)
- X-Request-Id: 4f1e...
- X-Rate-Limit-Limit: 600
- X-Rate-Limit-Remaining: 12
- X-Rate-Limit-Reset: 1731...

### 13.2 Plantilla base OpenAPI 3.1 (extracto representativo)

```yaml
openapi: 3.1.0
info:
  title: Mini Market APIs
  version: 1.0.0
  contact:
    name: API Support
    url: https://example.com/support
    email: apisupport@example.com
  license:
    name: Apache 2.0
    url: https://www.apache.org/licenses/LICENSE-2.0.html
servers:
  - url: /v1
    description: Internal API v1
tags:
  - name: products
  - name: suppliers
  - name: inventory
  - name: prices
paths:
  /products:
    get:
      tags: [products]
      summary: List products
      parameters:
        - $ref: '#/components/parameters/q'
        - $ref: '#/components/parameters/page'
        - $ref: '#/components/parameters/pageSize'
      responses:
        '200':
          description: A paged list of products
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProductPage'
components:
  parameters:
    q:
      name: q
      in: query
      schema: { type: string }
      description: Free text search in name/brand
    page:
      name: page
      in: query
      schema: { type: integer, minimum: 1, default: 1 }
    pageSize:
      name: pageSize
      in: query
      schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
  schemas:
    Product:
      type: object
      required: [id, sku, name, unit]
      properties:
        id: { type: string, format: uuid }
        sku: { type: string, pattern: '^[A-Za-z0-9-]{4,32}$' }
        gtin: { type: string }
        name: { type: string }
        brand: { type: string }
        categoryId: { type: integer }
        unit: { type: string }
        attributes: { type: object, additionalProperties: true }
        status: { type: string, enum: [active, inactive] }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
    ProductPage:
      type: object
      properties:
        data:
          type: array
          items: { $ref: '#/components/schemas/Product' }
        meta:
          type: object
          properties:
            page: { type: integer }
            pageSize: { type: integer }
            total: { type: integer }
        links:
          type: object
          properties:
            self: { type: string, format: uri }
            next: { type: string, format: uri }
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
security:
  - bearerAuth: []
```

Este esqueleto sirve como punto de partida para completar endpoints, esquemas y security requirements.[^4][^13]

### 13.3 Diagrama de arquitectura lógico (mención)

La arquitectura lógica ubica el API Gateway frente a los módulos internos (Productos, Proveedores, Inventario, Precios), con colas para integración de proveedores y cachés para lecturas frecuentes. La base de datos transaccional es PostgreSQL; Redis se emplea para caching y coordinación de rate limiters. La observabilidad se implementa con métricas, logs y trazas en toda la cadena. Este diseño se alinea a arquitecturas de inventario de referencia y al stack retail recomendado.[^2][^27]

---

## Cierre y acciones pendientes

Este blueprint estandariza las APIs internas del Sistema Mini Market, con contratos claros, seguridad robusta, y mecanismos de observabilidad y control acordes a las metas del negocio. Para llevar los contratos a estado “listo para producción”, se recomienda:
- Cerrar brechas de información de Maxiconsumo (API) y de volúmenes operativos.
- Afinar valores de rate limiting y TTLs de caché con datos reales.
- Formalizar la matriz RBAC final y la política de auditoría y retención.
- Ejecutar pruebas de carga con datasets representativos y ajustar índices.
- Completar el documento OpenAPI v1 con ejemplos y casos de prueba contractuales.

Con ello, el sistema estará en posición de automatizar precios y stock con integridad, reducir errores manuales y construir una operación más ágil, medible y segura.

---

## Referencias

[^1]: Magestore. Retail Inventory Management: How it works & 4 best practices. https://www.magestore.com/blog/retail-inventory-management/
[^2]: Cockroach Labs. Inventory Management Reference Architecture. https://www.cockroachlabs.com/blog/inventory-management-reference-architecture/
[^3]: Shopify. Why the Future of Retail Runs on a Unified Commerce API. https://www.shopify.com/enterprise/blog/unified-commerce-api
[^4]: OpenAPI Specification - Version 3.1.0 (Swagger). https://swagger.io/specification/
[^5]: Shopify. Why the Future of Retail Runs on a Unified Commerce API. https://www.shopify.com/enterprise/blog/unified-commerce-api
[^6]: Hevo Data. REST API Best Practices and Standards in 2025. https://hevodata.com/learn/rest-api-best-practices/
[^7]: Microsoft Learn. Best practices for RESTful web API design. https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design
[^8]: Redgate. Creating a Database Model for an Inventory Management System. https://www.red-gate.com/blog/data-model-for-inventory-management-system
[^9]: Couchbase. Database Design for Retail Inventory and Product Catalogs (Whitepaper). https://info.couchbase.com/rs/302-GJY-034/images/Database_design_retail_inventory_product_catalogs.pdf
[^10]: SPS Commerce. EDI vs API: Choosing between EDI vs API? https://www.spscommerce.com/edi-guide/edi-vs-api/
[^11]: Oso. How to Build a Role-Based Access Control Layer. https://www.osohq.com/learn/rbac-role-based-access-control
[^12]: SAP. Supplier Relationship Management (SRM). https://www.sap.com/products/spend-management/supplier-relationship-management-srm.html
[^13]: Swagger. Basic Structure | Swagger Docs. https://swagger.io/docs/specification/v3_0/basic-structure/
[^14]: SwaggerHub. OpenAPI 3.0 Tutorial. https://support.smartbear.com/swaggerhub/docs/en/get-started/openapi-3-0-tutorial.html
[^15]: OpenAPI Initiative. Best Practices | OpenAPI Documentation. https://learn.openapis.org/best-practices.html
[^16]: RESTful API Tutorial. HTTP Status Codes. https://restfulapi.net/http-status-codes/
[^17]: Oracle. REST API for Unified Inventory Management – Status Codes. https://docs.oracle.com/en/industries/communications/uim/7.4.2/rest-api/status-codes.html
[^18]: APILayer. Best Practices for REST API Error Handling in 2025. https://blog.apilayer.com/best-practices-for-rest-api-error-handling-in-2025/
[^19]: Amazon SP-API. Strategies to Optimize Rate Limits. https://developer-docs.amazon.com/sp-api/docs/strategies-to-optimize-rate-limits-for-your-application-workloads
[^20]: Redis. How to build a Rate Limiter using Redis. https://redis.io/learn/howtos/ratelimiting
[^21]: express-rate-limit. Rate limit Redis store. https://github.com/express-rate-limit/rate-limit-redis
[^22]: Moesif. Mastering API Rate Limiting: Strategies. https://www.moesif.com/blog/technical/api-development/Mastering-API-Rate-Limiting-Strategies-for-Efficient-Management/
[^23]: Phoenix Strategy Group. API Rate Limiting: Best Practices for Security. https://www.phoenixstrategy.group/blog/api-rate-limiting-best-practices-for-security
[^24]: OWASP. API9:2023 Improper Inventory Management. https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/
[^25]: Cleo. How API Integration Creates Value for Wholesale Distributors. https://www.cleo.com/blog/api-integration-wholesale-distribution
[^26]: Inventory Source. Evaluating Supplier Tech - API & Integration. https://www.inventorysource.com/evaluating-supplier-tech-api-integration/
[^27]: Shopify. How to Build Your Ultimate Retail Tech Stack (2025). https://www.shopify.com/ph/retail/retail-tech-stack