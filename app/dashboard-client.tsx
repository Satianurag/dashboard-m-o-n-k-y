'use client';

import { Suspense, lazy, useState, useEffect } from 'react';
import DashboardPageLayout from "@/components/dashboard/layout";
import { Bullet } from "@/components/ui/bullet";
import BracketsIcon from "@/components/icons/brackets";
import GearIcon from "@/components/icons/gear";
import ProcessorIcon from "@/components/icons/proccesor";
import BoomIcon from "@/components/icons/boom";
import TrophyIcon from "@/components/icons/trophy";
import ServerIcon from "@/components/icons/server";
import AtomIcon from "@/components/icons/atom";
import GlobeIcon from "@/components/icons/globe";
import { usePNodes, useNetworkStats, usePerformanceHistory, useGossipEvents, useXScore } from "@/hooks/use-pnode-data-query";
import DashboardStat from "@/components/dashboard/stat";
import { StatCard } from "@/components/dashboard/stat-card";
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            label="NETWORK X-SCORE"
            value={xScore.grade}
            description={`SCORE: ${xScore.overall.toFixed(1)}`}
            icon={TrophyIcon}
            intent={xScore.grade === 'S' || xScore.grade === 'A' ? "positive" : xScore.grade === 'B' ? "neutral" : "negative"}
          />
          <StatCard
            label="THROUGHPUT"
            value={xScore.storageThroughput.toFixed(1)}
            description="STORAGE OPS"
            icon={ServerIcon}
            intent="positive"
          />
          <StatCard
            label="DATA LATENCY"
            value={xScore.dataAvailabilityLatency.toFixed(1)}
            description="AVAILABILITY"
            icon={AtomIcon}
            intent="positive"
          />
          <StatCard
            label="GOSSIP HEALTH"
            value={xScore.gossipHealth.toFixed(1)}
            description="PROTOCOL SYNC"
            icon={GlobeIcon}
            intent="positive"
          />
        </div>
      )}

      <StatCard
        label="NETWORK MAP"
        icon={GlobeIcon}
        description={`${nodes?.filter((n: any) => n.status === 'online').length || 0} nodes online`}
        className="mb-6 font-display"
      >
        <div className="h-[400px] -mx-3 -mb-3 md:-mx-6 md:-mb-6 md:mt-4">
          {nodes && <LeafletMap nodes={nodes} />}
        </div>
      </StatCard>

      <StatCard
        label="NETWORK PERFORMANCE (24H)"
        icon={BoomIcon}
        description={`${stats?.gossipMessages24h.toLocaleString()} GOSSIP MESSAGES`}
        className="mb-6"
      >
        <div className="p-0 md:mt-4">
          {history && <NetworkChart data={history} />}
        </div>
      </StatCard>

      {/* Top Performing pNodes removed as requested */}
    </DashboardPageLayout>
  );
}
