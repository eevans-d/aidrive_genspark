import { useMemo } from 'react';
import { useAuth } from './useAuth';
import {
        UserRole,
        extractUserRole,
        canAccessRoute,
        getRoutesForRole
} from '../lib/roles';

/**
 * Hook para obtener el rol del usuario actual y verificar permisos
 * 
 * @example
 * ```tsx
 * const { role, canAccess, isAdmin } = useUserRole();
 * 
 * if (canAccess('/deposito')) {
 *   // Mostrar contenido
 * }
 * ```
 */
export function useUserRole() {
        const { user, loading } = useAuth();

        const role = useMemo<UserRole>(() => {
                return extractUserRole(user);
        }, [user]);

        const allowedRoutes = useMemo(() => {
                return getRoutesForRole(role);
        }, [role]);

        const canAccess = (path: string): boolean => {
                return canAccessRoute(role, path);
        };

        const isAdmin = role === 'admin';
        const isDeposito = role === 'deposito' || role === 'admin';
        const isVentas = role === 'ventas' || role === 'deposito' || role === 'admin';

        return {
                /** Rol del usuario actual */
                role,
                /** Si está cargando el usuario */
                loading,
                /** Verifica si puede acceder a una ruta */
                canAccess,
                /** Rutas permitidas para este rol */
                allowedRoutes,
                /** Es administrador */
                isAdmin,
                /** Es deposito o superior */
                isDeposito,
                /** Es ventas o superior */
                isVentas,
        };
}

export default useUserRole;
