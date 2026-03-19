import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ScriptShareClient } from '@/app/s/[token]/ScriptShareClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('scripts').select('title').eq('id', id).single();
  const row = data as { title: string } | null;
  return { title: row?.title ? `Preview \u00B7 ${row.title}` : 'Script Preview' };
}

export default async function ScriptPreviewPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Require admin auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin');

  // Fetch script
  const { data: script, error: scriptErr } = await supabase
    .from('scripts')
    .select('id, title, major_version, minor_version, is_published, project_id, content_mode')
    .eq('id', id)
    .single();
  if (scriptErr || !script) redirect('/admin/scripts');

  const sc = script as { id: string; title: string; major_version: number; minor_version: number; is_published: boolean; project_id: string | null; content_mode: string };

  // Fetch project + client
  let projectTitle: string | null = null;
  let projectNumber: number | null = null;
  let clientName: string | null = null;
  let clientLogoUrl: string | null = null;

  if (sc.project_id) {
    const { data: project } = await supabase
      .from('projects')
      .select('title, project_number, client_id')
      .eq('id', sc.project_id)
      .single();
    if (project) {
      const p = project as { title: string; project_number: number | null; client_id: string | null };
      projectTitle = p.title;
      projectNumber = p.project_number;
      if (p.client_id) {
        const { data: client } = await supabase.from('clients').select('name, logo_url').eq('id', p.client_id).single();
        if (client) {
          const c = client as { name: string; logo_url: string | null };
          clientName = c.name;
          clientLogoUrl = c.logo_url;
        }
      }
    }
  }

  // Fetch all script content
  const [
    { data: scenes },
    { data: characters },
    { data: tags },
    { data: locations },
    { data: storyboardFrames },
  ] = await Promise.all([
    supabase.from('script_scenes').select('*').eq('script_id', sc.id).order('sort_order'),
    supabase.from('script_characters').select('*').eq('script_id', sc.id).order('sort_order'),
    supabase.from('script_tags').select('*').eq('script_id', sc.id),
    supabase.from('script_locations').select('*').eq('script_id', sc.id).order('sort_order'),
    supabase.from('script_storyboard_frames').select('*').eq('script_id', sc.id),
  ]);

  const sceneIds = (scenes ?? []).map((s: Record<string, unknown>) => s.id as string);
  let beats: Record<string, unknown>[] = [];
  let references: Record<string, unknown>[] = [];

  if (sceneIds.length > 0) {
    const { data: beatData } = await supabase
      .from('script_beats')
      .select('*')
      .in('scene_id', sceneIds)
      .order('sort_order');
    beats = (beatData ?? []) as Record<string, unknown>[];

    const beatIds = beats.map(b => b.id as string);
    if (beatIds.length > 0) {
      const { data: refData } = await supabase
        .from('script_beat_references')
        .select('*')
        .in('beat_id', beatIds)
        .order('sort_order');
      references = (refData ?? []) as Record<string, unknown>[];
    }
  }

  return (
    <ScriptShareClient
      shareId=""
      shareNotes={null}
      script={{
        id: sc.id,
        title: sc.title,
        majorVersion: sc.major_version,
        minorVersion: sc.minor_version,
        isPublished: sc.is_published,
        contentMode: sc.content_mode,
      }}
      projectTitle={projectTitle}
      projectNumber={projectNumber}
      clientName={clientName}
      clientLogoUrl={clientLogoUrl}
      scenes={(scenes ?? []) as Record<string, unknown>[]}
      beats={beats}
      characters={(characters ?? []) as Record<string, unknown>[]}
      tags={(tags ?? []) as Record<string, unknown>[]}
      locations={(locations ?? []) as Record<string, unknown>[]}
      references={references}
      storyboardFrames={(storyboardFrames ?? []) as Record<string, unknown>[]}
      viewerEmail={user.email ?? ''}
      viewerName={null}
    />
  );
}
