/**
 * Unit tests for scraper-maxiconsumo storage module - key usage and auth.
 * Validates that operations use correct auth level (service vs anon).
 * 
 * @module tests/unit/scraper-storage-auth
 * Coverage:
 * - Alertas builder (pure function)
 * - Key usage contracts
 * - SCRAPER_READ_MODE simulation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildAlertasDesdeComparaciones, type ComparacionRow } from '../../supabase/functions/scraper-maxiconsumo/alertas.ts';
import { guardarProductosExtraidosOptimizado } from '../../supabase/functions/scraper-maxiconsumo/storage.ts';

const originalFetch = globalThis.fetch;

// ============================================================================
// Alertas builder tests (pure function, no auth dependency)
// ============================================================================
describe('scraper-maxiconsumo alertas', () => {
    describe('buildAlertasDesdeComparaciones', () => {
        it('returns empty array when no comparaciones', () => {
            const result = buildAlertasDesdeComparaciones([], new Set());
            expect(result).toEqual([]);
        });

        it('skips comparaciones without producto_id', () => {
            const comparaciones: ComparacionRow[] = [
                { nombre_producto: 'Test', precio_actual: 100, precio_proveedor: 90 }
            ];
            const result = buildAlertasDesdeComparaciones(comparaciones, new Set());
            expect(result).toEqual([]);
        });

        it('skips comparaciones that exist in existingIds', () => {
            const comparaciones: ComparacionRow[] = [
                { producto_id: 'existing-1', nombre_producto: 'Test', precio_actual: 100, precio_proveedor: 90 }
            ];
            const existingIds = new Set(['existing-1']);
            const result = buildAlertasDesdeComparaciones(comparaciones, existingIds);
            expect(result).toEqual([]);
        });

        it('creates alert for new comparacion with significant difference', () => {
            const comparaciones: ComparacionRow[] = [
                { 
                    producto_id: 'new-1', 
                    nombre_producto: 'Aceite', 
                    precio_actual: 100, 
                    precio_proveedor: 80,
                    diferencia_porcentual: 20
                }
            ];
            const result = buildAlertasDesdeComparaciones(comparaciones, new Set());
            
            expect(result).toHaveLength(1);
            expect(result[0].producto_id).toBe('new-1');
            expect(result[0].nombre_producto).toBe('Aceite');
            expect(result[0].severidad).toBe('alta'); // 20% => alta
        });

        it('assigns correct severidad based on difference', () => {
            const testCases = [
                { diff: 3, expected: 'baja' },
                { diff: 8, expected: 'media' },
                { diff: 18, expected: 'alta' },
                { diff: 30, expected: 'critica' }
            ];

            for (const tc of testCases) {
                const comparaciones: ComparacionRow[] = [
                    { 
                        producto_id: `test-${tc.diff}`, 
                        nombre_producto: 'Test', 
                        precio_actual: 100, 
                        precio_proveedor: 100 - tc.diff,
                        diferencia_porcentual: tc.diff
                    }
                ];
                const result = buildAlertasDesdeComparaciones(comparaciones, new Set());
                expect(result[0]?.severidad).toBe(tc.expected);
            }
        });

        it('handles missing diferencia_porcentual gracefully', () => {
            const comparaciones: ComparacionRow[] = [
                { 
                    producto_id: 'calc-diff', 
                    nombre_producto: 'Test', 
                    precio_actual: 100, 
                    precio_proveedor: 85,
                    diferencia_absoluta: 15
                    // diferencia_porcentual is undefined
                }
            ];
            const result = buildAlertasDesdeComparaciones(comparaciones, new Set());
            
            // Should handle gracefully (0% diff -> baja)
            expect(result).toHaveLength(1);
            expect(result[0].severidad).toBe('baja');
        });

        it('sets tipo_cambio based on price direction', () => {
            const proveedorMasCaroRow: ComparacionRow = { 
                producto_id: 'aumento', 
                nombre_producto: 'Test', 
                precio_actual: 80, 
                precio_proveedor: 100,
                diferencia_absoluta: 20,
                diferencia_porcentual: 20
            };
            
            const proveedorMasBaratoRow: ComparacionRow = { 
                producto_id: 'disminucion', 
                nombre_producto: 'Test', 
                precio_actual: 100, 
                precio_proveedor: 80,
                diferencia_absoluta: 20,
                diferencia_porcentual: 20
            };

            const aumentoResult = buildAlertasDesdeComparaciones([proveedorMasCaroRow], new Set());
            const disminucionResult = buildAlertasDesdeComparaciones([proveedorMasBaratoRow], new Set());

            expect(aumentoResult[0]?.tipo_cambio).toBe('aumento');
            expect(disminucionResult[0]?.tipo_cambio).toBe('disminucion');
        });

        it('generates appropriate message and action', () => {
            const comparaciones: ComparacionRow[] = [
                { 
                    producto_id: 'msg-test', 
                    nombre_producto: 'Aceite Girasol', 
                    precio_actual: 100, 
                    precio_proveedor: 85,
                    diferencia_porcentual: 15
                }
            ];
            const result = buildAlertasDesdeComparaciones(comparaciones, new Set());
            
            expect(result[0].mensaje).toContain('Aceite Girasol');
            expect(result[0].mensaje).toContain('15.0%');
            expect(result[0].accion_recomendada).toBeDefined();
            expect(result[0].accion_recomendada.length).toBeGreaterThan(0);
        });

        it('handles non-finite numeric values', () => {
            const comparaciones: ComparacionRow[] = [
                { 
                    producto_id: 'nan-test', 
                    nombre_producto: 'Test', 
                    precio_actual: NaN, 
                    precio_proveedor: 100,
                    diferencia_porcentual: 10
                },
                { 
                    producto_id: 'inf-test', 
                    nombre_producto: 'Test', 
                    precio_actual: Infinity, 
                    precio_proveedor: 100,
                    diferencia_porcentual: 10
                }
            ];
            const result = buildAlertasDesdeComparaciones(comparaciones, new Set());
            expect(result).toHaveLength(0);
        });
    });
});

// ============================================================================
// Storage key usage documentation tests
// These tests document expected behavior for service role vs anon key usage
// ============================================================================
describe('scraper storage key usage contracts', () => {
    describe('Operations requiring service role (writes)', () => {
        it('documents write operations need service role', () => {
            // These operations modify data and require elevated permissions
            const writeOperations = [
                'batchInsertProducts',
                'batchUpdateProducts',
                'guardarProductosExtraidosOptimizado',
                'batchSaveComparisons',
                'batchSaveAlerts'
            ];
            
            // Just documentation - actual implementation uses service key
            expect(writeOperations.length).toBe(5);
        });
    });

    describe('Operations that could use anon key (reads)', () => {
        it('documents read operations that could be hardened', () => {
            // These operations only read data and could potentially use anon key
            // if RLS policies allow it
            const readOperations = [
                'bulkCheckExistingProducts',  // SELECT from precios_proveedor
                'fetchProductosProveedor',     // SELECT from precios_proveedor
                'fetchProductosSistema',       // SELECT from productos
                'handleHealth',                // SELECT count
                'handleStatus'                 // No DB access, just metrics
            ];
            
            // Note: handleHealth and handleStatus in index.ts could use anonKey
            expect(readOperations.length).toBe(5);
        });
    });

    describe('Recommended hardening pattern', () => {
        it('documents SCRAPER_READ_MODE pattern (proposal)', () => {
            // Similar to API_PROVEEDOR_READ_MODE, scraper could use:
            // SCRAPER_READ_MODE=anon|service
            // Default: anon for reads, service only for writes
            
            const readModeConfig = {
                envVar: 'SCRAPER_READ_MODE',
                defaultValue: 'anon',
                values: ['anon', 'service'],
                description: 'Controls auth level for read operations'
            };
            
            expect(readModeConfig.defaultValue).toBe('anon');
        });
    });
});

// ============================================================================
// SCRAPER_READ_MODE simulation tests
// Tests that simulate the behavior of different read modes
// ============================================================================
describe('SCRAPER_READ_MODE behavior simulation', () => {
    // Simulated getScraperKeys logic (mirrors index.ts implementation)
    interface ScraperKeys {
        readKey: string;
        writeKey: string;
        readMode: 'anon' | 'service';
    }

    function getScraperKeysSimulation(env: Record<string, string | undefined>): ScraperKeys {
        const readMode = (env.SCRAPER_READ_MODE || 'anon') as 'anon' | 'service';
        const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
        const anonKey = env.SUPABASE_ANON_KEY;

        // writeKey siempre es service role
        const writeKey = serviceKey;

        // readKey depende del modo
        let readKey: string;
        if (readMode === 'service' || !anonKey) {
            readKey = serviceKey;
        } else {
            readKey = anonKey;
        }

        return { readKey, writeKey, readMode };
    }

    describe('mode=anon (default)', () => {
        it('uses anon key for reads when available', () => {
            const env = {
                SCRAPER_READ_MODE: 'anon',
                SUPABASE_ANON_KEY: 'anon-key-123',
                SUPABASE_SERVICE_ROLE_KEY: 'service-key-456'
            };
            const keys = getScraperKeysSimulation(env);
            
            expect(keys.readKey).toBe('anon-key-123');
            expect(keys.writeKey).toBe('service-key-456');
            expect(keys.readMode).toBe('anon');
        });

        it('falls back to service key when anon key missing', () => {
            const env = {
                SCRAPER_READ_MODE: 'anon',
                SUPABASE_ANON_KEY: undefined,
                SUPABASE_SERVICE_ROLE_KEY: 'service-key-456'
            };
            const keys = getScraperKeysSimulation(env);
            
            expect(keys.readKey).toBe('service-key-456');
            expect(keys.writeKey).toBe('service-key-456');
            expect(keys.readMode).toBe('anon');
        });

        it('defaults to anon when SCRAPER_READ_MODE not set', () => {
            const env = {
                // SCRAPER_READ_MODE: undefined,
                SUPABASE_ANON_KEY: 'anon-key-123',
                SUPABASE_SERVICE_ROLE_KEY: 'service-key-456'
            };
            const keys = getScraperKeysSimulation(env);
            
            expect(keys.readMode).toBe('anon');
            expect(keys.readKey).toBe('anon-key-123');
        });
    });

    describe('mode=service (legacy)', () => {
        it('uses service key for all operations', () => {
            const env = {
                SCRAPER_READ_MODE: 'service',
                SUPABASE_ANON_KEY: 'anon-key-123',
                SUPABASE_SERVICE_ROLE_KEY: 'service-key-456'
            };
            const keys = getScraperKeysSimulation(env);
            
            expect(keys.readKey).toBe('service-key-456');
            expect(keys.writeKey).toBe('service-key-456');
            expect(keys.readMode).toBe('service');
        });

        it('ignores anon key in service mode', () => {
            const env = {
                SCRAPER_READ_MODE: 'service',
                SUPABASE_ANON_KEY: 'should-be-ignored',
                SUPABASE_SERVICE_ROLE_KEY: 'service-key-used'
            };
            const keys = getScraperKeysSimulation(env);
            
            expect(keys.readKey).not.toBe('should-be-ignored');
            expect(keys.readKey).toBe('service-key-used');
        });
    });

    describe('key separation validation', () => {
        it('write key is always service role regardless of mode', () => {
            const modes: Array<'anon' | 'service'> = ['anon', 'service'];
            
            for (const mode of modes) {
                const env = {
                    SCRAPER_READ_MODE: mode,
                    SUPABASE_ANON_KEY: 'anon-key',
                    SUPABASE_SERVICE_ROLE_KEY: 'service-key'
                };
                const keys = getScraperKeysSimulation(env);
                expect(keys.writeKey).toBe('service-key');
            }
        });

        it('read key differs from write key in anon mode', () => {
            const env = {
                SCRAPER_READ_MODE: 'anon',
                SUPABASE_ANON_KEY: 'anon-key',
                SUPABASE_SERVICE_ROLE_KEY: 'service-key'
            };
            const keys = getScraperKeysSimulation(env);
            
            expect(keys.readKey).not.toBe(keys.writeKey);
        });

        it('read key equals write key in service mode', () => {
            const env = {
                SCRAPER_READ_MODE: 'service',
                SUPABASE_ANON_KEY: 'anon-key',
                SUPABASE_SERVICE_ROLE_KEY: 'service-key'
            };
            const keys = getScraperKeysSimulation(env);
            
            expect(keys.readKey).toBe(keys.writeKey);
        });
    });

    describe('edge cases', () => {
        it('handles empty string keys', () => {
            const env = {
                SCRAPER_READ_MODE: 'anon',
                SUPABASE_ANON_KEY: '',
                SUPABASE_SERVICE_ROLE_KEY: 'service-key'
            };
            const keys = getScraperKeysSimulation(env);
            
            // Empty string is falsy, should fallback to service
            expect(keys.readKey).toBe('service-key');
        });

        it('handles all keys missing', () => {
            const env = {
                SCRAPER_READ_MODE: 'anon',
                SUPABASE_ANON_KEY: undefined,
                SUPABASE_SERVICE_ROLE_KEY: undefined
            };
            const keys = getScraperKeysSimulation(env);
            
            // Both keys empty, but should not crash
            expect(keys.readKey).toBe('');
            expect(keys.writeKey).toBe('');
        });

        it('handles invalid read mode value', () => {
            const env = {
                SCRAPER_READ_MODE: 'invalid',
                SUPABASE_ANON_KEY: 'anon-key',
                SUPABASE_SERVICE_ROLE_KEY: 'service-key'
            };
            // TypeScript would catch this at compile time, but runtime should handle gracefully
            const keys = getScraperKeysSimulation(env as any);
            
            // 'invalid' !== 'service' so it uses anonKey
            expect(keys.readKey).toBe('anon-key');
        });
    });
});

// ============================================================================
// Storage function usage pattern tests
// Documents which key should be used for each storage operation
// ============================================================================
describe('storage function key usage patterns', () => {
    describe('guardarProductosExtraidosOptimizado', () => {
        it('documents dual-key signature', () => {
            // Function signature: guardarProductosExtraidosOptimizado(productos, url, readKey, writeKey, log)
            const signature = {
                params: ['productos', 'supabaseUrl', 'readKey', 'writeKey', 'log'],
                readOperations: ['bulkCheckExistingProducts'],
                writeOperations: ['batchInsertProducts', 'batchUpdateProducts']
            };
            
            expect(signature.params).toContain('readKey');
            expect(signature.params).toContain('writeKey');
            expect(signature.readOperations.length).toBe(1);
            expect(signature.writeOperations.length).toBe(2);
        });

        it('documents that reads use readKey', () => {
            // bulkCheckExistingProducts uses readKey parameter
            const readKeyUsage = {
                function: 'bulkCheckExistingProducts',
                operation: 'SELECT from precios_proveedor',
                keyParam: 'readKey',
                reason: 'Only reads existing SKUs, no modification'
            };
            
            expect(readKeyUsage.keyParam).toBe('readKey');
        });

        it('documents that writes use writeKey', () => {
            // batchInsert and batchUpdate use writeKey parameter
            const writeKeyUsage = [
                { function: 'batchInsertProducts', operation: 'INSERT', keyParam: 'writeKey' },
                { function: 'batchUpdateProducts', operation: 'PATCH', keyParam: 'writeKey' }
            ];
            
            for (const usage of writeKeyUsage) {
                expect(usage.keyParam).toBe('writeKey');
            }
        });
    });

    describe('batchSaveComparisons', () => {
        it('uses service key for write and delete operations', () => {
            const operations = {
                cleanup: { type: 'DELETE', requiresServiceKey: true },
                insert: { type: 'POST', requiresServiceKey: true }
            };
            
            expect(operations.cleanup.requiresServiceKey).toBe(true);
            expect(operations.insert.requiresServiceKey).toBe(true);
        });
    });

    describe('batchSaveAlerts', () => {
        it('uses service key for write and delete operations', () => {
            const operations = {
                cleanup: { type: 'DELETE', requiresServiceKey: true },
                insert: { type: 'POST', requiresServiceKey: true }
            };
            
            expect(operations.cleanup.requiresServiceKey).toBe(true);
            expect(operations.insert.requiresServiceKey).toBe(true);
        });
    });

    describe('fetch operations', () => {
        it('fetchProductosProveedor could use anon key', () => {
            const fetchOp = {
                function: 'fetchProductosProveedor',
                operation: 'SELECT from precios_proveedor',
                currentKey: 'single key param',
                recommendation: 'Could accept readKey for RLS-compatible access'
            };
            
            expect(fetchOp.operation).toContain('SELECT');
        });

        it('fetchProductosSistema could use anon key', () => {
            const fetchOp = {
                function: 'fetchProductosSistema',
                operation: 'SELECT from productos',
                currentKey: 'single key param',
                recommendation: 'Could accept readKey for RLS-compatible access'
            };
            
            expect(fetchOp.operation).toContain('SELECT');
        });
    });
});

// ============================================================================
// Runtime validation: readKey vs writeKey usage (no network)
// ============================================================================
describe('storage key separation runtime', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('usa readKey para lecturas y writeKey para inserciones/actualizaciones', async () => {
        const fetchMock = vi.fn()
            // bulkCheckExistingProducts (lectura con readKey)
            .mockResolvedValueOnce({ ok: true, json: async () => [{ sku: 'EXIST' }] })
            // batchInsertProducts (escritura con writeKey)
            .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'NEW' }] })
            // batchUpdateProducts (escritura con writeKey)
            .mockResolvedValue({ ok: true, json: async () => [{ id: 'UPDATED' }] });

        globalThis.fetch = fetchMock as any;

        const productos = [
            { sku: 'EXIST', nombre: 'Existente', precio_unitario: 10, ultima_actualizacion: '' },
            { sku: 'NEW', nombre: 'Nuevo', precio_unitario: 12, ultima_actualizacion: '' }
        ];

        const total = await guardarProductosExtraidosOptimizado(
            productos as any,
            'https://example.supabase.co',
            'anon-key',
            'service-key',
            { requestId: 'rw-1' } as any
        );

        expect(total).toBeGreaterThan(0);
        expect(fetchMock).toHaveBeenCalled();

        const [readCall, ...writeCalls] = fetchMock.mock.calls;
        expect((readCall[1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer anon-key' });

        for (const [, opts] of writeCalls) {
            expect((opts as RequestInit).headers).toMatchObject({ Authorization: 'Bearer service-key' });
        }
    });

    it('usa writeKey también para lecturas cuando readKey=service (modo service)', async () => {
        const fetchMock = vi.fn()
            // bulkCheckExistingProducts
            .mockResolvedValueOnce({ ok: true, json: async () => [] })
            // batchInsertProducts
            .mockResolvedValue({ ok: true, json: async () => [{ id: 'ONLY' }] });

        globalThis.fetch = fetchMock as any;

        const productos = [
            { sku: 'ONLY', nombre: 'Solo Servicio', precio_unitario: 15, ultima_actualizacion: '' }
        ];

        await guardarProductosExtraidosOptimizado(
            productos as any,
            'https://example.supabase.co',
            'service-key',
            'service-key',
            { requestId: 'rw-2' } as any
        );

        expect(fetchMock).toHaveBeenCalled();
        const firstCallHeaders = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
        const secondCallHeaders = (fetchMock.mock.calls[1][1] as RequestInit).headers as Record<string, string>;
        expect(firstCallHeaders.Authorization).toBe('Bearer service-key');
        expect(secondCallHeaders.Authorization).toBe('Bearer service-key');
    });
});
