import { Reveal } from '@/components/animations/Reveal';

export function PricingHero() {
  return (
    <section className="bg-background py-16 md:py-24 px-6">
      <Reveal distance="2em">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-foreground">
            Transparent Pricing
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            From startup to enterprise, we craft video content that scales with
            your ambition. No hidden fees, just honest pricing and exceptional
            work.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
