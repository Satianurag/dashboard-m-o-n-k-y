'use client';

import type { NetworkStats } from '@/types/pnode';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/dashboard/info-tooltip';

interface NetworkStatsProps {
  stats: NetworkStats;
}

import { StatCard } from "@/components/dashboard/stat-card";
import ServerIcon from "@/components/icons/server";
import ActivityIcon from "@/components/icons/gear";
import GlobeIcon from "@/components/icons/globe";
import { HardDriveIcon } from "lucide-react";

export function NetworkStatsGrid({ stats }: NetworkStatsProps) {
  const healthVariant = stats.networkHealth >= 90 ? 'success'
    : stats.networkHealth >= 70 ? 'warning'
      : 'danger';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="TOTAL PNODES"
        value={stats.totalNodes}
        description={`${stats.onlineNodes} ONLINE`}
        icon={ServerIcon}
        intent="neutral"
      />
      <StatCard
        label="NETWORK HEALTH"
        value={`${stats.networkHealth.toFixed(1)}%`}
        description={stats.degradedNodes > 0 ? `${stats.degradedNodes} DEGRADED` : 'ALL SYSTEMS NORMAL'}
        icon={ActivityIcon}
        intent={stats.networkHealth >= 90 ? 'positive' : stats.networkHealth >= 70 ? 'neutral' : 'negative'}
      />
      <StatCard
        label="TOTAL STORAGE"
        value={`${stats.totalStorageUsedTB.toFixed(1)}TB`}
        description={`OF ${stats.totalStorageCapacityTB.toFixed(1)}TB CAPACITY`}
        icon={HardDriveIcon}
        intent="neutral"
      />
      <StatCard
        label="AVG RESPONSE"
        value={`${stats.averageResponseTime.toFixed(0)}MS`}
        description="NETWORK LATENCY"
        icon={GlobeIcon}
        intent={stats.averageResponseTime < 100 ? 'positive' : stats.averageResponseTime < 150 ? 'neutral' : 'negative'}
      />
    </div>
  );
}

export function NetworkHealthBar({ stats }: NetworkStatsProps) {
  const online = (stats.onlineNodes / stats.totalNodes) * 100;
  const degraded = (stats.degradedNodes / stats.totalNodes) * 100;
  const offline = (stats.offlineNodes / stats.totalNodes) * 100;

  return (
    <div className="p-4 rounded-lg border-2 border-border">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
        Node Distribution
      </div>
      <div className="h-4 rounded-full overflow-hidden flex">
        <div
          className="bg-green-500 transition-all"
          style={{ width: `${online}%` }}
        />
        <div
          className="bg-yellow-500 transition-all"
          style={{ width: `${degraded}%` }}
        />
        <div
          className="bg-red-500 transition-all"
          style={{ width: `${offline}%` }}
        />
      </div>
      <div className="flex justify-between mt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>{stats.onlineNodes} Online</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>{stats.degradedNodes} Degraded</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>{stats.offlineNodes} Offline</span>
        </div>
      </div>
    </div>
  );
}
