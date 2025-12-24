'use client';

import { useEffect, useRef } from 'react';
import type { PNode } from '@/types/pnode';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapContentProps {
    nodes: PNode[];
}

export function MapContent({ nodes }: MapContentProps) {
    const mapRef = useRef<L.Map | null>(null);
    const containerId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Cleanup existing map
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }

        // Initialize map
        const map = L.map(containerId.current, {
            center: [20, 0],
            zoom: 2,
            zoomControl: true,
            attributionControl: true,
        });

        mapRef.current = map;

        // Add CartoDB Dark Matter tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
            attribution: '©OpenStreetMap, ©CartoDB',
            subdomains: 'abcd',
            maxZoom: 19,
        }).addTo(map);

        // Add node markers
        const onlineNodes = nodes.filter(node => node.status === 'online' && node.location);

        onlineNodes.forEach(node => {
            if (!node.location) return;

            const color = node.status === 'online' ? '#22c55e' : node.status === 'degraded' ? '#f59e0b' : '#ef4444';

            const marker = L.circleMarker([node.location.lat, node.location.lng], {
                radius: 6,
                fillColor: color,
                color: '#fff',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8,
            });

            marker.bindPopup(`
        <div style="color: #fff; background: #1a1a1a; padding: 8px; border-radius: 4px;">
          <div style="font-weight: bold; margin-bottom: 4px;">${node.location.city}, ${node.location.countryCode}</div>
          <div style="font-size: 12px; opacity: 0.8;">Score: ${node.performance.score.toFixed(1)}</div>
          <div style="font-size: 12px; opacity: 0.8;">Uptime: ${node.uptime.toFixed(1)}%</div>
        </div>
      `);

            marker.addTo(map);
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [nodes]);

    return (
        <div
            id={containerId.current}
            className="w-full h-full min-h-[300px] rounded-lg overflow-hidden"
        />
    );
}
