'use client';

import DashboardPageLayout from "@/components/dashboard/layout";
import GlobeIcon from "@/components/icons/globe";
import { usePNodes, useGossipHealth, useStorageDistribution } from "@/hooks/use-pnode-data-query";
import type { PNode } from "@/types/pnode";
import { LeafletMap } from "@/components/dashboard/leaflet-map";
import { GossipHealthPanel, StorageDistributionPanel } from "@/components/dashboard/gossip-health";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";

// Icons
import ServerIcon from "@/components/icons/server";
import ActivityIcon from "@/components/icons/gear"; // Using gear as activity/gossip

const NetworkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v8M12 14v8M2 12h8M14 12h8" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  );
}

import { StatCard } from "@/components/dashboard/stat-card";

export default function NetworkPage() {
  const { data: nodes, isLoading: nodesLoading, dataUpdatedAt } = usePNodes();
  const { data: gossipHealth, isLoading: gossipLoading } = useGossipHealth();
  const { data: distribution, isLoading: distLoading } = useStorageDistribution();

  const isLoading = nodesLoading || gossipLoading || distLoading;

  if (isLoading && !nodes) {
    return (
      <DashboardPageLayout header={{ title: "Topology", description: "Loading...", icon: GlobeIcon }}>
        <LoadingState />
      </DashboardPageLayout>
    );
  }

  const onlineNodesCount = nodes?.filter((n: any) => n.status === 'online').length || 0;
  const avgPeers = nodes?.length ? nodes.reduce((acc: number, n: any) => acc + (n.peers?.length || 0), 0) / nodes.length : 0;

  const totalMessages = nodes?.reduce((acc: number, n: any) => acc + (n.gossip?.messagesReceived || 0) + (n.gossip?.messagesSent || 0), 0) || 0;
  const networkLatency = nodes?.length ? nodes.reduce((acc: number, n: any) => acc + (n.latency || 0), 0) / nodes.length : 0;

  return (
    <DashboardPageLayout
      header={{
        title: "Topology",
        description: `Gossip network • ${dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'Connecting...'}`,
        icon: GlobeIcon,
      }}
    >
      {/* Top metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          label="ACTIVE NODES"
          value={onlineNodesCount}
          description={`OF ${nodes?.length || 0} TOTAL`}
          icon={ServerIcon}
          intent="positive"
        />
        <StatCard
          label="AVG PEERS"
          value={avgPeers.toFixed(1)}
          description="CONNECTIONS PER NODE"
          icon={NetworkIcon}
          intent="positive"
        />
        <StatCard
          label="MESSAGE RATE"
          value={gossipHealth?.messageRate || 0}
          description="MSGS / SEC"
          icon={ActivityIcon}
          intent="neutral"
        />
        <StatCard
          label="NETWORK LATENCY"
          value={gossipHealth?.networkLatency?.toFixed(0) || 0}
          description="AVG PROPAGATION MS"
          icon={GlobeIcon}
          intent="neutral"
        />
      </div>

      <StatCard
        label="NETWORK TOPOLOGY - GOSSIP PROTOCOL"
        icon={GlobeIcon}
        description="HERRENBERG PROTOCOL ACTIVE"
        className="mb-6"
      >
        <div className="h-[400px] -mx-3 -mb-3 md:-mx-6 md:-mb-6 md:mt-4">
          {nodes && <LeafletMap nodes={nodes} />}
        </div>
      </StatCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {gossipHealth && <GossipHealthPanel health={gossipHealth} />}
        {distribution && <StorageDistributionPanel distribution={distribution} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StatCard label="PEER CONNECTION DISTRIBUTION" icon={NetworkIcon}>
          <div className="space-y-4 md:mt-4">
            {[
              { label: '50+ PEERS', min: 50, max: Infinity, color: 'bg-green-500' },
              { label: '30-50 PEERS', min: 30, max: 50, color: 'bg-blue-500' },
              { label: '15-30 PEERS', min: 15, max: 30, color: 'bg-yellow-500' },
              { label: '< 15 PEERS', min: 0, max: 15, color: 'bg-red-500' },
            ].map(({ label, min, max, color }) => {
              const onlineNodes = nodes?.filter((n: PNode) => n.status === 'online') || [];
              const count = onlineNodes.filter((n: PNode) =>
                n.gossip.peersConnected >= min && n.gossip.peersConnected < max
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
                  <div className="w-24 text-right text-[10px] font-mono text-muted-foreground uppercase tracking-tight">
                    {count} NODES • {percentage.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </StatCard>

        <StatCard label="GOSSIP MESSAGE FLOW (1H)" icon={ActivityIcon}>
          <div className="grid grid-cols-2 gap-6 md:mt-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Total Processed</p>
              <div className="text-3xl font-display text-primary">
                <NumberFlow value={totalMessages / 1000000} suffix="M" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 items-center flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Network Wide
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Gossip Health</p>
              <div className="text-3xl font-display text-green-400">
                <NumberFlow value={gossipHealth?.healthScore || 0} suffix="%" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 items-center flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Protocol Efficiency
              </p>
            </div>
          </div>
        </StatCard>
      </div>
    </DashboardPageLayout>
  );
}
