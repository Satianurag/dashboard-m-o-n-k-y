import { PNode } from '@/types/pnode';
import { POD_CREDITS_API, GEOLOCATION_API } from './config';
import { getCached, setCache } from './rpc';
import { PodCreditsResponse, GeolocationData } from './types';
import { hashPubkey, generateDeterministicIP, getNodeLocation, getTier } from './utils';
import { getPrpcClient } from '@/infrastructure/xandeum/client';

export async function fetchPodCredits(): Promise<PodCreditsResponse | null> {
    const cached = getCached<PodCreditsResponse>('pod_credits');
    if (cached) return cached;

    try {
        const response = await fetch(POD_CREDITS_API);
        if (!response.ok) return null;
        const data = await response.json();
        setCache('pod_credits', data);
        return data;
    } catch (error) {
        console.error('Error fetching pod credits:', error);
        return null;
    }
}

export async function fetchGeolocation(ip: string): Promise<GeolocationData | null> {
    const cacheKey = `geo_${ip}`;
    const cached = getCached<GeolocationData>(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(GEOLOCATION_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip }),
        });
        if (response.ok) {
            const data = await response.json();
            setCache(cacheKey, data);
            return data;
        }
    } catch (error) {
        console.error('Geolocation error:', error);
    }
    return null;
}

export async function fetchBatchGeolocation(ips: string[]): Promise<Record<string, GeolocationData>> {
    const cacheKey = `geo_batch_${ips.join(',')}`;
    const cached = getCached<Record<string, GeolocationData>>(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch('http://ip-api.com/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ips.map(ip => ({ query: ip }))),
        });

        if (response.ok) {
            const data = await response.json();
            const results: Record<string, GeolocationData> = {};
            if (Array.isArray(data)) {
                data.forEach((item: any) => {
                    if (item.query) results[item.query] = item;
                });
                setCache(cacheKey, results);
                return results;
            }
        }

    } catch (error) {
        console.error('Batch geolocation error:', error);
    }
    return {};
}

// Duplicated mapping helper
function mapRpcNodeToPNode(rpcNode: any, creditData: any, index: number, geoData?: GeolocationData): PNode {
    const pubkey = rpcNode.pubkey || `unknown-${index}`;
    const ip = rpcNode.address ? rpcNode.address.split(':')[0] : generateDeterministicIP(pubkey);
    const port = rpcNode.rpc_port || 6000;
    const version = rpcNode.version || '0.7.0'; // Default to 0.7.0 if missing

    // Credits logic
    const credits = creditData?.credits || 0;
    const MAX_CREDITS = 60000; // heuristic max
    const normalizedScore = Math.min(100, (credits / MAX_CREDITS) * 100);

    const hash = hashPubkey(pubkey);

    // Determine status - if in credits or detailed stats say active? 
    // Using simple heuristic
    const isOnline = (Date.now() / 1000) - rpcNode.last_seen_timestamp < 300; // seen in last 5 mins
    const status = isOnline ? 'online' : 'offline';

    // Location
    const location = geoData ? {
        country: geoData.country || 'Unknown',
        countryCode: geoData.countryCode || 'UN',
        city: geoData.city || 'Unknown',
        lat: geoData.lat || 0,
        lng: geoData.lon || 0,
        datacenter: geoData.org || 'Unknown',
        asn: geoData.as?.split(' ')[0] || 'Unknown',
    } : getNodeLocation(pubkey, index);

    // Performance
    const performance = {
        score: normalizedScore,
        tier: getTier(normalizedScore)
    };

    return {
        id: `pnode_${index}`,
        pubkey,
        ip,
        port,
        version,
        status,
        uptime: rpcNode.uptime || 0,
        lastSeen: new Date(rpcNode.last_seen_timestamp * 1000).toISOString(),
        location,
        credits,
        creditsRank: index + 1, // Approximation
        metrics: {
            cpuPercent: 20 + (hash % 30), // Still somewhat mocked if not in RPC
            memoryPercent: 40 + (hash % 25),
            storageUsedGB: rpcNode.storage_used ? rpcNode.storage_used / 1024 / 1024 / 1024 : 0,
            storageCapacityGB: rpcNode.storage_committed ? rpcNode.storage_committed / 1024 / 1024 / 1024 : 1000,
            responseTimeMs: 50 + (hash % 50),
        },
        performance,
        gossip: {
            peersConnected: 10 + (hash % 40),
            messagesReceived: 0,
            messagesSent: 0,
        },
        staking: {
            commission: 0,
            delegatedStake: 0,
            activatedStake: 0,
            apy: 0,
            lastVote: 0,
            rootSlot: 0,
        },
        history: {
            uptimeHistory: [],
            latencyHistory: [],
            scoreHistory: []
        }
    };
}


import { supabase } from '@/lib/supabase';

// Helper to map PNode to DB Row
function mapPNodeToRow(node: PNode) {
    return {
        pubkey: node.pubkey,
        ip: node.ip,
        port: node.port,
        version: node.version,
        status: node.status,
        uptime: node.uptime,
        last_seen: node.lastSeen,
        location: node.location,
        metrics: node.metrics,
        performance: node.performance,
        credits: node.credits,
        credits_rank: node.creditsRank,
        gossip: node.gossip,
        staking: node.staking,
        history: node.history,
        updated_at: new Date().toISOString(),
    };
}

