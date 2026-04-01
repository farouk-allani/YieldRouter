const protocols = [
  {
    name: "Initia Lending",
    type: "Lending",
    apy: "24.8%",
    tvl: "$1.2M",
    risk: "Low",
    highlight: true,
  },
  {
    name: "Interwoven DEX",
    type: "LP",
    apy: "19.3%",
    tvl: "$890K",
    risk: "Medium",
    highlight: false,
  },
  {
    name: "StakeInit",
    type: "Staking",
    apy: "14.5%",
    tvl: "$2.1M",
    risk: "Low",
    highlight: false,
  },
  {
    name: "YieldFarm Alpha",
    type: "Farming",
    apy: "31.2%",
    tvl: "$450K",
    risk: "High",
    highlight: false,
  },
  {
    name: "Stable Pool",
    type: "Stable LP",
    apy: "8.7%",
    tvl: "$3.4M",
    risk: "Low",
    highlight: false,
  },
  {
    name: "Leverage Vault",
    type: "Vault",
    apy: "42.1%",
    tvl: "$320K",
    risk: "High",
    highlight: false,
  },
];

const filters = ["All", "Lending", "LP", "Staking", "Farming", "Vault"];

export default function Yields() {
  return (
    <section id="yields" className="py-24 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-20">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div>
            <span className="bg-accent-green px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-[-0.6px] text-primary-dark mb-4 inline-block">
              Live Yields
            </span>
            <h2 className="text-[36px] sm:text-[48px] font-black uppercase leading-[1.1] tracking-tight mt-4">
              Every Opportunity,{" "}
              <span className="bg-accent-green px-3 py-1 rounded-2xl inline-block">
                One
              </span>{" "}
              Dashboard
            </h2>
          </div>
          <p className="text-neutral-600 text-[16px] leading-[24px] max-w-[380px] font-medium">
            Real-time yield data from every protocol on Initia. We find the
            best, so you don&apos;t have to.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-neutral-100 p-2 rounded-2xl border border-neutral-200 inline-flex gap-1 mb-8 overflow-x-auto">
          {filters.map((filter, i) => (
            <button
              key={filter}
              className={`px-6 py-2 rounded-[24px] text-[14px] font-black whitespace-nowrap transition-colors ${
                i === 0
                  ? "bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-primary-dark"
                  : "text-neutral-500 hover:text-primary-dark"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-[24px] border border-neutral-200 overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-8 py-4 border-b border-neutral-200 bg-neutral-50">
            <span className="text-[12px] font-black uppercase tracking-[-0.6px] text-neutral-400">
              Protocol
            </span>
            <span className="text-[12px] font-black uppercase tracking-[-0.6px] text-neutral-400">
              APY
            </span>
            <span className="text-[12px] font-black uppercase tracking-[-0.6px] text-neutral-400">
              TVL
            </span>
            <span className="text-[12px] font-black uppercase tracking-[-0.6px] text-neutral-400">
              Risk
            </span>
          </div>

          {/* Rows */}
          {protocols.map((protocol) => (
            <div
              key={protocol.name}
              className={`grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-8 py-5 border-b border-neutral-200 last:border-b-0 items-center hover:bg-neutral-50 transition-colors ${
                protocol.highlight ? "bg-accent-green/5" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-[14px] font-black ${
                    protocol.highlight
                      ? "bg-accent-green text-primary-dark"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {protocol.name.charAt(0)}
                </div>
                <div>
                  <span className="text-[14px] font-black text-primary-dark block">
                    {protocol.name}
                  </span>
                  <span className="text-[12px] font-bold text-neutral-400">
                    {protocol.type}
                  </span>
                </div>
              </div>
              <span
                className={`text-[20px] font-black ${
                  protocol.highlight ? "text-accent-green" : "text-primary-dark"
                }`}
              >
                {protocol.apy}
              </span>
              <span className="text-[14px] font-bold text-neutral-600">
                {protocol.tvl}
              </span>
              <span
                className={`text-[12px] font-black uppercase tracking-[-0.6px] px-3 py-1 rounded-full w-fit ${
                  protocol.risk === "Low"
                    ? "bg-green-100 text-green-700"
                    : protocol.risk === "Medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {protocol.risk}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <a
            href="#app"
            className="bg-accent-green text-primary-dark px-8 py-4 rounded-[44px] font-black text-[16px] uppercase tracking-wide hover:bg-[#a5ed4b] transition-colors inline-block"
          >
            View All Yields
          </a>
        </div>
      </div>
    </section>
  );
}
