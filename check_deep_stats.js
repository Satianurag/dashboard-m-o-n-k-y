
const { PrpcClient } = require('xandeum-prpc');

async function checkDeepStats() {
    // Try multiple seed IPs to ensure we get a good comprehensive response
    const seedIps = PrpcClient.defaultSeedIps || ['192.190.136.36'];
    const ip = seedIps[0];
    console.log(`Connecting to ${ip}...`);

    const client = new PrpcClient(ip);

    try {
        console.log('\n--- getPodsWithStats() Raw Dump (First 2 Pods) ---');
        const podsResponse = await client.getPodsWithStats();

        if (podsResponse.pods && podsResponse.pods.length > 0) {
            // Log ALL keys, strictly raw
            console.dir(podsResponse.pods[0], { depth: null, colors: false });

            // If there's a second one, check it too just in case
            if (podsResponse.pods[1]) {
                console.log('--- Second Pod ---');
                console.dir(podsResponse.pods[1], { depth: null, colors: false });
            }

            // Pick a pubkey and try findPNode
            const targetPubkey = podsResponse.pods[0].pubkey;
            console.log(`\n--- Calling PrpcClient.findPNode('${targetPubkey}') ---`);
            try {
                const foundNode = await PrpcClient.findPNode(targetPubkey, {
                    addSeeds: [ip] // Use the known working IP as a seed
                });
                console.dir(foundNode, { depth: null, colors: false });
            } catch (findErr) {
                console.error('findPNode failed:', findErr.message);
            }

        } else {
            console.log('No pods returned.');
        }

    } catch (err) {
        console.error('getPodsWithStats failed:', err.message);
    }
}

checkDeepStats();
