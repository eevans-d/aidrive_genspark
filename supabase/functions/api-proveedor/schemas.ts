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
    allowedMethods: string[];
};

export const endpointSchemas: Record<EndpointName, EndpointSchema> = {
    precios: { description: 'Consulta de precios actuales', requiresAuth: true, allowedMethods: ['GET'] },
    productos: { description: 'Listado de productos disponibles', requiresAuth: true, allowedMethods: ['GET'] },
    comparacion: { description: 'Comparación con inventario interno', requiresAuth: true, allowedMethods: ['GET'] },
    sincronizar: { description: 'Trigger de sincronización manual', requiresAuth: true, allowedMethods: ['POST'] },
    status: { description: 'Estado del sistema proveedor', requiresAuth: true, allowedMethods: ['GET'] },
    alertas: { description: 'Alertas activas', requiresAuth: true, allowedMethods: ['GET'] },
    estadisticas: { description: 'Métricas de scraping y proveedor', requiresAuth: true, allowedMethods: ['GET'] },
    configuracion: { description: 'Configuración segura del proveedor', requiresAuth: true, allowedMethods: ['GET'] },
    health: { description: 'Health check completo', requiresAuth: false, allowedMethods: ['GET'] }
};
