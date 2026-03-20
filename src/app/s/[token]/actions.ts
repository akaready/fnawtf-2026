'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { setShareAuthCookie, verifySharePassword } from '@/lib/share/auth';
import { notifySlack } from '@/lib/slack/notify';
import { formatScriptVersion } from '@/types/scripts';

export async function verifyScriptShareAccess(
  token: string,
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Look up share
  const { data: share, error: shareErr } = await supabase
    .from('script_shares')
    .select('id, access_code, script_id, is_active')
    .eq('token', token)
    .eq('is_active', true)
    .single();

  if (shareErr || !share) {
    return { success: false, error: 'Share link not found or inactive.' };
  }

  const row = share as { id: string; access_code: string; script_id: string };

  // Verify password
  if (!verifySharePassword(password, row.access_code)) {
    return { success: false, error: 'Invalid access code.' };
  }

  // Build viewer name
  const viewerName = [firstName, lastName].filter(Boolean).join(' ') || null;

  // Set cookie
  await setShareAuthCookie('script', token, email, viewerName ?? undefined);

  // Insert view record
  await supabase.from('script_share_views').insert({
    share_id: row.id,
    viewer_email: email,
    viewer_name: viewerName,
  } as never);

  // Look up script + project + client for Slack notification
  const service = createServiceClient();
  const { data: script } = await service
    .from('scripts')
    .select('id, title, major_version, minor_version, is_published, project_id')
    .eq('id', row.script_id)
    .single();

  if (script) {
    const s = script as { id: string; title: string; major_version: number; minor_version: number; is_published: boolean; project_id: string | null };
    let companyName: string | null = null;
    let slackChannelId: string | null = null;

    if (s.project_id) {
      const { data: project } = await service
        .from('projects')
        .select('title, client_name')
        .eq('id', s.project_id)
        .single();
      if (project) {
        const p = project as { title: string; client_name: string | null };
        companyName = p.client_name;
      }
    }

    notifySlack({
      type: 'script_viewed',
      data: {
        scriptId: s.id,
        title: s.title,
        versionLabel: formatScriptVersion(s.major_version, s.minor_version, s.is_published),
        token,
        viewerEmail: email,
        viewerName,
        companyName,
        slackChannelId,
      },
    });
  }

  return { success: true };
}

export async function getScriptShareData(token: string) {
  const supabase = await createClient();

  // Fetch share (anon can read active shares via RLS)
  const { data: share, error: shareErr } = await supabase
    .from('script_shares')
    .select('id, script_id, notes, token, is_active, share_mode')
    .eq('token', token)
    .eq('is_active', true)
    .single();

  if (shareErr || !share) return null;

  const s = share as unknown as { id: string; script_id: string; notes: string | null; token: string; share_mode: string };

  // Use service client to bypass RLS for script data
  const service = createServiceClient();

  // Fetch script with project + client
  const { data: script, error: scriptErr } = await service
    .from('scripts')
    .select('id, title, major_version, minor_version, is_published, project_id, content_mode, script_group_id')
    .eq('id', s.script_id)
    .single();

  if (scriptErr || !script) return null;

  const sc = script as { id: string; title: string; major_version: number; minor_version: number; is_published: boolean; project_id: string | null; content_mode: string; script_group_id: string | null };

  // Fetch project + client info
  let projectTitle: string | null = null;
  let projectNumber: number | null = null;
  let clientName: string | null = null;
  let clientLogoUrl: string | null = null;

  if (sc.project_id) {
    const { data: project } = await service
      .from('projects')
      .select('title, client_name')
      .eq('id', sc.project_id)
      .single();
    if (project) {
      const p = project as { title: string; client_name: string | null };
      projectTitle = p.title;
      clientName = p.client_name;
      // Look up client logo by name
      if (p.client_name) {
        const { data: client } = await service
          .from('clients')
          .select('logo_url')
          .eq('name', p.client_name)
          .limit(1)
          .single();
        if (client) clientLogoUrl = (client as { logo_url: string | null }).logo_url;
      }
    }
  }

  // Fetch scenes, beats, characters, tags, locations, products, references, storyboard frames
  const [
    { data: scenes },
    { data: characters },
    { data: tags },
    { data: locations },
    { data: storyboardFrames },
    { data: products },
  ] = await Promise.all([
    service.from('script_scenes').select('*').eq('script_id', sc.id).order('sort_order'),
    service.from('script_characters').select('*').eq('script_id', sc.id).order('sort_order'),
    service.from('script_tags').select('*').eq('script_id', sc.id),
    service.from('script_locations').select('*').eq('script_id', sc.id).order('sort_order'),
    service.from('script_storyboard_frames').select('*').eq('script_id', sc.id),
    sc.script_group_id
      ? service.from('script_products').select('*').eq('script_group_id', sc.script_group_id).order('sort_order')
      : Promise.resolve({ data: [] }),
  ]);

  const sceneIds = (scenes ?? []).map((s: Record<string, unknown>) => s.id as string);

  // Fetch beats and references for all scenes
  let beats: Record<string, unknown>[] = [];
  let references: Record<string, unknown>[] = [];

  if (sceneIds.length > 0) {
    const { data: beatData } = await service
      .from('script_beats')
      .select('id, scene_id, sort_order, audio_content, visual_content, notes_content, storyboard_layout, created_at, updated_at')
      .in('scene_id', sceneIds)
      .order('sort_order');
    beats = (beatData ?? []) as Record<string, unknown>[];

    // Now fetch references with actual beat IDs
    const beatIds = beats.map(b => b.id as string);
    if (beatIds.length > 0) {
      const { data: refResult } = await service
        .from('script_beat_references')
        .select('*')
        .in('beat_id', beatIds)
        .order('sort_order');
      references = (refResult ?? []) as Record<string, unknown>[];
    }
  }

  return {
    shareId: s.id,
    shareNotes: s.notes,
    shareMode: s.share_mode as 'presentation' | 'table',
    script: {
      id: sc.id,
      title: sc.title,
      majorVersion: sc.major_version,
      minorVersion: sc.minor_version,
      isPublished: sc.is_published,
      contentMode: sc.content_mode,
    },
    projectTitle,
    projectNumber,
    clientName,
    clientLogoUrl,
    scenes: (scenes ?? []) as Record<string, unknown>[],
    beats,
    characters: (characters ?? []) as Record<string, unknown>[],
    tags: (tags ?? []) as Record<string, unknown>[],
    locations: (locations ?? []) as Record<string, unknown>[],
    products: (products ?? []) as Record<string, unknown>[],
    references,
    storyboardFrames: (storyboardFrames ?? []) as Record<string, unknown>[],
  };
}

