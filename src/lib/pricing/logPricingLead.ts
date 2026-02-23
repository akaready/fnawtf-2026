'use client';

import { createClient } from '@/lib/supabase/client';
import type { LeadData } from './leadCookie';

export async function logPricingLead(
  data: LeadData,
  source: 'gate' | 'save_quote',
): Promise<void> {
  try {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('pricing_leads').insert({
      name: data.name,
      email: data.email,
      timeline: data.timeline,
      timeline_date: data.timelineDate ?? null,
      source,
    });
  } catch (err) {
    // Silent failure — analytics should never block the user
    console.warn('logPricingLead failed:', err);
  }
}
