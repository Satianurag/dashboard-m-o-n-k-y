import { NextResponse } from 'next/server';

// Proxy for Pod Credits API to avoid CORS issues
const POD_CREDITS_API = 'https://podcredits.xandeum.network/api/pods-credits';

export async function GET() {
    try {
        const response = await fetch(POD_CREDITS_API, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            // Cache for 60 seconds on the server
            next: { revalidate: 60 },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Pod Credits API returned ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
            },
        });
    } catch (error) {
        console.error('Error fetching pod credits:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pod credits' },
            { status: 500 }
        );
    }
}
