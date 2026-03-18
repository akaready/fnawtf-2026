'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { notifySlack } from '@/lib/slack/notify';

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
    .insert({ type: 'video', ...data, updated_by: userId } as never)
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

  if (published) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, title, client_name')
      .in('id', ids);
    for (const p of (projects as { id: string; title: string; client_name: string }[]) ?? []) {
      await notifySlack({
        type: 'project_published',
        data: { id: p.id, title: p.title, clientName: p.client_name },
      });
    }
  }
}

export async function batchDeleteProjects(ids: string[]) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('projects').delete().in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/projects');
  revalidatePath('/work');
}

export async function batchDeleteClients(ids: string[]) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('clients').delete().in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/companies');
}

export async function batchDeleteContacts(ids: string[]) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('contacts').delete().in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/contacts');
}

export async function batchDeleteTestimonials(ids: string[]) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('testimonials').delete().in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/testimonials');
  revalidatePath('/');
}

export async function batchDeleteProposals(ids: string[]) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('proposals').delete().in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/proposals');
}

export async function batchDeleteRoles(ids: string[]) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('roles').delete().in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/roles');
}

export async function batchDeleteTags(ids: string[]) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('tags').delete().in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/tags');
}

export async function batchDeleteScripts(ids: string[]) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('scripts').delete().in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/scripts');
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

