import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';

/**
 * Services Page
 * 
 * Displays the three service tiers: Build, Launch, Scale.
 */
export default async function ServicesPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation currentPage="services" />
      
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground mb-6">
            Services
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            From foundation to growth, we help brands at every stage of their journey.
          </p>
        </div>
      </section>
      
      <section className="px-4 pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Build */}
          <div className="p-8 border border-border rounded-lg hover:border-accent transition-colors">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Build</h2>
            <p className="text-muted-foreground mb-6">
              Foundation services to establish your brand identity and visual presence.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Brand Strategy</li>
              <li>• Visual Identity</li>
              <li>• Content Strategy</li>
              <li>• Website Design</li>
            </ul>
          </div>
          
          {/* Launch */}
          <div className="p-8 border border-border rounded-lg hover:border-accent transition-colors">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Launch</h2>
            <p className="text-muted-foreground mb-6">
              Launch services to get your story out into the world.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Video Production</li>
              <li>• Pitch Videos</li>
              <li>• Launch Pages</li>
              <li>• Social Content</li>
            </ul>
          </div>
          
          {/* Scale */}
          <div className="p-8 border border-border rounded-lg hover:border-accent transition-colors">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Scale</h2>
            <p className="text-muted-foreground mb-6">
              Growth services to expand your reach and impact.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• AI Integrations</li>
              <li>• Automations</li>
              <li>• Content Scaling</li>
              <li>• Analytics</li>
            </ul>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
