import { createClient } from '@/lib/supabase/server';
import { ServiceProject, ServicesProjectData } from '@/components/services/ServicesData';

const SELECT = 'id, title, subtitle, slug, thumbnail_url, thumbnail_time, category, project_videos(bunny_video_id, video_type, sort_order, password_protected, viewer_password)';

type VideoJoin = { bunny_video_id: string; video_type: string; sort_order: number; password_protected?: boolean; viewer_password?: string | null };

function mapProjects(data: Record<string, unknown>[] | null): ServiceProject[] {
  return (data ?? []).map((p) => {
    const videos = (p.project_videos as VideoJoin[] | undefined) ?? [];
    const flagship = videos.find((v) => v.video_type === 'flagship') ?? videos.sort((a, b) => a.sort_order - b.sort_order)[0];
    const isProtected = flagship?.video_type === 'pitch' || !!flagship?.password_protected;
    return {
      id: String(p.id),
      title: String(p.title),
      subtitle: p.subtitle ? String(p.subtitle) : undefined,
      slug: String(p.slug),
      thumbnail_url: p.thumbnail_url ? String(p.thumbnail_url) : undefined,
      category: p.category ? String(p.category) : undefined,
      flagship_video_id: flagship?.bunny_video_id,
      flagship_protected: isProtected,
      flagship_password: isProtected ? (flagship?.viewer_password ?? null) : null,
      thumbnail_time: typeof p.thumbnail_time === 'number' ? p.thumbnail_time : undefined,
    };
  });
}

export async function getServicesProjects(): Promise<ServicesProjectData> {
  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const [build, launch, scale, crowdfunding, fundraising] = await Promise.all([
      db.from('projects').select(SELECT).eq('featured_services_build', true).eq('published', true),
      db.from('projects').select(SELECT).eq('featured_services_launch', true).eq('published', true),
      db.from('projects').select(SELECT).eq('featured_services_scale', true).eq('published', true),
      db.from('projects').select(SELECT).eq('featured_services_crowdfunding', true).eq('published', true),
      db.from('projects').select(SELECT).eq('featured_services_fundraising', true).eq('published', true),
    ]);

    return {
      build: mapProjects(build.data),
      launch: mapProjects(launch.data),
      scale: mapProjects(scale.data),
      crowdfunding: mapProjects(crowdfunding.data),
      fundraising: mapProjects(fundraising.data),
    };
  } catch {
    return { build: [], launch: [], scale: [], crowdfunding: [], fundraising: [] };
  }
}
