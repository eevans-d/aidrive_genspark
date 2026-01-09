import { createLogger } from '../../_shared/logger.ts';

export type CacheReadOptions = {
    supabaseUrl?: string;
    serviceRoleKey?: string;
    forcePersistent?: boolean;
};

export type CacheWriteOptions = {
    supabaseUrl: string;
    serviceRoleKey: string;
    ttlSeconds: number;
    forcePersistent?: boolean;
    logMeta?: Record<string, unknown>;
};

const logger = createLogger('api-proveedor:cache');

export const API_CACHE = new Map<string, { data: any; timestamp: number; ttl: number }>();
const PERSISTENT_CACHE_TABLE = 'cache_proveedor';

export const IN_MEMORY_CACHE_TTL_MS: Record<string, number> = {
    status: 30000,
    health: 15000,
    precios: 60000,
    productos: 120000,
    alertas: 30000,
    estadisticas: 600000
};

export const PERSISTENT_CACHE_TTL_SECONDS: Record<string, number> = {
    precios: 86400,
    productos: 86400,
    status: 300,
    health: 300,
    alertas: 3600,
    estadisticas: 3600
};

export async function getFromAPICache(key: string, options: CacheReadOptions = {}): Promise<any | null> {
    const entry = API_CACHE.get(key);
    const now = Date.now();
    const isEntryValid = entry && now - entry.timestamp <= entry.ttl;
    if (entry && !isEntryValid) {
        API_CACHE.delete(key);
    }
    const memoryFallback = isEntryValid ? entry?.data : null;

    if (isEntryValid && !options.forcePersistent) {
        return entry?.data ?? null;
    }

    if (!options.supabaseUrl || !options.serviceRoleKey) {
        return memoryFallback;
    }

    const persistent = await readFromPersistentCache(key, options.supabaseUrl, options.serviceRoleKey);
    return persistent ?? memoryFallback;
}

function setInMemoryCache(key: string, data: any, ttl: number): void {
    if (API_CACHE.size > 500) {
        const oldestEntries = Array.from(API_CACHE.entries())
            .sort(([, a], [, b]) => a.timestamp - b.timestamp)
            .slice(0, 50);
        oldestEntries.forEach(([entryKey]) => API_CACHE.delete(entryKey));
    }
    API_CACHE.set(key, { data, timestamp: Date.now(), ttl });
}

export async function addToAPICache(key: string, data: any, ttl: number, options?: CacheWriteOptions): Promise<void> {
    const now = Date.now();
    const existing = API_CACHE.get(key);
    const memoryValid = existing && now - existing.timestamp <= existing.ttl;

    setInMemoryCache(key, data, ttl);

    if (!options) return;

    const shouldPersist = options.forcePersistent || !memoryValid;
    if (!shouldPersist) return;

    await writeToPersistentCache(
        key,
        data,
        options.ttlSeconds,
        options.supabaseUrl,
        options.serviceRoleKey,
        options.logMeta
    );
}

export async function invalidateRelatedCaches(categoria: string): Promise<number> {
    let invalidated = 0;
    const keysToDelete: string[] = [];
    for (const key of API_CACHE.keys()) {
        if (key.includes(`precios:${categoria}`) || key.includes(`productos:${categoria}`)) {
            keysToDelete.push(key);
        }
    }

    keysToDelete.forEach((cacheKey) => {
        API_CACHE.delete(cacheKey);
        invalidated++;
    });

    return invalidated;
}

async function writeToPersistentCache(
    key: string,
    payload: any,
    ttlSeconds: number,
    supabaseUrl: string,
    serviceRoleKey: string,
    logMeta: Record<string, unknown> = {}
): Promise<void> {
    try {
        const response = await fetch(
            `${supabaseUrl}/rest/v1/${PERSISTENT_CACHE_TABLE}?on_conflict=endpoint`,
            {
                method: 'POST',
                headers: {
                    apikey: serviceRoleKey,
                    Authorization: `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    Prefer: 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    endpoint: key,
                    payload,
                    ttl_seconds: ttlSeconds,
                    updated_at: new Date().toISOString()
                })
            }
        );

        if (!response.ok) {
            logger.warn('CACHE_PERSIST_FAILED', {
                ...logMeta,
                cache_key: key,
                status: response.status,
                status_text: response.statusText
            });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn('CACHE_PERSIST_FAILED', { ...logMeta, cache_key: key, error: errorMessage });
    }
}

async function readFromPersistentCache(
    key: string,
    supabaseUrl: string,
    serviceRoleKey: string
): Promise<any | null> {
    try {
        const params = new URLSearchParams({
            select: 'endpoint,payload,updated_at,ttl_seconds',
            endpoint: `eq.${key}`
        });
        const response = await fetch(`${supabaseUrl}/rest/v1/${PERSISTENT_CACHE_TABLE}?${params.toString()}`, {
            headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`
            }
        });

        if (!response.ok) {
            return null;
        }

        const rows = await response.json();
        const row = rows[0];
        if (!row) return null;

        const updatedAt = Date.parse(row.updated_at);
        const ageMs = Date.now() - updatedAt;
        const ttlMs = row.ttl_seconds * 1000;

        if (ageMs > ttlMs) {
            return null;
        }

        const remainingTtlMs = Math.max(ttlMs - ageMs, 0);
        setInMemoryCache(key, row.payload, remainingTtlMs);
        return row.payload;
    } catch (_error) {
        return null;
    }
}
