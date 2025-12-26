import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '24h';

        // Determine how many records to fetch based on period
        let limit = 24;
        if (period === '7d') limit = 168; // 24 * 7
        if (period === '30d') limit = 720; // 24 * 30

        // Fetch historical network stats
        const { data, error } = await supabase
            .from('network_stats')
            .select('network_health, updated_at')
            .order('updated_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            return NextResponse.json({
                current: 0,
                previous: 0,
                trend: 0,
                trendPercent: 0,
                allTimeHigh: 0,
                allTimeLow: 0,
                history: []
            });
        }

        // Process the data
        const healthScores = data.map(d => d.network_health || 0);
        const current = healthScores[0];
        const previous = healthScores.length > 1 ? healthScores[1] : current;
        const trend = current - previous;
        const trendPercent = previous > 0 ? ((current - previous) / previous) * 100 : 0;

        const allTimeHigh = Math.max(...healthScores);
        const allTimeLow = Math.min(...healthScores.filter(h => h > 0)); // Exclude zeros

        // Format history for charting
        const history = data.reverse().map(d => ({
            timestamp: d.updated_at,
            value: d.network_health || 0
        }));

        return NextResponse.json({
            current,
            previous,
            trend,
            trendPercent,
            allTimeHigh: allTimeHigh || current,
            allTimeLow: allTimeLow || current,
            history
        });
    } catch (error) {
        console.error('Health trends error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
