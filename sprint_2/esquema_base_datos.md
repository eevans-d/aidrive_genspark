# Blueprint integral del esquema de base de datos PostgreSQL para Mini Market

## 1. Propósito, alcance y resultados esperados

Este documento define el diseño técnico del esquema de base de datos en PostgreSQL para el Sistema de Gestión del Mini Market, orientado a soportar operaciones de catálogo de productos y proveedores, precios por proveedor, inventario por ubicación, movimientos y órdenes de compra, junto con un robusto marco de auditoría y trazabilidad. El propósito es traducir los requerimientos funcionales y no funcionales en un modelo físico executable, con decisiones de normalización/desnormalización, constraints e índices que aseguren integridad, rendimiento y mantenibilidad.

El alcance cubre: entidades y relaciones (ER conceptual y lógico), diseño físico por dominio (Proveedores, Productos/Categorías, Precios, Inventario, Compras), índices y consultas críticas, funciones y procedimientos para pricing, stock y auditoría, triggers, vistas y vistas materializadas, configuración de rendimiento, plan de migraciones desde sistemas actuales, y scripts DDL/DML listos para despliegue.

Criterios de éxito:
- Integridad referencial y de negocio garantizada mediante constraints y reglas de validación.
- Rendimiento consistente para consultas críticas: precio vigente por SKU/proveedor y stock por producto/almacén, con latencias alineadas a p95 < 2 s.
- Consistencia del inventario con prevención de overselling; trazabilidad y auditoría inmutable de cambios de precio y stock.
- Migración con calidad de datos ≥ 98%, canarios y rollback seguros.

Supuestos y restricciones iniciales:
- Procesos mayormente manuales hoy; brecha de automatización del 50%; disponibilidad objetivo 99.9%.
- Integración prioritaria con Maxiconsumo (Necochea) para precios (cada 15 min), stock (cada 5 min) y catálogo (diario).
- Base de datos centralizada como fuente única de verdad para productos y proveedores, con uso pragmático de JSONB en metadatos.

Brechas de información a gestionar en paralelo:
- Documentación y SLAs de la API de Maxiconsumo (endpoints, rate limits, autenticación, versionado).
- Volúmenes operacionales (SKUs totales, frecuencia de cambios de precios/stock, picos estacionales, concurrencia).
- Modelo de datos legado (esquemas, catálogos, reglas de calidad de datos).
- Requerimientos no funcionales detallados (SLO por flujo, RTO/RPO, políticas de seguridad y cumplimiento).
- Capacidades del equipo (stack, Kubernetes, PostgreSQL, RabbitMQ) y elección de cloud.
- Políticas de auditoría (trazabilidad de cambios de precios/stock, retención, acceso).
- Cronograma de conteos cíclicos, formatos de datos y plan de fallback/canarios.

Este blueprint se apoya en prácticas de referencia para inventario y retail, y en guías de optimización de PostgreSQL para sustentar las decisiones de diseño, índices y tuning[^1][^2][^4].

## 2. Contexto funcional y técnico del Mini Market (Sprint 1)

Los procesos actuales son mayormente manuales: recepción con verificación en papel, fijación de precios mediante transcripción en hojas de cálculo, inventario con recuentos periódicos, ventas con POS básico no integrado, y ausencia de una base de datos centralizada de productos y proveedores. Los hallazgos clave del Sprint 1 muestran una automatización del 40% frente a un estándar del 90% en la industria, precisión de inventario del 70% contra una meta superior al 98%, y una brecha significativa en actualización de precios (2–4 horas diarias), gestión de proveedores y reporting.

La arquitectura propuesta adopta un monolito modular con evolución planificada hacia microservicios, priorizando una base de datos PostgreSQL unificada y la integración con Maxiconsumo. El roadmap por fases busca entregar valor temprano: fundación (BD y APIs core), stock inteligente, analytics y optimización, y go-live con estabilización.

Para ilustrar las prioridades técnicas del sistema, se detallan KPIs técnicos y de negocio.

Tabla 1. KPIs técnicos y objetivos (SLA/SLO)
| KPI técnico | Línea base | Objetivo | Umbral de alerta |
|---|---|---|---|
| Disponibilidad mensual (uptime) | 95% | 99.9% | < 99.0% |
| Latencia API p95 (precios/stock) | Variable | < 2 s | > 3 s |
| Actualización de precios | Manual | 15 min | > 30 min |
| Actualización de stock | Manual | 5 min | > 15 min |
| Cobertura de pruebas | N/D | ≥ 80% | < 70% |

Tabla 2. KPIs de negocio y metas
| KPI de negocio | Línea base | Meta |
|---|---|---|
| Reducción de tiempo de gestión | 100% manual | -60% |
| Reducción de errores en precios | Alto (manual) | -90% |
| Reducción de stock-out | Línea base | -70% a -80% |
| Optimización de inventarios | Línea base | +25% |
| Satisfacción de usuarios | Línea base | > 85% |

Estas metas se integran con una arquitectura de referencia de inventario que prioriza baja latencia, consistencia y escalabilidad, y se alinean con un stack retail moderno[^1][^4][^7].

## 3. Principios de diseño y decisiones arquitectónicas de datos

El modelo de datos adopta la tercera forma normal (3FN) para dominios núcleo (Proveedores, Productos, Categorías, Precios, Inventario, Movimientos, Compras) con desnormalización selectiva y uso de JSONB para metadatos de producto y configuración de integración. Este enfoque reduce redundancias, asegura consistencia y habilita flexibilidad para atributos variables (por ejemplo, dimensiones, flags logísticos), evitando un diseño rígido que frustre futuras extensiones.

Claves subrogadas (identificadores internos) se utilizan como llaves primarias, manteniendo unicidad lógica con constraints en SKU y GTIN (Global Trade Item Number). Las relaciones N:M se resuelven mediante tablas puente (por ejemplo, stock_deposito resuelve producto–almacén; precios_proveedor resuelve producto–proveedor). En la capa física, se instrumentan triggers de auditoría para registrar cambios de precio y stock, funciones de negocio para pricing y reorden, y vistas materializadas para reportes y dashboards.

Las estrategias de rendimiento combinan índices compuestos y parciales, particionamiento por fecha en tablas de eventos históricos (movimientos_auditoria, historial_precios), caching con Redis para lecturas frecuentes y políticas de mantenimiento (VACUUM/ANALYZE) respaldadas por tuning de PostgreSQL. La partición y la indexación cuidadosa se justifican por la necesidad de separar eventos de alto volumen, acelerar consultas críticas y simplificar mantenimiento[^1][^2][^4].

## 4. Modelo de datos conceptual y lógico (visión por dominios)

El modelo conceptual agrupa los siguientes dominios:

- Proveedores: datos maestros, configuración de integración (API/EDI), scoring (OTIF, tiempos, calidad).
- Productos: atributos esenciales (SKU, GTIN, nombre, marca, unidad), jerarquía de categorías, metadatos (JSONB).
- Precios por proveedor: costo vigente y anterior, fechas y fuente de actualización; histórico auditable.
- Inventario por ubicación: stock_actual, niveles mínimo/máx; agrega por producto–almacén; holds temporales.
- Movimientos de inventario: entradas, salidas, ajustes y transferencias; logs con trazabilidad completa.
- Compras: órdenes de compra y detalle; estados y workflow de aprobación y recepción; integración con proveedor.
- Auditoría: cambios de precio y stock, quién/qué/cuándo/antes/después; cumplimiento y visibilidad.

