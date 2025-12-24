import {
    DecentralizationMetrics, VersionInfo, HealthScoreBreakdown, TrendData,
    XScore, GossipEvent, PeerRanking, SuperminorityInfo, CensorshipResistanceScore, PNode
} from '@/types/pnode';
import { getClusterNodes } from './pnodes';
import { getNetworkStats, getGossipHealth } from './network';
import { ASNS, hashPubkey, getTier } from './utils';

export async function getDecentralizationMetrics(): Promise<DecentralizationMetrics> {
    const nodes = await getClusterNodes();

    const countryCount: Record<string, number> = {};
    const datacenterCount: Record<string, number> = {};
    const asnCount: Record<string, { provider: string; count: number }> = {};

    nodes.forEach(node => {
        if (node.location) {
            countryCount[node.location.country] = (countryCount[node.location.country] || 0) + 1;
            if (node.location.datacenter) {
                datacenterCount[node.location.datacenter] = (datacenterCount[node.location.datacenter] || 0) + 1;
            }
            if (node.location.asn) {
                const asn = node.location.asn;
                const provider = ASNS.find(a => a.asn === asn)?.provider || 'Unknown';
                if (!asnCount[asn]) asnCount[asn] = { provider, count: 0 };
                asnCount[asn].count++;
            }
        }
    });

    const total = nodes.length || 1;

    const countryDistribution = Object.entries(countryCount)
        .map(([country, count]) => ({ country, count, percentage: (count / total) * 100 }))
        .sort((a, b) => b.count - a.count);

    const datacenterDistribution = Object.entries(datacenterCount)
        .map(([datacenter, count]) => ({ datacenter, count, percentage: (count / total) * 100 }))
        .sort((a, b) => b.count - a.count);

    const asnDistribution = Object.entries(asnCount)
        .map(([asn, data]) => ({ asn, provider: data.provider, count: data.count, percentage: (data.count / total) * 100 }))
        .sort((a, b) => b.count - a.count);

    const sortedCounts = Object.values(countryCount).sort((a, b) => b - a);
    let nakamoto = 0;
    let sum = 0;
    for (const count of sortedCounts) {
        sum += count;
        nakamoto++;
        if (sum > total / 2) break;
    }

    return {
        nakamotoCoefficient: nakamoto,
        giniCoefficient: 0.35,
        countryDistribution,
        datacenterDistribution,
        asnDistribution,
    };
}

export async function getVersionDistribution(): Promise<VersionInfo[]> {
    const nodes = await getClusterNodes();
    const versionCount: Record<string, number> = {};

    nodes.forEach(node => {
        versionCount[node.version] = (versionCount[node.version] || 0) + 1;
    });

    const total = nodes.length || 1;
    const latestVersion = '0.7.0';

    return Object.entries(versionCount)
        .map(([version, count]) => ({
            version,
            count,
            percentage: (count / total) * 100,
            isLatest: version === latestVersion,
        }))
        .sort((a, b) => b.count - a.count);
}

export async function getHealthScoreBreakdown(): Promise<HealthScoreBreakdown> {
    const stats = await getNetworkStats();
    const gossip = await getGossipHealth();

    const factors = [
        { name: 'Uptime', weight: 0.25, score: stats.averageUptime, description: 'Average node uptime percentage' },
        { name: 'Latency', weight: 0.20, score: Math.max(0, 100 - stats.averageResponseTime), description: 'Network response time score' },
        { name: 'Node Availability', weight: 0.20, score: stats.networkHealth, description: 'Percentage of online nodes' },
        { name: 'Gossip Health', weight: 0.15, score: gossip.healthScore, description: 'Gossip protocol performance' },
        { name: 'Storage Utilization', weight: 0.10, score: stats.totalStorageCapacityTB > 0 ? (stats.totalStorageUsedTB / stats.totalStorageCapacityTB) * 100 : 0, description: 'Storage efficiency' },
        { name: 'Peer Connectivity', weight: 0.10, score: Math.min(100, gossip.avgPeersPerNode * 3), description: 'Average peer connections' },
    ];

    const overall = factors.reduce((acc, f) => acc + f.score * f.weight, 0);

    return {
        overall,
        factors: factors.map(f => ({
            ...f,
            weightedScore: f.score * f.weight,
        })),
    };
}

