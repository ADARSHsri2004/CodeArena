import {
  BattleShowcaseSection,
  FeaturesSection,
  FinalCtaSection,
  HowItWorksSection,
  LandingHero,
  LeaderboardPreviewSection,
} from "@/features/landing/landing-sections";

export function LandingPage() {
  return (
    <main className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_70%)]"
      />
      <LandingHero />
      <HowItWorksSection />
      <BattleShowcaseSection />
      <LeaderboardPreviewSection />
      <FeaturesSection />
      <FinalCtaSection />
    </main>
  );
}
