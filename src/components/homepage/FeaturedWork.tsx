/**
 * Featured Work Section
 * Masonry grid of featured portfolio items with hover video preview
 */

import { createClient } from '@/lib/supabase/server';
import { FeaturedWorkCard } from './FeaturedWorkCard';
import { FeaturedProject } from '@/types/project';
import { RevealGroup, RevealItem } from '@/components/animations/Reveal';

type VideoJoin = { bunny_video_id: string; video_type: string; sort_order: number };

export async function FeaturedWork() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('website_project_placements')
    .select('sort_order, full_width, project:projects(id, title, subtitle, slug, description, thumbnail_url, thumbnail_time, category, type, published, featured, full_width, home_order, created_at, updated_at, client_name, project_videos(bunny_video_id, video_type, sort_order))')
    .eq('page', 'homepage')
    .order('sort_order', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects: FeaturedProject[] = ((data ?? []) as any[]).map((placement) => {
    const p = placement.project;
    const videos = (p.project_videos || []) as VideoJoin[];
    const flagship = videos.find((v) => v.video_type === 'flagship') ?? videos.sort((a, b) => a.sort_order - b.sort_order)[0];
    return {
      ...p,
      fullWidth: placement.full_width,
      thumbnail_url: p.thumbnail_url ?? undefined,
      category: p.category ?? undefined,
      flagship_video_id: flagship?.bunny_video_id,
      thumbnail_time: typeof p.thumbnail_time === 'number' ? p.thumbnail_time : undefined,
    } as FeaturedProject;
  });

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
            Samples we've picked to impress you.
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