Tabla 3. Entidades principales y atributos clave por dominio
| Dominio | Entidades | Atributos mínimos (ejemplos) | Notas |
|---|---|---|---|
| Proveedores | proveedores | id, nombre, ubicación, tipo, activo, configuracion_api (JSONB) | Scoring de proveedor en JSONB o tabla auxiliar |
| Productos/Categorías | productos, categorias | productos: id, sku, barcode, nombre, marca, categoria_id, unidad, dimensiones (JSONB), activo; categorias: id, nombre, margen_min/máx, markup_default | Jerarquía por categoria_id; unicidad en sku y barcode |
| Precios | precios_proveedor | id, producto_id, proveedor_id, precio, precio_anterior, fecha_actualizacion, fuente_actualizacion, activo | Unicidad y partición por fecha |
| Inventario | stock_deposito, stock_reservado, ordenes_compra | stock_deposito: id, producto_id, deposito, stock_actual, stock_mín/máx, ubicacion_fisica, ultima_actualizacion, activo; stock_reservado: id, producto_id, cantidad, estado, referencia, fecha_reserva; ordenes_compra: id, producto_id, cantidad, estado, fecha_orden, fecha_recepcion | Constraint de no negativos; reservas activas descuentan disponible; tránsito desde ordenes_compra |
| Movimientos | movimientos_inventario, movimientos_auditoria | movimientos_inventario: id, producto_id, tipo, cantidad, origen/destino, fecha, usuario; movimientos_auditoria: id, evento, payload (JSONB) | Particionamiento por fecha |
| Compras | pedidos, detalle_pedidos | pedidos: id, proveedor_id, fecha, estado; detalle_pedidos: id, pedido_id, producto_id, cantidad, precio | Estados y workflow |
| Auditoría | price_history, stock_auditoria | price_history: producto_id, proveedor_id, precio_anterior, precio_nuevo, fecha, source; stock_auditoria: producto_id, deposito, stock_anterior, stock_nuevo, fecha, motivo | Inmutabilidad y retención |

Este modelo consolida prácticas comunes en inventario y retail, con atributos logísticos y auditoría bien definidos[^4][^2].

## 5. Diseño físico del esquema en PostgreSQL (DDL) por módulo

Se detallan las tablas, campos, tipos de datos, constraints y default values por módulo, con claves primarias (PK), claves foráneas (FK), unicidad, checks y triggers de auditoría y updated_at.

### 5.1 Módulo de Proveedores

Tabla: proveedores

| Columna | Tipo | Constraints/Notas |
|---|---|---|
| id | SERIAL | PK |
| nombre | VARCHAR(255) | NOT NULL, único lógico (nombre) |
| codigo_identificacion | VARCHAR(50) | UNIQUE |
| direccion | TEXT | — |
| telefono | VARCHAR(20) | — |
| email | VARCHAR(100) | — |
| sitio_web | VARCHAR(255) | — |
| ubicacion | VARCHAR(100) | Índice opcional |
| tipo_negocio | VARCHAR(50) | — |
| activo | BOOLEAN | DEFAULT TRUE |
| configuracion_api | JSONB | Credenciales, endpoints, flags (encriptar a nivel app/Secrets) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP (trigger) |

Índices sugeridos:
- UNIQUE (codigo_identificacion) cuando aplique.
- INDEX (ubicacion).

Razonamiento: centraliza maestros y la configuración técnica de integración, con JSONB para evitar esquemas rígidos, siguiendo guías de catálogo de producto[^2].

### 5.2 Módulo de Productos y Categorías

Tabla: categorias

| Columna | Tipo | Constraints/Notas |
|---|---|---|
| id | SERIAL | PK |
| nombre | VARCHAR(255) | NOT NULL |
| margen_min | NUMERIC(5,2) | CHECK (0 ≤ margen_min ≤ 100) |
| margen_max | NUMERIC(5,2) | CHECK (margen_min ≤ margen_max ≤ 100) |
| markup_default | NUMERIC(5,2) | — |
| activa | BOOLEAN | DEFAULT TRUE |
| parent_id | INTEGER | FK a categorias(id), nullable para jerarquía |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

Índices: INDEX (parent_id), INDEX (nombre).

Tabla: productos

| Columna | Tipo | Constraints/Notas |
|---|---|---|
| id | SERIAL | PK |
| codigo_barras | VARCHAR(50) | UNIQUE, índice dedicado |
| nombre | VARCHAR(255) | NOT NULL |
| descripcion | TEXT | — |
| categoria_id | INTEGER | FK a categorias(id) |
| marca | VARCHAR(100) | — |
| unidad_medida | VARCHAR(20) | — |
| peso | NUMERIC(10,3) | — |
| dimensiones | JSONB | Estructuras variables (largo, ancho, alto) |
| activo | BOOLEAN | DEFAULT TRUE |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

Índices: UNIQUE (codigo_barras), INDEX (categoria_id), INDEX (nombre).

Justificación: jerarquía de categorías y metadatos en JSONB aportan flexibilidad con integridad básica en PK/FK y unicidad en identificadores[^2][^4].

### 5.3 Módulo de Precios

Tabla: precios_proveedor

| Columna | Tipo | Constraints/Notas |
|---|---|---|
| id | SERIAL | PK |
| producto_id | INTEGER | FK a productos(id) |
| proveedor_id | INTEGER | FK a proveedores(id) |
| precio | NUMERIC(10,2) | NOT NULL, CHECK (precio ≥ 0) |
| precio_anterior | NUMERIC(10,2) | CHECK (precio_anterior ≥ 0) |
| fecha_actualizacion | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| fuente_actualizacion | VARCHAR(50) | API/EDI/manual |
| activo | BOOLEAN | DEFAULT TRUE |

Constraints e índices:
- UNIQUE (producto_id, proveedor_id, activo) WHERE activo = TRUE (índice parcial).
- INDEX (producto_id, fecha_actualizacion DESC) para histórico rápido.
- INDEX (proveedor_id).

Auditoría y partición:
- Tabla: price_history (producto_id, proveedor_id, precio_anterior, precio_nuevo, fecha, source).
- Partición mensual de price_history por fecha; política de retención según cumplimiento.

Justificación: asegura la obtención del precio vigente con un índice parcial único y preserva trazabilidad con partición por fecha[^4][^1].

### 5.4 Módulo de Inventario

Tabla: stock_deposito

| Columna | Tipo | Constraints/Notas |
|---|---|---|
| id | SERIAL | PK |
| producto_id | INTEGER | FK a productos(id) |
| deposito | VARCHAR(100) | Índice compuesto |
| stock_actual | INTEGER | CHECK (stock_actual ≥ 0) |
| stock_minimo | INTEGER | DEFAULT 0, CHECK (stock_minimo ≥ 0) |
| stock_maximo | INTEGER | DEFAULT 0, CHECK (stock_maximo ≥ stock_minimo) |
| ubicacion_fisica | VARCHAR(100) | — |
| ultima_actualizacion | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| activo | BOOLEAN | DEFAULT TRUE |

Índices: INDEX (producto_id, deposito), UNIQUE (producto_id, deposito).

Tabla: movimientos_inventario

