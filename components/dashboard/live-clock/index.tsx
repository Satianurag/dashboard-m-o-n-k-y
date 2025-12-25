'use client';

import { useLiveClock } from '@/hooks/use-pnode-data-query';
import Image from 'next/image';

export function LiveClock() {
  const { time, timezone } = useLiveClock();

  const dayName = time.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const date = time.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return (
    <div className="flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <Image
          src="/assets/pc_blueprint.gif"
          alt=""
          fill
          className="object-cover"
        />
      </div>

      <div className="relative z-10 text-center">
        <div className="flex items-baseline justify-between mb-2 gap-4">
          <span className="text-xs text-muted-foreground tracking-wider">{dayName}</span>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>

        <div className="font-display text-4xl md:text-5xl tracking-tight flex items-baseline justify-center gap-1">
          <span>{displayHours}:{minutes}</span>
          <span className="text-lg opacity-50">:{seconds}</span>
          <span className="text-lg ml-1">{ampm}</span>
        </div>

        <div className="flex items-center justify-center gap-3 mt-3 text-xs">
          <span className="px-2 py-0.5 bg-primary/20 rounded text-primary">
            {timezone.offset}
          </span>
          <span className="text-muted-foreground uppercase tracking-wider">
            {timezone.city}
          </span>
        </div>
      </div>
    </div>
  );
}
