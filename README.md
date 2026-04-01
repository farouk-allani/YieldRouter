# YieldRouter 🐍

**Maximize Your DeFi Yield on Initia**

YieldRouter automatically finds and routes your assets to the highest-yielding DeFi opportunities across the Initia ecosystem. One deposit. Optimized returns. Zero hassle.

## 🏆 INITIATE: The Initia Hackathon (Season 1)

**Track:** DeFi

**Built for:** The Initia ecosystem — maximizing yield capture for users while leveraging Initia's interwoven architecture.

## What is YieldRouter?

YieldRouter is a DeFi yield aggregator that:

- **Scans** every lending, staking, LP, and farming protocol on Initia in real-time
- **Routes** your deposited assets to the optimal yield strategies
- **Rebalances** automatically when better opportunities appear
- **Protects** your assets with non-custodial, audited smart contracts

## Features

### Core Protocol
- 🔄 **Smart Routing Engine** — Real-time APY scanning across all Initia protocols
- 📊 **Risk Scoring** — Transparent risk ratings for every protocol
- 🔐 **Non-Custodial** — Your keys, your crypto. Always.
- ⚡ **Auto-Rebalancing** — Optimizes your position as yields change

### Initia Integration
- 🌉 **Interwoven Bridge** — Deposit from any chain seamlessly
- 👛 **InterwovenKit** — Native wallet connection and transaction handling
- 🏷️ **Initia Usernames (.init)** — Human-readable addresses

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| Smart Contracts | Solidity (EVM) on Initia appchain |
| Wallet | InterwovenKit React |
| Chain | Initia EVM rollup |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

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

## Project Structure

```
src/
├── app/              # Next.js app router
├── components/       # UI components
│   ├── Header.tsx    # Navigation
│   ├── Hero.tsx      # Landing hero
│   ├── HowItWorks.tsx
│   ├── Yields.tsx    # Protocol comparison
│   ├── Security.tsx
│   ├── FAQ.tsx
│   ├── CTA.tsx
│   └── Footer.tsx
├── lib/              # Utilities and configs
└── contracts/        # Solidity contracts (coming soon)
```

## Design System

YieldRouter uses a bold, high-contrast design system inspired by modern DeFi UX:

- **Primary Dark:** `#0f172a`
- **Accent Green:** `#b6ff5c` (highlights, CTAs)
- **Accent Purple:** `#a183ff` (secondary actions)
- **Background:** `#f8f8f5`

## Submission Requirements

- [x] `.initia/submission.json`
- [x] `README.md`
- [ ] Demo video (in progress)
- [ ] Deployed appchain with chain ID
- [ ] InterwovenKit integration
- [ ] At least one Initia-native feature

## License

MIT