| Columna | Tipo | Constraints/Notas |
|---|---|---|
| id | SERIAL | PK |
| producto_id | INTEGER | FK a productos(id) |
| tipo | VARCHAR(20) | CHECK (tipo IN ('entrada','salida','ajuste','transferencia')) |
| cantidad | INTEGER | CHECK (cantidad > 0) |
| origen | VARCHAR(100) | Nullable |
| destino | VARCHAR(100) | Nullable |
| fecha | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| usuario | VARCHAR(100) | — |
| referencia_id | INTEGER | Opcional (OC, venta) |

Índices: INDEX (producto_id, fecha DESC), INDEX (tipo, fecha).

Auditoría: tabla stock_auditoria (producto_id, deposito, stock_anterior, stock_nuevo, fecha, motivo), con triggers que registren cambios en stock_deposito.

Justificación: patrón agregado para stock por ubicación y registro de eventos, con constraints de no negativos y trazabilidad completa[^1][^4].

### 5.5 Módulo de Compras

Tabla: pedidos

| Columna | Tipo | Constraints/Notas |
|---|---|---|
| id | SERIAL | PK |
| proveedor_id | INTEGER | FK a proveedores(id) |
| fecha | DATE | DEFAULT CURRENT_DATE |
| estado | VARCHAR(20) | CHECK (estado IN ('borrador','aprobado','enviado','recibido','cancelado')) |
| total_estimado | NUMERIC(12,2) | — |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

Índices: INDEX (proveedor_id, fecha), INDEX (estado, fecha).

Tabla: detalle_pedidos

| Columna | Tipo | Constraints/Notas |
|---|---|---|
| id | SERIAL | PK |
| pedido_id | INTEGER | FK a pedidos(id) |
| producto_id | INTEGER | FK a productos(id) |
| cantidad | INTEGER | CHECK (cantidad > 0) |
| precio | NUMERIC(10,2) | CHECK (precio ≥ 0) |

Índices: INDEX (pedido_id), INDEX (producto_id).

Integración con stock y precios: al recibir, se generan movimientos de inventario (entrada) y se actualiza stock_actual, con validación de integridad y auditoría.

### 5.6 Auditoría y trazabilidad

Tablas:
- price_history (particionada por fecha).
- stock_auditoria (particionada por fecha).
- movimientos_auditoria (evento, payload JSONB).

Triggers:
- price_audit_trigger: tras UPDATE en precios_proveedor, inserta en price_history.
- stock_audit_trigger: tras UPDATE en stock_deposito, inserta en stock_auditoria.
- updated_at: función común para actualizar updated_at en maestros.

Modelo de inmutabilidad: los registros de auditoría no se actualizan; solo se insertan nuevos eventos. Retención y acceso regulados por políticas de cumplimiento.

## 6. Relaciones, cardinalidades y reglas de integridad

Las cardinalidades clave del modelo se resumen a continuación:

- Proveedor 1:N Precios_proveedor.
- Producto 1:N Precios_proveedor.
- Producto 1:N Stock_deposito.
- Categoria 1:N Productos.
- Pedido 1:N Detalle_pedidos.
- Producto N:M Almacén (resuelto por Stock_deposito).

Tabla 4. Relaciones y cardinalidades
| Relación | Tipo | Cardinalidad | Comentario |
|---|---|---|---|
| Proveedor -> Precios_proveedor | 1:N | 1..N | Precio por proveedor y producto |
| Producto -> Precios_proveedor | 1:N | 1..N | Histórico y vigente por proveedor |
| Producto -> Stock_deposito | 1:N | 1..N | Stock por almacén |
| Categoria -> Producto | 1:N | 1..N | Clasificación |
| Pedido -> Detalle_pedidos | 1:N | 1..N | Líneas de pedido |
| Producto <-> Almacén | N:M | Resuelto | Stock_deposito |

Tabla 5. Matriz de constraints de integridad por tabla
| Tabla | PK | FKs | Unicidad | Checks |
|---|---|---|---|---|
| proveedores | id | — | codigo_identificacion UNIQUE | activo BOOLEAN |
| categorias | id | parent_id -> categorias(id) | nombre UNIQUE (opcional) | margen_min/máx, activa BOOLEAN |
| productos | id | categoria_id -> categorias(id) | sku UNIQUE, codigo_barras UNIQUE | peso ≥ 0, unidad_medida no nula |
| precios_proveedor | id | producto_id -> productos(id), proveedor_id -> proveedores(id) | UNIQUE (producto_id, proveedor_id, activo) parcial | precio ≥ 0 |
| stock_deposito | id | producto_id -> productos(id) | UNIQUE (producto_id, deposito) | stock_actual ≥ 0, stock_max ≥ stock_min |
| stock_reservado | id | producto_id -> productos(id) | — | cantidad > 0, estado IN ('activa','cancelada','aplicada') |
| ordenes_compra | id | producto_id -> productos(id) | — | cantidad > 0, estado IN ('pendiente','en_transito','recibida','cancelada') |
| movimientos_inventario | id | producto_id -> productos(id) | — | tipo IN (...) |
| pedidos | id | proveedor_id -> proveedores(id) | — | estado IN (...) |
| detalle_pedidos | id | pedido_id -> pedidos(id), producto_id -> productos(id) | — | cantidad > 0 |

Integridad referencial con ON UPDATE/ON DELETE RESTRICT o CASCADE según caso; checks para evitar stocks negativos y estados inválidos[^4].

## 7. Índices optimizados y consultas críticas

El rendimiento se apoya en índices alineados a las consultas más frecuentes, evitando sobreindexación que penalice escrituras.

Consultas críticas:
- Precio vigente por SKU/proveedor.
- Stock disponible por producto/almacén.
- Historial de cambios de precio por producto.
- Búsqueda por código de barras (GTIN).
- Productos por categoría.

Tabla 6. Consultas críticas e índices sugeridos
| Consulta | Índice/Constraint | Justificación |
|---|---|---|
| Precio vigente por (producto_id, proveedor_id) | UNIQUE parcial (producto_id, proveedor_id) WHERE activo = TRUE | Filtrado directo por estado activo; evita scans completos[^2] |
| Stock por (producto_id, deposito) | INDEX (producto_id, deposito) | Punto caliente de lectura y actualización |
| Búsqueda por barcode | INDEX (codigo_barras) | Alto uso en recepción y POS |
| Histórico de precios por producto | INDEX (producto_id, fecha_actualizacion DESC) | Rapidez en auditoría y análisis |
| Productos por categoría | INDEX (categoria_id) | Navegación y reporting |

Mantenimiento:
- VACUUM/ANALYZE regular, con autovacuum ajustado a volumen de escrituras en movimientos y auditoría.
- Revisión de planes de ejecución con EXPLAIN; ajuste de índices compuestos y parciales según patrones reales[^2][^1].

## 8. Funciones y procedimientos almacenados (PL/pgSQL)

Se provee un catálogo funcional para automatizar reglas de negocio, con seguridad y auditoría integradas.

Catálogo de funciones/procedimientos:

