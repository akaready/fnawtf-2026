'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { notifySlack } from '@/lib/slack/notify';

export async function logPricingLeadServer(data: {
  name: string;
  email: string;
  company?: string;
  timeline: string;
  timelineDate?: string;
  source: 'gate' | 'save_quote';
}): Promise<void> {
  try {
    const supabase = createServiceClient();

    await supabase.from('pricing_leads').insert({
      name: data.name,
      email: data.email,
      company: data.company || null,
      timeline: data.timeline,
      timeline_date: data.timelineDate ?? null,
      source: data.source,
    });

    await notifySlack({
      type: 'pricing_lead',
      data: {
        name: data.name,
        email: data.email,
        company: data.company || null,
        timeline: data.timeline,
        source: data.source,
      },
    });

    // Auto-create company as a lead if company name provided
    if (data.company) {
      try {
        // Check if a client with this email already exists
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('email', data.email)
          .maybeSingle();

        if (!existing) {
          await supabase.from('clients').insert({
            name: data.company,
            email: data.email,
            company_types: ['lead'],
            status: 'lead',
          });
        }
      } catch {
        // Non-critical — don't block the lead capture
      }
    }
  } catch (err) {
    console.warn('logPricingLeadServer failed:', err);
  }
}
