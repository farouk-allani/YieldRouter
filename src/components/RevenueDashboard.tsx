"use client";

import { useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface RevenueStream {
  name: string;
  label: string;
  description: string;
  apy: number;
  totalEarned: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

// ─── Mock Data (replaced by on-chain in production) ────────────────────────

const REVENUE_STREAMS: RevenueStream[] = [
  {
    name: "vault-yield",
    label: "Vault Yield",
    description: "Best strategy across Initia via Bridge",
    apy: 12.4,
    totalEarned: "$1,240.50",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
  },
  {
    name: "staking",
    label: "Staking Rewards",
    description: "Enshrined Liquidity — LP staked with validators",
    apy: 6.8,
    totalEarned: "$680.20",
    color: "text-violet-600",
    bgColor: "bg-violet-50 border-violet-200",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    name: "lp-fees",
    label: "LP Trading Fees",
    description: "Trading fees from liquidity pool positions",
    apy: 4.2,
    totalEarned: "$420.00",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    name: "revenue-share",
    label: "Revenue Share",
    description: "Initia appchain tx fees recycled to users",
    apy: 2.4,
    totalEarned: "$240.80",
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function RevenueDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<"24h" | "7d" | "30d">("30d");

  const totalApy = REVENUE_STREAMS.reduce((sum, s) => sum + s.apy, 0);

  return (
    <section id="revenue" className="py-24 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-20">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="bg-accent-green px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-[-0.6px] text-primary-dark mb-4 inline-block">
            Revenue Flywheel
          </span>
          <h2 className="text-[36px] sm:text-[48px] font-black uppercase leading-[1.1] tracking-tight mt-4">
            Four Streams,{" "}
            <span className="bg-accent-green px-3 py-1 rounded-2xl inline-block">
              One
            </span>{" "}
            Deposit
          </h2>
          <p className="text-neutral-600 text-[16px] leading-[24px] max-w-[560px] mx-auto mt-4 font-medium">
            Every dollar you deposit earns from vault strategies, staking rewards,
            LP trading fees, and Initia chain revenue share — simultaneously.
          </p>
        </div>

        {/* Total APY Hero */}
        <div className="bg-primary-dark rounded-[24px] p-8 sm:p-10 mb-8 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(182, 255, 92, 0.5) 0%, rgba(161, 131, 255, 0.3) 50%, rgba(182, 255, 92, 0) 100%)",
            }}
          />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <span className="text-neutral-400 text-[14px] font-bold uppercase">
                Combined APY (All 4 Streams)
              </span>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-[56px] sm:text-[72px] font-black text-accent-green leading-[1]">
                  {totalApy.toFixed(1)}%
                </span>
                <span className="text-neutral-400 text-[18px] font-bold">APY</span>
              </div>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2 bg-dark-surface rounded-[16px] p-1.5">
              {(["24h", "7d", "30d"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-5 py-2 rounded-[12px] text-[14px] font-bold transition-all ${
                    selectedPeriod === period
                      ? "bg-accent-green text-primary-dark"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Stream Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {REVENUE_STREAMS.map((stream, index) => (
            <div
              key={stream.name}
              className={`rounded-[20px] border p-6 hover:shadow-lg transition-all group ${stream.bgColor}`}
            >
              {/* Icon + Index */}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-[14px] bg-white flex items-center justify-center ${stream.color} shadow-sm`}>
                  {stream.icon}
                </div>
                <span className="text-[12px] font-black text-neutral-400 uppercase">
                  Stream {index + 1}
                </span>
              </div>

              {/* Label */}
              <h3 className="text-[16px] font-black text-primary-dark mb-1">
                {stream.label}
              </h3>
              <p className="text-[13px] text-neutral-500 font-medium mb-4 leading-[18px]">
                {stream.description}
              </p>

              {/* APY + Earned */}
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[12px] font-bold text-neutral-400 uppercase block">
                    APY
                  </span>
                  <span className={`text-[28px] font-black leading-[1] ${stream.color}`}>
                    {stream.apy}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[12px] font-bold text-neutral-400 uppercase block">
                    Earned
                  </span>
                  <span className="text-[16px] font-black text-primary-dark">
                    {stream.totalEarned}
                  </span>
                </div>
              </div>

              {/* Contribution Bar */}
              <div className="mt-4 bg-white/60 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-current transition-all"
                  style={{ width: `${(stream.apy / totalApy) * 100}%`, opacity: 0.6 }}
                />
              </div>
              <span className="text-[11px] font-bold text-neutral-400 mt-1 block">
                {((stream.apy / totalApy) * 100).toFixed(0)}% of total yield
              </span>
            </div>
          ))}
        </div>

        {/* Flywheel Explanation */}
        <div className="mt-12 bg-neutral-50 rounded-[24px] border border-neutral-200 p-8 sm:p-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Visual */}
            <div className="flex-shrink-0 w-[200px] h-[200px] relative">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-neutral-300 animate-spin-slow" />
              <div className="absolute inset-4 rounded-full bg-accent-green/10 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-[32px] font-black text-primary-dark block">
                    {totalApy.toFixed(1)}%
                  </span>
                  <span className="text-[11px] font-bold text-neutral-500 uppercase">
                    Combined APY
                  </span>
                </div>
              </div>
              {/* Orbital dots */}
              {REVENUE_STREAMS.map((_, i) => {
                const angle = (i * 90 - 90) * (Math.PI / 180);
                const x = 100 + 90 * Math.cos(angle);
                const y = 100 + 90 * Math.sin(angle);
                return (
                  <div
                    key={i}
                    className={`absolute w-4 h-4 rounded-full ${REVENUE_STREAMS[i].bgColor} border-2`}
                    style={{
                      left: `${x - 8}px`,
                      top: `${y - 8}px`,
                    }}
                  />
                );
              })}
            </div>

            {/* Text */}
            <div className="flex-1">
              <h3 className="text-[24px] font-black uppercase mb-4">
                The Revenue Flywheel
              </h3>
              <div className="space-y-3">
                {[
                  "Your deposit enters the vault and gets routed to the best yield strategy",
                  "LP positions are staked with validators via Enshrined Liquidity",
                  "Trading fees accrue from your LP position automatically",
                  "Initia appchain tx fees are recycled back to depositors as revenue share",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent-green flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[12px] font-black text-primary-dark">{i + 1}</span>
                    </div>
                    <p className="text-[14px] text-neutral-600 font-medium">{step}</p>
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
