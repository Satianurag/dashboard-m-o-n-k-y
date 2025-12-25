'use client';

import { useState } from 'react';
import { useNetworkStats } from '@/hooks/use-pnode-data-query';
import { cn } from '@/lib/utils';

interface MarqueeItemProps {
    label: string;
    value: string;
    status?: 'good' | 'warning' | 'critical';
    pulse?: boolean;
}

function MarqueeItem({ label, value, status, pulse }: MarqueeItemProps) {
    const statusColors = {
        good: 'text-green-400',
        warning: 'text-yellow-400',
        critical: 'text-red-400',
    };

    return (
        <span className="inline-flex items-center gap-2 px-4 whitespace-nowrap">
            {pulse && (
                <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    status === 'good' && "bg-green-500 animate-pulse",
                    status === 'warning' && "bg-yellow-500 animate-pulse",
                    status === 'critical' && "bg-red-500 animate-pulse"
                )} />
            )}
            <span className="text-xs font-display text-primary uppercase tracking-wider">
                {label}
            </span>
            <span className={cn(
                "text-sm font-mono font-bold",
                status ? statusColors[status] : "text-foreground"
            )}>
                {value}
            </span>
        </span>
    );
}

export function NetworkMarquee() {
    const { data: stats } = useNetworkStats();
    const [isPaused, setIsPaused] = useState(false);

    // Calculate network health status
    const getHealthStatus = (health: number): 'good' | 'warning' | 'critical' => {
        if (health >= 90) return 'good';
        if (health >= 70) return 'warning';
        return 'critical';
    };

    // Calculate response time status
    const getResponseStatus = (responseTime: number): 'good' | 'warning' | 'critical' => {
        if (responseTime < 100) return 'good';
        if (responseTime < 200) return 'warning';
        return 'critical';
    };

    // Calculate offline nodes status
    const getOfflineStatus = (offlineCount: number): 'good' | 'warning' | 'critical' => {
        if (offlineCount <= 10) return 'good';
        return 'warning';
    };

    const marqueeItems = stats ? [
        {
            label: 'NODES ONLINE',
            value: `${stats.onlineNodes}/${stats.totalNodes}`,
            status: getHealthStatus(stats.networkHealth),
            pulse: true,
        },
        {
            label: 'NETWORK HEALTH',
            value: `${stats.networkHealth.toFixed(1)}%`,
            status: getHealthStatus(stats.networkHealth),
        },
        {
            label: 'AVG UPTIME',
            value: `${stats.averageUptime.toFixed(1)}%`,
            status: getHealthStatus(stats.averageUptime),
        },
        {
            label: 'AVG RESPONSE',
            value: `${stats.averageResponseTime.toFixed(0)}ms`,
            status: getResponseStatus(stats.averageResponseTime),
        },
        {
            label: 'STORAGE USED',
            value: `${stats.totalStorageUsedTB.toFixed(1)}TB`,
        },
        {
            label: 'STORAGE CAPACITY',
            value: `${stats.totalStorageCapacityTB.toFixed(1)}TB`,
        },
        {
            label: 'GOSSIP MSGS 24H',
            value: `${(stats.gossipMessages24h / 1_000_000).toFixed(1)}M`,
        },
        {
            label: 'OFFLINE NODES',
            value: stats.offlineNodes.toString(),
            status: getOfflineStatus(stats.offlineNodes),
        },
    ] : [
        {
            label: 'NETWORK',
            value: 'Connecting to Xandeum nodes...',
            pulse: true,
            status: 'warning',
        },
        {
            label: 'SYSTEM',
            value: 'Initializing metrics engine...',
        }
    ];

    return (
        <div
            className="fixed bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-background via-background/95 to-background border-t border-border backdrop-blur-sm z-40"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Gradient overlay for seamless loop effect */}
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            {/* Border accent line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <div className="h-full flex items-center overflow-hidden">
                <div
                    className={cn(
                        "flex items-center h-full gap-1",
                        !isPaused && "animate-marquee"
                    )}
                    style={{
                        animationDuration: '40s',
                        animationIterationCount: 'infinite',
                        animationTimingFunction: 'linear',
                    }}
                >
                    {/* First set of items */}
                    {marqueeItems.map((item, idx) => (
                        <MarqueeItem key={`set1-${idx}`} {...item} />
                    ))}

                    {/* Separator */}
                    <span className="inline-flex items-center px-4">
                        <span className="w-1 h-1 rounded-full bg-primary/50" />
                    </span>

                    {/* Duplicate set for seamless loop */}
                    {marqueeItems.map((item, idx) => (
                        <MarqueeItem key={`set2-${idx}`} {...item} />
                    ))}

                    {/* Separator */}
                    <span className="inline-flex items-center px-4">
                        <span className="w-1 h-1 rounded-full bg-primary/50" />
                    </span>

                    {/* Third set for extra smoothness */}
                    {marqueeItems.map((item, idx) => (
                        <MarqueeItem key={`set3-${idx}`} {...item} />
                    ))}
                </div>
            </div>

            {/* Pause indicator */}
            {isPaused && (
                <div className="absolute top-1 right-2 flex items-center gap-1">
                    <div className="w-0.5 h-2 bg-primary/50 rounded-full" />
                    <div className="w-0.5 h-2 bg-primary/50 rounded-full" />
                </div>
            )}
        </div>
    );
}
