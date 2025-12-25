'use client';

import type { GossipHealth, StorageDistribution } from '@/types/pnode';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/dashboard/stat-card';
import { Bullet } from '@/components/ui/bullet';

// Icons
import ActivityIcon from "@/components/icons/gear";
import DatabaseIcon from "@/components/icons/server";

export function GossipHealthPanel({ health }: GossipHealthProps) {
  const healthIntent = health.healthScore >= 90 ? 'positive' : health.healthScore >= 70 ? 'neutral' : 'negative';

  return (
    <StatCard label="GOSSIP PROTOCOL HEALTH" icon={ActivityIcon}>
      <div className="grid grid-cols-2 gap-px bg-border/20 -mx-3 -mb-3 md:-mx-6 md:-mb-6 md:mt-4 overflow-hidden rounded-b-lg">
        {/* Total Peers */}
        <div className="bg-card/40 p-4">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Total Peers</p>
          <div className="text-2xl font-display">{health.totalPeers.toLocaleString()}</div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 flex items-center gap-1">
            <Bullet variant="default" className="size-1.5" />
            Connections
          </p>
        </div>

        {/* Avg Peers/Node */}
        <div className="bg-card/40 p-4">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Avg Peers/Node</p>
          <div className="text-2xl font-display">{health.avgPeersPerNode.toFixed(1)}</div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 flex items-center gap-1">
            <Bullet variant="default" className="size-1.5" />
            Per Node
          </p>
        </div>

        {/* Message Rate */}
        <div className="bg-card/40 p-4">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Message Rate</p>
          <div className="text-2xl font-display">{health.messageRate.toLocaleString()}/s</div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 flex items-center gap-1">
            <Bullet variant="default" className="size-1.5" />
            Msgs/sec
          </p>
        </div>

        {/* Network Latency */}
        <div className="bg-card/40 p-4">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Network Latency</p>
          <div className="text-2xl font-display">{health.networkLatency.toFixed(0)}MS</div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 flex items-center gap-1">
            <Bullet variant="default" className="size-1.5" />
            Avg Latency
          </p>
        </div>
      </div>

      {health.partitions > 0 && (
        <div className="p-3 bg-yellow-500/10 border-t border-yellow-500/30 -mx-6 mb-[-1.5rem] mt-6">
          <div className="text-[10px] text-yellow-500 uppercase font-bold text-center tracking-widest">
            ⚠ {health.partitions} Network Partition{health.partitions > 1 ? 's' : ''} Detected
          </div>
        </div>
      )}
    </StatCard>
  );
}

interface GossipHealthProps {
  health: GossipHealth;
}

interface StorageDistributionProps {
  distribution: StorageDistribution[];
}

export function StorageDistributionPanel({ distribution }: StorageDistributionProps) {
  const maxNodes = Math.max(...distribution.map(d => d.nodeCount));

  return (
    <StatCard label="STORAGE DISTRIBUTION BY REGION" icon={DatabaseIcon}>
      <div className="space-y-4 md:mt-4">
        {distribution.slice(0, 8).map((region) => (
          <div key={region.region} className="flex items-center gap-3">
            <div className="w-24 text-[10px] font-bold uppercase truncate text-muted-foreground">{region.region}</div>
            <div className="flex-1 h-2 bg-card rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(region.nodeCount / maxNodes) * 100}%` }}
              />
            </div>
            <div className="w-20 text-right text-[10px] font-mono font-bold uppercase">
              {region.nodeCount} NODES
            </div>
            <div className="w-16 text-right text-[10px] text-muted-foreground font-mono uppercase">
              {region.storageUsedTB.toFixed(1)}TB
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border/20 text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex justify-between">
        <span>{distribution.length} REGIONS</span>
        <span>{distribution.reduce((acc, d) => acc + d.nodeCount, 0)} TOTAL NODES</span>
      </div>
    </StatCard>
  );
}
