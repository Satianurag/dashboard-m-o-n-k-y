'use client';

import { useState, useMemo } from 'react';
import type { PNode } from '@/types/pnode';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface PNodeTableProps {
  nodes: PNode[];
  onNodeSelect?: (node: PNode) => void;
}

type SortField = 'status' | 'performance' | 'responseTime' | 'storage' | 'location';
type SortOrder = 'asc' | 'desc';

export function PNodeTable({ nodes, onNodeSelect }: PNodeTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('performance');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'degraded'>('all');

  const filteredNodes = useMemo(() => {
    let result = [...nodes];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(node =>
        node.pubkey.toLowerCase().includes(searchLower) ||
        node.location?.city.toLowerCase().includes(searchLower) ||
        node.location?.country.toLowerCase().includes(searchLower) ||
        node.id.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(node => node.status === statusFilter);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'status':
          const statusOrder = { online: 0, degraded: 1, offline: 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'performance':
          comparison = a.performance.score - b.performance.score;
          break;

        case 'responseTime':
          comparison = a.metrics.responseTimeMs - b.metrics.responseTimeMs;
          break;
        case 'storage':
          comparison = (a.metrics.storageUsedGB / a.metrics.storageCapacityGB) -
            (b.metrics.storageUsedGB / b.metrics.storageCapacityGB);
          break;
        case 'location':
          comparison = (a.location?.country || '').localeCompare(b.location?.country || '');
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [nodes, search, sortField, sortOrder, statusFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-3 py-2 text-left text-xs uppercase tracking-wider cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-primary">{sortOrder === 'desc' ? '↓' : '↑'}</span>
        )}
      </div>
    </th>
  );

  const getStatusColor = (status: PNode['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'degraded': return 'bg-yellow-500';
    }
  };

  const getTierColor = (tier: PNode['performance']['tier']) => {
    switch (tier) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by pubkey, city, or country..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          {(['all', 'online', 'offline', 'degraded'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-1.5 text-xs uppercase tracking-wider rounded transition-colors',
                statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent hover:bg-accent/80'
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Showing {filteredNodes.length} of {nodes.length} pNodes
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-accent/50">
            <tr>
              <SortHeader field="status">Status</SortHeader>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider">pNode</th>
              <SortHeader field="location">Location</SortHeader>
              <SortHeader field="performance">Score</SortHeader>

              <SortHeader field="responseTime">Latency</SortHeader>
              <SortHeader field="storage">Storage</SortHeader>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider">Peers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredNodes.map((node) => (
              <tr
                key={node.id}
                className="hover:bg-accent/30 cursor-pointer transition-colors"
                onClick={() => onNodeSelect?.(node)}
              >
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        getStatusColor(node.status),
                        node.status === 'online' && 'animate-pulse'
                      )}
                    />
                    <span className="text-xs uppercase">{node.status}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs">
                      {node.pubkey.slice(0, 8)}...{node.pubkey.slice(-6)}
                    </span>
                    <span className="text-xs text-muted-foreground">v{node.version}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col">
                    <span className="text-xs">{node.location?.city}</span>
                    <span className="text-xs text-muted-foreground">{node.location?.country}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-accent rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          node.performance.tier === 'excellent' ? 'bg-green-500' :
                            node.performance.tier === 'good' ? 'bg-blue-500' :
                              node.performance.tier === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                        )}
                        style={{ width: `${node.performance.score}%` }}
                      />
                    </div>
                    <span className={cn('text-xs font-mono', getTierColor(node.performance.tier))}>
                      {node.performance.score.toFixed(0)}
                    </span>
                  </div>
                </td>

                <td className="px-3 py-3">
                  <span className={cn(
                    'text-xs font-mono',
                    node.metrics.responseTimeMs < 80 ? 'text-green-400' :
                      node.metrics.responseTimeMs < 120 ? 'text-yellow-400' : 'text-red-400'
                  )}>
                    {node.metrics.responseTimeMs.toFixed(0)}ms
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-mono">
                      {node.metrics.storageUsedGB.toFixed(0)}/{node.metrics.storageCapacityGB}GB
                    </span>
                    <div className="w-16 h-1 bg-accent rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(node.metrics.storageUsedGB / node.metrics.storageCapacityGB) * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="text-xs font-mono">{node.gossip.peersConnected}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
