import { EndpointName } from './schemas.ts';
import { toAppError } from '../_shared/errors.ts';

export type EndpointContext = {
    supabaseUrl: string;
    supabaseAnonKey: string;
    serviceRoleKey: string;
    supabaseReadHeaders: Record<string, string>;
    apiSecret: string | null;
    url: URL;
    corsHeaders: Record<string, string>;
    isAuthenticated: boolean;
    requestLog: Record<string, unknown>;
    method: string;
    request: Request;
};

export type EndpointHandler = (context: EndpointContext) => Promise<Response>;
export type EndpointHandlerMap = Record<EndpointName, EndpointHandler>;

export async function routeRequest(
    endpoint: EndpointName,
    context: EndpointContext,
    handlers: EndpointHandlerMap
): Promise<Response> {
    const handler = handlers[endpoint];
    if (!handler) {
        throw toAppError(new Error(`Endpoint no soportado: ${endpoint}`), 'ENDPOINT_NOT_SUPPORTED', 404);
    }

    return handler(context);
}
