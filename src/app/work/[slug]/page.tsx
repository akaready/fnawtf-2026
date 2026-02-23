import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAnonClient } from '@supabase/supabase-js';
import { ProjectPageClient } from '@/components/work/ProjectPageClient';
import { FooterCTA } from '@/components/layout/FooterCTA';
import type { FeaturedProject, ProjectVideo, ProjectCredit, ProjectBTSImage } from '@/types/project';
import type { Database } from '@/types/database.types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: rawProject, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (projectError || !rawProject) {
    notFound();
  }

  const project = rawProject as FeaturedProject & {
    assets_delivered: string[] | null;
  };

  const { data: rawVideos } = await supabase
    .from('project_videos')
    .select('*')
    .eq('project_id', project.id)
    .order('sort_order');

  const { data: rawCredits } = await supabase
    .from('project_credits')
    .select('*')
    .eq('project_id', project.id)
    .order('sort_order');

  const { data: rawBtsImages } = await supabase
    .from('project_bts_images')
    .select('*')
    .eq('project_id', project.id)
    .order('sort_order');

  const { data: rawTestimonials } = await supabase
    .from('testimonials')
    .select('person_name, person_title, display_title')
    .eq('project_id', project.id)
    .limit(1);

  const videos: ProjectVideo[] = rawVideos ?? [];
  const credits: ProjectCredit[] = rawCredits ?? [];
  const btsImages: ProjectBTSImage[] = rawBtsImages ?? [];
  const quoteAttribution = rawTestimonials?.[0] ?? null;

  return (
    <>
      <ProjectPageClient
        project={project}
        videos={videos}
        credits={credits}
        btsImages={btsImages}
        quoteAttribution={quoteAttribution}
      />
      <FooterCTA />
    </>
  );
}

export async function generateStaticParams() {
  // Use bare anon client — cookies() is unavailable outside request scope
  const supabase = createAnonClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  );

  const { data: projects } = await supabase
    .from('projects')
    .select('slug')
    .eq('published', true);

  return (projects ?? []).map((p) => ({ slug: (p as { slug: string }).slug }));
}
