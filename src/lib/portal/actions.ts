'use server';

import { createClient } from '@/lib/supabase/server';
import { setProposalAuthCookie } from '@/lib/proposal/auth';
import { notifySlack } from '@/lib/slack/notify';

export async function loginByAccessCode(
  email: string,
  accessCode: string,
): Promise<{ success: boolean; slug?: string; error?: string }> {
  const supabase = await createClient();

  // Find a non-draft proposal matching this access code
  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, slug, title, proposal_password, status, contact_company');

  if (!proposals || proposals.length === 0) {
    return { success: false, error: 'Invalid access code.' };
  }

  const match = (proposals as {
    id: string;
    slug: string;
    title: string;
    proposal_password: string;
    status: string;
    contact_company: string | null;
  }[]).find((p) => p.proposal_password === accessCode);

  if (!match) {
    return { success: false, error: 'Invalid access code.' };
  }

  // Set auth cookie
  await setProposalAuthCookie(match.slug, email);

  // Log view
  await supabase.from('proposal_views').insert({
    proposal_id: match.id,
    viewer_email: email,
  } as never);

  // Auto-update status from 'sent' to 'viewed'
  if (match.status === 'sent') {
    await supabase
      .from('proposals')
      .update({ status: 'viewed', updated_at: new Date().toISOString() } as never)
      .eq('id', match.id);
  }

  // Resolve viewer name from contacts + client Slack channel
  const { data: contact } = await supabase
    .from('contacts')
    .select('first_name, last_name')
    .eq('email', email)
    .maybeSingle();
  const ct = contact as { first_name: string; last_name: string } | null;
  const viewerName = ct ? `${ct.first_name} ${ct.last_name}`.trim() : null;

  // Look up client by company name for Slack channel routing
  let slackChannelId: string | null = null;
  if (match.contact_company) {
    const { data: clientRow } = await supabase
      .from('clients')
      .select('slack_channel_id')
      .eq('name', match.contact_company)
      .maybeSingle();
    slackChannelId = (clientRow as { slack_channel_id?: string } | null)?.slack_channel_id ?? null;
  }

  await notifySlack({
    type: 'portal_login',
    data: {
      proposalId: match.id,
      slug: match.slug,
      proposalTitle: match.title,
      viewerEmail: email,
      viewerName,
      companyName: match.contact_company,
      slackChannelId,
    },
  });

  return { success: true, slug: match.slug };
}
