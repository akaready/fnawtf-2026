'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { setPortalSession } from '@/lib/portal/portalAuth';

export async function loginToPortal(
  email: string,
  accessCode: string,
): Promise<{ success: false; error: string }> {
  const supabase = await createClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, logo_url, portal_password')
    .eq('portal_password', accessCode)
    .maybeSingle();

  if (!client || client.portal_password !== accessCode) {
    return { success: false, error: 'Invalid access code.' };
  }

  await setPortalSession({
    clientId: client.id,
    clientName: client.name,
    // Email is for display and audit only — authentication is solely by the
    // shared portal_password. Any email + the correct access code grants entry.
    email,
    logoUrl: client.logo_url ?? null,
  });

  redirect('/portal');
}
