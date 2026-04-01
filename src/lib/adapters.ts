/**
 * YieldRouter — Protocol Adapter Interfaces
 *
 * Defines the TypeScript types for yield protocol adapters on Initia.
 * Each protocol (lending, LP, staking, vault) implements YieldAdapter
 * so the router can uniformly scan, deposit, withdraw, and harvest.
 */

// ─── Core Types ────────────────────────────────────────────────────────────

export interface YieldOpportunity {
  id: string;
  protocol: string;
  type: ProtocolType;
  asset: AssetInfo;
  apy: number;              // annual percentage yield (e.g. 24.8)
  tvl: string;              // total value locked (formatted)
  tvlUsd: number;
  riskScore: number;        // 1-10 (1 = safest)
  riskLabel: RiskLabel;
  active: boolean;
  strategy: string;         // strategy contract address
  adapter: string;          // adapter contract address
  tags: string[];           // e.g. ["best-apy", "low-risk", "enshrined"]
}

export type ProtocolType =
  | "lending"
  | "lp"
  | "staking"
  | "farming"
  | "vault"
  | "stable-lp"
  | "enshrined-lp";

export type RiskLabel = "low" | "medium" | "high";

export interface AssetInfo {
  symbol: string;
  address: string;
  decimals: number;
  chainId: string;
  logoUrl?: string;
}

// ─── Adapter Interface ─────────────────────────────────────────────────────

/**
 * Every protocol adapter implements this interface.
 * The router calls these uniformly across all protocols.
 */
export interface YieldAdapter {
  /** Unique protocol identifier */
  readonly protocolId: string;

  /** Human-readable name */
  readonly name: string;

  /** Scan for available yield opportunities */
  scan(): Promise<YieldOpportunity[]>;

  /** Get current APY for a specific opportunity */
  getApy(opportunityId: string): Promise<number>;

  /** Get TVL for a specific opportunity */
  getTvl(opportunityId: string): Promise<bigint>;

  /** Deposit assets into a yield opportunity */
  deposit(opportunityId: string, amount: bigint): Promise<AdapterTxResult>;

  /** Withdraw assets from a yield opportunity */
  withdraw(opportunityId: string, amount: bigint): Promise<AdapterTxResult>;

  /** Harvest accumulated rewards */
  harvest(opportunityId: string): Promise<AdapterTxResult>;

  /** Get pending rewards */
  getPendingRewards(opportunityId: string): Promise<bigint>;

  /** Check if adapter is healthy and reachable */
  healthCheck(): Promise<boolean>;
}

export interface AdapterTxResult {
  txHash: string;
  success: boolean;
  amount: bigint;
  error?: string;
}

// ─── Revenue Stream Types ──────────────────────────────────────────────────

export type RevenueStream = "vault-yield" | "staking" | "lp-fees" | "revenue-share";

export interface RevenueSnapshot {
  timestamp: number;
  stream: RevenueStream;
  amount: string;
  amountUsd: number;
  apyContribution: number;  // how much this stream adds to total APY
}

export interface RevenueBreakdown {
  vaultYield: RevenueSnapshot;
  staking: RevenueSnapshot;
  lpFees: RevenueSnapshot;
  revenueShare: RevenueSnapshot;
  totalApy: number;
  totalUsd: number;
}

// ─── Vault Position Types ──────────────────────────────────────────────────

export interface UserVaultPosition {
  shares: string;
  sharesValue: string;
  depositedAt: number;
  strategyId: number;
  strategyName: string;
  currentApy: number;
  revenueBreakdown: RevenueBreakdown;
}

// ─── Strategy Selection ────────────────────────────────────────────────────

export interface StrategyScore {
  opportunity: YieldOpportunity;
  compositeScore: number;   // weighted score: APY * risk-adjusted factor
  rank: number;
}

export interface RouteConfig {
  maxRiskScore: number;     // reject strategies above this risk
  minApy: number;           // minimum acceptable APY
  diversifyCount: number;   // split across N strategies
  rebalanceThreshold: number; // APY difference to trigger rebalance (bps)
}

// ─── Default Configs ───────────────────────────────────────────────────────

export const DEFAULT_ROUTE_CONFIG: RouteConfig = {
  maxRiskScore: 7,
  minApy: 2.0,
  diversifyCount: 3,
  rebalanceThreshold: 200, // 2% APY difference triggers rebalance
};

// ─── Initia-Specific Types ─────────────────────────────────────────────────

export interface EnshrinedLpPosition {
  lpToken: AssetInfo;
  validatorAddress: string;
  stakedAmount: string;
  lpFeesApy: number;
  stakingRewardsApy: number;
  combinedApy: number;
}

export interface BridgeRoute {
  sourceChain: string;
  sourceAsset: AssetInfo;
  destAsset: AssetInfo;
  estimatedTime: string;    // e.g. "~2 min"
  fee: string;
  minAmount: string;
}

export interface InitiaUsername {
  username: string;         // e.g. "farouk.init"
  address: string;
  resolved: boolean;
}
