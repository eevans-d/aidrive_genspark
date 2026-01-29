/**
 * Router Index - api-minimarket
 * Exporta todos los routers y el registro de rutas
 * @module api-minimarket/routers/index
 */

// Types
export * from './types.ts';

// Productos & Categorias
export {
        getProductosDropdownHandler,
        getCategoriasHandler,
        getCategoriaByIdHandler,
        getProductosHandler,
        getProductoByIdHandler,
        createProductoHandler,
        updateProductoHandler,
        deleteProductoHandler,
} from './productos.ts';

// Stock
export {
        getStockHandler,
        getStockMinimoHandler,
        getStockProductoHandler,
} from './stock.ts';

// Deposito
export {
        createMovimientoHandler,
        getMovimientosHandler,
        createIngresoHandler,
} from './deposito.ts';

// Tareas
export {
        createTareaHandler,
        completarTareaHandler,
        cancelarTareaHandler,
        getEfectividadTareasHandler,
} from './tareas.ts';

/**
 * Registro de todas las rutas disponibles
 * Para usar en el index.ts principal
 */
export const ROUTE_REGISTRY = {
        // Productos
        'GET /productos/dropdown': 'getProductosDropdownHandler',
        'GET /proveedores/dropdown': 'getProveedoresDropdownHandler',
        'GET /categorias': 'getCategoriasHandler',
        'GET /categorias/:id': 'getCategoriaByIdHandler',
        'GET /productos': 'getProductosHandler',
        'GET /productos/:id': 'getProductoByIdHandler',
        'POST /productos': 'createProductoHandler',
        'PUT /productos/:id': 'updateProductoHandler',
        'DELETE /productos/:id': 'deleteProductoHandler',

        // Stock
        'GET /stock': 'getStockHandler',
        'GET /stock/minimo': 'getStockMinimoHandler',
        'GET /stock/producto/:id': 'getStockProductoHandler',

        // Deposito
        'POST /deposito/movimiento': 'createMovimientoHandler',
        'GET /deposito/movimientos': 'getMovimientosHandler',
        'POST /deposito/ingreso': 'createIngresoHandler',

        // Tareas
        'POST /tareas': 'createTareaHandler',
        'PUT /tareas/:id/completar': 'completarTareaHandler',
        'PUT /tareas/:id/cancelar': 'cancelarTareaHandler',
        'GET /reportes/efectividad-tareas': 'getEfectividadTareasHandler',
};

/**
 * Mapeo de patrones regex para rutas con parámetros
 */
export const ROUTE_PATTERNS = {
        '/categorias/:id': /^\/categorias\/[a-f0-9-]+$/,
        '/productos/:id': /^\/productos\/[a-f0-9-]+$/,
        '/stock/producto/:id': /^\/stock\/producto\/[a-f0-9-]+$/,
        '/tareas/:id/completar': /^\/tareas\/[a-f0-9-]+\/completar$/,
        '/tareas/:id/cancelar': /^\/tareas\/[a-f0-9-]+\/cancelar$/,
};
