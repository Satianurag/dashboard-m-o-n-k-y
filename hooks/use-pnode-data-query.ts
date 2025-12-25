'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type {
    PNode, NetworkStats, NetworkEvent, PerformanceHistory, GossipHealth,
    StorageDistribution, EpochInfo, EpochHistory, StakingStats,
    DecentralizationMetrics, VersionInfo, HealthScoreBreakdown, TrendData
} from '@/types/pnode';
import {
    getClusterNodes,
    getNetworkStats,
    getNetworkEvents,
    getPerformanceHistory,
    getGossipHealth,
    getStorageDistribution,
    getEpochInfo,
    getEpochHistory,
    getStakingStats,
    getDecentralizationMetrics,
    getVersionDistribution,
    getHealthScoreBreakdown,
    getTrendData,
    getXScore,
    generateGossipEvents,
    getExabyteProjection,
    getCommissionHistory,
    getSlashingEvents,
    getPeerRankings,
    getSuperminorityInfo,
    getCensorshipResistanceScore,
} from '@/lib/pnode-api';

// Query Keys - centralized for easy invalidation and management
export const queryKeys = {
    pnodes: ['pnodes'] as const,
    networkStats: ['networkStats'] as const,
    networkEvents: ['networkEvents'] as const,
    performanceHistory: (period: string) => ['performanceHistory', period] as const,
    gossipHealth: ['gossipHealth'] as const,
    storageDistribution: ['storageDistribution'] as const,
    epochInfo: ['epochInfo'] as const,
    epochHistory: ['epochHistory'] as const,
    stakingStats: ['stakingStats'] as const,
    decentralizationMetrics: ['decentralizationMetrics'] as const,
    versionDistribution: ['versionDistribution'] as const,
    healthScoreBreakdown: ['healthScoreBreakdown'] as const,
    trendData: (metric: string, period: string) => ['trendData', metric, period] as const,
    xScore: (nodeId?: string) => ['xScore', nodeId] as const,
    gossipEvents: ['gossipEvents'] as const,
    exabyteProjection: (timeframe: string, nodeCount?: number) =>
        ['exabyteProjection', timeframe, nodeCount] as const,
    commissionHistory: (nodeId: string) => ['commissionHistory', nodeId] as const,
    slashingEvents: ['slashingEvents'] as const,
    peerRankings: ['peerRankings'] as const,
    superminorityInfo: ['superminorityInfo'] as const,
    censorshipResistance: ['censorshipResistance'] as const,
};

// Main hooks with TanStack Query
export function usePNodes(initialData?: PNode[] | null) {
    return useQuery({
        queryKey: queryKeys.pnodes,
        queryFn: getClusterNodes,
        placeholderData: (previousData) => previousData || initialData || undefined,
        refetchInterval: 30 * 1000, // Refresh every 30 seconds
        staleTime: 20 * 1000, // Consider stale after 20 seconds
    });
}

export function useNetworkStats(initialData?: NetworkStats | null) {
    return useQuery({
        queryKey: queryKeys.networkStats,
        queryFn: getNetworkStats,
        placeholderData: (previousData) => previousData || initialData || undefined,
        refetchInterval: 30 * 1000,
        staleTime: 20 * 1000,
    });
}

export function useNetworkEvents() {
    return useQuery({
        queryKey: queryKeys.networkEvents,
        queryFn: getNetworkEvents,
        refetchInterval: 60 * 1000, // Every minute
        staleTime: 45 * 1000,
    });
}

export function usePerformanceHistory(
    period: '24h' | '7d' | '30d' = '24h',
    initialData?: PerformanceHistory[] | null
) {
    return useQuery({
        queryKey: queryKeys.performanceHistory(period),
        queryFn: () => getPerformanceHistory(period),
        placeholderData: (previousData) => previousData || initialData || undefined,
        refetchInterval: 60 * 1000,
        staleTime: 45 * 1000,
    });
}

export function useGossipHealth() {
    return useQuery({
        queryKey: queryKeys.gossipHealth,
        queryFn: getGossipHealth,
        refetchInterval: 30 * 1000,
        staleTime: 20 * 1000,
    });
}

export function useStorageDistribution() {
    return useQuery({
        queryKey: queryKeys.storageDistribution,
        queryFn: getStorageDistribution,
        refetchInterval: 60 * 1000,
        staleTime: 45 * 1000,
    });
}

export function useEpochInfo() {
    return useQuery({
        queryKey: queryKeys.epochInfo,
        queryFn: getEpochInfo,
        refetchInterval: 30 * 1000,
        staleTime: 20 * 1000,
    });
}

export function useEpochHistory() {
    return useQuery({
        queryKey: queryKeys.epochHistory,
        queryFn: getEpochHistory,
        refetchInterval: 60 * 1000,
        staleTime: 45 * 1000,
    });
}