Tabla 7. Funciones y procedimientos
| Nombre | Propósito | Parámetros | Retorno | Permisos |
|---|---|---|---|---|
| fnc_precio_vigente(p_producto_id, p_proveedor_id) | Devuelve precio activo | p_producto_id INT, p_proveedor_id INT | TABLE (precio NUMERIC, fecha_actualizacion TIMESTAMP, fuente VARCHAR) | rol_consulta |
| sp_aplicar_precio(p_producto_id, p_proveedor_id, p_precio, p_fuente) | Aplica nuevo precio y registra histórico | p_producto_id INT, p_proveedor_id INT, p_precio NUMERIC, p_fuente VARCHAR | VOID | rol_escritura |
| fnc_stock_disponible(p_producto_id, p_deposito) | Devuelve stock actual | p_producto_id INT, p_deposito VARCHAR | TABLE (stock_actual INT, stock_minimo INT, stock_maximo INT) | rol_consulta |
| sp_movimiento_inventario(p_producto_id, p_tipo, p_cantidad, p_origen, p_destino, p_usuario) | Registra movimiento y actualiza stock | p_producto_id INT, p_tipo VARCHAR, p_cantidad INT, p_origen VARCHAR, p_destino VARCHAR, p_usuario VARCHAR | VOID | rol_escritura |
| sp_generar_reorden(p_deposito) | Genera pedido de reorden según mínimos | p_deposito VARCHAR | TABLE (pedido_id INT) | rol_mantenimiento |
| fnc_calcular_precio_venta(p_producto_id, p_categoria_id, p_costo) | Calcula precio con margen/markup | p_producto_id INT, p_categoria_id INT, p_costo NUMERIC | NUMERIC(10,2) | rol_consulta |
| fnc_asignar_proveedor_faltante(p_producto_id) | Selecciona proveedor óptimo (precio, stock, lead time, desempeño) | p_producto_id INT | TABLE (proveedor_id INT, score NUMERIC) | rol_consulta |
| sp_recepcion_oc(p_pedido_id) | Procesa recepción y actualiza inventario | p_pedido_id INT | VOID | rol_escritura |

Consideraciones:
- Manejo de errores y logging interno; uso de transacciones para atomicidad.
- Permisos mínimos necesarios (principio de privilegio); segregación por roles.
- Auditoría: sp_aplicar_precio y sp_movimiento_inventario registran en price_history y stock_auditoria mediante triggers.

Estas funciones soportan el flujo operativo de pricing, inventario y compras con trazabilidad, en línea con patrones de triggers y procedimientos en PostgreSQL[^5][^6].

## 9. Triggers, auditoría y vistas

Triggers:
- update_updated_at_column(): función común para mantener updated_at en maestros.
- price_audit_trigger: AFTER UPDATE en precios_proveedor, inserta en price_history (precio_anterior → precio_nuevo, fecha, source).
- stock_audit_trigger: AFTER UPDATE en stock_deposito, inserta en stock_auditoria (stock_anterior → stock_nuevo, fecha, motivo).
- movimiento_audit_trigger: AFTER INSERT en movimientos_inventario, registra en movimientos_auditoria (evento y payload JSONB).

Vistas y vistas materializadas:
- v_inventario_actual: stock_actual por producto/almacén con últimos timestamps.
- v_stock_minimos: productos por almacén bajo mínimos.
- v_kpis_operativos: rotura de stock, precisión, rotación, margen estimado.
- materialized_view_rotacion_mensual: preagregación por categoría/almacén/mes.

Tabla 8. Eventos de auditoría y retención
| Evento | Tabla destino | Campos clave | Retención | Cumplimiento |
|---|---|---|---|---|
| Cambio de precio | price_history | producto_id, proveedor_id, precio_anterior, precio_nuevo, fecha, source | 24–36 meses (ajustable) | Trazabilidad financiera |
| Cambio de stock | stock_auditoria | producto_id, deposito, stock_anterior, stock_nuevo, fecha, motivo | 18–24 meses | Control operacional |
| Movimiento de inventario | movimientos_auditoria | producto_id, tipo, cantidad, fecha, usuario, payload | 12–18 meses | Auditoría operativa |

Tabla 9. Vistas y materializadas
| Nombre | Objetivo | Frecuencia de refresh |
|---|---|---|
| v_inventario_actual | Visibilidad de stock actual por ubicación | On-demand / near real-time |
| v_stock_minimos | Detección de faltantes | Cada 5–15 min |
| v_kpis_operativos | Dashboard operativo | Cada 1–5 min |
| materialized_view_rotacion_mensual | Reportes de rotación | Diario / mensual |

Estas implementaciones refuerzan consistencia, trazabilidad y performance en reporting, en coherencia con prácticas de inventario y triggers en PostgreSQL[^1][^6].

## 10. Rendimiento, escalabilidad y mantenimiento

Tuning de PostgreSQL:
- max_connections: dimensionar para evitar sobredimensionamiento; prefer pooling externo.
- shared_buffers: ≤ 25% de RAM; balancear con caché de OS.
- work_mem: por operación (ordenamientos/hash); ajustar según concurrencia.
- maintenance_work_mem: ≥ 1 GB para VACUUM/CREATE INDEX eficientes.
- WAL (fsync, commit_delay, checkpoint_timeout): equilibrar integridad y throughput.
- random_page_cost y effective_cache_size: orientar al planificador hacia index scans cuando corresponda.
- Logging: activar logging_collector, log_statement, log_lock_waits, log_checkpoints para observabilidad.

Tabla 10. Parámetros de rendimiento recomendados (valores orientativos)
| Parámetro | Recomendación | Efecto |
|---|---|---|
| max_connections | 4–8 × número de vCPU, con pooling | Evita sobrecarga de conexiones |
| shared_buffers | ≤ 25% de RAM | Mejora cacheo de páginas |
| work_mem | 64–256 MB por operación | Ordenaciones y hash más rápidos |
| maintenance_work_mem | 1–4 GB | VACUUM/INDEX eficientes |
| checkpoint_timeout | 15–30 min | Menos I/O picos, recuperación aceptable |
| checkpoint_completion_target | 0.9 | Suaviza escrituras |
| min_wal_size / max_wal_size | Ajustado a carga | Menos checkpoints |
| random_page_cost | 1.1–1.3 (SSD) | Favorece index scans |
| effective_cache_size | 50–75% de RAM | Estimación de cache del SO |

Tabla 11. Estrategias de escalabilidad
| Estrategia | Aplicación | Beneficio |
|---|---|---|
| Índices compuestos/parciales | Precio vigente, stock por ubicación | Lecturas ultrarrápidas |
| Partición por fecha | Auditorías (price_history, stock_auditoria, movimientos_auditoria) | Mantenimiento y queries por rango |
| Vistas materializadas | KPIs y rotación | Reportes sin carga transaccional |
| Caching (Redis) | Catálogo y precios vigentes | Latencia baja, menos presión a BD |
| Réplicas de lectura | Dashboards/BI | Desacarga de consultas analíticas |

Mantenimiento:
- VACUUM/ANALYZE y autovacuum; monitoreo continuo con EXPLAIN, pg_stat_user_tables, pg_statio_user_tables.
- Evitar sobreindexación: balancear beneficio en lecturas vs costo en escrituras.
- Observabilidad y alertas por latencias, locks y checkpoints.

Estas prácticas están alineadas con guías de tuning y arquitecturas escalables para inventario[^1][^2][^4].

## 11. Plan de migraciones desde sistemas actuales

Inventario de datos actuales:
- Catálogos en Excel (productos, proveedores), listas de precios manuales, hojas de stock, remitos.
- Calidad de datos heterogénea: duplicados, formatos inconsistentes, identificadores no normalizados.

Estrategia ETL:
- Extracción desde CSV/Excel; normalización (SKU, GTIN, categorías, unidades).
- Transformaciones: validación de formatos, armonización de marcas/unidades, cálculo de márgenes.
- Carga inicial: productos, categorías, proveedores; precios; stock inicial por almacén; movimientos históricos si disponibles.
- Validación cruzada: conteos físicos, reconciliación de stock y precios.

