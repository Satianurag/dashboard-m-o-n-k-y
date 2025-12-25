'use client';

import DashboardPageLayout from "@/components/dashboard/layout";
import { useDecentralizationMetrics, usePNodes, useSuperminorityInfo, useCensorshipResistanceScore } from "@/hooks/use-pnode-data-query";
import { Skeleton } from "@/components/ui/skeleton";
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

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

const COLORS = ['#00ff88', '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

export default function DecentralizationPage() {
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

  const countryData = metrics?.countryDistribution.slice(0, 8).map((c, i) => ({
    name: c.country,
    value: c.count,
    color: COLORS[i % COLORS.length],
  })) || [];

  const datacenterData = metrics?.datacenterDistribution.slice(0, 10).map(d => ({
    name: d.datacenter.length > 12 ? d.datacenter.slice(0, 12) + '...' : d.datacenter,
    count: d.count,
    percentage: d.percentage,
  })) || [];

  const asnData = metrics?.asnDistribution.slice(0, 8).map(a => ({
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border-2 border-primary/50 bg-primary/5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Nakamoto Coefficient</div>
          <div className="text-3xl font-display text-primary">{nakamotoScore}</div>
          <div className="text-xs text-muted-foreground mt-1">entities to control 51%</div>
        </div>
        <div className="p-4 rounded-lg border-2 border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Gini Coefficient</div>
          <div className={`text-3xl font-display ${giniScore < 0.4 ? 'text-green-400' : giniScore < 0.6 ? 'text-yellow-400' : 'text-red-400'}`}>
            {giniScore.toFixed(3)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">stake distribution</div>
        </div>
        <div className="p-4 rounded-lg border-2 border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Countries</div>
          <div className="text-3xl font-display">{metrics?.countryDistribution.length}</div>
          <div className="text-xs text-muted-foreground mt-1">geographic spread</div>
        </div>
        <div className="p-4 rounded-lg border-2 border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Datacenters</div>
          <div className="text-3xl font-display">{metrics?.datacenterDistribution.length}</div>
          <div className="text-xs text-muted-foreground mt-1">infrastructure providers</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border-2 border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-accent/20">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Geographic Distribution
            </span>
          </div>
          <div className="p-4 h-[300px] flex items-center">
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
                    {countryData.map((entry, index) => (
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
              {countryData.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="font-mono">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border-2 border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-accent/20">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              ASN Distribution (Hosting Providers)
            </span>
          </div>
          <div className="p-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={asnData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`${Number(value)} nodes (${((Number(value) / (nodes?.length || 1)) * 100).toFixed(1)}%)`]}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-accent/20">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Datacenter Concentration
          </span>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {datacenterData.map((dc) => (
              <div key={dc.name} className="flex items-center gap-3">
                <div className="w-32 text-xs text-muted-foreground truncate" title={dc.name}>{dc.name}</div>
                <div className="flex-1 h-4 bg-accent rounded overflow-hidden">
                  <div
                    className={`h-full rounded transition-all ${dc.percentage > 20 ? 'bg-red-500' : dc.percentage > 10 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(dc.percentage * 2, 100)}%` }}
                  />
                </div>
                <div className="w-24 text-right text-xs font-mono">
                  {dc.count} ({dc.percentage.toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border-2 border-border p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
            Decentralization Health
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Geographic Spread</span>
                <span className="text-green-400">{metrics?.countryDistribution.length || 0}/50 countries</span>
              </div>
              <div className="h-2 bg-accent rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(((metrics?.countryDistribution.length || 0) / 50) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Provider Diversity</span>
                <span className="text-blue-400">{metrics?.asnDistribution.length || 0}/20 ASNs</span>
              </div>
              <div className="h-2 bg-accent rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(((metrics?.asnDistribution.length || 0) / 20) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Stake Distribution</span>
                <span className={giniScore < 0.4 ? 'text-green-400' : 'text-yellow-400'}>
                  {giniScore < 0.4 ? 'Healthy' : giniScore < 0.6 ? 'Moderate' : 'Concentrated'}
                </span>
              </div>
              <div className="h-2 bg-accent rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${giniScore < 0.4 ? 'bg-green-500' : giniScore < 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${(1 - giniScore) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border-2 border-border p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
            Risk Assessment
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-accent/20 rounded-lg flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${nakamotoScore >= 10 ? 'bg-green-500' : nakamotoScore >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`} />
              <div className="flex-1">
                <div className="text-sm">51% Attack Resistance</div>
                <div className="text-xs text-muted-foreground">Requires {nakamotoScore} entities to coordinate</div>
              </div>
            </div>
            <div className="p-3 bg-accent/20 rounded-lg flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${(metrics?.datacenterDistribution[0]?.percentage || 0) < 20 ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <div className="flex-1">
                <div className="text-sm">Datacenter Dependency</div>
                <div className="text-xs text-muted-foreground">
                  Top provider: {metrics?.datacenterDistribution[0]?.percentage.toFixed(1)}% of nodes
                </div>
              </div>
            </div>
            <div className="p-3 bg-accent/20 rounded-lg flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${(metrics?.countryDistribution[0]?.percentage || 0) < 30 ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <div className="flex-1">
                <div className="text-sm">Geographic Concentration</div>
                <div className="text-xs text-muted-foreground">
                  Top country: {metrics?.countryDistribution[0]?.percentage.toFixed(1)}% of nodes
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border-2 border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-accent/20">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Superminority Analysis
            </span>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-display text-primary">{superminority?.count || 0}</div>
                <div className="text-xs text-muted-foreground">Validators in superminority</div>
              </div>
              <div className={`px-3 py-1 rounded text-sm ${superminority?.riskLevel === 'low' ? 'bg-green-500/20 text-green-400' :
                superminority?.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                {superminority?.riskLevel?.toUpperCase()} RISK
              </div>
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              These validators control 33.3% of stake needed to halt the network
            </div>
            <div className="space-y-2">
              {superminority?.nodes.slice(0, 5).map((node, i) => (
                <div key={node.pubkey} className="flex items-center gap-2 text-xs">
                  <span className="font-display w-6">#{i + 1}</span>
                  <span className="font-mono flex-1 truncate">{node.pubkey.slice(0, 16)}...</span>
                  <span className="text-primary">{node.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border-2 border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-accent/20">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Censorship Resistance Score
            </span>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-display text-primary">{censorshipScore?.overall.toFixed(0) || 0}</div>
                <div className="text-xs text-muted-foreground">Overall score</div>
              </div>
              <div className={`text-4xl font-display ${censorshipScore?.grade === 'A' ? 'text-green-400' :
                censorshipScore?.grade === 'B' ? 'text-blue-400' :
                  censorshipScore?.grade === 'C' ? 'text-yellow-400' :
                    'text-red-400'
                }`}>
                {censorshipScore?.grade}
              </div>
            </div>
            <div className="space-y-3">
              {censorshipScore && Object.entries(censorshipScore.factors).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-mono">{value.toFixed(0)}/100</span>
                  </div>
                  <div className="h-2 bg-accent rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${value >= 70 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
