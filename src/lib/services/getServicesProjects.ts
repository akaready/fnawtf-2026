import { createClient } from '@/lib/supabase/server';
import { ServiceProject, ServicesProjectData } from '@/components/services/ServicesData';

const SELECT = 'id, title, subtitle, slug, thumbnail_url, category';

function mapProjects(data: Record<string, unknown>[] | null): ServiceProject[] {
  return (data ?? []).map((p) => ({
    id: String(p.id),
    title: String(p.title),
    subtitle: p.subtitle ? String(p.subtitle) : undefined,
    slug: String(p.slug),
    thumbnail_url: p.thumbnail_url ? String(p.thumbnail_url) : undefined,
    category: p.category ? String(p.category) : undefined,
  }));
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
