/**
 * Unit Tests for _shared/cors.ts
 * 
 * Tests CORS handling functions:
 * - getCorsHeaders
 * - handleCors
 * - parseAllowedOrigins
 * - validateOrigin
 * - createCorsErrorResponse
 */

import { describe, it, expect } from 'vitest';
import {
        getCorsHeaders,
        handleCors,
        parseAllowedOrigins,
        validateOrigin,
        createCorsErrorResponse,
        resolveCorsHeaders,
        DEFAULT_CORS_HEADERS
} from '../../supabase/functions/_shared/cors';

describe('DEFAULT_CORS_HEADERS', () => {
        it('should have required headers', () => {
                expect(DEFAULT_CORS_HEADERS['Access-Control-Allow-Headers']).toContain('authorization');
                expect(DEFAULT_CORS_HEADERS['Access-Control-Allow-Methods']).toContain('POST');
                expect(DEFAULT_CORS_HEADERS['Access-Control-Max-Age']).toBe('86400');
        });
});

describe('getCorsHeaders', () => {
        it('should return default headers', () => {
                const headers = getCorsHeaders();
                expect(headers).toEqual(DEFAULT_CORS_HEADERS);
        });

        it('should merge overrides', () => {
                const headers = getCorsHeaders({ 'X-Custom': 'value' });
                expect(headers['X-Custom']).toBe('value');
                expect(headers['Access-Control-Allow-Methods']).toBeDefined();
        });

        it('should allow overriding default headers', () => {
                const headers = getCorsHeaders({ 'Access-Control-Max-Age': '3600' });
                expect(headers['Access-Control-Max-Age']).toBe('3600');
        });
});

describe('handleCors', () => {
        it('should return 204 Response for OPTIONS', () => {
                const req = new Request('https://example.com', { method: 'OPTIONS' });
                const headers = getCorsHeaders();

                const response = handleCors(req, headers);

                expect(response).not.toBeNull();
                expect(response?.status).toBe(204);
        });

        it('should return null for non-OPTIONS requests', () => {
                const getReq = new Request('https://example.com', { method: 'GET' });
                const postReq = new Request('https://example.com', { method: 'POST' });
                const headers = getCorsHeaders();

                expect(handleCors(getReq, headers)).toBeNull();
                expect(handleCors(postReq, headers)).toBeNull();
        });
});

describe('parseAllowedOrigins', () => {
        it('should return default origins for empty value', () => {
                const origins = parseAllowedOrigins('');
                expect(origins).toContain('http://localhost:5173');
        });

        it('should return default origins for null/undefined', () => {
                expect(parseAllowedOrigins(null)).toContain('http://localhost:5173');
                expect(parseAllowedOrigins(undefined)).toContain('http://localhost:5173');
        });

        it('should parse comma-separated origins', () => {
                const origins = parseAllowedOrigins('https://a.com,https://b.com');
                expect(origins).toEqual(['https://a.com', 'https://b.com']);
        });

        it('should trim whitespace', () => {
                const origins = parseAllowedOrigins('  https://a.com , https://b.com  ');
                expect(origins).toEqual(['https://a.com', 'https://b.com']);
        });

        it('should filter empty strings', () => {
                const origins = parseAllowedOrigins('https://a.com,,https://b.com,');
                expect(origins).toEqual(['https://a.com', 'https://b.com']);
        });
});

describe('validateOrigin', () => {
        const allowedOrigins = ['https://app.example.com', 'https://admin.example.com'];

        it('should allow requests without Origin header', () => {
                const req = new Request('https://api.example.com');

                const result = validateOrigin(req, allowedOrigins);

                expect(result.allowed).toBe(true);
                expect(result.origin).toBeNull();
        });

        it('should allow requests from allowed origins', () => {
                const req = new Request('https://api.example.com', {
                        headers: { 'Origin': 'https://app.example.com' }
                });

                const result = validateOrigin(req, allowedOrigins);

                expect(result.allowed).toBe(true);
                expect(result.origin).toBe('https://app.example.com');
                expect(result.headers['Access-Control-Allow-Origin']).toBe('https://app.example.com');
        });

        it('should reject requests from unknown origins', () => {
                const req = new Request('https://api.example.com', {
                        headers: { 'Origin': 'https://malicious.com' }
                });

                const result = validateOrigin(req, allowedOrigins);

                expect(result.allowed).toBe(false);
                expect(result.origin).toBe('https://malicious.com');
                expect(result.headers['Access-Control-Allow-Origin']).toBe('null');
        });

        it('should include Vary header', () => {
                const req = new Request('https://api.example.com');

                const result = validateOrigin(req, allowedOrigins);

                expect(result.headers['Vary']).toBe('Origin');
        });

        it('should use default origins when empty array provided', () => {
                const req = new Request('https://api.example.com', {
                        headers: { 'Origin': 'http://localhost:5173' }
                });

                const result = validateOrigin(req, []);

                expect(result.allowed).toBe(true);
        });

        it('should merge overrides into headers', () => {
                const req = new Request('https://api.example.com');

                const result = validateOrigin(req, allowedOrigins, { 'X-Custom': 'value' });

                expect(result.headers['X-Custom']).toBe('value');
        });
});

describe('resolveCorsHeaders (deprecated)', () => {
        it('should return headers from validateOrigin', () => {
                const req = new Request('https://api.example.com');
                const allowedOrigins = ['https://app.example.com'];

                const headers = resolveCorsHeaders(req, allowedOrigins);

                expect(headers['Access-Control-Allow-Origin']).toBeDefined();
                expect(headers['Vary']).toBe('Origin');
        });
});

describe('createCorsErrorResponse', () => {
        it('should return 403 error response', async () => {
                const response = createCorsErrorResponse();

                expect(response.status).toBe(403);

                const body = await response.json();
                expect(body.success).toBe(false);
                expect(body.error.code).toBe('CORS_ORIGIN_NOT_ALLOWED');
        });

        it('should include requestId when provided', async () => {
                const response = createCorsErrorResponse('req-123');
                const body = await response.json();

                expect(body.requestId).toBe('req-123');
        });

        it('should merge custom headers', async () => {
                const response = createCorsErrorResponse('req-123', { 'X-Custom': 'value' });

                expect(response.headers.get('X-Custom')).toBe('value');
                expect(response.headers.get('Content-Type')).toBe('application/json');
        });
});
