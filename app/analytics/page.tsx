
import { getClusterNodes } from "@/server/api/pnodes";
import { getNetworkStats, getPerformanceHistory } from "@/server/api/network";
import AnalyticsPage from "./analytics-client";

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

export default async function Page() {
    // Fetch data on the server
    const [nodes, stats, history] = await Promise.all([
        getClusterNodes(),
        getNetworkStats(),
        getPerformanceHistory('24h')
    ]);

    return (
        <AnalyticsPage
            initialNodes={nodes}
            initialStats={stats}
            initialHistory={history}
        />
    );
}
