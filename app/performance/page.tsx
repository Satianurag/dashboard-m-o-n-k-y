'use client';

import { useState } from 'react';
import DashboardPageLayout from "@/components/dashboard/layout";
import { usePNodes, usePerformanceHistory } from "@/hooks/use-pnode-data-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

// Icons
import TrophyIcon from "@/components/icons/trophy";
import BoomIcon from "@/components/icons/boom";
import ProcessorIcon from "@/components/icons/proccesor";
import GearIcon from "@/components/icons/gear";
import ServerIcon from "@/components/icons/server";

const TimerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ZapIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

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

import { StatCard } from "@/components/dashboard/stat-card";

export default function PerformancePage() {
  const { data: nodes, isLoading, dataUpdatedAt } = usePNodes();
  const { data: history } = usePerformanceHistory('24h');

  if (isLoading && !nodes) {
    return (
      <DashboardPageLayout header={{ title: "Performance", description: "Loading...", icon: TrophyIcon }}>
        <LoadingState />
      </DashboardPageLayout>
    );
  }

  const topNodes = nodes?.sort((a: any, b: any) => (b.performanceScore || 0) - (a.performanceScore || 0)).slice(0, 5) || [];
  const excellentNodes = nodes?.filter((n: any) => (n.performanceScore || 0) >= 90) || [];
  const goodNodes = nodes?.filter((n: any) => (n.performanceScore || 0) >= 70 && (n.performanceScore || 0) < 90) || [];
  const fairNodes = nodes?.filter((n: any) => (n.performanceScore || 0) >= 40 && (n.performanceScore || 0) < 70) || [];
  const poorNodes = nodes?.filter((n: any) => (n.performanceScore || 0) < 40) || [];
  const avgPerformance = nodes && nodes.length > 0
    ? nodes.reduce((acc: number, n: any) => acc + (n.performanceScore || 0), 0) / nodes.length
    : 0;

  const onlineNodes = nodes?.filter(n => n.status === 'online') || [];
  const excellentCount = onlineNodes.filter(n => n.performance.tier === 'excellent').length;
  const goodCount = onlineNodes.filter(n => n.performance.tier === 'good').length;
  const fairCount = onlineNodes.filter(n => n.performance.tier === 'fair').length;
  const poorCount = onlineNodes.filter(n => n.performance.tier === 'poor').length;

  const avgScore = onlineNodes.length > 0
    ? onlineNodes.reduce((acc, n) => acc + n.performance.score, 0) / onlineNodes.length
    : 0;

  const historyData = history?.map((h: any) => ({
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
      {/* Top metrics - standardized grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <StatCard
          label="AVG SCORE"
          value={avgScore.toFixed(1)}
          description="NETWORK WIDE"
          icon={TrophyIcon}
          intent="positive"
        />
        <StatCard
          label="EXCELLENT"
          value={excellentCount}
          description="SCORE > 90"
          icon={ZapIcon}
          intent="positive"
        />
        <StatCard
          label="GOOD"
          value={goodCount}
          description="SCORE 75-90"
          icon={ProcessorIcon}
          intent="positive"
        />
        <StatCard
          label="FAIR"
          value={fairCount}
          description="SCORE 50-75"
          icon={GearIcon}
          intent="neutral"
        />
        <StatCard
          label="POOR"
          value={poorCount}
          description="SCORE < 50"
          icon={BoomIcon}
          intent="negative"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top 10 Leaderboard */}
        <StatCard label="TOP 10 LEADERBOARD" icon={TrophyIcon} description="BY PERFORMANCE SCORE">
          <div className="divide-y divide-border/20 -mx-3 -mb-3 md:-mx-6 md:-mb-6 md:mt-4">
            {topNodes.map((node: any, i: number) => (
              <div key={node.id} className="px-4 py-3 flex items-center gap-4 hover:bg-card/30 transition-colors">
                <span className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-display text-lg",
                  i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                    i === 1 ? "bg-gray-400/20 text-gray-300" :
                      i === 2 ? "bg-amber-700/20 text-amber-600" :
                        "bg-card text-muted-foreground"
                )}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm truncate uppercase">{node.pubkey.slice(0, 20)}...</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-tight">
                    {node.location?.city}, {node.location?.countryCode} • {node.uptime.toFixed(1)}% UPTIME
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
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-tight">
                    {node.metrics.responseTimeMs.toFixed(0)}MS
                  </div>
                </div>
              </div>
            ))}
          </div>
        </StatCard>

        {/* Latency Trends */}
        <StatCard label="LATENCY TRENDS (24H)" icon={TimerIcon}>
          <div className="h-[340px] md:mt-4">
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
                  formatter={(value) => [`${Number(value).toFixed(0)}MS`]}
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
        </StatCard>
      </div>

      {/* Distribution Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StatCard label="PERFORMANCE TIER DISTRIBUTION" icon={ZapIcon}>
          <div className="md:mt-4">
            <div className="h-8 rounded-full overflow-hidden flex bg-card/50">
              {excellentCount > 0 && (
                <div
                  className="bg-green-500 flex items-center justify-center text-[10px] font-bold text-black uppercase"
                  style={{ width: `${(excellentCount / onlineNodes.length) * 100}%` }}
                >
                  {excellentCount > 2 && 'Excellent'}
                </div>
              )}
              {goodCount > 0 && (
                <div
                  className="bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white uppercase"
                  style={{ width: `${(goodCount / onlineNodes.length) * 100}%` }}
                >
                  {goodCount > 2 && 'Good'}
                </div>
              )}
              {fairCount > 0 && (
                <div
                  className="bg-yellow-500 flex items-center justify-center text-[10px] font-bold text-black uppercase"
                  style={{ width: `${(fairCount / onlineNodes.length) * 100}%` }}
                >
                  {fairCount > 2 && 'Fair'}
                </div>
              )}
              {poorCount > 0 && (
                <div
                  className="bg-red-500 flex items-center justify-center text-[10px] font-bold text-white uppercase"
                  style={{ width: `${(poorCount / onlineNodes.length) * 100}%` }}
                >
                  {poorCount > 2 && 'Poor'}
                </div>
              )}
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              <span>{onlineNodes.length} ONLINE NODES ANALYZED</span>
              <span>UPDATED EVERY 30S</span>
            </div>
          </div>
        </StatCard>

        <StatCard label="LATENCY DISTRIBUTION" icon={TimerIcon}>
          <div className="space-y-4 md:mt-4">
            {[
              { label: '< 80MS', min: 0, max: 80, color: 'bg-green-500' },
              { label: '80-120MS', min: 80, max: 120, color: 'bg-blue-500' },
              { label: '120-200MS', min: 120, max: 200, color: 'bg-yellow-500' },
              { label: '> 200MS', min: 200, max: Infinity, color: 'bg-red-500' },
            ].map(({ label, min, max, color }) => {
              const count = onlineNodes.filter(n =>
                n.metrics.responseTimeMs >= min && n.metrics.responseTimeMs < max
              ).length;
              const percentage = onlineNodes.length > 0 ? (count / onlineNodes.length) * 100 : 0;

              return (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-24 text-[10px] text-muted-foreground font-bold uppercase">{label}</div>
                  <div className="flex-1 h-3 bg-card rounded overflow-hidden">
                    <div
                      className={cn('h-full rounded transition-all', color)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-20 text-right text-[10px] font-mono text-muted-foreground">
                    {count} NODES
                  </div>
                </div>
              );
            })}
          </div>
        </StatCard>
      </div>
    </DashboardPageLayout>
  );
}
