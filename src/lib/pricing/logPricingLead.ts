'use client';

import type { LeadData } from './leadCookie';
import { logPricingLeadServer } from './actions';

export async function logPricingLead(
  data: LeadData,
  source: 'gate' | 'save_quote',
): Promise<void> {
  try {
    await logPricingLeadServer({
      name: data.name,
      email: data.email,
      company: data.company,
      timeline: data.timeline,
      timelineDate: data.timelineDate,
      source,
    });
  } catch (err) {
    // Silent failure — analytics should never block the user
    console.warn('logPricingLead failed:', err);
  }
}
