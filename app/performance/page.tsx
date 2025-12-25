'use client';

import { useState } from 'react';
import DashboardPageLayout from "@/components/dashboard/layout";
import TrophyIcon from "@/components/icons/trophy";
import { usePNodes, usePerformanceHistory } from "@/hooks/use-pnode-data-query";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  );
}

export default function PerformancePage() {
  const { data: nodes, isLoading, dataUpdatedAt } = usePNodes();
  const { data: history } = usePerformanceHistory('24h');
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');

  if (isLoading && !nodes) {
    return (
      <DashboardPageLayout header={{ title: "Performance", description: "Loading...", icon: TrophyIcon }}>
        <LoadingState />
      </DashboardPageLayout>
    );
  }

  const onlineNodes = nodes?.filter(n => n.status === 'online') || [];
  const excellentCount = onlineNodes.filter(n => n.performance.tier === 'excellent').length;
  const goodCount = onlineNodes.filter(n => n.performance.tier === 'good').length;
  const fairCount = onlineNodes.filter(n => n.performance.tier === 'fair').length;
  const poorCount = onlineNodes.filter(n => n.performance.tier === 'poor').length;

  const avgScore = onlineNodes.length > 0
    ? onlineNodes.reduce((acc, n) => acc + n.performance.score, 0) / onlineNodes.length
    : 0;

  const topNodes = [...onlineNodes].sort((a, b) => b.performance.score - a.performance.score).slice(0, 10);

  const historyData = history?.map((h, i) => ({
    time: new Date(h.timestamp).getHours() + ':00',
    latency: h.avgResponseTime,
    nodes: h.onlineNodes,
  })) || [];

  return (
    <DashboardPageLayout
      header={{
        title: "Performance",
        description: `Rankings & metrics • ${dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'Loading...'}`,
        icon: TrophyIcon,
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-lg border-2 border-primary/50 bg-primary/5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Score</div>
          <div className="text-3xl font-display text-primary">{avgScore.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground mt-1">network wide</div>
        </div>
        <div className="p-4 rounded-lg border-2 border-green-500/30 bg-green-500/5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Excellent</div>
          <div className="text-3xl font-display text-green-500">{excellentCount}</div>
          <div className="text-xs text-muted-foreground mt-1">score &gt; 90</div>
        </div>
        <div className="p-4 rounded-lg border-2 border-blue-500/30 bg-blue-500/5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Good</div>
          <div className="text-3xl font-display text-blue-500">{goodCount}</div>
          <div className="text-xs text-muted-foreground mt-1">score 75-90</div>
        </div>
        <div className="p-4 rounded-lg border-2 border-yellow-500/30 bg-yellow-500/5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fair</div>
          <div className="text-3xl font-display text-yellow-500">{fairCount}</div>
          <div className="text-xs text-muted-foreground mt-1">score 50-75</div>
        </div>
        <div className="p-4 rounded-lg border-2 border-red-500/30 bg-red-500/5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Poor</div>
          <div className="text-3xl font-display text-red-500">{poorCount}</div>
          <div className="text-xs text-muted-foreground mt-1">score &lt; 50</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border-2 border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-accent/20 flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Top 10 Leaderboard
            </span>
            <span className="text-xs text-primary">By Performance Score</span>
          </div>
          <div className="divide-y divide-border">
            {topNodes.map((node, i) => (
              <div key={node.id} className="px-4 py-3 flex items-center gap-4 hover:bg-accent/10">
                <span className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-display text-lg",
                  i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                    i === 1 ? "bg-gray-400/20 text-gray-300" :
                      i === 2 ? "bg-amber-700/20 text-amber-600" :
                        "bg-accent text-muted-foreground"
                )}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm truncate">{node.pubkey.slice(0, 20)}...</div>
                  <div className="text-xs text-muted-foreground">
                    {node.location?.city}, {node.location?.countryCode} • {node.uptime.toFixed(1)}% uptime
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "font-mono text-lg",
                    node.performance.tier === 'excellent' ? 'text-green-400' :
                      node.performance.tier === 'good' ? 'text-blue-400' :
                        'text-yellow-400'
                  )}>
                    {node.performance.score.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">{node.metrics.responseTimeMs.toFixed(0)}ms</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border-2 border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-accent/20">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Latency Trends (24h)
            </span>
          </div>
          <div className="p-4 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
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
                  formatter={(value) => [`${Number(value).toFixed(0)}ms`]}
                />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-border p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
          Performance Tier Distribution
        </div>
        <div className="h-8 rounded-full overflow-hidden flex">
          {excellentCount > 0 && (
            <div
              className="bg-green-500 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${(excellentCount / onlineNodes.length) * 100}%` }}
            >
              {excellentCount > 2 && 'Excellent'}
            </div>
          )}
          {goodCount > 0 && (
            <div
              className="bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${(goodCount / onlineNodes.length) * 100}%` }}
            >
              {goodCount > 2 && 'Good'}
            </div>
          )}
          {fairCount > 0 && (
            <div
              className="bg-yellow-500 flex items-center justify-center text-xs font-medium text-black"
              style={{ width: `${(fairCount / onlineNodes.length) * 100}%` }}
            >
              {fairCount > 2 && 'Fair'}
            </div>
          )}
          {poorCount > 0 && (
            <div
              className="bg-red-500 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${(poorCount / onlineNodes.length) * 100}%` }}
            >
              {poorCount > 2 && 'Poor'}
            </div>
          )}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{onlineNodes.length} online nodes analyzed</span>
          <span>Updated every 30 seconds</span>
        </div>
      </div>

      <div className="rounded-lg border-2 border-border p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
          Latency Distribution
        </div>
        <div className="space-y-2">
          {[
            { label: '< 80ms', min: 0, max: 80, color: 'bg-green-500' },
            { label: '80-120ms', min: 80, max: 120, color: 'bg-blue-500' },
            { label: '120-200ms', min: 120, max: 200, color: 'bg-yellow-500' },
            { label: '> 200ms', min: 200, max: Infinity, color: 'bg-red-500' },
          ].map(({ label, min, max, color }) => {
            const count = onlineNodes.filter(n =>
              n.metrics.responseTimeMs >= min && n.metrics.responseTimeMs < max
            ).length;
            const percentage = onlineNodes.length > 0 ? (count / onlineNodes.length) * 100 : 0;

            return (
              <div key={label} className="flex items-center gap-3">
                <div className="w-24 text-xs text-muted-foreground">{label}</div>
                <div className="flex-1 h-4 bg-accent rounded overflow-hidden">
                  <div
                    className={cn('h-full rounded transition-all', color)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-20 text-right text-xs font-mono">{count} nodes</div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardPageLayout>
  );
}
