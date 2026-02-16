/**
 * Featured Work Section
 * Masonry grid of featured portfolio items with hover video preview
 */

import { FeaturedWorkCard } from './FeaturedWorkCard';
import { FeaturedProject } from '@/types/project';
import { RevealGroup, RevealItem } from '@/components/animations/Reveal';

export async function FeaturedWork() {
  // Mock featured projects - replace with Supabase query when credentials are configured
  const projects: FeaturedProject[] = [
    {
      id: '1',
      title: 'Brand Identity Launch',
      subtitle: 'Comprehensive brand refresh campaign',
      slug: 'project-1',
      description: 'Project description',
      client_name: 'Client Name',
      type: 'video',
      thumbnail_url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=450&fit=crop',
      featured: true,
      published: true,
      is_hero: true,
      aspect_ratio: '16:9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Product Launch Campaign',
      subtitle: 'Full-scale product announcement',
      slug: 'project-2',
      description: 'Project description',
      client_name: 'Client Name',
      type: 'video',
      thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=338&fit=crop',
      featured: true,
      published: true,
      aspect_ratio: '16:9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Social Media Campaign',
      subtitle: 'Instagram-first content series',
      slug: 'project-3',
      description: 'Project description',
      client_name: 'Client Name',
      type: 'video',
      thumbnail_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=600&fit=crop',
      featured: true,
      published: true,
      aspect_ratio: '1:1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '4',
      title: 'Documentary Series',
      subtitle: 'Long-form storytelling initiative',
      slug: 'project-4',
      description: 'Project description',
      client_name: 'Client Name',
      type: 'video',
      thumbnail_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=338&fit=crop',
      featured: true,
      published: true,
      aspect_ratio: '16:9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '5',
      title: 'Corporate Rebrand',
      subtitle: 'Enterprise identity redesign',
      slug: 'project-5',
      description: 'Project description',
      client_name: 'Client Name',
      type: 'design',
      thumbnail_url: 'https://images.unsplash.com/photo-1522202176988-e25ad9e90207?w=600&h=600&fit=crop',
      featured: true,
      published: true,
      aspect_ratio: '1:1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '6',
      title: 'Fashion Editorial',
      subtitle: 'High-end lifestyle production',
      slug: 'project-6',
      description: 'Project description',
      client_name: 'Client Name',
      type: 'video',
      thumbnail_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=450&fit=crop',
      featured: true,
      published: true,
      is_hero: true,
      aspect_ratio: '16:9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '7',
      title: 'Tech Product Demo',
      subtitle: 'Software feature showcase',
      slug: 'project-7',
      description: 'Project description',
      client_name: 'Client Name',
      type: 'video',
      thumbnail_url: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=600&h=338&fit=crop',
      featured: true,
      published: true,
      aspect_ratio: '16:9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '8',
      title: 'Culinary Content',
      subtitle: 'Food and beverage storytelling',
      slug: 'project-8',
      description: 'Project description',
      client_name: 'Client Name',
      type: 'video',
      thumbnail_url: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&h=600&fit=crop',
      featured: true,
      published: true,
      aspect_ratio: '1:1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Uncomment when Supabase is configured:
  // const supabase = createClient();
  // const { data: projects, error } = await supabase
  //   .from('projects')
  //   .select('id, title, subtitle, slug, thumbnail_url, featured, published')
  //   .eq('featured', true)
  //   .eq('published', true)
  //   .order('created_at', { ascending: false })
  //   .limit(6);

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
            Featured Work
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our latest projects showcasing innovative storytelling and creative excellence.
          </p>
        </div>

        <RevealGroup
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[16rem]"
          style={{ gridAutoFlow: 'dense' }}
          stagger={150}
        >
          {projects.map((project: FeaturedProject, index: number) => (
            <RevealItem key={project.id}>
              <FeaturedWorkCard project={project} index={index} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
