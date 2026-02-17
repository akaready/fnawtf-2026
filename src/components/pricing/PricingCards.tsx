import { RevealGroup } from '@/components/animations/Reveal';
import { PricingCard } from './PricingCard';
import { pricingTiers } from '@/app/pricing/pricing-data';

export function PricingCards() {
  return (
    <section className="py-20 px-6 bg-muted">
      <div className="max-w-7xl mx-auto">
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
