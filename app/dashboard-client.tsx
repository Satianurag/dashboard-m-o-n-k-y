'use client';

import { Suspense, lazy, useState, useEffect } from 'react';
import DashboardPageLayout from "@/components/dashboard/layout";
import BracketsIcon from "@/components/icons/brackets";
import GearIcon from "@/components/icons/gear";
import ProcessorIcon from "@/components/icons/proccesor";
import BoomIcon from "@/components/icons/boom";
import { usePNodes, useNetworkStats, usePerformanceHistory, useGossipEvents, useXScore } from "@/hooks/use-pnode-data-query";
import DashboardStat from "@/components/dashboard/stat";
import { NetworkChart } from "@/components/dashboard/network-chart";
import { InfoTooltip } from "@/components/dashboard/info-tooltip";
import { Skeleton } from "@/components/ui/skeleton";

import { LeafletMap } from "@/components/dashboard/leaflet-map";

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

export default function DashboardOverview({
  initialNodes,
  initialStats
}: {
  initialNodes: any[] | null;
  initialStats: any | null;
}) {
  const { data: nodes, isLoading: nodesLoading, dataUpdatedAt } = usePNodes(initialNodes);
  const { data: stats, isLoading: statsLoading } = useNetworkStats(initialStats);
  const { data: history, isLoading: historyLoading } = usePerformanceHistory();
  const { data: gossipEvents } = useGossipEvents();
  const { data: xScore } = useXScore();


  const isLoading = nodesLoading || statsLoading || historyLoading;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const lastUpdatedText = mounted && dataUpdatedAt
    ? `Last updated ${new Date(dataUpdatedAt).toLocaleTimeString()}`
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
      {/* Stats with arrows - exactly like reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <DashboardStat
          label="TOTAL PNODES"
          value={stats?.totalNodes?.toString() || "0"}
          description={`${stats?.onlineNodes || 0} ONLINE`}
          icon={GearIcon}
          intent="positive"
          direction="up"
        />
        <DashboardStat
          label="NETWORK HEALTH"
          value={`${stats?.networkHealth?.toFixed(1) || "0"}%`}
          description={stats?.degradedNodes && stats.degradedNodes > 0 ? `${stats.degradedNodes} DEGRADED` : "ALL SYSTEMS NORMAL"}
          icon={ProcessorIcon}
          intent="negative"
          direction="down"
        />
        <DashboardStat
          label="AVG RESPONSE"
          value={`${stats?.averageResponseTime?.toFixed(0) || "0"}ms`}
          description="NETWORK LATENCY"
          icon={BoomIcon}
          intent={stats?.averageResponseTime && stats.averageResponseTime < 100 ? "positive" : "neutral"}
          tag={stats?.averageResponseTime && stats.averageResponseTime < 100 ? "FAST" : undefined}
        />
      </div>

      {xScore && (
        <div className="rounded-lg border-2 border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              Network X-Score
              <InfoTooltip content="A composite score (0-100) representing overall network health, calculated from throughput, latency, uptime, and gossip health. Grade: S (95+), A (85+), B (70+), C (50+), D (30+), F (<30)." />
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-accent/20 border border-border">
              <div className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                Overall
                <InfoTooltip content="Weighted average score combining all network performance metrics." />
              </div>
              <div className="text-xl font-display text-primary">{xScore.overall.toFixed(1)}</div>
            </div>
            <div className="p-3 rounded-lg bg-accent/20 border border-border">
              <div className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                Throughput
                <InfoTooltip content="Measures data read/write efficiency. Higher throughput = better performance for storage operations." />
              </div>
              <div className="text-xl font-display text-cyan-400">{xScore.storageThroughput.toFixed(1)}</div>
            </div>
            <div className="p-3 rounded-lg bg-accent/20 border border-border">
              <div className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                Latency
                <InfoTooltip content="Time to make stored data available for retrieval. Lower latency scores higher." />
              </div>
              <div className="text-xl font-display text-green-400">{xScore.dataAvailabilityLatency.toFixed(1)}</div>
            </div>

            <div className="p-3 rounded-lg bg-accent/20 border border-border">
              <div className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                Gossip
                <InfoTooltip content="Measures gossip protocol health including peer discovery, message propagation, and network sync." />
              </div>
              <div className="text-xl font-display text-purple-400">{xScore.gossipHealth.toFixed(1)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border-2 border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-accent/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Network Map
          </span>
          <span className="text-xs text-primary">
            {nodes?.filter((n: any) => n.status === 'online').length || 0} nodes online
          </span>
        </div>
        <div className="h-[400px]">
          {nodes && <LeafletMap nodes={nodes} />}
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

      {/* Top Performing pNodes removed as requested */}
    </DashboardPageLayout>
  );
}
