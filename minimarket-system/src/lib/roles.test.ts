import { describe, it, expect } from 'vitest';
import {
        canAccessRoute,
        getRoutesForRole,
        extractUserRole,
        ROUTE_CONFIG,
        PUBLIC_ROLES,
        UserRole,
} from './roles';

describe('canAccessRoute', () => {
        const ALL_ROLES: UserRole[] = ['admin', 'deposito', 'ventas', 'usuario'];

        describe('deny-by-default: ruta no configurada', () => {
                it('deniega acceso a ruta no registrada para todos los roles', () => {
                        for (const role of ALL_ROLES) {
                                expect(canAccessRoute(role, '/ruta-inventada')).toBe(false);
                                expect(canAccessRoute(role, '/admin-secreto')).toBe(false);
                                expect(canAccessRoute(role, '/api/debug')).toBe(false);
                        }
                });

                it('deniega acceso si userRole es null', () => {
                        expect(canAccessRoute(null, '/')).toBe(false);
                        expect(canAccessRoute(null, '/deposito')).toBe(false);
                        expect(canAccessRoute(null, '/ruta-inventada')).toBe(false);
                });
        });

        describe('rutas publicas (todos los roles)', () => {
                const publicPaths = ['/', '/stock', '/tareas'];

                for (const path of publicPaths) {
                        it(`permite ${path} para todos los roles`, () => {
                                for (const role of ALL_ROLES) {
                                        expect(canAccessRoute(role, path)).toBe(true);
                                }
                        });
                }
        });

        describe('rutas restringidas por rol', () => {
                const testCases: { path: string; allowed: UserRole[]; denied: UserRole[] }[] = [
                        {
                                path: '/deposito',
                                allowed: ['admin', 'deposito'],
                                denied: ['ventas', 'usuario'],
                        },
                        {
                                path: '/kardex',
                                allowed: ['admin', 'deposito'],
                                denied: ['ventas', 'usuario'],
                        },
                        {
                                path: '/rentabilidad',
                                allowed: ['admin', 'deposito'],
                                denied: ['ventas', 'usuario'],
                        },
                        {
                                path: '/productos',
                                allowed: ['admin', 'deposito', 'ventas'],
                                denied: ['usuario'],
                        },
                        {
                                path: '/proveedores',
                                allowed: ['admin', 'deposito'],
                                denied: ['ventas', 'usuario'],
                        },
                        {
                                path: '/pedidos',
                                allowed: ['admin', 'deposito', 'ventas'],
                                denied: ['usuario'],
                        },
                        {
                                path: '/pos',
                                allowed: ['admin', 'ventas'],
                                denied: ['deposito', 'usuario'],
                        },
                        {
                                path: '/pocket',
                                allowed: ['admin', 'deposito'],
                                denied: ['ventas', 'usuario'],
                        },
                        {
                                path: '/clientes',
                                allowed: ['admin', 'ventas'],
                                denied: ['deposito', 'usuario'],
                        },
                ];

                for (const { path, allowed, denied } of testCases) {
                        describe(path, () => {
                                for (const role of allowed) {
                                        it(`permite acceso a ${role}`, () => {
                                                expect(canAccessRoute(role, path)).toBe(true);
                                        });
                                }
                                for (const role of denied) {
                                        it(`deniega acceso a ${role}`, () => {
                                                expect(canAccessRoute(role, path)).toBe(false);
                                        });
                                }
                        });
                }
        });

        describe('caso especial: usuario rol usuario solo ve publicas', () => {
                it('usuario solo puede acceder a /, /stock, /tareas', () => {
                        const allowed = getRoutesForRole('usuario');
                        expect(allowed).toEqual(expect.arrayContaining(['/', '/stock', '/tareas']));
                        expect(allowed).toHaveLength(3);
                });
        });

        describe('caso especial: admin accede a todo lo configurado', () => {
                it('admin puede acceder a todas las rutas registradas', () => {
                        const allConfiguredPaths = Object.keys(ROUTE_CONFIG);
                        for (const path of allConfiguredPaths) {
                                expect(canAccessRoute('admin', path)).toBe(true);
                        }
                });
        });
});

