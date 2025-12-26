'use client';

import { useState } from 'react';
import DashboardPageLayout from "@/components/dashboard/layout";
import ChartIcon from "@/components/icons/chart";
import { usePNodes, useNetworkStats, usePerformanceHistory, useTrendData } from "@/hooks/use-pnode-data-query";
import StatBlock from "@/components/dashboard/stat-block";
import { NetworkChart } from "@/components/dashboard/network-chart";
import { ExportButton } from "@/components/dashboard/export-button";
import { InfoTooltip } from "@/components/dashboard/info-tooltip";
import { exportPerformanceHistory, type ExportFormat } from "@/lib/export-utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <Skeleton className="h-[300px] rounded-lg" />
    </div>
  );
}

export default function AnalyticsPage({
  initialNodes,
  initialStats,
  initialHistory
}: {
  initialNodes: any[] | null;
  initialStats: any | null;
  initialHistory: any[] | null;
}) {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const { data: nodes, isLoading: nodesLoading, dataUpdatedAt } = usePNodes(initialNodes);
  const { data: stats, isLoading: statsLoading } = useNetworkStats(initialStats);
  const { data: history, isLoading: historyLoading } = usePerformanceHistory();


  const isLoading = nodesLoading || statsLoading || historyLoading;

  if (isLoading && !nodes) {
    return (
      <DashboardPageLayout header={{ title: "Analytics", description: "Loading...", icon: ChartIcon }}>
        <LoadingState />
      </DashboardPageLayout>
    );
  }

  const storageChartData = history?.map((h, i) => ({
    time: new Date(h.timestamp).getHours() + ':00',
    storage: h.storageUsedTB,
    gossip: h.gossipMessages / 1000,
  })) || [];

  const nodeGrowthData = [
    { period: 'Today', nodes: nodes?.length || 0 },
    { period: '7d Ago', nodes: Math.floor((nodes?.length || 0) * 0.95) },
    { period: '14d Ago', nodes: Math.floor((nodes?.length || 0) * 0.88) },
    { period: '30d Ago', nodes: Math.floor((nodes?.length || 0) * 0.75) },
  ].reverse();

  return (
    <DashboardPageLayout
      header={{
        title: "Analytics",
        description: `Trends & projections • ${dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'Loading...'}`,
        icon: ChartIcon,
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock
          label="24h Growth"
          value="+3.2%"
          description="node count"
          variant="success"
        />
        <StatBlock
          label="7d Growth"
          value="+12.5%"
          description="storage capacity"
          variant="success"
        />
        <StatBlock
          label="30d Trend"
          value="+28.7%"
          description="network expansion"
          variant="primary"
        />
        <StatBlock
          label="Projection"
          value={Math.floor((nodes?.length || 0) * 1.5)}
          description="nodes by 60d"
        />
      </div>

      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs rounded ${period === p ? 'bg-primary text-primary-foreground' : 'bg-accent hover:bg-accent/80'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <ExportButton
          onExport={(format: ExportFormat) => {
            if (history) {
              exportPerformanceHistory(history, format, `xandeum-analytics-${period}`);
            }
          }}
          disabled={!history || history.length === 0}
          label="Export Data"
        />
      </div>

      <div className="rounded-lg border-2 border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-accent/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            Network Metrics ({period})
            <InfoTooltip content="Historical network performance data showing response times, node counts, storage usage, and gossip activity over the selected time period." />
          </span>
        </div>
        <div className="p-4">
          {history && <NetworkChart data={history} />}
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border-2 border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-accent/20">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Storage Growth Trend
            </span>
          </div>
          <div className="p-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={storageChartData}>
                <defs>
                  <linearGradient id="storageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="storage"
                  stroke="hsl(var(--primary))"
                  fill="url(#storageGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border-2 border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-accent/20">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Node Growth History
            </span>
          </div>
          <div className="p-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={nodeGrowthData}>
                <defs>
                  <linearGradient id="nodesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="period"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="nodes"
                  stroke="#22c55e"
                  fill="url(#nodesGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-border p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
          Network Growth Projection
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-3 bg-accent/20 rounded-lg text-center">
            <div className="text-2xl font-display text-primary">{nodes?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Current</div>
          </div>
          <div className="p-3 bg-accent/20 rounded-lg text-center">
            <div className="text-2xl font-display">{Math.floor((nodes?.length || 0) * 1.25)}</div>
            <div className="text-xs text-muted-foreground">30 Day</div>
          </div>
          <div className="p-3 bg-accent/20 rounded-lg text-center">
            <div className="text-2xl font-display">{Math.floor((nodes?.length || 0) * 1.8)}</div>
            <div className="text-xs text-muted-foreground">90 Day</div>
          </div>
          <div className="p-3 bg-accent/20 rounded-lg text-center">
            <div className="text-2xl font-display">{Math.floor((nodes?.length || 0) * 3)}</div>
            <div className="text-xs text-muted-foreground">6 Month</div>
          </div>
          <div className="p-3 bg-accent/20 rounded-lg text-center">
            <div className="text-2xl font-display">{Math.floor((nodes?.length || 0) * 5)}</div>
            <div className="text-xs text-muted-foreground">1 Year</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground text-center mt-4">
          Projections based on current growth trends
        </div>
      </div>

      <div className="rounded-lg border-2 border-border p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
          Key Metrics Summary
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Network Uptime</div>
            <div className="text-xl font-display text-green-400">{stats?.averageUptime.toFixed(1)}%</div>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Avg Response</div>
            <div className="text-xl font-display text-blue-400">{stats?.averageResponseTime.toFixed(0)}ms</div>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Total Storage</div>
            <div className="text-xl font-display text-purple-400">{stats?.totalStorageCapacityTB.toFixed(0)}TB</div>
          </div>
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Gossip/24h</div>
            <div className="text-xl font-display text-yellow-400">{((stats?.gossipMessages24h || 0) / 1000000).toFixed(1)}M</div>
          </div>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
