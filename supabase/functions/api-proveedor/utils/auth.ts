/**
 * Auth helper para API proveedor (shared secret validation)
 */

export function validateApiSecret(request: Request): { valid: boolean; error?: string } {
    const apiSecret = Deno.env.get('API_PROVEEDOR_SECRET');
    
    if (!apiSecret) {
        return { valid: false, error: 'API_PROVEEDOR_SECRET no configurado en servidor' };
    }

    const providedSecret = request.headers.get('x-api-secret');
    
    if (!providedSecret) {
        return { valid: false, error: 'Header x-api-secret requerido' };
    }

    if (providedSecret !== apiSecret) {
        return { valid: false, error: 'x-api-secret invalido' };
    }

    return { valid: true };
}

export function createAuthErrorResponse(error: string, corsHeaders: Record<string, string>): Response {
    return new Response(
        JSON.stringify({
            success: false,
            error: { code: 'AUTH_FAILED', message: error }
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}
