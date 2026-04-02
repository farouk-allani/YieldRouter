export default function CTA() {
  return (
    <section className="py-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-20">
        <div className="bg-primary-dark rounded-[24px] sm:rounded-[40px] p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-[rgba(182,255,92,0.15)] blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[250px] h-[250px] bg-[rgba(161,131,255,0.1)] blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-[36px] sm:text-[48px] lg:text-[56px] font-black uppercase leading-[1] tracking-tight text-white">
              Start Earning{" "}
              <span className="bg-accent-green px-3 py-1 rounded-2xl inline-block text-primary-dark">
                Maximum
              </span>{" "}
              Yield Today
            </h2>
            <p className="text-neutral-400 text-[16px] sm:text-[18px] leading-[24px] mt-6 max-w-[560px] mx-auto font-medium">
              Join thousands of users already optimizing their DeFi returns on
              Initia. One click. Auto-routed. Always earning.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-10">
              <a
                href="/app"
                className="bg-accent-green text-primary-dark px-10 py-5 rounded-[44px] font-black text-[18px] uppercase tracking-wide hover:bg-[#a5ed4b] transition-colors"
              >
                Launch App
              </a>
              <a
                href="#"
                className="bg-accent-purple text-white px-10 py-5 rounded-2xl font-black text-[18px] uppercase border-b-4 border-dark-surface hover:bg-[#9173ef] transition-colors"
              >
                Read Docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
