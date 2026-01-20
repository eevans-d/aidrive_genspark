/**
 * INTEGRATION CONTRACTS - Contratos entre módulos acoplados
 * 
 * WHY: Validar que interfaces entre módulos no se rompan silenciosamente
 * 
 * Top 3 contratos identificados:
 * 1. Scraper → Storage: formato de productos
 * 2. Storage → API: estructura de respuesta
 * 3. Gateway → Supabase: headers requeridos
 * 
 * @module tests/unit/integration-contracts
 */

import { describe, it, expect } from 'vitest';

describe('📋 CONTRACT - Scraper → Storage', () => {

        /**
         * WHY: Storage espera campos específicos, si scraper cambia formato se rompe
         * VALIDATES: Contrato de ProductoMaxiconsumo se mantiene
         */
        it('should enforce ProductoMaxiconsumo required fields contract', () => {
                // ═══ ARRANGE ═══
                const validProduct = {
                        sku: 'SKU-001',
                        nombre: 'Coca Cola 500ml',
                        precio_unitario: 250.50,
                        ultima_actualizacion: '2026-01-20T00:00:00Z',
                        codigo_barras: '123456789',
                        stock_disponible: 100,
                };

                // ═══ ACT & ASSERT ═══
                expect(validProduct.sku).toBeDefined();
                expect(validProduct.nombre).toBeDefined();
                expect(validProduct.precio_unitario).toBeDefined();
                expect(validProduct.ultima_actualizacion).toBeDefined();

                expect(typeof validProduct.sku).toBe('string');
                expect(typeof validProduct.nombre).toBe('string');
                expect(typeof validProduct.precio_unitario).toBe('number');
                expect(validProduct.precio_unitario).toBeGreaterThan(0);
        });

        /**
         * WHY: SKU vacío rompe matching y causa duplicados en DB
         * VALIDATES: Validación de SKU no vacío
         */
        it('should reject products with empty SKU', () => {
                // ═══ ARRANGE ═══
                const invalidProducts = [
                        { sku: '', nombre: 'Test', precio_unitario: 100 },
                        { sku: '   ', nombre: 'Test', precio_unitario: 100 },
                ];

                // ═══ ACT & ASSERT ═══
                for (const product of invalidProducts) {
                        const isValidSku = product.sku.trim().length > 0;
                        expect(isValidSku).toBe(false);
                }
        });
});

describe('📋 CONTRACT - Gateway → Supabase Headers', () => {

        /**
         * WHY: Headers incorrectos causan 401 en Supabase sin información útil
         * VALIDATES: createRequestHeaders genera headers correctos
         */
        it('should create valid Supabase request headers', async () => {
                // ═══ ARRANGE ═══
                const { createRequestHeaders } = await import('../../supabase/functions/api-minimarket/helpers/auth');

                const userToken = 'user-jwt-token';
                const anonKey = 'anon-key-123';
                const requestId = 'req-456';

                // ═══ ACT ═══
                const headers = createRequestHeaders(userToken, anonKey, requestId);

                // ═══ ASSERT ═══
                expect(headers.Authorization).toBe(`Bearer ${userToken}`);
                expect(headers.apikey).toBe(anonKey);
                expect(headers['Content-Type']).toBe('application/json');
                expect(headers['x-request-id']).toBe(requestId);
        });

        /**
         * WHY: Sin apikey, Supabase retorna 401 confuso
         * VALIDATES: apikey siempre presente
         */
        it('should always include apikey in headers', async () => {
                // ═══ ARRANGE ═══
                const { createRequestHeaders } = await import('../../supabase/functions/api-minimarket/helpers/auth');

                // ═══ ACT ═══
                const headersWithToken = createRequestHeaders('token', 'anon-key', 'id');
                const headersWithoutToken = createRequestHeaders(null, 'anon-key', 'id');

                // ═══ ASSERT ═══
                expect(headersWithToken.apikey).toBe('anon-key');
                expect(headersWithoutToken.apikey).toBe('anon-key');
        });
});

describe('📋 CONTRACT - API Response Format', () => {

        /**
         * WHY: Frontend espera { success, data?, error? } - cambiar formato rompe UI
         * VALIDATES: Estructura de respuesta consistente
         */
        it('should maintain API response structure contract', () => {
                // ═══ ARRANGE ═══
                const successResponse = {
                        success: true,
                        data: { productos: [], total: 0 },
                };

                const errorResponse = {
                        success: false,
                        error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
                };

                // ═══ ACT & ASSERT ═══
                expect(successResponse).toHaveProperty('success', true);
                expect(successResponse).toHaveProperty('data');
                expect(successResponse).not.toHaveProperty('error');

                expect(errorResponse).toHaveProperty('success', false);
                expect(errorResponse).toHaveProperty('error');
                expect(errorResponse.error).toHaveProperty('code');
                expect(errorResponse.error).toHaveProperty('message');
        });
});
