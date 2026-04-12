"use client";

import { useState, useEffect, useCallback } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import {
  routeDeposit,
  type RouteResult,
} from "@/lib/strategy-router";

// ─── Types ─────────────────────────────────────────────────────────────

type Tab = "deposit" | "withdraw";
type View = "dashboard" | "deposit" | "bridge" | "history";

interface StreamPreview {
  name: string;
  label: string;
  apy: number;
  color: string;
  bgColor: string;
  icon: string;
}

interface TxRecord {
  id: string;
  type: "deposit" | "withdraw" | "harvest" | "rebalance";
  amount: string;
  timestamp: string;
  status: "confirmed" | "pending" | "failed";
  hash: string;
}

const REVENUE_STREAMS: StreamPreview[] = [
  { name: "vault-yield", label: "Vault Yield", apy: 12.4, color: "text-emerald-600", bgColor: "bg-emerald-500", icon: "vault" },
  { name: "staking", label: "Staking Rewards", apy: 6.8, color: "text-violet-600", bgColor: "bg-violet-500", icon: "staking" },
  { name: "lp-fees", label: "LP Trading Fees", apy: 4.2, color: "text-blue-600", bgColor: "bg-blue-500", icon: "swap" },
  { name: "revenue-share", label: "Revenue Share", apy: 2.4, color: "text-amber-600", bgColor: "bg-amber-500", icon: "revenue" },
];

const TOTAL_APY = REVENUE_STREAMS.reduce((s, r) => s + r.apy, 0);

const MOCK_TX_HISTORY: TxRecord[] = [
  { id: "1", type: "deposit", amount: "500.00 INIT", timestamp: "2026-04-01 14:32", status: "confirmed", hash: "0x7a3f...e291" },
  { id: "2", type: "harvest", amount: "+2.41 INIT", timestamp: "2026-03-30 09:15", status: "confirmed", hash: "0x1b8c...a4f3" },
  { id: "3", type: "rebalance", amount: "Strategy Updated", timestamp: "2026-03-28 18:45", status: "confirmed", hash: "0x9e2d...7c01" },
  { id: "4", type: "deposit", amount: "250.00 INIT", timestamp: "2026-03-25 11:20", status: "confirmed", hash: "0x4f6a...b832" },
  { id: "5", type: "harvest", amount: "+1.87 INIT", timestamp: "2026-03-22 16:30", status: "confirmed", hash: "0x3c1e...d594" },
  { id: "6", type: "deposit", amount: "500.00 INIT", timestamp: "2026-03-15 10:00", status: "confirmed", hash: "0x8d4b...f167" },
];

const CHAIN_OPTIONS = [
  { name: "Ethereum", abbr: "E", color: "bg-blue-500" },
  { name: "Osmosis", abbr: "O", color: "bg-purple-500" },
  { name: "Cosmos Hub", abbr: "C", color: "bg-slate-600" },
  { name: "Noble", abbr: "N", color: "bg-blue-400" },
];

// ─── Auto-Sign Session Banner ──────────────────────────────────────────

