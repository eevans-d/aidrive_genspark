import { EndpointName, endpointSchemas } from './schemas.ts';
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

    const schema = endpointSchemas[endpoint];
    if (schema && !schema.allowedMethods.includes(context.method)) {
        throw toAppError(
            new Error(`Método ${context.method} no permitido en /${endpoint}. Permitidos: ${schema.allowedMethods.join(', ')}`),
            'METHOD_NOT_ALLOWED',
            405
        );
    }

    return handler(context);
}
