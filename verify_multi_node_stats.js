
const { PrpcClient } = require('xandeum-prpc');

async function testMultiNodeStats() {
    // 1. Get List
    console.log('Fetching cluster list...');
    const seedClient = new PrpcClient('192.190.136.36'); // Use known working
    let rpcPods = [];
    try {
        const res = await seedClient.getPodsWithStats();
        rpcPods = res.pods || [];
        console.log(`Found ${rpcPods.length} pods.`);
    } catch (e) {
        console.error("Failed to get list:", e.message);
        return;
    }

    if (rpcPods.length === 0) return;

    // 2. Pick 3 random pods to test connection
    const samples = rpcPods.sort(() => 0.5 - Math.random()).slice(0, 3);

    console.log('\n--- Testing Connections to Samples ---');

    for (const pod of samples) {
        // Pod.address is usually "IP:PORT" (e.g., 9001). 
        // But RPC port is defined in `rpc_port` (e.g. 6000).
        // PrpcClient needs the RPC port.

        let ip = pod.address ? pod.address.split(':')[0] : null;
        if (!ip) continue;

        // If the library expects "IP" and adds default port, or if we need to pass "IP:PORT"
        // Let's try passing IP only first, assuming default port 8899? 
        // OR does it need the specific `rpc_port` from the pod object?
        // Reading library docs or source would be best, but let's try constructing with IP

        console.log(`\nTarget: ${pod.pubkey.substring(0, 8)} | IP: ${ip} | RPC Port: ${pod.rpc_port}`);

        try {
            // Note: If the client library doesn't let us specify port easily in constructor, 
            // we might have to rely on it using the correct default or assume these nodes use standard port.
            // If `rpc_port` is different, we might fail.
            // Let's try "IP" first.

            const client = new PrpcClient(ip);

            // Set a short timeout if possible to avoid hanging forever
            // The library options? constructor(ip, { timeout: ms })

            const stats = await client.getStats();
            console.log(`✅ Success! CPU: ${(stats.cpu_percent * 100).toFixed(2)}% | RAM: ${(stats.ram_used / 1024 / 1024).toFixed(0)}MB`);
        } catch (err) {
            console.log(`❌ Failed: ${err.message}`);
        }
    }
}

testMultiNodeStats();
