/**
 * Unit Tests for scraper-maxiconsumo/anti-detection.ts
 * 
 * Tests anti-detection utilities:
 * - Header generation (random, advanced)
 * - Delay functions (random, exponential backoff)
 * - Session/Request ID generation
 * - CAPTCHA detection
 * 
 * Note: Tests for fetch functions would require mocking and are better suited
 * for integration tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
        generarHeadersAleatorios,
        generateAdvancedHeaders,
        getRandomDelay,
        calculateExponentialBackoff,
        generateSessionId,
        generateRequestId,
        detectCaptcha,
        DEFAULT_ANTI_DETECTION_CONFIG
} from '../../supabase/functions/scraper-maxiconsumo/anti-detection';

describe('DEFAULT_ANTI_DETECTION_CONFIG', () => {
        it('should have expected defaults', () => {
                expect(DEFAULT_ANTI_DETECTION_CONFIG.minDelay).toBe(1500);
                expect(DEFAULT_ANTI_DETECTION_CONFIG.maxDelay).toBe(6000);
                expect(DEFAULT_ANTI_DETECTION_CONFIG.jitterFactor).toBe(0.25);
                expect(DEFAULT_ANTI_DETECTION_CONFIG.userAgentRotation).toBe(true);
                expect(DEFAULT_ANTI_DETECTION_CONFIG.headerRandomization).toBe(true);
                expect(DEFAULT_ANTI_DETECTION_CONFIG.captchaBypass).toBe(false);
        });
});

describe('generarHeadersAleatorios', () => {
        it('should return headers object', () => {
                const headers = generarHeadersAleatorios();

                expect(typeof headers).toBe('object');
                expect(Object.keys(headers).length).toBeGreaterThan(5);
        });

        it('should include User-Agent', () => {
                const headers = generarHeadersAleatorios();

                expect(headers['User-Agent']).toBeDefined();
                expect(headers['User-Agent']).toContain('Mozilla');
        });

        it('should include Accept header', () => {
                const headers = generarHeadersAleatorios();

                expect(headers['Accept']).toBeDefined();
                expect(headers['Accept']).toContain('text/html');
        });

        it('should include Accept-Language', () => {
                const headers = generarHeadersAleatorios();

                expect(headers['Accept-Language']).toBeDefined();
        });

        it('should include security headers', () => {
                const headers = generarHeadersAleatorios();

                expect(headers['Sec-Fetch-Dest']).toBe('document');
                expect(headers['Sec-Fetch-Mode']).toBe('navigate');
                expect(headers['Upgrade-Insecure-Requests']).toBe('1');
        });

        it('should return different User-Agents on multiple calls (eventually)', () => {
                const userAgents = new Set<string>();

                // Call many times to get variety
                for (let i = 0; i < 50; i++) {
                        userAgents.add(generarHeadersAleatorios()['User-Agent']);
                }

                // Should have at least 2 different user agents
                expect(userAgents.size).toBeGreaterThan(1);
        });
});

describe('generateAdvancedHeaders', () => {
        it('should include all basic headers', () => {
                const headers = generateAdvancedHeaders();

                expect(headers['User-Agent']).toBeDefined();
                expect(headers['Accept']).toBeDefined();
                expect(headers['Accept-Language']).toBeDefined();
        });

        it('should include advanced security headers', () => {
                const headers = generateAdvancedHeaders();

                expect(headers['Sec-Ch-Ua']).toBeDefined();
                expect(headers['Sec-Ch-Ua-Mobile']).toBe('?0');
                expect(headers['Sec-Ch-Ua-Platform']).toBe('"Windows"');
                expect(headers['DNT']).toBe('1');
        });

        it('should include custom headers', () => {
                const headers = generateAdvancedHeaders();

                expect(headers['X-Timezone']).toBeDefined();
                expect(headers['X-Client-Time']).toBeDefined();
        });

        it('should return valid ISO timestamp', () => {
                const headers = generateAdvancedHeaders();
                const timestamp = headers['X-Client-Time'];

                expect(() => new Date(timestamp)).not.toThrow();
                expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });
});

describe('getRandomDelay', () => {
        it('should return value within range', () => {
                const min = 1000;
                const max = 5000;

                for (let i = 0; i < 20; i++) {
                        const delay = getRandomDelay(min, max);

                        // With jitter, could be slightly below min but should be >= min * 0.8
                        expect(delay).toBeGreaterThanOrEqual(min * 0.8);
                        expect(delay).toBeLessThanOrEqual(max * 1.2);
                }
        });

        it('should respect jitter parameter', () => {
                const min = 1000;
                const max = 1000; // Same min/max to test jitter effect

                const delays = new Set<number>();
                for (let i = 0; i < 20; i++) {
                        delays.add(getRandomDelay(min, max, 0.5));
                }

                // With jitter, should have variety
                expect(delays.size).toBeGreaterThan(1);
        });

        it('should return minimum when jitter is 0 and min=max', () => {
                const delay = getRandomDelay(1000, 1000, 0);

                expect(delay).toBe(1000);
        });
});

describe('calculateExponentialBackoff', () => {
        it('should increase with attempts', () => {
                const delay0 = calculateExponentialBackoff(0, 1000, 30000, false);
                const delay1 = calculateExponentialBackoff(1, 1000, 30000, false);
                const delay2 = calculateExponentialBackoff(2, 1000, 30000, false);

                expect(delay1).toBeGreaterThan(delay0);
                expect(delay2).toBeGreaterThan(delay1);
        });

        it('should double each attempt (without jitter)', () => {
                const base = 1000;

                expect(calculateExponentialBackoff(0, base, 30000, false)).toBe(1000);
                expect(calculateExponentialBackoff(1, base, 30000, false)).toBe(2000);
                expect(calculateExponentialBackoff(2, base, 30000, false)).toBe(4000);
                expect(calculateExponentialBackoff(3, base, 30000, false)).toBe(8000);
        });

        it('should respect maxDelay', () => {
                const maxDelay = 5000;

                const delay = calculateExponentialBackoff(10, 1000, maxDelay, false);

                expect(delay).toBe(maxDelay);
        });

        it('should add jitter when enabled', () => {
                const delays = new Set<number>();

                for (let i = 0; i < 20; i++) {
                        delays.add(calculateExponentialBackoff(2, 1000, 30000, true));
                }

                // With jitter, should have variety
                expect(delays.size).toBeGreaterThan(1);
        });

        it('should use default values', () => {
                const delay = calculateExponentialBackoff(0);

                // Default baseDelay = 1000
                expect(delay).toBeGreaterThanOrEqual(800); // Jitter could reduce slightly
                expect(delay).toBeLessThanOrEqual(1200);
        });
});

describe('generateSessionId', () => {
        it('should return a string', () => {
                expect(typeof generateSessionId()).toBe('string');
        });

        it('should return sufficient length', () => {
                const id = generateSessionId();

                expect(id.length).toBeGreaterThanOrEqual(20);
        });

        it('should be alphanumeric', () => {
                const id = generateSessionId();

                expect(id).toMatch(/^[a-z0-9]+$/);
        });

        it('should generate unique IDs', () => {
                const ids = new Set<string>();

                for (let i = 0; i < 100; i++) {
                        ids.add(generateSessionId());
                }

                expect(ids.size).toBe(100);
        });
});

describe('generateRequestId', () => {
        it('should return a UUID', () => {
                const id = generateRequestId();

                // UUID v4 format
                expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });

        it('should generate unique IDs', () => {
                const ids = new Set<string>();

                for (let i = 0; i < 100; i++) {
                        ids.add(generateRequestId());
                }

                expect(ids.size).toBe(100);
        });
});

describe('detectCaptcha', () => {
        describe('Response-based detection', () => {
                it('should detect 429 status', () => {
                        const response = new Response('', { status: 429 });

                        expect(detectCaptcha(response)).toBe(true);
                });

                it('should detect x-captcha-detected header', () => {
                        const response = new Response('', {
                                status: 200,
                                headers: { 'x-captcha-detected': 'true' }
                        });

                        expect(detectCaptcha(response)).toBe(true);
                });

                it('should return false for normal response', () => {
                        const response = new Response('', { status: 200 });

                        expect(detectCaptcha(response)).toBe(false);
                });
        });

        describe('HTML-based detection', () => {
                it('should detect captcha in HTML', () => {
                        const response = new Response('', { status: 200 });

                        expect(detectCaptcha(response, '<div class="captcha-form">')).toBe(true);
                });

                it('should detect recaptcha', () => {
                        const response = new Response('', { status: 200 });

                        expect(detectCaptcha(response, '<div class="g-recaptcha">')).toBe(true);
                });

                it('should detect hcaptcha', () => {
                        const response = new Response('', { status: 200 });

                        expect(detectCaptcha(response, '<div class="h-captcha">')).toBe(true);
                });

                it('should detect cf-turnstile', () => {
                        const response = new Response('', { status: 200 });

                        expect(detectCaptcha(response, '<div class="cf-turnstile">')).toBe(true);
                });

                it('should detect challenge-form', () => {
                        const response = new Response('', { status: 200 });

                        expect(detectCaptcha(response, '<form id="challenge-form">')).toBe(true);
                });

                it('should be case-insensitive', () => {
                        const response = new Response('', { status: 200 });

                        expect(detectCaptcha(response, '<div class="CAPTCHA">')).toBe(true);
                        expect(detectCaptcha(response, '<div class="ReCAPTCHA">')).toBe(true);
                });

                it('should return false for normal HTML', () => {
                        const response = new Response('', { status: 200 });

                        expect(detectCaptcha(response, '<html><body>Hello World</body></html>')).toBe(false);
                });
        });
});
