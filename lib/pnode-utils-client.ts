import { PNode, GossipEvent, XScore } from '@/types/pnode';

// Moved from server/api/decentralization.ts to allow client-side usage
export function generateGossipEvents(nodes: PNode[]): GossipEvent[] {
    const events: GossipEvent[] = [];
    const onlineNodes = nodes.filter(n => n.status === 'online' && n.location);
    const eventTypes: Array<'discovery' | 'message' | 'sync' | 'heartbeat' | 'data_transfer'> = ['discovery', 'message', 'sync', 'heartbeat', 'data_transfer'];

    for (let i = 0; i < Math.min(20, onlineNodes.length); i++) {
        const sourceIdx = i % onlineNodes.length;
        const targetIdx = (i + 1) % onlineNodes.length;
        const source = onlineNodes[sourceIdx];
        const target = onlineNodes[targetIdx];

        if (source && target && source.id !== target.id) {
            events.push({
                id: `gossip_${Date.now()}_${i}`,
                type: eventTypes[i % eventTypes.length],
                sourceNodeId: source.id,
                targetNodeId: target.id,
                sourceLocation: source.location ? { lat: source.location.lat, lng: source.location.lng } : undefined,
                targetLocation: target.location ? { lat: target.location.lat, lng: target.location.lng } : undefined,
                timestamp: new Date(Date.now() - i * 1000).toISOString(),
                metadata: {
                    bytesTransferred: (source.credits || 1000) * 10,
                    latencyMs: source.metrics.responseTimeMs,
                    protocol: 'gossip/v1',
                },
            });
        }
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function calculateXScore(node: PNode): XScore {
    const storageThroughput = Math.min(100, (node.metrics.storageUsedGB / node.metrics.storageCapacityGB * 100) * 1.5);
    const dataAvailabilityLatency = Math.max(0, 100 - node.metrics.responseTimeMs * 0.5);
    const uptime = node.uptime;
    const gossipHealth = Math.min(100, node.gossip.peersConnected * 2);
    const peerConnectivity = Math.min(100, node.gossip.peersConnected * 3);

    const overall = (storageThroughput * 0.25) + (dataAvailabilityLatency * 0.25) + (uptime * 0.20) + (gossipHealth * 0.15) + (peerConnectivity * 0.15);

    return {
        overall,
        storageThroughput,
        dataAvailabilityLatency,
        uptime,
        gossipHealth,
        peerConnectivity,
        grade: getXScoreGrade(overall),
    };
}

export function getXScoreGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 95) return 'S';
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
}
