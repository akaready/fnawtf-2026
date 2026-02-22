'use client';

import { createClient } from '@/lib/supabase/client';
import type { QuoteData, ContactInfo } from './types';

export async function logQuoteLead(
  data: QuoteData,
  contact: ContactInfo,
  generatedBy: 'auto' | 'manual',
): Promise<void> {
  try {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = (supabase as any).from('quote_leads');
    await table.insert({
      contact_name: contact.name,
      contact_company: contact.company,
      contact_email: contact.email,
      generated_by: generatedBy,
      tier: data.tier,
      quote_date: data.date,
      total: data.total,
      down_amount: data.downAmount,
      down_percent: data.downPercent,
      build_base: data.buildBase,
      launch_base: data.launchBase,
      fundraising_base: data.fundraisingBase,
      overhead: data.overhead,
      overhead_waived: data.overheadWaived,
      deferred_fee: data.deferredFee,
      defer_payment: data.deferPayment,
      crowdfunding_discount: data.crowdfundingDiscount,
      crowdfunding_percent: data.crowdfundingPercent,
      friendly_discount: data.friendlyDiscount,
      friendly_discount_percent: data.friendlyDiscountPercent,
      special_program: data.specialProgram,
      build_items: data.buildItems,
      launch_items: data.launchItems,
      fundraising_items: data.fundraisingItems,
    });
  } catch (err) {
    // Log silently — analytics failure should never block the user
    console.warn('logQuoteLead failed:', err);
  }
}
