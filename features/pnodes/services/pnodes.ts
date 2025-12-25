import { PNode } from '@/shared/types/pnode';
import { POD_CREDITS_API, GEOLOCATION_API } from '@/config/api';
import { getCached, setCache } from '@/infrastructure/rpc/client'; // Keep caching utils if generic
import { PodCreditsResponse, GeolocationData } from '../types/types'; // Removed ClusterNode/VoteAccountsResponse if unused
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
        // Using ip-api batch endpoint as per original code
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

// Helper to map RPC response to PNode structure
function mapRpcNodeToPNode(rpcNode: any, creditData: any, index: number, geoData?: GeolocationData, realStats?: any): PNode {
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
    // Using simple heuristic: if it has credits > 0 or recently seen
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
            cpuPercent: realStats?.cpu_percent ? realStats.cpu_percent : 0,
            memoryPercent: realStats?.ram_used && realStats?.ram_total && realStats.ram_total > 0
                ? (realStats.ram_used / realStats.ram_total) * 100
                : 0,
            storageUsedGB: rpcNode.storage_used ? rpcNode.storage_used / 1024 / 1024 / 1024 : 0,
            storageCapacityGB: rpcNode.storage_committed ? rpcNode.storage_committed / 1024 / 1024 / 1024 : 1000,
            responseTimeMs: 50 + (hash % 50), // Still no direct latency metric in stats, keep mock for now
        },
        performance,
        gossip: {
            peersConnected: realStats?.active_streams || 0, // Approx peers from streams?
            messagesReceived: realStats?.packets_received || 0,
            messagesSent: realStats?.packets_sent || 0,
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

export async function getClusterNodes(): Promise<PNode[]> {
    try {
        console.log('Fetching real pNode data via xandeum-prpc...');
        const client = getPrpcClient();

        // Parallel fetch of credits and nodes
        const [podCredits, rpcResponse] = await Promise.all([
            fetchPodCredits(),
            client.getPodsWithStats().catch(err => {
                console.warn('getPodsWithStats failed, falling back to getPods', err);
                return client.getPods();
            })
        ]);

        // Normalize response - getPodsWithStats returns { pods: [...] }
        // Type assertion may be needed depending on the library's exact return type
        const rpcPods = (rpcResponse as any)?.pods || (rpcResponse as any) || [];

        if (!Array.isArray(rpcPods)) {
            console.error('Invalid RPC response format', rpcPods);
            return [];
        }

        // Extract IPs for geolocation
        const ipsToFetch = rpcPods
            .map((pod: any) => pod.address?.split(':')[0])
            .filter((ip: string) => ip && ip !== '127.0.0.1' && ip !== 'localhost');

        const geoBatch = await fetchBatchGeolocation(ipsToFetch);

        // Fetch Real Stats for ALL nodes (Heavy Operation)
        console.log(`Starting batched stats fetch for ${rpcPods.length} nodes...`);
        // We'll map IP -> Stats
        const statsMap = new Map<string, any>();

        // Process in chunks of 50 to avoid total network saturation if list is huge,
        // but user said "forget performance", so we can be aggressive.
        // Let's do 20 concurrent interactions to be polite to the event loop.
        const CHUNK_SIZE = 20;
        for (let i = 0; i < rpcPods.length; i += CHUNK_SIZE) {
            const chunk = rpcPods.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(async (pod: any) => {
                const ip = pod.address?.split(':')[0];
                if (!ip) return;

                try {
                    // Create individual client for this node
                    // We assume default port logic or that the lib handles it via IP
                    const nodeClient = getPrpcClient(ip);
                    // Add timeout race? Library likely has timeout.
                    const stats = await nodeClient.getStats();
                    statsMap.set(pod.pubkey, stats);
                } catch (e) {
                    // Expected to fail for many nodes (offline/firewalled)
                    // console.debug(`Failed stats for ${ip}`, e);
                }
            }));
        }
        console.log(`Fetched stats for ${statsMap.size} nodes.`);


        // Map mapping for credits
        const creditMap = new Map<string, number>();
        if (podCredits?.pods_credits) {
            podCredits.pods_credits.forEach((pc) => {
                creditMap.set(pc.pod_id, pc.credits);
            });
        }

        const mappedNodes = rpcPods.map((rpcNode: any, index: number) => {
            const ip = rpcNode.address?.split(':')[0];
            const credits = creditMap.get(rpcNode.pubkey) || 0;
            const geo = ip ? geoBatch[ip] : undefined;
            const realStats = statsMap.get(rpcNode.pubkey);

            return mapRpcNodeToPNode(rpcNode, { credits }, index, geo, realStats);
        });

        // Sort by credits desc as default
        return mappedNodes.sort((a, b) => (b.credits || 0) - (a.credits || 0));

    } catch (error) {
        console.error('Failed to fetch pNodes via RPC:', error);
        return [];
    }
}

