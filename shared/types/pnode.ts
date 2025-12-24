export interface PNode {
  id: string;
  pubkey: string;
  ip: string;
  port: number;
  version: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  lastSeen: string;
  location?: {
    country: string;
    countryCode: string;
    city: string;
    lat: number;
    lng: number;
    datacenter?: string;
    asn?: string;
  };
  metrics: {
    cpuPercent: number;
    memoryPercent: number;
    storageUsedGB: number;
    storageCapacityGB: number;
    responseTimeMs: number;
  };
  performance: {
    score: number;
    tier: 'excellent' | 'good' | 'fair' | 'poor';
  };
  gossip: {
    peersConnected: number;
    messagesReceived: number;
    messagesSent: number;
  };
  staking?: {
    commission: number;
    delegatedStake: number;
    activatedStake: number;
    apy: number;
    lastVote: number;
    rootSlot: number;
  };
  history?: {
    uptimeHistory: number[];
    latencyHistory: number[];
    scoreHistory: number[];
  };
  credits?: number; // Pod credits score (reliability metric from Pod Credits API)
  creditsRank?: number; // Ranking by credits among all pNodes
}

export interface NetworkStats {
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  degradedNodes: number;
  totalStorageCapacityTB: number;
  totalStorageUsedTB: number;
  averageUptime: number;
  averageResponseTime: number;
  networkHealth: number;
  gossipMessages24h: number;
  lastUpdated: string;
}

export interface PodInfo {
  podId: string;
  pnodeId: string;
  sizeBytes: number;
  redundancy: number;
  createdAt: string;
  lastAccessed: string;
  status: 'active' | 'syncing' | 'archived';
}

export interface NetworkEvent {
  id: string;
  type: 'node_joined' | 'node_left' | 'node_degraded' | 'node_recovered' | 'storage_alert' | 'network_update';
  title: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  nodeId?: string;
}

export interface PerformanceHistory {
  timestamp: string;
  avgResponseTime: number;
  totalNodes: number;
  onlineNodes: number;
  storageUsedTB: number;
  gossipMessages: number;
}

export interface GossipHealth {
  totalPeers: number;
  avgPeersPerNode: number;
  messageRate: number;
  networkLatency: number;
  partitions: number;
  healthScore: number;
}

export interface StorageDistribution {
  region: string;
  nodeCount: number;
  storageCapacityTB: number;
  storageUsedTB: number;
  utilizationPercent: number;
}

export interface EpochInfo {
  currentEpoch: number;
  epochProgress: number;
  epochStartTime: string;
  epochEndTime: string;
  slotsCompleted: number;
  totalSlots: number;
  blocksProduced: number;
  skipRate: number;
}

export interface EpochHistory {
  epoch: number;
  startTime: string;
  endTime: string;
  blocksProduced: number;
  skipRate: number;
  activeNodes: number;
  totalRewards: number;
}

export interface StakingStats {
  totalStaked: number;
  totalDelegated: number;
  averageCommission: number;
  averageAPY: number;
  topValidators: {
    pubkey: string;
    stake: number;
    apy: number;
    commission: number;
  }[];
}

export interface DecentralizationMetrics {
  nakamotoCoefficient: number;
  giniCoefficient: number;
  countryDistribution: { country: string; count: number; percentage: number }[];
  datacenterDistribution: { datacenter: string; count: number; percentage: number }[];
  asnDistribution: { asn: string; provider: string; count: number; percentage: number }[];
}

export interface VersionInfo {
  version: string;
  count: number;
  percentage: number;
  isLatest: boolean;
  releaseDate?: string;
}

export interface HealthScoreBreakdown {
  overall: number;
  factors: {
    name: string;
    weight: number;
    score: number;
    weightedScore: number;
    description: string;
  }[];
}

export interface SearchFilters {
  query?: string;
  status?: ('online' | 'offline' | 'degraded')[];
  countries?: string[];
  cities?: string[];
  performanceTiers?: ('excellent' | 'good' | 'fair' | 'poor')[];
  minScore?: number;
  maxScore?: number;
  minLatency?: number;
  maxLatency?: number;
  minStorage?: number;
  maxStorage?: number;
  versions?: string[];
  minUptime?: number;
}

export interface TrendData {
  period: '24h' | '7d' | '30d';
  dataPoints: {
    timestamp: string;
    value: number;
  }[];
  change: number;
  changePercent: number;
}

export interface XScore {
  overall: number;
  storageThroughput: number;
  dataAvailabilityLatency: number;
  uptime: number;
  gossipHealth: number;
  peerConnectivity: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface GossipEvent {
  id: string;
  type: 'discovery' | 'message' | 'sync' | 'heartbeat' | 'data_transfer';
  sourceNodeId: string;
  targetNodeId: string;
  sourceLocation?: { lat: number; lng: number };
  targetLocation?: { lat: number; lng: number };
  timestamp: string;
  metadata?: {
    bytesTransferred?: number;
    latencyMs?: number;
    protocol?: string;
  };
}

export interface AlertConfig {
  id: string;
  name: string;
  enabled: boolean;
  type: 'uptime' | 'latency' | 'score' | 'storage' | 'commission' | 'gossip';
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  channels: AlertChannel[];
  nodeIds?: string[];
  createdAt: string;
  lastTriggered?: string;
}

export interface AlertChannel {
  type: 'in_app' | 'webhook' | 'discord' | 'telegram' | 'slack';
  enabled: boolean;
  config?: {
    webhookUrl?: string;
    chatId?: string;
    channelId?: string;
  };
}

export interface Alert {
  id: string;
  configId: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  nodeId?: string;
  nodePubkey?: string;
  value: number;
  threshold: number;
  timestamp: string;
  acknowledged: boolean;
}

export interface ExabyteProjection {
  currentCapacityTB: number;
  projectedCapacityTB: number;
  nodeCount: number;
  projectedNodeCount: number;
  timeframe: '1m' | '3m' | '6m' | '1y' | '2y';
  growthRate: number;
  milestones: {
    capacity: number;
    estimatedDate: string;
    nodeCountRequired: number;
  }[];
}

export interface CommissionHistory {
  nodeId: string;
  history: {
    timestamp: string;
    commission: number;
    change: number;
  }[];
}

export interface SlashingEvent {
  id: string;
  nodeId: string;
  nodePubkey: string;
  epoch: number;
  timestamp: string;
  type: 'offline' | 'double_sign' | 'invalid_block';
  amount: number;
  details: string;
}

export interface PeerRanking {
  nodeId: string;
  nodePubkey: string;
  rank: number;
  totalNodes: number;
  percentile: number;
  xScore: number;
  trend: 'up' | 'down' | 'stable';
  trendChange: number;
}

export interface SuperminorityInfo {
  count: number;
  threshold: number;
  nodes: {
    pubkey: string;
    stake: number;
    percentage: number;
  }[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CensorshipResistanceScore {
  overall: number;
  factors: {
    geographicDiversity: number;
    asnDiversity: number;
    jurisdictionDiversity: number;
    clientDiversity: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}
