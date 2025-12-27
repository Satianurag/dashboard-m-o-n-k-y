'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardPageLayout from "@/components/dashboard/layout";
import { usePNodes, usePerformanceHistory } from "@/hooks/use-pnode-data-query";
import type { PNode, PerformanceHistory } from "@/types/pnode";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bullet } from "@/components/ui/bullet";

// Icons
import TrophyIcon from "@/components/icons/trophy";
import BoomIcon from "@/components/icons/boom";
import ProcessorIcon from "@/components/icons/processor";
import GearIcon from "@/components/icons/gear";

const TimerIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const ZapIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

function LoadingState() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
            </div>
            <Skeleton className="h-[400px] rounded-lg" />
        </div>
    );
}

type TimePeriod = "1h" | "6h" | "24h";

const chartConfig = {
    latency: {
        label: "Latency",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig;

import { StatCard } from "@/components/dashboard/stat-card";

interface PerformanceClientProps {
    initialNodes: PNode[] | null;
    initialHistory: PerformanceHistory[] | null;
}

export default function PerformanceClient({ initialNodes, initialHistory }: PerformanceClientProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const { data: nodes, isLoading, dataUpdatedAt } = usePNodes(initialNodes);
    const { data: history } = usePerformanceHistory('24h', initialHistory);
    const [activeTab, setActiveTab] = useState<TimePeriod>("24h");

    // Filter data based on time period
    const filteredData = useMemo(() => {
        if (!history) return [];
        const hours = activeTab === "1h" ? 1 : activeTab === "6h" ? 6 : 24;
        const cutoff = Date.now() - hours * 60 * 60 * 1000;

        return history
            .filter((item: PerformanceHistory) => new Date(item.timestamp).getTime() > cutoff)
            .map((item: PerformanceHistory) => ({
                date: mounted ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                latency: item.avgResponseTime,
            }));
    }, [history, activeTab, mounted]);

    const topNodes = useMemo(() => {
        if (!nodes) return [];
        return [...nodes]
            .sort((a: PNode, b: PNode) => (b.performance?.score || 0) - (a.performance?.score || 0))
            .slice(0, 10);
    }, [nodes]);

    const handleTabChange = (value: string) => {
        if (value === "1h" || value === "6h" || value === "24h") {
            setActiveTab(value as TimePeriod);
        }
    };

    const isActuallyLoading = isLoading && !nodes;

    const onlineNodes = nodes?.filter((n: PNode) => n.status === 'online') || [];
    const excellentCount = onlineNodes.filter((n: PNode) => n.performance?.tier === 'excellent').length;
    const goodCount = onlineNodes.filter((n: PNode) => n.performance?.tier === 'good').length;
    const fairCount = onlineNodes.filter((n: PNode) => n.performance?.tier === 'fair').length;
    const poorCount = onlineNodes.filter((n: PNode) => n.performance?.tier === 'poor').length;

    const avgScore = onlineNodes.length > 0
        ? onlineNodes.reduce((acc: number, n: PNode) => acc + (n.performance?.score || 0), 0) / onlineNodes.length
        : 0;

    if (isActuallyLoading) {
        return (
            <DashboardPageLayout header={{ title: "Performance", description: "Loading...", icon: TrophyIcon }}>
                <LoadingState />
            </DashboardPageLayout>
        );
    }

    return (
        <DashboardPageLayout
            header={{
                title: "Performance",
                description: `Rankings & metrics • ${mounted && dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'Loading...'}`,
                icon: TrophyIcon,
            }}
        >
            {/* Top metrics - standardized grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                <StatCard
                    label="AVG SCORE"
                    value={avgScore.toFixed(1)}
                    description="NETWORK WIDE"
                    icon={TrophyIcon}
                    intent="positive"
                />
                <StatCard
                    label="EXCELLENT"
                    value={excellentCount}
                    description="SCORE > 90"
                    icon={ZapIcon}
                    intent="positive"
                />
                <StatCard
                    label="GOOD"
                    value={goodCount}
                    description="SCORE 75-90"
                    icon={ProcessorIcon}
                    intent="positive"
                />
                <StatCard
                    label="FAIR"
                    value={fairCount}
                    description="SCORE 50-75"
                    icon={GearIcon}
                    intent="neutral"
                />
                <StatCard
                    label="POOR"
                    value={poorCount}
                    description="SCORE < 50"
                    icon={BoomIcon}
                    intent="negative"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Top 10 Leaderboard */}
                <StatCard label="TOP 10 LEADERBOARD" icon={TrophyIcon} description="BY PERFORMANCE SCORE">
                    <div className="divide-y divide-border/20 -mx-3 -mb-3 md:-mx-6 md:-mb-6 md:mt-4">
                        {topNodes.map((node: any, i: number) => (
                            <div key={node.id} className="px-4 py-3 flex items-center gap-4 hover:bg-card/30 transition-colors">
                                <span className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center font-display text-lg",
                                    i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                                        i === 1 ? "bg-gray-400/20 text-gray-300" :
                                            i === 2 ? "bg-amber-700/20 text-amber-600" :
                                                "bg-card text-muted-foreground"
                                )}>
                                    {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-mono text-sm truncate uppercase">{(node.pubkey || 'UNKNOWN').slice(0, 20)}...</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                        {node.location?.city || 'Unknown'}, {node.location?.countryCode || 'UN'} • {(node.uptime || 0).toFixed(1)}% UPTIME
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={cn(
                                        "font-mono text-lg",
                                        node.performance?.tier === 'excellent' ? 'text-green-400' :
                                            node.performance?.tier === 'good' ? 'text-blue-400' :
                                                'text-yellow-400'
                                    )}>
                                        {(node.performance?.score || 0).toFixed(1)}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-tight">
                                        {(node.metrics?.responseTimeMs || 0).toFixed(0)}MS
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </StatCard>

                {/* Latency Trends */}
                <StatCard label="LATENCY TRENDS" icon={TimerIcon}>
                    <Tabs
                        value={activeTab}
                        onValueChange={handleTabChange}
                        className="max-md:gap-4 md:mt-4"
                    >
                        <div className="flex items-center justify-between mb-4 max-md:contents">
                            <TabsList className="max-md:w-full">
                                <TabsTrigger value="1h">1H</TabsTrigger>
                                <TabsTrigger value="6h">6H</TabsTrigger>
                                <TabsTrigger value="24h">24H</TabsTrigger>
                            </TabsList>
                            <div className="flex items-center gap-6 max-md:order-1">
                                <div className="flex items-center gap-2 uppercase">
                                    <Bullet style={{ backgroundColor: 'var(--chart-1)' }} className="rotate-45" />
                                    <span className="text-sm font-medium text-muted-foreground">Latency</span>
                                </div>
                            </div>
                        </div>
                        {(['1h', '6h', '24h'] as const).map((period) => (
                            <TabsContent key={period} value={period} className="space-y-4">
                                <div className="bg-accent rounded-lg p-3" style={{ height: '400px' }}>
                                    {mounted ? (
                                        <ChartContainer className="h-full w-full" config={chartConfig}>
                                            <AreaChart
                                                accessibilityLayer
                                                data={filteredData}
                                                margin={{ left: -12, right: 12, top: 12, bottom: 12 }}
                                            >
                                                <defs>
                                                    <linearGradient id={`fillLatency-${period}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="var(--color-latency)" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="var(--color-latency)" stopOpacity={0.1} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid
                                                    horizontal={false}
                                                    strokeDasharray="8 8"
                                                    strokeWidth={2}
                                                    stroke="var(--muted-foreground)"
                                                    opacity={0.3}
                                                />
                                                <XAxis
                                                    dataKey="date"
                                                    tickLine={false}
                                                    tickMargin={12}
                                                    strokeWidth={1.5}
                                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                                                    className="uppercase text-sm"
                                                />
                                                <YAxis
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={0}
                                                    tickCount={6}
                                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                                                    className="text-sm"
                                                    domain={[0, "dataMax"]}
                                                />
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={<ChartTooltipContent indicator="dot" className="min-w-[200px] px-4 py-3" />}
                                                />
                                                <Area
                                                    dataKey="latency"
                                                    type="linear"
                                                    fill={`url(#fillLatency-${period})`}
                                                    stroke="var(--color-latency)"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    activeDot={{ r: 4 }}
                                                />
                                            </AreaChart>
                                        </ChartContainer>
                                    ) : <Skeleton className="h-full w-full rounded-lg" />}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </StatCard>
            </div>

            {/* Distribution Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <StatCard label="PERFORMANCE TIER DISTRIBUTION" icon={ZapIcon}>
                    <div className="md:mt-4">
                        <div className="h-8 rounded-full overflow-hidden flex bg-card/50">
                            {excellentCount > 0 && onlineNodes.length > 0 && (
                                <div
                                    className="bg-green-500 flex items-center justify-center text-[10px] font-bold text-black uppercase"
                                    style={{ width: `${(excellentCount / onlineNodes.length) * 100}%` }}
                                >
                                    {excellentCount > 2 && 'Excellent'}
                                </div>
                            )}
                            {goodCount > 0 && onlineNodes.length > 0 && (
                                <div
                                    className="bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white uppercase"
                                    style={{ width: `${(goodCount / onlineNodes.length) * 100}%` }}
                                >
                                    {goodCount > 2 && 'Good'}
                                </div>
                            )}
                            {fairCount > 0 && onlineNodes.length > 0 && (
                                <div
                                    className="bg-yellow-500 flex items-center justify-center text-[10px] font-bold text-black uppercase"
                                    style={{ width: `${(fairCount / onlineNodes.length) * 100}%` }}
                                >
                                    {fairCount > 2 && 'Fair'}
                                </div>
                            )}
                            {poorCount > 0 && onlineNodes.length > 0 && (
                                <div
                                    className="bg-red-500 flex items-center justify-center text-[10px] font-bold text-white uppercase"
                                    style={{ width: `${(poorCount / onlineNodes.length) * 100}%` }}
                                >
                                    {poorCount > 2 && 'Poor'}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between mt-3 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                            <span>{onlineNodes.length} ONLINE NODES ANALYZED</span>
                            <span>UPDATED EVERY 30S</span>
                        </div>
                    </div>
                </StatCard>

                <StatCard label="LATENCY DISTRIBUTION" icon={TimerIcon}>
                    <div className="space-y-4 md:mt-4">
                        {[
                            { label: '< 80MS', min: 0, max: 80, color: 'bg-green-500' },
                            { label: '80-120MS', min: 80, max: 120, color: 'bg-blue-500' },
                            { label: '120-200MS', min: 120, max: 200, color: 'bg-yellow-500' },
                            { label: '> 200MS', min: 200, max: Infinity, color: 'bg-red-500' },
                        ].map(({ label, min, max, color }) => {
                            const count = onlineNodes.filter((n: PNode) =>
                                (n.metrics?.responseTimeMs || 0) >= min && (n.metrics?.responseTimeMs || 0) < max
                            ).length;
                            const percentage = onlineNodes.length > 0 ? (count / onlineNodes.length) * 100 : 0;

                            return (
                                <div key={label} className="flex items-center gap-3">
                                    <div className="w-24 text-[10px] text-muted-foreground font-bold uppercase">{label}</div>
                                    <div className="flex-1 h-3 bg-card rounded overflow-hidden">
                                        <div
                                            className={cn('h-full rounded transition-all', color)}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <div className="w-20 text-right text-[10px] font-mono text-muted-foreground">
                                        {count} NODES
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </StatCard>
            </div>
        </DashboardPageLayout>
    );
}
