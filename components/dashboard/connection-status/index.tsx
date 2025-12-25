'use client';

import { useConnectionStatus } from '@/hooks/use-pnode-data-query';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
  const { status, lastCheck } = useConnectionStatus();

  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      text: 'CONNECTED',
      pulse: true,
    },
    connecting: {
      color: 'bg-yellow-500',
      text: 'CONNECTING',
      pulse: true,
    },
    disconnected: {
      color: 'bg-red-500',
      text: 'DISCONNECTED',
      pulse: false,
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          config.color,
          config.pulse && 'animate-pulse'
        )}
      />
      <span className="text-muted-foreground tracking-wider">
        {config.text}
      </span>
      {lastCheck && (
        <span className="text-muted-foreground/50">
          {lastCheck.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
