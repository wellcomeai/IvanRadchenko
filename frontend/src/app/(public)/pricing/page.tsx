import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/layout/Footer";
import { LandingShell } from "@/components/landing/LandingShell";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";

export default function PricingPage() {
  return (
    <LandingShell>
      <PublicHeader />
      <main style={{ paddingTop: '76px' }}>
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </LandingShell>
  );
}
