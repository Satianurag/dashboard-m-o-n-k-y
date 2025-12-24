export interface ClusterNode {
    pubkey: string;
    gossip?: string;
    rpc?: string;
    tpu?: string;
    version?: string;
    featureSet?: number;
    shredVersion?: number;
}

export interface VoteAccount {
    votePubkey: string;
    nodePubkey: string;
    activatedStake: number;
    epochCredits: [number, number, number][];
    commission: number;
    lastVote: number;
    rootSlot: number;
}

export interface VoteAccountsResponse {
    current: VoteAccount[];
    delinquent: VoteAccount[];
}

export interface BlockProductionResponse {
    byIdentity: Record<string, [number, number]>;
    range: { firstSlot: number; lastSlot: number };
}

export interface PerformanceSample {
    slot: number;
    numTransactions: number;
    numSlots: number;
    samplePeriodSecs: number;
}

export interface GeolocationData {
    status: 'success' | 'fail';
    country?: string;
    countryCode?: string;
    city?: string;
    lat?: number;
    lon?: number;
    isp?: string;
    org?: string;
    as?: string;
}

export interface PodCreditsResponse {
    pods_credits: Array<{ credits: number; pod_id: string }>;
    status?: string;
}
