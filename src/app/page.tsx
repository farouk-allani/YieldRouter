import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import RevenueDashboard from "@/components/RevenueDashboard";
import DepositWithdraw from "@/components/DepositWithdraw";
import Yields from "@/components/Yields";
import Security from "@/components/Security";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <RevenueDashboard />
        <DepositWithdraw />
        <Yields />
        <Security />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
