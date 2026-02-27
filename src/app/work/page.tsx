import { createClient } from '@/lib/supabase/server';
import { FeaturedProject } from '@/types/project';
import { WorkPageClient } from '@/components/work/WorkPageClient';
import { PageHero } from '@/components/layout/PageHero';
import { FooterCTA } from '@/components/layout/FooterCTA';
import { WorkPageSearchParams } from '@/types/filters';
import { getPageSeo } from '@/lib/seo';

export async function generateMetadata() {
  return getPageSeo('/work', {
    title: 'Work - FNA.WTF',
    description: 'Video production portfolio - Browse our featured projects',
  });
}

function extractUniqueTags(projects: FeaturedProject[]) {
  const styleTags = new Set<string>();
  const premiumAddons = new Set<string>();
  const cameraTechniques = new Set<string>();
  const categories = new Set<string>();
  const deliverables = new Set<string>();
  const productionDays = new Set<string>();
  const crewSizes = new Set<string>();
  const talentCounts = new Set<string>();
  const locationCounts = new Set<string>();

  projects.forEach((project) => {
    project.style_tags?.forEach((tag) => styleTags.add(tag));
    project.premium_addons?.forEach((addon) => premiumAddons.add(addon));
    project.camera_techniques?.forEach((tech) => cameraTechniques.add(tech));
    if (project.category) categories.add(project.category);
    (project.assets_delivered as string[] | undefined)?.forEach((d) => deliverables.add(d));
    if (project.production_days != null) productionDays.add(String(project.production_days));
    if (project.crew_count != null) crewSizes.add(String(project.crew_count));
    if (project.talent_count != null) talentCounts.add(String(project.talent_count));
    if (project.location_count != null) locationCounts.add(String(project.location_count));
  });

  const numSort = (a: string, b: string) => Number(a) - Number(b);

  return {
    styleTags: Array.from(styleTags).sort(),
    premiumAddons: Array.from(premiumAddons).sort(),
    cameraTechniques: Array.from(cameraTechniques).sort(),
    categories: Array.from(categories).sort(),
    deliverables: Array.from(deliverables).sort(),
    productionDays: Array.from(productionDays).sort(numSort),
    crewSizes: Array.from(crewSizes).sort(numSort),
    talentCounts: Array.from(talentCounts).sort(numSort),
    locationCounts: Array.from(locationCounts).sort(numSort),
  };
}

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<WorkPageSearchParams>;
}) {
  const initialSearchParams = await searchParams;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawPlacements, error } = await (supabase as any)
    .from('website_project_placements')
    .select('sort_order, full_width, project:projects(*, project_videos(bunny_video_id, video_type, sort_order))')
    .eq('page', 'work')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching work placements:', error.message, error.details, error.hint, error.code);
  }

  type VideoJoin = { bunny_video_id: string; video_type: string; sort_order: number };
  const allProjects: FeaturedProject[] = ((rawPlacements ?? []) as { sort_order: number; full_width: boolean; project: FeaturedProject & { project_videos: VideoJoin[] } }[]).map((placement) => {
    const p = placement.project;
    const videos = p.project_videos || [];
    const flagship = videos.find((v) => v.video_type === 'flagship') ?? videos.sort((a, b) => a.sort_order - b.sort_order)[0];
    return { ...p, fullWidth: placement.full_width, flagship_video_id: flagship?.bunny_video_id };
  });
  const availableTags = extractUniqueTags(allProjects);

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        label="Work"
        title="Recent Projects"
        subCopy="You're in good company. Explore and enjoy our portfolio."
      />
      <WorkPageClient initialProjects={allProjects} availableTags={availableTags} initialSearchParams={initialSearchParams} />
      <FooterCTA />
    </div>
  );
}