Fases:
1. Preparación: inventario de datasets, depuración y scripts de carga.
2. Staging y piloto: carga de productos y precios; sincronización con Maxiconsumo (sandbox).
3. Stock: carga inicial de stock_deposito; movimientos; alertas.
4. Go-live: despliegue gradual; fallback manual; monitoreo intensivo.
5. Estabilización: auditoría post-migración, optimización, cierre de hallazgos.

Tabla 12. Cronograma por fases y gate criteria
| Fase | Entregable | Criterios de salida |
|---|---|---|
| Preparación | Esquema DB, datasets depurados | QA de calidad > 98%; scripts ejecutables |
| Piloto | Productos + Precios en staging | Latencias < objetivo; E2E aprobado |
| Integración | Conector Maxiconsumo y scheduler | Sincronización estable; manejo de errores |
| Stock | Stock por almacén + alertas | Inventario reconciliado; alertas validadas |
| Go-live | Despliegue gradual | KPIs en verde 2 semanas |
| Estabilización | Optimización y soporte | Incidentes críticos = 0 |

Tabla 13. Matriz de riesgos y mitigaciones
| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Pérdida/inconsistencia de datos | Media | Alto | Backups, validación cruzada, rollback |
| Resistencia al cambio | Alta | Media | Capacitación, champions, soporte |
| Integración proveedor | Media | Alto | POC, SLAs, resiliencia (reintentos, DLQ) |
| Picos de latencia | Media | Media | Cache, colas, autoscaling, pruebas de stress |

Este enfoque se alinea con guías de migración POS y operación retail, con foco en continuidad y seguridad[^3].

## 12. Scripts SQL de creación e implementación

A continuación se incluyen scripts DDL completos y reproducibles para crear el esquema y sus componentes. Se recomienda su ejecución ordenada en entornos de staging y producción, con control de versiones y promoción manual para entornos críticos.

DDL de maestros e índices

```sql
-- 1) Esquema base y extensiones recomendadas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- si se requiere hashing/encryption

-- 2) Proveedores
CREATE TABLE proveedores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  codigo_identificacion VARCHAR(50) UNIQUE,
  direccion TEXT,
  telefono VARCHAR(20),
  email VARCHAR(100),
  sitio_web VARCHAR(255),
  ubicacion VARCHAR(100),
  tipo_negocio VARCHAR(50),
  activo BOOLEAN DEFAULT TRUE,
  configuracion_api JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3) Categorías (jerarquía simple)
CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  margen_min NUMERIC(5,2) CHECK (margen_min >= 0 AND margen_min <= 100),
  margen_max NUMERIC(5,2) CHECK (margen_max >= 0 AND margen_max <= 100 AND margen_min <= margen_max),
  markup_default NUMERIC(5,2),
  activa BOOLEAN DEFAULT TRUE,
  parent_id INTEGER REFERENCES categorias(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4) Productos
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) UNIQUE,
  codigo_barras VARCHAR(50) UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  categoria_id INTEGER REFERENCES categorias(id),
  marca VARCHAR(100),
  unidad_medida VARCHAR(20),
  peso NUMERIC(10,3),
  dimensiones JSONB,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices en productos y categorías
CREATE INDEX idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_categorias_parent ON categorias(parent_id);
CREATE INDEX idx_categorias_nombre ON categorias(nombre);
CREATE INDEX idx_proveedores_ubicacion ON proveedores(ubicacion);

-- 5) Precios por proveedor
CREATE TABLE precios_proveedor (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  precio_anterior NUMERIC(10,2) CHECK (precio_anterior >= 0),
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fuente_actualizacion VARCHAR(50),
  activo BOOLEAN DEFAULT TRUE
);

-- Índices y constraint de precio vigente (único parcial por activo)
CREATE INDEX idx_precios_prov_prod_activo ON precios_proveedor(producto_id, proveedor_id, activo);
CREATE UNIQUE INDEX ux_precios_vigente ON precios_proveedor(producto_id, proveedor_id, activo) WHERE activo = TRUE;
CREATE INDEX idx_precios_fecha ON precios_proveedor(producto_id, fecha_actualizacion DESC);

-- 6) Stock por depósito/almacén
CREATE TABLE stock_deposito (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  deposito VARCHAR(100) NOT NULL,
  stock_actual INTEGER NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo INTEGER NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  stock_maximo INTEGER NOT NULL DEFAULT 0 CHECK (stock_maximo >= stock_minimo),
  ubicacion_fisica VARCHAR(100),
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN DEFAULT TRUE,
  UNIQUE (producto_id, deposito)
);

CREATE INDEX idx_stock_prod_dep ON stock_deposito(producto_id, deposito);

-- 7) Stock reservado
CREATE TABLE stock_reservado (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('activa','cancelada','aplicada')),
  referencia VARCHAR(100),
  usuario VARCHAR(100),
  fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_cancelacion TIMESTAMP
);

CREATE INDEX idx_stock_reservado_prod_estado ON stock_reservado(producto_id, estado);

-- 8) Órdenes de compra / stock en tránsito
CREATE TABLE ordenes_compra (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  proveedor_id INTEGER REFERENCES proveedores(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  cantidad_recibida INTEGER DEFAULT 0 CHECK (cantidad_recibida >= 0),
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('pendiente','en_transito','recibida','cancelada')),
  fecha_orden TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_estimada TIMESTAMP,
  fecha_recepcion TIMESTAMP,
  referencia VARCHAR(100)
);

CREATE INDEX idx_ordenes_compra_prod_estado ON ordenes_compra(producto_id, estado);
CREATE INDEX idx_ordenes_compra_fecha ON ordenes_compra(fecha_orden DESC);

-- 9) Movimientos de inventario
CREATE TABLE movimientos_inventario (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada','salida','ajuste','transferencia')),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  origen VARCHAR(100),
  destino VARCHAR(100),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario VARCHAR(100),
  referencia_id INTEGER,
  orden_compra_id INTEGER REFERENCES ordenes_compra(id)
);

CREATE INDEX idx_movimientos_prod_fecha ON movimientos_inventario(producto_id, fecha DESC);
CREATE INDEX idx_movimientos_tipo_fecha ON movimientos_inventario(tipo, fecha DESC);

-- 10) Pedidos y detalles
CREATE TABLE pedidos (
  id SERIAL PRIMARY KEY,
  proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),
  fecha DATE DEFAULT CURRENT_DATE,
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('borrador','aprobado','enviado','recibido','cancelado')),
  total_estimado NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pedidos_prov_fecha ON pedidos(proveedor_id, fecha);
CREATE INDEX idx_pedidos_estado_fecha ON pedidos(estado, fecha);

CREATE TABLE detalle_pedidos (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0)
);

CREATE INDEX idx_det_pedido ON detalle_pedidos(pedido_id);
CREATE INDEX idx_det_producto ON detalle_pedidos(producto_id);

-- 9) Auditoría y trazabilidad
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),
  precio_anterior NUMERIC(10,2),
  precio_nuevo NUMERIC(10,2),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(50)
) PARTITION BY RANGE (fecha);

CREATE TABLE stock_auditoria (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  deposito VARCHAR(100) NOT NULL,
  stock_anterior INTEGER NOT NULL,
  stock_nuevo INTEGER NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  motivo VARCHAR(100)
) PARTITION BY RANGE (fecha);

CREATE TABLE movimientos_auditoria (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  tipo VARCHAR(20) NOT NULL,
  cantidad INTEGER NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario VARCHAR(100),
  payload JSONB
) PARTITION BY RANGE (fecha);

-- Particiones mensuales (ejemplo)
CREATE TABLE price_history_2025_10 PARTITION OF price_history
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE stock_auditoria_2025_10 PARTITION OF stock_auditoria
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE movimientos_auditoria_2025_10 PARTITION OF movimientos_auditoria
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- 10) Triggers de auditoría y updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proveedores_updated_at
BEFORE UPDATE ON proveedores
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categorias_updated_at
BEFORE UPDATE ON categorias
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at
BEFORE UPDATE ON productos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at
BEFORE UPDATE ON pedidos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auditoría de precios
CREATE OR REPLACE FUNCTION price_audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.precio IS DISTINCT FROM NEW.precio OR OLD.activo IS DISTINCT FROM NEW.activo THEN
    INSERT INTO price_history (producto_id, proveedor_id, precio_anterior, precio_nuevo, fecha, source)
    VALUES (NEW.producto_id, NEW.proveedor_id, OLD.precio, NEW.precio, CURRENT_TIMESTAMP, NEW.fuente_actualizacion);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER price_audit_trigger
AFTER UPDATE OF precio, activo, fuente_actualizacion ON precios_proveedor
FOR EACH ROW EXECUTE FUNCTION price_audit_trigger_fn();

-- Auditoría de stock
CREATE OR REPLACE FUNCTION stock_audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stock_actual IS DISTINCT FROM NEW.stock_actual THEN
    INSERT INTO stock_auditoria (producto_id, deposito, stock_anterior, stock_nuevo, fecha, motivo)
    VALUES (NEW.producto_id, NEW.deposito, OLD.stock_actual, NEW.stock_actual, CURRENT_TIMESTAMP, 'UPDATE');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_audit_trigger
AFTER UPDATE OF stock_actual ON stock_deposito
FOR EACH ROW EXECUTE FUNCTION stock_audit_trigger_fn();

-- Auditoría de movimientos
CREATE OR REPLACE FUNCTION movimiento_audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO movimientos_auditoria (producto_id, tipo, cantidad, fecha, usuario, payload)
  VALUES (NEW.producto_id, NEW.tipo, NEW.cantidad, CURRENT_TIMESTAMP, NEW.usuario, jsonb_build_object('origen', NEW.origen, 'destino', NEW.destino, 'referencia_id', NEW.referencia_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER movimiento_audit_trigger
AFTER INSERT ON movimientos_inventario
FOR EACH ROW EXECUTE FUNCTION movimiento_audit_trigger_fn();
```

