import { PNode } from '@/shared/types/pnode';
import { POD_CREDITS_API, GEOLOCATION_API } from '@/config/api';
import { fetchRPC, getCached, setCache } from '@/infrastructure/rpc/client';
import { ClusterNode, VoteAccountsResponse, PodCreditsResponse, GeolocationData } from '../types/types';
import { hashPubkey, generateDeterministicIP, getNodeLocation, getTier } from './utils';
import { supabase } from '@/infrastructure/supabase';


// Cache for merged node data
let mergedNodeDataCache: { data: Map<string, Partial<PNode>>; timestamp: number } | null = null;
const MERGED_CACHE_DURATION = 30000;

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

export async function fetchClusterNodes(): Promise<ClusterNode[]> {
    const result = await fetchRPC<ClusterNode[]>('getClusterNodes');
    return result || [];
}

export async function fetchVoteAccounts(): Promise<VoteAccountsResponse | null> {
    return fetchRPC<VoteAccountsResponse>('getVoteAccounts');
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

async function getMergedNodeData(): Promise<Map<string, Partial<PNode>>> {
    if (mergedNodeDataCache && Date.now() - mergedNodeDataCache.timestamp < MERGED_CACHE_DURATION) {
        return mergedNodeDataCache.data;
    }

    const nodeMap = new Map<string, Partial<PNode>>();

    const clusterNodes = await fetchClusterNodes();
    for (const node of clusterNodes) {
        const ip = node.gossip?.split(':')[0] || node.rpc?.split(':')[0] || '';
        const port = parseInt(node.gossip?.split(':')[1] || '8000');
        nodeMap.set(node.pubkey, {
            pubkey: node.pubkey,
            ip,
            port,
            version: node.version || '0.7.0',
        });
    }

    const voteAccounts = await fetchVoteAccounts();
    if (voteAccounts) {
        const allVotes = [...voteAccounts.current, ...voteAccounts.delinquent];
        for (const va of allVotes) {
            const existing = nodeMap.get(va.nodePubkey) || { pubkey: va.nodePubkey };
            const lastCredits = va.epochCredits.length > 0 ? va.epochCredits[va.epochCredits.length - 1] : [0, 0, 0];
            const epochCreditsDelta = lastCredits[1] - lastCredits[2];
            const apy = va.activatedStake > 0 ? (epochCreditsDelta / va.activatedStake) * 100 * 365 : 5;

            nodeMap.set(va.nodePubkey, {
                ...existing,
                staking: {
                    commission: va.commission,
                    delegatedStake: va.activatedStake,
                    activatedStake: va.activatedStake,
                    apy,
                    lastVote: va.lastVote,
                    rootSlot: va.rootSlot,
                }
            });
        }
    }

    mergedNodeDataCache = { data: nodeMap, timestamp: Date.now() };
    return nodeMap;
}

function mapSupabaseToPNode(row: any): PNode {
    return {
        id: `pnode_${row.credits_rank - 1}`,
        pubkey: row.pubkey,
        ip: row.ip,
        port: row.port,
        version: row.version,
        status: row.status as 'online' | 'offline' | 'degraded',
        uptime: row.uptime,
        lastSeen: row.last_seen,
        location: row.location,
        credits: row.credits,
        creditsRank: row.credits_rank,
        metrics: row.metrics,
        performance: row.performance,
        gossip: row.gossip,
        staking: row.staking,
        history: row.history || {
            uptimeHistory: [],
            latencyHistory: [],
            scoreHistory: [],
        },
    };
}

export async function getClusterNodes(): Promise<PNode[]> {
    try {
        // Try fetching from Supabase cache first
        const { data, error } = await supabase
            .from('pnodes')
            .select('*')
            .order('credits', { ascending: false });

        if (!error && data && data.length > 0) {
            console.log(`Fetched ${data.length} pNodes from Supabase cache.`);
            return data.map(mapSupabaseToPNode);
        }

        if (error) {
            console.warn('Supabase cache fetch error, falling back to client-side fetch:', error);
        }
    } catch (err) {
        console.error('Critical error fetching from Supabase cache:', err);
    }

    // Fallback to original client-side logic
    console.log('Using client-side fallback for pNode data.');

    // OPTIMIZATION: Parallel fetching instead of waterfall
    const [podCredits, mergedData] = await Promise.all([
        fetchPodCredits(),
        getMergedNodeData()
    ]);

    if (!podCredits || !podCredits.pods_credits) {
        return Array.from(mergedData.values()).map((node, i) =>
            transformClusterNodeToFull({ pubkey: node.pubkey as string }, i, node)
        );
    }

    const ipsToFetch = podCredits.pods_credits
        .map(pc => mergedData.get(pc.pod_id)?.ip)
        .filter((ip): ip is string => !!ip);

    const geoBatch = await fetchBatchGeolocation(ipsToFetch);

    return podCredits.pods_credits.map((pc, index) => {
        const realData = mergedData.get(pc.pod_id);
        const ip = realData?.ip || generateDeterministicIP(pc.pod_id);
        const geo = geoBatch[ip];

        if (geo && geo.status === 'success') {
            realData!.location = {
                country: geo.country || 'Unknown',
                countryCode: geo.countryCode || 'UN',
                city: geo.city || 'Unknown',
                lat: geo.lat || 0,
                lng: geo.lon || 0,
                datacenter: geo.org || 'Unknown',
                asn: geo.as?.split(' ')[0] || 'Unknown',
            };
        }

        return transformPodToFull(pc, index, realData);
    });
}

const MAX_CREDITS = 60000;

function transformPodToFull(
    pc: { credits: number; pod_id: string },
    index: number,
    realData?: Partial<PNode>
): PNode {
    const credits = pc.credits;
    const pubkey = pc.pod_id;
    const hash = hashPubkey(pubkey);

    const normalizedScore = Math.min(100, (credits / MAX_CREDITS) * 100);
    const performance = {
        score: normalizedScore,
        tier: getTier(normalizedScore)
    };

    const status = credits > 0 ? 'online' : 'offline';
    const location = realData?.location || getNodeLocation(pubkey, index);
    const ip = realData?.ip || generateDeterministicIP(pubkey);
    const port = realData?.port || 6000;
    const version = realData?.version || '0.7.0';

    const uptimeBase = credits > 0 ? 70 + (performance.score * 0.3) : 0;
    const cpuBase = status === 'online' ? 20 + (hash % 30) : 0;
    const memBase = status === 'online' ? 40 + (hash % 25) : 0;
    const latencyBase = status === 'online' ? 30 + (100 - performance.score) + (hash % 20) : 999;

    const staking = realData?.staking || {
        commission: (hash % 10),
        delegatedStake: credits * 100,
        activatedStake: credits * 90,
        apy: 5 + (performance.score / 50),
        lastVote: Date.now() - (100 - performance.score) * 1000,
        rootSlot: 85000000 + index,
    };

    return {
        id: `pnode_${index}`,
        pubkey,
        ip,
        port,
        version,
        status,
        uptime: uptimeBase,
        lastSeen: new Date().toISOString(),
        location,
        credits,
        creditsRank: index + 1,
        metrics: {
            cpuPercent: cpuBase,
            memoryPercent: memBase,
            storageUsedGB: 100 + (hash % 400),
            storageCapacityGB: [1000, 2000, 4000, 8000][(hash + index) % 4],
            responseTimeMs: latencyBase,
        },
        performance,
        gossip: {
            peersConnected: status === 'online' ? 10 + (hash % 40) : 0,
            messagesReceived: credits * 10,
            messagesSent: credits * 8,
        },
        staking,
        history: {
            uptimeHistory: Array.from({ length: 30 }, (_, i) =>
                Math.max(0, uptimeBase + Math.sin(i * 0.5) * 5)
            ),
            latencyHistory: Array.from({ length: 30 }, (_, i) =>
                Math.max(10, latencyBase + Math.cos(i * 0.3) * 10)
            ),
            scoreHistory: Array.from({ length: 30 }, (_, i) =>
                Math.max(0, performance.score + Math.sin(i * 0.5) * 5)
            ),
        },
    };
}

function transformClusterNodeToFull(
    node: ClusterNode,
    index: number,
    realData?: Partial<PNode>
): PNode {
    const pubkey = node.pubkey;
    const hash = hashPubkey(pubkey);
    const location = realData?.location || getNodeLocation(pubkey, index);
    const ip = node.gossip?.split(':')[0] || node.rpc?.split(':')[0] || generateDeterministicIP(pubkey);

    return {
        id: `pnode_${index}`,
        pubkey,
        ip,
        port: parseInt(node.gossip?.split(':')[1] || '8899'),
        version: node.version || '0.7.0',
        status: 'online',
        uptime: 80 + (hash % 20),
        lastSeen: new Date().toISOString(),
        location,
        metrics: {
            cpuPercent: 20 + (hash % 30),
            memoryPercent: 40 + (hash % 25),
            storageUsedGB: 100 + (hash % 400),
            storageCapacityGB: 1000,
            responseTimeMs: 50 + (hash % 50),
        },
        performance: {
            score: 60 + (hash % 40),
            tier: getTier(60 + (hash % 40)),
        },
        gossip: {
            peersConnected: 10 + (hash % 40),
            messagesReceived: 10000 + (hash % 50000),
            messagesSent: 8000 + (hash % 40000),
        },
        staking: realData?.staking || {
            commission: hash % 10,
            delegatedStake: 10000 + (hash % 100000),
            activatedStake: 9000 + (hash % 90000),
            apy: 5 + (hash % 30) / 10,
            lastVote: Date.now() - (hash % 10000),
            rootSlot: 85000000 + index,
        },
        history: {
            uptimeHistory: Array.from({ length: 30 }, () => 80 + (hash % 20)),
            latencyHistory: Array.from({ length: 30 }, () => 50 + (hash % 50)),
            scoreHistory: Array.from({ length: 30 }, () => 60 + (hash % 40)),
        },
    };
}