export async function getTrendData(metric: string, period: '24h' | '7d' | '30d' = '24h'): Promise<TrendData> {
    const history = await import('./network').then(m => m.getPerformanceHistory(period));

    const getValue = (h: any): number => {
        switch (metric) {
            case 'nodes': return h.totalNodes;
            case 'latency': return h.avgResponseTime;
            case 'storage': return h.storageUsedTB;
            case 'gossip': return h.gossipMessages;
            default: return h.totalNodes;
        }
    };

    const dataPoints = history.map(h => ({
        timestamp: h.timestamp,
        value: getValue(h),
    }));

    const first = dataPoints[0]?.value || 0;
    const last = dataPoints[dataPoints.length - 1]?.value || 0;
    const change = last - first;
    const changePercent = first > 0 ? (change / first) * 100 : 0;

    return {
        period,
        dataPoints,
        change,
        changePercent,
    };
}

export async function getXScore(nodeId?: string): Promise<XScore> {
    const nodes = await getClusterNodes();

    if (nodeId) {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            return calculateXScore(node);
        }
    }

    const onlineNodes = nodes.filter(n => n.status === 'online');
    if (onlineNodes.length === 0) {
        return { overall: 0, storageThroughput: 0, dataAvailabilityLatency: 0, uptime: 0, gossipHealth: 0, peerConnectivity: 0, grade: 'F' };
    }

    const avgThroughput = onlineNodes.reduce((acc, n) => acc + (n.metrics.storageUsedGB / n.metrics.storageCapacityGB * 100), 0) / onlineNodes.length;
    const avgLatency = onlineNodes.reduce((acc, n) => acc + n.metrics.responseTimeMs, 0) / onlineNodes.length;
    const avgUptime = onlineNodes.reduce((acc, n) => acc + n.uptime, 0) / onlineNodes.length;
    const avgGossip = onlineNodes.reduce((acc, n) => acc + n.gossip.peersConnected, 0) / onlineNodes.length;

    const storageThroughput = Math.min(100, avgThroughput * 1.5);
    const dataAvailabilityLatency = Math.max(0, 100 - avgLatency * 0.5);
    const uptime = avgUptime;
    const gossipHealth = Math.min(100, avgGossip * 2);
    const peerConnectivity = Math.min(100, avgGossip * 3);

    const overall = (storageThroughput * 0.25) + (dataAvailabilityLatency * 0.25) + (uptime * 0.20) + (gossipHealth * 0.15) + (peerConnectivity * 0.15);

    return {
        overall,
        storageThroughput,
        dataAvailabilityLatency,
        uptime,
        gossipHealth,
        peerConnectivity,
        grade: getXScoreGrade(overall),
    };
}

function calculateXScore(node: PNode): XScore {
    const storageThroughput = Math.min(100, (node.metrics.storageUsedGB / node.metrics.storageCapacityGB * 100) * 1.5);
    const dataAvailabilityLatency = Math.max(0, 100 - node.metrics.responseTimeMs * 0.5);
    const uptime = node.uptime;
    const gossipHealth = Math.min(100, node.gossip.peersConnected * 2);
    const peerConnectivity = Math.min(100, node.gossip.peersConnected * 3);

    const overall = (storageThroughput * 0.25) + (dataAvailabilityLatency * 0.25) + (uptime * 0.20) + (gossipHealth * 0.15) + (peerConnectivity * 0.15);

    return {
        overall,
        storageThroughput,
        dataAvailabilityLatency,
        uptime,
        gossipHealth,
        peerConnectivity,
        grade: getXScoreGrade(overall),
    };
}

function getXScoreGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 95) return 'S';
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
}

