import { PNode, NetworkStats, NetworkEvent, PerformanceHistory, GossipHealth, StorageDistribution, EpochInfo, EpochHistory, StakingStats, ExabyteProjection, CommissionHistory, SlashingEvent, DecentralizationMetrics, VersionInfo, HealthScoreBreakdown, TrendData, XScore, PeerRanking, SuperminorityInfo, CensorshipResistanceScore } from '@/types/pnode';

// Client-side utils
export * from './pnode-utils-client';
export const REFRESH_INTERVAL = 30000;

async function fetchApi<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

export async function getClusterNodes(): Promise<PNode[]> {
    return fetchApi<PNode[]>('/api/pnodes');
}

export async function getNetworkStats(): Promise<NetworkStats> {
    return fetchApi<NetworkStats>('/api/pnode-data?type=network-stats');
}

export async function calculateNetworkTPS(): Promise<number> {
    return fetchApi<number>('/api/pnode-data?type=network-tps');
}

export async function getNetworkEvents(): Promise<NetworkEvent[]> {
    return fetchApi<NetworkEvent[]>('/api/pnode-data?type=network-events');
}

export async function getPerformanceHistory(period: '24h' | '7d' | '30d' = '24h'): Promise<PerformanceHistory[]> {
    return fetchApi<PerformanceHistory[]>(`/api/pnode-data?type=performance-history&period=${period}`);
}

export async function getGossipHealth(): Promise<GossipHealth> {
    return fetchApi<GossipHealth>('/api/pnode-data?type=gossip-health');
}

export async function getStorageDistribution(): Promise<StorageDistribution[]> {
    return fetchApi<StorageDistribution[]>('/api/pnode-data?type=storage-distribution');
}

export async function getEpochInfo(): Promise<EpochInfo> {
    return fetchApi<EpochInfo>('/api/pnode-data?type=epoch-info');
}

export async function getEpochHistory(): Promise<EpochHistory[]> {
    return fetchApi<EpochHistory[]>('/api/pnode-data?type=epoch-history');
}

export async function getStakingStats(): Promise<StakingStats> {
    return fetchApi<StakingStats>('/api/pnode-data?type=staking-stats');
}

export async function getCommissionHistory(nodeId: string): Promise<CommissionHistory> {
    return fetchApi<CommissionHistory>(`/api/pnode-data?type=commission-history&nodeId=${nodeId}`);
}

export async function getSlashingEvents(): Promise<SlashingEvent[]> {
    return fetchApi<SlashingEvent[]>('/api/pnode-data?type=slashing-events');
}

export async function getExabyteProjection(timeframe: '1m' | '3m' | '6m' | '1y' | '2y' = '1y', customNodeCount?: number): Promise<ExabyteProjection> {
    let url = `/api/pnode-data?type=exabyte-projection&timeframe=${timeframe}`;
    if (customNodeCount) url += `&customNodeCount=${customNodeCount}`;
    return fetchApi<ExabyteProjection>(url);
}

export async function getDecentralizationMetrics(): Promise<DecentralizationMetrics> {
    return fetchApi<DecentralizationMetrics>('/api/pnode-data?type=decentralization-metrics');
}

export async function getVersionDistribution(): Promise<VersionInfo[]> {
    return fetchApi<VersionInfo[]>('/api/pnode-data?type=version-distribution');
}

export async function getHealthScoreBreakdown(): Promise<HealthScoreBreakdown> {
    return fetchApi<HealthScoreBreakdown>('/api/pnode-data?type=health-score-breakdown');
}

export async function getTrendData(metric: string, period: '24h' | '7d' | '30d' = '24h'): Promise<TrendData> {
    return fetchApi<TrendData>(`/api/pnode-data?type=trend-data&metric=${metric}&period=${period}`);
}

export async function getXScore(nodeId?: string): Promise<XScore> {
    let url = '/api/pnode-data?type=x-score';
    if (nodeId) url += `&nodeId=${nodeId}`;
    return fetchApi<XScore>(url);
}

export async function getPeerRankings(): Promise<PeerRanking[]> {
    return fetchApi<PeerRanking[]>('/api/pnode-data?type=peer-rankings');
}

export async function getSuperminorityInfo(): Promise<SuperminorityInfo> {
    return fetchApi<SuperminorityInfo>('/api/pnode-data?type=superminority-info');
}

export async function getCensorshipResistanceScore(): Promise<CensorshipResistanceScore> {
    return fetchApi<CensorshipResistanceScore>('/api/pnode-data?type=censorship-resistance');
}

