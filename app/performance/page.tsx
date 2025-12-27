
import { getClusterNodes } from "@/server/api/pnodes";
import { getPerformanceHistory } from "@/server/api/network";
import PerformanceClient from "./performance-client";

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

export default async function Page() {
  // Fetch data on the server - this hits the Supabase cache
  const [nodes, history] = await Promise.all([
    getClusterNodes(),
    getPerformanceHistory('24h'),
  ]);

  return <PerformanceClient initialNodes={nodes} initialHistory={history} />;
}
