'use client';

import { useState, useMemo } from 'react';
import DashboardPageLayout from "@/components/dashboard/layout";
import ServerIcon from "@/components/icons/server";
import { usePNodes } from "@/hooks/use-pnode-data";
import { NodeSearch } from "@/components/dashboard/node-search";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { PNode } from "@/types/pnode";

function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}

// Accessible status badge with icon (fixes color-only indicator issue)
function StatusBadge({ status }: { status: PNode['status'] }) {
  const config = {
    online: { icon: CheckCircle, bg: 'bg-green-500/20', text: 'text-green-400', label: 'Online' },
    offline: { icon: XCircle, bg: 'bg-red-500/20', text: 'text-red-400', label: 'Offline' },
    degraded: { icon: AlertCircle, bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Degraded' },
  }[status];

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}

// Tier badge with icon for accessibility
function TierBadge({ tier }: { tier: PNode['performance']['tier'] }) {
  const config = {
    excellent: { icon: TrendingUp, text: 'text-green-400', label: '★' },
    good: { icon: TrendingUp, text: 'text-blue-400', label: '▲' },
    fair: { icon: Minus, text: 'text-yellow-400', label: '●' },
    poor: { icon: TrendingDown, text: 'text-red-400', label: '▼' },
  }[tier];

  return (
    <span className={`inline-flex items-center gap-1 ${config.text}`} title={tier}>
      <span aria-hidden="true">{config.label}</span>
      <span className="sr-only">{tier} performance</span>
    </span>
  );
}

// Mobile card layout for pNodes
function NodeCard({ node, isSelected, onToggle }: { node: PNode; isSelected: boolean; onToggle: () => void }) {
  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all card-interactive ${isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card'
        }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="rounded border-border"
            aria-label={`Select node ${node.pubkey.slice(0, 8)}`}
          />
          <div className="font-mono text-sm truncate max-w-[180px]" title={node.pubkey}>
            {node.pubkey.slice(0, 12)}...
          </div>
        </div>
        <StatusBadge status={node.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Score</span>
          <span className="font-mono flex items-center gap-1">
            <TierBadge tier={node.performance.tier} />
            {node.performance.score.toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Uptime</span>
          <span className="font-mono">{node.uptime.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Latency</span>
          <span className="font-mono">{node.metrics.responseTimeMs.toFixed(0)}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Storage</span>
          <span className="font-mono">{(node.metrics.storageCapacityGB / 1000).toFixed(1)}TB</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Location</span>
          <span>{node.location?.city}, {node.location?.countryCode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Peers</span>
          <span className="font-mono">{node.gossip.peersConnected}</span>
        </div>
      </div>
    </div>
  );
}

export default function PNodesPage() {
  const { data: nodes, loading, lastUpdated } = usePNodes();
  const [filteredNodes, setFilteredNodes] = useState<PNode[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'score' | 'uptime' | 'latency' | 'storage'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const displayNodes = useMemo(() => {
    const toSort = filteredNodes.length > 0 ? filteredNodes : (nodes || []);
    return [...toSort].sort((a, b) => {
      let aVal = 0, bVal = 0;
      switch (sortBy) {
        case 'score': aVal = a.performance.score; bVal = b.performance.score; break;
        case 'uptime': aVal = a.uptime; bVal = b.uptime; break;
        case 'latency': aVal = a.metrics.responseTimeMs; bVal = b.metrics.responseTimeMs; break;
        case 'storage': aVal = a.metrics.storageCapacityGB; bVal = b.metrics.storageCapacityGB; break;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [filteredNodes, nodes, sortBy, sortOrder]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleSelect = (nodeId: string) => {
    setSelectedNodes(prev =>
      prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId].slice(-3)
    );
  };

  if (loading && !nodes) {
    return (
      <DashboardPageLayout header={{ title: "pNodes", description: "Loading...", icon: ServerIcon }}>
        <LoadingState />
      </DashboardPageLayout>
    );
  }

  const comparedNodes = nodes?.filter(n => selectedNodes.includes(n.id)) || [];

  return (
    <DashboardPageLayout
      header={{
        title: "pNodes",
        description: `${nodes?.length || 0} nodes in network`,
        icon: ServerIcon,
      }}
    >
      {nodes && (
        <NodeSearch
          nodes={nodes}
          onFilterChange={setFilteredNodes}
        />
      )}

      {comparedNodes.length >= 2 && (
        <div className="rounded-lg border-2 border-primary/50 p-4 bg-primary/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-display uppercase">Compare Nodes ({comparedNodes.length})</span>
            <Button size="sm" variant="ghost" onClick={() => setSelectedNodes([])}>Clear</Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {comparedNodes.map(node => (
              <div key={node.id} className="p-3 rounded-lg bg-background border border-border">
                <div className="font-mono text-sm truncate mb-2">{node.pubkey.slice(0, 16)}...</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-mono text-primary">{node.performance.score.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="font-mono">{node.uptime.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="font-mono">{node.metrics.responseTimeMs.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Storage</span>
                    <span className="font-mono">{(node.metrics.storageCapacityGB / 1000).toFixed(1)}TB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peers</span>
                    <span className="font-mono">{node.gossip.peersConnected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission</span>
                    <span className="font-mono">{node.staking?.commission || 0}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {displayNodes.slice(0, 30).map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            isSelected={selectedNodes.includes(node.id)}
            onToggle={() => toggleSelect(node.id)}
          />
        ))}
        {displayNodes.length > 30 && (
          <div className="text-center text-sm text-muted-foreground py-3">
            Showing 30 of {displayNodes.length} nodes
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border-2 border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid" aria-label="pNodes table">
            <thead className="bg-accent/20 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground w-10">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={selectedNodes.length > 0}
                    onChange={() => setSelectedNodes([])}
                    aria-label={selectedNodes.length > 0 ? "Clear all selections" : "No nodes selected"}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Node</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Location</th>
                <th
                  className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-primary"
                  onClick={() => toggleSort('score')}
                  role="columnheader"
                  aria-sort={sortBy === 'score' ? (sortOrder === 'desc' ? 'descending' : 'ascending') : 'none'}
                >
                  Score {sortBy === 'score' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-primary"
                  onClick={() => toggleSort('uptime')}
                  role="columnheader"
                  aria-sort={sortBy === 'uptime' ? (sortOrder === 'desc' ? 'descending' : 'ascending') : 'none'}
                >
                  Uptime {sortBy === 'uptime' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-primary"
                  onClick={() => toggleSort('latency')}
                  role="columnheader"
                  aria-sort={sortBy === 'latency' ? (sortOrder === 'desc' ? 'descending' : 'ascending') : 'none'}
                >
                  Latency {sortBy === 'latency' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-primary"
                  onClick={() => toggleSort('storage')}
                  role="columnheader"
                  aria-sort={sortBy === 'storage' ? (sortOrder === 'desc' ? 'descending' : 'ascending') : 'none'}
                >
                  Storage {sortBy === 'storage' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Version</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Peers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayNodes.slice(0, 50).map((node) => (
                <tr
                  key={node.id}
                  className={`hover:bg-accent/10 transition-colors ${selectedNodes.includes(node.id) ? 'bg-primary/10' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={selectedNodes.includes(node.id)}
                      onChange={() => toggleSelect(node.id)}
                      aria-label={`Select node ${node.pubkey.slice(0, 8)}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs truncate max-w-[150px]" title={node.pubkey}>
                      {node.pubkey.slice(0, 12)}...
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={node.status} />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div>{node.location?.city}</div>
                    <div className="text-muted-foreground">{node.location?.countryCode}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono flex items-center gap-1">
                      <TierBadge tier={node.performance.tier} />
                      {node.performance.score.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{node.uptime.toFixed(1)}%</td>
                  <td className="px-4 py-3 font-mono text-xs">{node.metrics.responseTimeMs.toFixed(0)}ms</td>
                  <td className="px-4 py-3 font-mono text-xs">{(node.metrics.storageCapacityGB / 1000).toFixed(1)}TB</td>
                  <td className="px-4 py-3 font-mono text-xs">{node.version}</td>
                  <td className="px-4 py-3 font-mono text-xs">{node.gossip.peersConnected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {displayNodes.length > 50 && (
          <div className="px-4 py-3 border-t border-border bg-accent/10 text-center text-sm text-muted-foreground">
            Showing 50 of {displayNodes.length} nodes
          </div>
        )}
      </div>
    </DashboardPageLayout>
  );
}
