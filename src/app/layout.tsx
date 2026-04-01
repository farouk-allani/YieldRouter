import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "YieldRouter — Maximize Your DeFi Yield on Initia",
  description:
    "YieldRouter automatically finds and routes your assets to the highest-yielding DeFi opportunities on Initia. One deposit, optimized returns.",
  keywords: [
    "DeFi",
    "yield",
    "Initia",
    "aggregator",
    "router",
    "staking",
    "lending",
  ],
  openGraph: {
    title: "YieldRouter — Maximize Your DeFi Yield on Initia",
    description:
      "One deposit. Optimized returns. YieldRouter finds the best yield across Initia DeFi.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-neutral-50 text-primary-dark">
        {children}
      </body>
    </html>
  );
}
