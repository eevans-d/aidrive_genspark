export async function fetchWithRetry(url: string, options: any, maxRetries: number, baseDelay: number, timeoutMs = 10000): Promise<Response> {
    let lastError: Error;

    for (let i = 0; i <= maxRetries; i++) {
        try {
            const response = await fetchWithTimeout(url, options, timeoutMs);
            if (response.ok) return response;

            if (!isRetryableStatusCode(response.status)) {
                return response;
            }

            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
            lastError = error as Error;
            if (!isRetryableAPIError(lastError)) {
                throw lastError;
            }
        }

        if (i < maxRetries) {
            const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
}

function isRetryableStatusCode(status: number): boolean {
    return status >= 500 || status === 429;
}

export async function fetchWithTimeout(url: string, options: any, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

export function isRetryableAPIError(error: Error): boolean {
    const retryableErrors = [
        'timeout',
        'network',
        'connection',
        'rate limit',
        'temporalmente no disponible',
        '503',
        '502',
        '504'
    ];

    return retryableErrors.some(
        (keyword) =>
            error.message.toLowerCase().includes(keyword) ||
            error.message.includes('503') ||
            error.message.includes('502') ||
            error.message.includes('504')
    );
}
