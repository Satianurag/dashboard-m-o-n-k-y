'use client';

import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PerformanceHistory } from '@/types/pnode';
import { cn } from '@/lib/utils';

interface NetworkChartProps {
  data: PerformanceHistory[];
}

type MetricType = 'nodes' | 'latency' | 'storage' | 'gossip';

export function NetworkChart({ data }: NetworkChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricType>('nodes');

  const metrics: { key: MetricType; label: string; color: string }[] = [
    { key: 'nodes', label: 'NODES', color: '#22c55e' },
    { key: 'latency', label: 'LATENCY', color: '#f59e0b' },
    { key: 'storage', label: 'STORAGE', color: '#3b82f6' },
    { key: 'gossip', label: 'GOSSIP', color: '#a855f7' },
  ];

  const chartData = data.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    nodes: item.onlineNodes,
    latency: item.avgResponseTime,
    storage: item.storageUsedTB,
    gossip: item.gossipMessages / 1000,
  }));

  const activeMetricConfig = metrics.find(m => m.key === activeMetric)!;

  const formatValue = (value: number) => {
    switch (activeMetric) {
      case 'nodes': return `${value} nodes`;
      case 'latency': return `${value.toFixed(0)}ms`;
      case 'storage': return `${value.toFixed(1)} TB`;
      case 'gossip': return `${value.toFixed(0)}K msgs`;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            onClick={() => setActiveMetric(metric.key)}
            className={cn(
              'px-3 py-1.5 text-xs uppercase tracking-wider rounded transition-all',
              activeMetric === metric.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent hover:bg-accent/80 text-muted-foreground'
            )}
          >
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: metric.color }}
              />
              {metric.label}
            </span>
          </button>
        ))}
      </div>

      <div
        className="h-[250px] w-full min-h-[250px]"
        role="img"
        aria-label={`${activeMetricConfig.label} chart showing network performance over time`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeMetricConfig.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={activeMetricConfig.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value) => [formatValue(value as number), activeMetricConfig.label]}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <Area
              type="monotone"
              dataKey={activeMetric}
              stroke={activeMetricConfig.color}
              strokeWidth={2}
              fill={`url(#gradient-${activeMetric})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
