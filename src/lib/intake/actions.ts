'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { notifySlack } from '@/lib/slack/notify';

export interface IntakeFormData {
  // Contact
  first_name: string;
  last_name: string;
  nickname?: string;
  email: string;
  title?: string;
  stakeholders?: string;

  // Project basics
  company_name?: string;
  company_url?: string;
  project_name: string;
  phases?: string[];
  pitch: string;
  excitement?: string;
  key_feature?: string;
  vision?: string;
  avoid?: string;
  audience?: string;
  challenge?: string;
  competitors?: { url: string; note?: string }[];

  // Creative
  video_links?: string;

  // Deliverables
  deliverables: string[];
  deliverable_notes?: string;

  // Timeline
  timeline: string;
  timeline_date?: string;
  timeline_notes?: string;

  // Priorities
  priority_order: string[];

  // Experience
  experience: string;
  experience_notes?: string;

  // Partners
  partners: string[];
  partner_details?: string;

  // Crowdfunding
  public_goal?: string;
  internal_goal?: string;

  // Budget
  budget?: string;

  // Email list
  email_list_size?: string;

  // Files
  file_urls: string[];

  // Additional
  anything_else?: string;
  referral?: string;

  // Quote
  quote_data?: Record<string, unknown>;
  budget_interacted?: boolean;
}

// ── Helpers (not exported as server actions) ──────────────────────────────

async function createCompanyServiceRole(
  name: string,
  email: string,
  websiteUrl?: string,
): Promise<string> {
  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from('clients')
    .insert({
      name,
      email,
      website_url: websiteUrl ?? null,
      company_types: ['lead'],
      status: 'prospect',
      pipeline_stage: 'new',
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return (row as { id: string }).id;
}

async function scrapeAndUpdateCompany(clientId: string, websiteUrl?: string): Promise<void> {
  if (!websiteUrl) return;
  try {
    const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FNA-Admin/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return;
    const html = await resp.text();

    // Extract meta description
    const getMeta = (name: string): string | undefined => {
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

    const description = getMeta('description') ?? getMeta('og:description');

    // Extract social links
    const linkedinMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/company\/[^"'\s]+)["']/i);
    const twitterMatch = html.match(/href=["'](https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^"'\s]+)["']/i);
    const instagramMatch = html.match(/href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"'\s]+)["']/i);

    const updates: Record<string, string> = { website_url: url };
    if (description) updates.description = description;
    if (linkedinMatch?.[1]) updates.linkedin_url = linkedinMatch[1];
    if (twitterMatch?.[1]) updates.twitter_url = twitterMatch[1];
    if (instagramMatch?.[1]) updates.instagram_url = instagramMatch[1];

    const supabase = createServiceClient();
    await supabase.from('clients').update(updates).eq('id', clientId);
  } catch { /* fire and forget — never throw */ }
}

// ── Main submit action ────────────────────────────────────────────────────

export async function submitIntakeForm(data: IntakeFormData) {
  const supabase = createServiceClient();

  const { data: inserted, error } = await supabase.from('intake_submissions').insert({
    first_name: data.first_name,
    last_name: data.last_name,
    nickname: data.nickname || null,
    email: data.email,
    title: data.title || null,
    stakeholders: data.stakeholders || null,
    company_name: data.company_name || null,
    company_url: data.company_url || null,
    project_name: data.project_name,
    phases: data.phases || [],
    pitch: data.pitch,
    excitement: data.excitement || null,
    key_feature: data.key_feature || null,
    vision: data.vision || null,
    avoid: data.avoid || null,
    audience: data.audience || null,
    challenge: data.challenge || null,
    competitors: data.competitors?.length ? data.competitors : null,
    video_links: data.video_links || null,
    deliverables: data.deliverables,
    deliverable_notes: data.deliverable_notes || null,
    timeline: data.timeline,
    timeline_date: data.timeline_date || null,
    timeline_notes: data.timeline_notes || null,
    priority_order: data.priority_order,
    experience: data.experience,
    experience_notes: data.experience_notes || null,
    partners: data.partners,
    partner_details: data.partner_details || null,
    public_goal: data.public_goal || null,
    internal_goal: data.internal_goal || null,
    budget: data.budget || null,
    email_list_size: data.email_list_size || null,
    file_urls: data.file_urls,
    anything_else: data.anything_else || null,
    referral: data.referral || null,
    quote_data: data.quote_data || null,
    budget_interacted: data.budget_interacted ?? false,
  }).select('id').single();

  if (error) throw new Error(error.message);

  // Auto-create company record and link it
  if (data.company_name) {
    try {
      const clientId = await createCompanyServiceRole(
        data.company_name,
        data.email,
        data.company_url,
      );
      // Link the intake submission to the new company
      await supabase
        .from('intake_submissions')
        .update({ client_id: clientId })
        .eq('id', inserted.id);

      // Fire-and-forget: scrape company website for metadata
      if (data.company_url) {
        scrapeAndUpdateCompany(clientId, data.company_url).catch(() => {});
      }
    } catch { /* company creation failed — don't block submission */ }
  }

  notifySlack({
    type: 'intake_submitted',
    data: {
      name: `${data.first_name} ${data.last_name}`.trim(),
      email: data.email,
      company: data.company_name,
      project: data.project_name,
      deliverables: data.deliverables,
      budget: data.budget,
      timeline: data.timeline,
      pitch: data.pitch,
      phases: data.phases,
      experience: data.experience,
      referral: data.referral,
    },
  });
}

export async function uploadIntakeFile(formData: FormData): Promise<string> {
  const supabase = createServiceClient();
  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  const ext = file.name.split('.').pop() || 'bin';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('intake-files')
    .upload(path, file, { upsert: false });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage
    .from('intake-files')
    .getPublicUrl(path);

  return urlData.publicUrl;
}
