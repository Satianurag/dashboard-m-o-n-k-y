import { NextResponse } from 'next/server';
import { getClusterNodes } from '@/server/api/pnodes';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const nodes = await getClusterNodes();
        return NextResponse.json(nodes);
    } catch (error) {
        console.error('Error in /api/pnodes:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
