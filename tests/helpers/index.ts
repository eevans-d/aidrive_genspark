/**
 * Test Helpers
 * 
 * Common utilities for testing including:
 * - Mock setup functions
 * - Custom assertions
 * - Response helpers
 */

import { vi, expect } from 'vitest';

// ============================================================================
// FETCH MOCK HELPERS
// ============================================================================

/**
 * Creates a mock fetch function and returns it.
 * Use in beforeEach/afterEach for consistent mocking.
 */
export function createMockFetch() {
        return vi.fn();
}

/**
 * Creates a mock Response object
 */
export function createMockResponse(
        body: unknown,
        options: { status?: number; headers?: Record<string, string> } = {}
): Response {
        const { status = 200, headers = {} } = options;

        return new Response(JSON.stringify(body), {
                status,
                headers: {
                        'Content-Type': 'application/json',
                        ...headers
                }
        });
}

/**
 * Creates a success API response
 */
export function createApiSuccessResponse(data: unknown): Response {
        return createMockResponse({ success: true, data });
}

/**
 * Creates an error API response
 */
export function createApiErrorResponse(
        code: string,
        message: string,
        status = 400
): Response {
        return createMockResponse(
                { success: false, error: { code, message } },
                { status }
        );
}

// ============================================================================
// CUSTOM ASSERTIONS
// ============================================================================

/**
 * Assert that a response is a successful API response
 */
export async function expectSuccessResponse(response: Response): Promise<{ data: unknown }> {
        expect(response.ok).toBe(true);

        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data).toBeDefined();

        return body;
}

/**
 * Assert that a response is an error API response
 */
export async function expectErrorResponse(
        response: Response,
        expectedCode?: string
): Promise<{ error: { code: string; message: string } }> {
        expect(response.ok).toBe(false);

        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toBeDefined();

        if (expectedCode) {
                expect(body.error.code).toBe(expectedCode);
        }

        return body;
}

/**
 * Assert that an array has a specific length
 */
export function expectArrayLength<T>(arr: T[], expectedLength: number): void {
        expect(Array.isArray(arr)).toBe(true);
        expect(arr.length).toBe(expectedLength);
}

/**
 * Assert that a value is a valid UUID
 */
export function expectValidUUID(value: string): void {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(uuidRegex.test(value)).toBe(true);
}

/**
 * Assert that a value is a valid ISO date string
 */
export function expectValidISODate(value: string): void {
        const date = new Date(value);
        expect(date.toISOString()).toBe(value);
}

// ============================================================================
// TIMING HELPERS
// ============================================================================

/**
 * Wait for a specific duration (use sparingly in tests)
 */
export function wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Measure execution time of an async function
 */
export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
        const start = performance.now();
        const result = await fn();
        const durationMs = performance.now() - start;
        return { result, durationMs };
}

// ============================================================================
// REQUEST HELPERS
// ============================================================================

/**
 * Create a mock Request object
 */
export function createMockRequest(
        url: string,
        options: {
                method?: string;
                headers?: Record<string, string>;
                body?: unknown;
        } = {}
): Request {
        const { method = 'GET', headers = {}, body } = options;

        return new Request(url, {
                method,
                headers: {
                        'Content-Type': 'application/json',
                        ...headers
                },
                body: body ? JSON.stringify(body) : undefined
        });
}
