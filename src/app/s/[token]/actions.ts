'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { setShareAuthCookie, verifySharePassword } from '@/lib/share/auth';
import { notifySlack } from '@/lib/slack/notify';
import { formatScriptVersion, resolveSharePreferences } from '@/types/scripts';

/** Resolve 'admin' placeholder to real user info from the current session */
async function resolveAdminEmail(
  viewerEmail: string,
  viewerName: string | null,
): Promise<{ email: string; name: string | null; isAdmin: boolean }> {
  if (viewerEmail !== 'admin') return { email: viewerEmail, name: viewerName, isAdmin: false };

  const { createClient: createServerClient } = await import('@/lib/supabase/server');
  const serverSupa = await createServerClient();
  const { data: { session } } = await serverSupa.auth.getSession();
  if (!session?.user?.email) return { email: viewerEmail, name: viewerName, isAdmin: true };

  const service = createServiceClient();
  const { data: contact } = await service
    .from('contacts')
    .select('first_name, last_name, admin_role')
    .eq('email', session.user.email)
    .single();

  if (contact) {
    const c = contact as unknown as { first_name: string; last_name: string; admin_role: string | null };
    return {
      email: session.user.email,
      name: [c.first_name, c.last_name].filter(Boolean).join(' ') || null,
      isAdmin: !!c.admin_role,
    };
  }

  return { email: session.user.email, name: viewerName, isAdmin: true };
}

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
    .select('id, script_id, snapshot_script_id, notes, token, is_active, share_mode, share_preferences')
    .eq('token', token)
    .eq('is_active', true)
    .single();

  if (shareErr || !share) return null;

  const s = share as unknown as {
    id: string;
    script_id: string;
    snapshot_script_id: string | null;
    notes: string | null;
    token: string;
    share_mode: string;
    share_preferences: Record<string, unknown> | null;
  };

  // Use the published snapshot if one exists; fall back to live script for old shares
  const resolvedScriptId = s.snapshot_script_id ?? s.script_id;

  // Use service client to bypass RLS for script data
  const service = createServiceClient();

  // Fetch script with project + client
  const { data: script, error: scriptErr } = await service
    .from('scripts')
    .select('id, title, major_version, minor_version, is_published, project_id, content_mode, script_group_id')
    .eq('id', resolvedScriptId)
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
    sc.script_group_id
      ? service.from('script_characters').select('*').eq('script_group_id', sc.script_group_id).order('sort_order')
      : Promise.resolve({ data: [] }),
    sc.script_group_id
      ? service.from('script_tags').select('*').eq('script_group_id', sc.script_group_id)
      : Promise.resolve({ data: [] }),
    sc.script_group_id
      ? service.from('script_locations').select('*').eq('script_group_id', sc.script_group_id).order('sort_order')
      : Promise.resolve({ data: [] }),
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
    sharePreferences: resolveSharePreferences(s.share_preferences, s.share_mode),
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
  viewerName?: string,
): Promise<string | null> {
  const supabase = await createClient();

  // Check for a recent view from this email (within 1 hour) to avoid duplicate rows on refresh
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from('script_share_views')
    .select('id')
    .eq('share_id', shareId)
    .eq('viewer_email', viewerEmail)
    .gte('viewed_at', oneHourAgo)
    .order('viewed_at', { ascending: false })
    .limit(1)
    .single();

  if (existing) return (existing as { id: string }).id;

  // Insert a new view row
  const { data: inserted } = await supabase
    .from('script_share_views')
    .insert({ share_id: shareId, viewer_email: viewerEmail, viewer_name: viewerName ?? null, duration_seconds: 0 } as never)
    .select('id')
    .single();

  return inserted ? (inserted as { id: string }).id : null;
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

export async function getShareComments(shareId: string) {
  if (!shareId) return [];
  const service = createServiceClient();

  const { data, error } = await service
    .from('script_share_comments' as never)
    .select('id, beat_id, viewer_email, viewer_name, content, is_admin, created_at, parent_comment_id, resolved_at, resolved_by, comment_number')
    .eq('share_id', shareId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw new Error((error as { message: string }).message);

  const rows = (data ?? []) as unknown as {
    id: string; beat_id: string; viewer_email: string; viewer_name: string | null;
    content: string; is_admin: boolean; created_at: string;
    parent_comment_id: string | null; resolved_at: string | null;
    resolved_by: string | null; comment_number: number | null;
  }[];

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

export type CommentAuthor = {
  email: string;
  name: string | null;
  avatar_url: string | null;
  avatar_color: string | null;
};

export async function getCommentAuthors(shareId: string): Promise<Record<string, CommentAuthor[]>> {
  if (!shareId) return {};
  const service = createServiceClient();

  const { data, error } = await service
    .from('script_share_comments' as never)
    .select('beat_id, viewer_email, viewer_name')
    .eq('share_id', shareId)
    .is('deleted_at', null);
  if (error) return {};

  const rows = (data ?? []) as unknown as { beat_id: string; viewer_email: string; viewer_name: string | null }[];

  // Dedupe per beat
  const beatAuthorsMap: Record<string, Map<string, { email: string; name: string | null }>> = {};
  for (const row of rows) {
    if (!beatAuthorsMap[row.beat_id]) beatAuthorsMap[row.beat_id] = new Map();
    if (!beatAuthorsMap[row.beat_id].has(row.viewer_email)) {
      beatAuthorsMap[row.beat_id].set(row.viewer_email, { email: row.viewer_email, name: row.viewer_name });
    }
  }

  // Look up avatars + colors
  const allEmails = [...new Set(rows.map(r => r.viewer_email).filter(Boolean))];
  const avatarMap: Record<string, { url: string | null; color: string | null }> = {};
  if (allEmails.length > 0) {
    const { data: contacts } = await service
      .from('contacts')
      .select('email, headshot_url, avatar_color')
      .in('email', allEmails);
    for (const contact of (contacts ?? []) as { email: string; headshot_url: string | null; avatar_color: string | null }[]) {
      avatarMap[contact.email] = { url: contact.headshot_url, color: contact.avatar_color };
    }
  }

  const result: Record<string, CommentAuthor[]> = {};
  for (const [beatId, authorsMap] of Object.entries(beatAuthorsMap)) {
    result[beatId] = [...authorsMap.values()].slice(0, 5).map(a => ({
      email: a.email,
      name: a.name,
      avatar_url: avatarMap[a.email]?.url ?? null,
      avatar_color: avatarMap[a.email]?.color ?? null,
    }));
  }
  return result;
}

export async function addComment(
  shareId: string,
  beatId: string,
  viewerEmail: string,
  viewerName: string | null,
  content: string,
  isAdmin?: boolean,
) {
  if (!shareId || !beatId) throw new Error('Missing share or beat ID');
  const supabase = createServiceClient();

  const resolved = await resolveAdminEmail(viewerEmail, viewerName);
  const finalEmail = resolved.email;
  const finalName = resolved.name;
  const finalIsAdmin = isAdmin || resolved.isAdmin;

  const { count } = await supabase
    .from('script_share_comments' as never)
    .select('id', { count: 'exact', head: true })
    .eq('share_id', shareId)
    .is('deleted_at', null);
  const commentNumber = (count ?? 0) + 1;

  const { data, error } = await supabase
    .from('script_share_comments' as never)
    .insert({
      share_id: shareId,
      beat_id: beatId,
      viewer_email: finalEmail,
      viewer_name: finalName,
      content,
      comment_number: commentNumber,
      ...(finalIsAdmin ? { is_admin: true } : {}),
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
  const resolved = await resolveAdminEmail(viewerEmail, null);
  const { error } = await supabase
    .from('script_share_comments' as never)
    .update({ content } as never)
    .eq('id', commentId)
    .eq('viewer_email', resolved.email);
  if (error) throw new Error((error as { message: string }).message);
}

export async function deleteComment(commentId: string, viewerEmail: string) {
  const supabase = createServiceClient();
  const resolved = await resolveAdminEmail(viewerEmail, null);
  const { error } = await supabase
    .from('script_share_comments' as never)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', commentId)
    .eq('viewer_email', resolved.email);
  if (error) throw new Error((error as { message: string }).message);
}

export async function addReply(
  shareId: string,
  parentCommentId: string,
  viewerEmail: string,
  viewerName: string | null,
  content: string,
  isAdmin?: boolean,
) {
  const supabase = createServiceClient();
  const resolved = await resolveAdminEmail(viewerEmail, viewerName);

  const { data: parent } = await supabase
    .from('script_share_comments' as never)
    .select('beat_id')
    .eq('id', parentCommentId)
    .single();
  if (!parent) throw new Error('Parent comment not found');
  const beatId = (parent as unknown as { beat_id: string }).beat_id;

  const { count } = await supabase
    .from('script_share_comments' as never)
    .select('id', { count: 'exact', head: true })
    .eq('share_id', shareId)
    .is('deleted_at', null);
  const commentNumber = (count ?? 0) + 1;

  const { data, error } = await supabase
    .from('script_share_comments' as never)
    .insert({
      share_id: shareId,
      beat_id: beatId,
      viewer_email: resolved.email,
      viewer_name: resolved.name,
      content,
      parent_comment_id: parentCommentId,
      comment_number: commentNumber,
      ...((isAdmin || resolved.isAdmin) ? { is_admin: true } : {}),
    } as never)
    .select('id')
    .single();
  if (error) throw new Error((error as { message: string }).message);
  return (data as unknown as { id: string }).id;
}

export async function getReactions(commentIds: string[]) {
  if (commentIds.length === 0) return {};
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('script_share_comment_reactions' as never)
    .select('comment_id, emoji, viewer_email')
    .in('comment_id', commentIds);
  if (error) return {};
  const result: Record<string, { emoji: string; count: number; viewers: string[] }[]> = {};
  const rows = (data ?? []) as unknown as { comment_id: string; emoji: string; viewer_email: string }[];
  for (const row of rows) {
    if (!result[row.comment_id]) result[row.comment_id] = [];
    const existing = result[row.comment_id].find(r => r.emoji === row.emoji);
    if (existing) {
      existing.count++;
      existing.viewers.push(row.viewer_email);
    } else {
      result[row.comment_id].push({ emoji: row.emoji, count: 1, viewers: [row.viewer_email] });
    }
  }
  return result;
}

export async function toggleReaction(commentId: string, viewerEmail: string, emoji: string) {
  const supabase = createServiceClient();
  const resolved = await resolveAdminEmail(viewerEmail, null);
  // Check if reaction exists
  const { data: existing } = await supabase
    .from('script_share_comment_reactions' as never)
    .select('id')
    .eq('comment_id', commentId)
    .eq('viewer_email', resolved.email)
    .eq('emoji', emoji)
    .single();
  if (existing) {
    await supabase
      .from('script_share_comment_reactions' as never)
      .delete()
      .eq('id', (existing as unknown as { id: string }).id);
    return false;
  } else {
    await supabase
      .from('script_share_comment_reactions' as never)
      .insert({ comment_id: commentId, viewer_email: resolved.email, emoji } as never);
    return true;
  }
}

export async function toggleResolved(commentId: string, viewerEmail: string) {
  const supabase = createServiceClient();
  const resolved = await resolveAdminEmail(viewerEmail, null);

  const { data: existing } = await supabase
    .from('script_share_comments' as never)
    .select('resolved_at')
    .eq('id', commentId)
    .single();
  const isResolved = !!(existing as unknown as { resolved_at: string | null } | null)?.resolved_at;

  const { error } = await supabase
    .from('script_share_comments' as never)
    .update(isResolved
      ? { resolved_at: null, resolved_by: null } as never
      : { resolved_at: new Date().toISOString(), resolved_by: resolved.email } as never
    )
    .eq('id', commentId);
  if (error) throw new Error((error as { message: string }).message);
  return !isResolved;
}

// ── Viewer Profile ─────────────────────────────────────────────────────

export async function getViewerProfile(email: string): Promise<{
  first_name: string | null;
  last_name: string | null;
  headshot_url: string | null;
  avatar_color: string | null;
} | null> {
  if (!email) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('contacts')
    .select('first_name, last_name, headshot_url, avatar_color')
    .eq('email', email)
    .limit(1)
    .single();
  if (!data) return null;
  const row = data as { first_name: string | null; last_name: string | null; headshot_url: string | null; avatar_color: string | null };
  return row;
}

export async function updateViewerProfile(
  email: string,
  firstName: string,
  lastName: string,
  avatarColorHex?: string | null,
  clearAvatar?: boolean,
): Promise<void> {
  if (!email) return;
  const supabase = createServiceClient();

  const fields: Record<string, unknown> = {
    first_name: firstName || '',
    last_name: lastName || '',
  };
  if (avatarColorHex !== undefined) fields.avatar_color = avatarColorHex;
  if (clearAvatar) fields.headshot_url = null;

  // Check if contact exists
  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('email', email)
    .limit(1)
    .single();

  if (existing) {
    await supabase
      .from('contacts')
      .update(fields as never)
      .eq('email', email);
  } else {
    await supabase
      .from('contacts')
      .insert({ email, type: 'external', ...fields } as never);
  }
}

export async function uploadViewerAvatar(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;
  const email = formData.get('email') as string;
  if (!file || !email) throw new Error('Missing file or email');

  const supabase = createServiceClient();
  const ext = file.name.split('.').pop() ?? 'png';

  // Deterministic path based on email
  let hash = 0;
  for (const ch of email) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  const path = `viewers/${Math.abs(hash).toString(36)}.${ext}`;

  const { error } = await supabase.storage.from('headshots').upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabase.storage.from('headshots').getPublicUrl(path);

  // Update contact record
  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('email', email)
    .limit(1)
    .single();

  if (existing) {
    await supabase
      .from('contacts')
      .update({ headshot_url: publicUrl } as never)
      .eq('email', email);
  } else {
    await supabase
      .from('contacts')
      .insert({ email, headshot_url: publicUrl, type: 'external', first_name: '', last_name: '' } as never);
  }

  return publicUrl;
}
