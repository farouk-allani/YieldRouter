const features = [
  {
    title: "Non-Custodial",
    description:
      "Your assets never leave your wallet. YieldRouter uses smart contracts to route funds — we never hold your keys.",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
  },
  {
    title: "Audited Contracts",
    description:
      "All smart contracts are audited by leading security firms. Open-source and verifiable on-chain.",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
        />
      </svg>
    ),
  },
  {
    title: "Risk Scoring",
    description:
      "Every protocol is rated with a transparent risk score. You choose your risk tolerance, we handle the rest.",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
        />
      </svg>
    ),
  },
  {
    title: "Transparent Routing",
    description:
      "Every routing decision is logged on-chain. See exactly where your funds go and why.",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

export default function Security() {
  return (
    <section id="security" className="py-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-20">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Copy */}
          <div>
            <span className="bg-accent-purple/20 text-accent-purple px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-[-0.6px] mb-4 inline-block">
              Security First
            </span>
            <h2 className="text-[36px] sm:text-[48px] font-black uppercase leading-[1.1] tracking-tight mt-4">
              Your Keys,{" "}
              <span className="bg-accent-green px-3 py-1 rounded-2xl inline-block">
                Your
              </span>{" "}
              Crypto
            </h2>
            <p className="text-neutral-600 text-[16px] leading-[24px] mt-6 font-medium max-w-[480px]">
              YieldRouter is built with security at its core. Non-custodial
              architecture means you always maintain full control of your
              assets.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mt-10">
              <div className="bg-white rounded-[20px] border border-neutral-200 p-6">
                <span className="text-[32px] font-black text-primary-dark leading-[1]">
                  $0
                </span>
                <span className="text-[12px] font-bold uppercase text-neutral-400 block mt-2">
                  Lost to Hacks
                </span>
              </div>
              <div className="bg-white rounded-[20px] border border-neutral-200 p-6">
                <span className="text-[32px] font-black text-primary-dark leading-[1]">
                  100%
                </span>
                <span className="text-[12px] font-bold uppercase text-neutral-400 block mt-2">
                  On-Chain Logic
                </span>
              </div>
            </div>
          </div>

          {/* Right - Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-[24px] border border-neutral-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-neutral-100 rounded-[16px] flex items-center justify-center text-primary-dark mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-[18px] font-black uppercase mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 text-[14px] leading-[20px] font-medium">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
