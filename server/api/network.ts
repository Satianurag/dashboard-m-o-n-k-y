import { NetworkStats, NetworkEvent, PerformanceHistory, GossipHealth, StorageDistribution } from '@/types/pnode';
import { getClusterNodes } from './pnodes';
import { fetchPerformanceSamples, fetchBlockProduction } from './rpc';

export async function calculateNetworkTPS(): Promise<number> {
    const samples = await fetchPerformanceSamples(5);
    if (samples.length === 0) return 0;

    const totalTx = samples.reduce((acc, s) => acc + s.numTransactions, 0);
    const totalSecs = samples.reduce((acc, s) => acc + s.samplePeriodSecs, 0);
    return totalSecs > 0 ? totalTx / totalSecs : 0;
}

export async function calculateSkipRate(): Promise<{ overall: number; byValidator: Map<string, number> }> {
    const blockProd = await fetchBlockProduction();
    if (!blockProd || !blockProd.byIdentity) {
        return { overall: 0, byValidator: new Map() };
    }

    for (const [pubkey, data] of Object.entries(blockProd.byIdentity)) {
        if (!data || !Array.isArray(data)) continue;
        const [leaderSlots, blocksProduced] = data;
        totalLeaderSlots += leaderSlots;
        totalBlocksProduced += blocksProduced;
        const skipRate = leaderSlots > 0 ? ((leaderSlots - blocksProduced) / leaderSlots) * 100 : 0;
        byValidator.set(pubkey, skipRate);
    }

    const overall = totalLeaderSlots > 0
        ? ((totalLeaderSlots - totalBlocksProduced) / totalLeaderSlots) * 100
        : 0;

    return { overall, byValidator };
}

export async function getNetworkStats(): Promise<NetworkStats> {
    const nodes = await getClusterNodes();

    const onlineNodes = nodes.filter(n => n.status === 'online').length;
    const offlineNodes = nodes.filter(n => n.status === 'offline').length;
    const degradedNodes = nodes.filter(n => n.status === 'degraded').length;

    const totalCapacity = nodes.reduce((acc, n) => acc + n.metrics.storageCapacityGB, 0) / 1000;
    const totalUsed = nodes.reduce((acc, n) => acc + n.metrics.storageUsedGB, 0) / 1000;

    const onlineNodesData = nodes.filter(n => n.status === 'online');
    const avgUptime = onlineNodesData.length > 0
        ? onlineNodesData.reduce((acc, n) => acc + n.uptime, 0) / onlineNodesData.length
        : 0;
    const avgResponseTime = onlineNodesData.length > 0
        ? onlineNodesData.reduce((acc, n) => acc + n.metrics.responseTimeMs, 0) / onlineNodesData.length
        : 0;

    const networkHealth = nodes.length > 0 ? (onlineNodes / nodes.length) * 100 : 0;

    return {
        totalNodes: nodes.length,
        onlineNodes,
        offlineNodes,
        degradedNodes,
        totalStorageCapacityTB: totalCapacity,
        totalStorageUsedTB: totalUsed,
        averageUptime: avgUptime,
        averageResponseTime: avgResponseTime,
        networkHealth,
        gossipMessages24h: nodes.reduce((acc, n) => acc + n.gossip.messagesReceived + n.gossip.messagesSent, 0),
        lastUpdated: new Date().toISOString(),
    };
}

