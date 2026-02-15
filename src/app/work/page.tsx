import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';

/**
 * Work Page
 * 
 * Displays the portfolio of video production projects.
 * Fetches from Supabase projects table.
 */
export default async function WorkPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation currentPage="work" />
      
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground mb-6">
            Our Work
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            A collection of visual stories we've crafted for ambitious brands.
          </p>
        </div>
      </section>
      
      {/* Placeholder for masonry grid - will connect to Supabase */}
      <section className="px-4 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Project cards will be fetched from Supabase */}
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">Project Grid Coming Soon</span>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
