'use client';

import dynamic from 'next/dynamic';
import type { PNode } from '@/types/pnode';

interface LeafletMapProps {
    nodes: PNode[];
}

// Dynamically import with SSR disabled to prevent \"Map container already initialized\" errors
const MapContent = dynamic(
    () => import('./map-content').then((mod) => mod.MapContent),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-black/50 rounded-lg min-h-[300px]">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        ),
    }
);

export function LeafletMap({ nodes }: LeafletMapProps) {
    return <MapContent nodes={nodes} />;
}
