import { createClient } from '@/lib/supabase/server';
import { FeaturedProject } from '@/types/project';
import { WorkPageClient } from '@/components/work/WorkPageClient';

export const metadata = {
  title: 'Work - FNA.WTF',
  description: 'Video production portfolio - Browse our featured projects',
};

/**
 * Helper to extract unique tags from projects for filter options
 */
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
  // Fetch all published projects from Supabase
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
  }

  // Use fetched data or empty array
  const allProjects: FeaturedProject[] = projects || [];

  // Extract available filter options from all projects
  const availableTags = extractUniqueTags(allProjects);

  return (
    <div className="min-h-screen bg-background pt-24">
      {/* Page Title */}
      <div className="text-center mb-12 px-6">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-foreground">
          Our Work
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore our portfolio of creative projects and innovative storytelling.
        </p>
      </div>

      {/* Client-side filtering and grid */}
      <WorkPageClient
        initialProjects={allProjects}
        availableTags={availableTags}
      />
    </div>
  );
}