export async function uploadBTSImage(projectId: string, formData: FormData): Promise<string> {
  await requireAuth();
  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${projectId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { createServiceClient } = await import('@/lib/supabase/service');
  const serviceClient = createServiceClient();
  const { error } = await serviceClient.storage.from('bts-images').upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  const { data: { publicUrl } } = serviceClient.storage.from('bts-images').getPublicUrl(path);
  return publicUrl;
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
  detail_title_template: string | null;
  detail_description_template: string | null;
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

export async function mergeTestimonials(sourceIds: string[], targetId: string) {
  const { supabase } = await requireAuth();
  for (const id of sourceIds) {
    if (id === targetId) continue;
    await supabase.from('testimonials').delete().eq('id', id);
  }
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
  website_url: string | null;
  linkedin_url: string | null;
  description: string | null;
  industry: string[] | null;
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
  company_types?: string[];
  status?: string;
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

export async function tagClientAsLead(clientId: string) {
  const { supabase } = await requireAuth();
  const { data: client, error: fetchErr } = await supabase
    .from('clients')
    .select('company_types, status')
    .eq('id', clientId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);
  const types: string[] = (client as { company_types: string[] }).company_types ?? [];
  const updates: Record<string, unknown> = {};
  if (!types.includes('lead')) updates.company_types = [...types, 'lead'];
  const currentStatus = (client as { status: string }).status;
  if (currentStatus === 'lead') updates.status = 'pitching';
  if (Object.keys(updates).length === 0) return;
  const { error } = await supabase.from('clients').update(updates as never).eq('id', clientId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/companies');
  revalidatePath('/admin/leads');
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

  const proposalId = (row as { id: string }).id;
  await notifySlack({
    type: 'proposal_created',
    data: { id: proposalId, title: data.title, company: data.contact_company, slug: data.slug },
  });

  return proposalId;
}

export async function updateProposal(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('proposals')
    .update({ ...data, updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  // No revalidatePath — panel manages proposal state client-side
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
  const password = 'welcome';
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
  return (row as { id: string }).id;
}

export async function updateProposalSection(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('proposal_sections')
    .update(data as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  // No revalidatePath — panel manages section state client-side;
  // revalidating here caused a render loop (auto-save fires every 600ms)
}

export async function deleteProposalSection(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('proposal_sections').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function reorderProposalSections(updates: { id: string; sort_order: number }[]) {
  const { supabase } = await requireAuth();
  const promises = updates.map(({ id, sort_order }) =>
    supabase.from('proposal_sections').update({ sort_order } as never).eq('id', id)
  );
  const results = await Promise.all(promises);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
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
  return (row as { id: string }).id;
}

export async function removeProposalVideo(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('proposal_videos').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateProposalVideoBlurb(id: string, blurb: string | null): Promise<void> {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('proposal_videos')
    .update({ proposal_blurb: blurb } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function reorderProposalVideos(updates: { id: string; sort_order: number }[]): Promise<void> {
  const { supabase } = await requireAuth();
  const promises = updates.map(({ id, sort_order }) =>
    supabase.from('proposal_videos').update({ sort_order } as never).eq('id', id)
  );
  const results = await Promise.all(promises);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
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
  return (row as { id: string }).id;
}

export async function removeProposalProject(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('proposal_projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
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
  fundraising_tier: number;
  defer_payment: boolean;
  friendly_discount_pct: number;
  additional_discount?: number;
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
    return quoteId;
  } else {
    // Always create new
    const { data: row, error } = await supabase
      .from('proposal_quotes')
      .insert({ proposal_id: proposalId, is_fna_quote: true, is_locked: true, ...quoteData } as never)
      .select('id')
      .single();
    if (error) throw new Error(error.message);
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
}

export async function deleteProposalMilestone(id: string): Promise<void> {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('proposal_milestones')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteAllProposalMilestones(proposalId: string): Promise<void> {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('proposal_milestones')
    .delete()
    .eq('proposal_id', proposalId);
  if (error) throw new Error(error.message);
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

export interface ProposalViewRow {
  id: string;
  viewer_email: string | null;
  viewed_at: string;
  duration_seconds: number | null;
}

export async function getProposalViews(proposalId: string): Promise<ProposalViewRow[]> {
  const { supabase } = await requireAuth();
  const { data } = await supabase
    .from('proposal_views')
    .select('id, viewer_email, viewed_at, duration_seconds')
    .eq('proposal_id', proposalId)
    .order('viewed_at', { ascending: false });
  return (data ?? []) as ProposalViewRow[];
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

type TagCategory = 'style' | 'technique' | 'addon' | 'deliverable' | 'project_type' | 'industry';

const CATEGORY_COLUMN: Record<TagCategory, string> = {
  style: 'style_tags',
  technique: 'camera_techniques',
  addon: 'premium_addons',
  deliverable: 'assets_delivered',
  project_type: 'category',
  industry: 'industry',
};

const SCALAR_CATEGORIES = new Set<TagCategory>(['project_type']);
// Tags whose values live on `clients`, not `projects`
const CLIENT_CATEGORIES = new Set<TagCategory>(['industry']);

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
  const [{ data: tagsRaw }, { data: projectsRaw }, { data: clientsRaw }] = await Promise.all([
    supabase.from('tags').select('*').order('category').order('name'),
    supabase.from('projects').select('style_tags, premium_addons, camera_techniques, assets_delivered, category'),
    supabase.from('clients').select('industry'),
  ]);

  const tags = (tagsRaw ?? []) as TagRow[];
  const rows = (projectsRaw ?? []) as Omit<ProjTagRow, 'id'>[];
  const clients = (clientsRaw ?? []) as Array<{ industry: string[] | null }>;

  const countMap = new Map<string, number>();
  for (const row of rows) {
    (row.style_tags ?? []).forEach((t) => countMap.set(`style:${t}`, (countMap.get(`style:${t}`) ?? 0) + 1));
    (row.premium_addons ?? []).forEach((t) => countMap.set(`addon:${t}`, (countMap.get(`addon:${t}`) ?? 0) + 1));
    (row.camera_techniques ?? []).forEach((t) => countMap.set(`technique:${t}`, (countMap.get(`technique:${t}`) ?? 0) + 1));
    (row.assets_delivered ?? []).forEach((t) => countMap.set(`deliverable:${t}`, (countMap.get(`deliverable:${t}`) ?? 0) + 1));
    if (row.category) countMap.set(`project_type:${row.category}`, (countMap.get(`project_type:${row.category}`) ?? 0) + 1);
  }
  for (const client of clients) {
    (client.industry ?? []).forEach((t) => countMap.set(`industry:${t}`, (countMap.get(`industry:${t}`) ?? 0) + 1));
  }

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    category: tag.category as TagCategory,
    color: tag.color,
    projectCount: countMap.get(`${tag.category}:${tag.name}`) ?? 0,
  }));
}

export async function getTagsByCategory(category: TagCategory): Promise<string[]> {
  const { supabase } = await requireAuth();
  const { data } = await supabase.from('tags').select('name').eq('category', category).order('name');
  return (data ?? []).map((t: { name: string }) => t.name);
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

  if (CLIENT_CATEGORIES.has(tag.category as TagCategory)) {
    const { data: affectedRaw } = await supabase.from('clients').select(`id, ${col}`).contains(col, [oldName]);
    const affected = (affectedRaw ?? []) as Array<Record<string, unknown>>;
    await Promise.all(
      affected.map((c) => {
        const arr = ((c[col] as string[]) ?? []).map((t) => (t === oldName ? trimmed : t));
        return supabase.from('clients').update({ [col]: arr } as never).eq('id', c.id as string);
      })
    );
  } else if (isScalar) {
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

  if (CLIENT_CATEGORIES.has(tag.category as TagCategory)) {
    const { data: affectedRaw } = await supabase.from('clients').select(`id, ${col}`).contains(col, [tag.name]);
    const affected = (affectedRaw ?? []) as Array<Record<string, unknown>>;
    await Promise.all(
      affected.map((c) => {
        const arr = ((c[col] as string[]) ?? []).filter((t) => t !== tag.name);
        return supabase.from('clients').update({ [col]: arr.length > 0 ? arr : null } as never).eq('id', c.id as string);
      })
    );
  } else if (isScalar) {
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

    if (CLIENT_CATEGORIES.has(target.category as TagCategory)) {
      const { data: affectedRaw } = await supabase.from('clients').select(`id, ${col}`).contains(col, [source.name]);
      const affected = (affectedRaw ?? []) as Array<Record<string, unknown>>;
      await Promise.all(
        affected.map((c) => {
          let arr = (c[col] as string[]) ?? [];
          arr = arr.includes(target.name)
            ? arr.filter((t) => t !== source.name)
            : arr.map((t) => (t === source.name ? target.name : t));
          return supabase.from('clients').update({ [col]: arr } as never).eq('id', c.id as string);
        })
      );
    } else if (isScalar) {
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
}

export async function updateProposalProjectBlurb(id: string, blurb: string | null): Promise<void> {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('proposal_projects')
    .update({ blurb } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
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

import type { PlacementPage, PlacementWithProject, LayoutSnapshot, SnapshotPlacement } from '@/types/placement';

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

function revalidateAllPlacements() {
  revalidatePath('/admin/website');
  revalidatePath('/');
  revalidatePath('/work');
  revalidatePath('/services');
}

// ── Layout Snapshots ──────────────────────────────────────────────────────

export async function saveLayoutSnapshot(label?: string): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Grab all current placements (all pages)
  const { data: placements, error: fetchErr } = await supabase
    .from('website_project_placements')
    .select('project_id, page, sort_order, full_width');
  if (fetchErr) throw new Error(fetchErr.message);

  const { data, error } = await supabase
    .from('website_layout_snapshots')
    .insert({
      label: label || null,
      created_by: user.email ?? user.id,
      placements: placements ?? [],
    } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return (data as { id: string }).id;
}

export async function getLayoutSnapshots(): Promise<LayoutSnapshot[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('website_layout_snapshots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as LayoutSnapshot[];
}

export async function restoreLayoutSnapshot(id: string) {
  const { supabase } = await requireAuth();

  // Fetch snapshot
  const { data: snapshot, error: fetchErr } = await supabase
    .from('website_layout_snapshots')
    .select('placements')
    .eq('id', id)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const placements = (snapshot as { placements: SnapshotPlacement[] }).placements;

  // Delete all current placements
  const { error: delErr } = await supabase
    .from('website_project_placements')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows
  if (delErr) throw new Error(delErr.message);

  // Insert snapshot placements
  if (placements.length > 0) {
    const { error: insErr } = await supabase
      .from('website_project_placements')
      .insert(placements as never[]);
    if (insErr) throw new Error(insErr.message);
  }

  revalidateAllPlacements();
}

export async function updateSnapshotLabel(id: string, label: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('website_layout_snapshots')
    .update({ label } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteLayoutSnapshot(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('website_layout_snapshots')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
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

// ── Intake Submissions ──────────────────────────────────────────────────────

export interface IntakeSubmission {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  email: string;
  title: string | null;
  company_name: string | null;
  project_name: string;
  phases: string[];
  pitch: string;
  deliverables: string[];
  timeline: string;
  timeline_date: string | null;
  priority_order: string[];
  experience: string;
  budget: string | null;
  status: string;
  client_id: string | null;
  contact_id: string | null;
  project_id: string | null;
  created_at: string;
  // All fields
  stakeholders: string | null;
  excitement: string | null;
  key_feature: string | null;
  vision: string | null;
  avoid: string | null;
  audience: string | null;
  challenge: string | null;
  competitors: { url: string; note?: string }[] | null;
  video_links: string | null;
  deliverable_notes: string | null;
  timeline_notes: string | null;
  experience_notes: string | null;
  partners: string[];
  partner_details: string | null;
  public_goal: string | null;
  internal_goal: string | null;
  email_list_size: string | null;
  file_urls: string[];
  anything_else: string | null;
  referral: string | null;
  quote_data: Record<string, unknown> | null;
  budget_interacted: boolean;
  company_url: string | null;
}

export async function getIntakeSubmissions(): Promise<IntakeSubmission[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('intake_submissions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as IntakeSubmission[];
}

export async function updateIntakeSubmission(id: string, updates: Partial<IntakeSubmission>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('intake_submissions')
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/intake');
}

export async function deleteIntakeSubmission(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('intake_submissions').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/intake');
}

export async function batchDeleteIntakeSubmissions(ids: string[]) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('intake_submissions').delete().in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/intake');
}

// ── Scripts ──────────────────────────────────────────────────────────────

export async function getScripts() {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('scripts')
    .select('*, project:projects(id, title)')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getScriptList(): Promise<Array<{ id: string; title: string; major_version: number; minor_version: number; is_published: boolean }>> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('scripts')
    .select('id, title, major_version, minor_version, is_published, content_mode')
    .eq('content_mode', 'table')
    .order('title');
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ id: string; title: string; major_version: number; minor_version: number; is_published: boolean }>;
}

export async function getScriptById(id: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('scripts')
    .select('*, project:projects(id, title)')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createScript(data: Record<string, unknown>): Promise<string> {
  const { supabase, userId } = await requireAuth();
  const { data: script, error } = await supabase
    .from('scripts')
    .insert({ content_mode: 'scratchpad', ...data, created_by: userId } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  const scriptId = (script as { id: string }).id;

  // Seed default tags
  const { DEFAULT_SCRIPT_TAGS } = await import('@/types/scripts');
  const tagRows = DEFAULT_SCRIPT_TAGS.map(tag => ({ ...tag, script_id: scriptId, slug: `tag-${crypto.randomUUID().slice(0, 8)}` }));
  await supabase.from('script_tags').insert(tagRows as never);

  revalidatePath('/admin/scripts');
  return scriptId;
}

export async function updateScript(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('scripts')
    .update({ ...data, updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/scripts');
}

export async function getScriptVersions(scriptGroupId: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('scripts')
    .select('id, title, version, status, created_at, content_mode, major_version, minor_version, is_published')
    .eq('script_group_id', scriptGroupId)
    .order('major_version', { ascending: false })
    .order('minor_version', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function deleteScript(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('scripts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/scripts');
}

// ── Script Scenes ────────────────────────────────────────────────────────

export async function getScriptScenes(scriptId: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('script_scenes')
    .select('*')
    .eq('script_id', scriptId)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createScene(scriptId: string, data: Record<string, unknown>): Promise<string> {
  const { supabase } = await requireAuth();
  const { data: scene, error } = await supabase
    .from('script_scenes')
    .insert({ ...data, script_id: scriptId } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/scripts');
  return (scene as { id: string }).id;
}

export async function updateScene(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('script_scenes')
    .update(data as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/scripts');
}

export async function deleteScene(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('script_scenes').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/scripts');
}

export async function reorderScenes(_scriptId: string, orderedIds: string[]) {
  const { supabase } = await requireAuth();
  const updates = orderedIds.map((id, i) =>
    supabase.from('script_scenes').update({ sort_order: i } as never).eq('id', id)
  );
  const results = await Promise.all(updates);
  const failed = results.find(r => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  revalidatePath('/admin/scripts');
}

// ── Script Beats ─────────────────────────────────────────────────────────

export async function getScriptBeats(sceneIds: string[]) {
  if (sceneIds.length === 0) return [];
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('script_beats')
    .select('*')
    .in('scene_id', sceneIds)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createBeat(sceneId: string, data: Record<string, unknown>): Promise<string> {
  const { supabase } = await requireAuth();
  const { data: beat, error } = await supabase
    .from('script_beats')
    .insert({ ...data, scene_id: sceneId } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return (beat as { id: string }).id;
}

export async function updateBeat(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('script_beats')
    .update({ ...data, updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteBeat(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('script_beats').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function reorderBeats(_sceneId: string, orderedIds: string[]) {
  const { supabase } = await requireAuth();
  const updates = orderedIds.map((id, i) =>
    supabase.from('script_beats').update({ sort_order: i } as never).eq('id', id)
  );
  const results = await Promise.all(updates);
  const failed = results.find(r => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}

// ── Script Characters ────────────────────────────────────────────────────

export async function getScriptCharacters(scriptId: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('script_characters')
    .select('*')
    .eq('script_id', scriptId)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCharacter(scriptId: string, data: Record<string, unknown>): Promise<string> {
  const { supabase } = await requireAuth();
  const { data: char, error } = await supabase
    .from('script_characters')
    .insert({ ...data, script_id: scriptId } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return (char as { id: string }).id;
}

export async function updateCharacter(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('script_characters')
    .update(data as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteCharacter(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('script_characters').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Script Tags ──────────────────────────────────────────────────────────

export async function getScriptTags(scriptId: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('script_tags')
    .select('*')
    .eq('script_id', scriptId)
    .order('name');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createScriptTag(scriptId: string, data: Record<string, unknown>): Promise<string> {
  const { supabase } = await requireAuth();
  const { data: tag, error } = await supabase
    .from('script_tags')
    .insert({ ...data, script_id: scriptId } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return (tag as { id: string }).id;
}

export async function updateScriptTag(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('script_tags')
    .update(data as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteScriptTag(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('script_tags').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Script Locations ──────────────────────────────────────────────────

export async function getScriptLocations(scriptId: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('script_locations')
    .select('*')
    .eq('script_id', scriptId)
    .order('sort_order');
  if (error?.message?.includes('schema cache')) return [];
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createLocation(scriptId: string, data: Record<string, unknown>): Promise<string> {
  const { supabase } = await requireAuth();
  const { data: loc, error } = await supabase
    .from('script_locations')
    .insert({ ...data, script_id: scriptId } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return (loc as { id: string }).id;
}

export async function updateLocation(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('script_locations').update(data as never).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteLocation(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('script_locations').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Script Beat References ────────────────────────────────────────────

export async function getBeatReferences(beatIds: string[]) {
  if (beatIds.length === 0) return [];
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('script_beat_references')
    .select('*')
    .in('beat_id', beatIds)
    .order('sort_order');
  // Gracefully handle table not yet created (migration not applied)
  if (error?.message?.includes('schema cache')) return [];
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function uploadBeatReference(beatId: string, formData: FormData): Promise<{ id: string; image_url: string; storage_path: string }> {
  await requireAuth();
  const { createServiceClient } = await import('@/lib/supabase/service');
  const supabase = createServiceClient();

  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${beatId}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('script-references')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadErr) throw new Error(uploadErr.message);

  const { data: urlData } = supabase.storage.from('script-references').getPublicUrl(path);
  const image_url = urlData.publicUrl;

  // Get current max sort_order
  const { data: existing } = await supabase
    .from('script_beat_references')
    .select('sort_order')
    .eq('beat_id', beatId)
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextOrder = ((existing?.[0] as { sort_order: number } | undefined)?.sort_order ?? -1) + 1;

  const { data: ref, error: insertErr } = await supabase
    .from('script_beat_references')
    .insert({ beat_id: beatId, image_url, storage_path: path, sort_order: nextOrder } as never)
    .select('id')
    .single();
  if (insertErr) throw new Error(insertErr.message);

  return { id: (ref as { id: string }).id, image_url, storage_path: path };
}

export async function deleteBeatReference(id: string) {
  await requireAuth();
  const { createServiceClient } = await import('@/lib/supabase/service');
  const supabase = createServiceClient();

  // Get storage path first
  const { data: ref } = await supabase
    .from('script_beat_references')
    .select('storage_path')
    .eq('id', id)
    .single();
  if (ref) {
    await supabase.storage.from('script-references').remove([(ref as { storage_path: string }).storage_path]);
  }
  await supabase.from('script_beat_references').delete().eq('id', id);
}

// ── Script Versioning ──────────────────────────────────────────────────

/** Shared duplication helper — clones script + scenes/beats/characters/tags/locations */
async function duplicateScriptCore(
  scriptId: string,
  overrides: Record<string, unknown>,
): Promise<string> {
  const { supabase, userId } = await requireAuth();

  // 1. Fetch current script
  const { data: script, error: scriptErr } = await supabase
    .from('scripts')
    .select('*')
    .eq('id', scriptId)
    .single();
  if (scriptErr || !script) throw new Error(scriptErr?.message ?? 'Script not found');
  const s = script as Record<string, unknown>;

  // 2. Fetch all related data
  const [scenesRes, charsRes, tagsRes, locsRes] = await Promise.all([
    supabase.from('script_scenes').select('*').eq('script_id', scriptId).order('sort_order'),
    supabase.from('script_characters').select('*').eq('script_id', scriptId).order('sort_order'),
    supabase.from('script_tags').select('*').eq('script_id', scriptId).order('name'),
    supabase.from('script_locations').select('*').eq('script_id', scriptId).order('sort_order'),
  ]);

  const scenes = scenesRes.data ?? [];
  const sceneIds = scenes.map((sc: { id: string }) => sc.id);

  // Fetch beats for all scenes
  let allBeats: Record<string, unknown>[] = [];
  if (sceneIds.length > 0) {
    const { data: beatsData } = await supabase
      .from('script_beats')
      .select('*')
      .in('scene_id', sceneIds)
      .order('sort_order');
    allBeats = beatsData ?? [];
  }

  // 3. Create new script with overrides
  const { data: newScript, error: newScriptErr } = await supabase
    .from('scripts')
    .insert({
      title: s.title,
      project_id: s.project_id,
      script_group_id: s.script_group_id,
      status: 'draft',
      version: ((s.version as number) ?? 1) + 1,
      notes: s.notes,
      scratch_content: s.scratch_content ?? null,
      content_mode: s.content_mode ?? 'table',
      major_version: s.major_version ?? 0,
      minor_version: s.minor_version ?? 1,
      is_published: false,
      created_by: userId,
      ...overrides,
    } as never)
    .select('id')
    .single();
  if (newScriptErr || !newScript) throw new Error(newScriptErr?.message ?? 'Failed to create version');
  const newScriptId = (newScript as { id: string }).id;

  // 4. Clone scenes — map old scene IDs to new ones
  const sceneIdMap = new Map<string, string>();
  for (const scene of scenes) {
    const sc = scene as Record<string, unknown>;
    const { data: newScene, error: sceneErr } = await supabase
      .from('script_scenes')
      .insert({
        script_id: newScriptId,
        sort_order: sc.sort_order,
        location_name: sc.location_name,
        time_of_day: sc.time_of_day,
        int_ext: sc.int_ext,
        scene_notes: sc.scene_notes,
      } as never)
      .select('id')
      .single();
    if (sceneErr || !newScene) throw new Error(sceneErr?.message ?? 'Failed to clone scene');
    sceneIdMap.set(sc.id as string, (newScene as { id: string }).id);
  }

  // 5. Clone beats with mapped scene IDs
  for (const beat of allBeats) {
    const b = beat as Record<string, unknown>;
    const newSceneId = sceneIdMap.get(b.scene_id as string);
    if (!newSceneId) continue;
    await supabase.from('script_beats').insert({
      scene_id: newSceneId,
      sort_order: b.sort_order,
      audio_content: b.audio_content,
      visual_content: b.visual_content,
      notes_content: b.notes_content,
    } as never);
  }

  // 6. Clone characters
  for (const char of (charsRes.data ?? [])) {
    const c = char as Record<string, unknown>;
    await supabase.from('script_characters').insert({
      script_id: newScriptId,
      name: c.name,
      description: c.description,
      color: c.color,
      character_type: c.character_type,
      sort_order: c.sort_order,
      max_cast_slots: c.max_cast_slots,
    } as never);
  }

  // 7. Clone tags
  for (const tag of (tagsRes.data ?? [])) {
    const t = tag as Record<string, unknown>;
    await supabase.from('script_tags').insert({
      script_id: newScriptId,
      name: t.name,
      slug: `tag-${crypto.randomUUID().slice(0, 8)}`,
      color: t.color,
    } as never);
  }

  // 8. Clone locations and remap scene location_id
  const locationIdMap = new Map<string, string>();
  for (const loc of (locsRes.data ?? [])) {
    const l = loc as Record<string, unknown>;
    const { data: newLoc } = await supabase.from('script_locations').insert({
      script_id: newScriptId,
      name: l.name,
      description: l.description,
      color: l.color,
      sort_order: l.sort_order,
      global_location_id: l.global_location_id,
    } as never).select('id').single();
    if (newLoc) locationIdMap.set(l.id as string, (newLoc as { id: string }).id);
  }

  // Remap location_id on cloned scenes
  for (const scene of scenes) {
    const sc = scene as Record<string, unknown>;
    const oldLocId = sc.location_id as string | null;
    if (oldLocId && locationIdMap.has(oldLocId)) {
      const newSceneId = sceneIdMap.get(sc.id as string);
      if (newSceneId) {
        await supabase.from('script_scenes').update({ location_id: locationIdMap.get(oldLocId) } as never).eq('id', newSceneId);
      }
    }
  }

  revalidatePath('/admin/scripts');
  return newScriptId;
}

/** Create a new draft version (same major, bumped minor) */
export async function createScriptVersion(scriptId: string): Promise<string> {
  const { supabase } = await requireAuth();

  // Fetch current script to get group + major version
  const { data: script, error: scriptErr } = await supabase
    .from('scripts')
    .select('script_group_id, major_version, version')
    .eq('id', scriptId)
    .single();
  if (scriptErr || !script) throw new Error(scriptErr?.message ?? 'Script not found');
  const s = script as Record<string, unknown>;
  const groupId = s.script_group_id as string;

  // Find the highest major version across the entire group
  const { data: maxMajorRow } = await supabase
    .from('scripts')
    .select('major_version')
    .eq('script_group_id', groupId)
    .order('major_version', { ascending: false })
    .limit(1)
    .single();
  const major = ((maxMajorRow as Record<string, unknown> | null)?.major_version as number) ?? 0;

  // Find max minor_version for this group+major
  const { data: maxRow } = await supabase
    .from('scripts')
    .select('minor_version')
    .eq('script_group_id', groupId)
    .eq('major_version', major)
    .order('minor_version', { ascending: false })
    .limit(1)
    .single();
  const nextMinor = ((maxRow as Record<string, unknown> | null)?.minor_version as number ?? 0) + 1;

  return duplicateScriptCore(scriptId, {
    major_version: major,
    minor_version: nextMinor,
    is_published: false,
    version: ((s.version as number) ?? 1) + 1,
  });
}

/** Publish: promote current version in-place to next major version */
export async function publishScriptVersion(scriptId: string): Promise<string> {
  const { supabase } = await requireAuth();

  // Fetch current script
  const { data: script, error: scriptErr } = await supabase
    .from('scripts')
    .select('script_group_id, major_version, minor_version, is_published')
    .eq('id', scriptId)
    .single();
  if (scriptErr || !script) throw new Error(scriptErr?.message ?? 'Script not found');
  const s = script as Record<string, unknown>;
  if (s.is_published) throw new Error('Script is already published');
  const groupId = s.script_group_id as string;

  // Find max major_version in group
  const { data: maxRow } = await supabase
    .from('scripts')
    .select('major_version')
    .eq('script_group_id', groupId)
    .order('major_version', { ascending: false })
    .limit(1)
    .single();
  const nextMajor = ((maxRow as Record<string, unknown> | null)?.major_version as number ?? 0) + 1;

  // Update in-place: promote to next major version
  const { error: updateErr } = await supabase
    .from('scripts')
    .update({ major_version: nextMajor, minor_version: 0, is_published: true } as never)
    .eq('id', scriptId);
  if (updateErr) throw new Error(updateErr.message);

  return scriptId;
}

/** Unpublish: flip is_published to false, keep version number */
export async function unpublishScriptVersion(scriptId: string): Promise<string> {
  const { supabase } = await requireAuth();

  const { error } = await supabase
    .from('scripts')
    .update({ is_published: false } as never)
    .eq('id', scriptId);
  if (error) throw new Error(error.message);

  return scriptId;
}

// ── Storyboard Styles ────────────────────────────────────────────────

export async function getScriptStyle(scriptId: string) {
  const { supabase } = await requireAuth();

  // Try to fetch existing style
  const { data, error } = await supabase
    .from('script_styles')
    .select('*')
    .eq('script_id', scriptId)
    .single();

  if (data) return data as { id: string; script_id: string; prompt: string; aspect_ratio: string; generation_mode: string; created_at: string; updated_at: string };

  // Create default style if none exists
  if (error?.code === 'PGRST116') {
    const { data: newStyle, error: insertErr } = await supabase
      .from('script_styles')
      .insert({ script_id: scriptId } as never)
      .select('*')
      .single();
    if (insertErr) throw new Error(insertErr.message);
    return newStyle as { id: string; script_id: string; prompt: string; aspect_ratio: string; generation_mode: string; created_at: string; updated_at: string };
  }

  // Gracefully handle table not yet created
  if (error?.message?.includes('schema cache')) return null;
  if (error) throw new Error(error.message);
  return null;
}

export async function updateScriptStyle(styleId: string, data: Record<string, string | null>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('script_styles')
    .update({ ...data, updated_at: new Date().toISOString() } as never)
    .eq('id', styleId);
  if (error) throw new Error(error.message);
}

export async function getStyleReferences(styleId: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('script_style_references')
    .select('*')
    .eq('style_id', styleId)
    .order('sort_order');
  if (error?.message?.includes('schema cache')) return [];
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function uploadStyleReference(styleId: string, formData: FormData): Promise<{ id: string; image_url: string; storage_path: string }> {
  await requireAuth();
  const { createServiceClient } = await import('@/lib/supabase/service');
  const supabase = createServiceClient();

  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `style-refs/${styleId}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('script-storyboards')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadErr) throw new Error(uploadErr.message);

  const { data: urlData } = supabase.storage.from('script-storyboards').getPublicUrl(path);
  const image_url = urlData.publicUrl;

  const { data: existing } = await supabase
    .from('script_style_references')
    .select('sort_order')
    .eq('style_id', styleId)
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextOrder = ((existing?.[0] as { sort_order: number } | undefined)?.sort_order ?? -1) + 1;

  const { data: ref, error: insertErr } = await supabase
    .from('script_style_references')
    .insert({ style_id: styleId, image_url, storage_path: path, sort_order: nextOrder } as never)
    .select('id')
    .single();
  if (insertErr) throw new Error(insertErr.message);

  return { id: (ref as { id: string }).id, image_url, storage_path: path };
}

export async function deleteStyleReference(id: string) {
  await requireAuth();
  const { createServiceClient } = await import('@/lib/supabase/service');
  const supabase = createServiceClient();

  const { data: ref } = await supabase
    .from('script_style_references')
    .select('storage_path')
    .eq('id', id)
    .single();
  if (ref) {
    await supabase.storage.from('script-storyboards').remove([(ref as { storage_path: string }).storage_path]);
  }
  await supabase.from('script_style_references').delete().eq('id', id);
}

// ── Storyboard Frames ────────────────────────────────────────────────

export async function getStoryboardFrames(scriptId: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('script_storyboard_frames')
    .select('*')
    .eq('script_id', scriptId)
    .order('created_at');
  if (error?.message?.includes('schema cache')) return [];
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function uploadStoryboardFrame(
  scriptId: string,
  target: { beatId?: string; sceneId?: string },
  formData: FormData,
): Promise<{ id: string; image_url: string; storage_path: string }> {
  await requireAuth();
  const { createServiceClient } = await import('@/lib/supabase/service');
  const supabase = createServiceClient();

  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  const ext = file.name.split('.').pop() ?? 'jpg';
  const folder = target.beatId ?? target.sceneId ?? 'unknown';
  const path = `frames/${folder}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('script-storyboards')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadErr) throw new Error(uploadErr.message);

  const { data: urlData } = supabase.storage.from('script-storyboards').getPublicUrl(path);
  const image_url = urlData.publicUrl;

  // Delete existing frame for this beat/scene (single image per beat)
  if (target.beatId) {
    const { data: old } = await supabase
      .from('script_storyboard_frames')
      .select('id, storage_path')
      .eq('beat_id', target.beatId);
    if (old && old.length > 0) {
      const paths = (old as { storage_path: string }[]).map(r => r.storage_path);
      await supabase.storage.from('script-storyboards').remove(paths);
      await supabase.from('script_storyboard_frames').delete().eq('beat_id', target.beatId);
    }
  } else if (target.sceneId) {
    const { data: old } = await supabase
      .from('script_storyboard_frames')
      .select('id, storage_path')
      .eq('scene_id', target.sceneId);
    if (old && old.length > 0) {
      const paths = (old as { storage_path: string }[]).map(r => r.storage_path);
      await supabase.storage.from('script-storyboards').remove(paths);
      await supabase.from('script_storyboard_frames').delete().eq('scene_id', target.sceneId);
    }
  }

  const { data: frame, error: insertErr } = await supabase
    .from('script_storyboard_frames')
    .insert({
      script_id: scriptId,
      beat_id: target.beatId ?? null,
      scene_id: target.sceneId ?? null,
      image_url,
      storage_path: path,
      source: 'uploaded',
    } as never)
    .select('id')
    .single();
  if (insertErr) throw new Error(insertErr.message);

  return { id: (frame as { id: string }).id, image_url, storage_path: path };
}

export async function deleteStoryboardFrame(id: string) {
  await requireAuth();
  const { createServiceClient } = await import('@/lib/supabase/service');
  const supabase = createServiceClient();

  const { data: frame } = await supabase
    .from('script_storyboard_frames')
    .select('storage_path')
    .eq('id', id)
    .single();
  if (frame) {
    await supabase.storage.from('script-storyboards').remove([(frame as { storage_path: string }).storage_path]);
  }
  await supabase.from('script_storyboard_frames').delete().eq('id', id);
}

// ── Locations ─────────────────────────────────────────────────────────

import type { LocationWithImages, LocationImageRow } from '@/types/locations';

export async function getLocations(): Promise<LocationWithImages[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('locations')
    .select('*, location_images(*)')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as LocationWithImages[];
}

export async function getLocation(id: string): Promise<LocationWithImages> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('locations')
    .select('*, location_images(*)')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as LocationWithImages;
}

export async function createLocationRecord(data: Record<string, unknown>): Promise<string> {
  const { supabase } = await requireAuth();
  const { data: loc, error } = await supabase
    .from('locations')
    .insert(data as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/locations');
  return (loc as { id: string }).id;
}

export async function updateLocationRecord(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('locations')
    .update({ ...data, updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/locations');
}

export async function deleteLocationRecord(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('locations').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/locations');
}

export async function batchDeleteLocations(ids: string[]) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('locations').delete().in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/locations');
}

export async function addLocationImage(locationId: string, data: {
  image_url: string;
  storage_path?: string;
  alt_text?: string;
  source: 'uploaded' | 'peerspace';
  sort_order: number;
}): Promise<LocationImageRow> {
  const { supabase } = await requireAuth();
  const { data: row, error } = await supabase
    .from('location_images')
    .insert({ ...data, location_id: locationId } as never)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return row as LocationImageRow;
}

export async function deleteLocationImage(id: string, storagePath?: string) {
  const { supabase } = await requireAuth();
  if (storagePath) {
    const { createServiceClient } = await import('@/lib/supabase/service');
    const service = createServiceClient();
    await service.storage.from('location-images').remove([storagePath]);
  }
  const { error } = await supabase.from('location_images').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function uploadLocationImage(locationId: string, formData: FormData): Promise<LocationImageRow> {
  await requireAuth();
  const { createServiceClient } = await import('@/lib/supabase/service');
  const supabase = createServiceClient();

  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop() ?? 'jpg';
  const storagePath = `${locationId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from('location-images')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });
  if (upErr) throw new Error(upErr.message);

  const { data: urlData } = supabase.storage.from('location-images').getPublicUrl(storagePath);

  const { data: row, error: dbErr } = await supabase
    .from('location_images')
    .insert({
      location_id: locationId,
      image_url: urlData.publicUrl,
      storage_path: storagePath,
      source: 'uploaded',
      sort_order: 0,
    } as never)
    .select('*')
    .single();
  if (dbErr) throw new Error(dbErr.message);

  return row as LocationImageRow;
}

export async function setFeaturedImage(locationId: string, imageId: string) {
  const { supabase } = await requireAuth();
  // Unset all featured flags for this location
  await supabase
    .from('location_images')
    .update({ is_featured: false } as never)
    .eq('location_id', locationId);
  // Set the new featured image
  const { data: img } = await supabase
    .from('location_images')
    .update({ is_featured: true } as never)
    .eq('id', imageId)
    .select('image_url')
    .single();
  // Update the featured_image URL on the location record
  if (img) {
    await supabase
      .from('locations')
      .update({ featured_image: (img as { image_url: string }).image_url, updated_at: new Date().toISOString() } as never)
      .eq('id', locationId);
  }
  revalidatePath('/admin/locations');
}

export async function linkLocationToProject(locationId: string, projectId: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('location_projects')
    .insert({ location_id: locationId, project_id: projectId } as never);
  if (error && !error.message.includes('duplicate')) throw new Error(error.message);
}

export async function unlinkLocationFromProject(locationId: string, projectId: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('location_projects')
    .delete()
    .eq('location_id', locationId)
    .eq('project_id', projectId);
  if (error) throw new Error(error.message);
}

export async function getLocationProjects(locationId: string): Promise<{ id: string; title: string; thumbnail_url: string | null; client_name: string | null }[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('location_projects')
    .select('project_id, projects(id, title, thumbnail_url, client_name)')
    .eq('location_id', locationId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Record<string, unknown>) => (r as { projects: { id: string; title: string; thumbnail_url: string | null; client_name: string | null } }).projects);
}

export async function getActiveLocationsForSelect(): Promise<{ id: string; name: string; featured_image: string | null }[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, featured_image')
    .eq('status', 'active')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; name: string; featured_image: string | null }[];
}

// ── Script Character Cast ─────────────────────────────────────────────────

import type { CharacterCastWithContact, LocationOptionWithLocation } from '@/types/scripts';

/** Bulk-load all cast assignments for every character in a script. */
export async function getScriptCastMap(
  scriptId: string,
): Promise<Record<string, CharacterCastWithContact[]>> {
  const { supabase } = await requireAuth();

  // Get all character IDs for this script
  const { data: chars, error: charsErr } = await supabase
    .from('script_characters')
    .select('id')
    .eq('script_id', scriptId);
  if (charsErr) throw new Error(charsErr.message);
  const charIds = (chars ?? []).map((c: { id: string }) => c.id);
  if (charIds.length === 0) return {};

  // Get all cast rows for those characters
  const { data: castRows, error: castErr } = await supabase
    .from('script_character_cast')
    .select('*')
    .in('character_id', charIds)
    .order('slot_order');
  if (castErr) throw new Error(castErr.message);
  if (!castRows || castRows.length === 0) return {};

  // Get contact details + ALL headshots for all referenced contacts
  const contactIds = [...new Set((castRows as { contact_id: string }[]).map(r => r.contact_id))];
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, appearance_prompt')
    .in('id', contactIds);
  const { data: allHeadshots } = await supabase
    .from('headshots')
    .select('contact_id, url, featured')
    .in('contact_id', contactIds)
    .order('featured', { ascending: false }) as { data: Array<{ contact_id: string; url: string; featured: boolean }> | null };

  const contactMap = new Map(
    ((contacts ?? []) as { id: string; first_name: string; last_name: string; appearance_prompt: string | null }[]).map(c => [c.id, c]),
  );
  // Featured headshot per contact (first featured or first overall)
  const featuredHeadshotMap = new Map<string, string>();
  // All headshot URLs per contact
  const allHeadshotsMap = new Map<string, string[]>();
  for (const h of (allHeadshots ?? [])) {
    if (!allHeadshotsMap.has(h.contact_id)) allHeadshotsMap.set(h.contact_id, []);
    allHeadshotsMap.get(h.contact_id)!.push(h.url);
    if (!featuredHeadshotMap.has(h.contact_id) && h.featured) {
      featuredHeadshotMap.set(h.contact_id, h.url);
    }
  }
  // Fallback: if no featured, use first headshot
  for (const [cid, urls] of allHeadshotsMap) {
    if (!featuredHeadshotMap.has(cid) && urls.length > 0) {
      featuredHeadshotMap.set(cid, urls[0]);
    }
  }

  // Build grouped result
  const result: Record<string, CharacterCastWithContact[]> = {};
  for (const row of castRows as Array<{
    id: string;
    character_id: string;
    contact_id: string;
    slot_order: number;
    is_featured: boolean;
    appearance_prompt: string | null;
    created_at: string;
  }>) {
    const contact = contactMap.get(row.contact_id);
    if (!contact) continue;
    const entry: CharacterCastWithContact = {
      ...row,
      // Use contact-level appearance_prompt if junction table doesn't have one
      appearance_prompt: row.appearance_prompt || contact.appearance_prompt || null,
      contact: {
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        headshot_url: featuredHeadshotMap.get(contact.id) ?? null,
        all_headshot_urls: allHeadshotsMap.get(contact.id) ?? [],
        appearance_prompt: contact.appearance_prompt,
      },
    };
    (result[row.character_id] ??= []).push(entry);
  }
  return result;
}

/** Assign a cast member to a character. Auto-features first assignment. Returns existing row if already assigned. */
export async function assignCastMember(
  characterId: string,
  contactId: string,
): Promise<string> {
  const { supabase } = await requireAuth();

  // Check if this contact is already assigned to this character
  const { data: alreadyAssigned } = await supabase
    .from('script_character_cast')
    .select('id')
    .eq('character_id', characterId)
    .eq('contact_id', contactId)
    .maybeSingle();
  if (alreadyAssigned) return (alreadyAssigned as { id: string }).id;

  // Determine slot order and whether to auto-feature
  const { data: existing } = await supabase
    .from('script_character_cast')
    .select('id, slot_order')
    .eq('character_id', characterId)
    .order('slot_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0
    ? (existing[0] as { slot_order: number }).slot_order + 1
    : 0;
  const isFirst = !existing || existing.length === 0;

  const { data: row, error } = await supabase
    .from('script_character_cast')
    .insert({
      character_id: characterId,
      contact_id: contactId,
      slot_order: nextOrder,
      is_featured: isFirst,
    } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return (row as { id: string }).id;
}

/** Remove a cast member. Promotes next in line if the removed one was featured. */
export async function removeCastMember(castId: string) {
  const { supabase } = await requireAuth();

  // Check if this was featured
  const { data: row } = await supabase
    .from('script_character_cast')
    .select('character_id, is_featured')
    .eq('id', castId)
    .single() as { data: { character_id: string; is_featured: boolean } | null };

  const { error } = await supabase.from('script_character_cast').delete().eq('id', castId);
  if (error) throw new Error(error.message);

  // Promote next if needed
  if (row?.is_featured) {
    const { data: next } = await supabase
      .from('script_character_cast')
      .select('id')
      .eq('character_id', row.character_id)
      .order('slot_order')
      .limit(1);
    if (next && next.length > 0) {
      await supabase
        .from('script_character_cast')
        .update({ is_featured: true } as never)
        .eq('id', (next[0] as { id: string }).id);
    }
  }
}

/** Set a specific cast member as the featured one for their character. */
export async function setFeaturedCastMember(castId: string, characterId: string) {
  const { supabase } = await requireAuth();
  // Unset all featured for this character
  await supabase
    .from('script_character_cast')
    .update({ is_featured: false } as never)
    .eq('character_id', characterId);
  // Set the selected one
  const { error } = await supabase
    .from('script_character_cast')
    .update({ is_featured: true } as never)
    .eq('id', castId);
  if (error) throw new Error(error.message);
}

/** Update the AI-generated appearance prompt — saves to both the junction row and the contact. */
export async function updateCastAppearancePrompt(castId: string, prompt: string) {
  const { supabase } = await requireAuth();
  // Update junction table
  const { error: castErr } = await supabase
    .from('script_character_cast')
    .update({ appearance_prompt: prompt } as never)
    .eq('id', castId);
  if (castErr) throw new Error(castErr.message);
  // Look up the contact_id to persist on the contact for reuse across scripts
  const { data: castRow } = await supabase
    .from('script_character_cast')
    .select('contact_id')
    .eq('id', castId)
    .single() as { data: { contact_id: string } | null };
  if (castRow?.contact_id) {
    await supabase
      .from('contacts')
      .update({ appearance_prompt: prompt } as never)
      .eq('id', castRow.contact_id);
  }
}

/** Update max cast slots for a character (1–6). */
export async function updateCharacterMaxSlots(characterId: string, maxSlots: number) {
  const { supabase } = await requireAuth();
  const clamped = Math.max(1, Math.min(10, maxSlots));
  const { error } = await supabase
    .from('script_characters')
    .update({ max_cast_slots: clamped } as never)
    .eq('id', characterId);
  if (error) throw new Error(error.message);
}

export async function reorderCastMembers(characterId: string, orderedCastIds: string[]) {
  const { supabase } = await requireAuth();
  const updates = orderedCastIds.map((id, i) =>
    supabase
      .from('script_character_cast')
      .update({ slot_order: i, is_featured: i === 0 } as never)
      .eq('id', id)
      .eq('character_id', characterId),
  );
  await Promise.all(updates);
}

// ── Script Location Options ───────────────────────────────────────────────

/** Bulk-load all location options for every script location in a script. */
export async function getScriptLocationOptionsMap(
  scriptId: string,
): Promise<Record<string, LocationOptionWithLocation[]>> {
  const { supabase } = await requireAuth();

  // Get all script_location IDs for this script
  const { data: locs, error: locsErr } = await supabase
    .from('script_locations')
    .select('id')
    .eq('script_id', scriptId);
  if (locsErr) throw new Error(locsErr.message);
  const locIds = (locs ?? []).map((l: { id: string }) => l.id);
  if (locIds.length === 0) return {};

  // Get all option rows for those script locations
  const { data: optionRows, error: optErr } = await supabase
    .from('script_location_options')
    .select('*')
    .in('script_location_id', locIds)
    .order('slot_order');
  if (optErr) throw new Error(optErr.message);
  if (!optionRows || optionRows.length === 0) return {};

  // Get location details for all referenced global locations
  const locationIds = [...new Set((optionRows as { location_id: string }[]).map(r => r.location_id))];
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, featured_image, address, city, state, appearance_prompt')
    .in('id', locationIds);

  // Get top 5 images per location (featured first, then by sort_order)
  const { data: allImages } = await supabase
    .from('location_images')
    .select('location_id, image_url, is_featured, sort_order')
    .in('location_id', locationIds)
    .order('is_featured', { ascending: false })
    .order('sort_order');

  const locationMap = new Map(
    ((locations ?? []) as { id: string; name: string; featured_image: string | null; address: string | null; city: string | null; state: string | null; appearance_prompt: string | null }[]).map(l => [l.id, l]),
  );

  // Build top 5 images per location
  const imagesMap = new Map<string, string[]>();
  for (const img of (allImages ?? []) as { location_id: string; image_url: string }[]) {
    const arr = imagesMap.get(img.location_id) ?? [];
    if (arr.length < 5) arr.push(img.image_url);
    imagesMap.set(img.location_id, arr);
  }

  // Build grouped result
  const result: Record<string, LocationOptionWithLocation[]> = {};
  for (const row of optionRows as Array<{
    id: string;
    script_location_id: string;
    location_id: string;
    slot_order: number;
    is_featured: boolean;
    appearance_prompt: string | null;
    created_at: string;
  }>) {
    const loc = locationMap.get(row.location_id);
    if (!loc) continue;
    const entry: LocationOptionWithLocation = {
      ...row,
      appearance_prompt: row.appearance_prompt || loc.appearance_prompt || null,
      location: {
        id: loc.id,
        name: loc.name,
        featured_image: loc.featured_image,
        address: loc.address,
        city: loc.city,
        state: loc.state,
        appearance_prompt: loc.appearance_prompt,
        top_images: imagesMap.get(loc.id) ?? [],
      },
    };
    (result[row.script_location_id] ??= []).push(entry);
  }
  return result;
}

/** Assign a global location as an option for a script location. Auto-features first. */
export async function assignLocationOption(
  scriptLocationId: string,
  locationId: string,
): Promise<string> {
  const { supabase } = await requireAuth();

  // Check if already assigned
  const { data: alreadyAssigned } = await supabase
    .from('script_location_options')
    .select('id')
    .eq('script_location_id', scriptLocationId)
    .eq('location_id', locationId)
    .maybeSingle();
  if (alreadyAssigned) return (alreadyAssigned as { id: string }).id;

  // Determine slot order and whether to auto-feature
  const { data: existing } = await supabase
    .from('script_location_options')
    .select('id, slot_order')
    .eq('script_location_id', scriptLocationId)
    .order('slot_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0
    ? (existing[0] as { slot_order: number }).slot_order + 1
    : 0;
  const isFirst = !existing || existing.length === 0;

  const { data: row, error } = await supabase
    .from('script_location_options')
    .insert({
      script_location_id: scriptLocationId,
      location_id: locationId,
      slot_order: nextOrder,
      is_featured: isFirst,
    } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return (row as { id: string }).id;
}

/** Remove a location option. Promotes next in line if the removed one was featured. */
export async function removeLocationOption(optionId: string) {
  const { supabase } = await requireAuth();

  const { data: row } = await supabase
    .from('script_location_options')
    .select('script_location_id, is_featured')
    .eq('id', optionId)
    .single() as { data: { script_location_id: string; is_featured: boolean } | null };

  const { error } = await supabase.from('script_location_options').delete().eq('id', optionId);
  if (error) throw new Error(error.message);

  // Promote next if needed
  if (row?.is_featured) {
    const { data: next } = await supabase
      .from('script_location_options')
      .select('id')
      .eq('script_location_id', row.script_location_id)
      .order('slot_order')
      .limit(1);
    if (next && next.length > 0) {
      await supabase
        .from('script_location_options')
        .update({ is_featured: true } as never)
        .eq('id', (next[0] as { id: string }).id);
    }
  }
}

/** Reorder location options. Index 0 = featured. */
export async function reorderLocationOptions(scriptLocationId: string, orderedOptionIds: string[]) {
  const { supabase } = await requireAuth();
  const updates = orderedOptionIds.map((id, i) =>
    supabase
      .from('script_location_options')
      .update({ slot_order: i, is_featured: i === 0 } as never)
      .eq('id', id)
      .eq('script_location_id', scriptLocationId),
  );
  await Promise.all(updates);
}

/** Update location appearance prompt — dual-write to junction row + global locations table. */
export async function updateLocationAppearancePrompt(optionId: string, prompt: string) {
  const { supabase } = await requireAuth();
  // Update junction table
  const { error: optErr } = await supabase
    .from('script_location_options')
    .update({ appearance_prompt: prompt } as never)
    .eq('id', optionId);
  if (optErr) throw new Error(optErr.message);
  // Look up location_id to persist on the global location for reuse across scripts
  const { data: optRow } = await supabase
    .from('script_location_options')
    .select('location_id')
    .eq('id', optionId)
    .single() as { data: { location_id: string } | null };
  if (optRow?.location_id) {
    await supabase
      .from('locations')
      .update({ appearance_prompt: prompt, updated_at: new Date().toISOString() } as never)
      .eq('id', optRow.location_id);
  }
}

/** Get all active global locations with basic info for the location picker. */
export async function getLocationsForPicker(): Promise<Array<{
  id: string;
  name: string;
  featured_image: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
}>> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, featured_image, address, city, state')
    .eq('status', 'active')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{
    id: string;
    name: string;
    featured_image: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
  }>;
}

// ── AI Prompt Log ─────────────────────────────────────────────────────────

import type { AiPromptLogRow } from '@/types/scripts';

export async function getPromptLogs(filters?: {
  scriptId?: string;
  source?: string;
  limit?: number;
  offset?: number;
}): Promise<AiPromptLogRow[]> {
  const { supabase } = await requireAuth();
  let query = supabase
    .from('ai_prompt_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filters?.limit ?? 50);

  if (filters?.scriptId) query = query.eq('script_id', filters.scriptId);
  if (filters?.source) query = query.eq('source', filters.source);
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters?.limit ?? 50) - 1);

  const { data } = await query;
  return (data ?? []) as AiPromptLogRow[];
}

export async function getPromptLogById(id: string): Promise<AiPromptLogRow | null> {
  const { supabase } = await requireAuth();
  const { data } = await supabase.from('ai_prompt_log').select('*').eq('id', id).single();
  return data as AiPromptLogRow | null;
}

export async function getPromptLogForBeat(beatId: string): Promise<AiPromptLogRow | null> {
  const { supabase } = await requireAuth();
  const { data } = await supabase
    .from('ai_prompt_log')
    .select('*')
    .eq('beat_id', beatId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data as AiPromptLogRow | null;
}

// ── Scratch Pad ─────────────────────────────────────────────────────

export async function saveScratchContent(scriptId: string, content: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('scripts')
    .update({ scratch_content: content } as never)
    .eq('id', scriptId);
  if (error) throw new Error(error.message);
}

import type { ScriptCharacterType, IntExt, StoryboardStylePreset, ContentMode } from '@/types/scripts';

export interface ExtractedScriptData {
  characters: Array<{ name: string; description: string; color: string; character_type: ScriptCharacterType; cast_contact_id?: string | null }>;
  locations: Array<{ name: string; description: string; color: string; global_location_id?: string | null }>;
  scenes: Array<{
    location_name: string;
    int_ext: IntExt;
    time_of_day: string;
    beats: Array<{ audio_content: string; visual_content: string; notes_content: string }>;
  }>;
  style?: { style_preset: StoryboardStylePreset | null; aspect_ratio: string; prompt: string } | null;
}

export async function createScriptFromExtract(scriptId: string, extractedData: ExtractedScriptData): Promise<string> {
  const { supabase, userId } = await requireAuth();

  // 1. Fetch current script for version info
  const { data: script, error: scriptErr } = await supabase
    .from('scripts')
    .select('*')
    .eq('id', scriptId)
    .single();
  if (scriptErr || !script) throw new Error(scriptErr?.message ?? 'Script not found');
  const s = script as Record<string, unknown>;
  const groupId = s.script_group_id as string;

  // 2. Find the highest major version across the entire group
  const { data: maxMajorRow } = await supabase
    .from('scripts')
    .select('major_version')
    .eq('script_group_id', groupId)
    .order('major_version', { ascending: false })
    .limit(1)
    .single();
  const major = ((maxMajorRow as Record<string, unknown> | null)?.major_version as number) ?? 0;

  // Find next minor version for this group+major
  const { data: maxRow } = await supabase
    .from('scripts')
    .select('minor_version')
    .eq('script_group_id', groupId)
    .eq('major_version', major)
    .order('minor_version', { ascending: false })
    .limit(1)
    .single();
  const nextMinor = ((maxRow as Record<string, unknown> | null)?.minor_version as number ?? 0) + 1;

  // 3. Create new script with bumped minor version
  const { data: newScript, error: newScriptErr } = await supabase
    .from('scripts')
    .insert({
      title: s.title,
      project_id: s.project_id,
      script_group_id: groupId,
      status: 'draft',
      version: ((s.version as number) ?? 1) + 1,
      major_version: major,
      minor_version: nextMinor,
      is_published: false,
      notes: s.notes,
      scratch_content: s.scratch_content ?? null,
      content_mode: 'table',
      created_by: userId,
    } as never)
    .select('id')
    .single();
  if (newScriptErr || !newScript) throw new Error(newScriptErr?.message ?? 'Failed to create version');
  const newScriptId = (newScript as { id: string }).id;

  // 3. Insert characters (and optionally link cast members)
  for (let i = 0; i < extractedData.characters.length; i++) {
    const ch = extractedData.characters[i];
    const { data: newChar } = await supabase.from('script_characters').insert({
      script_id: newScriptId,
      name: ch.name,
      description: ch.description,
      color: ch.color,
      character_type: ch.character_type,
      sort_order: i,
    } as never).select('id').single();
    if (newChar && ch.cast_contact_id) {
      const charId = (newChar as { id: string }).id;
      await supabase.from('script_character_cast').insert({
        character_id: charId,
        contact_id: ch.cast_contact_id,
        slot_order: 0,
        is_featured: true,
      } as never);
    }
  }

  // 4. Insert locations and build name→id map
  const locationIdMap = new Map<string, string>();
  for (let i = 0; i < extractedData.locations.length; i++) {
    const loc = extractedData.locations[i];
    const { data: newLoc } = await supabase.from('script_locations').insert({
      script_id: newScriptId,
      name: loc.name,
      description: loc.description,
      color: loc.color,
      sort_order: i,
      ...(loc.global_location_id ? { global_location_id: loc.global_location_id } : {}),
    } as never).select('id').single();
    if (newLoc) locationIdMap.set(loc.name.toLowerCase(), (newLoc as { id: string }).id);
  }

  // 5. Insert scenes and beats
  for (let i = 0; i < extractedData.scenes.length; i++) {
    const scene = extractedData.scenes[i];
    const matchedLocId = locationIdMap.get(scene.location_name.toLowerCase()) ?? null;

    const { data: newScene, error: sceneErr } = await supabase.from('script_scenes').insert({
      script_id: newScriptId,
      sort_order: i,
      location_name: scene.location_name,
      location_id: matchedLocId,
      int_ext: scene.int_ext,
      time_of_day: scene.time_of_day,
    } as never).select('id').single();
    if (sceneErr || !newScene) continue;
    const newSceneId = (newScene as { id: string }).id;

    for (let j = 0; j < scene.beats.length; j++) {
      const beat = scene.beats[j];
      await supabase.from('script_beats').insert({
        scene_id: newSceneId,
        sort_order: j,
        audio_content: beat.audio_content,
        visual_content: beat.visual_content,
        notes_content: beat.notes_content,
      } as never);
    }
  }

  // 6. Clone tags from source script
  const { data: tagsData } = await supabase
    .from('script_tags')
    .select('*')
    .eq('script_id', scriptId)
    .order('name');
  for (const tag of (tagsData ?? [])) {
    const t = tag as Record<string, unknown>;
    await supabase.from('script_tags').insert({
      script_id: newScriptId,
      name: t.name,
      slug: `tag-${crypto.randomUUID().slice(0, 8)}`,
      color: t.color,
    } as never);
  }

  // 7. Optionally insert style
  if (extractedData.style) {
    await supabase.from('script_styles').insert({
      script_id: newScriptId,
      prompt: extractedData.style.prompt,
      aspect_ratio: extractedData.style.aspect_ratio,
      generation_mode: 'beat',
      style_preset: extractedData.style.style_preset,
    } as never);
  }

  revalidatePath('/admin/scripts');
  return newScriptId;
}

// ── Create Mode Version (switch between scratchpad ↔ table) ──

export async function createModeVersion(scriptId: string, targetMode: ContentMode): Promise<string> {
  const { supabase } = await requireAuth();

  // 1. Fetch current script for version info + scratch content generation
  const { data: script, error: scriptErr } = await supabase
    .from('scripts')
    .select('*')
    .eq('id', scriptId)
    .single();
  if (scriptErr || !script) throw new Error(scriptErr?.message ?? 'Script not found');
  const s = script as Record<string, unknown>;
  const groupId = s.script_group_id as string;

  // Find the highest major version across the entire group
  const { data: maxMajorRow3 } = await supabase
    .from('scripts')
    .select('major_version')
    .eq('script_group_id', groupId)
    .order('major_version', { ascending: false })
    .limit(1)
    .single();
  const major = ((maxMajorRow3 as Record<string, unknown> | null)?.major_version as number) ?? 0;

  // 2. If switching to scratchpad, flatten existing beats into scratch_content
  let scratchContent = (s.scratch_content as string) ?? '';
  if (targetMode === 'scratchpad' && !scratchContent.trim()) {
    const { data: scenes } = await supabase
      .from('script_scenes')
      .select('*')
      .eq('script_id', scriptId)
      .order('sort_order');
    if (scenes && scenes.length > 0) {
      const sceneIds = scenes.map((sc: Record<string, unknown>) => sc.id as string);
      const { data: beats } = await supabase
        .from('script_beats')
        .select('*')
        .in('scene_id', sceneIds)
        .order('sort_order');
      const beatsByScene = new Map<string, Record<string, unknown>[]>();
      for (const b of (beats ?? []) as Record<string, unknown>[]) {
        const sid = b.scene_id as string;
        if (!beatsByScene.has(sid)) beatsByScene.set(sid, []);
        beatsByScene.get(sid)!.push(b);
      }
      scratchContent = scenes.map((sc: Record<string, unknown>) => {
        const heading = `${sc.int_ext}. ${sc.location_name} — ${sc.time_of_day}`;
        const sceneBeats = beatsByScene.get(sc.id as string) ?? [];
        const beatLines = sceneBeats.map(b => {
          const parts = [b.audio_content, b.visual_content, b.notes_content].filter(Boolean) as string[];
          return parts.join('\n');
        }).filter(Boolean);
        return [heading, ...beatLines].join('\n\n');
      }).join('\n\n---\n\n');
    }
  }

  // 3. Find max minor_version for this group+major
  const { data: maxRow } = await supabase
    .from('scripts')
    .select('minor_version')
    .eq('script_group_id', groupId)
    .eq('major_version', major)
    .order('minor_version', { ascending: false })
    .limit(1)
    .single();
  const nextMinor = ((maxRow as Record<string, unknown> | null)?.minor_version as number ?? 0) + 1;

  // 4. Use shared duplication with mode + version overrides
  return duplicateScriptCore(scriptId, {
    content_mode: targetMode,
    scratch_content: scratchContent || null,
    major_version: major,
    minor_version: nextMinor,
    is_published: false,
    version: ((s.version as number) ?? 1) + 1,
  });
}

// ── Merge: Companies ──────────────────────────────────────────────────────

export async function mergeCompanies(sourceIds: string[], targetId: string) {
  const { supabase } = await requireAuth();

  const { data: targetRaw } = await supabase.from('clients').select('name, company_types').eq('id', targetId).single();
  const target = targetRaw as { name: string; company_types: string[] } | null;
  if (!target) throw new Error('Target company not found');

  for (const sourceId of sourceIds) {
    if (sourceId === targetId) continue;

    const { data: sourceRaw } = await supabase.from('clients').select('name, company_types').eq('id', sourceId).single();
    const source = sourceRaw as { name: string; company_types: string[] } | null;
    if (!source) continue;

    // Re-point contacts from source → target
    await supabase
      .from('contacts')
      .update({ client_id: targetId, company: target.name } as never)
      .eq('client_id', sourceId);

    // Re-point projects from source → target
    await supabase
      .from('projects')
      .update({ client_id: targetId, client_name: target.name } as never)
      .eq('client_id', sourceId);

    // Re-point testimonials from source → target
    await supabase
      .from('testimonials')
      .update({ client_id: targetId } as never)
      .eq('client_id', sourceId);

    // Update proposals referencing source company name
    await supabase
      .from('proposals')
      .update({ contact_company: target.name } as never)
      .eq('contact_company', source.name);

    // Merge company_types arrays (union)
    const mergedTypes = [...new Set([...(target.company_types ?? []), ...(source.company_types ?? [])])];
    await supabase.from('clients').update({ company_types: mergedTypes } as never).eq('id', targetId);

    // Delete source company
    await supabase.from('clients').delete().eq('id', sourceId);
  }

  revalidatePath('/admin/companies');
  revalidatePath('/admin/leads');
  revalidatePath('/admin/contacts');
  revalidatePath('/admin/projects');
}

// ── Merge: Contacts ───────────────────────────────────────────────────────

export async function mergeContacts(sourceIds: string[], targetId: string) {
  const { supabase } = await requireAuth();

  for (const sourceId of sourceIds) {
    if (sourceId === targetId) continue;

    // Re-point proposal_contacts (upsert to handle dupes)
    const { data: existingPC } = await supabase
      .from('proposal_contacts')
      .select('proposal_id')
      .eq('contact_id', sourceId);
    for (const pc of (existingPC ?? []) as Array<{ proposal_id: string }>) {
      await supabase
        .from('proposal_contacts')
        .upsert({ proposal_id: pc.proposal_id, contact_id: targetId } as never, { onConflict: 'proposal_id,contact_id' });
    }
    await supabase.from('proposal_contacts').delete().eq('contact_id', sourceId);

    // Re-point project_credits
    await supabase
      .from('project_credits')
      .update({ contact_id: targetId } as never)
      .eq('contact_id', sourceId);

    // Re-point contact_roles (upsert to handle dupes)
    const { data: existingCR } = await supabase
      .from('contact_roles')
      .select('role_id')
      .eq('contact_id', sourceId);
    for (const cr of (existingCR ?? []) as Array<{ role_id: string }>) {
      await supabase
        .from('contact_roles')
        .upsert({ contact_id: targetId, role_id: cr.role_id } as never, { onConflict: 'contact_id,role_id' });
    }
    await supabase.from('contact_roles').delete().eq('contact_id', sourceId);

    // Delete source contact
    await supabase.from('contacts').delete().eq('id', sourceId);
  }

  revalidatePath('/admin/contacts');
  revalidatePath('/admin/roles');
}

// ── Merge: Projects ───────────────────────────────────────────────────────

export async function mergeProjects(sourceIds: string[], targetId: string) {
  const { supabase } = await requireAuth();

  for (const sourceId of sourceIds) {
    if (sourceId === targetId) continue;

    // Re-point project_credits
    await supabase
      .from('project_credits')
      .update({ project_id: targetId } as never)
      .eq('project_id', sourceId);

    // Re-point project_videos
    await supabase
      .from('project_videos')
      .update({ project_id: targetId } as never)
      .eq('project_id', sourceId);

    // Re-point proposal_projects
    await supabase
      .from('proposal_projects')
      .update({ project_id: targetId } as never)
      .eq('project_id', sourceId);

    // Re-point testimonials
    await supabase
      .from('testimonials')
      .update({ project_id: targetId } as never)
      .eq('project_id', sourceId);

    // Delete source project
    await supabase.from('projects').delete().eq('id', sourceId);
  }

  revalidatePath('/admin/projects');
  revalidatePath('/work');
  revalidatePath('/');
}

/* ── Merge: Locations ──────────────────────────────────────────────────── */

export async function mergeLocations(sourceIds: string[], targetId: string) {
  'use server';
  const supabase = await createClient();

  for (const sourceId of sourceIds) {
    await supabase
      .from('location_images')
      .update({ location_id: targetId } as never)
      .eq('location_id', sourceId);

    await supabase
      .from('location_projects')
      .update({ location_id: targetId } as never)
      .eq('location_id', sourceId);

    await supabase.from('locations').delete().eq('id', sourceId);
  }

  revalidatePath('/admin/locations');
}

/* ── Merge: Scripts ────────────────────────────────────────────────────── */

export async function mergeScripts(sourceIds: string[], _targetId: string) {
  'use server';
  const supabase = await createClient();

  for (const sourceId of sourceIds) {
    await supabase.from('scripts').delete().eq('id', sourceId);
  }

  revalidatePath('/admin/scripts');
}

/* ── Merge: Proposals ──────────────────────────────────────────────────── */

export async function mergeProposals(sourceIds: string[], targetId: string) {
  'use server';
  const supabase = await createClient();

  for (const sourceId of sourceIds) {
    const { data: contacts } = await supabase
      .from('proposal_contacts')
      .select('contact_id')
      .eq('proposal_id', sourceId) as { data: { contact_id: string }[] | null };
    if (contacts?.length) {
      for (const c of contacts) {
        await supabase
          .from('proposal_contacts')
          .upsert({ proposal_id: targetId, contact_id: c.contact_id } as never, { onConflict: 'proposal_id,contact_id' });
      }
      await supabase.from('proposal_contacts').delete().eq('proposal_id', sourceId);
    }

    const { data: projects } = await supabase
      .from('proposal_projects')
      .select('project_id')
      .eq('proposal_id', sourceId) as { data: { project_id: string }[] | null };
    if (projects?.length) {
      for (const p of projects) {
        await supabase
          .from('proposal_projects')
          .upsert({ proposal_id: targetId, project_id: p.project_id } as never, { onConflict: 'proposal_id,project_id' });
      }
      await supabase.from('proposal_projects').delete().eq('proposal_id', sourceId);
    }

    await supabase
      .from('proposal_sections')
      .update({ proposal_id: targetId } as never)
      .eq('proposal_id', sourceId);

    await supabase
      .from('proposal_quotes')
      .update({ proposal_id: targetId } as never)
      .eq('proposal_id', sourceId);

    await supabase
      .from('proposal_milestones')
      .update({ proposal_id: targetId } as never)
      .eq('proposal_id', sourceId);

    await supabase.from('proposals').delete().eq('id', sourceId);
  }

  revalidatePath('/admin/proposals');
}

/* ── Merge: Intake Submissions ─────────────────────────────────────────── */

export async function mergeIntakeSubmissions(sourceIds: string[], _targetId: string) {
  'use server';
  const supabase = await createClient();

  for (const sourceId of sourceIds) {
    await supabase.from('intake_submissions').delete().eq('id', sourceId);
  }

  revalidatePath('/admin/intake');
}

// ── Call Sheets ──────────────────────────────────────────────────────────────

export async function getCallSheets() {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('call_sheets' as never)
    .select('*, projects(title), locations(name), call_sheet_crew(id)')
    .order('date', { ascending: false });
  if (error) throw new Error((error as { message: string }).message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((cs) => ({
    ...cs,
    project_title: cs.projects?.title ?? null,
    location_name: cs.locations?.name ?? null,
    crew_count: Array.isArray(cs.call_sheet_crew) ? cs.call_sheet_crew.length : 0,
    projects: undefined,
    locations: undefined,
    call_sheet_crew: undefined,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCallSheet(id: string): Promise<any> {
  const { supabase } = await requireAuth();

  const { data: cs, error } = await supabase
    .from('call_sheets' as never)
    .select('*, projects(title), locations(name, address, google_maps_url)')
    .eq('id', id)
    .single();
  if (error) throw new Error((error as { message: string }).message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { locations: locJoin, projects: projJoin, ...row } = cs as any;

  const [bulletins, csLocations, locationImages, cast, crew, scenes, vendors, deptNotes] = await Promise.all([
    supabase.from('call_sheet_bulletins' as never).select('*').eq('call_sheet_id', id).order('sort_order'),
    supabase.from('call_sheet_locations' as never).select('*, locations(name, address)').eq('call_sheet_id', id).order('sort_order'),
    supabase.from('call_sheet_location_images' as never).select('*, location_images(image_url, alt_text)').eq('call_sheet_id', id).order('sort_order'),
    supabase.from('call_sheet_cast' as never).select('*, contacts(first_name, last_name, headshot_url), script_characters(name)').eq('call_sheet_id', id).order('sort_order'),
    supabase.from('call_sheet_crew' as never).select('*, contacts(first_name, last_name, role, phone, email, headshot_url)').eq('call_sheet_id', id).order('sort_order'),
    supabase.from('call_sheet_scenes' as never).select('*, script_scenes(sort_order, location_name, int_ext, time_of_day, scene_notes, script_beats(id, audio_content, visual_content))').eq('call_sheet_id', id).order('sort_order'),
    supabase.from('call_sheet_vendors' as never).select('*, clients(name, phone)').eq('call_sheet_id', id).order('sort_order'),
    supabase.from('call_sheet_dept_notes' as never).select('*').eq('call_sheet_id', id).order('sort_order'),
  ]);

  return {
    ...row,
    project_title: projJoin?.title ?? null,
    location_name: locJoin?.name ?? null,
    location_address: locJoin?.address ?? null,
    location_google_maps_url: locJoin?.google_maps_url ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bulletins: ((bulletins as any).data ?? []),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    locations: (((csLocations as any).data) ?? []).map((l: any) => ({
      ...l,
      location_name: l.locations?.name ?? '',
      location_address: l.locations?.address ?? null,
      locations: undefined,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    location_images: (((locationImages as any).data) ?? []).map((li: any) => ({
      ...li, image_url: li.location_images?.image_url ?? '', alt_text: li.location_images?.alt_text ?? null, location_images: undefined,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cast: (((cast as any).data) ?? []).map((c: any) => ({
      ...c,
      contact_name: c.contacts ? `${c.contacts.first_name ?? ''} ${c.contacts.last_name ?? ''}`.trim() : '',
      headshot_url: c.contacts?.headshot_url ?? null,
      character_name: c.script_characters?.name ?? null,
      contacts: undefined, script_characters: undefined,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    crew: (((crew as any).data) ?? []).map((c: any) => ({
      ...c,
      contact_name: c.contacts ? `${c.contacts.first_name ?? ''} ${c.contacts.last_name ?? ''}`.trim() : '',
      contact_role: c.contacts?.role ?? null,
      phone: c.contacts?.phone ?? null,
      email: c.contacts?.email ?? null,
      headshot_url: c.contacts?.headshot_url ?? null,
      contacts: undefined,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scenes: (((scenes as any).data) ?? []).map((s: any) => ({
      ...s,
      scene_sort_order: s.script_scenes?.sort_order ?? 0,
      location_name: s.script_scenes?.location_name ?? null,
      int_ext: s.script_scenes?.int_ext ?? null,
      time_of_day: s.script_scenes?.time_of_day ?? null,
      scene_notes: s.script_scenes?.scene_notes ?? null,
      beats: Array.isArray(s.script_scenes?.script_beats) ? s.script_scenes.script_beats : [],
      characters: [],
      script_scenes: undefined,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vendors: (((vendors as any).data) ?? []).map((v: any) => ({
      ...v,
      company_name: v.clients?.name ?? '',
      company_phone: v.clients?.phone ?? null,
      clients: undefined,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dept_notes: ((deptNotes as any).data) ?? [],
  };
}

export async function createCallSheet(data: Record<string, unknown>): Promise<string> {
  const { supabase, userId } = await requireAuth();
  const { data: cs, error } = await supabase
    .from('call_sheets' as never)
    .insert({ ...data, created_by: userId, updated_by: userId } as never)
    .select('id')
    .single();
  if (error) throw new Error((error as { message: string }).message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const csId = (cs as any).id as string;
  // Auto-create PRODUCTION dept note
  await supabase.from('call_sheet_dept_notes' as never).insert({
    call_sheet_id: csId,
    department: 'PRODUCTION',
    sort_order: 0,
  } as never);
  revalidatePath('/admin/call-sheets');
  return csId;
}

export async function updateCallSheet(id: string, data: Record<string, unknown>) {
  const { supabase, userId } = await requireAuth();
  const { error } = await supabase
    .from('call_sheets' as never)
    .update({ ...data, updated_by: userId, updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) throw new Error((error as { message: string }).message);
  revalidatePath('/admin/call-sheets');
}

export async function deleteCallSheet(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('call_sheets' as never).delete().eq('id', id);
  if (error) throw new Error((error as { message: string }).message);
  revalidatePath('/admin/call-sheets');
}

export async function batchDeleteCallSheets(ids: string[]) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('call_sheets' as never).delete().in('id', ids);
  if (error) throw new Error((error as { message: string }).message);
  revalidatePath('/admin/call-sheets');
}

// ── Call Sheet Bulletins ─────────────────────────────────────────────────────

export async function upsertCallSheetBulletin(callSheetId: string, data: { id?: string; text: string; pinned?: boolean; visible?: boolean; sort_order?: number }) {
  const { supabase } = await requireAuth();
  const payload = { text: data.text, pinned: data.pinned ?? false, visible: data.visible ?? true, sort_order: data.sort_order ?? 0 };
  if (data.id) {
    const { error } = await supabase.from('call_sheet_bulletins' as never).update(payload as never).eq('id', data.id);
    if (error) throw new Error(error.message);
    return data.id;
  } else {
    const { data: row, error } = await supabase.from('call_sheet_bulletins' as never).insert({ call_sheet_id: callSheetId, ...payload } as never).select('id').single();
    if (error) throw new Error(error.message);
    return (row as any).id as string;
  }
}

export async function deleteCallSheetBulletin(id: string) {
  const { supabase } = await requireAuth();
  await supabase.from('call_sheet_bulletins' as never).delete().eq('id', id);
}

// ── Call Sheet Location Images ───────────────────────────────────────────────

export async function setCallSheetLocationImages(callSheetId: string, images: { location_image_id: string; source: string; sort_order: number }[]) {
  const { supabase } = await requireAuth();
  await supabase.from('call_sheet_location_images' as never).delete().eq('call_sheet_id', callSheetId);
  if (images.length > 0) {
    const { error } = await supabase.from('call_sheet_location_images' as never).insert(
      images.map((img) => ({ call_sheet_id: callSheetId, ...img })) as never[]
    );
    if (error) throw new Error(error.message);
  }
}

// ── Call Sheet Cast ──────────────────────────────────────────────────────────

export async function addCallSheetCast(callSheetId: string, contactId: string, data: Record<string, unknown> = {}) {
  const { supabase } = await requireAuth();
  const { data: row, error } = await supabase
    .from('call_sheet_cast' as never)
    .insert({ call_sheet_id: callSheetId, contact_id: contactId, ...data } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return (row as any).id as string;
}

export async function updateCallSheetCast(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('call_sheet_cast' as never).update(data as never).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function removeCallSheetCast(id: string) {
  const { supabase } = await requireAuth();
  await supabase.from('call_sheet_cast' as never).delete().eq('id', id);
}

// ── Call Sheet Crew ──────────────────────────────────────────────────────────

export async function addCallSheetCrew(callSheetId: string, contactId: string, data: Record<string, unknown> = {}) {
  const { supabase } = await requireAuth();
  const { data: row, error } = await supabase
    .from('call_sheet_crew' as never)
    .insert({ call_sheet_id: callSheetId, contact_id: contactId, ...data } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return (row as any).id as string;
}

export async function updateCallSheetCrew(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('call_sheet_crew' as never).update(data as never).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function removeCallSheetCrew(id: string) {
  const { supabase } = await requireAuth();
  await supabase.from('call_sheet_crew' as never).delete().eq('id', id);
}

// ── Call Sheet Scenes ────────────────────────────────────────────────────────

export async function importScenesFromScript(callSheetId: string, scriptId: string) {
  const { supabase } = await requireAuth();
  const { data: scenes, error } = await supabase
    .from('script_scenes')
    .select('id, sort_order')
    .eq('script_id', scriptId)
    .order('sort_order');
  if (error) throw new Error(error.message);
  if (!scenes?.length) return;

  // Upsert: skip scenes already linked
  const { data: existing } = await supabase
    .from('call_sheet_scenes' as never)
    .select('scene_id')
    .eq('call_sheet_id', callSheetId);
  const existingIds = new Set((existing ?? []).map((e: Record<string, unknown>) => e.scene_id));

  const newRows = scenes
    .filter((s: Record<string, unknown>) => !existingIds.has(s.id as string))
    .map((s: Record<string, unknown>, i: number) => ({
      call_sheet_id: callSheetId,
      scene_id: s.id,
      sort_order: (existing?.length ?? 0) + i,
    }));

  if (newRows.length > 0) {
    const { error: insertError } = await supabase.from('call_sheet_scenes' as never).insert(newRows as never[]);
    if (insertError) throw new Error(insertError.message);
  }
}

export async function updateCallSheetScene(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('call_sheet_scenes' as never).update(data as never).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function removeCallSheetScene(id: string) {
  const { supabase } = await requireAuth();
  await supabase.from('call_sheet_scenes' as never).delete().eq('id', id);
}

// ── Call Sheet Vendors ───────────────────────────────────────────────────────

export async function addCallSheetVendor(callSheetId: string, companyId: string, data: Record<string, unknown> = {}) {
  const { supabase } = await requireAuth();
  const { data: row, error } = await supabase
    .from('call_sheet_vendors' as never)
    .insert({ call_sheet_id: callSheetId, company_id: companyId, ...data } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return (row as any).id as string;
}

export async function updateCallSheetVendor(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('call_sheet_vendors' as never).update(data as never).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function removeCallSheetVendor(id: string) {
  const { supabase } = await requireAuth();
  await supabase.from('call_sheet_vendors' as never).delete().eq('id', id);
}

// ── Call Sheet Dept Notes ────────────────────────────────────────────────────

export async function upsertCallSheetDeptNote(callSheetId: string, data: { id?: string; department: string; notes: string; visible?: boolean; sort_order?: number }) {
  const { supabase } = await requireAuth();
  if (data.id) {
    const { error } = await supabase.from('call_sheet_dept_notes' as never).update({ department: data.department, notes: data.notes, visible: data.visible ?? true, sort_order: data.sort_order ?? 0 } as never).eq('id', data.id);
    if (error) throw new Error(error.message);
    return data.id;
  } else {
    const { data: row, error } = await supabase.from('call_sheet_dept_notes' as never).insert({ call_sheet_id: callSheetId, department: data.department, notes: data.notes, visible: data.visible ?? true, sort_order: data.sort_order ?? 0 } as never).select('id').single();
    if (error) throw new Error(error.message);
    return (row as any).id as string;
  }
}

export async function deleteCallSheetDeptNote(id: string) {
  const { supabase } = await requireAuth();
  await supabase.from('call_sheet_dept_notes' as never).delete().eq('id', id);
}

// ── Call Sheet Locations ────────────────────────────────────────────────────

export async function addCallSheetLocation(callSheetId: string, locationId: string, data: Record<string, unknown> = {}) {
  const { supabase } = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error } = await supabase
    .from('call_sheet_locations' as never)
    .insert({ call_sheet_id: callSheetId, location_id: locationId, ...data } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (row as any).id as string;
}

export async function updateCallSheetLocation(id: string, data: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('call_sheet_locations' as never).update(data as never).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function removeCallSheetLocation(id: string) {
  const { supabase } = await requireAuth();
  await supabase.from('call_sheet_locations' as never).delete().eq('id', id);
}
