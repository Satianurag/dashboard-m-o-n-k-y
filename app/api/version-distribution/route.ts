import { NextResponse } from 'next/server';
import { getVersionDistribution } from '@/server/api/decentralization';

export async function GET() {
    try {
        const data = await getVersionDistribution();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Version distribution error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
