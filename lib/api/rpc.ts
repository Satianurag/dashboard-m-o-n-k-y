import { CACHE_DURATION, DEVNET_RPC } from './config';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache: Map<string, CacheEntry<unknown>> = new Map();

export function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
        return entry.data as T;
    }
    return null;
}

export function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
}

export async function fetchRPC<T>(method: string, params: unknown[] = []): Promise<T | null> {
    const cacheKey = `rpc_${method}_${JSON.stringify(params)}`;
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(DEVNET_RPC, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method,
                params,
            }),
        });

        if (!response.ok) return null;
        const json = await response.json();
        const result = json.result as T;

        if (result) {
            setCache(cacheKey, result);
        }

        return result;
    } catch (error) {
        console.error(`RPC error (${method}):`, error);
        return null;
    }
}

export async function fetchBlockProduction(): Promise<import('./types').BlockProductionResponse | null> {
    return fetchRPC<import('./types').BlockProductionResponse>('getBlockProduction');
}

export async function fetchPerformanceSamples(limit: number = 10): Promise<import('./types').PerformanceSample[]> {
    const result = await fetchRPC<import('./types').PerformanceSample[]>('getPerformanceSamples', [limit]);
    return result || [];
}
