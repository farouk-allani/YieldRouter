const steps = [
  {
    number: "01",
    title: "Deposit",
    description:
      "Connect your wallet and deposit any supported asset. We accept INIT, USDC, USDT, and more.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    number: "02",
    title: "We Route",
    description:
      "Our smart routing engine scans every protocol on Initia in real-time and allocates your assets to the optimal yield strategies.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Earn & Rebalance",
    description:
      "Watch your yield grow. We auto-rebalance when better opportunities appear — no action needed from you.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
        />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-20">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="bg-accent-green px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-[-0.6px] text-primary-dark mb-4 inline-block">
            Simple
          </span>
          <h2 className="text-[36px] sm:text-[48px] font-black uppercase leading-[1.1] tracking-tight mt-4">
            Three Steps to{" "}
            <span className="bg-accent-green px-3 py-1 rounded-2xl inline-block">
              Better
            </span>{" "}
            Yield
          </h2>
          <p className="text-neutral-600 text-[16px] leading-[24px] max-w-[560px] mx-auto mt-4 font-medium">
            No complex strategies to learn. No manual rebalancing. Just deposit
            and let YieldRouter do the work.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white rounded-[24px] border border-neutral-200 p-8 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-neutral-100 rounded-[16px] flex items-center justify-center text-primary-dark group-hover:bg-accent-green transition-colors">
                  {step.icon}
                </div>
                <span className="text-[48px] font-black text-neutral-200 leading-[1]">
                  {step.number}
                </span>
              </div>
              <h3 className="text-[24px] font-black uppercase mb-3">
                {step.title}
              </h3>
              <p className="text-neutral-600 text-[14px] leading-[20px] font-medium">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
