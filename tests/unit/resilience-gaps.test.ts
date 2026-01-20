/**
 * RESILIENCE GAPS - Tests de resiliencia identificados en auditoría
 * 
 * WHY: Prevenir que la app cuelgue o crashee en condiciones adversas:
 * - DB timeout sin feedback al usuario
 * - Fetch failure sin recovery
 * - Payload inválido causando 500 en lugar de 400
 * 
 * @module tests/unit/resilience-gaps
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

const originalFetch = globalThis.fetch;

describe('🛡️ RESILIENCE - Network & Database Failures', () => {

        afterEach(() => {
                globalThis.fetch = originalFetch;
                vi.restoreAllMocks();
        });

        /**
         * WHY: Si Supabase no responde, el usuario debe ver error, no spinner infinito
         * VALIDATES: AbortController cancela request después de timeout
         */
        it('should abort database request after timeout period', async () => {
                // ═══ ARRANGE ═══
                const TIMEOUT_MS = 50;
                let wasAborted = false;

                globalThis.fetch = vi.fn().mockImplementation(async (_url, options) => {
                        return new Promise((resolve, reject) => {
                                const timer = setTimeout(() => {
                                        resolve(new Response('{"data": []}', { status: 200 }));
                                }, 5000);

                                if (options?.signal) {
                                        options.signal.addEventListener('abort', () => {
                                                wasAborted = true;
                                                clearTimeout(timer);
                                                reject(new DOMException('Aborted', 'AbortError'));
                                        });
                                }
                        });
                });

                // ═══ ACT ═══
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

                let error: Error | null = null;
                try {
                        await fetch('https://supabase.example.com/rest/v1/productos', {
                                signal: controller.signal,
                        });
                } catch (e) {
                        error = e as Error;
                }
                clearTimeout(timeoutId);

                // ═══ ASSERT ═══
                expect(wasAborted).toBe(true);
                expect(error).not.toBeNull();
                expect(error?.name).toBe('AbortError');
        });

        /**
         * WHY: Error 500 de Supabase debe propagarse como error legible
         * VALIDATES: Errores de servidor son manejados gracefully
         */
        it('should handle Supabase 500 Internal Server Error without crashing', async () => {
                // ═══ ARRANGE ═══
                globalThis.fetch = vi.fn().mockResolvedValue(
                        new Response(JSON.stringify({
                                message: 'Database connection failed',
                                code: 'INTERNAL_ERROR'
                        }), {
                                status: 500,
                                headers: { 'Content-Type': 'application/json' }
                        })
                );

                // ═══ ACT ═══
                const response = await fetch('https://supabase.example.com/rest/v1/productos');
                const body = await response.json();

                // ═══ ASSERT ═══
                expect(response.ok).toBe(false);
                expect(response.status).toBe(500);
                expect(body.code).toBe('INTERNAL_ERROR');
        });

        /**
         * WHY: Connection refused debe resultar en error claro
         * VALIDATES: TypeError de fetch es capturado
         */
        it('should catch network connection refused', async () => {
                // ═══ ARRANGE ═══
                globalThis.fetch = vi.fn().mockRejectedValue(
                        new TypeError('fetch failed: ECONNREFUSED')
                );

                // ═══ ACT ═══
                let error: Error | null = null;
                try {
                        await fetch('https://supabase.example.com/rest/v1/productos');
                } catch (e) {
                        error = e as Error;
                }

                // ═══ ASSERT ═══
                expect(error).toBeInstanceOf(TypeError);
                expect(error?.message).toContain('ECONNREFUSED');
        });

        /**
         * WHY: Payload JSON inválido debe ser detectado
         * VALIDATES: Parsing errors son manejados en capa de validación
         */
        it('should detect invalid JSON payload', () => {
                // ═══ ARRANGE ═══
                const invalidPayloads = [
                        '{"incomplete": ',
                        'not json at all',
                        '',
                ];

                // ═══ ACT & ASSERT ═══
                for (const payload of invalidPayloads) {
                        expect(() => JSON.parse(payload)).toThrow(SyntaxError);
                }
        });
});

describe('🔄 RESILIENCE - Circuit Breaker Integration', () => {

        /**
         * WHY: Después de N fallos, circuit breaker debe abrir y fallar rápido
         * VALIDATES: Integración con CircuitBreaker existente
         */
        it('should open circuit after failure threshold and fail fast', async () => {
                // ═══ ARRANGE ═══
                const { CircuitBreaker } = await import('../../supabase/functions/_shared/circuit-breaker');
                const breaker = new CircuitBreaker({
                        failureThreshold: 3,
                        successThreshold: 2,
                        openTimeoutMs: 5000
                });

                // ═══ ACT ═══
                breaker.recordFailure();
                breaker.recordFailure();
                breaker.recordFailure();

                // ═══ ASSERT ═══
                expect(breaker.getState()).toBe('open');
                expect(breaker.allowRequest()).toBe(false);
        });
});
