'use client';

import type { NetworkStats } from '@/types/pnode';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/dashboard/info-tooltip';

interface NetworkStatsProps {
  stats: NetworkStats;
}

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  tooltip?: string;
}

function StatCard({ label, value, subValue, trend, variant = 'default', tooltip }: StatCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-500/30 bg-green-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    danger: 'border-red-500/30 bg-red-500/5',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-muted-foreground',
  };

  return (
    <div className={cn(
      'p-4 rounded-lg border-2 transition-all hover:border-primary/50',
      variantStyles[variant]
    )}>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
        {label}
        {tooltip && <InfoTooltip content={tooltip} />}
        {trend && (
          <span className={cn('text-sm', trendColors[trend])}>
            {trendIcons[trend]}
          </span>
        )}
      </div>
      <div className="text-2xl md:text-3xl font-display">{value}</div>
      {subValue && (
        <div className="text-xs text-muted-foreground mt-1">{subValue}</div>
      )}
    </div>
  );
}

export function NetworkStatsGrid({ stats }: NetworkStatsProps) {
  const healthVariant = stats.networkHealth >= 90 ? 'success'
    : stats.networkHealth >= 70 ? 'warning'
      : 'danger';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total pNodes"
        value={stats.totalNodes}
        subValue={`${stats.onlineNodes} online`}
        variant="default"
        tooltip="Total number of pNodes registered in the Xandeum network, regardless of their current status."
      />
      <StatCard
        label="Network Health"
        value={`${stats.networkHealth.toFixed(1)}%`}
        subValue={stats.degradedNodes > 0 ? `${stats.degradedNodes} degraded` : 'All systems normal'}
        variant={healthVariant}
        tooltip="Percentage of nodes that are online and performing well. Calculated as: (Online Nodes / Total Nodes) × 100."
      />
      <StatCard
        label="Total Storage"
        value={`${stats.totalStorageUsedTB.toFixed(1)} TB`}
        subValue={`of ${stats.totalStorageCapacityTB.toFixed(1)} TB capacity`}
        variant="default"
        tooltip="Combined storage currently being utilized across all pNodes in the network."
      />
      <StatCard
        label="Avg Response"
        value={`${stats.averageResponseTime.toFixed(0)}ms`}
        subValue="Network Latency"
        trend={stats.averageResponseTime < 100 ? 'up' : stats.averageResponseTime < 150 ? 'neutral' : 'down'}
        variant={stats.averageResponseTime < 100 ? 'success' : 'default'}
        tooltip="Mean network latency across all online nodes. Lower is better. Green indicates excellent response times."
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
