"use client";

import { useState } from "react";

const faqs = [
  {
    question: "What is YieldRouter?",
    answer:
      "YieldRouter is a DeFi yield aggregator built on Initia. It automatically scans all available protocols and routes your assets to the highest-yielding opportunities, rebalancing as conditions change.",
  },
  {
    question: "Is YieldRouter safe?",
    answer:
      "Yes. YieldRouter is non-custodial — your assets always stay in your control. Our smart contracts are audited, and every routing decision is transparent and verifiable on-chain.",
  },
  {
    question: "What chains does YieldRouter support?",
    answer:
      "YieldRouter is built exclusively for the Initia ecosystem, leveraging its interwoven architecture to access yield opportunities across all Initia appchains.",
  },
  {
    question: "How does auto-rebalancing work?",
    answer:
      "Our routing engine continuously monitors APYs across all supported protocols. When a better opportunity is detected, it automatically reallocates your assets to maximize returns — no action needed from you.",
  },
  {
    question: "What are the fees?",
    answer:
      "YieldRouter charges a small performance fee (0.5%) on profits earned. There are no deposit or withdrawal fees. You only pay when you earn.",
  },
  {
    question: "Do I need to stake or lock my tokens?",
    answer:
      "No lock-ups required. You can withdraw your assets at any time. YieldRouter is designed for maximum flexibility.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-20">
        <div className="max-w-[720px] mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="bg-accent-green px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-[-0.6px] text-primary-dark mb-4 inline-block">
              FAQ
            </span>
            <h2 className="text-[36px] sm:text-[48px] font-black uppercase leading-[1.1] tracking-tight mt-4">
              Common{" "}
              <span className="bg-accent-green px-3 py-1 rounded-2xl inline-block">
                Questions
              </span>
            </h2>
          </div>

          {/* Accordion */}
          <div className="flex flex-col gap-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-neutral-50 rounded-[20px] border border-neutral-200 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className="text-[16px] font-black text-primary-dark pr-4">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-neutral-400 flex-shrink-0 transition-transform ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-5">
                    <p className="text-neutral-600 text-[14px] leading-[20px] font-medium">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
