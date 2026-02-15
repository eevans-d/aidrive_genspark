import { describe, it, expect } from 'vitest';

if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: () => undefined } };
}

import { requireServiceRoleAuth } from '../../supabase/functions/_shared/internal-auth.ts';
import { validateOrigin, parseAllowedOrigins, createCorsErrorResponse } from '../../supabase/functions/_shared/cors.ts';
import {
  validatePreciosParams,
  validateProductosParams,
  validateComparacionParams,
  validateSincronizacionParams,
} from '../../supabase/functions/api-proveedor/validators.ts';

const RUN_REAL_TESTS = process.env.RUN_REAL_TESTS === 'true';
const CRON_ENDPOINTS = [
  'cron-dashboard/dashboard',
  'cron-health-monitor/status',
  'cron-jobs-maxiconsumo/status',
  'cron-notifications/channels',
] as const;

describe('Security contracts (real helpers)', () => {
  describe('Internal auth guard (cron sensibles)', () => {
    it('devuelve 401 sin credenciales para todos los endpoints críticos', async () => {
      for (const endpoint of CRON_ENDPOINTS) {
        const req = new Request(`https://example.test/functions/v1/${endpoint}`, {
          method: 'GET',
        });

        const result = requireServiceRoleAuth(req, 'srv-test-key', {
          'Content-Type': 'application/json',
        }, 'req-unauth');

        expect(result.authorized).toBe(false);
        expect(result.errorResponse).toBeDefined();
        expect(result.errorResponse?.status).toBe(401);
      }
    });

    it('permite 200 lógico con Authorization Bearer para todos los endpoints críticos', () => {
      for (const endpoint of CRON_ENDPOINTS) {
        const req = new Request(`https://example.test/functions/v1/${endpoint}`, {
          method: 'GET',
          headers: {
            Authorization: 'Bearer srv-test-key',
          },
        });

        const result = requireServiceRoleAuth(req, 'srv-test-key', {}, 'req-auth');
        expect(result.authorized).toBe(true);
      }
    });

    it('acepta apikey para llamadas internas service-to-service', () => {
      for (const endpoint of CRON_ENDPOINTS) {
        const req = new Request(`https://example.test/functions/v1/${endpoint}`, {
          method: 'GET',
          headers: {
            apikey: 'srv-test-key',
          },
        });

        const result = requireServiceRoleAuth(req, 'srv-test-key', {}, 'req-apikey');
        expect(result.authorized).toBe(true);
      }
    });

    it('rechaza Bearer malformado y claves rotadas/inválidas', async () => {
      const malformedBearer = new Request('https://example.test/functions/v1/cron-dashboard/dashboard', {
        method: 'GET',
        headers: {
          Authorization: 'Token srv-test-key',
        },
      });

      const staleKey = new Request('https://example.test/functions/v1/cron-dashboard/dashboard', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer srv-old-key',
          apikey: 'srv-old-key',
        },
      });

      const malformedResult = requireServiceRoleAuth(malformedBearer, 'srv-test-key', {}, 'req-malformed');
      const staleResult = requireServiceRoleAuth(staleKey, 'srv-test-key', {}, 'req-stale');

      expect(malformedResult.authorized).toBe(false);
      expect(staleResult.authorized).toBe(false);
      expect(malformedResult.errorResponse?.status).toBe(401);
      expect(staleResult.errorResponse?.status).toBe(401);

      const malformedBody = await malformedResult.errorResponse?.json();
      expect(malformedBody?.error?.code).toBe('UNAUTHORIZED');
    });
  });

  describe('CORS real (allowlist)', () => {
    it('bloquea origen no permitido con respuesta CORS estándar', async () => {
      const req = new Request('https://example.test/functions/v1/api-proveedor/precios', {
        headers: { origin: 'https://evil.example' },
      });

      const cors = validateOrigin(req, parseAllowedOrigins('https://app.minimarket.local'));
      expect(cors.allowed).toBe(false);
      expect(cors.headers['Access-Control-Allow-Origin']).toBe('null');

      const response = createCorsErrorResponse('req-cors', cors.headers);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('CORS_ORIGIN_NOT_ALLOWED');
    });

    it('permite origen configurado en allowlist', () => {
      const req = new Request('https://example.test/functions/v1/api-proveedor/precios', {
        headers: { origin: 'https://app.minimarket.local' },
      });

      const cors = validateOrigin(req, parseAllowedOrigins('https://app.minimarket.local'));
      expect(cors.allowed).toBe(true);
      expect(cors.headers['Access-Control-Allow-Origin']).toBe('https://app.minimarket.local');
    });

    it('permite requests sin Origin (server-to-server) y aplica fallback seguro', () => {
      const req = new Request('https://example.test/functions/v1/api-proveedor/precios');
      const cors = validateOrigin(req, parseAllowedOrigins('https://app.minimarket.local'));

      expect(cors.allowed).toBe(true);
      expect(cors.origin).toBeNull();
      expect(cors.headers['Access-Control-Allow-Origin']).toBe('https://app.minimarket.local');
      expect(cors.headers['Vary']).toBe('Origin');
    });
  });

  describe('Input abuse real (validators)', () => {
    it('neutraliza payloads de SQLi/XSS en parámetros de búsqueda', () => {
      const precios = validatePreciosParams(new URL('https://x.test?categoria=%27%20UNION%20SELECT%20*%20FROM%20usuarios--'));
      const productos = validateProductosParams(new URL('https://x.test?busqueda=%3Cscript%3Ealert(1)%3C%2Fscript%3E&limit=9999999'));

      expect(precios.categoria).not.toContain("'");
      expect(precios.categoria.length).toBeLessThanOrEqual(100);
      expect(productos.busqueda).not.toContain('<script>');
      expect(productos.limite).toBe(1000);
    });

    it('acota parámetros numéricos y enums a rangos seguros', () => {
      const comparacion = validateComparacionParams(new URL('https://x.test?min_diferencia=-100&limit=99999&orden=hacked'));
      const sync = validateSincronizacionParams(new URL('https://x.test?priority=invalid-force&categoria=%3Cimg%20onerror%3Dalert(1)%3E'));

      expect(comparacion.minDiferencia).toBe(0);
      expect(comparacion.limite).toBe(500);
      expect(comparacion.orden).toBe('diferencia_absoluta_desc');
      expect(sync.priority).toBe('normal');
      expect(sync.categoria).not.toContain('<img');
    });
  });
});

describe('Security smoke real (opcional con credenciales)', () => {
  const maybeRun = RUN_REAL_TESTS ? it : it.skip;

  maybeRun('verifica 401 reales sin auth en endpoints críticos', async () => {
    const baseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!baseUrl || !serviceRoleKey) {
      throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para RUN_REAL_TESTS=true');
    }

    for (const endpoint of CRON_ENDPOINTS) {
      const unauthorized = await fetch(`${baseUrl}/functions/v1/${endpoint}`);
      expect(unauthorized.status).toBe(401);
    }
  });

  maybeRun('verifica auth real service-role en endpoints críticos', async () => {
    const baseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!baseUrl || !serviceRoleKey) {
      throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para RUN_REAL_TESTS=true');
    }

    for (const endpoint of CRON_ENDPOINTS) {
      const authorized = await fetch(`${baseUrl}/functions/v1/${endpoint}`, {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      });

      // El contrato principal de seguridad es auth: no debe caer en UNAUTHORIZED/FORBIDDEN.
      expect(authorized.status).not.toBe(401);
      expect(authorized.status).not.toBe(403);
      // Si auth pasa, un 5xx sigue siendo incidente real que debemos detectar.
      expect(authorized.status).toBeLessThan(500);
    }
  });
});
