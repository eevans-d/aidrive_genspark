import { EndpointName } from './schemas.ts';

export type EndpointContext = {
    supabaseUrl: string;
    serviceRoleKey: string;
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
        throw new Error(`Endpoint no soportado: ${endpoint}`);
    }

    return handler(context);
}
