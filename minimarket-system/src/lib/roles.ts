/**
 * Role Types and Configuration
 * 
 * Define los roles del sistema y sus permisos de acceso a rutas.
 */

/** Roles disponibles en el sistema */
export type UserRole = 'admin' | 'deposito' | 'ventas' | 'usuario';

/** Configuración de una ruta con control de rol */
export interface RouteConfig {
        path: string;
        label: string;
        icon: string;
        /** Roles que pueden acceder a esta ruta. Si está vacío, todos pueden acceder */
        allowedRoles: UserRole[];
}

/** Roles que pueden acceder a todas las rutas públicas */
export const PUBLIC_ROLES: UserRole[] = ['admin', 'deposito', 'ventas', 'usuario'];

/** Rutas del sistema con sus permisos */
export const ROUTE_CONFIG: Record<string, UserRole[]> = {
        '/': PUBLIC_ROLES, // Dashboard - todos
        '/deposito': ['admin', 'deposito'],
        '/kardex': ['admin', 'deposito'],
        '/rentabilidad': ['admin', 'deposito'],
        '/stock': PUBLIC_ROLES, // Stock - todos
        '/tareas': PUBLIC_ROLES, // Tareas - todos
        '/cuaderno': PUBLIC_ROLES, // Cuaderno Inteligente - todos
        '/productos': ['admin', 'deposito', 'ventas'],
        '/proveedores': ['admin', 'deposito'],
        '/pedidos': ['admin', 'deposito', 'ventas'],
        '/pos': ['admin', 'ventas'],
        '/pocket': ['admin', 'deposito'],
        '/clientes': ['admin', 'ventas'],
        '/ventas': ['admin', 'ventas'],
        '/facturas': ['admin', 'deposito'],
};

/**
 * Verifica si un rol tiene acceso a una ruta
 */
export function canAccessRoute(userRole: UserRole | null, path: string): boolean {
        if (!userRole) return false;

        const allowedRoles = ROUTE_CONFIG[path];
        if (!allowedRoles) return false; // DENY-BY-DEFAULT: ruta no configurada = sin acceso

        return allowedRoles.includes(userRole);
}

/**
 * Obtiene las rutas permitidas para un rol
 */
export function getRoutesForRole(userRole: UserRole | null): string[] {
        if (!userRole) return [];

        return Object.entries(ROUTE_CONFIG)
                .filter(([_, roles]) => roles.includes(userRole))
                .map(([path]) => path);
}
