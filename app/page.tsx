'use client';

import { Suspense, lazy } from 'react';
import DashboardPageLayout from "@/components/dashboard/layout";
import BracketsIcon from "@/components/icons/brackets";
import { usePNodes, useNetworkStats, usePerformanceHistory, useGossipEvents, useXScore } from "@/hooks/use-pnode-data";
import { NetworkStatsGrid } from "@/components/dashboard/network-stats";
import { NetworkChart } from "@/components/dashboard/network-chart";
import { Skeleton } from "@/components/ui/skeleton";

const Globe3D = lazy(() => import("@/components/dashboard/globe-3d").then(mod => ({ default: mod.Globe3D })));

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}

export default function DashboardOverview() {
  const { data: nodes, loading: nodesLoading, lastUpdated: nodesUpdated } = usePNodes();
  const { data: stats, loading: statsLoading } = useNetworkStats();
  const { data: history, loading: historyLoading } = usePerformanceHistory();
  const { data: gossipEvents } = useGossipEvents();
  const { data: xScore } = useXScore();

  const isLoading = nodesLoading || statsLoading || historyLoading;

  const lastUpdatedText = nodesUpdated
    ? `Last updated ${nodesUpdated.toLocaleTimeString()}`
    : 'Connecting...';

  if (isLoading && !nodes) {
    return (
      <DashboardPageLayout
        header={{
          title: "Dashboard",
          description: "Loading...",
          icon: BracketsIcon,
        }}
      >
        <LoadingState />
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Dashboard",
        description: lastUpdatedText,
        icon: BracketsIcon,
      }}
    >
      {stats && <NetworkStatsGrid stats={stats} />}

      {xScore && (
        <div className="rounded-lg border-2 border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Network X-Score
            </span>
            <span className={`text-2xl font-display ${xScore.grade === 'S' ? 'text-yellow-400' :
                xScore.grade === 'A' ? 'text-green-400' :
                  xScore.grade === 'B' ? 'text-blue-400' :
                    xScore.grade === 'C' ? 'text-orange-400' :
                      'text-red-400'
              }`}>
              {xScore.grade}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 rounded-lg bg-accent/20 border border-border">
              <div className="text-xs text-muted-foreground uppercase">Overall</div>
              <div className="text-xl font-display text-primary">{xScore.overall.toFixed(1)}</div>
            </div>
            <div className="p-3 rounded-lg bg-accent/20 border border-border">
              <div className="text-xs text-muted-foreground uppercase">Throughput</div>
              <div className="text-xl font-display text-cyan-400">{xScore.storageThroughput.toFixed(1)}</div>
            </div>
            <div className="p-3 rounded-lg bg-accent/20 border border-border">
              <div className="text-xs text-muted-foreground uppercase">Latency</div>
              <div className="text-xl font-display text-green-400">{xScore.dataAvailabilityLatency.toFixed(1)}</div>
            </div>
            <div className="p-3 rounded-lg bg-accent/20 border border-border">
              <div className="text-xs text-muted-foreground uppercase">Uptime</div>
              <div className="text-xl font-display text-blue-400">{xScore.uptime.toFixed(1)}</div>
            </div>
            <div className="p-3 rounded-lg bg-accent/20 border border-border">
              <div className="text-xs text-muted-foreground uppercase">Gossip</div>
              <div className="text-xl font-display text-purple-400">{xScore.gossipHealth.toFixed(1)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border-2 border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-accent/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            3D Network Globe
          </span>
          <span className="text-xs text-primary">
            {nodes?.filter(n => n.status === 'online').length || 0} nodes online
          </span>
        </div>
        <div className="h-[400px]">
          <Suspense fallback={
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <Skeleton className="w-32 h-32 rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Loading 3D Globe...</span>
            </div>
          }>
            {nodes && <Globe3D nodes={nodes} gossipEvents={gossipEvents || undefined} />}
          </Suspense>
        </div>
      </div>

      <div className="rounded-lg border-2 border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-accent/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Network Performance (24h)
          </span>
          <span className="text-xs text-muted-foreground">
            {stats?.gossipMessages24h.toLocaleString()} gossip messages
          </span>
        </div>
        <div className="p-4">
          {history && <NetworkChart data={history} />}
        </div>
      </div>

      {nodes && (
        <div className="rounded-lg border-2 border-border p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
            Top Performing pNodes
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...nodes]
              .filter(n => n.status === 'online')
              .sort((a, b) => b.performance.score - a.performance.score)
              .slice(0, 4)
              .map((node, index) => (
                <div
                  key={node.id}
                  className="p-4 rounded-lg bg-accent/20 border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-display text-primary">#{index + 1}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${node.performance.tier === 'excellent' ? 'bg-green-500/20 text-green-400' :
                        node.performance.tier === 'good' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-yellow-500/20 text-yellow-400'
                      }`}>
                      {node.performance.tier.toUpperCase()}
                    </span>
                  </div>
                  <div className="font-mono text-sm truncate mb-1">
                    {node.pubkey.slice(0, 12)}...
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {node.location?.city}, {node.location?.countryCode}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-mono text-primary">{node.performance.score.toFixed(1)}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </DashboardPageLayout>
  );
}
