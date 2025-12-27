'use client';

import DashboardPageLayout from "@/components/dashboard/layout";
import { useDecentralizationMetrics, usePNodes, useSuperminorityInfo, useCensorshipResistanceScore } from "@/hooks/use-pnode-data-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { cn } from '@/lib/utils';
import NumberFlow from "@number-flow/react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

// Icons
import GlobeIcon from "@/components/icons/globe";
import AtomIcon from "@/components/icons/atom";
import ServerIcon from "@/components/icons/server";
import TrophyIcon from "@/components/icons/trophy";

const NetworkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="5" r="3" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <circle cx="6" cy="19" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="12" y1="12" x2="6" y2="16" />
    <line x1="12" y1="12" x2="18" y2="16" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

const COLORS = ['#00ff88', '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

import { StatCard } from "@/components/dashboard/stat-card";

export default function DecentralizationClient() {
  const { data: metrics, isLoading: metricsLoading } = useDecentralizationMetrics();
  const { data: nodes, isLoading: nodesLoading } = usePNodes();
  const { data: superminority } = useSuperminorityInfo();
  const { data: censorshipScore } = useCensorshipResistanceScore();

  const isLoading = metricsLoading || nodesLoading;

  if (isLoading && !metrics) {
    return (
      <DashboardPageLayout header={{ title: "Decentralization", description: "Loading...", icon: NetworkIcon }}>
        <LoadingState />
      </DashboardPageLayout>
    );
  }

  const countryData = metrics?.countryDistribution.slice(0, 8).map((c: any, i: number) => ({
    name: c.country,
    value: c.count,
    color: COLORS[i % COLORS.length],
  })) || [];

  const datacenterData = metrics?.datacenterDistribution.slice(0, 10).map((d: any) => ({
    name: d.datacenter.length > 12 ? d.datacenter.slice(0, 12) + '...' : d.datacenter,
    count: d.count,
    percentage: d.percentage,
  })) || [];

  const asnData = metrics?.asnDistribution.slice(0, 8).map((a: any) => ({
    name: a.provider,
    count: a.count,
    percentage: a.percentage,
  })) || [];

  const nakamotoScore = metrics?.nakamotoCoefficient || 0;
  const giniScore = metrics?.giniCoefficient || 0;

  return (
    <DashboardPageLayout
      header={{
        title: "Decentralization",
        description: "Infrastructure distribution metrics",
        icon: NetworkIcon,
      }}
    >
      {/* Top Stats - exactly like dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          label="NAKAMOTO COEFFICIENT"
          value={nakamotoScore}
          description="ENTITIES TO CONTROL 51%"
          icon={ShieldIcon}
          intent={nakamotoScore >= 10 ? "positive" : nakamotoScore >= 5 ? "neutral" : "negative"}
        />
        <StatCard
          label="GINI COEFFICIENT"
          value={giniScore.toFixed(3)}
          description="STAKE DISTRIBUTION"
          icon={ChartIcon}
          intent={giniScore < 0.4 ? "positive" : giniScore < 0.6 ? "neutral" : "negative"}
        />
        <StatCard
          label="COUNTRIES"
          value={metrics?.countryDistribution.length || 0}
          description="GEOGRAPHIC SPREAD"
          icon={GlobeIcon}
          intent="positive"
        />
        <StatCard
          label="DATACENTERS"
          value={metrics?.datacenterDistribution.length || 0}
          description="INFRASTRUCTURE PROVIDERS"
          icon={ServerIcon}
          intent="neutral"
        />
      </div>


      {/* Charts - using StatCard wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StatCard label="GEOGRAPHIC DISTRIBUTION" icon={GlobeIcon}>
          <div className="h-[280px] flex items-center" style={{ height: 280 }}>
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={countryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                  >
                    {countryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-1 pl-4">
              {countryData.map((c: any) => (
                <div key={c.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="font-mono">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </StatCard>

        <StatCard label="ASN DISTRIBUTION" icon={ServerIcon} description="HOSTING PROVIDERS">
          <div className="h-[280px]" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={asnData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" tick={{ fill: 'white', fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'white', fontSize: 10 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                  formatter={(value) => [`${Number(value)} nodes (${((Number(value) / (nodes?.length || 1)) * 100).toFixed(1)}%)`]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {asnData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </StatCard>
      </div>

      {/* Concentration & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <StatCard label="DATACENTER CONCENTRATION" icon={ServerIcon} className="lg:col-span-2">
          <div className="space-y-4">
            {datacenterData.map((dc: any) => (
              <div key={dc.name} className="flex items-center gap-3">
                <div className="w-32 text-xs text-muted-foreground truncate" title={dc.name}>{dc.name}</div>
                <div className="flex-1 h-3 bg-card rounded overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded transition-all",
                      dc.percentage > 20 ? "bg-destructive" : dc.percentage > 10 ? "bg-warning" : "bg-success"
                    )}
                    style={{ width: `${Math.min(dc.percentage * 2, 100)}%` }}
                  />
                </div>
                <div className="w-24 text-right text-xs font-mono">
                  {dc.count} ({dc.percentage.toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>
        </StatCard>

        <StatCard label="DECENTRALIZATION HEALTH" icon={ShieldIcon}>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs mb-2 uppercase tracking-wide">
                <span className="text-muted-foreground">Geographic Spread</span>
                <span className="text-success">{metrics?.countryDistribution.length || 0}/50</span>
              </div>
              <div className="h-2 bg-card rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: `${Math.min(((metrics?.countryDistribution.length || 0) / 50) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2 uppercase tracking-wide">
                <span className="text-muted-foreground">Provider Diversity</span>
                <span className="text-primary">{metrics?.asnDistribution.length || 0}/20</span>
              </div>
              <div className="h-2 bg-card rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(((metrics?.asnDistribution.length || 0) / 20) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2 uppercase tracking-wide">
                <span className="text-muted-foreground">Stake Equality</span>
                <span className={giniScore < 0.4 ? 'text-success' : 'text-warning'}>
                  {(1 - giniScore).toFixed(2)}
                </span>
              </div>
              <div className="h-2 bg-card rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${giniScore < 0.4 ? 'bg-success' : giniScore < 0.6 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${(1 - giniScore) * 100}%` }} />
              </div>
            </div>
          </div>
        </StatCard>
      </div>

      {/* Risk and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StatCard label="RISK ASSESSMENT" icon={ShieldIcon}>
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-card/50 rounded flex items-start gap-4">
              <Bullet variant={nakamotoScore >= 10 ? 'success' : 'warning'} size="lg" className="mt-1" />
              <div>
                <div className="text-sm font-semibold uppercase tracking-tight">51% Attack Resistance</div>
                <div className="text-xs text-muted-foreground mt-1">
                  The network requires coordination between {nakamotoScore} separate entities to compromise 51% of stake.
                </div>
              </div>
            </div>
            <div className="p-4 bg-card/50 rounded flex items-start gap-4">
              <Bullet variant={(metrics?.datacenterDistribution[0]?.percentage || 0) < 20 ? 'success' : 'warning'} size="lg" className="mt-1" />
              <div>
                <div className="text-sm font-semibold uppercase tracking-tight">Infrastructure Concentration</div>
                <div className="text-xs text-muted-foreground mt-1">
                  The largest single datacenter provider hosts {metrics?.datacenterDistribution[0]?.percentage.toFixed(1)}% of all active pNodes.
                </div>
              </div>
            </div>
          </div>
        </StatCard>

        {superminority && (
          <StatCard label="SUPERMINORITY DETAILS" icon={UsersIcon} description="TOP STAKEHOLDERS">
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground mb-4 font-medium italic">
                These {superminority.count} entities collectively control {superminority.nodes.reduce((acc: number, n: any) => acc + n.percentage, 0).toFixed(1)}% of total network stake.
              </div>
              {superminority.nodes.slice(0, 5).map((node: any, i: number) => (
                <div key={node.pubkey} className="flex items-center gap-3 text-xs p-2 bg-card/30 rounded border border-border/20">
                  <span className="font-display text-primary w-8">#{i + 1}</span>
                  <span className="font-mono flex-1 text-muted-foreground">{node.pubkey.slice(0, 24)}...</span>
                  <span className="font-semibold text-primary">{node.percentage.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </StatCard>
        )}
      </div>
    </DashboardPageLayout>
  );
}
