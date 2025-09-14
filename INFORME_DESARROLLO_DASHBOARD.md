# Informe de Análisis y Síntesis del Proyecto 'aidrive_genspark' para Desarrollo de Dashboard de Business Intelligence

**Fecha de Generación:** 14 de Septiembre de 2025

**Objetivo:** Proporcionar a un modelo de IA externo toda la información necesaria para diseñar, planificar y desarrollar un dashboard de BI óptimo, funcional y completo para el sistema de gestión de inventario retail.

---

### 1. Resumen Ejecutivo

El proyecto es un **Sistema Multi-Agente de Gestión de Inventario para Retail**, diseñado específicamente para el mercado argentino. Su arquitectura se basa en microservicios que encapsulan distintas responsabilidades de negocio:

*   **`agente_deposito`**: Gestiona el núcleo del inventario (productos, stock). Es la fuente de verdad de los datos.
*   **`agente_negocio`**: Orquesta procesos de negocio complejos, como el procesamiento de facturas de compra mediante **OCR** y el cálculo de precios ajustados por **inflación**.
*   **`ml_service`**: Un servicio de Machine Learning que proporciona **predicciones de demanda** y recomendaciones.
*   **`shared`**: Una librería interna con código común, incluyendo modelos de datos, configuración y patrones de resiliencia.

El objetivo del nuevo dashboard es proporcionar una interfaz visual e interactiva para monitorear, analizar y gestionar el inventario, aprovechando toda la riqueza de datos y funcionalidades que el sistema subyacente ofrece.

---

### 2. Arquitectura del Sistema

El dashboard se integrará como un cliente que consume las APIs expuestas por los microservicios.

```
+-----------------------------------------------------------------+
|         Nuevo Dashboard de BI (React/Vue/Angular)               |
+---------------------------------^-------------------------------+
                                  | Peticiones API (REST/JSON)
+---------------------------------v-------------------------------+
|            API Gateway / Proxy Inverso (NGINX)                  |
+--^-----------^----------------------^----------------------^----+
   |           |                      |                      |
   | /facturas | /api/v1/productos    | /predict             | ...
   |           | /api/v1/stock        |                      |
+--v-----------v--+      +-------------v---+      +-----------v---+
|                 |      |                 |      |               |
|  Agente Negocio |----->| Agente Deposito |      |  ML Service   |
| (FastAPI)       |      | (FastAPI)       |      | (FastAPI)     |
+-----------------+      +-------^---------+      +---------------+
                                 |
+--------------------------------v--------------------------------+
|                   Base de Datos (PostgreSQL)                    |
+-----------------------------------------------------------------+
```

El `agente_deposito` será la fuente principal de datos para el dashboard.

---

### 3. Pila Tecnológica (Stack)

*   **Backend:** Python
*   **Frameworks API:** FastAPI
*   **Base de Datos:** PostgreSQL (para datos persistentes)
*   **Caché:** Redis (para datos de acceso rápido)
*   **ORM:** SQLAlchemy
*   **Validación de Datos:** Pydantic
*   **Contenerización:** Docker
*   **Servidor Web/Proxy:** Nginx

---

### 4. Modelo de Datos Central (Entidades Clave para el Dashboard)

El dashboard debe centrarse en visualizar las siguientes entidades, cuyos modelos se definen en `shared/models.py` y se exponen a través de los esquemas en `agente_deposito/schemas_updated.py`.

#### **Entidad Principal: `Producto`**

Representa un artículo en el inventario.

| Campo | Tipo de Dato | Descripción para el Dashboard |
| :--- | :--- | :--- |
| `id` | Integer | Identificador único. |
| `codigo` | String | **(Clave)** Código único del producto (SKU). |
| `nombre` | String | **(Display)** Nombre principal del producto. |
| `categoria` | String | **(Filtro/Agrupación)** Categoría para agrupar productos. |
| `stock_actual` | Integer | **(KPI Principal)** Unidades disponibles actualmente. |
| `stock_minimo` | Integer | **(KPI/Alerta)** Umbral para generar alertas de "stock bajo". |
| `stock_maximo` | Integer | Umbral para detectar "sobrestock". |
| `precio_costo` | Float/Decimal | Precio de compra al proveedor. Clave para calcular valor de inventario. |
| `precio_venta` | Float/Decimal | Precio de venta al público. Clave para calcular ingresos potenciales. |
| `proveedor_cuit` | String | CUIT del proveedor principal. Permite agrupar por proveedor. |
| `activo` | Boolean | **(Filtro)** Indica si el producto está activo o descontinuado. |
| `fecha_creacion` | Datetime | Fecha de alta del producto. |
| `fecha_modificacion`| Datetime | Última fecha de actualización. |
| `stock_critico` | Boolean | **(Alerta Visual)** Campo calculado en la respuesta de la API. `True` si `stock_actual <= stock_minimo`. |
| `margen_ganancia`| Float | **(KPI)** Campo calculado en la API. `(precio_venta - precio_costo) / precio_venta`. |

#### **Entidad de Auditoría: `MovimientoStock`**

Registra cada cambio en el inventario de un producto. Esencial para trazabilidad y análisis.

| Campo | Tipo de Dato | Descripción para el Dashboard |
| :--- | :--- | :--- |
| `id` | Integer | Identificador único del movimiento. |
| `producto_id` | Integer | ID del producto afectado. |
| `tipo_movimiento` | String (Enum) | **(Filtro/Agrupación)** 'ENTRADA', 'SALIDA', 'AJUSTE'. |
| `cantidad` | Integer | Unidades movidas (+ para entrada, - para salida). |
| `stock_anterior` | Integer | Stock del producto antes del movimiento. |
| `stock_posterior` | Integer | Stock resultante después del movimiento. |
| `motivo` | String | Descripción del motivo (ej. "Venta", "Compra a proveedor"). |
| `referencia` | String | Documento asociado (Nº de factura, remito). |
| `usuario` | String | Usuario que registró el movimiento. |
| `timestamp` | Datetime | **(Eje Temporal)** Fecha y hora exactas del movimiento. |