Funciones y procedimientos (PL/pgSQL)

```sql
-- Precio vigente por producto/proveedor
CREATE OR REPLACE FUNCTION fnc_precio_vigente(p_producto_id INT, p_proveedor_id INT)
RETURNS TABLE (precio NUMERIC, fecha_actualizacion TIMESTAMP, fuente VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT pp.precio, pp.fecha_actualizacion, pp.fuente_actualizacion
  FROM precios_proveedor pp
  WHERE pp.producto_id = p_producto_id
    AND pp.proveedor_id = p_proveedor_id
    AND pp.activo = TRUE
  ORDER BY pp.fecha_actualizacion DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar precio con auditoría
CREATE OR REPLACE FUNCTION sp_aplicar_precio(
  p_producto_id INT, p_proveedor_id INT, p_precio NUMERIC, p_fuente VARCHAR
) RETURNS VOID AS $$
DECLARE
  old_precio NUMERIC;
BEGIN
  SELECT precio INTO old_precio FROM precios_proveedor
  WHERE producto_id = p_producto_id AND proveedor_id = p_proveedor_id AND activo = TRUE
  FOR UPDATE;

  IF old_precio IS NULL THEN
    INSERT INTO precios_proveedor (producto_id, proveedor_id, precio, precio_anterior, fuente_actualizacion, activo)
    VALUES (p_producto_id, p_proveedor_id, p_precio, NULL, p_fuente, TRUE);
  ELSE
    UPDATE precios_proveedor
    SET precio = p_precio,
        precio_anterior = old_precio,
        fuente_actualizacion = p_fuente,
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE producto_id = p_producto_id AND proveedor_id = p_proveedor_id AND activo = TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stock disponible por producto/depósito
CREATE OR REPLACE FUNCTION fnc_stock_disponible(p_producto_id INT, p_deposito VARCHAR)
RETURNS TABLE (
  stock_actual INT,
  stock_minimo INT,
  stock_maximo INT,
  stock_reservado INT,
  stock_disponible INT,
  stock_transito INT
) AS $$
DECLARE
  v_reservado INT;
  v_transito INT;
BEGIN
  SELECT COALESCE(SUM(cantidad), 0)
    INTO v_reservado
  FROM stock_reservado
  WHERE producto_id = p_producto_id
    AND estado = 'activa';

  SELECT COALESCE(SUM(cantidad - cantidad_recibida), 0)
    INTO v_transito
  FROM ordenes_compra
  WHERE producto_id = p_producto_id
    AND estado IN ('pendiente', 'en_transito');

  RETURN QUERY
  SELECT
    s.stock_actual,
    s.stock_minimo,
    s.stock_maximo,
    v_reservado,
    GREATEST(s.stock_actual - v_reservado, 0) AS stock_disponible,
    v_transito
  FROM stock_deposito s
  WHERE s.producto_id = p_producto_id AND s.deposito = p_deposito
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Movimiento de inventario con actualización de stock
CREATE OR REPLACE FUNCTION sp_movimiento_inventario(
  p_producto_id INT,
  p_tipo VARCHAR,
  p_cantidad INT,
  p_origen VARCHAR,
  p_destino VARCHAR,
  p_usuario VARCHAR,
  p_orden_compra_id INT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_deposito VARCHAR;
  v_stock INTEGER;
BEGIN
  -- Validación básica
  IF p_tipo NOT IN ('entrada','salida','ajuste','transferencia') THEN
    RAISE EXCEPTION 'Tipo de movimiento inválido: %', p_tipo;
  END IF;

  -- Lógica por tipo
  IF p_tipo = 'entrada' THEN
    v_deposito := COALESCE(p_destino, 'Principal');
    INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, origen, destino, usuario, orden_compra_id)
    VALUES (p_producto_id, p_tipo, p_cantidad, p_origen, v_deposito, p_usuario, p_orden_compra_id);
    UPDATE stock_deposito
      SET stock_actual = stock_actual + p_cantidad,
          ultima_actualizacion = CURRENT_TIMESTAMP
    WHERE producto_id = p_producto_id AND deposito = v_deposito;
    IF p_orden_compra_id IS NOT NULL THEN
      UPDATE ordenes_compra
        SET cantidad_recibida = cantidad_recibida + p_cantidad,
            estado = CASE
              WHEN cantidad_recibida + p_cantidad >= cantidad THEN 'recibida'
              ELSE estado
            END,
            fecha_recepcion = CASE
              WHEN cantidad_recibida + p_cantidad >= cantidad THEN CURRENT_TIMESTAMP
              ELSE fecha_recepcion
            END
      WHERE id = p_orden_compra_id AND producto_id = p_producto_id;
    END IF;
  ELSIF p_tipo = 'salida' THEN
    v_deposito := COALESCE(p_origen, 'Principal');
    SELECT stock_actual INTO v_stock FROM stock_deposito
    WHERE producto_id = p_producto_id AND deposito = v_deposito
    FOR UPDATE;
    IF v_stock < p_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente: producto %, depósito %, requerido %, disponible %', p_producto_id, v_deposito, p_cantidad, v_stock;
    END IF;
    INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, origen, destino, usuario, orden_compra_id)
    VALUES (p_producto_id, p_tipo, p_cantidad, v_deposito, p_destino, p_usuario, p_orden_compra_id);
    UPDATE stock_deposito
      SET stock_actual = stock_actual - p_cantidad,
          ultima_actualizacion = CURRENT_TIMESTAMP
    WHERE producto_id = p_producto_id AND deposito = v_deposito;
  ELSIF p_tipo = 'ajuste' THEN
    v_deposito := COALESCE(p_origen, 'Principal');
    INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, origen, destino, usuario, orden_compra_id)
    VALUES (p_producto_id, p_tipo, p_cantidad, p_origen, p_destino, p_usuario, p_orden_compra_id);
    UPDATE stock_deposito
      SET stock_actual = stock_actual + p_cantidad, -- p_cantidad puede ser negativa
          ultima_actualizacion = CURRENT_TIMESTAMP
    WHERE producto_id = p_producto_id AND deposito = v_deposito;
  ELSIF p_tipo = 'transferencia' THEN
    -- Origen y destino deben estar presentes
    IF p_origen IS NULL OR p_destino IS NULL THEN
      RAISE EXCEPTION 'Transferencia requiere origen y destino';
    END IF;
    -- Decrementa origen
    SELECT stock_actual INTO v_stock FROM stock_deposito
    WHERE producto_id = p_producto_id AND deposito = p_origen
    FOR UPDATE;
    IF v_stock < p_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para transferir: producto %, origen %, requerido %, disponible %', p_producto_id, p_origen, p_cantidad, v_stock;
    END IF;
    UPDATE stock_deposito
      SET stock_actual = stock_actual - p_cantidad,
          ultima_actualizacion = CURRENT_TIMESTAMP
    WHERE producto_id = p_producto_id AND deposito = p_origen;

    -- Incrementa destino
    UPDATE stock_deposito
      SET stock_actual = stock_actual + p_cantidad,
          ultima_actualizacion = CURRENT_TIMESTAMP
    WHERE producto_id = p_producto_id AND deposito = p_destino;

    INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, origen, destino, usuario, orden_compra_id)
    VALUES (p_producto_id, p_tipo, p_cantidad, p_origen, p_destino, p_usuario, p_orden_compra_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generar reorden por depósito (simplificado)
CREATE OR REPLACE FUNCTION sp_generar_reorden(p_deposito VARCHAR)
RETURNS TABLE (pedido_id INT) AS $$
DECLARE
  rec RECORD;
  v_proveedor_id INT;
  v_pedido_id INT;
BEGIN
  -- Seleccionar proveedor preferente por precio y desempeño (simplificado: por mínimo precio)
  FOR rec IN
    SELECT s.producto_id, MIN(pp.precio) AS mejor_precio
    FROM stock_deposito s
    JOIN precios_proveedor pp ON pp.producto_id = s.producto_id AND pp.activo = TRUE
    WHERE s.deposito = p_deposito AND s.stock_actual <= s.stock_minimo
    GROUP BY s.producto_id
  LOOP
    SELECT proveedor_id INTO v_proveedor_id
    FROM precios_proveedor
    WHERE producto_id = rec.producto_id AND activo = TRUE AND precio = rec.mejor_precio
    LIMIT 1;

    IF v_proveedor_id IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO pedidos (proveedor_id, estado) VALUES (v_proveedor_id, 'borrador')
    RETURNING id INTO v_pedido_id;

    INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio)
    VALUES (v_pedido_id, rec.producto_id, LEAST(GREATEST(1, stock_minimo - stock_actual), 10), rec.mejor_precio); -- ejemplo de cantidad

    RETURN QUERY SELECT v_pedido_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cálculo de precio de venta (margen/markup)
CREATE OR REPLACE FUNCTION fnc_calcular_precio_venta(
  p_producto_id INT, p_categoria_id INT, p_costo NUMERIC
) RETURNS NUMERIC(10,2) AS $$
DECLARE
  v_margen NUMERIC(5,2);
BEGIN
  -- Regla simple: usar margen de categoría si disponible
  SELECT COALESCE(markup_default, 0) INTO v_margen
  FROM categorias WHERE id = p_categoria_id;

  RETURN ROUND(p_costo * (1 + v_margen / 100), 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asignación de proveedor faltante (score ponderado)
CREATE OR REPLACE FUNCTION fnc_asignar_proveedor_faltante(p_producto_id INT)
RETURNS TABLE (proveedor_id INT, score NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT pp.proveedor_id,
         (1000 - COALESCE(pp.precio, 0)) + -- menor precio suma más
         (CASE WHEN s.stock_actual >= 10 THEN 100 ELSE 0 END) + -- disponibilidad
         (CASE WHEN perf.otif >= 0.95 THEN 50 ELSE 0 END) + -- desempeño
         (-COALESCE(perf.lead_time_days, 7)) -- menor lead time suma más
         AS score
  FROM precios_proveedor pp
  LEFT JOIN stock_deposito s ON s.producto_id = pp.producto_id AND s.deposito = 'Principal'
  LEFT JOIN proveedor_performance perf ON perf.proveedor_id = pp.proveedor_id
  WHERE pp.producto_id = p_producto_id AND pp.activo = TRUE
  ORDER BY score DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Vistas y materializadas para reporting

```sql
-- Inventario actual
CREATE VIEW v_inventario_actual AS
SELECT
  p.id AS producto_id,
  p.sku,
  p.nombre,
  s.deposito,
  s.stock_actual,
  s.stock_minimo,
  s.stock_maximo,
  s.ultima_actualizacion
