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
      <LandingHero />
      <HowItWorksSection />
      <BattleShowcaseSection />
      <LeaderboardPreviewSection />
      <FeaturesSection />
      <FinalCtaSection />
    </main>
  );
}
