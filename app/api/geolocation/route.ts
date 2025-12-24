import { NextResponse } from 'next/server';

// Proxy for ip-api.com to avoid CORS issues
// Free tier: 45 requests/minute
const IP_API_BASE = 'http://ip-api.com/json';

interface GeolocationResult {
    status: 'success' | 'fail';
    country?: string;
    countryCode?: string;
    region?: string;
    regionName?: string;
    city?: string;
    lat?: number;
    lon?: number;
    isp?: string;
    org?: string;
    as?: string;
    query?: string;
    message?: string;
}

// In-memory cache for IP geolocation (IP locations rarely change)
const geoCache = new Map<string, { data: GeolocationResult; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');

    if (!ip) {
        return NextResponse.json(
            { error: 'IP address is required' },
            { status: 400 }
        );
    }

    // Check cache first
    const cached = geoCache.get(ip);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return NextResponse.json(cached.data, {
            headers: {
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
                'X-Cache': 'HIT',
            },
        });
    }

    try {
        const response = await fetch(`${IP_API_BASE}/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,isp,org,as,query`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `IP API returned ${response.status}` },
                { status: response.status }
            );
        }

        const data: GeolocationResult = await response.json();

        // Cache the result
        geoCache.set(ip, { data, timestamp: Date.now() });

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
                'X-Cache': 'MISS',
            },
        });
    } catch (error) {
        console.error('Error fetching geolocation:', error);
        return NextResponse.json(
            { error: 'Failed to fetch geolocation' },
            { status: 500 }
        );
    }
}

// Batch geolocation endpoint
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const ips: string[] = body.ips;

        if (!ips || !Array.isArray(ips) || ips.length === 0) {
            return NextResponse.json(
                { error: 'Array of IP addresses is required' },
                { status: 400 }
            );
        }

        // Limit batch size to avoid rate limits
        const limitedIps = ips.slice(0, 45);
        const results: Record<string, GeolocationResult> = {};

        // Check cache and collect IPs that need fetching
        const ipsToFetch: string[] = [];
        for (const ip of limitedIps) {
            const cached = geoCache.get(ip);
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                results[ip] = cached.data;
            } else {
                ipsToFetch.push(ip);
            }
        }

        // Fetch uncached IPs (with small delay to respect rate limits)
        for (const ip of ipsToFetch) {
            try {
                const response = await fetch(`${IP_API_BASE}/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,isp,org,as,query`);
                if (response.ok) {
                    const data: GeolocationResult = await response.json();
                    geoCache.set(ip, { data, timestamp: Date.now() });
                    results[ip] = data;
                }
                // Small delay to avoid rate limiting (45/min = ~1.3s between requests)
                if (ipsToFetch.indexOf(ip) < ipsToFetch.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (err) {
                console.error(`Failed to fetch geolocation for ${ip}:`, err);
            }
        }

        return NextResponse.json(
            {
                results,
                cached: limitedIps.length - ipsToFetch.length,
                fetched: ipsToFetch.length,
                total: limitedIps.length,
            },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
                },
            }
        );
    } catch (error) {
        console.error('Error in batch geolocation:', error);
        return NextResponse.json(
            { error: 'Failed to process batch geolocation' },
            { status: 500 }
        );
    }
}
