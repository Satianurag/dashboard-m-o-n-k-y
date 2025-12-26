import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const metric = searchParams.get('metric') || 'network_health';
        const period = searchParams.get('period') || '24h';

        // Determine how many records to fetch based on period
        let limit = 24;
        if (period === '7d') limit = 168;
        if (period === '30d') limit = 720;

        // Map metric name to column name
        const columnMap: Record<string, string> = {
            'network_health': 'network_health',
            'response_time': 'avg_response_time',
            'online_nodes': 'online_nodes',
            'storage_used': 'total_storage_used_tb',
            'uptime': 'avg_uptime'
        };

        const column = columnMap[metric] || 'network_health';

        // Fetch historical data
        const { data, error } = await supabase
            .from('network_stats')
            .select(`${column}, updated_at`)
            .order('updated_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        if (!data || data.length === 0) {
            return NextResponse.json([]);
        }

        // Format data for charting
        const trendData = data.reverse().map((row: any) => ({
            timestamp: row.updated_at,
            value: row[column] || 0,
            label: new Date(row.updated_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            })
        }));

        return NextResponse.json(trendData);
    } catch (error) {
        console.error('Trend data error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
