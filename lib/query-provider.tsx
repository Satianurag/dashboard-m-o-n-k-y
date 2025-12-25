'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useState } from 'react';

// Configure QueryClient with optimal settings
function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Stale-while-revalidate: show cached data immediately, fetch in background
                staleTime: 30 * 1000, // Consider data fresh for 30 seconds
                gcTime: 5 * 60 * 1000, // Cache for 5 minutes
                refetchOnWindowFocus: true, // Refetch when user returns to tab
                refetchOnReconnect: true, // Refetch on network reconnect
                retry: 2, // Retry failed requests twice
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            },
            mutations: {
                retry: 1,
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
    if (typeof window === 'undefined') {
        // Server: always make a new query client
        return makeQueryClient();
    } else {
        // Browser: make a new query client if we don't already have one
        if (!browserQueryClient) browserQueryClient = makeQueryClient();
        return browserQueryClient;
    }
}

export function QueryProvider({ children }: { children: ReactNode }) {
    // NOTE: Avoid useState when initializing the query client if you don't
    // have a suspense boundary between this and the code that may
    // suspend because React will throw away the client on the initial
    // render if it suspends and there is no boundary
    const queryClient = getQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* DevTools only show in development */}
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </QueryClientProvider>
    );
}
