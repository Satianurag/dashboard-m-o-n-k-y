import { PrpcClient } from 'xandeum-prpc';

// Use a known public pNode IP or fallback to a default
// 192.190.136.36 is one of the pNodes known to have an open RPC port from earlier discussions
const DEFAULT_RPC_IP = '192.190.136.36';

// Global client instance
let prpcClient: PrpcClient | null = null;

export function getPrpcClient(ip: string = DEFAULT_RPC_IP): PrpcClient {
    if (!prpcClient) {
        prpcClient = new PrpcClient(ip);
    }
    return prpcClient;
}

// Helper to create a new client if we need to query a specific IP
export function createPrpcClient(ip: string): PrpcClient {
    return new PrpcClient(ip);
}
