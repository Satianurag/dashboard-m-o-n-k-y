'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import ServerIcon from "@/components/icons/server";
import { usePNodes } from "@/hooks/use-pnode-data-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/dashboard/export-button";
import { exportPNodes, type ExportFormat } from "@/lib/export-utils";
import { Search, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { PNode } from "@/types/pnode";
import { cn } from "@/lib/utils";

function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}

// Status filter type
type StatusFilter = 'all' | 'online' | 'offline' | 'degraded';

// Simple status badge - no icons
function StatusBadge({ status }: { status: PNode['status'] }) {
  const config = {
    online: 'bg-green-500/20 text-green-400',
    offline: 'bg-red-500/20 text-red-400',
    degraded: 'bg-yellow-500/20 text-yellow-400',
  }[status];

  return (
    <span className={cn("px-2 py-1 rounded text-xs font-medium uppercase", config)}>
      {status}
    </span>
  );
}

export default function PNodesPage({ initialNodes }: { initialNodes: PNode[] | null }) {
  const { data: nodes, isLoading } = usePNodes(initialNodes);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<'credits' | 'latency' | 'uptime'>('credits');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter and sort nodes
  const displayNodes = useMemo(() => {
    if (!nodes) return [];

    let filtered = [...nodes];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.pubkey.toLowerCase().includes(query) ||
        n.location?.city?.toLowerCase().includes(query) ||
        n.location?.country?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(n => n.status === statusFilter);
    }

    // Sort
    return filtered.sort((a, b) => {
      let aVal = 0, bVal = 0;
      switch (sortBy) {
        case 'credits': aVal = a.credits || 0; bVal = b.credits || 0; break;
        case 'latency': aVal = a.metrics.responseTimeMs; bVal = b.metrics.responseTimeMs; break;
        case 'uptime': aVal = a.uptime; bVal = b.uptime; break;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [nodes, searchQuery, statusFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(displayNodes.length / itemsPerPage);
  const paginatedNodes = displayNodes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => setCurrentPage(1), [searchQuery, statusFilter, sortBy, sortOrder]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleExport = (format: ExportFormat) => {
    exportPNodes(displayNodes.length > 0 ? displayNodes : (nodes || []), format);
  };

  const statusCounts = useMemo(() => {
    if (!nodes) return { all: 0, online: 0, offline: 0, degraded: 0 };
    return {
      all: nodes.length,
      online: nodes.filter(n => n.status === 'online').length,
      offline: nodes.filter(n => n.status === 'offline').length,
      degraded: nodes.filter(n => n.status === 'degraded').length,
    };
  }, [nodes]);

  if (isLoading && !nodes) {
    return (
      <DashboardPageLayout header={{ title: "pNodes", description: "Loading...", icon: ServerIcon }}>
        <LoadingState />
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      header={{
        title: "pNodes",
        description: `${nodes?.length || 0} nodes in network`,
        icon: ServerIcon,
      }}
    >
      {/* Search & Filters Card */}
      <DashboardCard
        title="SEARCH & FILTERS"
        intent="default"
        addon={<ExportButton onExport={handleExport} disabled={!nodes || nodes.length === 0} label="Export" />}
      >
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by pubkey, city, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-background border-2 border-border focus:border-primary focus:outline-none transition-colors text-sm"
            />
          </div>

          {/* Status Filter Badges */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'online', 'offline', 'degraded'] as const).map((status) => {
              const isActive = statusFilter === status;
              const colors = {
                all: 'bg-secondary hover:bg-secondary/80',
                online: isActive ? 'bg-green-500/30 text-green-400 border-green-500/50' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20',
                offline: isActive ? 'bg-red-500/30 text-red-400 border-red-500/50' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20',
                degraded: isActive ? 'bg-yellow-500/30 text-yellow-400 border-yellow-500/50' : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20',
              };
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all border-2",
                    isActive ? "border-primary scale-105" : "border-transparent",
                    colors[status]
                  )}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
                </button>
              );
            })}
          </div>
        </div>
      </DashboardCard>

      {/* Nodes Table */}
      <DashboardCard
        title="PNODE RANKING"
        intent="default"
        addon={
          <Badge variant="outline-warning">
            {displayNodes.length} NODES
          </Badge>
        }
      >
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-accent/30 rounded-lg text-xs uppercase tracking-wider text-muted-foreground font-medium">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Node</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Location</div>
          <div
            className="col-span-1 cursor-pointer hover:text-primary"
            onClick={() => toggleSort('credits')}
          >
            Credits {sortBy === 'credits' && (sortOrder === 'desc' ? '↓' : '↑')}
          </div>
          <div
            className="col-span-1 cursor-pointer hover:text-primary"
            onClick={() => toggleSort('latency')}
          >
            Latency {sortBy === 'latency' && (sortOrder === 'desc' ? '↓' : '↑')}
          </div>
          <div
            className="col-span-1 cursor-pointer hover:text-primary"
            onClick={() => toggleSort('uptime')}
          >
            Uptime {sortBy === 'uptime' && (sortOrder === 'desc' ? '↓' : '↑')}
          </div>
          <div className="col-span-1">Storage</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border/50 mt-2">
          {paginatedNodes.map((node, index) => {
            const rank = (currentPage - 1) * itemsPerPage + index + 1;
            const isFeatured = rank === 1;

            return (
              <div
                key={node.id}
                className={cn(
                  "grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-accent/20 transition-colors rounded-lg",
                  isFeatured && "bg-primary/5 border-l-2 border-primary"
                )}
              >
                {/* Rank */}
                <div className="col-span-1">
                  <span className={cn(
                    "inline-flex items-center justify-center w-8 h-8 rounded font-display text-sm",
                    isFeatured ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  )}>
                    {rank}
                  </span>
                </div>

                {/* Node Pubkey */}
                <div className="col-span-3">
                  <Link
                    href={`/pnodes/${node.pubkey}`}
                    className="font-mono text-sm hover:text-primary transition-colors flex items-center gap-1 group"
                  >
                    <span>{node.pubkey.slice(0, 16)}...</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <StatusBadge status={node.status} />
                </div>

                {/* Location */}
                <div className="col-span-2 text-sm">
                  <div>{node.location?.city}</div>
                  <div className="text-muted-foreground text-xs">{node.location?.countryCode}</div>
                </div>

                {/* Credits */}
                <div className="col-span-1">
                  <Badge variant={isFeatured ? "default" : "secondary"} className="font-mono">
                    {(node.credits || 0).toLocaleString()}
                  </Badge>
                </div>

                {/* Latency */}
                <div className="col-span-1 font-mono text-sm">
                  {node.metrics.responseTimeMs.toFixed(0)}ms
                </div>

                {/* Uptime */}
                <div className="col-span-1 font-mono text-sm">
                  {node.uptime.toFixed(1)}%
                </div>

                {/* Storage */}
                <div className="col-span-1 font-mono text-sm">
                  {(node.metrics.storageCapacityGB / 1000).toFixed(1)}TB
                </div>
              </div>
            );
          })}

          {displayNodes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No nodes match your filters
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground font-mono">
              <span className="text-primary font-semibold">
                {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, displayNodes.length)}
              </span>
              {' '}of{' '}
              <span className="text-primary font-semibold">{displayNodes.length}</span>
              {' '}nodes
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-9 w-9 p-0 border-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  const isActive = currentPage === pageNum;
                  return (
                    <Button
                      key={pageNum}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-9 h-9 p-0 font-mono"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-9 w-9 p-0 border-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DashboardCard>
    </DashboardPageLayout>
  );
}
