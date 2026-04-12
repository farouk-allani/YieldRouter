/**
 * YieldRouter — Contract Addresses & Configuration
 *
 * Deployed on Initia EVM Testnet (evm-1)
 * Update these addresses after running: forge script script/DeployTestnet.s.sol
 */

export const CHAIN_CONFIG = {
  chainId: 2124225178762456,
  chainName: "Initia EVM Testnet",
  rpcUrl: "https://jsonrpc-evm-1.anvil.asia-southeast.initia.xyz",
  wsUrl: "wss://jsonrpc-ws-evm-1.anvil.asia-southeast.initia.xyz",
  explorerUrl: "https://scan.testnet.initia.xyz/evm-1",
  nativeCurrency: { name: "INIT", symbol: "INIT", decimals: 18 },
} as const;

// ── Deployed Contract Addresses ──────────────────────────────────────────────
// Deployed on Initia EVM Testnet (evm-1)
export const CONTRACTS = {
  // Mock tokens (testnet only)
  iusd: "0x67Fa823d823EdB3fE9bD6708F662AEfCD6147fbA" as `0x${string}`,
  lpToken: "0xcA4E805B2aA9Cd07C0c94a5F3EE0D421fD1ED60E" as `0x${string}`,
  rewardToken: "0xa5BecA712F3dc2b3135400b99F4682599bbFe93c" as `0x${string}`,

  // Core protocol
  vaultStrategy: "0x043af4a0Be5DDF11C4d32874892957827Bd72999" as `0x${string}`,
  revenueDistributor: "0x092d5870Caa79f26bC38C2cf8B37F13009df9ca5" as `0x${string}`,
  enshrinedStaker: "0x299eA4c76A76d4426461721cF60514404d3e1CaA" as `0x${string}`,
  strategyRouter: "0x69edD287883BF27d586Deee87e097C4954711Ce9" as `0x${string}`,
} as const;

// ── ABI Snippets (for frontend read calls) ───────────────────────────────────

export const VAULT_ABI = [
  "function totalAssets() view returns (uint256)",
  "function totalShares() view returns (uint256)",
  "function getPositionValue(address) view returns (uint256)",
  "function deposit(uint256) returns (uint256)",
  "function withdraw(uint256)",
  "function convertToShares(uint256) view returns (uint256)",
  "function convertToAssets(uint256) view returns (uint256)",
] as const;

export const ROUTER_ABI = [
  "function depositAndRoute(uint256) returns (tuple(uint256 totalDeposited, uint256 allocationCount, uint256 expectedApyBps))",
  "function withdraw(uint256) returns (uint256)",
  "function previewRoute(uint256) view returns (tuple(uint256 strategyId, uint256 amount, uint256 weightBps, uint256 compositeScore)[], uint256)",
  "function getPortfolio(address) view returns (tuple(uint256 totalValue, uint256 strategyCount, uint256 weightedApyBps))",
  "function getUserAllocations(address) view returns (tuple(uint256 strategyId, uint256 amount, uint256 weightBps, uint256 compositeScore)[])",
  "function userTotalDeposited(address) view returns (uint256)",
  "function totalRouted() view returns (uint256)",
  "function getActiveStrategies() view returns (tuple(uint256 id, address adapter, string name, uint256 apyBps, uint8 protocolType, uint8 riskScore, bool active, uint256 totalDeposited, uint256 lastUpdated)[])",
] as const;

export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
] as const;
