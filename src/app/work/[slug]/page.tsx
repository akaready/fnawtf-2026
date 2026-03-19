import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAnonClient } from '@supabase/supabase-js';
import { ProjectPageClient } from '@/components/work/ProjectPageClient';
import { FooterCTA } from '@/components/layout/FooterCTA';
import type { FeaturedProject, ProjectVideo, ProjectCredit, ProjectBTSImage } from '@/types/project';
import type { Database } from '@/types/database.types';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // Use anon client — cookies() may be unavailable during static generation
  const supabase = createAnonClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  );

  const [{ data: raw }, { data: seoRow }] = await Promise.all([
    supabase.from('projects').select('*').eq('slug', slug).eq('published', true).single(),
    supabase.from('seo_settings').select('detail_title_template, detail_description_template, og_image_url').eq('page_slug', '/work').single(),
  ]);

  const project = raw as { title: string; client_name: string; description: string; thumbnail_url: string | null } | null;
  if (!project) return { title: 'FNA.wtf' };

  const seo = seoRow as { detail_title_template: string | null; detail_description_template: string | null; og_image_url: string | null } | null;
  const vars = { client: project.client_name, title: project.title, description: project.description || '' };

  const titleTemplate = seo?.detail_title_template || 'FNA.wtf \u2022 {client} \u2014 {title}';
  const descTemplate = seo?.detail_description_template || '{description}';

  const title = interpolate(titleTemplate, vars);
  const description = interpolate(descTemplate, vars);
  const ogImage = project.thumbnail_url || seo?.og_image_url || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
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
    .select('quote, person_name, person_title, display_title')
    .eq('project_id', project.id)
    .limit(1);

  const videos = (rawVideos ?? []) as unknown as ProjectVideo[];
  const credits: ProjectCredit[] = rawCredits ?? [];
  const btsImages: ProjectBTSImage[] = rawBtsImages ?? [];
  const testimonial = rawTestimonials?.[0] as { quote: string; person_name: string | null; person_title: string | null; display_title: string | null } | undefined;
  const quoteAttribution = testimonial ?? null;

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
