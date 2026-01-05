export type EndpointName =
    | 'precios'
    | 'productos'
    | 'comparacion'
    | 'sincronizar'
    | 'status'
    | 'alertas'
    | 'estadisticas'
    | 'configuracion'
    | 'health';

export const endpointList: EndpointName[] = [
    'precios',
    'productos',
    'comparacion',
    'sincronizar',
    'status',
    'alertas',
    'estadisticas',
    'configuracion',
    'health'
];

export function isEndpointName(value: string): value is EndpointName {
    return endpointList.includes(value as EndpointName);
}

export type EndpointSchema = {
    description: string;
    requiresAuth: boolean;
};

export const endpointSchemas: Record<EndpointName, EndpointSchema> = {
    precios: { description: 'Consulta de precios actuales', requiresAuth: false },
    productos: { description: 'Listado de productos disponibles', requiresAuth: false },
    comparacion: { description: 'Comparación con inventario interno', requiresAuth: false },
    sincronizar: { description: 'Trigger de sincronización manual', requiresAuth: true },
    status: { description: 'Estado del sistema proveedor', requiresAuth: false },
    alertas: { description: 'Alertas activas', requiresAuth: false },
    estadisticas: { description: 'Métricas de scraping y proveedor', requiresAuth: false },
    configuracion: { description: 'Configuración segura del proveedor', requiresAuth: true },
    health: { description: 'Health check completo', requiresAuth: false }
};
