import { RevealGroup } from '@/components/animations/Reveal';
import { PricingCard } from './PricingCard';
import { pricingTiers } from '@/app/pricing/pricing-data';
import { SectionHeader } from '@/components/ui/SectionHeader';

export function PricingCards() {
  return (
    <section className="py-10 px-6 pt-24 bg-black">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title="Three Tiered Engagements"
          subtitle="From startup to enterprise, we craft content that scales with your ambition."
          titleClassName="text-white font-display"
          subtitleClassName="text-white/50"
        />
        <RevealGroup
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          stagger={150}
          distance="2em"
        >
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.id} tier={tier} />
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
