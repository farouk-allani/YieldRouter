/**
 * YieldRouter — Strategy Router Engine
 *
 * The brain of YieldRouter. Scans all yield opportunities across Initia,
 * scores them by risk-adjusted APY, and determines the optimal allocation
 * strategy for a given deposit amount.
 *
 * Core algorithm:
 *   compositeScore = (apy * apyWeight) + ((10 - riskScore) * riskWeight) + (tvlScore * tvlWeight)
 *
 * Then allocates capital proportionally to top-N strategies by composite score,
 * respecting max risk constraints and diversification settings.
 */

import {
  type YieldOpportunity,
  type StrategyScore,
  type RouteConfig,
  type ProtocolType,
  DEFAULT_ROUTE_CONFIG,
} from "./adapters";

// ─── Types ────────────────────────────────────────────────────────────

export interface Allocation {
  opportunity: YieldOpportunity;
  weight: number;           // 0-1, fraction of total deposit
  amount: string;           // allocated amount (formatted)
  expectedApy: number;      // weighted APY contribution
  expectedDailyYield: string;
}

export interface RouteResult {
  allocations: Allocation[];
  totalExpectedApy: number;
  totalExpectedDailyYield: string;
  riskScore: number;        // portfolio-level weighted risk
  riskLabel: "low" | "medium" | "high";
  rebalanceRecommended: boolean;
  timestamp: number;
  reasoning: string[];      // human-readable explanation of routing decisions
}

export interface ScanResult {
  opportunities: YieldOpportunity[];
  bestByType: Map<ProtocolType, YieldOpportunity>;
  averageApy: number;
  totalTvlUsd: number;
  scanTimestamp: number;
}

// ─── Scoring Weights ──────────────────────────────────────────────────

const WEIGHTS = {
  apy: 0.50,       // APY is the primary driver
  risk: 0.30,      // Risk adjustment is critical
  tvl: 0.10,       // TVL indicates trust/liquidity
  freshness: 0.10, // Prefer recently updated strategies
};

// ─── Mock Protocol Data (replaced by on-chain scanning in production) ──

const MOCK_OPPORTUNITIES: YieldOpportunity[] = [
  {
    id: "initia-lending-usdc",
    protocol: "Initia Lending",
    type: "lending",
    asset: { symbol: "USDC", address: "0x...", decimals: 6, chainId: "interwoven-1" },
    apy: 24.8,
    tvl: "$1.2M",
    tvlUsd: 1_200_000,
    riskScore: 3,
    riskLabel: "low",
    active: true,
    strategy: "0x1111...",
    adapter: "0xaaaa...",
    tags: ["best-apy", "low-risk"],
  },
  {
    id: "interwoven-dex-init-usdc",
    protocol: "Interwoven DEX",
    type: "lp",
    asset: { symbol: "INIT/USDC LP", address: "0x...", decimals: 18, chainId: "interwoven-1" },
    apy: 19.3,
    tvl: "$890K",
    tvlUsd: 890_000,
    riskScore: 5,
    riskLabel: "medium",
    active: true,
    strategy: "0x2222...",
    adapter: "0xbbbb...",
    tags: ["lp-fees"],
  },
  {
    id: "enshrined-lp-init-usdc",
    protocol: "Enshrined LP (Initia Native)",
    type: "enshrined-lp",
    asset: { symbol: "INIT/USDC Enshrined LP", address: "0x...", decimals: 18, chainId: "interwoven-1" },
    apy: 14.5,
    tvl: "$2.1M",
    tvlUsd: 2_100_000,
    riskScore: 2,
    riskLabel: "low",
    active: true,
    strategy: "0x3333...",
    adapter: "0xcccc...",
    tags: ["enshrined", "staking", "low-risk"],
  },
  {
    id: "yieldfarm-alpha",
    protocol: "YieldFarm Alpha",
    type: "farming",
    asset: { symbol: "INIT", address: "0x...", decimals: 18, chainId: "interwoven-1" },
    apy: 31.2,
    tvl: "$450K",
    tvlUsd: 450_000,
    riskScore: 8,
    riskLabel: "high",
    active: true,
    strategy: "0x4444...",
    adapter: "0xdddd...",
    tags: ["high-apy"],
  },
  {
    id: "stable-pool-usdc",
    protocol: "Stable Pool",
    type: "stable-lp",
    asset: { symbol: "USDC/USDT LP", address: "0x...", decimals: 18, chainId: "interwoven-1" },
    apy: 8.7,
    tvl: "$3.4M",
    tvlUsd: 3_400_000,
    riskScore: 2,
    riskLabel: "low",
    active: true,
    strategy: "0x5555...",
    adapter: "0xeeee...",
    tags: ["stable", "low-risk"],
  },
  {
    id: "leverage-vault",
    protocol: "Leverage Vault",
    type: "vault",
    asset: { symbol: "INIT", address: "0x...", decimals: 18, chainId: "interwoven-1" },
    apy: 42.1,
    tvl: "$320K",
    tvlUsd: 320_000,
    riskScore: 9,
    riskLabel: "high",
    active: true,
    strategy: "0x6666...",
    adapter: "0xffff...",
    tags: ["leveraged", "high-apy"],
  },
];