---

### 5. API y Endpoints Relevantes para el Dashboard

El dashboard interactuará principalmente con la API del **`agente_deposito`** (`main_complete.py`).

#### **Endpoints de Productos (`/api/v1/productos`)**

*   `GET /api/v1/productos`
    *   **Uso Principal:** Obtener la lista principal de productos para tablas y visualizaciones.
    *   **Parámetros Clave:** `page`, `size`, `nombre`, `categoria`, `stock_critico`, `sobrestock`, `activo`.
    *   **Respuesta:** Devuelve una lista paginada de objetos `ProductoResponse`. **Este será el endpoint más utilizado por el dashboard.**

*   `GET /api/v1/productos/{producto_id}`
    *   **Uso Principal:** Ver el detalle completo de un producto específico.

*   `GET /api/v1/productos/search?q={termino}`
    *   **Uso Principal:** Implementar una barra de búsqueda global y autocompletado.

#### **Endpoints de Stock (`/api/v1/stock`)**

*   `GET /api/v1/stock/critical`
    *   **Uso Principal:** Obtener una lista directa de todos los productos que necesitan atención inmediata (stock bajo). Ideal para un widget de "Alertas".

*   `GET /api/v1/stock/movements?producto_id={id}&dias={dias}`
    *   **Uso Principal:** Obtener el historial de movimientos para un producto específico. Esencial para gráficos de evolución de stock y auditorías.

#### **Endpoints de Reportes (`/api/v1/reportes`)**

*   `GET /api/v1/reportes/stock`
    *   **Uso Principal:** Obtener KPIs y métricas agregadas de todo el inventario. Perfecto para la vista principal del dashboard (tarjetas de resumen).
    *   **Respuesta Clave:** `total_productos`, `productos_stock_critico`, `valor_total_inventario`.

*   `GET /api/v1/reportes/top-movimientos`
    *   **Uso Principal:** Mostrar un ranking de los productos con mayor rotación (más vendidos o movidos).

---

### 6. Funcionalidades Clave a Visualizar

El dashboard debe traducir las capacidades del sistema en componentes visuales:

1.  **Visión General (Homepage):**
    *   **KPIs Principales:** Tarjetas con `Valor Total del Inventario`, `Nº de Productos con Stock Crítico`, `Total de SKUs Activos`. (Datos de `/reportes/stock`).
    *   **Alertas Inmediatas:** Una lista/tabla con los productos en stock crítico. (Datos de `/stock/critical`).
    *   **Ranking de Productos:** Gráfico de barras con los productos de mayor rotación. (Datos de `/reportes/top-movimientos`).

2.  **Módulo de Inventario (Vista de Tabla):**
    *   Una tabla completa, paginada y con filtros de todos los productos. (Datos de `GET /productos`).
    *   **Filtros:** Por nombre, categoría, estado (activo/inactivo), estado de stock (crítico/normal/sobrestock).
    *   **Indicadores Visuales:** Usar colores en la tabla para resaltar filas con stock crítico.

3.  **Vista de Detalle de Producto:**
    *   Al hacer clic en un producto, mostrar toda su información. (Datos de `GET /productos/{id}`).
    *   **Gráfico Histórico de Stock:** Un gráfico de líneas mostrando la evolución del `stock_actual` a lo largo del tiempo, usando los datos de `GET /stock/movements`.

4.  **Análisis y Reportes:**
    *   Gráficos de torta/barras para visualizar la distribución de productos por `categoría`.
    *   Análisis del valor del inventario por `categoría` o `proveedor`.

---

### 7. Recomendaciones para el Nuevo Dashboard

*   **Tecnología Frontend:** Se recomienda un framework moderno como **React, Vue o Svelte**. Esto permitirá crear una Single-Page Application (SPA) rápida, interactiva y desacoplada del backend.
*   **Librerías de Gráficos:** Utilizar librerías como **Chart.js**, **D3.js** o **ECharts** para las visualizaciones de datos.
*   **Gestión de Estado:** Implementar un gestor de estado global (como Redux, Vuex o Zustand) para manejar los datos de la API de forma eficiente.
*   **Componentes UI:** Usar una librería de componentes como Material-UI, Ant Design o Bootstrap para acelerar el desarrollo y asegurar una estética consistente y profesional.
*   **Autenticación:** El dashboard deberá implementar un flujo de login que obtenga un token JWT del endpoint `/api/v1/auth/login` del `agente_deposito` y lo envíe en la cabecera `Authorization: Bearer <token>` de todas las peticiones subsecuentes.

---

### 8. Conclusión para el Modelo IA

Tu tarea es diseñar y desarrollar el código para un dashboard frontend que cumpla con los requisitos y recomendaciones descritos. Debes:
1.  Estructurar una aplicación frontend (preferiblemente React).
2.  Crear componentes para cada una de las vistas sugeridas (Visión General, Tabla de Inventario, Detalle de Producto).
3.  Implementar la lógica para consumir los endpoints de la API del `agente_deposito` especificados en la sección 5.
4.  Visualizar los datos obtenidos, prestando especial atención a los KPIs y alertas.
5.  Asegurar que la interfaz sea limpia, intuitiva y funcional, permitiendo a un usuario de negocio entender rápidamente el estado del inventario y tomar decisiones informadas.

Este informe contiene toda la información de backend necesaria. No se requiere análisis adicional del código fuente del sistema de inventario. Procede directamente a la planificación y desarrollo del dashboard.
