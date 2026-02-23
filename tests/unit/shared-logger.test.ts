/**
 * Unit Tests for _shared/logger.ts
 * 
 * Tests the createLogger factory function.
 * Note: Tests use console spies to verify output without actually logging.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from '../../supabase/functions/_shared/logger';

describe('createLogger', () => {
        let consoleSpy: {
                debug: ReturnType<typeof vi.spyOn>;
                info: ReturnType<typeof vi.spyOn>;
                warn: ReturnType<typeof vi.spyOn>;
                error: ReturnType<typeof vi.spyOn>;
        };
        const originalLogLevel = process.env.LOG_LEVEL;

        beforeEach(() => {
                consoleSpy = {
                        debug: vi.spyOn(console, 'debug').mockImplementation(() => { }),
                        info: vi.spyOn(console, 'info').mockImplementation(() => { }),
                        warn: vi.spyOn(console, 'warn').mockImplementation(() => { }),
                        error: vi.spyOn(console, 'error').mockImplementation(() => { }),
                };
        });

        afterEach(() => {
                vi.restoreAllMocks();
                process.env.LOG_LEVEL = originalLogLevel;
        });

        describe('Logger factory', () => {
                it('should create a logger with all methods', () => {
                        const logger = createLogger('test-scope');

                        expect(typeof logger.debug).toBe('function');
                        expect(typeof logger.info).toBe('function');
                        expect(typeof logger.warn).toBe('function');
                        expect(typeof logger.error).toBe('function');
                        expect(typeof logger.audit).toBe('function');
                });
        });

        describe('info level', () => {
                it('should log info messages', () => {
                        const logger = createLogger('test-scope');

                        logger.info('Test message');

                        expect(consoleSpy.info).toHaveBeenCalled();
                });

                it('should include scope in output', () => {
                        const logger = createLogger('my-module');

                        logger.info('Hello');

                        const call = consoleSpy.info.mock.calls[0][0];
                        expect(call).toContain('my-module');
                });

                it('should include message in output', () => {
                        const logger = createLogger('test');

                        logger.info('Important message');

                        const call = consoleSpy.info.mock.calls[0][0];
                        expect(call).toContain('Important message');
                });

                it('should include timestamp', () => {
                        const logger = createLogger('test');

                        logger.info('Test');

                        const call = consoleSpy.info.mock.calls[0][0];
                        const parsed = JSON.parse(call);
                        expect(parsed.ts).toBeDefined();
                        expect(parsed.ts).toMatch(/^\d{4}-\d{2}-\d{2}/);
                });

                it('should include metadata', () => {
                        const logger = createLogger('test');

                        logger.info('Test', { userId: '123', count: 5 });

                        const call = consoleSpy.info.mock.calls[0][0];
                        const parsed = JSON.parse(call);
                        expect(parsed.userId).toBe('123');
                        expect(parsed.count).toBe(5);
                });
        });

        describe('warn level', () => {
                it('should log warn messages to console.warn', () => {
                        const logger = createLogger('test');

                        logger.warn('Warning!');

                        expect(consoleSpy.warn).toHaveBeenCalled();
                });
        });

        describe('error level', () => {
                it('should log error messages to console.error', () => {
                        const logger = createLogger('test');

                        logger.error('Error occurred');

                        expect(consoleSpy.error).toHaveBeenCalled();
                });
        });

        describe('audit method', () => {
                it('should log with [AUDIT] prefix', () => {
                        const logger = createLogger('test');

                        logger.audit('user_login', { userId: '123' });

                        const call = consoleSpy.info.mock.calls[0][0];
                        expect(call).toContain('[AUDIT]');
                        expect(call).toContain('user_login');
                });
        });

        describe('base metadata', () => {
                it('should include base metadata in all logs', () => {
                        const logger = createLogger('test', { service: 'api', version: '1.0' });

                        logger.info('Test');

                        const call = consoleSpy.info.mock.calls[0][0];
                        const parsed = JSON.parse(call);
                        expect(parsed.service).toBe('api');
                        expect(parsed.version).toBe('1.0');
                });

                it('should merge call metadata with base', () => {
                        const logger = createLogger('test', { base: 'value' });

                        logger.info('Test', { extra: 'data' });

                        const call = consoleSpy.info.mock.calls[0][0];
                        const parsed = JSON.parse(call);
                        expect(parsed.base).toBe('value');
                        expect(parsed.extra).toBe('data');
                });
        });

        describe('JSON output', () => {
                it('should output valid JSON', () => {
                        const logger = createLogger('test');

                        logger.info('Test message');

                        const call = consoleSpy.info.mock.calls[0][0];
                        expect(() => JSON.parse(call)).not.toThrow();
                });

                it('should include level in output', () => {
                        const logger = createLogger('test');

                        logger.info('Test');
                        logger.warn('Warning');
                        logger.error('Error');

                        expect(JSON.parse(consoleSpy.info.mock.calls[0][0]).level).toBe('info');
                        expect(JSON.parse(consoleSpy.warn.mock.calls[0][0]).level).toBe('warn');
                        expect(JSON.parse(consoleSpy.error.mock.calls[0][0]).level).toBe('error');
                });
        });

        describe('LOG_LEVEL filtering', () => {
                it('should suppress debug/info when LOG_LEVEL is warn', () => {
                        process.env.LOG_LEVEL = 'warn';
                        const logger = createLogger('test');

                        logger.debug('debug');
                        logger.info('info');
                        logger.warn('warn');
                        logger.error('error');

                        expect(consoleSpy.debug).not.toHaveBeenCalled();
                        expect(consoleSpy.info).not.toHaveBeenCalled();
                        expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
                        expect(consoleSpy.error).toHaveBeenCalledTimes(1);
                });

                it('should fallback to info when LOG_LEVEL is invalid', () => {
                        process.env.LOG_LEVEL = 'invalid-level';
                        const logger = createLogger('test');

                        logger.debug('debug');
                        logger.info('info');

                        expect(consoleSpy.debug).not.toHaveBeenCalled();
                        expect(consoleSpy.info).toHaveBeenCalledTimes(1);
                });
        });

        describe('Special characters', () => {
                it('should preserve special characters in message and metadata', () => {
                        process.env.LOG_LEVEL = 'debug';
                        const logger = createLogger('test');

                        logger.info('line1\nline2', {
                                path: '/api/v1/items?q=a%20b&limit=10',
                                detail: 'quote:"value"',
                        });

                        const call = consoleSpy.info.mock.calls[0][0];
                        const parsed = JSON.parse(call);
                        expect(parsed.message).toBe('line1\nline2');
                        expect(parsed.path).toBe('/api/v1/items?q=a%20b&limit=10');
                        expect(parsed.detail).toBe('quote:"value"');
                });
        });
});
