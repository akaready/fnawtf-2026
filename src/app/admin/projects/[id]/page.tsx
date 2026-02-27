import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProjectForm } from '../../_components/ProjectForm';
import { getTagSuggestions, getTestimonials } from '../../actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (!project) notFound();

  const [{ data: videos }, { data: credits }, { data: btsImages }, tagSuggestions, allTestimonials] = await Promise.all([
    supabase.from('project_videos').select('*').eq('project_id', id).order('sort_order'),
    supabase.from('project_credits').select('*').eq('project_id', id).order('sort_order'),
    supabase.from('project_bts_images').select('*').eq('project_id', id).order('sort_order'),
    getTagSuggestions(),
    getTestimonials(),
  ]);

  const testimonials = allTestimonials.map((t) => ({
    id: t.id,
    quote: t.quote,
    person_name: t.person_name,
    project_id: t.project_id,
    client_id: t.client_id ?? null,
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-8 pt-10 pb-4 border-b border-[#2a2a2a]">
        <p className="text-xs text-muted-foreground/50 uppercase tracking-wider mb-1">
          <Link href="/admin/projects" className="hover:text-muted-foreground transition-colors">
            Projects
          </Link>
          {' / '}
          Edit
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground">{(project as Record<string, unknown>).title as string}</h1>
        <p className="text-sm text-muted-foreground mt-1">{(project as Record<string, unknown>).slug as string}</p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-8 pt-4 pb-8">
        <ProjectForm
          project={project as Parameters<typeof ProjectForm>[0]['project']}
          videos={videos ?? []}
          credits={credits ?? []}
          btsImages={btsImages ?? []}
          tagSuggestions={tagSuggestions}
          testimonials={testimonials}
        />
      </div>
    </div>
  );
}
