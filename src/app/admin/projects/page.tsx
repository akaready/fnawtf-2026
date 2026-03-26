import { createClient } from '@/lib/supabase/server';
import { getTagSuggestions, getTestimonials, getClients } from '../actions';
import { ProjectsPageClient } from './ProjectsPageClient';

export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage() {
  const supabase = await createClient();
  const [{ data: rawProjects }, { data: allVideos }, tagSuggestions, allTestimonials, allClients] = await Promise.all([
    supabase.from('projects').select('*').order('updated_at', { ascending: false }),
    supabase.from('project_videos').select('project_id, video_type, duration_seconds'),
    getTagSuggestions(),
    getTestimonials(),
    getClients(),
  ]);

  // Index videos by project_id
  const videosByProject = new Map<string, { video_type: string; duration_seconds: number | null }[]>();
  for (const v of (allVideos ?? []) as unknown as { project_id: string; video_type: string; duration_seconds: number | null }[]) {
    const arr = videosByProject.get(v.project_id) ?? [];
    arr.push(v);
    videosByProject.set(v.project_id, arr);
  }

  // Compute virtual video fields
  const projects = ((rawProjects ?? []) as Record<string, unknown>[]).map((p) => {
    const vids = videosByProject.get(p.id as string) ?? [];
    const cutdowns = vids.filter((v) => v.video_type === 'cutdown');
    const assets = (p.assets_delivered as string[] | null) ?? [];
    const durations = [...new Set(
      vids
        .filter((v) => v.duration_seconds != null && v.duration_seconds > 0)
        .map((v) => {
          const rounded = Math.round(v.duration_seconds! / 5) * 5;
          const m = Math.floor(rounded / 60);
          const s = rounded % 60;
          if (m === 0) return `${s}s`;
          if (s === 0) return `${m}m`;
          return `${m}m${s}s`;
        })
    )];
    return { ...p, deliverable_count: assets.length, video_count: vids.length, has_cutdowns: cutdowns.length > 0, video_durations: durations };
  });

  const testimonials = allTestimonials.map((t) => ({
    id: t.id,
    quote: t.quote,
    person_name: t.person_name,
    project_id: t.project_id,
    client_id: t.client_id ?? null,
  }));

  return (
    <ProjectsPageClient
      projects={projects ?? []}
      tagSuggestions={tagSuggestions}
      testimonials={testimonials}
      clients={allClients.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
