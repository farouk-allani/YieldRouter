"use client";

import { useState, useEffect, useRef } from "react";

// ─── Animated Counter Hook ────────────────────────────────────────────

function useAnimatedCounter(target: number, duration = 2000, decimals = 1) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target, duration]);

  return { value: value.toFixed(decimals), ref };
}

// ─── Live APY Ticker ─────────────────────────────────────────────────

function LiveApyTicker() {
  const [apys, setApys] = useState([
    { protocol: "Initia Lending", apy: 24.8, delta: 0 },
    { protocol: "Interwoven DEX", apy: 19.3, delta: 0 },
    { protocol: "Enshrined LP", apy: 14.5, delta: 0 },
    { protocol: "Stable Pool", apy: 8.7, delta: 0 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setApys((prev) =>
        prev.map((p) => {
          const drift = (Math.random() - 0.48) * 0.4;
          const newApy = Math.max(1, p.apy + drift);
          return {
            ...p,
            apy: Math.round(newApy * 10) / 10,
            delta: Math.round(drift * 10) / 10,
          };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {apys.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-[10px] px-3 py-2 whitespace-nowrap flex-shrink-0"
        >
          <div className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse" />
          <span className="text-[11px] font-bold text-neutral-300">
            {item.protocol}
          </span>
          <span className="text-[13px] font-black text-accent-green">
            {item.apy}%
          </span>
          <span
            className={`text-[10px] font-bold ${
              item.delta >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {item.delta >= 0 ? "↑" : "↓"}
            {Math.abs(item.delta)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Hero() {
  const bestApy = useAnimatedCounter(25.8, 2500, 1);
  const tvlRouted = useAnimatedCounter(2.4, 2000, 1);
  const userCount = useAnimatedCounter(1847, 2200, 0);

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
                href="/app"
                className="bg-accent-green text-primary-dark px-8 py-4 rounded-[44px] font-black text-[16px] uppercase tracking-wide hover:bg-[#a5ed4b] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Launch App
              </a>
              <a
                href="#how-it-works"
                className="border-2 border-primary-dark text-primary-dark px-8 py-4 rounded-[44px] font-black text-[16px] uppercase tracking-wide hover:bg-primary-dark hover:text-white transition-colors duration-200"
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

            {/* Live APY Ticker */}
            <div className="mt-4 bg-primary-dark rounded-[16px] p-4 relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgba(182, 255, 92, 0.3) 0%, rgba(182, 255, 92, 0) 100%)",
                }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                    Live Protocol Yields
                  </span>
                </div>
                <LiveApyTicker />
              </div>
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

              {/* Rotating ring decoration */}
              <div className="absolute -top-20 -right-20 w-[200px] h-[200px] border border-accent-green/10 rounded-full animate-spin-slow pointer-events-none" />
              <div
                className="absolute -bottom-16 -left-16 w-[160px] h-[160px] border border-accent-purple/10 rounded-full animate-spin-slow pointer-events-none"
                style={{ animationDirection: "reverse", animationDuration: "25s" }}
              />

              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-[14px] font-bold uppercase">
                    Current Best Yield
                  </span>
                  <span className="bg-accent-green/20 text-accent-green px-3 py-1 rounded-full text-[12px] font-black uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse" />
                    Live
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span
                    ref={bestApy.ref}
                    className="text-[48px] sm:text-[56px] font-black text-accent-green leading-[1]"
                  >
                    {bestApy.value}%
                  </span>
                  <span className="text-neutral-400 text-[14px] font-bold">
                    Combined APY — 4 Revenue Streams
                  </span>
                </div>

                <hr className="border-dark-border border-dashed" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-surface rounded-[16px] p-4 hover:bg-dark-border transition-colors duration-200">
                    <span className="text-neutral-400 text-[12px] font-bold uppercase">
                      TVL Routed
                    </span>
                    <span
                      ref={tvlRouted.ref}
                      className="text-white text-[20px] font-black block mt-1"
                    >
                      ${tvlRouted.value}M
                    </span>
                  </div>
                  <div className="bg-dark-surface rounded-[16px] p-4 hover:bg-dark-border transition-colors duration-200">
                    <span className="text-neutral-400 text-[12px] font-bold uppercase">
                      Protocols
                    </span>
                    <span className="text-white text-[20px] font-black block mt-1">
                      12
                    </span>
                  </div>
                  <div className="bg-dark-surface rounded-[16px] p-4 hover:bg-dark-border transition-colors duration-200">
                    <span className="text-neutral-400 text-[12px] font-bold uppercase">
                      Users
                    </span>
                    <span
                      ref={userCount.ref}
                      className="text-white text-[20px] font-black block mt-1"
                    >
                      {Number(userCount.value).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-dark-surface rounded-[16px] p-4 hover:bg-dark-border transition-colors duration-200">
                    <span className="text-neutral-400 text-[12px] font-bold uppercase">
                      Avg APY
                    </span>
                    <span className="text-white text-[20px] font-black block mt-1">
                      18.2%
                    </span>
                  </div>
                </div>

                <a
                  href="/app"
                  className="bg-accent-green text-primary-dark px-8 py-4 rounded-[44px] font-black text-[16px] uppercase tracking-wide text-center hover:bg-[#a5ed4b] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
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
