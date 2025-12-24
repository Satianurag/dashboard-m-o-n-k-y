
import { getClusterNodes } from "@/lib/pnode-api";
import PNodesPage from "./pnodes-client";

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

export default async function Page() {
    // Fetch data on the server
    const nodes = await getClusterNodes();

    return <PNodesPage initialNodes={nodes} />;
}
