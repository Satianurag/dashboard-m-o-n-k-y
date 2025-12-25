import { NextResponse } from 'next/server';
import {
    getNetworkStats, getNetworkEvents, getPerformanceHistory, getGossipHealth, getStorageDistribution, calculateNetworkTPS
} from '@/server/api/network';
import {
    getEpochInfo, getEpochHistory, getStakingStats, getCommissionHistory, getSlashingEvents, getExabyteProjection
} from '@/server/api/economics';
import {
    getDecentralizationMetrics, getVersionDistribution, getHealthScoreBreakdown, getTrendData, getXScore, getPeerRankings, getSuperminorityInfo, getCensorshipResistanceScore
} from '@/server/api/decentralization';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    try {
        let data;
        switch (type) {
            case 'network-stats':
                data = await getNetworkStats();
                break;
            case 'network-tps':
                data = await calculateNetworkTPS();
                break;
            case 'network-events':
                data = await getNetworkEvents();
                break;
            case 'performance-history':
                const periodHistory = searchParams.get('period') as '24h' | '7d' | '30d' || '24h';
                data = await getPerformanceHistory(periodHistory);
                break;
            case 'gossip-health':
                data = await getGossipHealth();
                break;
            case 'storage-distribution':
                data = await getStorageDistribution();
                break;
            case 'epoch-info':
                data = await getEpochInfo();
                break;
            case 'epoch-history':
                data = await getEpochHistory();
                break;
            case 'staking-stats':
                data = await getStakingStats();
                break;
            case 'commission-history':
                const nodeIdComm = searchParams.get('nodeId');
                if (!nodeIdComm) throw new Error('nodeId required');
                data = await getCommissionHistory(nodeIdComm);
                break;
            case 'slashing-events':
                data = await getSlashingEvents();
                break;
            case 'exabyte-projection':
                const timeframe = searchParams.get('timeframe') as '1m' | '3m' | '6m' | '1y' | '2y' || '1y';
                const customNodeCount = searchParams.get('customNodeCount') ? parseInt(searchParams.get('customNodeCount')!) : undefined;
                data = await getExabyteProjection(timeframe, customNodeCount);
                break;
            case 'decentralization-metrics':
                data = await getDecentralizationMetrics();
                break;
            case 'version-distribution':
                data = await getVersionDistribution();
                break;
            case 'health-score-breakdown':
                data = await getHealthScoreBreakdown();
                break;
            case 'trend-data':
                const metric = searchParams.get('metric') || 'nodes';
                const periodTrend = searchParams.get('period') as '24h' | '7d' | '30d' || '24h';
                data = await getTrendData(metric, periodTrend);
                break;
            case 'x-score':
                const nodeIdX = searchParams.get('nodeId') || undefined;
                data = await getXScore(nodeIdX);
                break;
            case 'peer-rankings':
                data = await getPeerRankings();
                break;
            case 'superminority-info':
                data = await getSuperminorityInfo();
                break;
            case 'censorship-resistance':
                data = await getCensorshipResistanceScore();
                break;
            default:
                return NextResponse.json({ error: 'Invalid type param' }, { status: 400 });
        }
        return NextResponse.json(data);
    } catch (error: any) {
        console.error(`Error in /api/pnode-data for type ${type}:`, error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
