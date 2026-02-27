import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/** Service-role Supabase client — bypasses RLS. Use only in server-side contexts without a user session (e.g. webhooks). */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
