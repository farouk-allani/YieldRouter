"use client";

import { useState, useCallback } from "react";
import { useInterwovenKit } from "./InterwovenProvider";

// ─── Types ─────────────────────────────────────────────────────────────

type Tab = "deposit" | "withdraw";

interface StreamPreview {
  name: string;
  label: string;
  apy: number;
  color: string;
  icon: string;
}

const StreamIcon = ({ name, className }: { name: string; className?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    vault: (
      <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
      </svg>
    ),
    staking: (
      <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
        <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
      </svg>
    ),
    swap: (
      <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
        <path fillRule="evenodd" d="M13.2 2.24a.75.75 0 00.04 1.06l2.1 1.95H6.75a.75.75 0 000 1.5h8.59l-2.1 1.95a.75.75 0 101.02 1.1l3.5-3.25a.75.75 0 000-1.1l-3.5-3.25a.75.75 0 00-1.06.04zm-6.4 8a.75.75 0 00-1.06-.04l-3.5 3.25a.75.75 0 000 1.1l3.5 3.25a.75.75 0 001.02-1.1l-2.1-1.95h8.59a.75.75 0 000-1.5H4.66l2.1-1.95a.75.75 0 00.04-1.06z" clipRule="evenodd" />
      </svg>
    ),
    revenue: (
      <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
        <path d="M10.75 10.818a3.75 3.75 0 01-1.908-.072.75.75 0 01.458-1.425 2.25 2.25 0 001.138.306 2.25 2.25 0 002.108-1.49.75.75 0 011.368.576 3.75 3.75 0 01-3.164 2.106z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
      </svg>
    ),
  };
  return icons[name] || null;
};

const REVENUE_STREAMS: StreamPreview[] = [
  { name: "vault-yield", label: "Vault Yield", apy: 12.4, color: "text-emerald-600", icon: "vault" },
  { name: "staking", label: "Staking Rewards", apy: 6.8, color: "text-violet-600", icon: "staking" },
  { name: "lp-fees", label: "LP Trading Fees", apy: 4.2, color: "text-blue-600", icon: "swap" },
  { name: "revenue-share", label: "Revenue Share", apy: 2.4, color: "text-amber-600", icon: "revenue" },
];

const TOTAL_APY = REVENUE_STREAMS.reduce((s, r) => s + r.apy, 0);

// ─── Mock Position (on-chain in production) ────────────────────────────

const MOCK_POSITION = {
  shares: "1,250.00",
  value: "$1,312.50",
  depositedAt: "Mar 15, 2026",
  strategy: "Initia Lending Pool",
  totalEarned: "$62.50",
  dailyEarnings: "$0.89",
};

// ─── Component ─────────────────────────────────────────────────────────

