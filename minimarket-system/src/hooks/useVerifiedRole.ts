/**
 * Hook para obtener el rol verificado del usuario desde la base de datos
 * 
 * SEGURIDAD: Este hook obtiene el rol desde la tabla `personal`, 
 * NO desde `user_metadata` que es manipulable por el cliente.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { UserRole } from '../lib/roles';

export interface VerifiedRoleResult {
        /** Rol verificado desde la base de datos */
        role: UserRole;
        /** Si está cargando el rol */
        loading: boolean;
        /** Error si ocurrió alguno */
        error: string | null;
        /** Refetch del rol */
        refetch: () => Promise<void>;
}

/**
 * Obtiene el rol del usuario desde la tabla `personal` (server-side truth)
 * 
 * @example
 * ```tsx
 * const { role, loading, error } = useVerifiedRole();
 * 
 * if (loading) return <Spinner />;
 * if (role === 'admin') {
 *   // Mostrar contenido admin
 * }
 * ```
 */
export function useVerifiedRole(): VerifiedRoleResult {
        const { user, loading: authLoading } = useAuth();
        const [role, setRole] = useState<UserRole>('usuario');
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);

        const fetchRole = async () => {
                if (!user) {
                        setRole('usuario');
                        setLoading(false);
                        return;
                }

                try {
                        setLoading(true);
                        setError(null);

                        // Buscar el rol en la tabla personal usando el user_auth_id
                        const { data, error: queryError } = await supabase
                                .from('personal')
                                .select('rol')
                                .eq('user_auth_id', user.id)
                                .eq('activo', true)
                                .single();

                        if (queryError) {
                                // Si no encuentra registro, el usuario no está en personal
                                if (queryError.code === 'PGRST116') {
                                        console.warn('Usuario no encontrado en tabla personal, usando rol por defecto');
                                        setRole('usuario');
                                } else {
                                        throw queryError;
                                }
                        } else if (data?.rol) {
                                // Normalizar el rol a lowercase y mapear a valores válidos
                                const normalizedRole = normalizeRole(data.rol);
                                setRole(normalizedRole);
                        } else {
                                setRole('usuario');
                        }
                } catch (err) {
                        console.error('Error fetching verified role:', err);
                        setError(err instanceof Error ? err.message : 'Error desconocido');
                        setRole('usuario'); // Fallback seguro: mínimos permisos
                } finally {
                        setLoading(false);
                }
        };

        useEffect(() => {
                if (!authLoading) {
                        fetchRole();
                }
        }, [user, authLoading]);

        return {
                role,
                loading: authLoading || loading,
                error,
                refetch: fetchRole,
        };
}

/**
 * Normaliza el string del rol a un UserRole válido
 */
function normalizeRole(rolString: string | null | undefined): UserRole {
        if (!rolString) return 'usuario';

        const normalized = rolString.toLowerCase().trim();

        // Mapear variantes conocidas
        const roleMap: Record<string, UserRole> = {
                'admin': 'admin',
                'administrador': 'admin',
                'administrator': 'admin',
                'deposito': 'deposito',
                'depósito': 'deposito',
                'warehouse': 'deposito',
                'ventas': 'ventas',
                'vendedor': 'ventas',
                'sales': 'ventas',
                'usuario': 'usuario',
                'user': 'usuario',
        };

        return roleMap[normalized] || 'usuario';
}

export default useVerifiedRole;
