
import { NextResponse } from 'next/server';
import { getClusterNodes } from '@/server/api/pnodes';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('[CRON] Starting pNode cache update...');
        // getClusterNodes has built-in caching logic.
        // However, we want to FORCE an update if this is a cron job?
        // Or just relying on its staleness check is enough?
        // If we call getClusterNodes(), it checks if stale.
        // If we want to forcably update even if not stale (unlikely for 5 min cron),
        // we might need a flag. But for now, relying on the 5min check is fine.
        // Actually, if we want to ensure it updates, we might want to bypass the check?
        // But getClusterNodes wraps the fetch.
        // Let's just call it. If it's stale (likely if cron runs every 5m), it updates.

        const nodes = await getClusterNodes();

        return NextResponse.json({ success: true, count: nodes.length, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('[CRON] Update failed:', error);
        return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
    }
}