FROM productos p
JOIN stock_deposito s ON s.producto_id = p.id
WHERE p.activo = TRUE AND s.activo = TRUE;

-- Stock mínimos
CREATE VIEW v_stock_minimos AS
SELECT
  p.id AS producto_id,
  p.sku,
  p.nombre,
  s.deposito,
  s.stock_actual,
  s.stock_minimo
FROM productos p
JOIN stock_deposito s ON s.producto_id = p.id
WHERE p.activo = TRUE AND s.activo = TRUE
  AND s.stock_actual <= s.stock_minimo;

-- KPIs operativos
CREATE VIEW v_kpis_operativos AS
SELECT
  DATE_TRUNC('day', m.fecha) AS dia,
  COUNT(*) FILTER (WHERE mi.tipo = 'salida') AS ventas_unidades,
  COUNT(*) FILTER (WHERE mi.tipo = 'entrada') AS entradas_unidades,
  COUNT(DISTINCT mi.producto_id) AS skus_distintos,
  SUM(CASE WHEN s.stock_actual <= s.stock_minimo THEN 1 ELSE 0 END) AS skus_bajo_minimo
FROM movimientos_inventario mi
JOIN productos p ON p.id = mi.producto_id
JOIN stock_deposito s ON s.producto_id = p.id
GROUP BY DATE_TRUNC('day', m.fecha);