// ─── Scanner ──────────────────────────────────────────────────────────

/**
 * Scan all yield opportunities across Initia protocols.
 * In production, this queries on-chain adapters and subgraphs.
 */
export async function scanYieldOpportunities(): Promise<ScanResult> {
  // Simulate async scan delay
  await new Promise((r) => setTimeout(r, 100));

  const opportunities = MOCK_OPPORTUNITIES.filter((o) => o.active);

  const bestByType = new Map<ProtocolType, YieldOpportunity>();
  for (const opp of opportunities) {
    const existing = bestByType.get(opp.type);
    if (!existing || opp.apy > existing.apy) {
      bestByType.set(opp.type, opp);
    }
  }

  const totalTvlUsd = opportunities.reduce((sum, o) => sum + o.tvlUsd, 0);
  const averageApy = opportunities.reduce((sum, o) => sum + o.apy, 0) / opportunities.length;

  return {
    opportunities,
    bestByType,
    averageApy: Math.round(averageApy * 100) / 100,
    totalTvlUsd,
    scanTimestamp: Date.now(),
  };
}

// ─── Scoring ──────────────────────────────────────────────────────────

/**
 * Calculate composite score for a yield opportunity.
 * Higher is better.
 *
 * Components:
 * - APY score: normalized to 0-100 range (cap at 50% APY)
 * - Risk score: inverted (10 - riskScore) * 10, so lower risk = higher score
 * - TVL score: log-scaled to reward liquidity without over-weighting whales
 * - Freshness: bonus for recently updated (not applicable in mock)
 */
export function scoreOpportunity(opp: YieldOpportunity): StrategyScore {
  // APY score: 0-100, capped at 50% APY = 100
  const apyScore = Math.min((opp.apy / 50) * 100, 100);

  // Risk score: inverted, so risk 1 = 90, risk 10 = 0
  const riskScore = (10 - opp.riskScore) * 10;

  // TVL score: log-scaled, $100K = 50, $1M = 75, $10M = 100
  const tvlScore = Math.min(Math.log10(Math.max(opp.tvlUsd, 1000) / 1000) * 33.3, 100);

  // Freshness: neutral for now (would use last update timestamp)
  const freshnessScore = 50;

  const compositeScore =
    apyScore * WEIGHTS.apy +
    riskScore * WEIGHTS.risk +
    tvlScore * WEIGHTS.tvl +
    freshnessScore * WEIGHTS.freshness;

  return {
    opportunity: opp,
    compositeScore: Math.round(compositeScore * 100) / 100,
    rank: 0, // set during ranking
  };
}

/**
 * Score and rank all opportunities.
 */
export function rankOpportunities(opportunities: YieldOpportunity[]): StrategyScore[] {
  const scored = opportunities.map(scoreOpportunity);
  scored.sort((a, b) => b.compositeScore - a.compositeScore);
  return scored.map((s, i) => ({ ...s, rank: i + 1 }));
}

