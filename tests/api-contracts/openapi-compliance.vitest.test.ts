/**
 * API CONTRACT TESTS — OpenAPI ↔ Real Code Consistency
 *
 * Validates that the OpenAPI specs are coherent with the actual code:
 * 1. YAML files exist and have valid structure
 * 2. Every endpoint in code is documented in spec
 * 3. Validators produce shapes matching documented query params
 * 4. Response builders (ok/fail) produce shapes matching documented responses
 *
 * @module tests/api-contracts
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Config
// ============================================================================

const OPENAPI_PROVEEDOR = path.resolve(__dirname, '../../docs/api-proveedor-openapi-3.1.yaml');
const OPENAPI_MAIN = path.resolve(__dirname, '../../docs/api-openapi-3.1.yaml');

const RUN_REAL_TESTS = process.env.RUN_REAL_TESTS === 'true';
const SKIP_REAL = RUN_REAL_TESTS ? it : it.skip;

// ============================================================================
// 1. OpenAPI YAML Files — Static Validation
// ============================================================================

describe('OpenAPI spec files exist and have valid structure', () => {
  it('api-proveedor spec exists and contains required sections', () => {
    expect(fs.existsSync(OPENAPI_PROVEEDOR)).toBe(true);
    const content = fs.readFileSync(OPENAPI_PROVEEDOR, 'utf8');
    expect(content).toContain('openapi:');
    expect(content).toContain('paths:');
    expect(content).toContain('components:');
  });

  it('api-minimarket spec exists and contains required sections', () => {
    expect(fs.existsSync(OPENAPI_MAIN)).toBe(true);
    const content = fs.readFileSync(OPENAPI_MAIN, 'utf8');
    expect(content).toContain('openapi:');
    expect(content).toContain('paths:');
  });

  it('api-proveedor spec is OpenAPI 3.x', () => {
    const content = fs.readFileSync(OPENAPI_PROVEEDOR, 'utf8');
    const match = content.match(/openapi:\s*['"]?([\d.]+)['"]?/);
    expect(match).not.toBeNull();
    expect(parseFloat(match![1])).toBeGreaterThanOrEqual(3.0);
  });

  it('api-proveedor spec defines at least one server', () => {
    const content = fs.readFileSync(OPENAPI_PROVEEDOR, 'utf8');
    expect(content).toContain('servers:');
    expect(content).toMatch(/https?:\/\//);
  });
});

// ============================================================================
// 2. Every code-registered endpoint appears in OpenAPI spec
// ============================================================================

describe('Endpoint registry ↔ OpenAPI spec consistency', () => {
  it('all endpointList entries (except health) are documented in api-proveedor spec', async () => {
    const { endpointList } = await import(
      '../../supabase/functions/api-proveedor/schemas'
    );
    const content = fs.readFileSync(OPENAPI_PROVEEDOR, 'utf8');

    // health endpoint may not be documented in OpenAPI (it's an internal endpoint)
    const documentedEndpoints = endpointList.filter((ep: string) => ep !== 'health');
    for (const ep of documentedEndpoints) {
      expect(
        content.includes(`/${ep}`) || content.includes(ep),
        `Endpoint "${ep}" not found in OpenAPI spec`
      ).toBe(true);
    }
  });

  it('endpointSchemas auth requirements are consistent with spec', async () => {
    const { endpointSchemas, endpointList } = await import(
      '../../supabase/functions/api-proveedor/schemas'
    );
    const content = fs.readFileSync(OPENAPI_PROVEEDOR, 'utf8');

    // All auth-required endpoints should be near a security or Authorization reference
    const authEndpoints = endpointList.filter(
      (ep: string) => endpointSchemas[ep].requiresAuth
    );
    expect(authEndpoints.length).toBeGreaterThan(0);

    // Health should NOT require auth
    expect(endpointSchemas['health'].requiresAuth).toBe(false);

    // Spec should mention security scheme somewhere
    expect(content).toMatch(/security|Authorization|Bearer/i);
  });
});

// ============================================================================
// 3. Validator output shapes match documented query parameters
// ============================================================================

describe('Validators produce shapes consistent with documented params', () => {
  const mkUrl = (path: string, params: Record<string, string> = {}) => {
    const u = new URL(`http://localhost/${path}`);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    return u;
  };

  it('validatePreciosParams keys match spec query params', async () => {
    const { validatePreciosParams } = await import(
      '../../supabase/functions/api-proveedor/validators'
    );
    const content = fs.readFileSync(OPENAPI_PROVEEDOR, 'utf8');

    const result = validatePreciosParams(mkUrl('precios', { categoria: 'bebidas', limit: '25' }));
    // Keys the validator produces
    const keys = Object.keys(result);
    expect(keys).toContain('categoria');
    expect(keys).toContain('limite');
    expect(keys).toContain('offset');
    expect(keys).toContain('activo');
    // The spec should mention these param names
    expect(content).toContain('categoria');
    expect(content).toContain('limit');
  });

  it('validateProductosParams keys match spec query params', async () => {
    const { validateProductosParams } = await import(
      '../../supabase/functions/api-proveedor/validators'
    );
    const content = fs.readFileSync(OPENAPI_PROVEEDOR, 'utf8');

    const result = validateProductosParams(mkUrl('productos'));
    expect(result).toHaveProperty('busqueda');
    expect(result).toHaveProperty('categoria');
    expect(result).toHaveProperty('marca');
    expect(result).toHaveProperty('limite');
    expect(result).toHaveProperty('soloConStock');
    expect(result).toHaveProperty('ordenarPor');

    expect(content).toContain('busqueda');
    expect(content).toContain('marca');
  });

  it('validateComparacionParams includes documented fields', async () => {
    const { validateComparacionParams } = await import(
      '../../supabase/functions/api-proveedor/validators'
    );
    const result = validateComparacionParams(
      mkUrl('comparacion', { solo_oportunidades: 'true', min_diferencia: '5' })
    );
    expect(result).toHaveProperty('soloOportunidades');
    expect(result).toHaveProperty('minDiferencia');
    expect(result).toHaveProperty('limite');
    expect(result).toHaveProperty('orden');
    expect(result).toHaveProperty('incluirAnalisis');
  });

  it('validateAlertasParams includes documented fields', async () => {
    const { validateAlertasParams } = await import(
      '../../supabase/functions/api-proveedor/validators'
    );
    const result = validateAlertasParams(mkUrl('alertas', { severidad: 'critica' }));
    expect(result).toHaveProperty('severidad');
    expect(result).toHaveProperty('tipo');
    expect(result).toHaveProperty('limite');
    expect(result).toHaveProperty('soloNoProcesadas');
    expect(result).toHaveProperty('incluirAnalisis');
  });

  it('validateEstadisticasParams includes documented fields', async () => {
    const { validateEstadisticasParams } = await import(
      '../../supabase/functions/api-proveedor/validators'
    );
    const result = validateEstadisticasParams(mkUrl('estadisticas', { dias: '30' }));
    expect(result).toHaveProperty('dias');
    expect(result).toHaveProperty('categoria');
    expect(result).toHaveProperty('granularidad');
    expect(result).toHaveProperty('incluirPredicciones');
  });
});

// ============================================================================
// 4. Response builders match documented response contracts
// ============================================================================

describe('Response builders (ok/fail) match documented shapes', () => {
  it('ok() produces { success: true, data: ... } as documented', async () => {
    const { ok } = await import('../../supabase/functions/_shared/response');
    const res = ok({ productos: [], paginacion: { total: 0 } });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  it('fail() produces { success: false, error: { code, message } } as documented', async () => {
    const { fail } = await import('../../supabase/functions/_shared/response');
    const res = fail('VALIDATION_ERROR', 'Parámetro inválido', 400);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('Parámetro inválido');
  });

  it('error response shape matches OpenAPI error schema', async () => {
    const { fail } = await import('../../supabase/functions/_shared/response');
    const content = fs.readFileSync(OPENAPI_PROVEEDOR, 'utf8');

    const res = fail('NOT_FOUND', 'Recurso no encontrado', 404);
    const body = await res.json();

    // Spec should document error-related structures
    expect(content).toMatch(/error/i);

    // Response matches that documented structure
    expect(body).toHaveProperty('success', false);
    expect(body).toHaveProperty('error.code', 'NOT_FOUND');
    expect(body).toHaveProperty('error.message', 'Recurso no encontrado');
  });
});

// ============================================================================
// 5. Constants are consistent with spec-documented enums
// ============================================================================

describe('Constants match documented enums in spec', () => {
  it('ALERTA_SEVERIDADES appear in spec', async () => {
    const { ALERTA_SEVERIDADES } = await import(
      '../../supabase/functions/api-proveedor/utils/constants'
    );
    const content = fs.readFileSync(OPENAPI_PROVEEDOR, 'utf8');

    for (const sev of ALERTA_SEVERIDADES) {
      if (sev === 'todos') continue; // wildcard, may not be in spec
      expect(content).toContain(sev);
    }
  });

  it('ALERTA_TIPOS core values appear in spec', async () => {
    const { ALERTA_TIPOS } = await import(
      '../../supabase/functions/api-proveedor/utils/constants'
    );
    const content = fs.readFileSync(OPENAPI_PROVEEDOR, 'utf8');

    // Core types (precio, stock, sistema) should be in spec; 'otros' and 'todos' are wildcards
    const coreTypes = Array.from(ALERTA_TIPOS).filter(
      (t: string) => t !== 'todos' && t !== 'otros'
    );
    for (const tipo of coreTypes) {
      expect(content).toContain(tipo);
    }
  });

  it('ESTADISTICAS_GRANULARIDADES appear in spec', async () => {
    const { ESTADISTICAS_GRANULARIDADES } = await import(
      '../../supabase/functions/api-proveedor/utils/constants'
    );
    const content = fs.readFileSync(OPENAPI_PROVEEDOR, 'utf8');

    for (const gran of ESTADISTICAS_GRANULARIDADES) {
      expect(content).toContain(gran);
    }
  });
});

// ============================================================================
// 6. Real Network Contract Tests (requires credentials)
// ============================================================================

describe('Real contract tests (requires credentials)', () => {
  SKIP_REAL('should validate real /status response matches documented contract', async () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    const origin = process.env.TEST_ORIGIN || 'http://localhost:5173';

    expect(url).toBeDefined();
    expect(key).toBeDefined();

    const response = await fetch(`${url}/functions/v1/api-proveedor/status`, {
      headers: {
        Authorization: `Bearer ${key}`,
        'x-api-secret': process.env.API_PROVEEDOR_SECRET || '',
        origin,
      },
    });

    const data = await response.json();
    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
    expect(data.data.sistema).toBeDefined();
    expect(data.data.estadisticas).toBeDefined();
  });
});