-- Rotación mensual materializada
CREATE MATERIALIZED VIEW materialized_view_rotacion_mensual AS
SELECT
  c.id AS categoria_id,
  c.nombre AS categoria,
  DATE_TRUNC('month', mi.fecha) AS mes,
  SUM(CASE WHEN mi.tipo = 'salida' THEN mi.cantidad ELSE 0 END) AS ventas_unidades,
  AVG(s.stock_actual) AS stock_promedio
FROM movimientos_inventario mi
JOIN productos p ON p.id = mi.producto_id
JOIN categorias c ON c.id = p.categoria_id
JOIN stock_deposito s ON s.producto_id = p.id
GROUP BY c.id, c.nombre, DATE_TRUNC('month', mi.fecha);
```

Scripts de índices adicionales y optimización

```sql
-- Índices de soporte a reportes y búsquedas frecuentes
CREATE INDEX idx_productos_nombre_trgm ON productos USING GIN (nombre gin_trgm_ops);
CREATE INDEX idx_precios_proveedor_idx ON precios_proveedor(proveedor_id, producto_id);

-- Estadísticas y mantenimiento
ANALYZE;
-- En operación, ejecutar VACUUM/ANALYZE según carga:
-- VACUUM ANALYZE;
```

Estos scripts se organizan para despliegues reproducibles, con separación clara de maestros, transacciones, auditoría y reporting, y siguiendo prácticas de rendimiento y trazabilidad[^2][^1].

## 13. Seguridad, RBAC y cumplimiento

Se implementa control de acceso basado en roles (RBAC) con separación de privilegios:

- rol_lectura: solo consultas SELECT en tablas transaccionales y vistas.
- rol_escritura: INSERT/UPDATE/DELETE en dominios específicos (precios, inventario).
- rol_mantenimiento: ejecución de DDL, creación de índices, mantenimiento (VACUUM/ANALYZE).
- rol_admin: gestión de roles, políticas y auditoría.

Tabla 14. Matriz de roles y permisos
| Rol | Permisos | Ámbito |
|---|---|---|
| rol_lectura | SELECT | productos, precios_proveedor, stock_deposito, vistas |
| rol_escritura | INSERT/UPDATE/DELETE | precios_proveedor, stock_deposito, movimientos_inventario |
| rol_mantenimiento | DDL, VACUUM/ANALYZE | Esquema completo |
| rol_admin | GRANT/REVOKE, auditoría | Metadatos y seguridad |

Cifrado y secretos:
- TLS para comunicaciones; cifrado en reposo mediante políticas de backup cifrado.
- Secrets gestionados en la plataforma de ejecución; rotación de API Keys.
- Auditoría de accesos y cambios de configuración; políticas de retención según cumplimiento.

Estas prácticas se integran en un stack retail moderno y estándares de seguridad en APIs y datos[^4].

## 14. Pruebas, validación y criterios de aceptación

Pruebas de integridad:
- FKs: validación de inserciones que violan referencialidad deben fallar.
- Unicidad: SKU y GTIN; precio vigente único por producto/proveedor.
- Checks: stock no negativo; estados válidos en pedidos.

Pruebas funcionales:
- Pricing: aplicar precio y verificar price_history; obtener precio vigente con fnc_precio_vigente.
- Inventario: movimientos de entrada/salida/transferencia; validación de stock insuficiente; triggers de auditoría.
- Recepción de OC: sp_recepcion_oc actualiza inventario y registra auditoría; reconciliación con conteos cíclicos.

Pruebas de rendimiento:
- Consulta de precio vigente y stock por ubicación con cargas concurrentes; verificar latencia p95 y throughput.
- Pruebas de estrés en sincronizaciones (precios cada 15 min; stock cada 5 min).

Criterios de aceptación:
- Integridad referencial y checks pasan al 100%.
- Latencia p95 < 2 s en consultas críticas; p99 < 3.5 s.
- Auditoría completa en cambios de precio y stock; reportes con vistas y materializadas actualizadas.

Tabla 15. Plan de pruebas por módulo y KPIs
| Módulo | Caso de prueba | Resultado esperado | KPI asociado |
|---|---|---|---|
| Precios | Aplicar precio y auditar | Registro en price_history | Latencia p95 < 150 ms |
| Inventario | Movimiento de salida con stock insuficiente | Rechazo con mensaje claro | Consistencia de inventario |
| Compras | Generación de reorden | Pedido en borrador con líneas | Throughput por hora |
| Reporting | Refresh de materialized_view | Datos agregados correctos | Tiempo de agregación |
| Auditoría | Trigger de stock | stock_auditoria completa | Cobertura de auditoría |

Estas pruebas validan consistencia y latencias requeridas en inventario y reporting[^1][^4].

## 15. Roadmap de implementación y gobernanza

Fases:
1. Fundación y BD: esquema completo, APIs core, integración Maxiconsumo (precios/stock/catálogo).
2. Stock inteligente: alertas y dashboard; motor de reorden y asignación automática.
3. Analytics y optimización: KPIs, vistas materializadas, tuning y pruebas de carga.
4. Go-live y estabilización: despliegue gradual, soporte 24/7, optimización final.

Hitos:
- M1: Base de datos y APIs core funcionales; sincronización de precios cada 15 min.
- M2: Alertas de stock y motor de asignación automática operativo.
- M3: Dashboards y KPIs en tiempo real; optimización de rendimiento.
- M4: Go-live estable con monitoreo y soporte.

Gobernanza:
- Metodología ágil (Scrum), sprints de 2 semanas.
- Dailies, Sprint Planning/Review/Retro; Weekly Status; Steering mensual.
- Documentación técnica y de usuario actualizada en cada sprint.

Tabla 16. Resumen por fase
| Fase | Duración | Entregables clave | Riesgos | Mitigaciones |
|---|---|---|---|---|
| Fundación y BD | 8 semanas | Esquema, APIs, integración Maxiconsumo | Integración compleja | POC, SLAs, resiliencia |
| Stock inteligente | 6 semanas | Alertas, reorden, dashboard | Performance | Cache, índices, colas |
| Analytics y optimización | 8 semanas | KPIs, MV, tuning | Carga analítica | Réplicas, materializadas |
| Go-live y estabilización | 4 semanas | Despliegue, soporte | Resistencia al cambio | Capacitación, soporte intensivo |

Este enfoque gradual reduce riesgos y alinea la entrega de valor con el roadmap de negocio[^1][^2].

---

## Referencias

[^1]: Cockroach Labs. Inventory Management Reference Architecture. https://www.cockroachlabs.com/blog/inventory-management-reference-architecture/
[^2]: Sematext. PostgreSQL Performance Tuning. https://sematext.com/blog/postgresql-performance-tuning/
[^3]: GoFTX. POS Migration Guide: Hassle-Free Data & System Transition. https://goftx.com/blog/pos-migration/
[^4]: Redgate. Creating a Database Model for an Inventory Management System. https://www.red-gate.com/blog/data-model-for-inventory-management-system
[^5]: EDB. Everything You Need to Know About Postgres Stored Procedures and Functions. https://www.enterprisedb.com/postgres-tutorials/everything-you-need-know-about-postgres-stored-procedures-and-functions
[^6]: PostgreSQL Documentation. Trigger Functions (PL/pgSQL). https://www.postgresql.org/docs/current/plpgsql-trigger.html
[^7]: Shopify. How to Build Your Ultimate Retail Tech Stack (2025). https://www.shopify.com/ph/retail/retail-tech-stack
[^8]: Severalnines. PostgreSQL Triggers and Stored Function Basics. https://severalnines.com/blog/postgresql-triggers-and-stored-function-basics/
