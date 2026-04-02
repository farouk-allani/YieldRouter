import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import InterwovenProvider from "@/components/InterwovenProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "YieldRouter — Maximize Your DeFi Yield on Initia",
  description:
    "YieldRouter automatically finds and routes your assets to the highest-yielding DeFi opportunities on Initia. One deposit, optimized returns across 4 revenue streams: vault yield, staking, LP fees, and revenue share.",
  keywords: [
    "DeFi",
    "yield",
    "yield aggregator",
    "Initia",
    "init",
    "enshrined liquidity",
    "staking",
    "LP",
    "lending",
    "farming",
    "revenue share",
  ],
  authors: [{ name: "Farouk Allani" }],
  metadataBase: new URL("https://yieldrouter.finance"),
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "YieldRouter — Maximize Your DeFi Yield on Initia",
    description:
      "One deposit → 25.8% APY. Route your yield across vault yield, Enshrined staking, LP fees, and revenue share. The revenue flywheel for Initia.",
    url: "https://yieldrouter.finance",
    siteName: "YieldRouter",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "YieldRouter — Revenue Flywheel Yield Aggregator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YieldRouter — Maximize Your DeFi Yield on Initia",
    description:
      "One deposit → 25.8% APY. 4 revenue streams: vault yield, Enshrined staking, LP fees, revenue share.",
    creator: "@farouk_allani",
    images: ["/og-image.png"],
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
        <InterwovenProvider>{children}</InterwovenProvider>
      </body>
    </html>
  );
}
