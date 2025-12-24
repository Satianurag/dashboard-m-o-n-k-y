'use client';

import { useState, useEffect, useCallback } from 'react';
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
  REFRESH_INTERVAL,
} from '@/lib/pnode-api';

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

function useAutoRefresh<T>(
  fetcher: () => Promise<T>,
  interval: number = REFRESH_INTERVAL,
  initialData: T | null = null
): UseDataResult<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(initialData === null);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(initialData ? new Date() : null);


  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetcher();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    refresh();
    const intervalId = setInterval(refresh, interval);
    return () => clearInterval(intervalId);
  }, [refresh, interval]);

  return { data, loading, error, lastUpdated, refresh };
}

export function usePNodes(initialData: PNode[] | null = null): UseDataResult<PNode[]> {
  return useAutoRefresh(getClusterNodes, REFRESH_INTERVAL, initialData);
}

export function useNetworkStats(initialData: NetworkStats | null = null): UseDataResult<NetworkStats> {
  return useAutoRefresh(getNetworkStats, REFRESH_INTERVAL, initialData);
}


export function useNetworkEvents(): UseDataResult<NetworkEvent[]> {
  return useAutoRefresh(getNetworkEvents, 60000);
}

export function usePerformanceHistory(
  period: '24h' | '7d' | '30d' = '24h',
  initialData: PerformanceHistory[] | null = null
): UseDataResult<PerformanceHistory[]> {
  const fetcher = useCallback(() => getPerformanceHistory(period), [period]);
  return useAutoRefresh(fetcher, 60000, initialData);
}


export function useGossipHealth(): UseDataResult<GossipHealth> {
  return useAutoRefresh(getGossipHealth);
}

export function useStorageDistribution(): UseDataResult<StorageDistribution[]> {
  return useAutoRefresh(getStorageDistribution);
}

export function useEpochInfo(): UseDataResult<EpochInfo> {
  return useAutoRefresh(getEpochInfo);
}

export function useEpochHistory(): UseDataResult<EpochHistory[]> {
  return useAutoRefresh(getEpochHistory, 60000);
}

export function useStakingStats(): UseDataResult<StakingStats> {
  return useAutoRefresh(getStakingStats);
}

export function useDecentralizationMetrics(): UseDataResult<DecentralizationMetrics> {
  return useAutoRefresh(getDecentralizationMetrics, 60000);
}

export function useVersionDistribution(): UseDataResult<VersionInfo[]> {
  return useAutoRefresh(getVersionDistribution);
}

export function useHealthScoreBreakdown(): UseDataResult<HealthScoreBreakdown> {
  return useAutoRefresh(getHealthScoreBreakdown);
}

export function useTrendData(metric: string, period: '24h' | '7d' | '30d' = '24h'): UseDataResult<TrendData> {
  const fetcher = useCallback(() => getTrendData(metric, period), [metric, period]);
  return useAutoRefresh(fetcher, 60000);
}

export function useConnectionStatus() {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await getNetworkStats();
        setStatus('connected');
      } catch {
        setStatus('disconnected');
      }
      setLastCheck(new Date());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return { status, lastCheck };
}

export function useUserTimezone() {
  const [timezone, setTimezone] = useState({
    name: '',
    offset: '',
    city: '',
  });

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const hours = Math.abs(Math.floor(offset / 60));
    const minutes = Math.abs(offset % 60);
    const sign = offset <= 0 ? '+' : '-';

    const city = tz.split('/').pop()?.replace(/_/g, ' ') || tz;

    setTimezone({
      name: tz,
      offset: `UTC${sign}${hours}${minutes > 0 ? ':' + minutes.toString().padStart(2, '0') : ''}`,
      city,
    });
  }, []);

  return timezone;
}

export function useLiveClock() {
  const [time, setTime] = useState(new Date());
  const timezone = useUserTimezone();

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { time, timezone };
}

export function useXScore(nodeId?: string): UseDataResult<import('@/types/pnode').XScore> {
  const fetcher = useCallback(() => getXScore(nodeId), [nodeId]);
  return useAutoRefresh(fetcher, 30000);
}

export function useGossipEvents(): UseDataResult<import('@/types/pnode').GossipEvent[]> {
  const { data: nodes } = usePNodes();
  const [events, setEvents] = useState<import('@/types/pnode').GossipEvent[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (nodes) {
      setEvents(generateGossipEvents(nodes));
      setLoading(false);

      const interval = setInterval(() => {
        setEvents(generateGossipEvents(nodes));
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [nodes]);

  return {
    data: events,
    loading,
    error: null,
    lastUpdated: new Date(),
    refresh: () => nodes && setEvents(generateGossipEvents(nodes)),
  };
}

export function useExabyteProjection(
  timeframe: '1m' | '3m' | '6m' | '1y' | '2y' = '1y',
  customNodeCount?: number
): UseDataResult<import('@/types/pnode').ExabyteProjection> {
  const fetcher = useCallback(() => getExabyteProjection(timeframe, customNodeCount), [timeframe, customNodeCount]);
  return useAutoRefresh(fetcher, 60000);
}

export function useCommissionHistory(nodeId: string): UseDataResult<import('@/types/pnode').CommissionHistory> {
  const fetcher = useCallback(() => getCommissionHistory(nodeId), [nodeId]);
  return useAutoRefresh(fetcher, 60000);
}

export function useSlashingEvents(): UseDataResult<import('@/types/pnode').SlashingEvent[]> {
  return useAutoRefresh(getSlashingEvents, 60000);
}

export function usePeerRankings(): UseDataResult<import('@/types/pnode').PeerRanking[]> {
  return useAutoRefresh(getPeerRankings, 30000);
}

export function useSuperminorityInfo(): UseDataResult<import('@/types/pnode').SuperminorityInfo> {
  return useAutoRefresh(getSuperminorityInfo, 60000);
}

export function useCensorshipResistanceScore(): UseDataResult<import('@/types/pnode').CensorshipResistanceScore> {
  return useAutoRefresh(getCensorshipResistanceScore, 60000);
}
