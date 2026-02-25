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

// ── Content Snippets ────────────────────────────────────────────────────

export type { ContentSnippetRow } from '@/types/proposal';

export async function getContentSnippets() {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('content_snippets')
    .select('*')
    .order('snippet_type')
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as import('@/types/proposal').ContentSnippetRow[];
}

export async function createContentSnippet(data: {
  title: string;
  body: string;
  snippet_type: string;
  category: string;
  sort_order?: number;
}): Promise<string> {
  const { supabase } = await requireAuth();
  const { data: row, error } = await supabase
    .from('content_snippets')
    .insert(data as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/content');
  return (row as { id: string }).id;
}

export async function updateContentSnippet(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('content_snippets')
    .update({ ...data, updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/content');
}

export async function deleteContentSnippet(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('content_snippets').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/content');
}

// ── Proposals ───────────────────────────────────────────────────────────

export type { ProposalRow } from '@/types/proposal';

export async function getProposals() {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as import('@/types/proposal').ProposalRow[];
}

export async function getProposal(id: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as import('@/types/proposal').ProposalRow;
}

export async function createProposal(data: {
  title: string;
  slug: string;
  contact_name: string;
  contact_email?: string | null;
  contact_company: string;
  proposal_password: string;
  proposal_type: string;
  subtitle: string;
}): Promise<string> {
  const { supabase, userId } = await requireAuth();
  const { data: row, error } = await supabase
    .from('proposals')
    .insert({ ...data, created_by: userId } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
  return (row as { id: string }).id;
}

export async function updateProposal(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('proposals')
    .update({ ...data, updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
}

export async function deleteProposal(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('proposals').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
}

// ── Proposal Sections ───────────────────────────────────────────────────

export type { ProposalSectionRow, ProposalVideoRow, ProposalProjectRow } from '@/types/proposal';

export async function getProposalSections(proposalId: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('proposal_sections')
    .select('*')
    .eq('proposal_id', proposalId)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as import('@/types/proposal').ProposalSectionRow[];
}

export async function addProposalSection(data: {
  proposal_id: string;
  section_type: string;
  snippet_id?: string | null;
  custom_content?: string | null;
  custom_title?: string | null;
  layout_columns?: number;
  layout_position?: string;
  sort_order: number;
}): Promise<string> {
  const { supabase } = await requireAuth();
  const { data: row, error } = await supabase
    .from('proposal_sections')
    .insert(data as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
  return (row as { id: string }).id;
}

export async function updateProposalSection(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('proposal_sections')
    .update(data as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
}

export async function deleteProposalSection(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('proposal_sections').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
}

export async function reorderProposalSections(updates: { id: string; sort_order: number }[]) {
  const { supabase } = await requireAuth();
  const promises = updates.map(({ id, sort_order }) =>
    supabase.from('proposal_sections').update({ sort_order } as never).eq('id', id)
  );
  const results = await Promise.all(promises);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  revalidatePath('/admin/proposals');
}

// ── Proposal Videos ─────────────────────────────────────────────────────

export async function getProposalVideos(proposalId: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('proposal_videos')
    .select('*, proposal_blurb, project_video:project_videos(id, bunny_video_id, title, video_type, aspect_ratio, project_id)')
    .eq('proposal_id', proposalId)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addProposalVideo(data: {
  proposal_id: string;
  section_id: string;
  project_video_id: string;
  sort_order: number;
}): Promise<string> {
  const { supabase } = await requireAuth();
  const { data: row, error } = await supabase
    .from('proposal_videos')
    .insert(data as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
  return (row as { id: string }).id;
}

export async function removeProposalVideo(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('proposal_videos').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
}

export async function updateProposalVideoBlurb(id: string, blurb: string | null): Promise<void> {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('proposal_videos')
    .update({ proposal_blurb: blurb } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
}

export async function reorderProposalVideos(updates: { id: string; sort_order: number }[]): Promise<void> {
  const { supabase } = await requireAuth();
  const promises = updates.map(({ id, sort_order }) =>
    supabase.from('proposal_videos').update({ sort_order } as never).eq('id', id)
  );
  const results = await Promise.all(promises);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  revalidatePath('/admin/proposals');
}

// ── Proposal Projects ───────────────────────────────────────────────────

export async function addProposalProject(data: {
  proposal_id: string;
  section_id?: string | null;
  project_id: string;
  sort_order: number;
}): Promise<string> {
  const { supabase } = await requireAuth();
  const { data: row, error } = await supabase
    .from('proposal_projects')
    .insert(data as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
  return (row as { id: string }).id;
}

export async function removeProposalProject(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('proposal_projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
}

// ── Video Library (all project videos for sidebar) ─────────────────────

export async function getVideoLibrary() {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('project_videos')
    .select('id, bunny_video_id, title, video_type, aspect_ratio, project_id, project:projects(id, title, thumbnail_url, slug)')
    .order('project_id')
    .order('sort_order');
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Proposal Quotes ─────────────────────────────────────────────────────

export type { ProposalQuoteRow } from '@/types/proposal';

export async function getProposalQuotes(proposalId: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('proposal_quotes')
    .select('*')
    .eq('proposal_id', proposalId)
    .order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as import('@/types/proposal').ProposalQuoteRow[];
}

export async function saveProposalQuote(proposalId: string, quoteData: {
  label?: string;
  is_locked?: boolean;
  is_fna_quote?: boolean;
  quote_type: string;
  selected_addons: Record<string, number>;
  slider_values: Record<string, number>;
  tier_selections: Record<string, string>;
  location_days: Record<string, number[]>;
  photo_count: number;
  crowdfunding_enabled: boolean;
  crowdfunding_tier: number;
  fundraising_enabled: boolean;
  defer_payment: boolean;
  friendly_discount_pct: number;
  total_amount: number | null;
  down_amount: number | null;
}): Promise<string> {
  const { supabase } = await requireAuth();

  // Check if FNA quote already exists for this proposal
  const { data: existing } = await supabase
    .from('proposal_quotes')
    .select('id')
    .eq('proposal_id', proposalId)
    .eq('is_fna_quote', true)
    .single();

  if (existing) {
    // Update existing
    const row = existing as { id: string };
    const { error } = await supabase
      .from('proposal_quotes')
      .update({ ...quoteData, updated_at: new Date().toISOString() } as never)
      .eq('id', row.id);
    if (error) throw new Error(error.message);
    revalidatePath('/admin/proposals');
    return row.id;
  } else {
    // Create new
    const { data: row, error } = await supabase
      .from('proposal_quotes')
      .insert({ proposal_id: proposalId, is_fna_quote: true, is_locked: true, ...quoteData } as never)
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    revalidatePath('/admin/proposals');
    return (row as { id: string }).id;
  }
}

// ── Proposal Milestones ──────────────────────────────────────────────────

export async function getProposalMilestones(proposalId: string): Promise<import('@/types/proposal').ProposalMilestoneRow[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('proposal_milestones')
    .select('*')
    .eq('proposal_id', proposalId)
    .order('start_date');
  if (error) throw new Error(error.message);
  return (data ?? []) as import('@/types/proposal').ProposalMilestoneRow[];
}

export async function addProposalMilestone(input: {
  proposal_id: string;
  label: string;
  start_date: string;
  end_date: string;
  sort_order: number;
}): Promise<string> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('proposal_milestones')
    .insert(input as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
  return (data as { id: string }).id;
}

export async function updateProposalMilestone(id: string, updates: {
  label?: string;
  start_date?: string;
  end_date?: string;
  sort_order?: number;
}): Promise<void> {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('proposal_milestones')
    .update(updates as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
}

export async function deleteProposalMilestone(id: string): Promise<void> {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('proposal_milestones')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
}

// ── Proposal Analytics ───────────────────────────────────────────────────

export async function getProposalViewCounts(): Promise<Record<string, { views: number; lastViewed: string | null }>> {
  const { supabase } = await requireAuth();
  const { data } = await supabase
    .from('proposal_views')
    .select('proposal_id, viewed_at');

  const result: Record<string, { views: number; lastViewed: string | null }> = {};
  for (const row of (data ?? []) as { proposal_id: string; viewed_at: string }[]) {
    if (!result[row.proposal_id]) {
      result[row.proposal_id] = { views: 0, lastViewed: null };
    }
    result[row.proposal_id].views++;
    if (!result[row.proposal_id].lastViewed || row.viewed_at > result[row.proposal_id].lastViewed!) {
      result[row.proposal_id].lastViewed = row.viewed_at;
    }
  }
  return result;
}

// ── Contacts ─────────────────────────────────────────────────────────────

export async function getContacts(): Promise<import('@/types/proposal').ContactRow[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as import('@/types/proposal').ContactRow[];
}

export async function createContact(data: {
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  company?: string | null;
  notes?: string | null;
}): Promise<string> {
  const { supabase } = await requireAuth();
  const { data: row, error } = await supabase
    .from('contacts')
    .insert(data as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/contacts');
  return (row as { id: string }).id;
}

export async function updateContact(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('contacts')
    .update({ ...data, updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/contacts');
}

export async function deleteContact(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/contacts');
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
