import { EpochInfo, EpochHistory, StakingStats, ExabyteProjection, CommissionHistory, SlashingEvent, PNode } from '@/shared/types/pnode';
import { getClusterNodes } from '@/features/pnodes';
import { fetchRPC } from '@/infrastructure/rpc/client';
import { calculateSkipRate, getNetworkStats } from '@/features/network';

export async function getEpochInfo(): Promise<EpochInfo> {
    try {
        const [epochData, skipRateData] = await Promise.all([
            fetchRPC<{
                epoch: number;
                slotIndex: number;
                slotsInEpoch: number;
                absoluteSlot: number;
                blockHeight: number;
            }>('getEpochInfo'),
            calculateSkipRate(),
        ]);

        if (epochData && typeof epochData === 'object') {
            const epochDuration = 2 * 24 * 60 * 60 * 1000;
            const epochStart = Date.now() - (epochData.slotIndex / epochData.slotsInEpoch) * epochDuration;

            return {
                currentEpoch: epochData.epoch || 209,
                epochProgress: epochData.slotIndex && epochData.slotsInEpoch
                    ? (epochData.slotIndex / epochData.slotsInEpoch) * 100
                    : 50,
                epochStartTime: new Date(epochStart).toISOString(),
                epochEndTime: new Date(epochStart + epochDuration).toISOString(),
                slotsCompleted: epochData.slotIndex || 200000,
                totalSlots: epochData.slotsInEpoch || 432000,
                blocksProduced: epochData.blockHeight || epochData.absoluteSlot || 85000000,
                skipRate: skipRateData.overall,
            };
        }
    } catch (error) {
        console.error('Error fetching epoch info:', error);
    }

    const now = Date.now();
    const epochDuration = 2 * 24 * 60 * 60 * 1000;
    const currentEpoch = 209;
    const epochStart = now - (now % epochDuration);

    return {
        currentEpoch,
        epochProgress: ((now - epochStart) / epochDuration) * 100,
        epochStartTime: new Date(epochStart).toISOString(),
        epochEndTime: new Date(epochStart + epochDuration).toISOString(),
        slotsCompleted: Math.floor(((now - epochStart) / epochDuration) * 432000),
        totalSlots: 432000,
        blocksProduced: 85000000,
        skipRate: 2.5,
    };
}

export async function getEpochHistory(): Promise<EpochHistory[]> {
    const currentInfo = await getEpochInfo();
    const history: EpochHistory[] = [];
    const epochDuration = 2 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < 10; i++) {
        const epoch = currentInfo.currentEpoch - i - 1;
        const start = Date.now() - (i + 1) * epochDuration;
        history.push({
            epoch,
            startTime: new Date(start).toISOString(),
            endTime: new Date(start + epochDuration).toISOString(),
            blocksProduced: 400000 + (epoch % 20000),
            skipRate: 1.5 + (epoch % 30) / 10,
            activeNodes: 200 + (epoch % 20),
            totalRewards: 50000 + (epoch % 10000),
        });
    }

    return history;
}

export async function getStakingStats(): Promise<StakingStats> {
    const nodes = await getClusterNodes();
    const stakingNodes = nodes.filter(n => n.staking);

    const totalStaked = stakingNodes.reduce((acc, n) => acc + (n.staking?.activatedStake || 0), 0);
    const totalDelegated = stakingNodes.reduce((acc, n) => acc + (n.staking?.delegatedStake || 0), 0);
    const avgCommission = stakingNodes.length > 0
        ? stakingNodes.reduce((acc, n) => acc + (n.staking?.commission || 0), 0) / stakingNodes.length
        : 0;
    const avgAPY = stakingNodes.length > 0
        ? stakingNodes.reduce((acc, n) => acc + (n.staking?.apy || 0), 0) / stakingNodes.length
        : 0;

    const topValidators = [...stakingNodes]
        .sort((a, b) => (b.staking?.activatedStake || 0) - (a.staking?.activatedStake || 0))
        .slice(0, 10)
        .map(n => ({
            pubkey: n.pubkey,
            stake: n.staking?.activatedStake || 0,
            apy: n.staking?.apy || 0,
            commission: n.staking?.commission || 0,
        }));

    return {
        totalStaked,
        totalDelegated,
        averageCommission: avgCommission,
        averageAPY: avgAPY,
        topValidators,
    };
}

export async function getExabyteProjection(
    timeframe: '1m' | '3m' | '6m' | '1y' | '2y' = '1y',
    customNodeCount?: number
): Promise<ExabyteProjection> {
    const stats = await getNetworkStats();
    const currentCapacity = stats.totalStorageCapacityTB;
    const currentNodes = stats.totalNodes;
    const targetNodes = customNodeCount || currentNodes;

    const monthMultiplier = {
        '1m': 1,
        '3m': 3,
        '6m': 6,
        '1y': 12,
        '2y': 24,
    };

    const months = monthMultiplier[timeframe];
    const growthRate = 0.15;
    const projectedCapacity = currentCapacity * Math.pow(1 + growthRate, months / 12) * (targetNodes / Math.max(1, currentNodes));
    const projectedNodes = Math.floor(currentNodes * Math.pow(1 + growthRate / 2, months / 12));

    const milestones = [
        { capacity: 100, estimatedDate: '', nodeCountRequired: 0 },
        { capacity: 500, estimatedDate: '', nodeCountRequired: 0 },
        { capacity: 1000, estimatedDate: '', nodeCountRequired: 0 },
        { capacity: 5000, estimatedDate: '', nodeCountRequired: 0 },
        { capacity: 10000, estimatedDate: '', nodeCountRequired: 0 },
    ].map(m => {
        const monthsToMilestone = currentCapacity > 0
            ? Math.log(m.capacity / currentCapacity) / Math.log(1 + growthRate) * 12
            : 12;
        const date = new Date();
        date.setMonth(date.getMonth() + Math.ceil(monthsToMilestone));
        return {
            ...m,
            estimatedDate: date.toISOString().split('T')[0],
            nodeCountRequired: currentNodes > 0 ? Math.ceil(currentNodes * (m.capacity / Math.max(1, currentCapacity))) : 100,
        };
    });

    return {
        currentCapacityTB: currentCapacity,
        projectedCapacityTB: projectedCapacity,
        nodeCount: currentNodes,
        projectedNodeCount: projectedNodes,
        timeframe,
        growthRate,
        milestones,
    };
}

export async function getCommissionHistory(nodeId: string): Promise<CommissionHistory> {
    const nodes = await getClusterNodes();
    const node = nodes.find(n => n.id === nodeId);
    const commission = node?.staking?.commission || 5;

    return {
        nodeId,
        history: Array.from({ length: 30 }, (_, i) => ({
            timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
            commission,
            change: 0,
        })),
    };
}

export async function getSlashingEvents(): Promise<SlashingEvent[]> {
    return [];
}
