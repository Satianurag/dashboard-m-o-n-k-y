
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PNode, NetworkStats, PerformanceHistory, GossipHealth } from '@/types/pnode';
import { useEffect } from 'react';
import React from 'react';

// Fetchers using Supabase
const fetchPNodes = async (): Promise<PNode[]> => {
    const { data, error } = await supabase
        .from('pnodes')
        .select('*')
        .order('credits', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    // Map DB row to PNode type
    return data.map((row: any) => ({
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
};

const fetchNetworkStats = async (): Promise<NetworkStats | null> => {
    const { data, error } = await supabase
        .from('network_stats')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        // If 0 rows, return null or default
        return null;
    }

    return {
        totalNodes: data.total_nodes,
        onlineNodes: data.online_nodes,
        offlineNodes: data.offline_nodes,
        degradedNodes: 0, // Not stored separately in stats table currently
        totalStorageCapacityTB: data.total_storage_tb,
        totalStorageUsedTB: data.total_storage_used_tb,
        averageUptime: data.avg_uptime,
        averageResponseTime: data.avg_response_time,
        networkHealth: data.network_health,
        gossipMessages24h: data.gossip_messages_24h_count,
        lastUpdated: data.updated_at
    };
};

export function usePNodes(initialData?: any) {
    const queryClient = useQueryClient();

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel('public:pnodes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pnodes' }, () => {
                queryClient.invalidateQueries({ queryKey: ['pnodes'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return useQuery({
        queryKey: ['pnodes'],
        queryFn: fetchPNodes,
        initialData,
        refetchInterval: 60000, // Fallback polling
    });
}

export function useNetworkStats(initialData?: any) {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel('public:network_stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'network_stats' }, () => {
                queryClient.invalidateQueries({ queryKey: ['network-stats'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return useQuery({
        queryKey: ['network-stats'],
        queryFn: fetchNetworkStats,
        initialData,
        refetchInterval: 60000,
    });
}

export function usePerformanceHistory() {
    return useQuery({
        queryKey: ['performance-history'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('network_stats')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(24);

            if (error || !data) return [];

            return data.map((row: any) => ({
                timestamp: row.updated_at,
                avgResponseTime: row.avg_response_time,
                totalNodes: row.total_nodes,
                onlineNodes: row.online_nodes,
                storageUsedTB: row.total_storage_used_tb,
                gossipMessages: row.gossip_messages_24h_count
            })).reverse();
        },
        refetchInterval: 300000,
    });
}

// Added back missing GOSSIP EVENTS hook logic
export function useGossipEvents() {
    return useQuery({
        queryKey: ['gossip-events'],
        queryFn: async () => {
            // Return empty or fetch from events table if created. 
            // We will return empty to avoid errors
            return [];
        }
    });
}

export function useXScore() {
    // Calculate Score based on current stats
    const { data: stats } = useNetworkStats();

    // Simple derivation logic
    if (!stats) return { data: null };

    const score = stats.networkHealth || 0;

    return {
        data: {
            overall: score,
            storageThroughput: score * 0.9,
            dataAvailabilityLatency: score * 0.95,
            uptime: stats.averageUptime || 0,
            gossipHealth: 90,
            grade: score > 90 ? 'S' : score > 80 ? 'A' : score > 60 ? 'B' : 'F'
        }
    };
}

// -- Restored Hooks (returning safe empty/null for now to satisfy build) --

export function useEpochInfo() {
    return useQuery({
        queryKey: ['epoch-info'],
        queryFn: async () => null
    });
}

export function useEpochHistory() {
    return useQuery({
        queryKey: ['epoch-history'],
        queryFn: async () => []
    });
}

export function useStakingStats() {
    return useQuery({
        queryKey: ['staking-stats'],
        queryFn: async () => null
    });
}

export function useDecentralizationMetrics() {
    return useQuery({
        queryKey: ['decentralization-metrics'],
        queryFn: async () => null
    });
}

export function useVersionDistribution() {
    return useQuery({
        queryKey: ['version-distribution'],
        queryFn: async () => []
    });
}

export function useHealthScoreBreakdown() {
    return useQuery({
        queryKey: ['health-score-breakdown'],
        queryFn: async () => null
    });
}

export function useTrendData(metric: string, period: string) {
    return useQuery({
        queryKey: ['trend-data', metric, period],
        queryFn: async () => []
    });
}

export function useExabyteProjection(timeframe: string, customNodeCount?: number) {
    return useQuery({
        queryKey: ['exabyte-projection', timeframe, customNodeCount],
        queryFn: async () => []
    });
}

export function useCommissionHistory(nodeId: string) {
    return useQuery({
        queryKey: ['commission-history', nodeId],
        queryFn: async () => []
    });
}

export function useSlashingEvents() {
    return useQuery({
        queryKey: ['slashing-events'],
        queryFn: async () => []
    });
}

export function usePeerRankings() {
    return useQuery({
        queryKey: ['peer-rankings'],
        queryFn: async () => []
    });
}

export function useSuperminorityInfo() {
    return useQuery({
        queryKey: ['superminority-info'],
        queryFn: async () => null
    });
}

export function useCensorshipResistanceScore() {
    return useQuery({
        queryKey: ['censorship-resistance-score'],
        queryFn: async () => null
    });
}



export function useGossipHealth() {
    return useQuery({
        queryKey: ['gossip-health'],
        queryFn: async () => ({
            totalPeers: 0,
            avgPeersPerNode: 0,
            messageRate: 0,
            networkLatency: 0,
            partitions: 0,
            healthScore: 100
        })
    });
}

export function useStorageDistribution() {
    return useQuery({
        queryKey: ['storage-distribution'],
        queryFn: async () => []
    });
}


export function useConnectionStatus() {
    const { isLoading, isError, dataUpdatedAt } = useNetworkStats();

    return {
        status: isLoading ? 'connecting' : isError ? 'disconnected' : 'connected',
        lastCheck: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    };
}

// Legacy/UI Utils

export function useUserTimezone() {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    let name = 'UTC';
    let city = 'UTC';
    let offset = 'UTC+0';

    if (mounted && typeof window !== 'undefined') {
        try {
            name = Intl.DateTimeFormat().resolvedOptions().timeZone;
            city = name.split('/').pop()?.replace(/_/g, ' ') || 'UTC';

            const now = new Date();
            const offsetMinutes = now.getTimezoneOffset();
            const offsetHours = -(offsetMinutes / 60);
            const sign = offsetHours >= 0 ? '+' : '-';
            const absHours = Math.floor(Math.abs(offsetHours));
            const absMinutes = Math.abs(offsetMinutes % 60);

            offset = `UTC${sign}${absHours}${absMinutes > 0 ? ':' + absMinutes.toString().padStart(2, '0') : ''}`;
        } catch (e) {
            console.error('Error calculating timezone:', e);
        }
    }

    return { name, offset, city, mounted };
}

export function useLiveClock() {
    const [time, setTime] = React.useState<Date | null>(null);
    const [mounted, setMounted] = React.useState(false);
    const timezone = useUserTimezone();
    React.useEffect(() => {
        setMounted(true);
        setTime(new Date());
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);
    return { time, timezone, mounted };
}
