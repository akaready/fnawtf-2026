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

export async function batchDeleteProjects(ids: string[]) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('projects').delete().in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/projects');
  revalidatePath('/work');
}

// ── Project Fetchers (for side panel) ─────────────────────────────────────

export async function getProjectById(id: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as Record<string, unknown> & { id: string };
}

export async function getProjectVideos(projectId: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('project_videos')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<Record<string, unknown> & { id: string; bunny_video_id: string; title: string; video_type: 'flagship' | 'cutdown' | 'bts'; sort_order: number }>;
}

export async function getProjectCredits(projectId: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('project_credits')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ id?: string; role: string; name: string; sort_order: number; role_id: string | null; contact_id: string | null }>;
}

export async function getProjectBTSImages(projectId: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('project_bts_images')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ id?: string; image_url: string; caption: string | null; sort_order: number }>;
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
  credits: Array<{ role: string; name: string; sort_order: number; role_id?: string | null; contact_id?: string | null }>
) {
  const { supabase } = await requireAuth();
  await supabase.from('project_credits').delete().eq('project_id', projectId);
  if (credits.length > 0) {
    const rows = credits.map((c, i) => ({
      project_id: projectId,
      role: c.role,
      name: c.name,
      sort_order: c.sort_order ?? i,
      role_id: c.role_id ?? null,
      contact_id: c.contact_id ?? null,
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
  contact_id: string | null;
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
  contact?: { id: string; first_name: string; last_name: string; role: string | null; headshot_url: string | null } | null;
};

export async function getTestimonials(): Promise<TestimonialRow[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('testimonials')
    .select('*, project:projects(title), client:clients(name, logo_url), contact:contacts(id, first_name, last_name, role, headshot_url)')
    .order('display_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as TestimonialRow[];
}

export async function createTestimonial(data: {
  quote: string;
  contact_id?: string | null;
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
  company_types: string[];
  status: string;
  pipeline_stage: string;
  website_url: string | null;
  linkedin_url: string | null;
  description: string | null;
  industry: string | null;
  location: string | null;
  founded_year: number | null;
  company_size: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
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
  revalidatePath('/admin/companies');
  return (row as { id: string }).id;
}

export async function updateClientRecord(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('clients')
    .update(data as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/companies');
}

export async function deleteClientRecord(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/companies');
}

export async function uploadLogo(clientId: string, formData: FormData): Promise<string> {
  const { supabase } = await requireAuth();
  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${clientId}.${ext}`;
  // Use service-role client for storage upload to bypass storage RLS
  const { createServiceClient } = await import('@/lib/supabase/service');
  const serviceClient = createServiceClient();
  const { error } = await serviceClient.storage.from('logos').upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data: { publicUrl } } = serviceClient.storage.from('logos').getPublicUrl(path);
  await supabase.from('clients').update({ logo_url: publicUrl } as never).eq('id', clientId);
  return publicUrl;
}

// ── Company Info Scraper ────────────────────────────────────────────────

export type ScrapedCompanyInfo = {
  description?: string;
  website_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  industry?: string;
  location?: string;
  founded_year?: number;
  company_size?: string;
};

export async function scrapeCompanyInfo(_companyName: string, websiteUrl?: string | null): Promise<ScrapedCompanyInfo> {
  await requireAuth();
  const result: ScrapedCompanyInfo = {};

  // Helper to extract meta content
  const getMeta = (html: string, name: string): string | undefined => {
    const patterns = [
      new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i'),
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m?.[1]) return m[1].trim();
    }
    return undefined;
  };

  // Helper to find social links
  const findSocialLinks = (html: string) => {
    const linkedinMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/company\/[^"'\s]+)["']/i);
    const twitterMatch = html.match(/href=["'](https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^"'\s]+)["']/i);
    const instagramMatch = html.match(/href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"'\s]+)["']/i);
    if (linkedinMatch?.[1]) result.linkedin_url = linkedinMatch[1];
    if (twitterMatch?.[1]) result.twitter_url = twitterMatch[1];
    if (instagramMatch?.[1]) result.instagram_url = instagramMatch[1];
  };

  // If we have a website URL, scrape it
  if (websiteUrl) {
    try {
      const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FNA-Admin/1.0)' },
        signal: AbortSignal.timeout(8000),
      });
      if (resp.ok) {
        const html = await resp.text();
        result.description = getMeta(html, 'description') ?? getMeta(html, 'og:description');
        result.website_url = url;
        findSocialLinks(html);
      }
    } catch { /* timeout or fetch error — skip */ }
  }

  return result;
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

export async function createProposalDraft(): Promise<string> {
  const { supabase, userId } = await requireAuth();
  const slug = `proposal-${Date.now()}`;
  const password = Math.random().toString(36).slice(2, 10);
  const { data: row, error } = await supabase
    .from('proposals')
    .insert({
      title: 'Untitled Proposal',
      slug,
      contact_name: '',
      contact_email: null,
      contact_company: '',
      proposal_password: password,
      proposal_type: 'build',
      subtitle: '',
      status: 'draft',
      created_by: userId,
    } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
  return (row as { id: string }).id;
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
  sort_order?: number;
  visible?: boolean;
  description?: string | null;
}, quoteId?: string): Promise<string> {
  const { supabase } = await requireAuth();

  if (quoteId) {
    // Update existing quote by ID
    const { error } = await supabase
      .from('proposal_quotes')
      .update({ ...quoteData, updated_at: new Date().toISOString() } as never)
      .eq('id', quoteId);
    if (error) throw new Error(error.message);
    revalidatePath('/admin/proposals');
    return quoteId;
  } else {
    // Always create new
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

export async function reorderProposalQuotes(orderedIds: string[]) {
  const { supabase } = await requireAuth();
  await Promise.all(
    orderedIds.map((id, sort_order) =>
      supabase.from('proposal_quotes').update({ sort_order } as never).eq('id', id)
    )
  );
}

export async function deleteProposalQuote(quoteId: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('proposal_quotes')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', quoteId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
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

export async function deleteAllProposalMilestones(proposalId: string): Promise<void> {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('proposal_milestones')
    .delete()
    .eq('proposal_id', proposalId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
}

export async function batchCreateProposalMilestones(
  milestones: Array<{ proposal_id: string; label: string; start_date: string; end_date: string; sort_order: number; description?: string | null }>
): Promise<string[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('proposal_milestones')
    .insert(milestones as never)
    .select('id');
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
  return (data ?? []).map((r: { id: string }) => r.id);
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
    .order('last_name')
    .order('first_name');
  if (error) throw new Error(error.message);
  const contacts = (data ?? []) as import('@/types/proposal').ContactRow[];

  // Populate headshot_url from featured headshots
  const { data: featuredHeadshots } = await supabase
    .from('headshots')
    .select('contact_id, url')
    .eq('featured', true) as { data: Array<{ contact_id: string; url: string }> | null };
  if (featuredHeadshots) {
    const hsMap = new Map(featuredHeadshots.map(h => [h.contact_id, h.url]));
    for (const c of contacts) {
      if (!c.headshot_url && hsMap.has(c.id)) {
        c.headshot_url = hsMap.get(c.id) ?? null;
      }
    }
  }

  // For crew/cast without an explicit role/title, derive one from credits
  const crewCastIds = contacts
    .filter((c) => (c.type === 'crew' || c.type === 'cast') && !c.role)
    .map((c) => c.id);

  if (crewCastIds.length > 0) {
    const { data: credits } = await supabase
      .from('project_credits')
      .select('contact_id, role')
      .in('contact_id', crewCastIds);

    if (credits && credits.length > 0) {
      // Count role frequency per contact
      const roleCounts = new Map<string, Map<string, number>>();
      for (const cr of credits as Array<{ contact_id: string; role: string }>) {
        if (!cr.role) continue;
        let counts = roleCounts.get(cr.contact_id);
        if (!counts) { counts = new Map(); roleCounts.set(cr.contact_id, counts); }
        counts.set(cr.role, (counts.get(cr.role) ?? 0) + 1);
      }

      for (const contact of contacts) {
        if (contact.role) continue;
        if (contact.type === 'cast') {
          contact.role = 'Cast';
        } else if (contact.type === 'crew') {
          const counts = roleCounts.get(contact.id);
          if (counts) {
            let topRole = '';
            let topCount = 0;
            for (const [role, count] of counts) {
              if (count > topCount) { topRole = role; topCount = count; }
            }
            if (topRole) contact.role = topRole;
          }
        }
      }
    } else {
      // No credits found — still label cast
      for (const contact of contacts) {
        if (!contact.role && contact.type === 'cast') contact.role = 'Cast';
      }
    }
  }

  return contacts;
}

export async function createContact(data: {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  company?: string | null;
  notes?: string | null;
  type?: string;
  client_id?: string | null;
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

// ── Proposal Contacts (access list) ──────────────────────────────────────

export async function getProposalContacts(proposalId: string): Promise<(import('@/types/proposal').ContactRow & { pivot_id: string })[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('proposal_contacts')
    .select('id, contact_id, contacts(*)')
    .eq('proposal_id', proposalId);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<{ id: string; contact_id: string; contacts: Record<string, unknown> }>).map((row) => ({
    ...(row.contacts as unknown as import('@/types/proposal').ContactRow),
    pivot_id: row.id,
  }));
}

export async function addProposalContact(proposalId: string, contactId: string): Promise<string> {
  const { supabase } = await requireAuth();
  const { data: row, error } = await supabase
    .from('proposal_contacts')
    .insert({ proposal_id: proposalId, contact_id: contactId } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
  return (row as { id: string }).id;
}

export async function removeProposalContact(proposalId: string, contactId: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('proposal_contacts')
    .delete()
    .eq('proposal_id', proposalId)
    .eq('contact_id', contactId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
}

// ── Roles ────────────────────────────────────────────────────────────────

export type RoleWithCounts = {
  id: string;
  name: string;
  created_at: string;
  peopleCount: number;
  projectCount: number;
};

export async function getRoles(): Promise<RoleWithCounts[]> {
  const { supabase } = await requireAuth();
  const [{ data: rolesRaw }, { data: contactRolesRaw }, { data: creditsRaw }] = await Promise.all([
    supabase.from('roles').select('*').order('name'),
    supabase.from('contact_roles').select('role_id'),
    supabase.from('project_credits').select('role_id, project_id'),
  ]);

  const roles = (rolesRaw ?? []) as Array<{ id: string; name: string; created_at: string }>;
  const contactRoles = (contactRolesRaw ?? []) as Array<{ role_id: string }>;
  const credits = (creditsRaw ?? []) as Array<{ role_id: string | null; project_id: string }>;

  const peopleCounts = new Map<string, number>();
  for (const cr of contactRoles) {
    peopleCounts.set(cr.role_id, (peopleCounts.get(cr.role_id) ?? 0) + 1);
  }

  const projectSets = new Map<string, Set<string>>();
  for (const c of credits) {
    if (!c.role_id) continue;
    if (!projectSets.has(c.role_id)) projectSets.set(c.role_id, new Set());
    projectSets.get(c.role_id)!.add(c.project_id);
  }

  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    created_at: r.created_at,
    peopleCount: peopleCounts.get(r.id) ?? 0,
    projectCount: projectSets.get(r.id)?.size ?? 0,
  }));
}

export async function getAllRoles(): Promise<Array<{ id: string; name: string }>> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase.from('roles').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ id: string; name: string }>;
}

export async function createRole(name: string): Promise<string> {
  const { supabase } = await requireAuth();
  const { data: row, error } = await supabase
    .from('roles')
    .insert({ name: name.trim() } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/roles');
  return (row as { id: string }).id;
}

export async function renameRole(id: string, newName: string) {
  const { supabase } = await requireAuth();
  const { data: roleRaw } = await supabase.from('roles').select('name').eq('id', id).single();
  const role = roleRaw as { name: string } | null;
  if (!role) throw new Error('Role not found');

  const trimmed = newName.trim();
  if (trimmed === role.name) return;

  // Check if a role with this name already exists
  const { data: existing } = await supabase.from('roles').select('id').eq('name', trimmed).neq('id', id).maybeSingle();
  if (existing) throw new Error(`A role named "${trimmed}" already exists. Use merge instead.`);

  // Update denormalized role text on project_credits
  await supabase
    .from('project_credits')
    .update({ role: trimmed } as never)
    .eq('role_id', id);

  const { error } = await supabase.from('roles').update({ name: trimmed } as never).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/roles');
  revalidatePath('/work');
  revalidatePath('/');
}

export async function deleteRole(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('roles').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/roles');
}

export async function mergeRoles(sourceIds: string[], targetId: string) {
  const { supabase } = await requireAuth();
  const { data: targetRaw } = await supabase.from('roles').select('name').eq('id', targetId).single();
  const target = targetRaw as { name: string } | null;
  if (!target) throw new Error('Target role not found');

  for (const sourceId of sourceIds) {
    if (sourceId === targetId) continue;

    // Update project_credits: point to target role
    await supabase
      .from('project_credits')
      .update({ role_id: targetId, role: target.name } as never)
      .eq('role_id', sourceId);

    // Move contact_roles: re-point to target, ignore conflicts
    const { data: existingCR } = await supabase
      .from('contact_roles')
      .select('contact_id')
      .eq('role_id', sourceId);
    for (const cr of (existingCR ?? []) as Array<{ contact_id: string }>) {
      await supabase
        .from('contact_roles')
        .upsert({ contact_id: cr.contact_id, role_id: targetId } as never, { onConflict: 'contact_id,role_id' });
    }
    await supabase.from('contact_roles').delete().eq('role_id', sourceId);

    // Delete source role
    await supabase.from('roles').delete().eq('id', sourceId);
  }

  revalidatePath('/admin/roles');
  revalidatePath('/work');
  revalidatePath('/');
}

export async function getPeopleForRole(roleId: string): Promise<Array<{ id: string; first_name: string; last_name: string; type: string }>> {
  const { supabase } = await requireAuth();
  const { data: crRaw } = await supabase.from('contact_roles').select('contact_id').eq('role_id', roleId);
  const contactIds = ((crRaw ?? []) as Array<{ contact_id: string }>).map((cr) => cr.contact_id);
  if (contactIds.length === 0) return [];
  const { data, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, type')
    .in('id', contactIds)
    .order('last_name')
    .order('first_name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ id: string; first_name: string; last_name: string; type: string }>;
}

// ── Contact Roles (junction) ──────────────────────────────────────────────

export async function getContactRoles(contactId: string): Promise<Array<{ id: string; name: string }>> {
  const { supabase } = await requireAuth();
  const { data: crRaw } = await supabase.from('contact_roles').select('role_id').eq('contact_id', contactId);
  const roleIds = ((crRaw ?? []) as Array<{ role_id: string }>).map((cr) => cr.role_id);
  if (roleIds.length === 0) return [];
  const { data, error } = await supabase.from('roles').select('id, name').in('id', roleIds).order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ id: string; name: string }>;
}

export async function setContactRoles(contactId: string, roleIds: string[]) {
  const { supabase } = await requireAuth();
  await supabase.from('contact_roles').delete().eq('contact_id', contactId);
  if (roleIds.length > 0) {
    const rows = roleIds.map((role_id) => ({ contact_id: contactId, role_id }));
    const { error } = await supabase.from('contact_roles').insert(rows as never);
    if (error) throw new Error(error.message);
  }
  revalidatePath('/admin/contacts');
}

export async function getContactProjects(contactId: string): Promise<Array<{ id: string; title: string; client_name: string; thumbnail_url: string | null }>> {
  const { supabase } = await requireAuth();
  const { data: creditsRaw } = await supabase
    .from('project_credits')
    .select('project_id')
    .eq('contact_id', contactId);
  const projectIds = [...new Set(((creditsRaw ?? []) as Array<{ project_id: string }>).map((c) => c.project_id))];
  if (projectIds.length === 0) return [];
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, client_name, thumbnail_url')
    .in('id', projectIds)
    .order('title');
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ id: string; title: string; client_name: string; thumbnail_url: string | null }>;
}

export async function getProjectList(): Promise<Array<{ id: string; title: string; client_name: string }>> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, client_name')
    .order('client_name')
    .order('title');
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ id: string; title: string; client_name: string }>;
}

export async function getContactRoleMap(): Promise<Record<string, string[]>> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('contact_roles')
    .select('contact_id, role_id');
  if (error) throw new Error(error.message);
  const map: Record<string, string[]> = {};
  for (const row of (data ?? []) as Array<{ contact_id: string; role_id: string }>) {
    if (!map[row.contact_id]) map[row.contact_id] = [];
    if (!map[row.contact_id].includes(row.role_id)) map[row.contact_id].push(row.role_id);
  }
  return map;
}

export async function getContactProjectMap(): Promise<Record<string, string[]>> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('project_credits')
    .select('contact_id, project_id');
  if (error) throw new Error(error.message);
  const map: Record<string, string[]> = {};
  for (const row of (data ?? []) as Array<{ contact_id: string | null; project_id: string }>) {
    if (!row.contact_id) continue;
    if (!map[row.contact_id]) map[row.contact_id] = [];
    if (!map[row.contact_id].includes(row.project_id)) map[row.contact_id].push(row.project_id);
  }
  return map;
}

// ── Tag Suggestions ──────────────────────────────────────────────────────

export async function getTagSuggestions(): Promise<{
  style_tags: string[];
  premium_addons: string[];
  camera_techniques: string[];
  assets_delivered: string[];
  project_type: string[];
}> {
  const { supabase } = await requireAuth();
  const { data } = await supabase.from('tags').select('name, category').order('name');
  const rows = (data ?? []) as Array<{ name: string; category: string }>;
  return {
    style_tags: rows.filter((t) => t.category === 'style').map((t) => t.name),
    premium_addons: rows.filter((t) => t.category === 'addon').map((t) => t.name),
    camera_techniques: rows.filter((t) => t.category === 'technique').map((t) => t.name),
    assets_delivered: rows.filter((t) => t.category === 'deliverable').map((t) => t.name),
    project_type: rows.filter((t) => t.category === 'project_type').map((t) => t.name),
  };
}

// ── Tag CRUD ──────────────────────────────────────────────────────────────

type TagCategory = 'style' | 'technique' | 'addon' | 'deliverable' | 'project_type';

const CATEGORY_COLUMN: Record<TagCategory, string> = {
  style: 'style_tags',
  technique: 'camera_techniques',
  addon: 'premium_addons',
  deliverable: 'assets_delivered',
  project_type: 'category',
};

const SCALAR_CATEGORIES = new Set<TagCategory>(['project_type']);

export type TagWithCount = {
  id: string;
  name: string;
  category: TagCategory;
  color: string | null;
  projectCount: number;
};

type TagRow = { id: string; name: string; category: string; color: string | null };
type ProjTagRow = { id: string; style_tags: string[] | null; premium_addons: string[] | null; camera_techniques: string[] | null; assets_delivered: string[] | null; category: string | null };

export async function getTags(): Promise<TagWithCount[]> {
  const { supabase } = await requireAuth();
  const [{ data: tagsRaw }, { data: projectsRaw }] = await Promise.all([
    supabase.from('tags').select('*').order('category').order('name'),
    supabase.from('projects').select('style_tags, premium_addons, camera_techniques, assets_delivered, category'),
  ]);

  const tags = (tagsRaw ?? []) as TagRow[];
  const rows = (projectsRaw ?? []) as Omit<ProjTagRow, 'id'>[];

  const countMap = new Map<string, number>();
  for (const row of rows) {
    (row.style_tags ?? []).forEach((t) => countMap.set(`style:${t}`, (countMap.get(`style:${t}`) ?? 0) + 1));
    (row.premium_addons ?? []).forEach((t) => countMap.set(`addon:${t}`, (countMap.get(`addon:${t}`) ?? 0) + 1));
    (row.camera_techniques ?? []).forEach((t) => countMap.set(`technique:${t}`, (countMap.get(`technique:${t}`) ?? 0) + 1));
    (row.assets_delivered ?? []).forEach((t) => countMap.set(`deliverable:${t}`, (countMap.get(`deliverable:${t}`) ?? 0) + 1));
    if (row.category) countMap.set(`project_type:${row.category}`, (countMap.get(`project_type:${row.category}`) ?? 0) + 1);
  }

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    category: tag.category as TagCategory,
    color: tag.color,
    projectCount: countMap.get(`${tag.category}:${tag.name}`) ?? 0,
  }));
}

export async function createTag(name: string, category: TagCategory) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('tags').insert({ name: name.trim(), category } as never);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/tags');
  revalidatePath('/admin/projects');
}

export async function renameTag(id: string, newName: string) {
  const { supabase } = await requireAuth();
  const { data: tagRaw } = await supabase.from('tags').select('name, category').eq('id', id).single();
  const tag = tagRaw as { name: string; category: string } | null;
  if (!tag) throw new Error('Tag not found');

  const col = CATEGORY_COLUMN[tag.category as TagCategory];
  const isScalar = SCALAR_CATEGORIES.has(tag.category as TagCategory);
  const oldName = tag.name;
  const trimmed = newName.trim();

  if (isScalar) {
    await supabase.from('projects').update({ [col]: trimmed } as never).eq(col, oldName);
  } else {
    const { data: affectedRaw } = await supabase.from('projects').select(`id, ${col}`).contains(col, [oldName]);
    const affected = (affectedRaw ?? []) as Array<Record<string, unknown>>;
    if (affected.length > 0) {
      await Promise.all(
        affected.map((p) => {
          const arr = ((p[col] as string[]) ?? []).map((t) => (t === oldName ? trimmed : t));
          return supabase.from('projects').update({ [col]: arr } as never).eq('id', p.id as string);
        })
      );
    }
  }

  const { error } = await supabase.from('tags').update({ name: trimmed } as never).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/tags');
  revalidatePath('/work');
  revalidatePath('/');
}

export async function deleteTag(id: string) {
  const { supabase } = await requireAuth();
  const { data: tagRaw } = await supabase.from('tags').select('name, category').eq('id', id).single();
  const tag = tagRaw as { name: string; category: string } | null;
  if (!tag) throw new Error('Tag not found');

  const col = CATEGORY_COLUMN[tag.category as TagCategory];
  const isScalar = SCALAR_CATEGORIES.has(tag.category as TagCategory);

  if (isScalar) {
    await supabase.from('projects').update({ [col]: null } as never).eq(col, tag.name);
  } else {
    const { data: affectedRaw } = await supabase.from('projects').select(`id, ${col}`).contains(col, [tag.name]);
    const affected = (affectedRaw ?? []) as Array<Record<string, unknown>>;
    if (affected.length > 0) {
      await Promise.all(
        affected.map((p) => {
          const arr = ((p[col] as string[]) ?? []).filter((t) => t !== tag.name);
          return supabase.from('projects').update({ [col]: arr.length > 0 ? arr : null } as never).eq('id', p.id as string);
        })
      );
    }
  }

  const { error } = await supabase.from('tags').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/tags');
  revalidatePath('/work');
  revalidatePath('/');
}

export async function mergeTags(sourceIds: string[], targetId: string) {
  const { supabase } = await requireAuth();
  const { data: targetRaw } = await supabase.from('tags').select('name, category').eq('id', targetId).single();
  const target = targetRaw as { name: string; category: string } | null;
  if (!target) throw new Error('Target tag not found');

  const col = CATEGORY_COLUMN[target.category as TagCategory];
  const isScalar = SCALAR_CATEGORIES.has(target.category as TagCategory);

  for (const sourceId of sourceIds) {
    if (sourceId === targetId) continue;
    const { data: sourceRaw } = await supabase.from('tags').select('name').eq('id', sourceId).single();
    const source = sourceRaw as { name: string } | null;
    if (!source) continue;

    if (isScalar) {
      await supabase.from('projects').update({ [col]: target.name } as never).eq(col, source.name);
    } else {
      const { data: affectedRaw } = await supabase.from('projects').select(`id, ${col}`).contains(col, [source.name]);
      const affected = (affectedRaw ?? []) as Array<Record<string, unknown>>;
      if (affected.length > 0) {
        await Promise.all(
          affected.map((p) => {
            let arr = (p[col] as string[]) ?? [];
            if (arr.includes(target.name)) {
              arr = arr.filter((t) => t !== source.name);
            } else {
              arr = arr.map((t) => (t === source.name ? target.name : t));
            }
            return supabase.from('projects').update({ [col]: arr } as never).eq('id', p.id as string);
          })
        );
      }
    }
    await supabase.from('tags').delete().eq('id', sourceId);
  }

  revalidatePath('/admin/tags');
  revalidatePath('/work');
  revalidatePath('/');
}

export async function getProjectsForTag(
  tagName: string,
  category: TagCategory
): Promise<Array<{ id: string; title: string; published: boolean; client_name: string }>> {
  const { supabase } = await requireAuth();
  const col = CATEGORY_COLUMN[category];
  const isScalar = SCALAR_CATEGORIES.has(category);
  let query = supabase
    .from('projects')
    .select('id, title, published, client_name');
  query = isScalar ? query.eq(col, tagName) : query.contains(col, [tagName]);
  const { data, error } = await query.order('title');
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ id: string; title: string; published: boolean; client_name: string }>;
}

// ── Proposal Projects (samples) ──────────────────────────────────────────

export async function getProposalProjects(proposalId: string): Promise<import('@/types/proposal').ProposalProjectWithProject[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('proposal_projects')
    .select('id, proposal_id, project_id, section_id, sort_order, blurb, project:projects(id, title, slug, thumbnail_url, client_name, style_tags, premium_addons, camera_techniques)')
    .eq('proposal_id', proposalId)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as import('@/types/proposal').ProposalProjectWithProject[];
}

export async function reorderProposalProjects(updates: { id: string; sort_order: number }[]): Promise<void> {
  const { supabase } = await requireAuth();
  const promises = updates.map(({ id, sort_order }) =>
    supabase.from('proposal_projects').update({ sort_order } as never).eq('id', id)
  );
  const results = await Promise.all(promises);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  revalidatePath('/admin/proposals');
}

export async function updateProposalProjectBlurb(id: string, blurb: string | null): Promise<void> {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('proposal_projects')
    .update({ blurb } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
}

export async function getProjectsForBrowser(): Promise<import('@/types/proposal').BrowserProject[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, slug, thumbnail_url, client_name, style_tags, premium_addons, camera_techniques, assets_delivered, category, production_days, crew_count, talent_count, location_count')
    .eq('published', true)
    .order('client_name')
    .order('title');
  if (error) throw new Error(error.message);
  return (data ?? []) as import('@/types/proposal').BrowserProject[];
}

// ── Website Project Placements ─────────────────────────────────────────────────

import type { PlacementPage, PlacementWithProject } from '@/types/placement';

export async function getPlacementsForPage(page: PlacementPage): Promise<PlacementWithProject[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('website_project_placements')
    .select('*, project:projects(id, title, slug, thumbnail_url, client_name, published)')
    .eq('page', page)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PlacementWithProject[];
}

export async function addPlacement(input: {
  project_id: string;
  page: PlacementPage;
  sort_order: number;
  full_width?: boolean;
}): Promise<string> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('website_project_placements')
    .insert(input as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePlacements(input.page);
  return (data as { id: string }).id;
}

export async function removePlacement(id: string, page: PlacementPage) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('website_project_placements')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePlacements(page);
}

export async function updatePlacement(
  id: string,
  data: Partial<{ sort_order: number; full_width: boolean }>,
  page: PlacementPage,
) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('website_project_placements')
    .update(data as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePlacements(page);
}

export async function reorderPlacements(
  updates: { id: string; sort_order: number }[],
  page: PlacementPage,
) {
  const { supabase } = await requireAuth();
  const promises = updates.map(({ id, sort_order }) =>
    supabase
      .from('website_project_placements')
      .update({ sort_order } as never)
      .eq('id', id),
  );
  const results = await Promise.all(promises);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  revalidatePlacements(page);
}

function revalidatePlacements(page: PlacementPage) {
  revalidatePath('/admin/website');
  if (page === 'homepage') revalidatePath('/');
  else if (page === 'work') revalidatePath('/work');
  else revalidatePath('/services');
}

// ── Headshots ──────────────────────────────────────────────────────────────

export interface HeadshotRow {
  id: string;
  contact_id: string;
  storage_path: string;
  url: string;
  featured: boolean;
  width: number;
  height: number;
  aspect_ratio: number;
  file_size: number;
  source_url: string | null;
  created_at: string;
}

export async function getHeadshots(contactId: string): Promise<HeadshotRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('headshots')
    .select('*')
    .eq('contact_id', contactId)
    .order('featured', { ascending: false })
    .order('created_at');
  if (error) throw new Error(error.message);
  return (data || []) as HeadshotRow[];
}

export async function getContactsWithHeadshots(): Promise<
  (import('@/types/proposal').ContactRow & { featured_headshot_url: string | null })[]
> {
  const supabase = await createClient();
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .order('last_name')
    .order('first_name');
  if (error) throw new Error(error.message);

  // Get featured headshots for all contacts in one query
  const { data: headshots } = await supabase
    .from('headshots')
    .select('contact_id, url')
    .eq('featured', true) as { data: Array<{ contact_id: string; url: string }> | null };

  const headshotMap = new Map((headshots || []).map(h => [h.contact_id, h.url]));

  return ((contacts || []) as unknown as import('@/types/proposal').ContactRow[]).map(c => ({
    ...c,
    featured_headshot_url: headshotMap.get(c.id) || null,
  }));
}

export async function setFeaturedHeadshot(headshotId: string, contactId: string) {
  const { supabase } = await requireAuth();
  // Unset all featured for this contact
  await supabase
    .from('headshots')
    .update({ featured: false } as never)
    .eq('contact_id', contactId);
  // Set the selected one
  const { error } = await supabase
    .from('headshots')
    .update({ featured: true } as never)
    .eq('id', headshotId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/contacts');
}

export async function deleteHeadshot(headshotId: string) {
  const { supabase } = await requireAuth();
  // Get storage path first
  const { data: headshot } = await supabase
    .from('headshots')
    .select('storage_path')
    .eq('id', headshotId)
    .single() as { data: { storage_path: string } | null };
  if (headshot) {
    await supabase.storage.from('headshots').remove([headshot.storage_path]);
  }
  const { error } = await supabase.from('headshots').delete().eq('id', headshotId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/contacts');
}

// ── Meetings ──────────────────────────────────────────────────────────────

export async function getMeetings(filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}) {
  const { supabase } = await requireAuth();
  let query = supabase
    .from('meetings')
    .select(`
      *,
      meeting_attendees (*),
      meeting_transcripts (*),
      meeting_relationships (
        *,
        clients:client_id (id, name, logo_url),
        contacts:contact_id (id, first_name, last_name, email)
      )
    `)
    .neq('title', 'Busy')
    .order('start_time', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.dateFrom) query = query.gte('start_time', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('start_time', filters.dateTo);
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMeeting(id: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      meeting_attendees (*),
      meeting_transcripts (*),
      meeting_relationships (
        *,
        clients:client_id (id, name, logo_url),
        contacts:contact_id (id, first_name, last_name, email)
      )
    `)
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getMeetingsConfig() {
  const { supabase } = await requireAuth();
  const { data } = await supabase
    .from('meetings_config')
    .select('*')
    .limit(1)
    .single();
  return data;
}

export async function saveMeetingsConfig(icalUrl: string) {
  const { supabase } = await requireAuth();
  // Check if config exists
  const { data: existing } = await supabase
    .from('meetings_config')
    .select('id')
    .limit(1)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('meetings_config')
      .update({ ical_url: icalUrl, updated_at: new Date().toISOString() } as never)
      .eq('id', (existing as { id: string }).id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('meetings_config')
      .insert({ ical_url: icalUrl } as never);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/admin/meetings');
}

export async function triggerCalendarSync() {
  const { supabase } = await requireAuth();

  // Get config
  const { data: config } = await supabase
    .from('meetings_config')
    .select('ical_url')
    .limit(1)
    .single();

  const icalUrl = (config as { ical_url?: string } | null)?.ical_url || process.env.GOOGLE_ICAL_URL;
  if (!icalUrl) return { synced: 0, botsScheduled: 0, error: 'No iCal URL configured' };

  // Import and run sync logic directly (server action context)
  const { fetchAndParseCalendar } = await import('@/lib/calendar');
  const { createRecallBot } = await import('@/lib/recall');
  const { matchAttendeesForMeeting } = await import('@/lib/meetings/matchAttendees');

  try {
    // Clean up any previously-synced "Busy" placeholder events
    await supabase.from('meetings').delete().eq('title', 'Busy');

    const events = await fetchAndParseCalendar(icalUrl);
    const now = new Date();
    const tenMinFromNow = new Date(now.getTime() + 10 * 60 * 1000);

    let synced = 0;
    let botsScheduled = 0;

    for (const event of events) {
      if (event.endTime < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
        continue;

      const status = event.meetingUrl
        ? event.startTime < now
          ? 'completed'
          : 'upcoming'
        : 'no_video_link';

      const { data: meeting } = await supabase
        .from('meetings')
        .upsert(
          {
            ical_uid: event.uid,
            title: event.title,
            description: event.description,
            start_time: event.startTime.toISOString(),
            end_time: event.endTime.toISOString(),
            meeting_url: event.meetingUrl,
            location: event.location,
            organizer_email: event.organizerEmail,
            status,
            raw_event: event.raw,
            updated_at: new Date().toISOString(),
          } as never,
          { onConflict: 'ical_uid' },
        )
        .select('id, recall_bot_id, status')
        .single();

      const m = meeting as { id: string; recall_bot_id: string | null; status: string } | null;
      if (!m) continue;
      synced++;

      if (event.attendees.length > 0) {
        await supabase.from('meeting_attendees').upsert(
          event.attendees.map((att) => ({
            meeting_id: m.id,
            email: att.email,
            display_name: att.name,
            response_status: att.status,
            is_organizer: att.email === event.organizerEmail,
          })) as never,
          { onConflict: 'meeting_id,email' },
        );
      }

      if (
        event.meetingUrl &&
        event.startTime > tenMinFromNow &&
        !m.recall_bot_id
      ) {
        try {
          const bot = await createRecallBot({
            meeting_url: event.meetingUrl,
            join_at: event.startTime.toISOString(),
          });
          await supabase
            .from('meetings')
            .update({
              recall_bot_id: bot.id,
              status: 'bot_scheduled',
              updated_at: new Date().toISOString(),
            } as never)
            .eq('id', m.id);
          botsScheduled++;
        } catch (err) {
          console.error(`Failed to schedule bot for ${event.uid}:`, err);
        }
      }

      await matchAttendeesForMeeting(supabase, m.id);
    }

    // Update last synced
    if (config) {
      await supabase
        .from('meetings_config')
        .update({
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq('ical_url', icalUrl);
    }

    revalidatePath('/admin/meetings');
    return { synced, botsScheduled };
  } catch (err) {
    console.error('Calendar sync failed:', err);
    revalidatePath('/admin/meetings');
    return { synced: 0, botsScheduled: 0, error: (err as Error).message };
  }
}

export async function linkMeetingToCompany(meetingId: string, clientId: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('meeting_relationships').insert({
    meeting_id: meetingId,
    client_id: clientId,
    contact_id: null,
    match_type: 'manual',
  } as never);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/meetings');
}

export async function linkMeetingToContact(meetingId: string, contactId: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('meeting_relationships').insert({
    meeting_id: meetingId,
    contact_id: contactId,
    client_id: null,
    match_type: 'manual',
  } as never);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/meetings');
}

export async function unlinkMeetingRelationship(relationshipId: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('meeting_relationships')
    .delete()
    .eq('id', relationshipId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/meetings');
}
