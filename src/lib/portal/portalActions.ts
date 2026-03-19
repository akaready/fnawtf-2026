'use server';

import { createClient } from '@/lib/supabase/server';
import { setPortalSession } from '@/lib/portal/portalAuth';

export async function loginToPortal(
  email: string,
  password: string,
): Promise<{ success: true; clientId: string; clientName: string; logoUrl: string | null } | { success: false; error: string }> {
  const supabase = await createClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, logo_url, portal_password')
    .eq('portal_password', password)
    .maybeSingle();

  if (!client || client.portal_password !== password) {
    return { success: false, error: 'Invalid access code.' };
  }

  await setPortalSession({
    clientId: client.id,
    clientName: client.name,
    email,
    logoUrl: client.logo_url ?? null,
  });

  return {
    success: true,
    clientId: client.id,
    clientName: client.name,
    logoUrl: client.logo_url ?? null,
  };
}