export default function DepositWithdraw() {
  const { isConnected, openConnect, address, username, submitTxBlock } =
    useInterwovenKit();

  const [tab, setTab] = useState<Tab>("deposit");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalApy = TOTAL_APY;
  const parsedAmount = parseFloat(amount) || 0;
  const estimatedDaily = (parsedAmount * totalApy) / 100 / 365;
  const estimatedMonthly = estimatedDaily * 30;
  const estimatedYearly = (parsedAmount * totalApy) / 100;

  const handleDeposit = useCallback(async () => {
    if (!isConnected || parsedAmount <= 0) return;

    setIsSubmitting(true);
    setError(null);
    setTxHash(null);

    try {
      // In production, this would construct a MsgDeposit for VaultStrategy
      // For now, we demonstrate the InterwovenKit transaction flow
      //
      // const msg = {
      //   typeUrl: "/initia.minitia.v1.MsgExecute",
      //   value: {
      //     sender: address,
      //     moduleAddress: VAULT_MODULE,
      //     moduleName: "vault",
      //     functionName: "deposit",
      //     typeArgs: [],
      //     args: [amountInUnits],
      //   },
      // };
      // const hash = await submitTxBlock({ messages: [msg], chainId: "interwoven-1" });

      // Simulated for demo — replace with real contract call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const fakeHash = `0x${Math.random().toString(16).slice(2, 18)}...`;
      setTxHash(fakeHash);
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [isConnected, parsedAmount, address, submitTxBlock]);

  const handleWithdraw = useCallback(async () => {
    if (!isConnected || parsedAmount <= 0) return;

    setIsSubmitting(true);
    setError(null);
    setTxHash(null);

    try {
      // In production: MsgWithdraw for VaultStrategy
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const fakeHash = `0x${Math.random().toString(16).slice(2, 18)}...`;
      setTxHash(fakeHash);
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [isConnected, parsedAmount, address, submitTxBlock]);

  if (!isConnected) {
    return (
      <section id="app" className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-20">
          <div className="max-w-[480px] mx-auto text-center">
            <div className="bg-neutral-50 border border-neutral-200 rounded-[24px] p-12">
              <div className="w-16 h-16 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-accent-green" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <h3 className="text-[24px] font-black uppercase mb-3">
                Connect Your Wallet
              </h3>
              <p className="text-neutral-500 text-[14px] font-medium mb-6">
                Connect via InterwovenKit to start earning from 4 revenue streams
                simultaneously.
              </p>
              <button
                onClick={openConnect}
                className="bg-accent-green text-primary-dark px-8 py-4 rounded-[44px] font-black text-[16px] uppercase tracking-wide hover:bg-[#a5ed4b] transition-colors w-full"
              >
                Connect Wallet
              </button>
              <p className="text-[12px] text-neutral-400 mt-4 font-medium">
                Supports .init usernames, MinieWallet, MetaMask & more
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="app" className="py-24 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-20">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="bg-accent-green px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-[-0.6px] text-primary-dark mb-4 inline-block">
            YieldRouter App
          </span>
          <h2 className="text-[36px] sm:text-[48px] font-black uppercase leading-[1.1] tracking-tight mt-4">
            Start Earning{" "}
            <span className="bg-accent-green px-3 py-1 rounded-2xl inline-block">
              {totalApy.toFixed(1)}%
            </span>{" "}
            APY
          </h2>
          <p className="text-neutral-600 text-[14px] mt-3 font-medium">
            Connected as{" "}
            <span className="font-bold text-primary-dark">
              {username || `${address?.slice(0, 12)}...`}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Deposit/Withdraw Form */}
          <div className="lg:col-span-3">
            <div className="bg-neutral-50 border border-neutral-200 rounded-[24px] overflow-hidden">
              {/* Tab Selector */}
              <div className="flex border-b border-neutral-200">
                <button
                  onClick={() => { setTab("deposit"); setError(null); setTxHash(null); }}
                  className={`flex-1 py-4 text-[14px] font-black uppercase transition-colors ${
                    tab === "deposit"
                      ? "text-primary-dark bg-white border-b-2 border-accent-green"
                      : "text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  Deposit
                </button>
                <button
                  onClick={() => { setTab("withdraw"); setError(null); setTxHash(null); }}
                  className={`flex-1 py-4 text-[14px] font-black uppercase transition-colors ${
                    tab === "withdraw"
                      ? "text-primary-dark bg-white border-b-2 border-accent-green"
                      : "text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  Withdraw
                </button>
              </div>

              <div className="p-6 sm:p-8">
                {/* Amount Input */}
                <div className="mb-6">
                  <label className="text-[12px] font-bold text-neutral-500 uppercase mb-2 block">
                    {tab === "deposit" ? "Deposit Amount" : "Withdraw Amount"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full bg-white border-2 border-neutral-200 rounded-[16px] px-5 py-4 text-[24px] font-black text-primary-dark placeholder:text-neutral-300 focus:outline-none focus:border-accent-green transition-colors"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="text-[14px] font-bold text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-[10px]">
                        INIT
                      </span>
                    </div>
                  </div>
                  {tab === "deposit" && (
                    <div className="flex gap-2 mt-3">
                      {["25", "50", "100", "500"].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setAmount(preset)}
                          className="px-3 py-1.5 text-[12px] font-bold text-neutral-500 bg-neutral-100 rounded-[8px] hover:bg-neutral-200 transition-colors"
                        >
                          {preset} INIT
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Revenue Preview (Deposit only) */}
                {tab === "deposit" && parsedAmount > 0 && (
                  <div className="bg-white border border-neutral-200 rounded-[16px] p-5 mb-6">
                    <h4 className="text-[12px] font-bold text-neutral-500 uppercase mb-4">
                      Estimated Returns (4 Streams)
                    </h4>
                    <div className="space-y-3">
                      {REVENUE_STREAMS.map((stream) => {
                        const streamYield = (parsedAmount * stream.apy) / 100 / 365;
                        return (
                          <div
                            key={stream.name}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <StreamIcon name={stream.icon} className="w-4 h-4" />
                              <span className="text-[13px] font-semibold text-neutral-600">
                                {stream.label}
                              </span>
                              <span className="text-[11px] font-bold text-neutral-400">
                                {stream.apy}% APY
                              </span>
                            </div>
                            <span className={`text-[14px] font-black ${stream.color}`}>
                              +${streamYield.toFixed(4)}/day
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <hr className="border-neutral-100 my-4" />
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-neutral-400 uppercase block">
                          Daily
                        </span>
                        <span className="text-[16px] font-black text-primary-dark">
                          ${estimatedDaily.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-neutral-400 uppercase block">
                          Monthly
                        </span>
                        <span className="text-[16px] font-black text-primary-dark">
                          ${estimatedMonthly.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-neutral-400 uppercase block">
                          Yearly
                        </span>
                        <span className="text-[18px] font-black text-accent-green">
                          ${estimatedYearly.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={tab === "deposit" ? handleDeposit : handleWithdraw}
                  disabled={isSubmitting || parsedAmount <= 0}
                  className={`w-full py-4 rounded-[44px] font-black text-[16px] uppercase tracking-wide transition-colors ${
                    isSubmitting || parsedAmount <= 0
                      ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                      : "bg-accent-green text-primary-dark hover:bg-[#a5ed4b]"
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </span>
                  ) : tab === "deposit" ? (
                    "Deposit & Start Earning"
                  ) : (
                    "Withdraw"
                  )}
                </button>

                {/* Auto-sign session note */}
                {tab === "deposit" && (
                  <p className="text-[11px] text-neutral-400 text-center mt-3 font-medium">
                    Auto-sign enabled — no repeated wallet popups for deposits and withdrawals
                  </p>
                )}

                {/* Transaction Result */}
                {txHash && (
                  <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-[12px] p-4">
                    <p className="text-[13px] font-bold text-emerald-700">
                      Transaction submitted!
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-1 font-mono">
                      {txHash}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-[12px] p-4">
                    <p className="text-[13px] font-bold text-red-700">
                      ❌ {error}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Position Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Your Position */}
            <div className="bg-primary-dark rounded-[24px] p-6 sm:p-8 relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, rgba(182, 255, 92, 0.5) 0%, rgba(161, 131, 255, 0.3) 100%)",
                }}
              />
              <div className="relative z-10">
                <span className="text-neutral-400 text-[12px] font-bold uppercase">
                  Your Position
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-[36px] font-black text-accent-green leading-[1]">
                    {MOCK_POSITION.value}
                  </span>
                </div>
                <span className="text-neutral-400 text-[13px] font-medium mt-1 block">
                  {MOCK_POSITION.shares} vault shares
                </span>

                <hr className="border-dark-border border-dashed my-5" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-surface rounded-[14px] p-4">
                    <span className="text-neutral-400 text-[11px] font-bold uppercase block">
                      Total Earned
                    </span>
                    <span className="text-white text-[18px] font-black mt-1 block">
                      {MOCK_POSITION.totalEarned}
                    </span>
                  </div>
                  <div className="bg-dark-surface rounded-[14px] p-4">
                    <span className="text-neutral-400 text-[11px] font-bold uppercase block">
                      Daily Earnings
                    </span>
                    <span className="text-white text-[18px] font-black mt-1 block">
                      {MOCK_POSITION.dailyEarnings}
                    </span>
                  </div>
                  <div className="bg-dark-surface rounded-[14px] p-4">
                    <span className="text-neutral-400 text-[11px] font-bold uppercase block">
                      Strategy
                    </span>
                    <span className="text-white text-[14px] font-bold mt-1 block">
                      {MOCK_POSITION.strategy}
                    </span>
                  </div>
                  <div className="bg-dark-surface rounded-[14px] p-4">
                    <span className="text-neutral-400 text-[11px] font-bold uppercase block">
                      Deposited
                    </span>
                    <span className="text-white text-[14px] font-bold mt-1 block">
                      {MOCK_POSITION.depositedAt}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Streams Breakdown */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-[24px] p-6">
              <h4 className="text-[12px] font-bold text-neutral-500 uppercase mb-4">
                Revenue Breakdown
              </h4>
              <div className="space-y-3">
                {REVENUE_STREAMS.map((stream) => (
                  <div key={stream.name} className="flex items-center gap-3">
                    <StreamIcon name={stream.icon} className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold text-neutral-700">
                          {stream.label}
                        </span>
                        <span className={`text-[13px] font-black ${stream.color}`}>
                          {stream.apy}%
                        </span>
                      </div>
                      <div className="bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent-green transition-all"
                          style={{ width: `${(stream.apy / totalApy) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <hr className="border-neutral-200 my-4" />
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-black text-primary-dark">
                  Combined APY
                </span>
                <span className="text-[20px] font-black text-accent-green">
                  {totalApy.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