// ─── Router ───────────────────────────────────────────────────────────

/**
 * Route a deposit across the best yield strategies.
 *
 * Algorithm:
 * 1. Scan all opportunities
 * 2. Filter by max risk score
 * 3. Score and rank remaining
 * 4. Select top-N for diversification
 * 5. Allocate proportionally to composite scores
 * 6. Generate human-readable reasoning
 */
export async function routeDeposit(
  depositAmount: number,
  config: RouteConfig = DEFAULT_ROUTE_CONFIG
): Promise<RouteResult> {
  const reasoning: string[] = [];

  // Step 1: Scan
  const scan = await scanYieldOpportunities();
  reasoning.push(`Scanned ${scan.opportunities.length} active yield opportunities across Initia`);

  // Step 2: Filter by risk
  const filtered = scan.opportunities.filter((opp) => {
    if (opp.riskScore > config.maxRiskScore) {
      reasoning.push(
        `Filtered out ${opp.protocol} (${opp.apy}% APY) — risk score ${opp.riskScore} exceeds max ${config.maxRiskScore}`
      );
      return false;
    }
    if (opp.apy < config.minApy) {
      reasoning.push(
        `Filtered out ${opp.protocol} — APY ${opp.apy}% below minimum ${config.minApy}%`
      );
      return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    return {
      allocations: [],
      totalExpectedApy: 0,
      totalExpectedDailyYield: "$0.00",
      riskScore: 0,
      riskLabel: "low",
      rebalanceRecommended: false,
      timestamp: Date.now(),
      reasoning: ["No opportunities match the current risk/APY constraints"],
    };
  }

  // Step 3: Score and rank
  const ranked = rankOpportunities(filtered);
  reasoning.push(
    `Top opportunity: ${ranked[0].opportunity.protocol} with composite score ${ranked[0].compositeScore}`
  );

  // Step 4: Select top-N for diversification
  const selected = ranked.slice(0, Math.min(config.diversifyCount, ranked.length));

  // Enshrined LP bonus: always include if available and not already selected
  const hasEnshrined = selected.some((s) => s.opportunity.type === "enshrined-lp");
  if (!hasEnshrined) {
    const enshrined = ranked.find((s) => s.opportunity.type === "enshrined-lp");
    if (enshrined) {
      selected.push(enshrined);
      reasoning.push(
        `Added Enshrined LP (${enshrined.opportunity.protocol}) — unique Initia-native feature with dual yield`
      );
    }
  }

  // Step 5: Allocate proportionally to composite scores
  const totalScore = selected.reduce((sum, s) => sum + s.compositeScore, 0);

  const allocations: Allocation[] = selected.map((s) => {
    const weight = s.compositeScore / totalScore;
    const amount = depositAmount * weight;
    const expectedApy = s.opportunity.apy * weight;
    const expectedDailyYield = (amount * s.opportunity.apy) / 100 / 365;

    return {
      opportunity: s.opportunity,
      weight: Math.round(weight * 10000) / 10000,
      amount: amount.toFixed(2),
      expectedApy: Math.round(expectedApy * 100) / 100,
      expectedDailyYield: `$${expectedDailyYield.toFixed(4)}`,
    };
  });

  // Step 6: Calculate portfolio metrics
  const totalExpectedApy = allocations.reduce((sum, a) => sum + a.expectedApy, 0);
  const totalDailyYield = (depositAmount * totalExpectedApy) / 100 / 365;
  const weightedRisk =
    allocations.reduce((sum, a) => sum + a.opportunity.riskScore * a.weight, 0) /
    allocations.reduce((sum, a) => sum + a.weight, 0);

  const riskLabel: "low" | "medium" | "high" =
    weightedRisk <= 3 ? "low" : weightedRisk <= 6 ? "medium" : "high";

  // Allocation reasoning
  for (const alloc of allocations) {
    reasoning.push(
      `${(alloc.weight * 100).toFixed(1)}% → ${alloc.opportunity.protocol} (${alloc.opportunity.apy}% APY, risk ${alloc.opportunity.riskScore}/10)`
    );
  }

  reasoning.push(
    `Portfolio: ${totalExpectedApy.toFixed(1)}% combined APY, ${riskLabel} risk, $${totalDailyYield.toFixed(2)}/day`
  );

  return {
    allocations,
    totalExpectedApy: Math.round(totalExpectedApy * 100) / 100,
    totalExpectedDailyYield: `$${totalDailyYield.toFixed(2)}`,
    riskScore: Math.round(weightedRisk * 10) / 10,
    riskLabel,
    rebalanceRecommended: false,
    timestamp: Date.now(),
    reasoning,
  };
}

// ─── Rebalance Detection ──────────────────────────────────────────────

/**
 * Check if a rebalance is recommended based on APY drift.
 * Returns true if any current allocation is > threshold away from best available.
 */
export async function checkRebalance(
  currentAllocations: Allocation[],
  config: RouteConfig = DEFAULT_ROUTE_CONFIG
): Promise<{ recommended: boolean; reason: string; suggestedChanges: string[] }> {
  const scan = await scanYieldOpportunities();
  const suggestedChanges: string[] = [];
  let maxDrift = 0;

  for (const alloc of currentAllocations) {
    const current = alloc.opportunity;
    const bestOfType = scan.bestByType.get(current.type);

    if (bestOfType && bestOfType.id !== current.id) {
      const drift = bestOfType.apy - current.apy;
      maxDrift = Math.max(maxDrift, drift);

      if (drift * 100 >= config.rebalanceThreshold) {
        suggestedChanges.push(
          `Move ${(alloc.weight * 100).toFixed(1)}% from ${current.protocol} (${current.apy}%) to ${bestOfType.protocol} (${bestOfType.apy}%) — +${drift.toFixed(1)}% APY`
        );
      }
    }
  }

  return {
    recommended: suggestedChanges.length > 0,
    reason: suggestedChanges.length > 0
      ? `Found ${suggestedChanges.length} rebalance opportunities with up to +${maxDrift.toFixed(1)}% APY improvement`
      : "Current allocations are optimal",
    suggestedChanges,
  };
}

// ─── Revenue Projections ──────────────────────────────────────────────

/**
 * Calculate projected earnings across all 4 revenue streams.
 */
export function projectRevenue(
  depositAmount: number,
  route: RouteResult
): {
  vaultYield: { apy: number; daily: number; monthly: number; yearly: number };
  staking: { apy: number; daily: number; monthly: number; yearly: number };
  lpFees: { apy: number; daily: number; monthly: number; yearly: number };
  revenueShare: { apy: number; daily: number; monthly: number; yearly: number };
  total: { apy: number; daily: number; monthly: number; yearly: number };
} {
  // Split the total APY across the 4 streams based on allocation mix
  // In production, each adapter reports its stream breakdown
  const streamRatios = {
    vaultYield: 0.45,    // ~45% from lending/farming yield
    staking: 0.25,       // ~25% from enshrined staking rewards
    lpFees: 0.18,        // ~18% from LP trading fees
    revenueShare: 0.12,  // ~12% from appchain tx fee share
  };

  const calc = (ratio: number) => {
    const apy = route.totalExpectedApy * ratio;
    const daily = (depositAmount * apy) / 100 / 365;
    return {
      apy: Math.round(apy * 100) / 100,
      daily: Math.round(daily * 100) / 100,
      monthly: Math.round(daily * 30 * 100) / 100,
      yearly: Math.round((depositAmount * apy) / 100 * 100) / 100,
    };
  };

  return {
    vaultYield: calc(streamRatios.vaultYield),
    staking: calc(streamRatios.staking),
    lpFees: calc(streamRatios.lpFees),
    revenueShare: calc(streamRatios.revenueShare),
    total: {
      apy: route.totalExpectedApy,
      daily: Math.round((depositAmount * route.totalExpectedApy) / 100 / 365 * 100) / 100,
      monthly: Math.round((depositAmount * route.totalExpectedApy) / 100 / 12 * 100) / 100,
      yearly: Math.round((depositAmount * route.totalExpectedApy) / 100 * 100) / 100,
    },
  };
}
