# YieldRouter

**Revenue Flywheel Yield Aggregator for Initia**

One deposit, four revenue streams. YieldRouter automatically scans every DeFi protocol on Initia and routes your assets to the highest-yielding opportunities. Vault yield, staking rewards, LP trading fees, and appchain revenue share -- all from a single deposit.

## INITIATE: The Initia Hackathon (Season 1)

**Track:** DeFi (EVM/Solidity)
**Builder:** Farouk Allani ([@farouk-allani](https://github.com/farouk-allani))
**Deadline:** April 15, 2026

### Submission Requirements
- [x] `.initia/submission.json`
- [x] `README.md`
- [x] InterwovenKit integration (real `@initia/interwovenkit-react` v2.5)
- [x] Initia-native features: Enshrined Liquidity, Auto-Sign Session, Interwoven Bridge, .init Usernames
- [ ] Demo video

## The Problem

DeFi yield is fragmented. Users need to manually research protocols, compare APYs, manage risk, and rebalance positions across multiple platforms. On most chains, you earn from a single source -- lending OR staking OR LP. You never capture the full revenue stack.

**On Initia, this problem has a unique solution.** Initia's architecture enables *four simultaneous revenue streams* from a single deposit -- something no other chain can offer.

## The Solution: The Revenue Flywheel

```
                     YOUR DEPOSIT
                         |
            +------------+------------+
            v            v            v
      +-----------+ +-----------+ +-----------+
      |  Vault    | | Enshrined | |    LP     |
      |  Yield    | | Staking   | |   Fees    |
      |  12.4%    | |   6.8%    | |   4.2%    |
      +-----+-----+ +-----+-----+ +-----+-----+
            |            |            |
            +------------+------------+
                         v
                +--------------+
                |   Revenue    |
                |   Share      |
                |    2.4%      |
                +------+-------+
                       v
               25.8% Combined APY
```

### Why 4 Streams?

| Stream | Source | Initia Feature |
|--------|--------|----------------|
| **Vault Yield** | Best lending/farming strategy | Strategy Router |
| **Staking Rewards** | LP staked with validators | Enshrined Liquidity (Initia-native) |
| **LP Trading Fees** | Automated market maker fees | DEX integration |
| **Revenue Share** | Appchain tx fees recycled | Initia revenue sharing |

**Enshrined Liquidity** is the key differentiator. On other chains, you choose between LP fees OR staking rewards. On Initia, LP positions are staked directly with validators, earning *both* simultaneously. YieldRouter automates this.

## Architecture

### Smart Contracts (Solidity 0.8.24)

```
contracts/
+-- VaultStrategy.sol        # Core vault: deposit, withdraw, share math, rebalancing
+-- RevenueDistributor.sol   # Harvests 4 revenue streams, distributes to vault
+-- EnshrinedStaker.sol      # Initia Enshrined Liquidity staking (native feature)
+-- StrategyRouter.sol       # On-chain routing engine (the "brain")
```

**VaultStrategy** -- Core vault contract. Accepts deposits, mints shares, routes to the best yield strategy, and compounds revenue from all 4 streams.

**RevenueDistributor** -- Keeper-driven harvest cycle. Calls each revenue adapter, takes a performance fee, and forwards net revenue to the vault.

**EnshrinedStaker** -- Initia's unique Enshrined Liquidity feature. LP tokens staked directly with validators for dual yield. This is *only possible on Initia*.

**StrategyRouter** -- The on-chain routing brain. Scores every strategy using a composite algorithm and allocates capital proportionally to the top-N:

```
compositeScore = (APY x 0.50) + (Risk x 0.30) + (TVL x 0.10) + (Freshness x 0.10)
```

### Frontend (Next.js 16 + TypeScript)

```
src/
+-- app/
|   +-- layout.tsx           # Root layout with InterwovenKitProvider
|   +-- page.tsx             # Landing page
|   +-- app/page.tsx         # Interactive dashboard
+-- components/
|   +-- InterwovenProvider   # Real InterwovenKit integration
|   +-- Header, Hero, HowItWorks, RevenueDashboard, StrategyAllocation,
|   +-- DepositWithdraw, Yields, Security, Roadmap, FAQ, CTA, Footer
+-- lib/
    +-- strategy-router.ts   # Client-side routing algorithm
    +-- adapters.ts          # Protocol adapter interfaces
    +-- bridge.ts            # Interwoven Bridge integration
    +-- init-username.ts     # .init username resolution
```

## Initia-Native Features

### 1. InterwovenKit Integration (Real, Not Mocked)
Full `@initia/interwovenkit-react` v2.5 integration:
- `InterwovenKitProvider` with TESTNET config
- `useInterwovenKit()` for wallet state, `openConnect`, `openWallet`, `disconnect`
- `openBridge()` and `openDeposit()` for cross-chain deposits
- `InterwovenKit` floating widget for wallet management
- `useUsernameQuery()` for .init username resolution

### 2. Auto-Sign Session UX
Real `autoSign.enable()` / `autoSign.disable()` from InterwovenKit:
- Toggle in dashboard to skip repeated wallet popups
- Faster transaction flow for routine deposits and withdrawals
- Visible session status with per-chain tracking

### 3. Enshrined Liquidity (Unique to Initia)
`EnshrinedStaker.sol` manages dual-yield positions:
- LP tokens staked directly with validators
- Earn LP trading fees AND staking rewards simultaneously
- Validator management with epoch-based reward calculation
- The routing engine always includes Enshrined LP (Initia-native bonus)

### 4. Interwoven Bridge
Cross-chain deposits from Ethereum, Noble, Osmosis, and Cosmos Hub:
- Uses InterwovenKit's `openBridge()` for the native bridge UI
- `openDeposit()` for quick deposits with specific denoms
- Supported assets: INIT, USDC

### 5. Initia Usernames (.init)
- `.init` username display throughout the app
- `validateUsername()` for format validation
- `formatAddress()` prefers username over raw address
- `parseRecipient()` identifies username vs address input

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 |
| Smart Contracts | Solidity 0.8.24 (EVM, Foundry) |
| Testing | Foundry (forge) -- 60+ unit tests |
| Wallet | InterwovenKit React v2.5 |
| Bridge | Interwoven Bridge (via InterwovenKit) |
| Chain | Initia EVM rollup |

## Getting Started

### Prerequisites
- Node.js 18+
- Foundry (for smart contracts)

### Installation

```bash
git clone https://github.com/farouk-allani/YieldRouter.git
cd YieldRouter
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build

```bash
npm run build
```

### Smart Contracts

```bash
# Compile
forge build

# Test (60+ tests)
forge test -vvv

# Deploy
forge script script/DeployYieldRouter.s.sol --rpc-url $RPC --broadcast --verify
```

## Smart Contract Tests

```
test/
+-- VaultStrategy.t.sol          # 18 tests: deposits, withdrawals, share math, rebalancing
+-- RevenueDistributor.t.sol     # 12 tests: harvest cycles, fees, access control
+-- EnshrinedStaker.t.sol        # 16 tests: staking, rewards, epochs, lifecycle
+-- StrategyRouter.t.sol         # 20+ tests: scoring, routing, portfolio, rebalancing
+-- mocks/
    +-- MockERC20.sol            # ERC20 test token
    +-- MockRevenueAdapter.sol   # Mock harvest adapter
```

## Go-To-Market Strategy

### Target Market
The DeFi yield aggregator market has $2.1B in TVL and is growing 40% year-over-year. Existing aggregators (Yearn, Beefy, Harvest) operate on chains where only single-source yield is possible. YieldRouter captures 4 revenue streams -- a structural advantage unique to Initia.

### Revenue Model
- **10% performance fee** on harvested yield (industry standard)
- At $25M TVL with 20% average APY: **$500K+ annual revenue**
- No token required for revenue -- protocol earns from day one

### Competitive Landscape

| Feature | YieldRouter | Yearn | Beefy |
|---------|-------------|-------|-------|
| Revenue streams | 4 | 1 | 1 |
| Enshrined staking | Yes | No | No |
| Cross-chain deposits | Yes (Interwoven) | Limited | Limited |
| On-chain routing | Yes | Off-chain | Off-chain |
| Revenue share to users | Yes | No | No |

### Roadmap

**Phase 1 (Q2 2026):** Launch on Initia mainnet, onboard 500 depositors, $500K TVL
**Phase 2 (Q3 2026):** 10+ yield sources, multi-asset vaults, keeper automation, $5M TVL
**Phase 3 (Q4 2026):** Governance token, DAO strategy whitelisting, institutional vaults, $25M TVL
**Phase 4 (2027):** Cross-chain yield routing, AI optimization, SDK, mobile app, $100M TVL

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary-dark` | `#0f172a` | Headlines, body text |
| `--color-accent-green` | `#b6ff5c` | CTAs, highlights, yields |
| `--color-accent-purple` | `#a183ff` | Secondary actions |
| `--color-neutral-50` | `#f8f8f5` | Background |
| `--color-dark-surface` | `#1e293b` | Dark cards |

## License

MIT
