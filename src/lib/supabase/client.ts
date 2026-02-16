'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

/**
 * Supabase Browser Client
 * Use in Client Components for authentication and real-time subscriptions
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}
