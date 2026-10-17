import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/layout/Footer";
import { LandingShell } from "@/components/landing/LandingShell";
import { Hero } from "@/components/landing/Hero";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { HowToStartSection } from "@/components/landing/HowToStart";
import { VideoSection } from "@/components/landing/VideoSection";
import { WhatInside } from "@/components/landing/WhatInside";
import { MentorAgentSection } from "@/components/landing/MentorAgent";
import { OpenSourceSection } from "@/components/landing/OpenSource";
import { WhatCanCreate } from "@/components/landing/WhatCanCreate";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { CourseSection } from "@/components/landing/Course";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";

/**
 * Порядок секций — воронка: обещание и демо → совместимость → как начать →
 * видео → что уже внутри → наставник → доверие (open source) → идеи →
 * живое демо → курс → вопросы → финальный призыв.
 */
export default function LandingPage() {
  return (
    <LandingShell>
      <PublicHeader />
      <main>
        <Hero />
        <TrustStrip />
        <HowToStartSection />
        <VideoSection />
        <WhatInside />
        <MentorAgentSection />
        <OpenSourceSection />
        <WhatCanCreate />
        <LiveDemo />
        <CourseSection />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </LandingShell>
  );
}
