
const { PrpcClient } = require('xandeum-prpc');

async function checkStats() {
    const seedIps = PrpcClient.defaultSeedIps || ['192.190.136.36'];
    const ip = seedIps[0];
    console.log(`Checking stats from ${ip}...`);

    const client = new PrpcClient(ip);

    try {
        console.log('--- Calling getStats() ---');
        const stats = await client.getStats();
        console.log(JSON.stringify(stats, null, 2));
    } catch (err) {
        console.error('getStats failed:', err.message);
    }

    try {
        console.log('\n--- Calling getPodsWithStats() [Sample] ---');
        const pods = await client.getPodsWithStats();
        if (pods.pods && pods.pods.length > 0) {
            console.log(JSON.stringify(pods.pods[0], null, 2));
        } else {
            console.log('No pods found');
        }
    } catch (err) {
        console.error('getPodsWithStats failed:', err.message);
    }
}

checkStats();
