/**
 * INTEGRATION CONTRACTS - API-Proveedor + Scraper Maxiconsumo
 *
 * Tests que importan y ejecutan código REAL de ambos módulos para validar
 * que la interfaz entre el scraper y la API proveedor es consistente.
 *
 * Cubre:
 * 1. Validators: validación de query params en cada endpoint
 * 2. Schemas: isEndpointName + endpointSchemas coherencia
 * 3. Router: routeRequest dispatch correcto
 * 4. Scraper alertas: buildAlertasDesdeComparaciones pipeline
 * 5. Scraper parsing ↔ API validators: categorías coherentes
 * 6. Shared utils: sanitizeSearchInput edge cases
 *
 * @module tests/contract/api-scraper.integration
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: api-proveedor/validators — parameter extraction & clamping
// ═══════════════════════════════════════════════════════════════════════════

describe('CONTRACT: api-proveedor validators', () => {
  let validatePreciosParams: any;
  let validateProductosParams: any;
  let validateComparacionParams: any;
  let validateSincronizacionParams: any;
  let validateAlertasParams: any;
  let validateEstadisticasParams: any;

  beforeEach(async () => {
    ({
      validatePreciosParams,
      validateProductosParams,
      validateComparacionParams,
      validateSincronizacionParams,
      validateAlertasParams,
      validateEstadisticasParams,
    } = await import('../../supabase/functions/api-proveedor/validators'));
  });

  // Helpers
  const mkUrl = (path: string, params: Record<string, string> = {}) => {
    const u = new URL(`http://localhost/${path}`);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    return u;
  };

  describe('validatePreciosParams', () => {
    it('returns defaults for empty query', () => {
      const p = validatePreciosParams(mkUrl('precios'));
      expect(p.categoria).toBe('todos');
      expect(p.limite).toBe(50);
      expect(p.offset).toBe(0);
      expect(p.activo).toBe('true');
    });

    it('clamps limit to [1, 500]', () => {
      expect(validatePreciosParams(mkUrl('precios', { limit: '0' })).limite).toBe(1);
      expect(validatePreciosParams(mkUrl('precios', { limit: '999' })).limite).toBe(500);
      expect(validatePreciosParams(mkUrl('precios', { limit: 'abc' })).limite).toBe(50);
    });

    it('rejects invalid activo values', () => {
      expect(validatePreciosParams(mkUrl('precios', { activo: 'yes' })).activo).toBe('true');
      expect(validatePreciosParams(mkUrl('precios', { activo: 'false' })).activo).toBe('false');
    });
  });

  describe('validateProductosParams', () => {
    it('returns defaults for empty query', () => {
      const p = validateProductosParams(mkUrl('productos'));
      expect(p.busqueda).toBe('');
      expect(p.categoria).toBe('todos');
      expect(p.marca).toBe('');
      expect(p.limite).toBe(100);
      expect(p.soloConStock).toBe(false);
      expect(p.ordenarPor).toBe('nombre_asc');
    });

    it('clamps limit to [1, 1000]', () => {
      expect(validateProductosParams(mkUrl('productos', { limit: '0' })).limite).toBe(1);
      expect(validateProductosParams(mkUrl('productos', { limit: '5000' })).limite).toBe(1000);
    });

    it('validates ordering field', () => {
      expect(validateProductosParams(mkUrl('productos', { ordenar_por: 'precio_desc' })).ordenarPor).toBe('precio_desc');
      expect(validateProductosParams(mkUrl('productos', { ordenar_por: 'invalid_xyz' })).ordenarPor).toBe('nombre_asc');
    });
  });

  describe('validateComparacionParams', () => {
    it('parses boolean and numeric fields', () => {
      const p = validateComparacionParams(mkUrl('comparacion', { solo_oportunidades: 'true', min_diferencia: '10.5' }));
      expect(p.soloOportunidades).toBe(true);
      expect(p.minDiferencia).toBe(10.5);
    });

    it('defaults orden to diferencia_absoluta_desc', () => {
      const p = validateComparacionParams(mkUrl('comparacion'));
      expect(p.orden).toBe('diferencia_absoluta_desc');
    });

    it('rejects invalid ordering', () => {
      const p = validateComparacionParams(mkUrl('comparacion', { orden: 'not_valid' }));
      expect(p.orden).toBe('diferencia_absoluta_desc');
    });
  });

  describe('validateSincronizacionParams', () => {
    it('defaults to normal priority', () => {
      const p = validateSincronizacionParams(mkUrl('sincronizar'));
      expect(p.categoria).toBe('todos');
      expect(p.forceFull).toBe(false);
      expect(p.priority).toBe('normal');
    });

    it('accepts valid priority values', () => {
      expect(validateSincronizacionParams(mkUrl('sincronizar', { priority: 'alta' })).priority).toBe('alta');
      expect(validateSincronizacionParams(mkUrl('sincronizar', { priority: 'baja' })).priority).toBe('baja');
    });

    it('rejects invalid priority', () => {
      expect(validateSincronizacionParams(mkUrl('sincronizar', { priority: 'urgente' })).priority).toBe('normal');
    });
  });

  describe('validateAlertasParams', () => {
    it('defaults with soloNoProcesadas = true', () => {
      const p = validateAlertasParams(mkUrl('alertas'));
      expect(p.severidad).toBe('todos');
      expect(p.tipo).toBe('todos');
      expect(p.limite).toBe(20);
      expect(p.soloNoProcesadas).toBe(true);
    });

    it('limits range to [1, 100]', () => {
      expect(validateAlertasParams(mkUrl('alertas', { limit: '0' })).limite).toBe(1);
      expect(validateAlertasParams(mkUrl('alertas', { limit: '500' })).limite).toBe(100);
    });

    it('validates severidad values', () => {
      expect(validateAlertasParams(mkUrl('alertas', { severidad: 'critica' })).severidad).toBe('critica');
      expect(validateAlertasParams(mkUrl('alertas', { severidad: 'nope' })).severidad).toBe('todos');
    });

    it('validates tipo values', () => {
      expect(validateAlertasParams(mkUrl('alertas', { tipo: 'precio' })).tipo).toBe('precio');
      expect(validateAlertasParams(mkUrl('alertas', { tipo: 'unknown' })).tipo).toBe('todos');
    });
  });

  describe('validateEstadisticasParams', () => {
    it('clamps dias to [1, 90]', () => {
      expect(validateEstadisticasParams(mkUrl('estadisticas', { dias: '0' })).dias).toBe(1);
      expect(validateEstadisticasParams(mkUrl('estadisticas', { dias: '200' })).dias).toBe(90);
      expect(validateEstadisticasParams(mkUrl('estadisticas')).dias).toBe(7);
    });

    it('validates granularidad', () => {
      expect(validateEstadisticasParams(mkUrl('estadisticas', { granularidad: 'semana' })).granularidad).toBe('semana');
      expect(validateEstadisticasParams(mkUrl('estadisticas', { granularidad: 'year' })).granularidad).toBe('dia');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: api-proveedor/schemas — endpoint registry integrity
// ═══════════════════════════════════════════════════════════════════════════

describe('CONTRACT: api-proveedor schemas', () => {
  let isEndpointName: (v: string) => boolean;
  let endpointList: string[];
  let endpointSchemas: Record<string, { description: string; requiresAuth: boolean }>;

  beforeEach(async () => {
    ({ isEndpointName, endpointList, endpointSchemas } = await import(
      '../../supabase/functions/api-proveedor/schemas'
    ));
  });

  it('endpointList contains all 9 endpoints', () => {
    const expected = ['precios', 'productos', 'comparacion', 'sincronizar', 'status', 'alertas', 'estadisticas', 'configuracion', 'health'];
    expect(endpointList).toEqual(expect.arrayContaining(expected));
    expect(endpointList.length).toBe(9);
  });

  it('isEndpointName returns true for valid, false for invalid', () => {
    expect(isEndpointName('precios')).toBe(true);
    expect(isEndpointName('health')).toBe(true);
    expect(isEndpointName('nonexistent')).toBe(false);
    expect(isEndpointName('')).toBe(false);
  });

  it('every endpoint in list has a schema entry', () => {
    for (const ep of endpointList) {
      expect(endpointSchemas[ep]).toBeDefined();
      expect(endpointSchemas[ep].description).toBeTruthy();
      expect(typeof endpointSchemas[ep].requiresAuth).toBe('boolean');
    }
  });

  it('health is the only endpoint not requiring auth', () => {
    const noAuth = endpointList.filter(ep => !endpointSchemas[ep].requiresAuth);
    expect(noAuth).toEqual(['health']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: api-proveedor/router — dispatch logic
// ═══════════════════════════════════════════════════════════════════════════

describe('CONTRACT: api-proveedor router', () => {
  let routeRequest: any;

  beforeEach(async () => {
    ({ routeRequest } = await import('../../supabase/functions/api-proveedor/router'));
  });

  it('dispatches to correct handler', async () => {
    const mockContext = {} as any;
    const handlerResult = new Response('ok', { status: 200 });
    const handlers: any = {
      health: async () => handlerResult,
      precios: async () => new Response('precios', { status: 200 }),
      productos: async () => new Response('productos'),
      comparacion: async () => new Response('comparacion'),
      sincronizar: async () => new Response('sincronizar'),
      status: async () => new Response('status'),
      alertas: async () => new Response('alertas'),
      estadisticas: async () => new Response('estadisticas'),
      configuracion: async () => new Response('configuracion'),
    };

    const res = await routeRequest('health', mockContext, handlers);
    expect(res).toBe(handlerResult);
  });

  it('throws for unsupported endpoint', async () => {
    const handlers = {} as any;
    await expect(
      routeRequest('nonexistent' as any, {} as any, handlers)
    ).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: scraper-maxiconsumo/alertas — alerta pipeline
// ═══════════════════════════════════════════════════════════════════════════

describe('CONTRACT: scraper alertas pipeline', () => {
  let buildAlertasDesdeComparaciones: any;

  beforeEach(async () => {
    ({ buildAlertasDesdeComparaciones } = await import(
      '../../supabase/functions/scraper-maxiconsumo/alertas'
    ));
  });

  it('builds alerts from valid comparisons', () => {
    const comparaciones = [
      {
        producto_id: 'p1',
        nombre_producto: 'Coca Cola 500ml',
        precio_actual: 280,
        precio_proveedor: 220,
        diferencia_absoluta: 60,
        diferencia_porcentual: 27.27,
      },
      {
        producto_id: 'p2',
        nombre_producto: 'Pepsi 2L',
        precio_actual: 400,
        precio_proveedor: 420,
        diferencia_absoluta: 20,
        diferencia_porcentual: 5,
      },
    ];

    const alertas = buildAlertasDesdeComparaciones(comparaciones, new Set());

    expect(alertas).toHaveLength(2);
    // p1: 27.27% → critica, direction > 0 (280-220) → disminucion
    expect(alertas[0].severidad).toBe('critica');
    expect(alertas[0].tipo_cambio).toBe('disminucion');
    // p2: 5% → media, direction < 0 (400-420) → aumento
    expect(alertas[1].severidad).toBe('media');
    expect(alertas[1].tipo_cambio).toBe('aumento');
  });

  it('skips products already in existingIds', () => {
    const comparaciones = [
      { producto_id: 'p1', nombre_producto: 'Test', precio_actual: 100, precio_proveedor: 50, diferencia_porcentual: 50 },
    ];
    const alertas = buildAlertasDesdeComparaciones(comparaciones, new Set(['p1']));
    expect(alertas).toHaveLength(0);
  });

  it('skips comparisons with missing data', () => {
    const comparaciones = [
      { producto_id: '', nombre_producto: '', precio_actual: 0, precio_proveedor: 0, diferencia_porcentual: 0 },
      { producto_id: 'p1', nombre_producto: '', precio_actual: 100, precio_proveedor: 50, diferencia_porcentual: 50 },
    ];
    const alertas = buildAlertasDesdeComparaciones(comparaciones, new Set());
    expect(alertas).toHaveLength(0);
  });

  it('assigns correct severity by percentage thresholds', () => {
    const makeComp = (id: string, pct: number) => ({
      producto_id: id,
      nombre_producto: `Prod ${id}`,
      precio_actual: 200,
      precio_proveedor: 100,
      diferencia_porcentual: pct,
    });
    const comparaciones = [
      makeComp('a', 3),   // baja (< 5)
      makeComp('b', 8),   // media (5-14)
      makeComp('c', 18),  // alta (15-24)
      makeComp('d', 30),  // critica (>= 25)
    ];
    const alertas = buildAlertasDesdeComparaciones(comparaciones, new Set());
    expect(alertas.map((a: any) => a.severidad)).toEqual(['baja', 'media', 'alta', 'critica']);
  });

  it('each alert has required output fields', () => {
    const comparaciones = [
      { producto_id: 'p1', nombre_producto: 'Test', precio_actual: 300, precio_proveedor: 200, diferencia_porcentual: 33 },
    ];
    const [alerta] = buildAlertasDesdeComparaciones(comparaciones, new Set());
    expect(alerta).toHaveProperty('producto_id');
    expect(alerta).toHaveProperty('nombre_producto');
    expect(alerta).toHaveProperty('tipo_cambio');
    expect(alerta).toHaveProperty('valor_anterior');
    expect(alerta).toHaveProperty('valor_nuevo');
    expect(alerta).toHaveProperty('porcentaje_cambio');
    expect(alerta).toHaveProperty('severidad');
    expect(alerta).toHaveProperty('mensaje');
    expect(alerta).toHaveProperty('accion_recomendada');
    expect(alerta).toHaveProperty('fecha_alerta');
    // fecha_alerta should be ISO
    expect(new Date(alerta.fecha_alerta).toISOString()).toBe(alerta.fecha_alerta);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: Cross-module coherence (scraper parsing ↔ API validators)
// ═══════════════════════════════════════════════════════════════════════════

describe('CONTRACT: Cross-module coherence', () => {
  let generarSKU: any;
  let sanitizeProductName: any;
  let sanitizeSearchInput: any;

  beforeEach(async () => {
    ({ generarSKU, sanitizeProductName } = await import(
      '../../supabase/functions/scraper-maxiconsumo/parsing'
    ));
    ({ sanitizeSearchInput } = await import(
      '../../supabase/functions/api-proveedor/utils/params'
    ));
  });

  it('sanitizeSearchInput strips XSS but keeps product names searchable', () => {
    expect(sanitizeSearchInput('Coca Cola 500ml')).toBe('Coca Cola 500ml');
    expect(sanitizeSearchInput('<script>alert(1)</script>')).toBe('alert(1)');
    expect(sanitizeSearchInput("O'Brien")).toBe('OBrien');
  });

  it('sanitizeSearchInput truncates to 100 chars', () => {
    const long = 'a'.repeat(200);
    expect(sanitizeSearchInput(long).length).toBe(100);
  });

  it('sanitizeSearchInput handles null/undefined safely', () => {
    expect(sanitizeSearchInput('')).toBe('');
    expect(sanitizeSearchInput(null as any)).toBe('');
    expect(sanitizeSearchInput(undefined as any)).toBe('');
  });

  it('scraper SKU generation produces searchable strings', () => {
    const nombre = sanitizeProductName('Coca Cola Zero');
    const sku = generarSKU(nombre, 'Bebidas');
    // SKU should be a non-empty string safe for DB search
    expect(typeof sku).toBe('string');
    expect(sku.length).toBeGreaterThan(0);
    // SKU should not contain characters that sanitizeSearchInput would strip
    expect(sanitizeSearchInput(sku)).toBe(sku);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: Constants contract — lists are non-empty and valid
// ═══════════════════════════════════════════════════════════════════════════

describe('CONTRACT: Constants registry coherence', () => {
  let PRODUCT_ORDER_FIELDS: readonly string[];
  let COMPARACION_ORDER_FIELDS: readonly string[];
  let SINCRONIZACION_PRIORIDADES: readonly string[];
  let ALERTA_SEVERIDADES: readonly string[];
  let ALERTA_TIPOS: readonly string[];
  let ESTADISTICAS_GRANULARIDADES: readonly string[];

  beforeEach(async () => {
    ({
      PRODUCT_ORDER_FIELDS,
      COMPARACION_ORDER_FIELDS,
      SINCRONIZACION_PRIORIDADES,
      ALERTA_SEVERIDADES,
      ALERTA_TIPOS,
      ESTADISTICAS_GRANULARIDADES,
    } = await import('../../supabase/functions/api-proveedor/utils/constants'));
  });

  it('every constant list is non-empty', () => {
    expect(PRODUCT_ORDER_FIELDS.length).toBeGreaterThan(0);
    expect(COMPARACION_ORDER_FIELDS.length).toBeGreaterThan(0);
    expect(SINCRONIZACION_PRIORIDADES.length).toBeGreaterThan(0);
    expect(ALERTA_SEVERIDADES.length).toBeGreaterThan(0);
    expect(ALERTA_TIPOS.length).toBeGreaterThan(0);
    expect(ESTADISTICAS_GRANULARIDADES.length).toBeGreaterThan(0);
  });

  it('severidades includes "todos" wildcard', () => {
    expect(ALERTA_SEVERIDADES).toContain('todos');
  });

  it('tipos includes "todos" wildcard', () => {
    expect(ALERTA_TIPOS).toContain('todos');
  });

  it('prioridades includes normal as default', () => {
    expect(SINCRONIZACION_PRIORIDADES).toContain('normal');
  });

  it('granularidades includes dia as default', () => {
    expect(ESTADISTICAS_GRANULARIDADES).toContain('dia');
  });
});
