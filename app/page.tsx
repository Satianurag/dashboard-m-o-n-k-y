
import { getClusterNodes, getNetworkStats } from "@/lib/pnode-api";
import DashboardOverview from "./dashboard-client";

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

export default async function Page() {
    // Fetch data on the server
    // This will hit the Supabase cache we created
    const [nodes, stats] = await Promise.all([
        getClusterNodes(),
        getNetworkStats()
    ]);

    return <DashboardOverview initialNodes={nodes} initialStats={stats} />;
}
