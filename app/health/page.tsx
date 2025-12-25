'use client';

import DashboardPageLayout from "@/components/dashboard/layout";
import { useHealthScoreBreakdown, usePNodes, useNetworkStats, useSlashingEvents, usePeerRankings } from "@/hooks/use-pnode-data-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
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

// Icons
import TrophyIcon from "@/components/icons/trophy";
import ServerIcon from "@/components/icons/server";
import GlobeIcon from "@/components/icons/globe";
import BoomIcon from "@/components/icons/boom";

const HeartPulseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
  </svg>
);

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

import { StatCard } from "@/components/dashboard/stat-card";

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
  const scoreIntent = overallScore >= 80 ? 'positive' : overallScore >= 60 ? 'neutral' : 'negative';

  const radarData = healthBreakdown?.factors.map((f: any) => ({
    factor: f.name,
    score: f.score,
    fullMark: 100,
  })) || [];

  const factorData = healthBreakdown?.factors.map((f: any) => ({
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          label="OVERALL HEALTH"
          value={overallScore.toFixed(0)}
          description={`GRADE: ${scoreGrade}`}
          icon={HeartPulseIcon}
          intent={scoreIntent}
        />

        <StatCard label="QUICK STATS" icon={ActivityIcon}>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs uppercase tracking-tight">
              <span className="text-muted-foreground">Online Rate</span>
              <span className="font-mono text-green-400 font-bold">{stats?.networkHealth.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center text-xs uppercase tracking-tight">
              <span className="text-muted-foreground">Avg Uptime</span>
              <span className="font-mono font-bold">{stats?.averageUptime.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center text-xs uppercase tracking-tight">
              <span className="text-muted-foreground">Avg Latency</span>
              <span className="font-mono font-bold text-primary">{stats?.averageResponseTime.toFixed(0)}MS</span>
            </div>
          </div>
        </StatCard>

        <StatCard label="SCORE TRENDS" icon={ActivityIcon}>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs uppercase tracking-tight">
              <span className="text-muted-foreground">24h Change</span>
              <span className="font-mono text-green-400 font-bold">+0.3%</span>
            </div>
            <div className="flex justify-between items-center text-xs uppercase tracking-tight">
              <span className="text-muted-foreground">7d Change</span>
              <span className="font-mono text-green-400 font-bold">+1.2%</span>
            </div>
            <div className="flex justify-between items-center text-xs uppercase tracking-tight">
              <span className="text-muted-foreground">All-time High</span>
              <span className="font-mono font-bold">{Math.max(overallScore + 2, 95).toFixed(0)}</span>
            </div>
          </div>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StatCard label="HEALTH FACTOR RADAR" icon={GlobeIcon}>
          <div className="h-[350px] md:mt-4">
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
        </StatCard>

        <StatCard label="FACTOR BREAKDOWN" icon={TrophyIcon}>
          <div className="h-[350px] md:mt-4">
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
                  formatter={(value: any, name: any) => [
                    `${Number(value).toFixed(1)}${name === 'weight' ? '%' : ''}`,
                    name === 'score' ? 'Score' : name === 'weight' ? 'Weight' : 'Weighted'
                  ]}
                />
                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </StatCard>
      </div>

      <StatCard label="SCORING METHODOLOGY" icon={ShieldIcon} description="SIMILAR TO STAKEWIZ WIZ SCORE" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:mt-4">
          {healthBreakdown?.factors.map((factor: any) => (
            <div key={factor.name} className="p-4 bg-card/40 rounded border border-border/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">{factor.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{(factor.weight * 100).toFixed(0)}% WEIGHT</span>
              </div>
              <div className="h-2 bg-card rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${factor.score >= 80 ? 'bg-green-500' : factor.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${factor.score}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-tight">
                <span className="text-muted-foreground">Score: {factor.score.toFixed(1)}</span>
                <span className="text-primary">+{factor.weightedScore.toFixed(1)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 italic leading-relaxed">{factor.description}</p>
            </div>
          ))}
        </div>
      </StatCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StatCard label="PEER RANKINGS (TOP 10)" icon={TrophyIcon}>
          <div className="divide-y divide-border/20 -mx-3 -mb-3 md:-mx-6 md:-mb-6 md:mt-4">
            {peerRankings?.slice(0, 10).map((peer: any, i: number) => (
              <div key={peer.nodeId} className="px-4 py-3 flex items-center gap-4 hover:bg-card/30 transition-colors">
                <span className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-display text-lg",
                  peer.rank <= 3 ? "bg-primary/20 text-primary" : "bg-card text-muted-foreground"
                )}>
                  {peer.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm truncate uppercase">{peer.nodePubkey.slice(0, 16)}...</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-tight">
                    Top {peer.percentile.toFixed(0)}% Percentile
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-lg text-primary">{peer.xScore.toFixed(1)}</div>
                  <div className={cn(
                    "text-[10px] font-bold uppercase",
                    peer.trend === 'up' ? 'text-green-400' : peer.trend === 'down' ? 'text-red-400' : 'text-muted-foreground'
                  )}>
                    {peer.trend === 'up' ? '↑' : peer.trend === 'down' ? '↓' : '→'} {Math.abs(peer.trendChange).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </StatCard>

        <StatCard label="RECENT SLASHING EVENTS" icon={ShieldIcon} intent="negative">
          <div className="divide-y divide-border/20 -mx-3 -mb-3 md:-mx-6 md:-mb-6 md:mt-4">
            {slashingEvents?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <div className="text-4xl mb-3 opacity-20">✓</div>
                <p className="text-xs uppercase tracking-widest font-medium">No slashing events recorded</p>
              </div>
            ) : (
              slashingEvents?.map((event: any) => (
                <div key={event.id} className="px-4 py-3 hover:bg-card/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm truncate flex-1 uppercase">{event.nodePubkey.slice(0, 16)}...</span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                      event.type === 'double_sign' ? 'bg-red-500/20 text-red-500' :
                        event.type === 'offline' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-orange-500/20 text-orange-500'
                    )}>
                      {event.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-medium">
                    <span>Epoch {event.epoch}</span>
                    <span className="text-red-500">-{event.amount} XAND</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate lowercase italic opacity-80">{event.details}</p>
                </div>
              ))
            )}
          </div>
        </StatCard>
      </div>
    </DashboardPageLayout>
  );
}
