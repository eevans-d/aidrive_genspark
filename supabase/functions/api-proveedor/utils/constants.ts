export const CIRCUIT_BREAKER_OPTIONS = {
    failureThreshold: 3,
    successThreshold: 1,
    openTimeoutMs: 30000
};

export const PRODUCT_ORDER_FIELDS = [
    'nombre_asc',
    'precio_asc',
    'precio_desc',
    'stock_desc',
    'categoria_asc'
] as const;

export const COMPARACION_ORDER_FIELDS = [
    'diferencia_absoluta_desc',
    'diferencia_absoluta_asc',
    'diferencia_relativa_desc',
    'diferencia_relativa_asc',
    'actualizado_desc'
] as const;

export const SINCRONIZACION_PRIORIDADES = ['normal', 'alta', 'baja'] as const;

export const ALERTA_SEVERIDADES = ['todos', 'critica', 'alta', 'media', 'baja'] as const;

export const ALERTA_TIPOS = ['todos', 'precio', 'stock', 'sistema', 'otros'] as const;

export const ESTADISTICAS_GRANULARIDADES = ['hora', 'dia', 'semana', 'mes'] as const;
