'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import DashboardPageLayout from "@/components/dashboard/layout";
import ServerIcon from "@/components/icons/server";
import { usePNodes, useCommissionHistory } from "@/hooks/use-pnode-data-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/dashboard/export-button";
import { exportPNodes, type ExportFormat } from "@/lib/export-utils";
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    AlertCircle,
    Copy,
    Share2,
    MapPin,
    Server,
    Clock,
    Activity,
    Users,
    HardDrive,
    Cpu,
    Gauge,
    TrendingUp,
    ExternalLink,
    MessageSquare,
} from "lucide-react";
import { useChatState } from "@/components/chat/use-chat-state";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from 'recharts';
import type { PNode } from "@/types/pnode";
import dynamic from 'next/dynamic';

// Dynamically import Leaflet map component (no SSR)
const SingleNodeMap = dynamic(
    () => import('@/components/dashboard/leaflet-map/single-node-map').then(mod => mod.SingleNodeMap),
    { ssr: false, loading: () => <div className="w-full h-[200px] bg-accent/20 rounded-lg animate-pulse" /> }
);

// Note: In Next.js 15+, params is a Promise
interface PageProps {
    params: Promise<{ pubkey: string }>;
}

function LoadingState() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-32 rounded-lg" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
            </div>
            <Skeleton className="h-64 rounded-lg" />
        </div>
    );
}

function NotFoundState({ pubkey }: { pubkey: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <XCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-display mb-2">Node Not Found</h2>
            <p className="text-muted-foreground mb-6 font-mono text-sm break-all max-w-md">
                No pNode found with pubkey: {pubkey.slice(0, 20)}...
            </p>
            <Link href="/pnodes">
                <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to pNodes
                </Button>
            </Link>
        </div>
    );
}

