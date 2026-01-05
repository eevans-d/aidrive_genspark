/**
 * Unit tests for api-proveedor routing, schemas, and validators.
 */

import { describe, it, expect } from 'vitest';

// =========== schemas.ts ===========

const endpointList = [
    'precios',
    'productos',
    'comparacion',
    'sincronizar',
    'status',
    'alertas',
    'estadisticas',
    'configuracion',
    'health'
] as const;
type EndpointName = (typeof endpointList)[number];

function isEndpointName(value: string): value is EndpointName {
    return (endpointList as readonly string[]).includes(value);
}

const endpointSchemas: Record<EndpointName, { description: string; requiresAuth: boolean }> = {
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
        expect(endpointSchemas.precios.requiresAuth).toBe(false);
    });
});

// =========== validators.ts (inlined logic) ===========

function sanitizeSearchInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input.replace(/[<>"'`;]/g, '').substring(0, 200).trim();
}

function validatePreciosParams(url: URL) {
    const categoria = url.searchParams.get('categoria') || 'todos';
    const limite = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 500);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0);
    const activo = url.searchParams.get('activo') || 'true';
    return { categoria, limite, offset, activo };
}

function validateProductosParams(url: URL) {
    const busqueda = sanitizeSearchInput(url.searchParams.get('busqueda') || '');
    const categoria = sanitizeSearchInput(url.searchParams.get('categoria') || 'todos');
    const marca = sanitizeSearchInput(url.searchParams.get('marca') || '');
    const limite = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 1000);
    const soloConStock = url.searchParams.get('solo_con_stock') === 'true';
    const ordenarPor = url.searchParams.get('ordenar_por') || 'nombre_asc';
    return { busqueda, categoria, marca, limite, soloConStock, ordenarPor };
}

function validateComparacionParams(url: URL) {
    const soloOportunidades = url.searchParams.get('solo_oportunidades') === 'true';
    const minDiferencia = Math.max(parseFloat(url.searchParams.get('min_diferencia') || '0') || 0, 0);
    const limite = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 500);
    const orden = url.searchParams.get('orden') || 'diferencia_absoluta_desc';
    const incluirAnalisis = url.searchParams.get('incluir_analisis') === 'true';
    return { soloOportunidades, minDiferencia, limite, orden, incluirAnalisis };
}

function validateAlertasParams(url: URL) {
    const severidad = url.searchParams.get('severidad') || 'todos';
    const tipo = url.searchParams.get('tipo') || 'todos';
    const limite = Math.min(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 100);
    const soloNoProcesadas = url.searchParams.get('solo_no_procesadas') !== 'false';
    const incluirAnalisis = url.searchParams.get('incluir_analisis') === 'true';
    return { severidad, tipo, limite, soloNoProcesadas, incluirAnalisis };
}

function validateEstadisticasParams(url: URL) {
    const diasRaw = parseInt(url.searchParams.get('dias') || '7', 10);
    const dias = Math.min(Math.max(Number.isNaN(diasRaw) ? 7 : diasRaw, 1), 90);
    const categoria = sanitizeSearchInput(url.searchParams.get('categoria') || '');
    const granularidad = url.searchParams.get('granularidad') || 'dia';
    const incluirPredicciones = url.searchParams.get('incluir_predicciones') === 'true';
    return { dias, categoria, granularidad, incluirPredicciones };
}

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
            expect(validateProductosParams(url).busqueda).not.toContain('<');
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

// =========== router logic (inline) ===========

type EndpointContext = {
    supabaseUrl: string;
    serviceRoleKey: string;
    url: URL;
    corsHeaders: Record<string, string>;
    isAuthenticated: boolean;
    requestLog: Record<string, unknown>;
    method: string;
};
type EndpointHandler = (ctx: EndpointContext) => Promise<Response>;
type EndpointHandlerMap = Record<EndpointName, EndpointHandler>;

async function routeRequest(
    endpoint: EndpointName,
    context: EndpointContext,
    handlers: EndpointHandlerMap
): Promise<Response> {
    const handler = handlers[endpoint];
    if (!handler) {
        throw new Error(`Endpoint no soportado: ${endpoint}`);
    }
    return handler(context);
}

describe('router', () => {
    const dummyContext: EndpointContext = {
        supabaseUrl: 'http://mock',
        serviceRoleKey: 'key',
        url: new URL('http://x.com/precios'),
        corsHeaders: {},
        isAuthenticated: false,
        requestLog: {},
        method: 'GET'
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
