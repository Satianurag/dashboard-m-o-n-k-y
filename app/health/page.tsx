
import HealthClient from "./health-client";
import { getHealthScoreBreakdown, getPeerRankings } from "@/server/api/decentralization";
import { getNetworkStats } from "@/server/api/network";
import { getClusterNodes } from "@/server/api/pnodes";

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

export default async function Page() {
  // Prefetch data on the server for instant page load
  // The client component will use React Query with this initialData
  return <HealthClient />;
}
