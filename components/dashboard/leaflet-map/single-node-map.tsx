'use client';

import { useEffect, useRef } from 'react';
import type { PNode } from '@/types/pnode';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface SingleNodeMapProps {
    node: PNode;
}

export function SingleNodeMap({ node }: SingleNodeMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const containerId = useRef(`node-map-${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        if (typeof window === 'undefined' || !node.location) return;

        // Cleanup existing map
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }

        const { lat, lng } = node.location;

        // Initialize map centered on node location
        const map = L.map(containerId.current, {
            center: [lat, lng],
            zoom: 4,
            zoomControl: true,
            attributionControl: false,
        });

        mapRef.current = map;

        // Add CartoDB Dark Matter tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 19,
        }).addTo(map);

        // Add node marker with pulse effect
        const color = node.status === 'online' ? '#22c55e' : node.status === 'degraded' ? '#f59e0b' : '#ef4444';

        // Add outer pulse ring
        L.circleMarker([lat, lng], {
            radius: 16,
            fillColor: color,
            color: color,
            weight: 2,
            opacity: 0.3,
            fillOpacity: 0.1,
        }).addTo(map);

        // Add inner marker
        const marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
        });

        marker.bindPopup(`
            <div style="color: #fff; background: #1a1a1a; padding: 12px; border-radius: 6px; min-width: 180px;">
                <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${node.location.city}, ${node.location.country}</div>
                <div style="font-size: 12px; opacity: 0.9; margin-bottom: 4px;">📍 ${node.location.datacenter || 'Unknown DC'}</div>
                <div style="font-size: 12px; opacity: 0.8;">Score: ${node.performance.score.toFixed(1)} | ${node.status.toUpperCase()}</div>
            </div>
        `);

        marker.addTo(map);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [node]);

    if (!node.location) {
        return (
            <div className="w-full h-full min-h-[200px] rounded-lg bg-accent/20 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Location data unavailable</span>
            </div>
        );
    }

    return (
        <div
            id={containerId.current}
            className="w-full h-full min-h-[200px] rounded-lg overflow-hidden"
        />
    );
}