function AutoSignBanner({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-[16px] border p-4 flex items-center justify-between transition-all ${
      enabled
        ? "bg-emerald-50 border-emerald-200"
        : "bg-neutral-50 border-neutral-200"
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-lg ${
          enabled ? "bg-emerald-100" : "bg-neutral-100"
        }`}>
          {enabled ? <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" /></svg> : <svg className="w-5 h-5 text-neutral-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zM8.5 5.5a1.5 1.5 0 113 0V9h-3V5.5z" clipRule="evenodd" /></svg>}
        </div>
        <div>
          <span className="text-[13px] font-black text-primary-dark block">
            Auto-Sign Session
          </span>
          <span className="text-[11px] text-neutral-500 font-medium">
            {enabled
              ? "Deposits & withdrawals approved without popups"
              : "Enable to skip wallet popups for routine transactions"
            }
          </span>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-12 h-7 rounded-full transition-colors ${
          enabled ? "bg-emerald-500" : "bg-neutral-300"
        }`}
      >
        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          enabled ? "left-6" : "left-1"
        }`} />
      </button>
    </div>
  );
}

// ─── Donut Chart ───────────────────────────────────────────────────────

function DonutChart({ streams }: { streams: StreamPreview[] }) {
  const total = streams.reduce((s, st) => s + st.apy, 0);
  let cumulative = 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative w-[160px] h-[160px] mx-auto">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        {streams.map((stream, i) => {
          const pct = stream.apy / total;
          const offset = cumulative * circumference;
          cumulative += pct;
          return (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={stream.bgColor.replace("bg-", "").includes("emerald") ? "#10b981"
                : stream.bgColor.includes("violet") ? "#8b5cf6"
                : stream.bgColor.includes("blue") ? "#3b82f6"
                : "#f59e0b"}
              strokeWidth="16"
              strokeDasharray={`${pct * circumference} ${circumference - pct * circumference}`}
              strokeDashoffset={-offset}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-black text-primary-dark">{total.toFixed(1)}%</span>
        <span className="text-[10px] font-bold text-neutral-400 uppercase">APY</span>
      </div>
    </div>
  );
}

// ─── Revenue Sparkline ─────────────────────────────────────────────────

function RevenueSparkline() {
  const data = [12, 14, 13, 16, 15, 18, 17, 20, 19, 22, 21, 24, 23, 25, 25.8];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const h = 60;
  const w = 240;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[60px]">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b6ff5c" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#b6ff5c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill="url(#sparkGrad)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="#b6ff5c"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Auto-Sign Session Modal ───────────────────────────────────────────

function AutoSignModal({ onClose, onEnable }: { onClose: () => void; onEnable: () => void }) {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[24px] max-w-[440px] w-full p-8 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 text-xl">✕</button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            {step === 0 ? "01" : step === 1 ? "02" : "03"}
          </div>
          <h3 className="text-[20px] font-black uppercase">
            {step === 0 ? "Auto-Sign Session" : step === 1 ? "Set Spending Limit" : "Session Active"}
          </h3>
          <p className="text-[13px] text-neutral-500 font-medium mt-2">
            {step === 0
              ? "Approve deposits and withdrawals without repeated wallet popups. Your session is secured with a spending cap."
              : step === 1
              ? "Choose a maximum amount for auto-signed transactions. You can revoke anytime."
              : "Auto-signing is now active for deposits up to your configured limit. Revoke anytime from settings."
            }
          </p>
        </div>

        {step === 0 && (
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-[12px]">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <div>
                <span className="text-[13px] font-bold text-primary-dark block">No popups for routine txs</span>
                <span className="text-[11px] text-neutral-500">Deposit & withdraw without repeated signing</span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-[12px]">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <div>
                <span className="text-[13px] font-bold text-primary-dark block">Spending cap enforced</span>
                <span className="text-[11px] text-neutral-500">Large transactions still require confirmation</span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-[12px]">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <div>
                <span className="text-[13px] font-bold text-primary-dark block">Revoke anytime</span>
                <span className="text-[11px] text-neutral-500">Session expires after 24 hours or manual revoke</span>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 mb-6">
            {["500 INIT", "1,000 INIT", "5,000 INIT"].map((limit, i) => (
              <button
                key={i}
                onClick={() => setStep(2)}
                className={`w-full p-4 rounded-[16px] border-2 text-left transition-all ${
                  i === 1 ? "border-accent-green bg-accent-green/5" : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <span className="text-[16px] font-black text-primary-dark block">{limit}</span>
                <span className="text-[11px] text-neutral-500 font-medium">
                  {i === 0 ? "Conservative — for testing" : i === 1 ? "Recommended — most users" : "Power user — high throughput"}
                </span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="mb-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-[16px] p-5 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <span className="text-[14px] font-black text-emerald-700 block">Session Active</span>
              <span className="text-[12px] text-emerald-600">Auto-signing enabled for 24 hours</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-neutral-400 font-medium">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>Session key: 0x7a3f...e291 • Expires: Apr 3, 2026 14:32</span>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            if (step < 2) setStep(step + 1);
            else { onEnable(); onClose(); }
          }}
          className="w-full py-4 rounded-[44px] bg-accent-green text-primary-dark font-black text-[14px] uppercase tracking-wide hover:bg-[#a5ed4b] transition-colors"
        >
          {step === 0 ? "Enable Auto-Sign" : step === 1 ? "Confirm Limit" : "Start Earning"}
        </button>
      </div>
    </div>
  );
}

