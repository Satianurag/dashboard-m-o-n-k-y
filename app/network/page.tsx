'use client';

import DashboardPageLayout from "@/components/dashboard/layout";
import GlobeIcon from "@/components/icons/globe";
import { usePNodes, useGossipHealth, useStorageDistribution } from "@/hooks/use-pnode-data";
import { LeafletMap } from "@/components/dashboard/leaflet-map";
import { GossipHealthPanel, StorageDistributionPanel } from "@/components/dashboard/gossip-health";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingState() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[350px] rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}

export default function NetworkPage() {
  const { data: nodes, loading: nodesLoading, lastUpdated } = usePNodes();
  const { data: gossipHealth, loading: gossipLoading } = useGossipHealth();
  const { data: distribution, loading: distLoading } = useStorageDistribution();

  const isLoading = nodesLoading || gossipLoading || distLoading;

  if (isLoading && !nodes) {
    return (
      <DashboardPageLayout header={{ title: "Topology", description: "Loading...", icon: GlobeIcon }}>
        <LoadingState />
      </DashboardPageLayout>
    );
  }

  const onlineNodes = nodes?.filter(n => n.status === 'online') || [];
  const totalMessages = nodes?.reduce((acc, n) => acc + n.gossip.messagesReceived + n.gossip.messagesSent, 0) || 0;
  const avgPeers = onlineNodes.length > 0
    ? onlineNodes.reduce((acc, n) => acc + n.gossip.peersConnected, 0) / onlineNodes.length
    : 0;

  return (
    <DashboardPageLayout
      header={{
        title: "Topology",
        description: `Gossip network • ${lastUpdated?.toLocaleTimeString() || 'Connecting...'}`,
        icon: GlobeIcon,
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border-2 border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active Nodes</div>
          <div className="text-3xl font-display text-green-400">{onlineNodes.length}</div>
          <div className="text-xs text-muted-foreground mt-1">of {nodes?.length || 0} total</div>
        </div>
        <div className="p-4 rounded-lg border-2 border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Peers</div>
          <div className="text-3xl font-display">{avgPeers.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground mt-1">connections per node</div>
        </div>
        <div className="p-4 rounded-lg border-2 border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Message Rate</div>
          <div className="text-3xl font-display">{gossipHealth?.messageRate.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">msgs/sec</div>
        </div>
        <div className="p-4 rounded-lg border-2 border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Network Latency</div>
          <div className="text-3xl font-display">{gossipHealth?.networkLatency.toFixed(0)}ms</div>
          <div className="text-xs text-muted-foreground mt-1">avg propagation</div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-accent/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Network Topology - Gossip Protocol
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
            <span className="text-muted-foreground">Herrenberg Protocol Active</span>
          </div>
        </div>
        <div className="h-[400px]">
          {nodes && <LeafletMap nodes={nodes} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {gossipHealth && <GossipHealthPanel health={gossipHealth} />}
        {distribution && <StorageDistributionPanel distribution={distribution} />}
      </div>

      <div className="rounded-lg border-2 border-border p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
          Peer Connection Distribution
        </div>
        <div className="space-y-2">
          {[
            { label: '50+ peers', min: 50, max: Infinity, color: 'bg-green-500' },
            { label: '30-50 peers', min: 30, max: 50, color: 'bg-blue-500' },
            { label: '15-30 peers', min: 15, max: 30, color: 'bg-yellow-500' },
            { label: '< 15 peers', min: 0, max: 15, color: 'bg-red-500' },
          ].map(({ label, min, max, color }) => {
            const count = onlineNodes.filter(n => 
              n.gossip.peersConnected >= min && n.gossip.peersConnected < max
            ).length;
            const percentage = onlineNodes.length > 0 ? (count / onlineNodes.length) * 100 : 0;
            
            return (
              <div key={label} className="flex items-center gap-3">
                <div className="w-24 text-xs text-muted-foreground">{label}</div>
                <div className="flex-1 h-4 bg-accent rounded overflow-hidden">
                  <div className={`h-full rounded transition-all ${color}`} style={{ width: `${percentage}%` }} />
                </div>
                <div className="w-20 text-right text-xs font-mono">{count} nodes</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border-2 border-border p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
          Gossip Message Flow (Last Hour)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-accent/20 rounded-lg text-center">
            <div className="text-2xl font-display text-primary">{(totalMessages / 1000000).toFixed(1)}M</div>
            <div className="text-xs text-muted-foreground">Total Messages</div>
          </div>
          <div className="p-3 bg-accent/20 rounded-lg text-center">
            <div className="text-2xl font-display">{gossipHealth?.totalPeers.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Connections</div>
          </div>
          <div className="p-3 bg-accent/20 rounded-lg text-center">
            <div className="text-2xl font-display">{gossipHealth?.partitions || 0}</div>
            <div className="text-xs text-muted-foreground">Network Partitions</div>
          </div>
          <div className="p-3 bg-accent/20 rounded-lg text-center">
            <div className="text-2xl font-display text-green-400">{gossipHealth?.healthScore.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Gossip Health</div>
          </div>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
