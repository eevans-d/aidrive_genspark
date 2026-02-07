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
        '/deposito': ['admin', 'deposito'], // Solo admin y deposito
        '/kardex': ['admin', 'deposito'], // Kardex - solo admin y deposito
                '/rentabilidad': ['admin', 'deposito'], // Rentabilidad - solo admin y deposito
        '/stock': PUBLIC_ROLES, // Stock - todos
        '/tareas': PUBLIC_ROLES, // Tareas - todos
        '/productos': ['admin', 'deposito', 'ventas'], // Productos - no usuarios básicos
        '/proveedores': ['admin', 'deposito'], // Proveedores - solo admin y deposito
};

/**
 * Verifica si un rol tiene acceso a una ruta
 */
export function canAccessRoute(userRole: UserRole | null, path: string): boolean {
        if (!userRole) return false;

        const allowedRoles = ROUTE_CONFIG[path];
        if (!allowedRoles) return true; // Ruta no configurada = acceso libre

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

/**
 * Extrae el rol del usuario desde user_metadata o tabla personal
 * Por defecto retorna 'usuario' si no se encuentra
 */
export function extractUserRole(user: { user_metadata?: { rol?: string } } | null): UserRole {
        if (!user) return 'usuario';

        const rolFromMetadata = user.user_metadata?.rol?.toLowerCase();

        // Mapear posibles valores a roles válidos
        if (rolFromMetadata === 'admin' || rolFromMetadata === 'administrador') {
                return 'admin';
        }
        if (rolFromMetadata === 'deposito' || rolFromMetadata === 'depósito') {
                return 'deposito';
        }
        if (rolFromMetadata === 'ventas' || rolFromMetadata === 'vendedor') {
                return 'ventas';
        }

        return 'usuario';
}
