'use client';

import DashboardPageLayout from "@/components/dashboard/layout";
import { useStakingStats, usePNodes } from "@/hooks/use-pnode-data-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const CoinsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
  </svg>
);

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}

export default function StakingPage() {
  const { data: stakingStats, isLoading: stakingLoading } = useStakingStats();
  const { data: nodes, isLoading: nodesLoading } = usePNodes();

  const isLoading = stakingLoading || nodesLoading;

  if (isLoading && !stakingStats) {
    return (
      <DashboardPageLayout header={{ title: "Staking", description: "Loading...", icon: CoinsIcon }}>
        <LoadingState />
      </DashboardPageLayout>
    );
  }

  const commissionDistribution = nodes?.reduce((acc, n) => {
    const commission = n.staking?.commission || 0;
    const range = commission <= 3 ? '0-3%' : commission <= 5 ? '4-5%' : commission <= 8 ? '6-8%' : '9%+';
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const commissionData = Object.entries(commissionDistribution).map(([range, count]) => ({
    range,
    count,
  }));

  const topValidators = stakingStats?.topValidators || [];

  return (
    <DashboardPageLayout
      header={{
        title: "Staking",
        description: "Delegation & rewards overview",
        icon: CoinsIcon,
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border-2 border-primary/50 bg-primary/5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Staked</div>
          <div className="text-3xl font-display text-primary">
            {((stakingStats?.totalStaked || 0) / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-muted-foreground mt-1">XAND tokens</div>
        </div>
        <div className="p-4 rounded-lg border-2 border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg APY</div>
          <div className="text-3xl font-display text-green-400">
            {stakingStats?.averageAPY.toFixed(2)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">annual yield</div>
        </div>
        <div className="p-4 rounded-lg border-2 border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Commission</div>
          <div className="text-3xl font-display">
            {stakingStats?.averageCommission.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">validator fee</div>
        </div>
        <div className="p-4 rounded-lg border-2 border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Delegated</div>
          <div className="text-3xl font-display">
            {((stakingStats?.totalDelegated || 0) / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-muted-foreground mt-1">from delegators</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border-2 border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-accent/20">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Top Validators by Stake
            </span>
          </div>
          <div className="divide-y divide-border">
            {topValidators.slice(0, 10).map((v, i) => (
              <div key={v.pubkey} className="px-4 py-3 flex items-center gap-4 hover:bg-accent/10">
                <span className="text-lg font-display text-primary w-8">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm truncate">{v.pubkey.slice(0, 16)}...</div>
                  <div className="text-xs text-muted-foreground">{v.commission}% commission</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{(v.stake / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-green-400">{v.apy.toFixed(2)}% APY</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border-2 border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-accent/20">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Commission Distribution
            </span>
          </div>
          <div className="p-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commissionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="range"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-border p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
          Staking Rewards Calculator
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-accent/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">1,000 XAND Staked</div>
            <div className="text-xl font-display text-primary">
              +{(1000 * (stakingStats?.averageAPY || 6) / 100).toFixed(1)} XAND
            </div>
            <div className="text-xs text-muted-foreground mt-1">per year</div>
          </div>
          <div className="p-4 bg-accent/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">10,000 XAND Staked</div>
            <div className="text-xl font-display text-primary">
              +{(10000 * (stakingStats?.averageAPY || 6) / 100).toFixed(0)} XAND
            </div>
            <div className="text-xs text-muted-foreground mt-1">per year</div>
          </div>
          <div className="p-4 bg-accent/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">100,000 XAND Staked</div>
            <div className="text-xl font-display text-primary">
              +{(100000 * (stakingStats?.averageAPY || 6) / 100).toFixed(0)} XAND
            </div>
            <div className="text-xs text-muted-foreground mt-1">per year</div>
          </div>
          <div className="p-4 bg-accent/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Monthly Earnings</div>
            <div className="text-xl font-display text-green-400">
              ~{((stakingStats?.averageAPY || 6) / 12).toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">of stake</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-border p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
          APY Distribution
        </div>
        <div className="space-y-2">
          {[
            { label: '> 7% APY', min: 7, max: 10, color: 'bg-green-500' },
            { label: '6-7% APY', min: 6, max: 7, color: 'bg-blue-500' },
            { label: '5-6% APY', min: 5, max: 6, color: 'bg-yellow-500' },
            { label: '< 5% APY', min: 0, max: 5, color: 'bg-red-500' },
          ].map(({ label, min, max, color }) => {
            const count = nodes?.filter(n => {
              const apy = n.staking?.apy || 0;
              return apy >= min && apy < max;
            }).length || 0;
            const total = nodes?.length || 1;
            const percentage = (count / total) * 100;

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
    </DashboardPageLayout>
  );
}
