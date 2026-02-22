/**
 * Featured Work Section
 * Masonry grid of featured portfolio items with hover video preview
 */

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';
import { FeaturedWorkCard } from './FeaturedWorkCard';
import { FeaturedProject } from '@/types/project';
import { RevealGroup, RevealItem } from '@/components/animations/Reveal';

type ProjectRow = Pick<Database['public']['Tables']['projects']['Row'],
  'id' | 'title' | 'subtitle' | 'slug' | 'description' | 'thumbnail_url' | 'category' | 'type' |
  'published' | 'full_width' | 'created_at' | 'updated_at' | 'client_name'
>;

export async function FeaturedWork() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('projects')
    .select('id, title, subtitle, slug, description, thumbnail_url, category, type, published, full_width, created_at, updated_at, client_name')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(12);

  const projects: FeaturedProject[] = ((data ?? []) as ProjectRow[]).map((p) => ({
    ...p,
    featured: false,
    fullWidth: p.full_width,
    thumbnail_url: p.thumbnail_url ?? undefined,
    category: p.category ?? undefined,
  }));

  if (!projects || projects.length === 0) {
    return (
      <section className="py-20 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-muted-foreground">
            Featured work coming soon...
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Recent Projects
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Soon to feature your brand.
          </p>
        </div>

        <RevealGroup
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          stagger={150}
        >
          {projects.map((project: FeaturedProject, index: number) => {
            const colSpanClass = project.fullWidth ? 'lg:col-span-2' : '';
            return (
              <RevealItem key={project.id}>
                <FeaturedWorkCard project={project} index={index} className={colSpanClass} />
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
