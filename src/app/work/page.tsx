import { createClient } from '@/lib/supabase/server';
import { FeaturedProject } from '@/types/project';
import { WorkPageClient } from '@/components/work/WorkPageClient';
import { PageHero } from '@/components/layout/PageHero';
import { FooterCTA } from '@/components/layout/FooterCTA';

export const metadata = {
  title: 'Work - FNA.WTF',
  description: 'Video production portfolio - Browse our featured projects',
};

function extractUniqueTags(projects: FeaturedProject[]) {
  const styleTags = new Set<string>();
  const premiumAddons = new Set<string>();
  const cameraTechniques = new Set<string>();
  const categories = new Set<string>();

  projects.forEach((project) => {
    project.style_tags?.forEach((tag) => styleTags.add(tag));
    project.premium_addons?.forEach((addon) => premiumAddons.add(addon));
    project.camera_techniques?.forEach((tech) => cameraTechniques.add(tech));
    if (project.category) categories.add(project.category);
  });

  return {
    styleTags: Array.from(styleTags).sort(),
    premiumAddons: Array.from(premiumAddons).sort(),
    cameraTechniques: Array.from(cameraTechniques).sort(),
    categories: Array.from(categories).sort(),
  };
}

export default async function WorkPage() {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
  }

  const allProjects: FeaturedProject[] = projects || [];
  const availableTags = extractUniqueTags(allProjects);

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        label="Work"
        title="Recent Projects"
        subCopy="You're in good company. Explore and enjoy our portfolio."
      />
      <WorkPageClient initialProjects={allProjects} availableTags={availableTags} />
      <FooterCTA />
    </div>
  );
}