export async function startScriptViewSession(
  shareId: string,
  viewerEmail: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('script_share_views')
    .select('id')
    .eq('share_id', shareId)
    .eq('viewer_email', viewerEmail)
    .order('viewed_at', { ascending: false })
    .limit(1)
    .single();
  return data ? (data as { id: string }).id : null;
}

export async function updateScriptViewDuration(viewId: string, durationSeconds: number) {
  const supabase = await createClient();
  await supabase
    .from('script_share_views')
    .update({ duration_seconds: durationSeconds } as never)
    .eq('id', viewId);
}

// ── Comments ─────────────────────────────────────────────────────────────

export async function getComments(shareId: string, beatId: string) {
  if (!shareId || !beatId) return [];
  const service = createServiceClient();

  const { data, error } = await service
    .from('script_share_comments' as never)
    .select('id, beat_id, viewer_email, viewer_name, content, is_admin, created_at')
    .eq('share_id', shareId)
    .eq('beat_id', beatId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error((error as { message: string }).message);

  const rows = (data ?? []) as unknown as { id: string; beat_id: string; viewer_email: string; viewer_name: string | null; content: string; is_admin: boolean; created_at: string }[];

  // Look up avatars via email match to contacts
  const emails = [...new Set(rows.map(c => c.viewer_email).filter(Boolean))];
  const avatarMap: Record<string, string> = {};

  if (emails.length > 0) {
    const { data: contacts } = await service
      .from('contacts')
      .select('email, headshot_url')
      .in('email', emails);
    for (const contact of (contacts ?? []) as { email: string; headshot_url: string | null }[]) {
      if (contact.headshot_url) {
        avatarMap[contact.email] = contact.headshot_url;
      }
    }
  }

  return rows.map(c => ({
    ...c,
    avatar_url: avatarMap[c.viewer_email] ?? null,
  }));
}

export async function getCommentCounts(shareId: string): Promise<Record<string, number>> {
  if (!shareId) return {};
  const service = createServiceClient();
  const { data, error } = await service
    .from('script_share_comments' as never)
    .select('beat_id')
    .eq('share_id', shareId)
    .is('deleted_at', null);
  if (error) return {};
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { beat_id: string }[]) {
    counts[row.beat_id] = (counts[row.beat_id] ?? 0) + 1;
  }
  return counts;
}

export async function addComment(
  shareId: string,
  beatId: string,
  viewerEmail: string,
  viewerName: string | null,
  content: string,
) {
  if (!shareId || !beatId) throw new Error('Missing share or beat ID');
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('script_share_comments' as never)
    .insert({
      share_id: shareId,
      beat_id: beatId,
      viewer_email: viewerEmail,
      viewer_name: viewerName,
      content,
    } as never)
    .select('id')
    .single();
  if (error) throw new Error((error as { message: string }).message);
  return (data as unknown as { id: string }).id;
}

export async function updateComment(
  commentId: string,
  viewerEmail: string,
  content: string,
) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('script_share_comments' as never)
    .update({ content } as never)
    .eq('id', commentId)
    .eq('viewer_email', viewerEmail);
  if (error) throw new Error((error as { message: string }).message);
}

export async function deleteComment(commentId: string, viewerEmail: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('script_share_comments' as never)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', commentId)
    .eq('viewer_email', viewerEmail);
  if (error) throw new Error((error as { message: string }).message);
}
