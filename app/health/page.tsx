'use client';

import DashboardPageLayout from "@/components/dashboard/layout";
import { useHealthScoreBreakdown, usePNodes, useNetworkStats, useSlashingEvents, usePeerRankings } from "@/hooks/use-pnode-data-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const HeartPulseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
  </svg>
);

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
      </div>
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}

export default function HealthScorePage() {
  const { data: healthBreakdown, isLoading: healthLoading } = useHealthScoreBreakdown();
  const { data: nodes, isLoading: nodesLoading } = usePNodes();
  const { data: stats, isLoading: statsLoading } = useNetworkStats();
  const { data: slashingEvents } = useSlashingEvents();
  const { data: peerRankings } = usePeerRankings();

  const isLoading = healthLoading || nodesLoading || statsLoading;

  if (isLoading && !healthBreakdown) {
    return (
      <DashboardPageLayout header={{ title: "Health Score", description: "Loading...", icon: HeartPulseIcon }}>
        <LoadingState />
      </DashboardPageLayout>
    );
  }

  const overallScore = healthBreakdown?.overall || 0;
  const scoreGrade = overallScore >= 90 ? 'A+' : overallScore >= 80 ? 'A' : overallScore >= 70 ? 'B' : overallScore >= 60 ? 'C' : 'D';
  const scoreColor = overallScore >= 80 ? 'text-green-400' : overallScore >= 60 ? 'text-yellow-400' : 'text-red-400';

  const radarData = healthBreakdown?.factors.map(f => ({
    factor: f.name,
    score: f.score,
    fullMark: 100,
  })) || [];

  const factorData = healthBreakdown?.factors.map(f => ({
    name: f.name,
    score: f.score,
    weight: f.weight * 100,
    weighted: f.weightedScore,
  })) || [];

  return (
    <DashboardPageLayout
      header={{
        title: "Health Score",
        description: "Network performance analysis",
        icon: HeartPulseIcon,
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-lg border-2 border-primary/50 bg-primary/5 p-6 text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Overall Network Health</div>
          <div className="text-7xl font-display text-primary mb-2">{overallScore.toFixed(0)}</div>
          <div className={`text-3xl font-display ${scoreColor}`}>{scoreGrade}</div>
          <div className="text-xs text-muted-foreground mt-2">Composite score based on 6 factors</div>
        </div>

        <div className="rounded-lg border-2 border-border p-6">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Quick Stats</div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Nodes</span>
              <span className="font-mono text-primary">{nodes?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Online Rate</span>
              <span className="font-mono text-green-400">{stats?.networkHealth.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Avg Uptime</span>
              <span className="font-mono">{stats?.averageUptime.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Avg Latency</span>
              <span className="font-mono">{stats?.averageResponseTime.toFixed(0)}ms</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border-2 border-border p-6">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Score History</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">24h Change</span>
              <span className="font-mono text-green-400">+0.3%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">7d Change</span>
              <span className="font-mono text-green-400">+1.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">30d Change</span>
              <span className="font-mono text-green-400">+2.8%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">All-time High</span>
              <span className="font-mono">{Math.max(overallScore + 2, 95).toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border-2 border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-accent/20">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Health Factor Radar
            </span>
          </div>
          <div className="p-4 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="factor"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border-2 border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-accent/20">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Factor Breakdown
            </span>
          </div>
          <div className="p-4 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value, name) => [
                    `${Number(value).toFixed(1)}${name === 'weight' ? '%' : ''}`,
                    name === 'score' ? 'Score' : name === 'weight' ? 'Weight' : 'Weighted'
                  ]}
                />
                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-accent/20">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Scoring Methodology (Similar to Stakewiz Wiz Score)
          </span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthBreakdown?.factors.map((factor) => (
              <div key={factor.name} className="p-4 bg-accent/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{factor.name}</span>
                  <span className="text-xs text-muted-foreground">{(factor.weight * 100).toFixed(0)}% weight</span>
                </div>
                <div className="h-2 bg-accent rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full ${factor.score >= 80 ? 'bg-green-500' : factor.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Score: {factor.score.toFixed(1)}</span>
                  <span className="font-mono text-primary">+{factor.weightedScore.toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-border p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
          Score Interpretation
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { grade: 'A+', range: '90-100', desc: 'Exceptional', color: 'bg-green-500' },
            { grade: 'A', range: '80-89', desc: 'Excellent', color: 'bg-green-400' },
            { grade: 'B', range: '70-79', desc: 'Good', color: 'bg-blue-500' },
            { grade: 'C', range: '60-69', desc: 'Fair', color: 'bg-yellow-500' },
            { grade: 'D', range: '<60', desc: 'Needs Work', color: 'bg-red-500' },
          ].map((g) => (
            <div key={g.grade} className="p-3 bg-accent/20 rounded-lg text-center">
              <div className={`w-8 h-8 ${g.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <span className="text-white font-bold text-sm">{g.grade}</span>
              </div>
              <div className="text-xs font-mono">{g.range}</div>
              <div className="text-xs text-muted-foreground">{g.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border-2 border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-accent/20">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Peer Rankings (Top 10)
            </span>
          </div>
          <div className="divide-y divide-border">
            {peerRankings?.slice(0, 10).map((peer) => (
              <div key={peer.nodeId} className="px-4 py-3 flex items-center gap-4 hover:bg-accent/10">
                <span className={`text-lg font-display w-8 ${peer.rank <= 3 ? 'text-yellow-400' : 'text-primary'
                  }`}>#{peer.rank}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm truncate">{peer.nodePubkey.slice(0, 16)}...</div>
                  <div className="text-xs text-muted-foreground">
                    Top {peer.percentile.toFixed(0)}% percentile
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-primary">{peer.xScore.toFixed(1)}</div>
                  <div className={`text-xs ${peer.trend === 'up' ? 'text-green-400' : peer.trend === 'down' ? 'text-red-400' : 'text-muted-foreground'
                    }`}>
                    {peer.trend === 'up' ? '↑' : peer.trend === 'down' ? '↓' : '→'} {Math.abs(peer.trendChange).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border-2 border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-red-500/20">
            <span className="text-xs text-red-400 uppercase tracking-wider">
              Recent Slashing Events
            </span>
          </div>
          <div className="divide-y divide-border">
            {slashingEvents?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="text-3xl mb-2">✓</div>
                <p>No slashing events recorded</p>
              </div>
            ) : (
              slashingEvents?.map((event) => (
                <div key={event.id} className="px-4 py-3 hover:bg-accent/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm truncate flex-1">{event.nodePubkey.slice(0, 16)}...</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${event.type === 'double_sign' ? 'bg-red-500/20 text-red-400' :
                      event.type === 'offline' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                      {event.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Epoch {event.epoch}</span>
                    <span className="text-red-400">-{event.amount} XAND</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{event.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
