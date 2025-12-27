'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, type ComponentProps, type MouseEvent } from 'react';

/**
 * Enhanced prefetching Link component inspired by NextFaster
 * - Prefetches route when link enters viewport (IntersectionObserver)
 * - Prefetches data into React Query cache on hover
 * - Navigates on mouseDown for 50-100ms faster perceived response
 */

// Map routes to their React Query data prefetchers
const ROUTE_PREFETCHERS: Record<string, { queryKey: string[]; fetcher: () => Promise<any> }[]> = {
    '/': [
        { queryKey: ['pnodes'], fetcher: () => fetch('/api/pnode-data?type=cluster-nodes').then(r => r.json()) },
        { queryKey: ['network-stats'], fetcher: () => fetch('/api/pnode-data?type=network-stats').then(r => r.json()) },
    ],
    '/pnodes': [
        { queryKey: ['pnodes'], fetcher: () => fetch('/api/pnode-data?type=cluster-nodes').then(r => r.json()) },
    ],
    '/performance': [
        { queryKey: ['pnodes'], fetcher: () => fetch('/api/pnode-data?type=cluster-nodes').then(r => r.json()) },
        { queryKey: ['performance-history', '24h'], fetcher: () => fetch('/api/pnode-data?type=performance-history&period=24h').then(r => r.json()) },
    ],
    '/health': [
        { queryKey: ['health-score-breakdown'], fetcher: () => fetch('/api/pnode-data?type=health-score-breakdown').then(r => r.json()) },
        { queryKey: ['network-stats'], fetcher: () => fetch('/api/pnode-data?type=network-stats').then(r => r.json()) },
        { queryKey: ['pnodes'], fetcher: () => fetch('/api/pnode-data?type=cluster-nodes').then(r => r.json()) },
    ],
    '/network': [
        { queryKey: ['pnodes'], fetcher: () => fetch('/api/pnode-data?type=cluster-nodes').then(r => r.json()) },
        { queryKey: ['gossip-health'], fetcher: () => fetch('/api/pnode-data?type=gossip-health').then(r => r.json()) },
        { queryKey: ['storage-distribution'], fetcher: () => fetch('/api/pnode-data?type=storage-distribution').then(r => r.json()) },
    ],
    '/decentralization': [
        { queryKey: ['decentralization-metrics'], fetcher: () => fetch('/api/pnode-data?type=decentralization-metrics').then(r => r.json()) },
        { queryKey: ['pnodes'], fetcher: () => fetch('/api/pnode-data?type=cluster-nodes').then(r => r.json()) },
    ],
    '/alerts': [], // Alerts page uses local storage, no prefetch needed
};

type PreloadLinkProps = ComponentProps<typeof NextLink>;

export function PreloadLink({ href, children, onClick, ...props }: PreloadLinkProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const linkRef = useRef<HTMLAnchorElement>(null);
    const hasPrefetchedRoute = useRef(false);
    const hasPrefetchedData = useRef(false);

    const hrefString = String(href);

    // Prefetch route when link enters viewport
    useEffect(() => {
        const link = linkRef.current;
        if (!link) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasPrefetchedRoute.current) {
                    router.prefetch(hrefString);
                    hasPrefetchedRoute.current = true;
                    observer.disconnect();
                }
            },
            { rootMargin: '100px' }
        );

        observer.observe(link);
        return () => observer.disconnect();
    }, [hrefString, router]);

    const prefetchData = () => {
        if (hasPrefetchedData.current) return;

        const prefetchers = ROUTE_PREFETCHERS[hrefString];
        if (prefetchers && prefetchers.length > 0) {
            prefetchers.forEach(({ queryKey, fetcher }) => {
                queryClient.prefetchQuery({
                    queryKey,
                    queryFn: fetcher,
                    staleTime: 2 * 60 * 1000, // Match our global staleTime
                });
            });
        }
        hasPrefetchedData.current = true;
    };

    const handleMouseEnter = () => {
        // Ensure route is prefetched
        if (!hasPrefetchedRoute.current) {
            router.prefetch(hrefString);
            hasPrefetchedRoute.current = true;
        }
        // Prefetch React Query data
        prefetchData();
    };

    const handleMouseDown = (e: MouseEvent<HTMLAnchorElement>) => {
        // Only handle left-click without modifiers
        if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            router.push(hrefString);
        }
    };

    return (
        <NextLink
            ref={linkRef}
            href={href}
            onMouseEnter={handleMouseEnter}
            onMouseDown={handleMouseDown}
            onClick={onClick}
            prefetch={false} // We handle prefetching manually
            {...props}
        >
            {children}
        </NextLink>
    );
}
