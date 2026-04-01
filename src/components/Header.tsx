"use client";

import { useState } from "react";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-[6px] bg-[rgba(255,255,255,0.8)] border-b border-neutral-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-20 flex items-center justify-between h-16 sm:h-20">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-green rounded-lg flex items-center justify-center">
            <span className="text-primary-dark font-black text-sm">YR</span>
          </div>
          <span className="font-black text-lg sm:text-xl uppercase tracking-tight text-primary-dark">
            YieldRouter
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#how-it-works"
            className="text-sm font-semibold text-neutral-500 hover:text-primary-dark transition-colors"
          >
            How It Works
          </a>
          <a
            href="#yields"
            className="text-sm font-semibold text-neutral-500 hover:text-primary-dark transition-colors"
          >
            Yields
          </a>
          <a
            href="#security"
            className="text-sm font-semibold text-neutral-500 hover:text-primary-dark transition-colors"
          >
            Security
          </a>
          <a
            href="#faq"
            className="text-sm font-semibold text-neutral-500 hover:text-primary-dark transition-colors"
          >
            FAQ
          </a>
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="#"
            className="text-sm font-bold text-primary-dark hover:text-accent-purple transition-colors"
          >
            Connect Wallet
          </a>
          <a
            href="#app"
            className="bg-accent-green text-primary-dark px-6 py-3 rounded-[44px] font-black text-[14px] uppercase tracking-wide hover:bg-[#a5ed4b] transition-colors"
          >
            Launch App
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
        >
          <span
            className={`w-6 h-0.5 bg-primary-dark transition-all ${mobileOpen ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`w-6 h-0.5 bg-primary-dark transition-all ${mobileOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`w-6 h-0.5 bg-primary-dark transition-all ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white">
          <div className="px-4 py-6 flex flex-col gap-4">
            <a href="#how-it-works" className="font-semibold text-neutral-600">
              How It Works
            </a>
            <a href="#yields" className="font-semibold text-neutral-600">
              Yields
            </a>
            <a href="#security" className="font-semibold text-neutral-600">
              Security
            </a>
            <a href="#faq" className="font-semibold text-neutral-600">
              FAQ
            </a>
            <hr className="border-neutral-200" />
            <a
              href="#app"
              className="bg-accent-green text-primary-dark px-6 py-3 rounded-[44px] font-black text-[14px] uppercase text-center"
            >
              Launch App
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
