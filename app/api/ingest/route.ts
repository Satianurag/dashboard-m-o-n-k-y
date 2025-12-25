
import { NextResponse } from 'next/server';
import { ingestNodeData } from '@/server/api/pnodes';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await ingestNodeData();
        return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
