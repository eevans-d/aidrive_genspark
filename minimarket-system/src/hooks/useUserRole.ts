import { useMemo } from 'react';
import { useVerifiedRole } from './useVerifiedRole';
import {
        UserRole,
        canAccessRoute,
        getRoutesForRole
} from '../lib/roles';

/**
 * Hook para obtener el rol del usuario actual y verificar permisos
 * 
 * SEGURIDAD: Ahora usa useVerifiedRole() que obtiene el rol desde
 * la tabla `personal` en la base de datos, NO desde user_metadata.
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
        // Usar el rol verificado desde la base de datos
        const { role, loading, error, refetch } = useVerifiedRole();

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
                /** Rol del usuario actual (verificado desde DB) */
                role,
                /** Si está cargando el usuario/rol */
                loading,
                /** Error al cargar el rol */
                error,
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
                /** Refetch del rol desde la base de datos */
                refetch,
        };
}

export default useUserRole;