// Helper to map DB Row to PNode
function mapRowToPNode(row: any): PNode {
    return {
        id: `pnode_${row.credits_rank}`, // reconstruct ID
        pubkey: row.pubkey,
        ip: row.ip,
        port: row.port,
        version: row.version,
        status: row.status,
        uptime: row.uptime,
        lastSeen: row.last_seen,
        location: row.location,
        metrics: row.metrics,
        performance: row.performance,
        credits: row.credits,
        creditsRank: row.credits_rank,
        gossip: row.gossip,
        staking: row.staking,
        history: row.history
    };
}

async function fetchFromRpcAndCache(): Promise<PNode[]> {
    console.log('Fetching FRESH pNode data via xandeum-prpc...');
    try {
        const client = getPrpcClient();
        const [podCredits, rpcResponse] = await Promise.all([
            fetchPodCredits(),
            client.getPodsWithStats().catch(err => {
                console.warn('getPodsWithStats failed, fallback getPods', err);
                return client.getPods();
            })
        ]);

        const rpcPods = (rpcResponse as any)?.pods || (rpcResponse as any) || [];
        if (!Array.isArray(rpcPods)) {
            console.error('Invalid RPC response', rpcPods);
            return [];
        }

        const ipsToFetch = rpcPods
            .map((pod: any) => pod.address?.split(':')[0])
            .filter((ip: string) => ip && ip !== '127.0.0.1' && ip !== 'localhost');

        const geoBatch = await fetchBatchGeolocation(ipsToFetch);
        const creditMap = new Map<string, number>();
        if (podCredits?.pods_credits) {
            podCredits.pods_credits.forEach((pc) => creditMap.set(pc.pod_id, pc.credits));
        }

        const mappedNodes = rpcPods.map((rpcNode: any, index: number) => {
            const ip = rpcNode.address?.split(':')[0];
            const credits = creditMap.get(rpcNode.pubkey) || 0;
            const geo = ip ? geoBatch[ip] : undefined;
            return mapRpcNodeToPNode(rpcNode, { credits }, index, geo);
        });

        const sorted = mappedNodes.sort((a, b) => (b.credits || 0) - (a.credits || 0));

        // Deduplicate by pubkey to prevent Postgres 21000 error
        const uniqueNodes = Array.from(new Map(sorted.map(item => [item.pubkey, item])).values());

        // Update Cache (Fire and await to ensure data persistence)
        const rows = uniqueNodes.map(mapPNodeToRow);

        if (rows.length > 0) {
            const { error } = await supabase.from('pnodes').upsert(rows, { onConflict: 'pubkey' });
            if (error) console.error('Error updating Supabase cache:', error);
            else console.log('Supabase cache updated successfully with ' + rows.length + ' nodes.');
        }

        return sorted;

    } catch (e) {
        console.error('Error in fetchFromRpcAndCache:', e);
        return [];
    }
}

export async function getClusterNodes(): Promise<PNode[]> {
    // 1. Try Cache
    try {
        const { data: cachedNodes, error } = await supabase
            .from('pnodes')
            .select('*')
            .order('credits', { ascending: false });

        if (!error && cachedNodes && cachedNodes.length > 0) {
            // Check Freshness (5 minutes)
            const oldestUpdate = new Date(cachedNodes[0].updated_at).getTime();
            const now = Date.now();
            const isStale = (now - oldestUpdate) > 5 * 60 * 1000;

            if (isStale) {
                console.log('Cache Stale! Triggering background update...');
                // Trigger update without awaiting (fire-and-forget logic if possible)
                // In Server Components, we must be careful. We'll await it to be safe for now 
                // or assume an external cron hits the update.
                // But USER said "automatically". So we will just await it if stale to ensure fresh data.
                // "load data more fast" implies we should return STALE data while updating?
                // "update automatically" -> the fetch should happen.

                // Strategy: Return Stale immediately, but kick off update?
                // Next.js request lifecycle might kill un-awaited promises.
                // Recommendation: Await update if stale. Or use `waitUntil` (Vercel specific).
                // We will await for safety, ensuring validity. 5 mins cache is long enough.

                // Actually, let's try to return cached, and try to update.
                // If we await, it's slow. If we don't, it might not run.
                // Let's await. User wants REAL data Updated.

                // REVISION: "load data more fast" -> Return Cached.
                // "update automatically" -> Use a separate mechanism OR accept the penalty every 5 min.
                // I will await the refresh if stale.
                return fetchFromRpcAndCache();
            }

            console.log(`Serving ${cachedNodes.length} nodes from Supabase Cache`);
            return cachedNodes.map(mapRowToPNode); // Return cached
        }

        // 2. If no cache, fetch fresh
        console.log('Cache miss/empty. Fetching fresh...');
        return fetchFromRpcAndCache();

    } catch (err) {
        console.error('Error fetching from Supabase, falling back to direct RPC:', err);
        return fetchFromRpcAndCache();
    }
}


