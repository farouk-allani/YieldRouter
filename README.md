# YieldRouter 🐍

**Revenue Flywheel Yield Aggregator for Initia**

One deposit → four revenue streams. YieldRouter automatically scans every DeFi protocol on Initia and routes your assets to the highest-yielding opportunities. Vault yield, staking rewards, LP trading fees, and appchain revenue share — all from a single deposit.

## 🏆 INITIATE: The Initia Hackathon (Season 1)

**Track:** DeFi (EVM/Solidity)  
**Deadline:** April 15, 2026

### Submission Requirements
- [x] `.initia/submission.json`
- [x] `README.md`
- [x] InterwovenKit integration
- [x] At least one Initia-native feature (Enshrined Liquidity)
- [ ] Demo video (in progress)

## The Revenue Flywheel

```
┌─────────────────────────────────────────────────────┐
│                  YOUR DEPOSIT                        │
│                      │                               │
│         ┌────────────┼────────────┐                  │
│         ▼            ▼            ▼                  │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│   │  Vault   │ │ Enshrined│ │    LP    │            │
│   │  Yield   │ │ Staking  │ │   Fees   │            │
│   │  12.4%   │ │   6.8%   │ │   4.2%   │            │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘            │
│        │            │            │                   │
│        └────────────┼────────────┘                   │
│                     ▼                                │
│            ┌──────────────┐                          │
│            │   Revenue    │                          │
│            │   Share      │                          │
│            │    2.4%      │                          │
│            └──────┬───────┘                          │
│                   ▼                                  │
│           25.8% Combined APY                         │
└─────────────────────────────────────────────────────┘
```

### Four Revenue Streams

| Stream | Source | Initia Feature |
|--------|--------|----------------|
| **Vault Yield** | Best lending/farming strategy via Bridge | Interwoven Bridge |
| **Staking Rewards** | LP positions staked with validators | Enshrined Liquidity (native) |
| **LP Trading Fees** | Automated market maker fees | DEX integration |
| **Revenue Share** | Appchain tx fees recycled to users | Initia revenue sharing |

## Architecture

### Smart Contracts (Solidity)

```
contracts/
├── VaultStrategy.sol        # Core vault: deposit, withdraw, share math, rebalancing
├── RevenueDistributor.sol   # Harvests 4 revenue streams, distributes to vault
├── EnshrinedStaker.sol      # Initia Enshrined Liquidity staking (native feature)
```

**VaultStrategy** — The core vault contract. Accepts user deposits, mints shares, routes to the best yield strategy, and compounds revenue from all 4 streams.

**RevenueDistributor** — Keeper-driven harvest cycle. Calls each revenue adapter, takes a performance fee, and forwards net revenue to the vault where it compounds.

**EnshrinedStaker** — Initia's unique Enshrined Liquidity feature. LP tokens are staked directly with validators, earning staking rewards on top of LP trading fees. This doubles yield on LP positions — a feature unique to Initia.

### Strategy Router Engine (TypeScript)

```
src/lib/
├── strategy-router.ts  # Core routing algorithm
├── adapters.ts         # Protocol adapter interfaces
├── bridge.ts           # Interwoven Bridge integration
├── init-username.ts    # .init username resolution
```

The router scores opportunities using a composite algorithm:

```
score = (APY × 0.50) + (Risk × 0.30) + (TVL × 0.10) + (Freshness × 0.10)
```

Capital is allocated proportionally to the top-N strategies, with an Enshrined LP bonus that always includes Initia's native feature.

### Frontend (Next.js)

```
src/
├── app/
│   ├── layout.tsx        # Root layout with InterwovenProvider
│   ├── page.tsx          # Landing page composition
│   └── globals.css       # Design system tokens
├── components/
│   ├── Header.tsx        # Sticky nav with wallet connect
│   ├── Hero.tsx          # Landing hero with yield card
│   ├── HowItWorks.tsx    # 3-step process
│   ├── RevenueDashboard.tsx  # 4-stream revenue visualization
│   ├── DepositWithdraw.tsx   # Deposit/withdraw with InterwovenKit
│   ├── Yields.tsx        # Live protocol scanner with filtering
│   ├── Security.tsx      # Security features
│   ├── FAQ.tsx           # FAQ section
│   ├── CTA.tsx           # Call to action
│   └── Footer.tsx        # Footer
├── lib/
│   ├── strategy-router.ts
│   ├── adapters.ts
│   ├── bridge.ts
│   └── init-username.ts
└── components/
    └── InterwovenProvider.tsx  # InterwovenKit provider config
```

## Initia-Native Features

### 1. Enshrined Liquidity (Unique to Initia)
LP positions are staked directly with validators, earning staking rewards on top of LP fees. YieldRouter's `EnshrinedStaker.sol` manages this dual-yield mechanism natively.

### 2. InterwovenKit Integration
Native wallet connection, `.init` username display, and auto-signing session UX for seamless deposits/withdrawals without repeated wallet popups.

### 3. Interwoven Bridge
Cross-chain deposits from Ethereum, Noble, Osmosis, and Cosmos Hub directly into the vault.

### 4. Initia Revenue Sharing
Appchain transaction fees are recycled back to depositors as the 4th revenue stream.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS 4 |
| Smart Contracts | Solidity 0.8.24 (EVM) |
| Testing | Foundry (forge) |
| Wallet | InterwovenKit React |
| Bridge | Interwoven Bridge |
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

# Test
forge test -vvv

# Deploy
forge script script/DeployYieldRouter.s.sol --rpc-url $RPC --broadcast --verify
```

## Smart Contract Tests

```
test/
├── VaultStrategy.t.sol          # 18 tests: deposits, withdrawals, share math, rebalancing
├── RevenueDistributor.t.sol     # 12 tests: harvest cycles, fees, access control
├── EnshrinedStaker.t.sol        # 16 tests: staking, rewards, epochs, lifecycle
└── mocks/
    ├── MockERC20.sol            # ERC20 test token
    └── MockRevenueAdapter.sol   # Mock harvest adapter
```

Run tests:
```bash
forge test -vvv
```

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
