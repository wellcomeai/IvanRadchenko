import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/layout/Footer";
import { LandingShell } from "@/components/landing/LandingShell";
import { SchoolLanding } from "@/components/landing/SchoolLanding";

/** Главная «Школы Независимости»: обещание → программа → как учимся → для кого → призыв. */
export default function LandingPage() {
  return (
    <LandingShell>
      <PublicHeader />
      <main>
        <SchoolLanding />
      </main>
      <Footer />
    </LandingShell>
  );
}
