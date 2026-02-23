import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProjectForm } from '../../_components/ProjectForm';
import { getTagSuggestions } from '../../actions';

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

  const [{ data: videos }, { data: credits }, { data: btsImages }, tagSuggestions] = await Promise.all([
    supabase.from('project_videos').select('*').eq('project_id', id).order('sort_order'),
    supabase.from('project_credits').select('*').eq('project_id', id).order('sort_order'),
    supabase.from('project_bts_images').select('*').eq('project_id', id).order('sort_order'),
    getTagSuggestions(),
  ]);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
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

      <ProjectForm
        project={project as Parameters<typeof ProjectForm>[0]['project']}
        videos={videos ?? []}
        credits={credits ?? []}
        btsImages={btsImages ?? []}
        tagSuggestions={tagSuggestions}
      />
    </div>
  );
}
