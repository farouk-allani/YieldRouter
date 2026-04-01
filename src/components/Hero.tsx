export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-[400px] h-[400px] bg-[rgba(182,255,92,0.1)] blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-[rgba(161,131,255,0.08)] blur-[80px] rounded-full pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-20 py-24 sm:py-32 lg:py-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Copy */}
          <div className="flex flex-col gap-6 sm:gap-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-neutral-100 border border-neutral-200 rounded-[24px] px-4 py-2 w-fit">
              <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
              <span className="text-[12px] font-bold uppercase tracking-[-0.6px] text-neutral-500">
                Live on Initia Testnet
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[36px] sm:text-[48px] lg:text-[64px] font-black uppercase leading-[1] tracking-tight">
              Route Your Yield to{" "}
              <span className="bg-accent-green px-3 sm:px-4 py-1 rounded-2xl inline-block">
                Maximum
              </span>{" "}
              Returns
            </h1>

            {/* Subheadline */}
            <p className="text-[16px] sm:text-[18px] leading-[24px] sm:leading-[28px] text-neutral-600 max-w-[520px] font-medium">
              YieldRouter automatically scans every DeFi protocol on Initia and
              routes your assets to the highest-yielding opportunities. One
              deposit. Optimized returns. Zero hassle.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mt-2">
              <a
                href="#app"
                className="bg-accent-green text-primary-dark px-8 py-4 rounded-[44px] font-black text-[16px] uppercase tracking-wide hover:bg-[#a5ed4b] transition-colors"
              >
                Start Earning
              </a>
              <a
                href="#how-it-works"
                className="border-2 border-primary-dark text-primary-dark px-8 py-4 rounded-[44px] font-black text-[16px] uppercase tracking-wide hover:bg-primary-dark hover:text-white transition-colors"
              >
                How It Works
              </a>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-6 mt-4 text-[14px] text-neutral-400 font-bold">
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-accent-green"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Non-custodial
              </span>
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-accent-green"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Auto-rebalancing
              </span>
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-accent-green"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Audited contracts
              </span>
            </div>
          </div>

          {/* Right Column - Yield Card Visual */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="w-full max-w-[480px] bg-primary-dark rounded-[24px] p-8 sm:p-10 relative overflow-hidden">
              {/* Gradient overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, rgba(182, 255, 92, 0.4) 0%, rgba(182, 255, 92, 0) 100%)",
                }}
              />

              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-[14px] font-bold uppercase">
                    Current Best Yield
                  </span>
                  <span className="bg-accent-green/20 text-accent-green px-3 py-1 rounded-full text-[12px] font-black uppercase">
                    Live
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[48px] sm:text-[56px] font-black text-accent-green leading-[1]">
                    24.8%
                  </span>
                  <span className="text-neutral-400 text-[14px] font-bold">
                    APY — Initia Lending Pool
                  </span>
                </div>

                <hr className="border-dark-border border-dashed" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-surface rounded-[16px] p-4">
                    <span className="text-neutral-400 text-[12px] font-bold uppercase">
                      TVL Routed
                    </span>
                    <span className="text-white text-[20px] font-black block mt-1">
                      $2.4M
                    </span>
                  </div>
                  <div className="bg-dark-surface rounded-[16px] p-4">
                    <span className="text-neutral-400 text-[12px] font-bold uppercase">
                      Protocols
                    </span>
                    <span className="text-white text-[20px] font-black block mt-1">
                      12
                    </span>
                  </div>
                  <div className="bg-dark-surface rounded-[16px] p-4">
                    <span className="text-neutral-400 text-[12px] font-bold uppercase">
                      Users
                    </span>
                    <span className="text-white text-[20px] font-black block mt-1">
                      1,847
                    </span>
                  </div>
                  <div className="bg-dark-surface rounded-[16px] p-4">
                    <span className="text-neutral-400 text-[12px] font-bold uppercase">
                      Avg APY
                    </span>
                    <span className="text-white text-[20px] font-black block mt-1">
                      18.2%
                    </span>
                  </div>
                </div>

                <a
                  href="#app"
                  className="bg-accent-green text-primary-dark px-8 py-4 rounded-[44px] font-black text-[16px] uppercase tracking-wide text-center hover:bg-[#a5ed4b] transition-colors"
                >
                  Deposit Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
