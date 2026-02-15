import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';

/**
 * About Page
 * 
 * Displays information about Friends 'n Allies agency.
 */
export default async function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation currentPage="about" />
      
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground mb-6">
            About Us
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            We are a boutique agency helping founders craft and share their unique stories.
          </p>
        </div>
      </section>
      
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-6">
              Our Story
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Friends 'n Allies was born from a simple belief: every brand has a story worth telling. 
              Founded by a team of creatives who saw too many amazing ideas get lost in translation, 
              we set out to help founders articulate their vision with clarity and impact.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We're not just a video production company. We're partners in your journey, 
              bringing strategic thinking, creative expertise, and technical skill to every project.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-6">
              Our Approach
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              We believe in the power of authentic storytelling. In a world of noise, 
              the brands that stand out are those that stay true to their voice.
            </p>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-accent">✦</span>
                <span>Strategy first, execution second</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent">✦</span>
                <span>Collaborative partnership</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent">✦</span>
                <span>Data-informed creative decisions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent">✦</span>
                <span>Measurable results</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
      
      <section className="px-4 pb-32">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-foreground mb-8 text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-border rounded-lg">
              <h3 className="text-xl font-bold text-foreground mb-3">Craft</h3>
              <p className="text-muted-foreground">
                We take pride in the quality of our work. Every frame, every word, 
                every pixel is thoughtfully considered.
              </p>
            </div>
            <div className="p-6 border border-border rounded-lg">
              <h3 className="text-xl font-bold text-foreground mb-3">Connection</h3>
              <p className="text-muted-foreground">
                We build real relationships with our clients. Your success is our success.
              </p>
            </div>
            <div className="p-6 border border-border rounded-lg">
              <h3 className="text-xl font-bold text-foreground mb-3">Candor</h3>
              <p className="text-muted-foreground">
                We tell it like it is. Honest feedback helps everyone create better work.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
