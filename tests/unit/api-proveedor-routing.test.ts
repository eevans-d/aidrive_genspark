/**
 * Unit tests for api-proveedor routing, schemas, and validators.
 */

import { describe, it, expect } from 'vitest';
import {
    endpointList,
    isEndpointName,
    endpointSchemas
} from '../../supabase/functions/api-proveedor/schemas.ts';
import {
    validatePreciosParams,
    validateProductosParams,
    validateComparacionParams,
    validateAlertasParams,
    validateEstadisticasParams
} from '../../supabase/functions/api-proveedor/validators.ts';
import type { EndpointContext, EndpointHandlerMap } from '../../supabase/functions/api-proveedor/router.ts';
import { routeRequest } from '../../supabase/functions/api-proveedor/router.ts';

describe('schemas', () => {
    it('isEndpointName returns true for valid endpoints', () => {
        for (const ep of endpointList) {
            expect(isEndpointName(ep)).toBe(true);
        }
    });

    it('isEndpointName returns false for invalid endpoints', () => {
        expect(isEndpointName('foo')).toBe(false);
        expect(isEndpointName('')).toBe(false);
        expect(isEndpointName('PRECIOS')).toBe(false);
    });

    it('endpointSchemas has requiresAuth flag', () => {
        expect(endpointSchemas.sincronizar.requiresAuth).toBe(true);
        expect(endpointSchemas.configuracion.requiresAuth).toBe(true);
        expect(endpointSchemas.precios.requiresAuth).toBe(true);
    });
});

describe('validators', () => {
    describe('validatePreciosParams', () => {
        it('returns defaults when no params', () => {
            const url = new URL('http://x.com/precios');
            const p = validatePreciosParams(url);
            expect(p.categoria).toBe('todos');
            expect(p.limite).toBe(50);
            expect(p.offset).toBe(0);
            expect(p.activo).toBe('true');
        });

        it('caps limite at 500', () => {
            const url = new URL('http://x.com/precios?limit=9999');
            expect(validatePreciosParams(url).limite).toBe(500);
        });

        it('uses provided categoria', () => {
            const url = new URL('http://x.com/precios?categoria=bebidas');
            expect(validatePreciosParams(url).categoria).toBe('bebidas');
        });
    });

    describe('validateProductosParams', () => {
        it('sanitizes busqueda', () => {
            const url = new URL('http://x.com/productos?busqueda=<script>alert(1)</script>');
            const busqueda = validateProductosParams(url).busqueda;
            expect(busqueda).not.toContain('<');
            expect(busqueda).not.toContain('>');
            expect(busqueda).not.toContain('&');
        });

        it('caps limite at 1000', () => {
            const url = new URL('http://x.com/productos?limit=5000');
            expect(validateProductosParams(url).limite).toBe(1000);
        });

        it('parses soloConStock', () => {
            const url = new URL('http://x.com/productos?solo_con_stock=true');
            expect(validateProductosParams(url).soloConStock).toBe(true);
        });
    });

    describe('validateComparacionParams', () => {
        it('defaults incluirAnalisis to false', () => {
            const url = new URL('http://x.com/comparacion');
            expect(validateComparacionParams(url).incluirAnalisis).toBe(false);
        });

        it('parses minDiferencia', () => {
            const url = new URL('http://x.com/comparacion?min_diferencia=5.5');
            expect(validateComparacionParams(url).minDiferencia).toBe(5.5);
        });
    });

    describe('validateAlertasParams', () => {
        it('caps limite at 100', () => {
            const url = new URL('http://x.com/alertas?limit=999');
            expect(validateAlertasParams(url).limite).toBe(100);
        });

        it('parses soloNoProcesadas default true', () => {
            const url = new URL('http://x.com/alertas');
            expect(validateAlertasParams(url).soloNoProcesadas).toBe(true);
        });
    });

    describe('validateEstadisticasParams', () => {
        it('clamps dias between 1 and 90', () => {
            expect(validateEstadisticasParams(new URL('http://x.com/estadisticas?dias=0')).dias).toBe(1);
            expect(validateEstadisticasParams(new URL('http://x.com/estadisticas?dias=200')).dias).toBe(90);
        });

        it('defaults granularidad to dia', () => {
            const url = new URL('http://x.com/estadisticas');
            expect(validateEstadisticasParams(url).granularidad).toBe('dia');
        });
    });
});

describe('router', () => {
    const dummyContext: EndpointContext = {
        supabaseUrl: 'http://mock',
        supabaseAnonKey: 'anon-key',
        serviceRoleKey: 'key',
        supabaseReadHeaders: { apikey: 'anon-key', Authorization: 'Bearer anon-key' },
        apiSecret: 'secret',
        url: new URL('http://x.com/precios'),
        corsHeaders: {},
        isAuthenticated: false,
        requestLog: {},
        method: 'GET',
        request: new Request('http://x.com/precios')
    };

    it('routes to correct handler', async () => {
        const handlers: EndpointHandlerMap = {
            precios: async () => new Response('precios'),
            productos: async () => new Response('productos'),
            comparacion: async () => new Response('comparacion'),
            sincronizar: async () => new Response('sincronizar'),
            status: async () => new Response('status'),
            alertas: async () => new Response('alertas'),
            estadisticas: async () => new Response('estadisticas'),
            configuracion: async () => new Response('configuracion'),
            health: async () => new Response('health')
        };

        const res = await routeRequest('precios', dummyContext, handlers);
        expect(await res.text()).toBe('precios');
    });

    it('throws for unknown endpoint cast', async () => {
        const handlers = {} as EndpointHandlerMap;
        await expect(routeRequest('precios', dummyContext, handlers)).rejects.toThrow('Endpoint no soportado');
    });
});