export function generateGossipEvents(nodes: PNode[]): GossipEvent[] {
    const events: GossipEvent[] = [];
    const onlineNodes = nodes.filter(n => n.status === 'online' && n.location);
    const eventTypes: Array<'discovery' | 'message' | 'sync' | 'heartbeat' | 'data_transfer'> = ['discovery', 'message', 'sync', 'heartbeat', 'data_transfer'];

    for (let i = 0; i < Math.min(20, onlineNodes.length); i++) {
        const sourceIdx = i % onlineNodes.length;
        const targetIdx = (i + 1) % onlineNodes.length;
        const source = onlineNodes[sourceIdx];
        const target = onlineNodes[targetIdx];

        if (source && target && source.id !== target.id) {
            events.push({
                id: `gossip_${Date.now()}_${i}`,
                type: eventTypes[i % eventTypes.length],
                sourceNodeId: source.id,
                targetNodeId: target.id,
                sourceLocation: source.location ? { lat: source.location.lat, lng: source.location.lng } : undefined,
                targetLocation: target.location ? { lat: target.location.lat, lng: target.location.lng } : undefined,
                timestamp: new Date(Date.now() - i * 1000).toISOString(),
                metadata: {
                    bytesTransferred: (source.credits || 1000) * 10,
                    latencyMs: source.metrics.responseTimeMs,
                    protocol: 'gossip/v1',
                },
            });
        }
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getPeerRankings(): Promise<PeerRanking[]> {
    const nodes = await getClusterNodes();

    return nodes
        .filter(n => n.status === 'online')
        .sort((a, b) => (b.credits || 0) - (a.credits || 0))
        .slice(0, 20)
        .map((node, index) => ({
            nodeId: node.id,
            nodePubkey: node.pubkey,
            rank: index + 1,
            totalNodes: nodes.length,
            percentile: ((nodes.length - index) / nodes.length) * 100,
            xScore: node.performance.score,
            trend: 'stable' as const,
            trendChange: 0,
        }));
}

export async function getSuperminorityInfo(): Promise<SuperminorityInfo> {
    const nodes = await getClusterNodes();
    const totalCredits = nodes.reduce((acc, n) => acc + (n.credits || 0), 0);

    const sorted = [...nodes].sort((a, b) => (b.credits || 0) - (a.credits || 0));

    let sum = 0;
    const threshold = totalCredits * 0.33;
    const superminorityNodes: { pubkey: string; stake: number; percentage: number }[] = [];

    for (const node of sorted) {
        if (sum >= threshold) break;
        const credits = node.credits || 0;
        superminorityNodes.push({
            pubkey: node.pubkey,
            stake: credits,
            percentage: totalCredits > 0 ? (credits / totalCredits) * 100 : 0,
        });
        sum += credits;
    }

    return {
        count: superminorityNodes.length,
        threshold: 33,
        nodes: superminorityNodes,
        riskLevel: superminorityNodes.length < 5 ? 'high' : superminorityNodes.length < 15 ? 'medium' : 'low',
    };
}

export async function getCensorshipResistanceScore(): Promise<CensorshipResistanceScore> {
    const metrics = await getDecentralizationMetrics();

    const countries = metrics.countryDistribution.length;
    const asns = metrics.asnDistribution.length;

    const geographicDiversity = Math.min(100, countries * 5);
    const asnDiversity = Math.min(100, asns * 12);
    const jurisdictionDiversity = Math.min(100, countries * 4);
    const clientDiversity = 80;

    const overall = (geographicDiversity + asnDiversity + jurisdictionDiversity + clientDiversity) / 4;

    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (overall >= 80) grade = 'A';
    else if (overall >= 65) grade = 'B';
    else if (overall >= 50) grade = 'C';
    else if (overall >= 35) grade = 'D';

    return {
        overall,
        factors: {
            geographicDiversity,
            asnDiversity,
            jurisdictionDiversity,
            clientDiversity,
        },
        grade,
    };
}
