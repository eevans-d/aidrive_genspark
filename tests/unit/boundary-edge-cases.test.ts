/**
 * BOUNDARY & EDGE CASES - Límites e invariantes de lógica de negocio
 * 
 * WHY: Prevenir bugs en casos límite que suelen escapar a testing normal
 * 
 * @module tests/unit/boundary-edge-cases
 */

import { describe, it, expect } from 'vitest';

describe('📐 BOUNDARY - Pagination Limits', () => {

        /**
         * WHY: Limit muy alto podría causar OOM o timeout en DB
         * VALIDATES: parsePagination aplica cap a maxLimit
         */
        it('should cap limit at maximum allowed value', async () => {
                // ═══ ARRANGE ═══
                const { parsePagination } = await import('../../supabase/functions/api-minimarket/helpers/pagination');
                const MAX_LIMIT = 100;
                const DEFAULT_LIMIT = 50;

                // ═══ ACT ═══
                const resultOverMax = parsePagination('500', '0', DEFAULT_LIMIT, MAX_LIMIT);

                // ═══ ASSERT ═══
                if (resultOverMax.ok) {
                        expect(resultOverMax.params.limit).toBe(MAX_LIMIT);
                }
        });

        /**
         * WHY: Offset negativo podría causar comportamiento indefinido en DB
         * VALIDATES: Offset >= 0 siempre
         */
        it('should reject negative offset', async () => {
                // ═══ ARRANGE ═══
                const { parsePagination } = await import('../../supabase/functions/api-minimarket/helpers/pagination');

                // ═══ ACT ═══
                const result = parsePagination('10', '-1', 50, 100);

                // ═══ ASSERT ═══
                expect(result.ok).toBe(false);
                if (!result.ok) {
                        expect(result.error.field).toBe('offset');
                }
        });

        /**
         * WHY: Offset = 0 es válido y común (primera página)
         * VALIDATES: Offset 0 no es rechazado erróneamente
         */
        it('should accept offset of zero', async () => {
                // ═══ ARRANGE ═══
                const { parsePagination } = await import('../../supabase/functions/api-minimarket/helpers/pagination');

                // ═══ ACT ═══
                const result = parsePagination('10', '0', 50, 100);

                // ═══ ASSERT ═══
                expect(result.ok).toBe(true);
                if (result.ok) {
                        expect(result.params.offset).toBe(0);
                }
        });
});

describe('📐 BOUNDARY - Price Validation', () => {

        /**
         * WHY: Precio = 0 podría ser producto gratis o error de scraping
         * VALIDATES: Score de confianza penaliza precio cero
         */
        it('should penalize products with zero or negative price', async () => {
                // ═══ ARRANGE ═══
                const { calculateConfidenceScore } = await import('../../supabase/functions/scraper-maxiconsumo/parsing');

                const zeroPriceProduct = {
                        sku: 'SKU-001',
                        nombre: 'Producto Gratis',
                        precio_unitario: 0,
                        ultima_actualizacion: '',
                };

                const negativePriceProduct = {
                        sku: 'SKU-002',
                        nombre: 'Producto Negativo',
                        precio_unitario: -100,
                        ultima_actualizacion: '',
                };

                // ═══ ACT ═══
                const zeroScore = calculateConfidenceScore(zeroPriceProduct);
                const negativeScore = calculateConfidenceScore(negativePriceProduct);

                // ═══ ASSERT ═══
                expect(zeroScore).toBeLessThan(70);
                expect(negativeScore).toBeLessThanOrEqual(50);
        });

        /**
         * WHY: Precio extremadamente alto podría ser error de parsing
         * VALIDATES: Precios > 100000 son penalizados
         */
        it('should penalize products with extremely high price', async () => {
                // ═══ ARRANGE ═══
                const { calculateConfidenceScore } = await import('../../supabase/functions/scraper-maxiconsumo/parsing');

                const expensiveProduct = {
                        sku: 'SKU-003',
                        nombre: 'Producto Caro',
                        precio_unitario: 500000,
                        ultima_actualizacion: '',
                };

                // ═══ ACT ═══
                const score = calculateConfidenceScore(expensiveProduct);

                // ═══ ASSERT ═══
                expect(score).toBeLessThan(70);
        });
});

describe('📐 BOUNDARY - String Length Limits', () => {

        /**
         * WHY: Nombre muy largo podría truncarse en DB sin aviso
         * VALIDATES: sanitizeProductName limita a 255 caracteres
         */
        it('should truncate product name to 255 characters', async () => {
                // ═══ ARRANGE ═══
                const { sanitizeProductName } = await import('../../supabase/functions/scraper-maxiconsumo/parsing');
                const longName = 'A'.repeat(500);

                // ═══ ACT ═══
                const sanitized = sanitizeProductName(longName);

                // ═══ ASSERT ═══
                expect(sanitized.length).toBe(255);
        });

        /**
         * WHY: String vacío después de sanitización no debería guardarse
         * VALIDATES: Solo whitespace resulta en string vacío
         */
        it('should return empty string for whitespace-only input', async () => {
                // ═══ ARRANGE ═══
                const { sanitizeProductName } = await import('../../supabase/functions/scraper-maxiconsumo/parsing');
                const whitespaceInputs = ['   ', '\t\n\r', '  \t  '];

                // ═══ ACT & ASSERT ═══
                for (const input of whitespaceInputs) {
                        const result = sanitizeProductName(input);
                        expect(result).toBe('');
                }
        });
});

describe('📐 BOUNDARY - UUID Validation', () => {

        /**
         * WHY: UUID inválido en producto_id causa FK violation en DB
         * VALIDATES: isUuid rechaza formatos inválidos
         */
        it('should reject invalid UUID formats', async () => {
                // ═══ ARRANGE ═══
                const { isUuid } = await import('../../supabase/functions/api-minimarket/helpers/validation');
                const invalidUuids = [
                        '',
                        'not-a-uuid',
                        '550e8400-e29b-41d4-a716',
                        '550e8400-e29b-41d4-a716-446655440000-extra',
                        'ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ',
                ];

                // ═══ ACT & ASSERT ═══
                for (const uuid of invalidUuids) {
                        expect(isUuid(uuid)).toBe(false);
                }
        });

        /**
         * WHY: UUIDs válidos deben aceptarse en todas sus variantes
         * VALIDATES: v1, v4, uppercase/lowercase todos válidos
         */
        it('should accept valid UUID formats', async () => {
                // ═══ ARRANGE ═══
                const { isUuid } = await import('../../supabase/functions/api-minimarket/helpers/validation');
                const validUuids = [
                        '550e8400-e29b-41d4-a716-446655440000',
                        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                        '550E8400-E29B-41D4-A716-446655440000',
                ];

                // ═══ ACT & ASSERT ═══
                for (const uuid of validUuids) {
                        expect(isUuid(uuid)).toBe(true);
                }
        });
});
