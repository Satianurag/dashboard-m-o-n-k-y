'use client';

import { useEffect, useState, useRef } from 'react';
import { useGossipEvents } from '@/hooks/use-pnode-data-query';
import type { GossipEvent } from '@/types/pnode';
import { cn } from '@/lib/utils';

const eventTypeColors: Record<GossipEvent['type'], string> = {
  discovery: 'text-green-400',
  message: 'text-blue-400',
  sync: 'text-purple-400',
  heartbeat: 'text-yellow-400',
  data_transfer: 'text-cyan-400',
};

const eventTypeLabels: Record<GossipEvent['type'], string> = {
  discovery: 'DISCOVERY',
  message: 'MESSAGE',
  sync: 'SYNC',
  heartbeat: 'HEARTBEAT',
  data_transfer: 'TRANSFER',
};

interface PulseEventProps {
  event: GossipEvent;
}

function PulseEvent({ event }: PulseEventProps) {
  const sourceId = event.sourceNodeId.replace('pnode_', '');
  const targetId = event.targetNodeId.replace('pnode_', '');

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap px-3">
      <span className={cn('text-xs font-mono', eventTypeColors[event.type])}>
        [{eventTypeLabels[event.type]}]
      </span>
      <span className="text-xs text-muted-foreground">
        pNode_{sourceId} → pNode_{targetId}
      </span>
      {event.metadata?.bytesTransferred && (
        <span className="text-xs text-primary/70">
          {(event.metadata.bytesTransferred / 1024).toFixed(1)}KB
        </span>
      )}
      {event.metadata?.latencyMs && (
        <span className="text-xs text-muted-foreground">
          {event.metadata.latencyMs}ms
        </span>
      )}
    </span>
  );
}

export function LiveNetworkPulse() {
  const { data: events } = useGossipEvents();
  const [displayEvents, setDisplayEvents] = useState<GossipEvent[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (events && events.length > 0) {
      setDisplayEvents(prev => {
        const newEvents = [...events.slice(0, 5), ...prev];
        return newEvents.slice(0, 20);
      });
    }
  }, [events]);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-8 bg-background/95 border-t border-border backdrop-blur-sm z-50"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="h-full flex items-center">
        <div className="flex-shrink-0 px-3 border-r border-border h-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-display text-primary uppercase tracking-wider">
            LIVE PULSE
          </span>
        </div>

        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative"
        >
          <div
            className={cn(
              "flex items-center h-full",
              !isPaused && "animate-marquee"
            )}
            style={{
              animationDuration: '30s',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'linear',
            }}
          >
            {displayEvents.map((event, idx) => (
              <PulseEvent key={`${event.id}_${idx}`} event={event} />
            ))}
            {displayEvents.length === 0 && (
              <span className="text-xs text-muted-foreground px-3">
                Waiting for gossip events...
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 px-3 border-l border-border h-full flex items-center">
          <span className="text-xs text-muted-foreground">
            {displayEvents.length} events
          </span>
        </div>
      </div>
    </div>
  );
}
