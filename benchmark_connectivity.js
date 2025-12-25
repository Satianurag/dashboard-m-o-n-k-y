
const { PrpcClient } = require('xandeum-prpc');

async function checkConnectivityRate() {
    console.log('Fetching cluster list...');
    // Seed list from the library or use the known working one
    const seedClient = new PrpcClient('173.212.220.65');
    let rpcPods = [];
    try {
        const res = await seedClient.getPodsWithStats();
        rpcPods = res.pods || [];
    } catch (e) {
        console.error("Failed to get list:", e.message);
        return;
    }

    console.log(`Found ${rpcPods.length} pods. Testing top 20...`);
    const subset = rpcPods.slice(0, 20);

    let success = 0;
    let failed = 0;

    for (const pod of subset) {
        const ip = pod.address ? pod.address.split(':')[0] : null;
        if (!ip) continue;

        try {
            const client = new PrpcClient(ip);
            // We need to see if we can get stats
            // Add a timeout promise to not wait too long
            const statsPromise = client.getStats();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));

            await Promise.race([statsPromise, timeoutPromise]);
            success++;
            process.stdout.write('✅');
        } catch (err) {
            failed++;
            process.stdout.write('❌');
        }
    }

    console.log(`\n\nResults: ${success} Success, ${failed} Failed.`);
    console.log(`Success Rate: ${((success / (success + failed)) * 100).toFixed(1)}%`);
}

checkConnectivityRate();
