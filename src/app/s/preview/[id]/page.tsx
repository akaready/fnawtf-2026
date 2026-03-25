import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ScriptShareClient } from '@/app/s/[token]/ScriptShareClient';
import { DEFAULT_SHARE_PREFERENCES } from '@/types/scripts';

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
    .select('id, title, major_version, minor_version, is_published, project_id, content_mode, script_group_id')
    .eq('id', id)
    .single();
  if (scriptErr || !script) redirect('/admin/scripts');

  const sc = script as { id: string; title: string; major_version: number; minor_version: number; is_published: boolean; project_id: string | null; content_mode: string; script_group_id: string | null };

  // Fetch project + client
  let projectTitle: string | null = null;
  let projectNumber: number | null = null;
  let clientName: string | null = null;
  let clientLogoUrl: string | null = null;

  if (sc.project_id) {
    const { data: project } = await supabase
      .from('projects')
      .select('title, client_name')
      .eq('id', sc.project_id)
      .single();
    if (project) {
      const p = project as { title: string; client_name: string | null };
      projectTitle = p.title;
      clientName = p.client_name;
      if (p.client_name) {
        const { data: client } = await supabase
          .from('clients')
          .select('logo_url')
          .eq('name', p.client_name)
          .limit(1)
          .single();
        if (client) clientLogoUrl = (client as { logo_url: string | null }).logo_url;
      }
    }
  }

  // Fetch share ID + notes from the most recent share for this script
  let shareNotes: string | null = null;
  let latestShareId = '';
  const { data: shareData } = await supabase
    .from('script_shares')
    .select('id, notes')
    .eq('script_id', sc.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (shareData) {
    const sd = shareData as { id: string; notes: string | null };
    shareNotes = sd.notes;
    latestShareId = sd.id;
  }

  // Fetch all script content
  const [
    { data: scenes },
    { data: characters },
    { data: tags },
    { data: locations },
    { data: storyboardFrames },
    { data: products },
  ] = await Promise.all([
    supabase.from('script_scenes').select('*').eq('script_id', sc.id).order('sort_order'),
    sc.script_group_id
      ? supabase.from('script_characters').select('*').eq('script_group_id', sc.script_group_id).order('sort_order')
      : Promise.resolve({ data: [] }),
    sc.script_group_id
      ? supabase.from('script_tags').select('*').eq('script_group_id', sc.script_group_id)
      : Promise.resolve({ data: [] }),
    sc.script_group_id
      ? supabase.from('script_locations').select('*').eq('script_group_id', sc.script_group_id).order('sort_order')
      : Promise.resolve({ data: [] }),
    supabase.from('script_storyboard_frames').select('*').eq('script_id', sc.id),
    sc.script_group_id
      ? supabase.from('script_products').select('*').eq('script_group_id', sc.script_group_id).order('sort_order')
      : Promise.resolve({ data: [] }),
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
      shareId={latestShareId}
      shareNotes={shareNotes}
      shareMode="presentation"
      sharePreferences={DEFAULT_SHARE_PREFERENCES}
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
      products={(products ?? []) as Record<string, unknown>[]}
      viewerEmail={user.email ?? ''}
      viewerName={user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? null}
    />
  );
}