function StatusBadge({ status }: { status: PNode['status'] }) {
    const config = {
        online: { icon: CheckCircle, bg: 'bg-green-500/20', text: 'text-green-400', label: 'Online' },
        offline: { icon: XCircle, bg: 'bg-red-500/20', text: 'text-red-400', label: 'Offline' },
        degraded: { icon: AlertCircle, bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Degraded' },
    }[status];

    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${config.bg} ${config.text}`}>
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span>{config.label}</span>
        </span>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    color = 'text-primary',
    tooltip
}: {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color?: string;
    tooltip?: string;
}) {
    return (
        <div className="p-4 rounded-lg border-2 border-border bg-card" title={tooltip}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} aria-hidden="true" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
            <div className={`text-2xl font-display ${color}`}>{value}</div>
        </div>
    );
}

export default function NodeDetailPage({ params }: PageProps) {
    const { pubkey } = use(params);
    const { data: nodes, isLoading } = usePNodes();
    const { openConversationWithUser } = useChatState();

    const node = useMemo(() => {
        if (!nodes) return null;
        return nodes.find((n: PNode) => n.pubkey === pubkey);
    }, [nodes, pubkey]);

    const handleCopyPubkey = () => {
        navigator.clipboard.writeText(pubkey);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `Xandeum pNode - ${pubkey.slice(0, 8)}...`,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const handleExport = (format: ExportFormat) => {
        if (node) {
            exportPNodes([node], format, `pnode-${pubkey.slice(0, 8)}`);
        }
    };



    const latencyChartData = useMemo(() => {
        if (!node?.history?.latencyHistory) return [];
        return node.history.latencyHistory.map((value: number, i: number) => ({
            time: `${i + 1}d`,
            latency: value,
        }));
    }, [node]);

    if (isLoading && !nodes) {
        return (
            <DashboardPageLayout
                header={{
                    title: "Node Details",
                    description: "Loading...",
                    icon: ServerIcon,
                }}
            >
                <LoadingState />
            </DashboardPageLayout>
        );
    }

    if (!node) {
        return (
            <DashboardPageLayout
                header={{
                    title: "Node Details",
                    description: "Not Found",
                    icon: ServerIcon,
                }}
            >
                <NotFoundState pubkey={pubkey} />
            </DashboardPageLayout>
        );
    }

    return (
        <DashboardPageLayout
            header={{
                title: "Node Details",
                description: `${node.pubkey.slice(0, 12)}...`,
                icon: ServerIcon,
            }}
        >
            {/* Back Navigation & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <Link href="/pnodes">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to pNodes
                    </Button>
                </Link>
                <div className="flex items-center gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                            if (node) {
                                openConversationWithUser(
                                    node.pubkey,
                                    `Node ${node.pubkey.slice(0, 6)}`,
                                    // Use specific avatars for reliability if they match our known list, else random
                                    undefined
                                );
                            }
                        }}
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message Operator
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyPubkey}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Pubkey
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                    <ExportButton
                        onExport={handleExport}
                        label="Export"
                    />
                </div>
            </div>

            {/* Node Header */}
            <div className="rounded-lg border-2 border-border p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <StatusBadge status={node.status} />
                            {node.creditsRank && (
                                <span className="text-sm text-muted-foreground">
                                    Rank #{node.creditsRank}
                                </span>
                            )}
                        </div>
                        <div className="font-mono text-sm break-all text-muted-foreground">
                            {node.pubkey}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-4xl font-display text-primary">{node.performance.score.toFixed(1)}</div>
                            <div className="text-xs text-muted-foreground uppercase">Score</div>
                        </div>
                        <div className={`px-3 py-1 rounded text-sm uppercase font-bold ${node.performance.tier === 'excellent' ? 'bg-green-500/20 text-green-400' :
                            node.performance.tier === 'good' ? 'bg-blue-500/20 text-blue-400' :
                                node.performance.tier === 'fair' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                            }`}>
                            {node.performance.tier}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

                <StatCard
                    label="Latency"
                    value={`${node.metrics.responseTimeMs.toFixed(0)}ms`}
                    icon={Activity}
                    color="text-blue-400"
                    tooltip="Average network response time"
                />
                <StatCard
                    label="Peers"
                    value={node.gossip.peersConnected}
                    icon={Users}
                    color="text-purple-400"
                    tooltip="Number of connected gossip peers"
                />
                <StatCard
                    label="Credits"
                    value={node.credits?.toLocaleString() || 'N/A'}
                    icon={TrendingUp}
                    color="text-cyan-400"
                    tooltip="Pod credits score - a measure of node reliability"
                />
                <StatCard
                    label="Storage"
                    value={`${(node.metrics.storageCapacityGB / 1000).toFixed(1)}TB`}
                    icon={HardDrive}
                    color="text-yellow-400"
                    tooltip="Total storage capacity"
                />
                <StatCard
                    label="Used"
                    value={`${(node.metrics.storageUsedGB / 1000).toFixed(2)}TB`}
                    icon={HardDrive}
                    color="text-orange-400"
                    tooltip="Current storage usage"
                />
                <StatCard
                    label="CPU"
                    value={`${node.metrics.cpuPercent.toFixed(0)}%`}
                    icon={Cpu}
                    color="text-pink-400"
                    tooltip="Current CPU utilization"
                />
                <StatCard
                    label="Memory"
                    value={`${node.metrics.memoryPercent.toFixed(0)}%`}
                    icon={Gauge}
                    color="text-indigo-400"
                    tooltip="Current memory utilization"
                />
            </div>

            {/* Location & Network Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="rounded-lg border-2 border-border p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Location</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">City</span>
                            <span className="font-mono">{node.location?.city || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Country</span>
                            <span className="font-mono">{node.location?.country || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Datacenter</span>
                            <span className="font-mono text-sm">{node.location?.datacenter || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">ASN</span>
                            <span className="font-mono">{node.location?.asn || 'Unknown'}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border-2 border-border p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Server className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Network</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">IP Address</span>
                            <span className="font-mono">{node.ip}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Port</span>
                            <span className="font-mono">{node.port}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Version</span>
                            <span className="font-mono">{node.version}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Seen</span>
                            <span className="font-mono text-sm">{new Date(node.lastSeen).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Node Location Map */}
            <div className="rounded-lg border-2 border-border overflow-hidden mb-6">
                <div className="px-4 py-2 border-b border-border bg-accent/20">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Node Location</span>
                </div>
                <div className="h-[300px]">
                    <SingleNodeMap node={node} />
                </div>
            </div>

            {/* Staking Info */}
            {node.staking && (
                <div className="rounded-lg border-2 border-border p-4 mb-6">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Staking Information</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-muted-foreground text-sm">Commission</div>
                            <div className="text-xl font-display">{node.staking.commission}%</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground text-sm">APY</div>
                            <div className="text-xl font-display text-green-400">{node.staking.apy.toFixed(2)}%</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground text-sm">Delegated Stake</div>
                            <div className="text-xl font-display">{(node.staking.delegatedStake / 1e9).toFixed(2)} SOL</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground text-sm">Activated Stake</div>
                            <div className="text-xl font-display">{(node.staking.activatedStake / 1e9).toFixed(2)} SOL</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


                <div className="rounded-lg border-2 border-border overflow-hidden">
                    <div className="px-4 py-2 border-b border-border bg-accent/20">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Latency History (30d)</span>
                    </div>
                    <div className="p-4 h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={latencyChartData}>
                                <defs>
                                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                <XAxis dataKey="time" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--popover))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="latency"
                                    stroke="#3b82f6"
                                    fill="url(#latencyGradient)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Gossip Stats */}
            <div className="rounded-lg border-2 border-border p-4 mt-6">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Gossip Protocol Statistics</div>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-muted-foreground text-sm">Messages Received</div>
                        <div className="text-2xl font-display text-purple-400">
                            {(node.gossip.messagesReceived / 1000).toFixed(1)}K
                        </div>
                    </div>
                    <div>
                        <div className="text-muted-foreground text-sm">Messages Sent</div>
                        <div className="text-2xl font-display text-cyan-400">
                            {(node.gossip.messagesSent / 1000).toFixed(1)}K
                        </div>
                    </div>
                    <div>
                        <div className="text-muted-foreground text-sm">Connected Peers</div>
                        <div className="text-2xl font-display text-green-400">
                            {node.gossip.peersConnected}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardPageLayout>
    );
}
