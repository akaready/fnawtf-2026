import { PricingHero } from '@/components/pricing/PricingHero';
import { PricingCards } from '@/components/pricing/PricingCards';
import { AddOnCalculator } from '@/components/pricing/AddOnCalculator';
import { FooterCTA } from '@/components/layout/FooterCTA';

import { getPageSeo } from '@/lib/seo';

export async function generateMetadata() {
  return getPageSeo('/pricing', {
    title: 'Pricing - FNA.WTF',
    description: 'Transparent pricing for video production services. Build, Launch, and Scale packages with interactive add-on calculator.',
  });
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PricingHero />
      <PricingCards />
      <AddOnCalculator />
      <FooterCTA />
    </div>
  );
}
