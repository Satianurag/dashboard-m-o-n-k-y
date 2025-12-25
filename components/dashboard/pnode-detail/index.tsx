'use client';

import type { PNode } from '@/types/pnode';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PNodeDetailProps {
  node: PNode | null;
  open: boolean;
  onClose: () => void;
}

export function PNodeDetail({ node, open, onClose }: PNodeDetailProps) {
  if (!node) return null;

  const getStatusColor = (status: PNode['status']) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'degraded': return 'text-yellow-500';
    }
  };

  const getTierColor = (tier: PNode['performance']['tier']) => {
    switch (tier) {
      case 'excellent': return 'text-green-400 bg-green-500/10';
      case 'good': return 'text-blue-400 bg-blue-500/10';
      case 'fair': return 'text-yellow-400 bg-yellow-500/10';
      case 'poor': return 'text-red-400 bg-red-500/10';
    }
  };

  const MetricCard = ({ label, value, subValue }: { label: string; value: string; subValue?: string }) => (
    <div className="bg-accent/30 rounded-lg p-3">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <div className="text-lg font-mono">{value}</div>
      {subValue && <div className="text-xs text-muted-foreground mt-0.5">{subValue}</div>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className={cn('w-3 h-3 rounded-full',
              node.status === 'online' ? 'bg-green-500 animate-pulse' :
                node.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
            )} />
            <span className="font-display">PNODE DETAILS</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4 p-4 bg-accent/20 rounded-lg">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Public Key</div>
              <div className="font-mono text-sm break-all">{node.pubkey}</div>
            </div>
            <div className={cn('px-3 py-1 rounded text-sm font-medium', getTierColor(node.performance.tier))}>
              {node.performance.tier.toUpperCase()} • {node.performance.score.toFixed(0)}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Status"
              value={node.status.toUpperCase()}
            />
            <MetricCard
              label="Version"
              value={`v${node.version}`}
            />
            <MetricCard
              label="Location"
              value={node.location?.city || 'Unknown'}
              subValue={node.location?.country}
            />
            <MetricCard
              label="Last Seen"
              value={new Date(node.lastSeen).toLocaleTimeString()}
              subValue={new Date(node.lastSeen).toLocaleDateString()}
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Performance Metrics</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

              <MetricCard
                label="Response Time"
                value={`${node.metrics.responseTimeMs.toFixed(0)}ms`}
              />
              <MetricCard
                label="CPU Usage"
                value={`${node.metrics.cpuPercent.toFixed(1)}%`}
              />
              <MetricCard
                label="Memory"
                value={`${node.metrics.memoryPercent.toFixed(1)}%`}
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Storage</div>
            <div className="bg-accent/30 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span>{node.metrics.storageUsedGB.toFixed(0)} GB used</span>
                <span>{node.metrics.storageCapacityGB} GB total</span>
              </div>
              <div className="h-3 bg-accent rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                  style={{ width: `${(node.metrics.storageUsedGB / node.metrics.storageCapacityGB) * 100}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {((node.metrics.storageUsedGB / node.metrics.storageCapacityGB) * 100).toFixed(1)}% utilized
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Gossip Network</div>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard
                label="Peers Connected"
                value={node.gossip.peersConnected.toString()}
              />
              <MetricCard
                label="Messages Received"
                value={node.gossip.messagesReceived.toLocaleString()}
              />
              <MetricCard
                label="Messages Sent"
                value={node.gossip.messagesSent.toLocaleString()}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
            <span>IP: {node.ip}:{node.port}</span>
            <span>•</span>
            <span>ID: {node.id}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
