/**
 * YieldRouter — Interwoven Bridge Integration
 *
 * Routes assets from external chains into Initia via the Interwoven Bridge,
 * then deposits into the highest-yielding vault strategy.
 *
 * Flow: External Chain → Interwoven Bridge → Initia → VaultStrategy.deposit()
 */

// ─── Types ────────────────────────────────────────────────────────────

export interface BridgeRoute {
  id: string;
  sourceChain: ChainInfo;
  destChain: ChainInfo;
  sourceAsset: AssetInfo;
  destAsset: AssetInfo;
  estimatedTime: string;        // e.g. "~2 min"
  bridgeFee: string;            // formatted fee
  bridgeFeePercent: number;     // e.g. 0.1 = 0.1%
  minAmount: string;
  maxAmount: string;
  path: string[];               // chain hops
}

export interface ChainInfo {
  chainId: string;
  name: string;
  logoUrl: string;
  type: "l1" | "l2" | "rollup";
}

export interface AssetInfo {
  denom: string;
  symbol: string;
  decimals: number;
  logoUrl?: string;
}

export interface BridgeDepositParams {
  sourceChainId: string;
  amount: string;
  asset: AssetInfo;
  recipientAddress: string;
  slippageTolerance?: number;   // default 0.5%
}

export interface BridgeDepositResult {
  bridgeTxHash: string;
  depositTxHash?: string;       // set after vault deposit confirms
  status: "bridging" | "bridged" | "deposited" | "failed";
  estimatedArrival: number;     // unix timestamp
}

// ─── Supported Chains ─────────────────────────────────────────────────

export const SUPPORTED_SOURCE_CHAINS: ChainInfo[] = [
  {
    chainId: "noble-1",
    name: "Noble",
    logoUrl: "/chains/noble.svg",
    type: "l1",
  },
  {
    chainId: "ethereum-1",
    name: "Ethereum",
    logoUrl: "/chains/ethereum.svg",
    type: "l1",
  },
  {
    chainId: "osmosis-1",
    name: "Osmosis",
    logoUrl: "/chains/osmosis.svg",
    type: "l1",
  },
  {
    chainId: "cosmoshub-4",
    name: "Cosmos Hub",
    logoUrl: "/chains/cosmos.svg",
    type: "l1",
  },
];

// ─── Bridge Configuration ─────────────────────────────────────────────

export const BRIDGE_CONFIG = {
  defaultSlippage: 0.5,
  maxSlippage: 5.0,
  minDepositUsd: 1,
  defaultTimeout: 300_000, // 5 minutes
};

/**
 * Initiate a bridge + deposit in one flow.
 *
 * In production, this calls:
 * 1. InterwovenKit.openBridge() for the bridge step
 * 2. VaultStrategy.deposit() for the vault deposit
 *
 * The user sees a single unified flow in the InterwovenKit UI.
 */
export async function bridgeAndDeposit(
  params: BridgeDepositParams
): Promise<BridgeDepositResult> {
  // In production:
  // 1. Use InterwovenKit.openBridge({ denoms: [params.asset.denom] })
  // 2. Wait for bridge confirmation
  // 3. Call VaultStrategy.deposit() with bridged assets

  console.log("Bridge + deposit initiated:", params);

  return {
    bridgeTxHash: "",
    status: "bridging",
    estimatedArrival: Date.now() + 120_000,
  };
}

/**
 * Get available bridge routes for a given source chain and asset
 */
export async function getBridgeRoutes(
  _sourceChainId: string,
  _assetDenom: string
): Promise<BridgeRoute[]> {
  // In production, this queries the Interwoven Bridge API
  return [];
}