export function useStakingStats() {
    return useQuery({
        queryKey: queryKeys.stakingStats,
        queryFn: getStakingStats,
        refetchInterval: 30 * 1000,
        staleTime: 20 * 1000,
    });
}

export function useDecentralizationMetrics() {
    return useQuery({
        queryKey: queryKeys.decentralizationMetrics,
        queryFn: getDecentralizationMetrics,
        refetchInterval: 60 * 1000,
        staleTime: 45 * 1000,
    });
}

export function useVersionDistribution() {
    return useQuery({
        queryKey: queryKeys.versionDistribution,
        queryFn: getVersionDistribution,
        refetchInterval: 60 * 1000,
        staleTime: 45 * 1000,
    });
}

export function useHealthScoreBreakdown() {
    return useQuery({
        queryKey: queryKeys.healthScoreBreakdown,
        queryFn: getHealthScoreBreakdown,
        refetchInterval: 30 * 1000,
        staleTime: 20 * 1000,
    });
}

export function useTrendData(metric: string, period: '24h' | '7d' | '30d' = '24h') {
    return useQuery({
        queryKey: queryKeys.trendData(metric, period),
        queryFn: () => getTrendData(metric, period),
        refetchInterval: 60 * 1000,
        staleTime: 45 * 1000,
    });
}

export function useXScore(nodeId?: string) {
    return useQuery({
        queryKey: queryKeys.xScore(nodeId),
        queryFn: () => getXScore(nodeId),
        refetchInterval: 30 * 1000,
        staleTime: 20 * 1000,
    });
}

export function useGossipEvents() {
    const { data: nodes } = usePNodes();

    return useQuery({
        queryKey: queryKeys.gossipEvents,
        queryFn: () => nodes ? generateGossipEvents(nodes) : [],
        enabled: !!nodes, // Only run when we have nodes
        refetchInterval: 2000, // Fast updates for gossip events
        staleTime: 1000,
    });
}

export function useExabyteProjection(
    timeframe: '1m' | '3m' | '6m' | '1y' | '2y' = '1y',
    customNodeCount?: number
) {
    return useQuery({
        queryKey: queryKeys.exabyteProjection(timeframe, customNodeCount),
        queryFn: () => getExabyteProjection(timeframe, customNodeCount),
        refetchInterval: 60 * 1000,
        staleTime: 45 * 1000,
    });
}

export function useCommissionHistory(nodeId: string) {
    return useQuery({
        queryKey: queryKeys.commissionHistory(nodeId),
        queryFn: () => getCommissionHistory(nodeId),
        enabled: !!nodeId,
        refetchInterval: 60 * 1000,
        staleTime: 45 * 1000,
    });
}

export function useSlashingEvents() {
    return useQuery({
        queryKey: queryKeys.slashingEvents,
        queryFn: getSlashingEvents,
        refetchInterval: 60 * 1000,
        staleTime: 45 * 1000,
    });
}

export function usePeerRankings() {
    return useQuery({
        queryKey: queryKeys.peerRankings,
        queryFn: getPeerRankings,
        refetchInterval: 30 * 1000,
        staleTime: 20 * 1000,
    });
}

export function useSuperminorityInfo() {
    return useQuery({
        queryKey: queryKeys.superminorityInfo,
        queryFn: getSuperminorityInfo,
        refetchInterval: 60 * 1000,
        staleTime: 45 * 1000,
    });
}

export function useCensorshipResistanceScore() {
    return useQuery({
        queryKey: queryKeys.censorshipResistance,
        queryFn: getCensorshipResistanceScore,
        refetchInterval: 60 * 1000,
        staleTime: 45 * 1000,
    });
}

// Legacy compatibility hooks - return transformed data to match old interface
export function useConnectionStatus() {
    const { isLoading, isError, dataUpdatedAt } = useNetworkStats();

    return {
        status: isLoading ? 'connecting' : isError ? 'disconnected' : 'connected',
        lastCheck: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    };
}

export function useUserTimezone() {
    // This doesn't need React Query, it's client-only
    const tz = typeof window !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'UTC';
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const hours = Math.abs(Math.floor(offset / 60));
    const minutes = Math.abs(offset % 60);
    const sign = offset <= 0 ? '+' : '-';
    const city = tz.split('/').pop()?.replace(/_/g, ' ') || tz;

    return {
        name: tz,
        offset: `UTC${sign}${hours}${minutes > 0 ? ':' + minutes.toString().padStart(2, '0') : ''}`,
        city,
    };
}

export function useLiveClock() {
    // Simple client-side clock, no need for React Query
    const [time, setTime] = React.useState(new Date());
    const timezone = useUserTimezone();

    React.useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    return { time, timezone };
}

// Re-export React for compatibility
import * as React from 'react';
