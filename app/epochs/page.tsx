'use client';

import DashboardPageLayout from "@/components/dashboard/layout";
import { useEpochInfo, useEpochHistory } from "@/hooks/use-pnode-data-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
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

export default function EpochsPage() {
  const { data: epochInfo, isLoading: epochLoading } = useEpochInfo();
  const { data: epochHistory, isLoading: historyLoading } = useEpochHistory();

  const isLoading = epochLoading || historyLoading;

  if (isLoading && !epochInfo) {
    return (
      <DashboardPageLayout header={{ title: "Epochs", description: "Loading...", icon: ClockIcon }}>
        <LoadingState />
      </DashboardPageLayout>
    );
  }

  const timeRemaining = epochInfo ? new Date(epochInfo.epochEndTime).getTime() - Date.now() : 0;
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minsRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  const historyData = epochHistory?.map(e => ({
    epoch: e.epoch,
    blocks: e.blocksProduced / 1000,
    skipRate: e.skipRate,
    nodes: e.activeNodes,
  })) || [];

  return (
    <DashboardPageLayout
      header={{
        title: "Epochs",
        description: `Epoch ${epochInfo?.currentEpoch || 0} in progress`,
        icon: ClockIcon,
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border-2 border-primary/50 bg-primary/5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Epoch</div>
          <div className="text-3xl font-display text-primary">{epochInfo?.currentEpoch}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {hoursRemaining}h {minsRemaining}m remaining
          </div>
        </div>
        <div className="p-4 rounded-lg border-2 border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Progress</div>
          <div className="text-3xl font-display">{epochInfo?.epochProgress.toFixed(1)}%</div>
          <div className="mt-2 h-1.5 bg-accent rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${epochInfo?.epochProgress || 0}%` }}
            />
          </div>
        </div>
        <div className="p-4 rounded-lg border-2 border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Blocks Produced</div>
          <div className="text-3xl font-display">{(epochInfo?.blocksProduced || 0).toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">this epoch</div>
        </div>
        <div className="p-4 rounded-lg border-2 border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Skip Rate</div>
          <div className={`text-3xl font-display ${(epochInfo?.skipRate || 0) < 3 ? 'text-green-400' : (epochInfo?.skipRate || 0) < 5 ? 'text-yellow-400' : 'text-red-400'}`}>
            {epochInfo?.skipRate.toFixed(2)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">missed slots</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border-2 border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-accent/20">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Epoch History - Block Production
            </span>
          </div>
          <div className="p-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="blocksGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="epoch"
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
                  formatter={(value) => [`${Number(value).toFixed(0)}K blocks`]}
                />
                <Area
                  type="monotone"
                  dataKey="blocks"
                  stroke="hsl(var(--primary))"
                  fill="url(#blocksGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border-2 border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-accent/20">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Current Epoch Stats
            </span>
          </div>
          <div className="p-4 space-y-4">
            <div className="p-3 bg-accent/20 rounded-lg">
              <div className="text-xs text-muted-foreground">Slots Completed</div>
              <div className="text-xl font-mono">{epochInfo?.slotsCompleted.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">of {epochInfo?.totalSlots.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-accent/20 rounded-lg">
              <div className="text-xs text-muted-foreground">Started</div>
              <div className="text-sm font-mono">
                {epochInfo?.epochStartTime ? new Date(epochInfo.epochStartTime).toLocaleString() : '-'}
              </div>
            </div>
            <div className="p-3 bg-accent/20 rounded-lg">
              <div className="text-xs text-muted-foreground">Ends</div>
              <div className="text-sm font-mono">
                {epochInfo?.epochEndTime ? new Date(epochInfo.epochEndTime).toLocaleString() : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-accent/20">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Recent Epochs
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent/10 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Epoch</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Duration</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Blocks</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Skip Rate</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Active Nodes</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Rewards</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {epochHistory?.map((epoch) => (
                <tr key={epoch.epoch} className="hover:bg-accent/10">
                  <td className="px-4 py-3 font-mono text-primary">{epoch.epoch}</td>
                  <td className="px-4 py-3 text-xs">
                    {new Date(epoch.startTime).toLocaleDateString()} - {new Date(epoch.endTime).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-mono">{epoch.blocksProduced.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono ${epoch.skipRate < 3 ? 'text-green-400' : epoch.skipRate < 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {epoch.skipRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{epoch.activeNodes}</td>
                  <td className="px-4 py-3 font-mono text-green-400">{epoch.totalRewards.toLocaleString()} XAND</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
