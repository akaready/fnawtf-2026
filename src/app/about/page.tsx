import { AboutHero } from '@/components/about/AboutHero';
import { TeamSection } from '@/components/about/TeamSection';
import { OurStory } from '@/components/about/OurStory';
import { FooterCTA } from '@/components/layout/FooterCTA';

export const metadata = {
  title: 'About Us - FNA.WTF',
  description:
    'Small team, vast network. Friends \'n Allies is a creative marketing partner helping brands become the brand they long to be.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <AboutHero />
      <TeamSection />
      <OurStory />
      <FooterCTA />
    </div>
  );
}
