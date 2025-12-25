import { PNode } from '@/types/pnode';
import { POD_CREDITS_API } from './config';
import { supabase } from '@/lib/supabase';
import { PodCreditsResponse, GeolocationData } from './types';
import { hashPubkey } from './utils';
import { getPrpcClient } from '@/infrastructure/xandeum/client';

// Simple in-memory cache for geolocation to avoid hitting rate limits too hard during dev
const geoCache = new Map<string, GeolocationData>();

export async function fetchPodCredits(): Promise<PodCreditsResponse | null> {
    try {
        // We do not cache this here for long; we want fresh data during ingestion.
        const response = await fetch(POD_CREDITS_API, { next: { revalidate: 60 } });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error fetching pod credits:', error);
        return null;
    }
}

export async function fetchBatchGeolocation(ips: string[]): Promise<Record<string, GeolocationData>> {
    // Filter out IPs we already have in cache
    const uncachedIps = ips.filter(ip => !geoCache.has(ip));

    // Limits: ip-api batch is max 100.
    const chunks = [];
    for (let i = 0; i < uncachedIps.length; i += 100) {
        chunks.push(uncachedIps.slice(i, i + 100));
    }

    const results: Record<string, GeolocationData> = {};

    for (const chunk of chunks) {
        try {
            const response = await fetch('http://ip-api.com/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(chunk.map(ip => ({ query: ip }))),
            });

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    data.forEach((item: any) => {
                        if (item.query && item.status === 'success') {
                            geoCache.set(item.query, item);
                            results[item.query] = item;
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Batch geolocation error:', error);
        }
    }

    // Merge with existing cache for the return value
    ips.forEach(ip => {
        if (geoCache.has(ip)) {
            results[ip] = geoCache.get(ip)!;
        }
    });

    return results;
}

// Map RPC Data to PNode structure (Strictly Real Data)
function mapRpcNodeToPNode(rpcNode: any, creditData: any, index: number, geoData?: GeolocationData): PNode {
    const pubkey = rpcNode.pubkey || `unknown-${index}`;
    // Use real IP if available.
    // If strict mode, we do NOT generate fake IPs.
    const ip = rpcNode.address ? rpcNode.address.split(':')[0] : null;
    const port = rpcNode.rpc_port || null;
    const version = rpcNode.version || 'Unknown';

    // Credits
    const credits = creditData?.credits || 0;

    // Status Logic: Based on last_seen
    // If last_seen is within 5 minutes, it's online.
    const nowSec = Math.floor(Date.now() / 1000);
    const lastSeenTimestamp = rpcNode.last_seen_timestamp || 0;
    const isOnline = (nowSec - lastSeenTimestamp) < 300;
    const status = isOnline ? 'online' : 'offline';

    // Location (Real or Null)
    const location = geoData ? {
        country: geoData.country || 'Unknown',
        countryCode: geoData.countryCode || 'UN',
        city: geoData.city || 'Unknown',
        lat: geoData.lat || 0,
        lng: geoData.lon || 0,
        datacenter: geoData.org || 'Unknown',
        asn: geoData.as?.split(' ')[0] || 'Unknown',
    } : {
        country: 'Unknown',
        countryCode: 'UN',
        city: 'Unknown',
        lat: 0,
        lng: 0,
        datacenter: 'Unknown',
        asn: 'Unknown'
    };

    // Metrics (Real or 0)
    // We cannot fake CPU/Memory if we want "No BS".
    // If RPC doesn't provide it, we set to 0 and maybe UI handles it as "N/A"
    const storageUsed = rpcNode.storage_used ? rpcNode.storage_used / 1024 / 1024 / 1024 : 0;
    const storageCapacity = rpcNode.storage_committed ? rpcNode.storage_committed / 1024 / 1024 / 1024 : 0;

    return {
        id: `pnode_${pubkey}`, // Stable ID based on pubkey
        pubkey,
        ip: ip || 'Unknown',
        port: port || 0,
        version,
        status,
        uptime: rpcNode.uptime || 0, // RPC uptime
        lastSeen: new Date(lastSeenTimestamp * 1000).toISOString(),
        location,
        credits,
        creditsRank: 0, // Will calculate after sorting
        metrics: {
            cpuPercent: 0, // Not available in RPC
            memoryPercent: 0, // Not available in RPC
            storageUsedGB: storageUsed,
            storageCapacityGB: storageCapacity,
            responseTimeMs: 0, // We could measure ping, but for now 0
        },
        performance: {
            score: 0, // TBD based on metrics
            tier: 'fair'
        },
        gossip: {
            peersConnected: 0, // Not available in RPC usually
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


/**
 * Ingests data from RPC sources and updates Supabase.
 * This is the SOURCE OF TRUTH updater.
 */
export async function ingestNodeData() {
    console.log('Starting Ingestion...');

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
            return;
        }

        // 1. Get IPs for Geolocation
        const ipsToFetch = rpcPods
            .map((pod: any) => pod.address?.split(':')[0])
            .filter((ip: string) => ip && ip !== '127.0.0.1' && ip !== 'localhost' && ip !== '0.0.0.0');

        const geoBatch = await fetchBatchGeolocation(ipsToFetch);

        // 2. Prepare Credit Map
        const creditMap = new Map<string, number>();
        if (podCredits?.pods_credits) {
            podCredits.pods_credits.forEach((pc) => creditMap.set(pc.pod_id, pc.credits));
        }

        // 3. Map Data
        let pnodes = rpcPods.map((rpcNode: any, index: number) => {
            const ip = rpcNode.address?.split(':')[0];
            const credits = creditMap.get(rpcNode.pubkey) || 0;
            const geo = ip ? geoBatch[ip] : undefined;
            return mapRpcNodeToPNode(rpcNode, { credits }, index, geo);
        });

        // 3.5 Deduplicate
        const uniqueNodes = Array.from(new Map(pnodes.map(item => [item.pubkey, item])).values());

        // 4. Calculate Ranks
        uniqueNodes.sort((a, b) => b.credits - a.credits);
        uniqueNodes.forEach((node, index) => {
            node.creditsRank = index + 1;
        });

        // 5. Prepare Payload
        const rows = uniqueNodes.map(node => ({
            id: node.id,
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
        }));

        // 6. Upsert to Supabase
        if (rows.length > 0) {
            const { error } = await supabase.from('pnodes').upsert(rows);
            if (error) {
                console.error('Supabase Upsert Error:', error);
                throw error;
            }
            console.log(`Ingested ${rows.length} pNodes.`);

            // 7. Aggegate and Update Network Stats
            // we query the DB for the TOTAL state to ensure consistency between dashboard and list view.
            const { count: dbTotalNodes, error: countError } = await supabase
                .from('pnodes')
                .select('*', { count: 'exact', head: true });

            const { count: dbOnlineNodes, error: onlineError } = await supabase
                .from('pnodes')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'online');

            const { count: dbOfflineNodes, error: offlineError } = await supabase
                .from('pnodes')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'offline');

            if (countError) console.error('Error counting total nodes:', countError);
            if (onlineError) console.error('Error counting online nodes:', onlineError);
            if (offlineError) console.error('Error counting offline nodes:', offlineError);

            const totalNodes = dbTotalNodes ?? rows.length;
            const onlineNodes = dbOnlineNodes ?? rows.filter(r => r.status === 'online').length;
            const offlineNodes = dbOfflineNodes ?? rows.filter(r => r.status === 'offline').length;

            // Metrics from the current batch are still useful for averages of *active* nodes
            // But ideally we'd aggregation on DB. For now, batch metrics are a good approximation for active stats.
            const totalStorage = rows.reduce((acc, r) => acc + (r.metrics.storageCapacityGB || 0), 0) / 1000; // TB
            const totalUsed = rows.reduce((acc, r) => acc + (r.metrics.storageUsedGB || 0), 0) / 1000; // TB
            const avgUptime = totalNodes > 0 ? rows.reduce((acc, r) => acc + (r.uptime || 0), 0) / rows.length : 0;

            const statsRow = {
                total_nodes: totalNodes,
                online_nodes: onlineNodes,
                offline_nodes: offlineNodes,
                total_storage_tb: totalStorage,
                total_storage_used_tb: totalUsed,
                avg_uptime: avgUptime,
                avg_response_time: 0, // Need meaningful metric
                network_health: totalNodes > 0 ? (onlineNodes / totalNodes) * 100 : 0,
                gossip_messages_24h_count: 0,
                updated_at: new Date().toISOString()
            };

            const { error: statsError } = await supabase.from('network_stats').insert(statsRow);
            if (statsError) console.error('Stats Insert Error:', statsError);

        }

        return pnodes;

    } catch (err) {
        console.error('Ingestion Failed:', err);
        throw err;
    }
}

/**
 * Gets nodes from Supabase. 
 * If table is empty or stale by > 5 mins, triggers ingestion (blocking or bg).
 */
export async function getClusterNodes(): Promise<PNode[]> {
    const { data: cachedNodes, error } = await supabase
        .from('pnodes')
        .select('*')
        .order('credits', { ascending: false });

    // Check if we need to ingest
    let needsUpdate = false;
    if (error || !cachedNodes || cachedNodes.length === 0) {
        needsUpdate = true;
    } else {
        const lastUpdate = new Date(cachedNodes[0].updated_at).getTime();
        const diff = Date.now() - lastUpdate;
        if (diff > 5 * 60 * 1000) {
            needsUpdate = true;
            console.log('Data stale (> 5m). Triggering update.');
        }
    }

    if (needsUpdate) {
        // We will AWAIT ingestion to ensure user gets data. 
        // For production, we might want to return stale data and update in background,
        // but user requested "Real Data" and "Fresh".
        console.log('Fetching fresh data...');
        const freshNodes = await ingestNodeData();
        return freshNodes || [];
    }

    // Map rows back to PNode
    return cachedNodes!.map(row => ({
        id: row.id,
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
    }));
}