// ─── Bridge Flow Panel ─────────────────────────────────────────────────

function BridgePanel({ onClose }: { onClose: () => void }) {
  const { openBridge, openDeposit } = useInterwovenKit();

  return (
    <div className="bg-white border border-neutral-200 rounded-[24px] overflow-hidden">
      <div className="bg-primary-dark p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{ backgroundImage: "linear-gradient(135deg, rgba(182, 255, 92, 0.5) 0%, rgba(161, 131, 255, 0.3) 100%)" }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="text-neutral-400 text-[12px] font-bold uppercase">Interwoven Bridge</span>
            <h3 className="text-[20px] font-black text-white mt-1">Bridge to Initia</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-[14px] text-neutral-600 font-medium">
          Bridge assets from any supported chain into Initia via the Interwoven Bridge. Funds arrive in ~2 minutes and can be deposited into the vault immediately.
        </p>

        <div className="bg-neutral-50 rounded-[16px] p-5 space-y-3">
          <h4 className="text-[12px] font-bold text-neutral-500 uppercase">Supported Source Chains</h4>
          <div className="grid grid-cols-2 gap-3">
            {CHAIN_OPTIONS.map((chain, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-[12px] p-3 border border-neutral-200">
                <div className={`w-8 h-8 ${chain.color} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                  {chain.name.charAt(0)}
                </div>
                <span className="text-[13px] font-bold text-primary-dark">{chain.name}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => openBridge()}
          className="w-full py-4 rounded-[44px] bg-accent-green text-primary-dark font-black text-[14px] uppercase tracking-wide hover:bg-[#a5ed4b] transition-colors"
        >
          Open Interwoven Bridge
        </button>

        <button
          onClick={() => openDeposit({ denoms: ["uinit", "uusdc"] })}
          className="w-full py-4 rounded-[44px] border-2 border-neutral-200 text-primary-dark font-black text-[14px] uppercase tracking-wide hover:bg-neutral-50 transition-colors"
        >
          Quick Deposit (INIT / USDC)
        </button>

        <p className="text-[11px] text-neutral-400 text-center font-medium">
          Powered by InterwovenKit — bridge fees are typically 0.1% with ~2 min confirmation
        </p>
      </div>
    </div>
  );
}

// ─── Tx History Panel ──────────────────────────────────────────────────

function TxHistory() {
  const typeColors: Record<string, string> = {
    deposit: "bg-emerald-100 text-emerald-700",
    withdraw: "bg-amber-100 text-amber-700",
    harvest: "bg-blue-100 text-blue-700",
    rebalance: "bg-violet-100 text-violet-700",
  };

  const typeIcons: Record<string, React.ReactNode> = {
    deposit: <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.24a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z" clipRule="evenodd" /></svg>,
    withdraw: <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-4.75a.75.75 0 001.5 0V8.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0L6.2 9.74a.75.75 0 001.1 1.02l1.95-2.1v4.59z" clipRule="evenodd" /></svg>,
    harvest: <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" /></svg>,
    rebalance: <svg className="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M13.2 2.24a.75.75 0 00.04 1.06l2.1 1.95H6.75a.75.75 0 000 1.5h8.59l-2.1 1.95a.75.75 0 101.02 1.1l3.5-3.25a.75.75 0 000-1.1l-3.5-3.25a.75.75 0 00-1.06.04zm-6.4 8a.75.75 0 00-1.06-.04l-3.5 3.25a.75.75 0 000 1.1l3.5 3.25a.75.75 0 001.02-1.1l-2.1-1.95h8.59a.75.75 0 000-1.5H4.66l2.1-1.95a.75.75 0 00.04-1.06z" clipRule="evenodd" /></svg>,
  };

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-[24px] overflow-hidden">
      <div className="px-6 py-5 border-b border-neutral-200">
        <h4 className="text-[14px] font-black text-primary-dark uppercase">Transaction History</h4>
      </div>
      <div className="divide-y divide-neutral-200">
        {MOCK_TX_HISTORY.map((tx) => (
          <div key={tx.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white transition-colors">
            <div className="text-xl">{typeIcons[tx.type]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${typeColors[tx.type]}`}>
                  {tx.type}
                </span>
                <span className="text-[13px] font-bold text-primary-dark">{tx.amount}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-neutral-400 font-medium">{tx.timestamp}</span>
                <span className="text-[10px] font-mono text-neutral-300">{tx.hash}</span>
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full ${
              tx.status === "confirmed" ? "bg-emerald-500" : tx.status === "pending" ? "bg-amber-500" : "bg-red-500"
            }`} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App Page ─────────────────────────────────────────────────────

export default function AppPage() {
  const { isConnected, openConnect, address, username, autoSign: autoSignKit } = useInterwovenKit();
  const [view, setView] = useState<View>("dashboard");
  const [tab, setTab] = useState<Tab>("deposit");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);

  // Use real InterwovenKit auto-sign state
  const autoSignEnabled = Object.values(autoSignKit?.isEnabledByChain ?? {}).some(Boolean);

  const parsedAmount = parseFloat(amount) || 0;
  const estimatedDaily = (parsedAmount * TOTAL_APY) / 100 / 365;
  const estimatedMonthly = estimatedDaily * 30;
  const estimatedYearly = (parsedAmount * TOTAL_APY) / 100;

  useEffect(() => {
    routeDeposit(1000).then(setRoute);
  }, []);

  const handleDeposit = useCallback(async () => {
    if (!isConnected || parsedAmount <= 0) return;
    setIsSubmitting(true);
    setTxHash(null);
    try {
      await new Promise((r) => setTimeout(r, autoSignEnabled ? 800 : 2000));
      setTxHash(`0x${Math.random().toString(16).slice(2, 18)}...`);
      setAmount("");
    } finally {
      setIsSubmitting(false);
    }
  }, [isConnected, parsedAmount, autoSignEnabled]);

  const handleWithdraw = useCallback(async () => {
    if (!isConnected || parsedAmount <= 0) return;
    setIsSubmitting(true);
    setTxHash(null);
    try {
      await new Promise((r) => setTimeout(r, autoSignEnabled ? 800 : 2000));
      setTxHash(`0x${Math.random().toString(16).slice(2, 18)}...`);
      setAmount("");
    } finally {
      setIsSubmitting(false);
    }
  }, [isConnected, parsedAmount, autoSignEnabled]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
        <div className="max-w-[420px] w-full text-center">
          <div className="w-8 h-8 bg-accent-green rounded-lg flex items-center justify-center mx-auto mb-6">
            <span className="text-primary-dark font-black text-sm">YR</span>
          </div>
          <h1 className="text-[28px] font-black uppercase mb-3">Connect to YieldRouter</h1>
          <p className="text-neutral-500 text-[14px] font-medium mb-8">
            Connect your wallet to access the yield dashboard, deposit funds, and start earning from 4 revenue streams.
          </p>
          <button
            onClick={openConnect}
            className="w-full bg-accent-green text-primary-dark px-8 py-4 rounded-[44px] font-black text-[16px] uppercase tracking-wide hover:bg-[#a5ed4b] transition-colors"
          >
            Connect Wallet
          </button>
          <p className="text-[12px] text-neutral-400 mt-4 font-medium">
            Supports .init usernames, MinieWallet & more
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 backdrop-blur-[6px] bg-[rgba(255,255,255,0.85)] border-b border-neutral-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-accent-green rounded-lg flex items-center justify-center">
                <span className="text-primary-dark font-black text-xs">YR</span>
              </div>
              <span className="font-black text-sm uppercase tracking-tight text-primary-dark hidden sm:block">YieldRouter</span>
            </a>
            <nav className="hidden sm:flex items-center gap-1">
              {([
                { id: "dashboard" as View, label: "Dashboard" },
                { id: "deposit" as View, label: "Deposit" },
                { id: "bridge" as View, label: "Bridge" },
                { id: "history" as View, label: "History" },
              ]).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`px-4 py-2 rounded-[10px] text-[13px] font-bold transition-colors ${
                    view === item.id
                      ? "bg-primary-dark text-white"
                      : "text-neutral-500 hover:text-primary-dark hover:bg-neutral-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-neutral-100 rounded-[10px] px-3 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-[12px] font-bold text-primary-dark">
                {username || `${address?.slice(0, 10)}...`}
              </span>
            </div>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="sm:hidden flex border-t border-neutral-200">
          {(["dashboard", "deposit", "bridge", "history"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-3 text-[12px] font-bold uppercase transition-colors ${
                view === v ? "text-primary-dark border-b-2 border-accent-green" : "text-neutral-400"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8">
        {/* Dashboard View */}
        {view === "dashboard" && (
          <div className="space-y-6">
            {/* Welcome */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-[24px] sm:text-[32px] font-black uppercase">
                  Welcome back, {username?.replace(".init", "") || "Anon"}
                </h1>
                <p className="text-[14px] text-neutral-500 font-medium mt-1">
                  Your deposits are earning across {REVENUE_STREAMS.length} revenue streams
                </p>
              </div>
              <button
                onClick={() => setView("deposit")}
                className="bg-accent-green text-primary-dark px-6 py-3 rounded-[44px] font-black text-[13px] uppercase tracking-wide hover:bg-[#a5ed4b] transition-colors w-fit"
              >
                + New Deposit
              </button>
            </div>

            {/* Auto-sign banner */}
            <AutoSignBanner
              enabled={autoSignEnabled}
              onToggle={() => autoSignEnabled ? autoSignKit.disable() : autoSignKit.enable()}
            />

            {/* Position Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Deposited", value: "$1,312.50", sub: "1,250 shares", color: "text-primary-dark" },
                { label: "Total Earned", value: "$62.50", sub: "+4.8% since deposit", color: "text-emerald-600" },
                { label: "Daily Earnings", value: "$0.89", sub: `${TOTAL_APY.toFixed(1)}% APY`, color: "text-primary-dark" },
                { label: "Current Strategy", value: "3 Active", sub: "Auto-rebalancing", color: "text-primary-dark" },
              ].map((card, i) => (
                <div key={i} className="bg-white border border-neutral-200 rounded-[20px] p-5">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase block mb-2">{card.label}</span>
                  <span className={`text-[24px] font-black block leading-[1] ${card.color}`}>{card.value}</span>
                  <span className="text-[11px] text-neutral-500 font-medium mt-1 block">{card.sub}</span>
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Streams */}
              <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-[24px] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[14px] font-black text-primary-dark uppercase">Revenue Streams</h3>
                  <div className="flex items-center gap-1 bg-neutral-100 rounded-full px-1 py-1">
                    {["24h", "7d", "30d"].map((p) => (
                      <button key={p} className="px-3 py-1 rounded-full text-[11px] font-bold text-neutral-500 hover:text-primary-dark transition-colors">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {REVENUE_STREAMS.map((stream) => (
                    <div key={stream.name} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-[16px] border border-neutral-100">
                      <div className="text-2xl">{stream.icon}</div>
                      <div className="flex-1">
                        <span className="text-[13px] font-bold text-primary-dark block">{stream.label}</span>
                        <div className="bg-neutral-200 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${stream.bgColor}`}
                            style={{ width: `${(stream.apy / TOTAL_APY) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className={`text-[20px] font-black ${stream.color}`}>{stream.apy}%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-neutral-500">Combined APY</span>
                    <span className="text-[24px] font-black text-accent-green">{TOTAL_APY.toFixed(1)}%</span>
                  </div>
                  <RevenueSparkline />
                </div>
              </div>

              {/* Allocation Donut + Breakdown */}
              <div className="space-y-6">
                <div className="bg-white border border-neutral-200 rounded-[24px] p-6">
                  <h3 className="text-[14px] font-black text-primary-dark uppercase mb-4">Allocation</h3>
                  <DonutChart streams={REVENUE_STREAMS} />
                  <div className="space-y-2 mt-4">
                    {REVENUE_STREAMS.map((stream) => (
                      <div key={stream.name} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${stream.bgColor}`} />
                        <span className="text-[12px] text-neutral-600 font-medium flex-1">{stream.label}</span>
                        <span className="text-[12px] font-bold text-primary-dark">
                          {((stream.apy / TOTAL_APY) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-primary-dark rounded-[24px] p-6 relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none opacity-20"
                    style={{ backgroundImage: "linear-gradient(135deg, rgba(182, 255, 92, 0.5) 0%, rgba(161, 131, 255, 0.3) 100%)" }}
                  />
                  <div className="relative z-10 space-y-3">
                    <h3 className="text-[13px] font-bold text-neutral-400 uppercase">Quick Actions</h3>
                    <button
                      onClick={() => setView("deposit")}
                      className="w-full bg-accent-green text-primary-dark py-3 rounded-[14px] font-black text-[13px] uppercase hover:bg-[#a5ed4b] transition-colors"
                    >
                      Deposit
                    </button>
                    <button
                      onClick={() => { setView("deposit"); setTab("withdraw"); }}
                      className="w-full bg-dark-surface text-white py-3 rounded-[14px] font-bold text-[13px] uppercase hover:bg-dark-border transition-colors"
                    >
                      Withdraw
                    </button>
                    <button
                      onClick={() => setView("bridge")}
                      className="w-full border border-dark-border text-neutral-400 py-3 rounded-[14px] font-bold text-[13px] uppercase hover:text-white hover:border-neutral-400 transition-colors"
                    >
                      Bridge Funds
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <TxHistory />
          </div>
        )}

        {/* Deposit View */}
        {view === "deposit" && (
          <div className="max-w-[640px] mx-auto">
            <div className="mb-6">
              <button onClick={() => setView("dashboard")} className="text-[13px] font-bold text-neutral-400 hover:text-primary-dark transition-colors">
                ← Back to Dashboard
              </button>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-[24px] overflow-hidden">
              <div className="flex border-b border-neutral-200">
                <button
                  onClick={() => { setTab("deposit"); setTxHash(null); }}
                  className={`flex-1 py-4 text-[14px] font-black uppercase transition-colors ${
                    tab === "deposit" ? "text-primary-dark bg-white border-b-2 border-accent-green" : "text-neutral-400"
                  }`}
                >
                  Deposit
                </button>
                <button
                  onClick={() => { setTab("withdraw"); setTxHash(null); }}
                  className={`flex-1 py-4 text-[14px] font-black uppercase transition-colors ${
                    tab === "withdraw" ? "text-primary-dark bg-white border-b-2 border-accent-green" : "text-neutral-400"
                  }`}
                >
                  Withdraw
                </button>
              </div>

              <div className="p-6 sm:p-8">
                <AutoSignBanner
                  enabled={autoSignEnabled}
                  onToggle={() => autoSignEnabled ? autoSignKit.disable() : autoSignKit.enable()}
                />

                <div className="mt-6 mb-6">
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
                      className="w-full bg-white border-2 border-neutral-200 rounded-[16px] px-5 py-4 text-[24px] font-black text-primary-dark placeholder:text-neutral-300 focus:outline-none focus:border-accent-green transition-colors"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <span className="text-[14px] font-bold text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-[10px]">INIT</span>
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

                {tab === "deposit" && parsedAmount > 0 && (
                  <div className="bg-white border border-neutral-200 rounded-[16px] p-5 mb-6">
                    <h4 className="text-[12px] font-bold text-neutral-500 uppercase mb-4">Estimated Returns</h4>
                    <div className="space-y-3">
                      {REVENUE_STREAMS.map((stream) => {
                        const daily = (parsedAmount * stream.apy) / 100 / 365;
                        return (
                          <div key={stream.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span>{stream.icon}</span>
                              <span className="text-[13px] font-semibold text-neutral-600">{stream.label}</span>
                              <span className="text-[11px] font-bold text-neutral-400">{stream.apy}%</span>
                            </div>
                            <span className={`text-[14px] font-black ${stream.color}`}>+${daily.toFixed(4)}/day</span>
                          </div>
                        );
                      })}
                    </div>
                    <hr className="border-neutral-100 my-4" />
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-neutral-400 uppercase block">Daily</span>
                        <span className="text-[16px] font-black text-primary-dark">${estimatedDaily.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-neutral-400 uppercase block">Monthly</span>
                        <span className="text-[16px] font-black text-primary-dark">${estimatedMonthly.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-neutral-400 uppercase block">Yearly</span>
                        <span className="text-[18px] font-black text-accent-green">${estimatedYearly.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

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
                      {autoSignEnabled ? "Submitting..." : "Awaiting Signature..."}
                    </span>
                  ) : tab === "deposit" ? "Deposit & Start Earning" : "Withdraw"}
                </button>

                {autoSignEnabled && parsedAmount > 0 && (
                  <p className="text-[11px] text-emerald-600 text-center mt-3 font-medium">
                    Auto-sign active — no wallet popup required
                  </p>
                )}

                {txHash && (
                  <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-[12px] p-4">
                    <p className="text-[13px] font-bold text-emerald-700">Transaction submitted</p>
                    <p className="text-[11px] text-emerald-600 mt-1 font-mono">{txHash}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Strategy Allocation Preview */}
            {route && (
              <div className="mt-6 bg-white border border-neutral-200 rounded-[24px] p-6">
                <h4 className="text-[12px] font-bold text-neutral-500 uppercase mb-4">Your Deposit Will Be Routed To</h4>
                <div className="flex rounded-[12px] overflow-hidden h-6 mb-4">
                  {route.allocations.map((alloc, i) => {
                    const colors = ["bg-emerald-500", "bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-red-500", "bg-cyan-500"];
                    return (
                      <div
                        key={i}
                        className="h-full relative flex items-center justify-center"
                        style={{ width: `${alloc.weight * 100}%`, backgroundColor: colors[i % colors.length] }}
                      >
                        {alloc.weight > 0.15 && (
                          <span className="text-[9px] font-black text-white drop-shadow">
                            {(alloc.weight * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  {route.allocations.map((alloc, i) => (
                    <div key={i} className="flex items-center justify-between text-[12px]">
                      <span className="text-neutral-600 font-medium">{alloc.opportunity.protocol}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-400">{alloc.opportunity.apy}% APY</span>
                        <span className="font-bold text-primary-dark">{(alloc.weight * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bridge View */}
        {view === "bridge" && (
          <div className="max-w-[560px] mx-auto">
            <div className="mb-6">
              <button onClick={() => setView("dashboard")} className="text-[13px] font-bold text-neutral-400 hover:text-primary-dark transition-colors">
                ← Back to Dashboard
              </button>
            </div>
            <BridgePanel onClose={() => setView("dashboard")} />
          </div>
        )}

        {/* History View */}
        {view === "history" && (
          <div>
            <div className="mb-6">
              <h2 className="text-[24px] font-black uppercase">Transaction History</h2>
              <p className="text-[14px] text-neutral-500 font-medium mt-1">All on-chain activity for your vault position</p>
            </div>
            <TxHistory />
          </div>
        )}
      </div>
    </div>
  );
}
