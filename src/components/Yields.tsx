"use client";

import { useState, useEffect, useMemo } from "react";
import {
  scanYieldOpportunities,
  rankOpportunities,
  type ScanResult,
} from "@/lib/strategy-router";
import type { YieldOpportunity, ProtocolType } from "@/lib/adapters";

const FILTERS: { label: string; type: ProtocolType | "all" }[] = [
  { label: "All", type: "all" },
  { label: "Lending", type: "lending" },
  { label: "LP", type: "lp" },
  { label: "Enshrined LP", type: "enshrined-lp" },
  { label: "Staking", type: "staking" },
  { label: "Farming", type: "farming" },
  { label: "Vault", type: "vault" },
  { label: "Stable LP", type: "stable-lp" },
];

function riskColor(risk: number): string {
  if (risk <= 3) return "bg-green-100 text-green-700";
  if (risk <= 6) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

function riskLabel(risk: number): string {
  if (risk <= 3) return "Low";
  if (risk <= 6) return "Medium";
  return "High";
}

export default function Yields() {
  const [activeFilter, setActiveFilter] = useState<ProtocolType | "all">("all");
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    scanYieldOpportunities().then((result) => {
      if (mounted) {
        setScan(result);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!scan) return [];
    const opps =
      activeFilter === "all"
        ? scan.opportunities
        : scan.opportunities.filter((o) => o.type === activeFilter);
    return rankOpportunities(opps);
  }, [scan, activeFilter]);

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
          {FILTERS.map((filter) => (
            <button
              key={filter.type}
              onClick={() => setActiveFilter(filter.type)}
              className={`px-6 py-2 rounded-[24px] text-[14px] font-black whitespace-nowrap transition-colors ${
                activeFilter === filter.type
                  ? "bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-primary-dark"
                  : "text-neutral-500 hover:text-primary-dark"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        {scan && (
          <div className="flex flex-wrap gap-6 mb-6 text-[13px] font-bold text-neutral-500">
            <span>
              {filtered.length} opportunit{filtered.length === 1 ? "y" : "ies"}
            </span>
            <span>•</span>
            <span>Avg APY: {scan.averageApy}%</span>
            <span>•</span>
            <span>
              Total TVL: ${(scan.totalTvlUsd / 1_000_000).toFixed(1)}M
            </span>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-[24px] border border-neutral-200 overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-4 px-8 py-4 border-b border-neutral-200 bg-neutral-50">
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
            <span className="text-[12px] font-black uppercase tracking-[-0.6px] text-neutral-400 text-right">
              Score
            </span>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="px-8 py-12 text-center text-neutral-400 font-bold animate-pulse">
              Scanning protocols...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-8 py-12 text-center text-neutral-400 font-bold">
              No opportunities found for this filter
            </div>
          ) : (
            filtered.map((score, i) => {
              const opp = score.opportunity;
              const isTop = i === 0;
              return (
                <div
                  key={opp.id}
                  className={`grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-4 px-8 py-5 border-b border-neutral-200 last:border-b-0 items-center hover:bg-neutral-50 transition-colors ${
                    isTop ? "bg-accent-green/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-[14px] font-black ${
                        isTop
                          ? "bg-accent-green text-primary-dark"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {opp.protocol.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[14px] font-black text-primary-dark block">
                        {opp.protocol}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold text-neutral-400">
                          {opp.type}
                        </span>
                        {opp.tags.includes("enshrined") && (
                          <span className="text-[10px] font-black bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full uppercase">
                            Initia Native
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[20px] font-black ${
                      isTop ? "text-accent-green" : "text-primary-dark"
                    }`}
                  >
                    {opp.apy}%
                  </span>
                  <span className="text-[14px] font-bold text-neutral-600">
                    {opp.tvl}
                  </span>
                  <span
                    className={`text-[12px] font-black uppercase tracking-[-0.6px] px-3 py-1 rounded-full w-fit ${riskColor(
                      opp.riskScore
                    )}`}
                  >
                    {riskLabel(opp.riskScore)}
                  </span>
                  <span className="text-[14px] font-bold text-neutral-400 text-right">
                    {score.compositeScore.toFixed(1)}
                  </span>
                </div>
              );
            })
          )}
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
