import { Reveal } from '@/components/animations/Reveal';
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
    <div className="min-h-screen bg-background pt-24">
      {/* Page header — matches Work and Pricing pattern */}
      <section className="py-16 md:py-24 px-6">
        <Reveal distance="2em">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-foreground">
              About Us
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              We help brands become the brand they long to be.
            </p>
          </div>
        </Reveal>
      </section>

      <AboutHero />
      <TeamSection />
      <OurStory />
      <FooterCTA />
    </div>
  );
}
