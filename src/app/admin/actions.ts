'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return { supabase, userId: user.id };
}

// ── Projects ──────────────────────────────────────────────────────────────

export async function updateProject(id: string, data: Record<string, unknown>) {
  const { supabase, userId } = await requireAuth();
  const { error } = await supabase
    .from('projects')
    .update({ ...data, updated_by: userId, updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/projects');
  revalidatePath('/work');
  revalidatePath('/');
}

export async function createProject(data: Record<string, unknown>): Promise<string> {
  const { supabase, userId } = await requireAuth();
  const { data: project, error } = await supabase
    .from('projects')
    .insert({ ...data, updated_by: userId } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/projects');
  return (project as { id: string }).id;
}

export async function deleteProject(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/projects');
  revalidatePath('/work');
}

export async function batchSetPublished(ids: string[], published: boolean) {
  const { supabase, userId } = await requireAuth();
  const { error } = await supabase
    .from('projects')
    .update({ published, updated_by: userId, updated_at: new Date().toISOString() } as never)
    .in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/projects');
  revalidatePath('/work');
}

export async function batchUpdateProjects(ids: string[], data: Record<string, unknown>) {
  const { supabase, userId } = await requireAuth();
  const { error } = await supabase
    .from('projects')
    .update({ ...data, updated_by: userId, updated_at: new Date().toISOString() } as never)
    .in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/projects');
  revalidatePath('/work');
}

export async function batchDeleteProjects(ids: string[]) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('projects').delete().in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/projects');
  revalidatePath('/work');
}

export async function updateProjectOrder(
  column: 'home_order' | 'work_order',
  updates: { id: string; order: number }[]
) {
  const { supabase } = await requireAuth();
  const promises = updates.map(({ id, order }) =>
    supabase.from('projects').update({ [column]: order } as never).eq('id', id)
  );
  const results = await Promise.all(promises);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  revalidatePath('/admin/projects');
  revalidatePath('/');
  revalidatePath('/work');
}

// ── Videos ────────────────────────────────────────────────────────────────

export async function addProjectVideo(data: {
  project_id: string;
  bunny_video_id: string;
  title: string;
  video_type: 'flagship' | 'cutdown' | 'bts' | 'pitch';
  sort_order: number;
  password_protected?: boolean;
  viewer_password?: string | null;
  aspect_ratio?: string;
}) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('project_videos').insert(data as never);
  if (error) throw new Error(error.message);
}

export async function updateProjectVideo(
  id: string,
  data: Partial<{ title: string; video_type: 'flagship' | 'cutdown' | 'bts' | 'pitch'; sort_order: number; password_protected: boolean; viewer_password: string | null; aspect_ratio: string }>
) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('project_videos').update(data as never).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteProjectVideo(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('project_videos').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Credits ───────────────────────────────────────────────────────────────

export async function saveProjectCredits(
  projectId: string,
  credits: Array<{ role: string; name: string; sort_order: number }>
) {
  const { supabase } = await requireAuth();
  await supabase.from('project_credits').delete().eq('project_id', projectId);
  if (credits.length > 0) {
    const rows = credits.map((c, i) => ({
      project_id: projectId,
      role: c.role,
      name: c.name,
      sort_order: c.sort_order ?? i,
    }));
    const { error } = await supabase.from('project_credits').insert(rows as never);
    if (error) throw new Error(error.message);
  }
}

// ── BTS Images ────────────────────────────────────────────────────────────

export async function saveProjectBTSImages(
  projectId: string,
  images: Array<{ image_url: string; caption: string | null; sort_order: number }>
) {
  const { supabase } = await requireAuth();
  await supabase.from('project_bts_images').delete().eq('project_id', projectId);
  if (images.length > 0) {
    const rows = images.map((img, i) => ({
      project_id: projectId,
      image_url: img.image_url,
      caption: img.caption ?? null,
      sort_order: img.sort_order ?? i,
    }));
    const { error } = await supabase.from('project_bts_images').insert(rows as never);
    if (error) throw new Error(error.message);
  }
}

// ── SEO Settings ─────────────────────────────────────────────────────────

export type SeoRow = {
  id: string;
  page_slug: string;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  no_index: boolean;
  updated_at: string;
  updated_by: string | null;
};

export async function getSeoSettings(): Promise<SeoRow[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('seo_settings')
    .select('*')
    .order('page_slug');
  if (error) throw new Error(error.message);
  return (data ?? []) as SeoRow[];
}

export async function updateSeoSetting(id: string, data: Partial<Omit<SeoRow, 'id' | 'updated_at' | 'updated_by'>>) {
  const { supabase, userId } = await requireAuth();
  const { error } = await supabase
    .from('seo_settings')
    .update({ ...data, updated_by: userId, updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/seo');
  // Revalidate all public pages so metadata refreshes
  revalidatePath('/', 'layout');
}

// ── Testimonials ─────────────────────────────────────────────────────────

export type TestimonialRow = {
  id: string;
  project_id: string | null;
  client_id: string | null;
  quote: string;
  person_name: string | null;
  person_title: string | null;
  display_title: string | null;
  company: string | null;
  profile_picture_url: string | null;
  display_order: number;
  created_at: string;
  project?: { title: string } | null;
  client?: { name: string; logo_url: string | null } | null;
};

export async function getTestimonials(): Promise<TestimonialRow[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('testimonials')
    .select('*, project:projects(title), client:clients(name, logo_url)')
    .order('display_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as TestimonialRow[];
}

export async function createTestimonial(data: {
  quote: string;
  person_name?: string | null;
  person_title?: string | null;
  display_title?: string | null;
  company?: string | null;
  profile_picture_url?: string | null;
  project_id?: string | null;
  client_id?: string | null;
  display_order?: number;
}): Promise<string> {
  const { supabase } = await requireAuth();
  const { data: row, error } = await supabase
    .from('testimonials')
    .insert(data as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/testimonials');
  revalidatePath('/');
  return (row as { id: string }).id;
}

export async function updateTestimonial(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('testimonials')
    .update(data as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/testimonials');
  revalidatePath('/');
}

export async function deleteTestimonial(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/testimonials');
  revalidatePath('/');
}

// ── Clients ──────────────────────────────────────────────────────────────

export type ClientRow = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  notes: string | null;
  logo_url: string | null;
  created_at: string;
};

export async function getClients(): Promise<ClientRow[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientRow[];
}

export async function createClientRecord(data: {
  name: string;
  company?: string | null;
  email: string;
  notes?: string | null;
  logo_url?: string | null;
}): Promise<string> {
  const { supabase } = await requireAuth();
  const { data: row, error } = await supabase
    .from('clients')
    .insert(data as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/clients');
  return (row as { id: string }).id;
}

export async function updateClientRecord(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('clients')
    .update(data as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/clients');
}

export async function deleteClientRecord(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/clients');
}

// ── Tag Suggestions ──────────────────────────────────────────────────────

export async function getTagSuggestions(): Promise<{
  style_tags: string[];
  premium_addons: string[];
  camera_techniques: string[];
  assets_delivered: string[];
}> {
  const { supabase } = await requireAuth();
  const { data } = await supabase
    .from('projects')
    .select('style_tags, premium_addons, camera_techniques, assets_delivered');

  type TagRow = { style_tags: string[] | null; premium_addons: string[] | null; camera_techniques: string[] | null; assets_delivered: string[] | null };
  const rows = (data ?? []) as TagRow[];

  const collect = (field: keyof TagRow) => {
    const set = new Set<string>();
    for (const row of rows) {
      const arr = row[field];
      if (Array.isArray(arr)) arr.forEach((t) => set.add(t));
    }
    return Array.from(set).sort();
  };

  return {
    style_tags: collect('style_tags'),
    premium_addons: collect('premium_addons'),
    camera_techniques: collect('camera_techniques'),
    assets_delivered: collect('assets_delivered'),
  };
}
