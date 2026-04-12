export default function Roadmap() {
  const phases = [
    {
      phase: "Phase 1",
      title: "Launch & Traction",
      timeline: "Q2 2026",
      status: "active" as const,
      items: [
        "Deploy contracts on Initia mainnet",
        "Launch with Enshrined LP + top 3 lending protocols",
        "Onboard first 500 depositors via Initia community",
        "Target $500K TVL in first 30 days",
        "Launch referral program with yield bonuses",
      ],
    },
    {
      phase: "Phase 2",
      title: "Protocol Expansion",
      timeline: "Q3 2026",
      status: "upcoming" as const,
      items: [
        "Add 10+ yield sources across Initia ecosystem",
        "Launch keeper bot for automated rebalancing",
        "Multi-asset vaults (INIT, USDC, ETH)",
        "Integrate all Interwoven rollups for cross-chain routing",
        "Target $5M TVL",
      ],
    },
    {
      phase: "Phase 3",
      title: "Revenue & Governance",
      timeline: "Q4 2026",
      status: "upcoming" as const,
      items: [
        "Launch YR governance token",
        "Revenue-share model: 90% to depositors, 10% protocol fee",
        "DAO governance for strategy whitelisting",
        "Institutional vaults with custom risk profiles",
        "Target $25M TVL",
      ],
    },
    {
      phase: "Phase 4",
      title: "Scale & Ecosystem",
      timeline: "2027",
      status: "upcoming" as const,
      items: [
        "Cross-chain yield routing via Interwoven Bridge",
        "AI-powered strategy optimization",
        "SDK for protocols to integrate YieldRouter",
        "Mobile app for portfolio management",
        "Target $100M TVL",
      ],
    },
  ];

  const metrics = [
    { label: "Target Market", value: "$2.1B", desc: "DeFi yield aggregator TVL (growing 40% YoY)" },
    { label: "Revenue Model", value: "10%", desc: "Performance fee on harvested yield" },
    { label: "Year 1 Revenue", value: "$500K+", desc: "At $25M TVL with 20% avg APY" },
    { label: "Competitive Edge", value: "4x", desc: "Revenue streams vs single-source aggregators" },
  ];

  return (
    <section id="roadmap" className="py-24 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-20">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="bg-accent-green px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-[-0.6px] text-primary-dark mb-4 inline-block">
            Go To Market
          </span>
          <h2 className="text-[36px] sm:text-[48px] font-black uppercase leading-[1.1] tracking-tight mt-4">
            Built to Scale{" "}
            <span className="bg-accent-green px-3 py-1 rounded-2xl inline-block">
              Beyond
            </span>{" "}
            the Hackathon
          </h2>
          <p className="text-neutral-500 text-[14px] sm:text-[16px] font-medium max-w-[620px] mx-auto mt-4">
            YieldRouter is designed for long-term revenue generation on Initia.
            Here's how we get there.
          </p>
        </div>

        {/* Market Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {metrics.map((m) => (
            <div key={m.label} className="bg-neutral-50 border border-neutral-200 rounded-[20px] p-6 text-center">
              <span className="text-[32px] sm:text-[40px] font-black text-accent-green leading-[1] block">
                {m.value}
              </span>
              <span className="text-[14px] font-black text-primary-dark uppercase mt-2 block">
                {m.label}
              </span>
              <span className="text-[12px] text-neutral-500 font-medium mt-1 block">
                {m.desc}
              </span>
            </div>
          ))}
        </div>

        {/* Roadmap Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {phases.map((phase) => (
            <div
              key={phase.phase}
              className={`rounded-[24px] p-6 border-2 transition-all ${
                phase.status === "active"
                  ? "bg-primary-dark border-accent-green text-white"
                  : "bg-neutral-50 border-neutral-200"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-[11px] font-black uppercase tracking-wide px-2 py-1 rounded-full ${
                    phase.status === "active"
                      ? "bg-accent-green text-primary-dark"
                      : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {phase.phase}
                </span>
                <span
                  className={`text-[12px] font-bold ${
                    phase.status === "active" ? "text-neutral-400" : "text-neutral-400"
                  }`}
                >
                  {phase.timeline}
                </span>
              </div>
              <h3
                className={`text-[18px] font-black uppercase mb-4 ${
                  phase.status === "active" ? "text-white" : "text-primary-dark"
                }`}
              >
                {phase.title}
              </h3>
              <ul className="space-y-2.5">
                {phase.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        phase.status === "active" ? "text-accent-green" : "text-neutral-400"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span
                      className={`text-[13px] font-medium leading-snug ${
                        phase.status === "active" ? "text-neutral-300" : "text-neutral-600"
                      }`}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Why Initia */}
        <div className="mt-16 bg-primary-dark rounded-[24px] p-8 sm:p-12 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(182, 255, 92, 0.5) 0%, rgba(161, 131, 255, 0.3) 100%)",
            }}
          />
          <div className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-[12px] font-black uppercase text-accent-green mb-2 block">
                  Why Initia
                </span>
                <h3 className="text-[28px] sm:text-[36px] font-black uppercase text-white leading-[1.1] mb-4">
                  The Only Chain Where This Is Possible
                </h3>
                <p className="text-neutral-400 text-[14px] font-medium leading-relaxed">
                  YieldRouter's 4-stream revenue flywheel is uniquely enabled by Initia's architecture.
                  Enshrined Liquidity lets LP tokens earn staking rewards simultaneously.
                  The Interwoven Bridge eliminates friction for cross-chain deposits.
                  And appchain revenue sharing creates the 4th yield stream that doesn't exist anywhere else.
                </p>
              </div>
              <div className="space-y-4">
                {[
                  { feature: "Enshrined Liquidity", desc: "LP + staking yield in one position" },
                  { feature: "Interwoven Bridge", desc: "One-click deposits from any chain" },
                  { feature: "Revenue Sharing", desc: "Appchain tx fees flow back to users" },
                  { feature: "100ms Block Times", desc: "Instant transaction confirmation" },
                  { feature: "Social Logins", desc: "Onboard non-crypto-native users" },
                ].map((item) => (
                  <div key={item.feature} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent-green/20 rounded-[8px] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-accent-green" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-[14px] font-black text-white block">{item.feature}</span>
                      <span className="text-[12px] text-neutral-400 font-medium">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
