/**
 * Tipos para Routers modulares - api-minimarket
 * @module api-minimarket/routers/types
 */

import type { UserInfo } from '../helpers/auth.ts';

/**
 * Contexto compartido entre todos los handlers
 */
export interface RouterContext {
        // Request info
        req: Request;
        url: URL;
        path: string;
        method: string;
        requestId: string;

        // Path parameters extraídos (e.g., :id)
        pathParams?: Record<string, string>;

        // Supabase
        supabaseUrl: string;

        // Auth
        user: UserInfo | null;
        token: string | null;

        // Helpers
        requestHeaders: (extra?: Record<string, string>) => Record<string, string>;
        responseHeaders: Record<string, string>;

        // Response helpers
        respondOk: <T>(data: T, status?: number, options?: { message?: string; extra?: Record<string, unknown> }) => Response;
        respondFail: (code: string, message: string, status?: number, options?: { details?: unknown }) => Response;

        // Auth helpers
        checkRole: (allowedRoles: readonly string[]) => void;

        // Body parsing
        parseJsonBody: <T = Record<string, unknown>>() => Promise<T | Response>;

        // Pagination
        getPaginationOrFail: (defaultLimit: number, maxLimit: number) => { limit: number; offset: number } | Response;

        // Audit
        logAudit: (
                action: string,
                entidad_tipo: string,
                entidad_id: string,
                detalles?: Record<string, unknown>,
                nivel?: 'info' | 'warning' | 'critical'
        ) => Promise<void>;
}

/**
 * Handler de ruta individual
 */
export type RouteHandler = (ctx: RouterContext) => Promise<Response>;

/**
 * Definición de ruta
 */
export interface RouteDefinition {
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
        pattern: string | RegExp;
        handler: RouteHandler;
        extractParams?: (path: string) => Record<string, string> | null;
}

/**
 * Router modular
 */
export interface Router {
        routes: RouteDefinition[];
        match(method: string, path: string): { handler: RouteHandler; params: Record<string, string> } | null;
}

/**
 * Helper para crear un router
 */
export function createRouter(routes: RouteDefinition[]): Router {
        return {
                routes,
                match(method: string, path: string) {
                        for (const route of routes) {
                                if (route.method !== method) continue;

                                if (typeof route.pattern === 'string') {
                                        if (route.pattern === path) {
                                                return { handler: route.handler, params: {} };
                                        }
                                } else {
                                        const match = path.match(route.pattern);
                                        if (match) {
                                                const params = route.extractParams ? route.extractParams(path) : {};
                                                return { handler: route.handler, params: params || {} };
                                        }
                                }
                        }
                        return null;
                }
        };
}

/**
 * Helper para extraer ID de path como /entity/:id
 */
export function extractIdFromPath(path: string): Record<string, string> | null {
        const parts = path.split('/').filter(Boolean);
        if (parts.length >= 2) {
                return { id: parts[1] };
        }
        return null;
}

/**
 * Helper para extraer ID y acción de path como /entity/:id/action
 */
export function extractIdAndActionFromPath(path: string): Record<string, string> | null {
        const parts = path.split('/').filter(Boolean);
        if (parts.length >= 3) {
                return { id: parts[1], action: parts[2] };
        }
        return null;
}
