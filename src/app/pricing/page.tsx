import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';

/**
 * Pricing Page
 * 
 * Displays pricing tiers and booking options.
 */
export default async function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation currentPage="pricing" />
      
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground mb-6">
            Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Transparent pricing for every stage of your brand journey.
          </p>
        </div>
      </section>
      
      <section className="px-4 pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter */}
          <div className="p-8 border border-border rounded-lg">
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Starter</h2>
            <p className="text-4xl font-bold text-foreground mb-6">$5K<span className="text-lg text-muted-foreground">起</span></p>
            <ul className="space-y-3 text-muted-foreground mb-8">
              <li>✓ Brand Strategy Session</li>
              <li>✓ Visual Identity</li>
              <li>✓ 2 Revision Rounds</li>
              <li>✓ 2 Week Turnaround</li>
            </ul>
            <a href="/contact" className="block text-center py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors">
              Get Started
            </a>
          </div>
          
          {/* Professional */}
          <div className="p-8 border border-accent rounded-lg bg-accent/5">
            <div className="text-sm text-accent font-semibold mb-2">Most Popular</div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Professional</h2>
            <p className="text-4xl font-bold text-foreground mb-6">$15K<span className="text-lg text-muted-foreground">起</span></p>
            <ul className="space-y-3 text-muted-foreground mb-8">
              <li>✓ Everything in Starter</li>
              <li>✓ Video Production</li>
              <li>✓ Launch Page Design</li>
              <li>✓ 4 Revision Rounds</li>
              <li>✓ 4 Week Turnaround</li>
            </ul>
            <a href="/contact" className="block text-center py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors">
              Get Started
            </a>
          </div>
          
          {/* Enterprise */}
          <div className="p-8 border border-border rounded-lg">
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Enterprise</h2>
            <p className="text-4xl font-bold text-foreground mb-6">Custom</p>
            <ul className="space-y-3 text-muted-foreground mb-8">
              <li>✓ Full Brand Package</li>
              <li>✓ Ongoing Video Content</li>
              <li>✓ AI Integrations</li>
              <li>✓ Priority Support</li>
              <li>✓ Custom Timeline</li>
            </ul>
            <a href="/contact" className="block text-center py-3 border border-accent text-accent rounded-lg hover:bg-accent/10 transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
