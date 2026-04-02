"use client";

import { useState, useEffect } from "react";
import {
  routeDeposit,
  type RouteResult,
  type Allocation,
} from "@/lib/strategy-router";

// ─── Types ─────────────────────────────────────────────────────────────

interface StrategyAllocationProps {
  depositAmount?: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────

function strategyColor(type: string): string {
  const colors: Record<string, string> = {
    lending: "#10b981",
    lp: "#3b82f6",
    staking: "#8b5cf6",
    farming: "#f59e0b",
    vault: "#ef4444",
    "stable-lp": "#06b6d4",
    "enshrined-lp": "#a183ff",
  };
  return colors[type] || "#94a3b8";
}

function riskBadge(risk: number): { label: string; color: string } {
  if (risk <= 3) return { label: "Low Risk", color: "bg-green-100 text-green-700" };
  if (risk <= 6) return { label: "Medium Risk", color: "bg-yellow-100 text-yellow-700" };
  return { label: "High Risk", color: "bg-red-100 text-red-700" };
}

// ─── Component ─────────────────────────────────────────────────────────

export default function StrategyAllocation({
  depositAmount = 1000,
}: StrategyAllocationProps) {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState(depositAmount.toString());

  useEffect(() => {
    let mounted = true;
    const amount = parseFloat(customAmount) || 1000;
    routeDeposit(amount).then((result) => {
      if (mounted) {
        setRoute(result);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [customAmount]);

  if (loading || !route) {
    return (
      <div className="bg-neutral-50 border border-neutral-200 rounded-[24px] p-8 animate-pulse">
        <div className="h-6 bg-neutral-200 rounded w-1/3 mb-4" />
        <div className="h-48 bg-neutral-200 rounded-[16px]" />
      </div>
    );
  }

  const { allocations, totalExpectedApy, riskLabel, reasoning } = route;
  const risk = riskBadge(
    riskLabel === "low" ? 2 : riskLabel === "medium" ? 5 : 8
  );

  return (
    <div className="bg-white border border-neutral-200 rounded-[24px] overflow-hidden">
      {/* Header */}
      <div className="bg-primary-dark p-6 sm:p-8 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(182, 255, 92, 0.5) 0%, rgba(161, 131, 255, 0.3) 100%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-neutral-400 text-[12px] font-bold uppercase">
              On-Chain Routing Engine
            </span>
            <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full ${risk.color}`}>
              {risk.label}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[40px] font-black text-accent-green leading-[1]">
              {totalExpectedApy.toFixed(1)}%
            </span>
            <span className="text-neutral-400 text-[16px] font-bold">
              Expected APY
            </span>
          </div>
          <p className="text-neutral-400 text-[13px] mt-2 font-medium">
            Allocated across {allocations.length} strategies • Composite scored on-chain
          </p>
        </div>
      </div>

      {/* Amount Selector */}
      <div className="px-6 sm:px-8 pt-6">
        <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-2">
          Simulate Deposit
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="flex-1 bg-neutral-50 border-2 border-neutral-200 rounded-[12px] px-4 py-3 text-[18px] font-black text-primary-dark focus:outline-none focus:border-accent-green transition-colors"
          />
          <span className="flex items-center text-[14px] font-bold text-neutral-500 bg-neutral-100 px-4 rounded-[12px]">
            INIT
          </span>
        </div>
      </div>

      {/* Allocation Bars */}
      <div className="px-6 sm:px-8 py-6">
        <h4 className="text-[12px] font-bold text-neutral-500 uppercase mb-4">
          Allocation Breakdown
        </h4>

        {/* Stacked bar */}
        <div className="flex rounded-[12px] overflow-hidden h-8 mb-6">
          {allocations.map((alloc, i) => (
            <div
              key={i}
              className="h-full relative group cursor-pointer transition-opacity hover:opacity-90"
              style={{
                width: `${(alloc.weight * 100)}%`,
                backgroundColor: strategyColor(alloc.opportunity.type),
              }}
            >
              {alloc.weight > 0.15 && (
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white drop-shadow-md">
                  {(alloc.weight * 100).toFixed(0)}%
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Individual allocation cards */}
        <div className="space-y-3">
          {allocations.map((alloc, i) => {
            const opp = alloc.opportunity;
            const color = strategyColor(opp.type);
            return (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-neutral-50 rounded-[16px] border border-neutral-100 hover:border-neutral-200 transition-colors"
              >
                {/* Color dot */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />

                {/* Strategy info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-black text-primary-dark truncate">
                      {opp.protocol}
                    </span>
                    {opp.tags.includes("enshrined") && (
                      <span className="text-[9px] font-black bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full uppercase flex-shrink-0">
                        Initia Native
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-neutral-500 font-medium">
                    {opp.type} • Risk {opp.riskScore}/10
                  </span>
                </div>

                {/* Allocation */}
                <div className="text-right flex-shrink-0">
                  <span className="text-[16px] font-black text-primary-dark block">
                    {(alloc.weight * 100).toFixed(1)}%
                  </span>
                  <span className="text-[12px] font-bold text-neutral-500">
                    {alloc.amount} INIT
                  </span>
                </div>

                {/* APY */}
                <div className="text-right flex-shrink-0 w-[72px]">
                  <span className="text-[18px] font-black block" style={{ color }}>
                    {opp.apy}%
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">
                    APY
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Routing Reasoning */}
      <div className="px-6 sm:px-8 pb-6">
        <h4 className="text-[12px] font-bold text-neutral-500 uppercase mb-3">
          Routing Decision Log
        </h4>
        <div className="bg-neutral-50 rounded-[12px] border border-neutral-100 p-4 space-y-2 max-h-[200px] overflow-y-auto">
          {reasoning.map((line, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-accent-green text-[12px] font-bold flex-shrink-0 mt-0.5">
                ›
              </span>
              <span className="text-[12px] text-neutral-600 font-medium leading-[18px]">
                {line}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Composite Score Explanation */}
      <div className="border-t border-neutral-100 px-6 sm:px-8 py-5 bg-neutral-50/50">
        <div className="flex flex-wrap gap-4 text-[11px] font-bold text-neutral-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            APY Weight: 50%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Risk Weight: 30%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            TVL Weight: 10%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Freshness: 10%
          </span>
        </div>
      </div>
    </div>
  );
}
