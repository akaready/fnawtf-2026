'use server';

import { createClient } from '@/lib/supabase/server';
import { setProposalAuthCookie } from '@/lib/proposal/auth';

export async function loginByAccessCode(
  email: string,
  accessCode: string,
): Promise<{ success: boolean; slug?: string; error?: string }> {
  const supabase = await createClient();

  // Find a non-draft proposal matching this access code
  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, slug, proposal_password, status');

  if (!proposals || proposals.length === 0) {
    return { success: false, error: 'Invalid access code.' };
  }

  const match = (proposals as { id: string; slug: string; proposal_password: string; status: string }[])
    .find((p) => p.proposal_password === accessCode);

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

  return { success: true, slug: match.slug };
}
