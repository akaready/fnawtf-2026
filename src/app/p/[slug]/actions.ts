'use server';

import { createClient } from '@/lib/supabase/server';
import { setProposalAuthCookie, verifyProposalPassword } from '@/lib/proposal/auth';
import type { ProposalRow, ProposalSectionRow, ProposalMilestoneRow, ProposalQuoteRow } from '@/types/proposal';

export async function verifyProposalAccess(slug: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, proposal_password, status')
    .eq('slug', slug)
    .single();

  if (!proposal) {
    return { success: false, error: 'Proposal not found.' };
  }

  const row = proposal as { id: string; proposal_password: string; status: string };

  if (!verifyProposalPassword(password, row.proposal_password)) {
    return { success: false, error: 'Invalid access code.' };
  }

  // Validate email against proposal_contacts (if any exist)
  const { data: approvedContacts } = await supabase
    .from('proposal_contacts')
    .select('contact_id, contacts(email)')
    .eq('proposal_id', row.id);

  if (approvedContacts && approvedContacts.length > 0) {
    const approvedEmails = (approvedContacts as Array<{ contacts: { email: string | null } | null }>)
      .map((pc) => pc.contacts?.email?.toLowerCase())
      .filter(Boolean) as string[];
    if (approvedEmails.length > 0 && !approvedEmails.includes(email.toLowerCase())) {
      return { success: false, error: 'This email is not authorized for this proposal.' };
    }
  }

  // Set auth cookie
  await setProposalAuthCookie(slug, email);

  // Log view
  await supabase.from('proposal_views').insert({
    proposal_id: row.id,
    viewer_email: email,
  } as never);

  // Auto-update status from 'sent' to 'viewed' on first view
  if (row.status === 'sent') {
    await supabase
      .from('proposals')
      .update({ status: 'viewed', updated_at: new Date().toISOString() } as never)
      .eq('id', row.id);
  }

  return { success: true };
}

export async function getProposalData(slug: string) {
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!proposal) return null;

  const p = proposal as ProposalRow;

  const { data: sections } = await supabase
    .from('proposal_sections')
    .select('*')
    .eq('proposal_id', p.id)
    .order('sort_order');

  // Fetch proposal_projects (admin-managed) and reshape into ProposalVideo format
  const { data: proposalProjects } = await supabase
    .from('proposal_projects')
    .select(`
      id, proposal_id, sort_order, blurb,
      project:projects(
        id, title, subtitle, description, category, client_name,
        style_tags, assets_delivered, premium_addons, camera_techniques,
        production_days, crew_count, talent_count, location_count,
        credits:project_credits(id, project_id, role, name, sort_order),
        bts_images:project_bts_images(id, project_id, image_url, caption, sort_order),
        testimonials(quote, person_name, person_title, display_title),
        project_videos(id, bunny_video_id, title, video_type, aspect_ratio, sort_order)
      )
    `)
    .eq('proposal_id', p.id)
    .order('sort_order');

  // Reshape proposal_projects → ProposalVideo[] for the client
  const proposalVideos = (proposalProjects ?? []).map((pp: Record<string, unknown>) => {
    const project = pp.project as Record<string, unknown> | null;
    const videos = (project?.project_videos ?? []) as Array<Record<string, unknown>>;
    // Pick the first video (lowest sort_order)
    const mainVideo = videos.sort((a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0))[0] ?? null;
    // Move project_videos off the project object so it matches ProposalVideo shape
    const { project_videos: _, ...projectWithout } = (project ?? {}) as Record<string, unknown>;
    return {
      id: pp.id,
      proposal_id: pp.proposal_id,
      sort_order: pp.sort_order,
      proposal_blurb: pp.blurb ?? null,
      project_video: mainVideo ? {
        id: mainVideo.id,
        bunny_video_id: mainVideo.bunny_video_id,
        title: mainVideo.title,
        video_type: mainVideo.video_type,
        aspect_ratio: mainVideo.aspect_ratio,
        project: projectWithout,
      } : null,
    };
  });

  const { data: quotes } = await supabase
    .from('proposal_quotes')
    .select('*')
    .eq('proposal_id', p.id)
    .is('deleted_at', null)
    .order('created_at');

  const { data: milestones } = await supabase
    .from('proposal_milestones')
    .select('*')
    .eq('proposal_id', p.id)
    .order('start_date');

  return {
    proposal: p,
    sections: (sections ?? []) as ProposalSectionRow[],
    videos: proposalVideos ?? [],
    quotes: quotes ?? [],
    milestones: (milestones ?? []) as ProposalMilestoneRow[],
  };
}

export async function saveClientQuote(proposalId: string, quoteData: {
  label: string;
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
}): Promise<ProposalQuoteRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('proposal_quotes')
    .insert({
      proposal_id: proposalId,
      is_fna_quote: false,
      is_locked: false,
      ...quoteData,
    } as never)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ProposalQuoteRow;
}

export async function updateClientQuote(_proposalId: string, data: {
  quote_type: string;
  selected_addons: Record<string, number>;
  slider_values: Record<string, number>;
  tier_selections: Record<string, string>;
  location_days: Record<string, number[]>;
  photo_count: number;
  crowdfunding_enabled: boolean;
  crowdfunding_tier: number;
  fundraising_enabled: boolean;
  friendly_discount_pct?: number;
}, quoteId?: string) {
  if (!quoteId) throw new Error('quoteId is required');
  const supabase = await createClient();
  const { error } = await supabase.from('proposal_quotes').update({
    ...data,
    updated_at: new Date().toISOString(),
  } as never).eq('id', quoteId);
  if (error) throw new Error(error.message);
}

export async function updateClientQuoteDescription(quoteId: string, description: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('proposal_quotes')
    .update({ description, updated_at: new Date().toISOString() } as never)
    .eq('id', quoteId);
  if (error) throw new Error(error.message);
}

export async function renameClientQuote(quoteId: string, label: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('proposal_quotes')
    .update({ label, updated_at: new Date().toISOString() } as never)
    .eq('id', quoteId);
  if (error) throw new Error(error.message);
}

export async function deleteClientQuote(quoteId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('proposal_quotes')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', quoteId);
  if (error) throw new Error(error.message);
}

export async function updateMilestoneDate(milestoneId: string, newStartDate: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('proposal_milestones')
    .update({ start_date: newStartDate } as never)
    .eq('id', milestoneId);
  if (error) throw new Error(error.message);
}