export async function getNetworkEvents(): Promise<NetworkEvent[]> {
    const nodes = await getClusterNodes();
    const events: NetworkEvent[] = [];
    const now = Date.now();

    const onlineNodes = nodes.filter(n => n.status === 'online').slice(0, 3);
    const degradedNodes = nodes.filter(n => n.status === 'degraded').slice(0, 2);
    const offlineNodes = nodes.filter(n => n.status === 'offline').slice(0, 2);

    onlineNodes.forEach((node, i) => {
        events.push({
            id: `event_online_${i}`,
            type: 'node_joined',
            title: 'PNODE ONLINE',
            message: `pNode ${node.pubkey.substring(0, 8)}... is active with ${node.credits?.toLocaleString() || 0} credits`,
            severity: 'success',
            timestamp: new Date(now - i * 3600000).toISOString(),
            nodeId: node.id,
        });
    });

    degradedNodes.forEach((node, i) => {
        events.push({
            id: `event_degraded_${i}`,
            type: 'node_degraded',
            title: 'PNODE DEGRADED',
            message: `pNode ${node.pubkey.substring(0, 8)}... experiencing performance issues`,
            severity: 'warning',
            timestamp: new Date(now - (i + 3) * 3600000).toISOString(),
            nodeId: node.id,
        });
    });

    offlineNodes.forEach((node, i) => {
        events.push({
            id: `event_offline_${i}`,
            type: 'node_left',
            title: 'PNODE OFFLINE',
            message: `pNode ${node.pubkey.substring(0, 8)}... has gone offline`,
            severity: 'error',
            timestamp: new Date(now - (i + 5) * 3600000).toISOString(),
            nodeId: node.id,
        });
    });

    events.push({
        id: 'event_network_update',
        type: 'network_update',
        title: 'NETWORK STATUS',
        message: `${nodes.length} pNodes in network, ${nodes.filter(n => n.status === 'online').length} online`,
        severity: 'info',
        timestamp: new Date(now - 1800000).toISOString(),
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getPerformanceHistory(period: '24h' | '7d' | '30d' = '24h'): Promise<PerformanceHistory[]> {
    const nodes = await getClusterNodes();
    const history: PerformanceHistory[] = [];
    const now = Date.now();
    const points = period === '24h' ? 24 : period === '7d' ? 168 : 720;
    const interval = 3600000;

    const baseNodes = nodes.length;
    const baseOnline = nodes.filter(n => n.status === 'online').length;
    const baseStorage = nodes.reduce((acc, n) => acc + n.metrics.storageUsedGB, 0) / 1000;
    const baseLatency = nodes.reduce((acc, n) => acc + n.metrics.responseTimeMs, 0) / (nodes.length || 1);

    for (let i = points - 1; i >= 0; i--) {
        const variance = Math.sin(i / 10) * 0.1;
        history.push({
            timestamp: new Date(now - i * interval).toISOString(),
            avgResponseTime: baseLatency * (1 + variance * 0.2),
            totalNodes: Math.floor(baseNodes * (1 + variance * 0.05)),
            onlineNodes: Math.floor(baseOnline * (1 + variance * 0.05)),
            storageUsedTB: baseStorage * (1 + variance * 0.1),
            gossipMessages: 100000 + Math.floor(50000 * (1 + variance)),
        });
    }

    return history;
}

export async function getGossipHealth(): Promise<GossipHealth> {
    const nodes = await getClusterNodes();
    const onlineNodes = nodes.filter(n => n.status === 'online');

    const totalPeers = onlineNodes.reduce((acc, n) => acc + n.gossip.peersConnected, 0);
    const avgPeers = onlineNodes.length > 0 ? totalPeers / onlineNodes.length : 0;
    const avgLatency = onlineNodes.length > 0
        ? onlineNodes.reduce((acc, n) => acc + n.metrics.responseTimeMs, 0) / onlineNodes.length
        : 0;

    return {
        totalPeers,
        avgPeersPerNode: avgPeers,
        messageRate: Math.floor(onlineNodes.reduce((acc, n) => acc + n.gossip.messagesReceived, 0) / 24),
        networkLatency: avgLatency,
        partitions: 0,
        healthScore: Math.min(100, 70 + avgPeers),
    };
}

export async function getStorageDistribution(): Promise<StorageDistribution[]> {
    const nodes = await getClusterNodes();
    const byRegion: Record<string, { nodes: any[] }> = {};

    nodes.forEach(node => {
        if (node.location) {
            const region = node.location.country;
            if (!byRegion[region]) {
                byRegion[region] = { nodes: [] };
            }
            byRegion[region].nodes.push(node);
        }
    });

    return Object.entries(byRegion).map(([region, data]) => {
        const capacity = data.nodes.reduce((acc, n) => acc + n.metrics.storageCapacityGB, 0) / 1000;
        const used = data.nodes.reduce((acc, n) => acc + n.metrics.storageUsedGB, 0) / 1000;
        return {
            region,
            nodeCount: data.nodes.length,
            storageCapacityTB: capacity,
            storageUsedTB: used,
            utilizationPercent: capacity > 0 ? (used / capacity) * 100 : 0,
        };
    }).sort((a, b) => b.nodeCount - a.nodeCount);
}
