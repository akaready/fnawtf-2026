import { createClient } from '@/lib/supabase/server';
import type { ContactRow } from '@/types/proposal';

/**
 * Resolve the logged-in Supabase user to their contact record.
 * Primary match: supabase_user_id. Fallback: email address.
 * Returns null if no session or no matching contact.
 */
export async function resolveAdminContact(): Promise<ContactRow | null> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const userId = session.user.id;
  const email = session.user.email;

  // Primary: match by supabase_user_id
  const { data: byId } = await supabase
    .from('contacts')
    .select('*')
    .eq('supabase_user_id', userId)
    .single();

  if (byId) return byId as unknown as ContactRow;

  // Fallback: match by email
  if (email) {
    const { data: byEmail } = await supabase
      .from('contacts')
      .select('*')
      .eq('email', email)
      .single();

    if (byEmail) return byEmail as unknown as ContactRow;
  }

  return null;
}
