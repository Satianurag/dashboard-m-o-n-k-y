import { PrpcClient } from 'xandeum-prpc';

// Use a known public pNode IP or fallback to a default
// 192.190.136.36 is one of the pNodes known to have an open RPC port from earlier discussions
const DEFAULT_RPC_IP = '192.190.136.36';

// Global client instance
let prpcClient: PrpcClient | null = null;

export function getPrpcClient(ip?: string): PrpcClient {
    if (ip) {
        return new PrpcClient(ip);
    }

    if (!prpcClient) {
        // Use random seed IP from the library defaults if available, otherwise fallback
        const seedIps = PrpcClient.defaultSeedIps && PrpcClient.defaultSeedIps.length > 0
            ? PrpcClient.defaultSeedIps
            : [DEFAULT_RPC_IP];

        const randomIp = seedIps[Math.floor(Math.random() * seedIps.length)];
        console.log(`Initializing pRPC client with node: ${randomIp}`);
        prpcClient = new PrpcClient(randomIp);
    }
    return prpcClient;
}

// Helper to create a new client if we need to query a specific IP
export function createPrpcClient(ip: string): PrpcClient {
    return new PrpcClient(ip);
}
