'use server';

import { createClient } from '@/lib/supabase/server';
import { setProposalAuthCookie, verifyProposalPassword } from '@/lib/proposal/auth';
import { notifySlack } from '@/lib/slack/notify';
import type { ProposalRow, ProposalSectionRow, ProposalMilestoneRow, ProposalQuoteRow } from '@/types/proposal';

export async function verifyProposalAccess(slug: string, email: string, password: string, firstName?: string, lastName?: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, title, proposal_password, status, contact_company')
    .eq('slug', slug)
    .single();

  if (!proposal) {
    return { success: false, error: 'Proposal not found.' };
  }

  const row = proposal as {
    id: string;
    title: string;
    proposal_password: string;
    status: string;
    contact_company: string | null;
  };

  if (!verifyProposalPassword(password, row.proposal_password)) {
    return { success: false, error: 'Invalid access code.' };
  }

  // Resolve viewer name — prefer login form input, fall back to contacts table
  let viewerName: string | null = null;
  if (firstName) {
    viewerName = `${firstName}${lastName ? ` ${lastName}` : ''}`.trim();
  } else {
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name')
      .eq('email', email)
      .maybeSingle();
    const ct = contact as { first_name: string; last_name: string } | null;
    viewerName = ct ? `${ct.first_name} ${ct.last_name}`.trim() : null;
  }

  // Set auth cookie (store first name for quote labels)
  await setProposalAuthCookie(slug, email, firstName || viewerName?.split(' ')[0] || undefined);

  // Log view
  await supabase.from('proposal_views').insert({
    proposal_id: row.id,
    viewer_email: email,
    viewer_name: viewerName,
  } as never);


  // Look up client by company name for Slack channel routing
  let slackChannelId: string | null = null;
  if (row.contact_company) {
    const { data: clientRow } = await supabase
      .from('clients')
      .select('slack_channel_id')
      .eq('name', row.contact_company)
      .maybeSingle();
    slackChannelId = (clientRow as { slack_channel_id?: string } | null)?.slack_channel_id ?? null;
  }

  await notifySlack({
    type: 'proposal_viewed',
    data: {
      proposalId: row.id,
      title: row.title,
      slug,
      viewerEmail: email,
      viewerName,
      companyName: row.contact_company,
      slackChannelId,
    },
  });

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
        thumbnail_url, thumbnail_time,
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
    .order('sort_order');

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
  fundraising_tier: number;
  defer_payment: boolean;
  friendly_discount_pct: number;
  total_amount: number | null;
  down_amount: number | null;
}, viewerEmail?: string): Promise<ProposalQuoteRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('proposal_quotes')
    .insert({
      proposal_id: proposalId,
      is_fna_quote: false,
      is_locked: false,
      viewer_email: viewerEmail ?? null,
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

export async function startViewSession(proposalId: string, viewerEmail: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('proposal_views')
    .select('id')
    .eq('proposal_id', proposalId)
    .eq('viewer_email', viewerEmail)
    .order('viewed_at', { ascending: false })
    .limit(1)
    .single();
  return (data as { id: string } | null)?.id ?? null;
}

export async function updateViewDuration(viewId: string, durationSeconds: number) {
  const supabase = await createClient();
  await supabase
    .from('proposal_views')
    .update({ duration_seconds: durationSeconds } as never)
    .eq('id', viewId);
}