describe('getRoutesForRole', () => {
        it('retorna array vacio para null', () => {
                expect(getRoutesForRole(null)).toEqual([]);
        });

        it('admin obtiene todas las rutas configuradas', () => {
                const routes = getRoutesForRole('admin');
                expect(routes).toEqual(Object.keys(ROUTE_CONFIG));
        });

        it('deposito obtiene su subset correcto', () => {
                const routes = getRoutesForRole('deposito');
                expect(routes).toContain('/');
                expect(routes).toContain('/deposito');
                expect(routes).toContain('/kardex');
                expect(routes).toContain('/pedidos');
                expect(routes).toContain('/pocket');
                expect(routes).not.toContain('/pos');
                expect(routes).not.toContain('/clientes');
        });

        it('ventas obtiene su subset correcto', () => {
                const routes = getRoutesForRole('ventas');
                expect(routes).toContain('/');
                expect(routes).toContain('/productos');
                expect(routes).toContain('/pedidos');
                expect(routes).toContain('/pos');
                expect(routes).toContain('/clientes');
                expect(routes).not.toContain('/deposito');
                expect(routes).not.toContain('/kardex');
                expect(routes).not.toContain('/pocket');
        });
});

describe('extractUserRole', () => {
        it('retorna usuario para null', () => {
                expect(extractUserRole(null)).toBe('usuario');
        });

        it('retorna usuario si no hay metadata de rol', () => {
                expect(extractUserRole({ user_metadata: {} })).toBe('usuario');
        });

        it('mapea admin y administrador a admin', () => {
                expect(extractUserRole({ user_metadata: { rol: 'admin' } })).toBe('admin');
                expect(extractUserRole({ user_metadata: { rol: 'administrador' } })).toBe('admin');
                expect(extractUserRole({ user_metadata: { rol: 'Admin' } })).toBe('admin');
        });

        it('mapea deposito y variantes a deposito', () => {
                expect(extractUserRole({ user_metadata: { rol: 'deposito' } })).toBe('deposito');
                expect(extractUserRole({ user_metadata: { rol: 'depósito' } })).toBe('deposito');
        });

        it('mapea ventas y vendedor a ventas', () => {
                expect(extractUserRole({ user_metadata: { rol: 'ventas' } })).toBe('ventas');
                expect(extractUserRole({ user_metadata: { rol: 'vendedor' } })).toBe('ventas');
        });

        it('retorna usuario para rol desconocido', () => {
                expect(extractUserRole({ user_metadata: { rol: 'gerente' } })).toBe('usuario');
        });
});

describe('ROUTE_CONFIG completitud', () => {
        it('contiene todas las rutas necesarias del sistema', () => {
                const requiredRoutes = [
                        '/', '/deposito', '/kardex', '/rentabilidad', '/stock',
                        '/tareas', '/productos', '/proveedores', '/pedidos',
                        '/pos', '/pocket', '/clientes',
                ];
                for (const route of requiredRoutes) {
                        expect(ROUTE_CONFIG).toHaveProperty(route);
                }
        });

        it('admin esta en TODAS las rutas', () => {
                for (const [path, roles] of Object.entries(ROUTE_CONFIG)) {
                        expect(roles).toContain('admin');
                }
        });

        it('PUBLIC_ROLES tiene los 4 roles', () => {
                expect(PUBLIC_ROLES).toHaveLength(4);
                expect(PUBLIC_ROLES).toContain('admin');
                expect(PUBLIC_ROLES).toContain('deposito');
                expect(PUBLIC_ROLES).toContain('ventas');
                expect(PUBLIC_ROLES).toContain('usuario');
        });
});
