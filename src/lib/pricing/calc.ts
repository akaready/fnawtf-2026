// Shared pricing calculation — importable from both client and server modules

import type { AddOn } from '@/types/pricing';
import type { ProposalQuoteRow } from '@/types/proposal';

// ── Fundraising Payment Tiers ─────────────────────────────────────────────

export const fundraisingTiers = [
  { preRaise: 100, multiplier: 1, label: '1x' },
  { preRaise: 80, multiplier: 1.25, label: '1.25x' },
  { preRaise: 60, multiplier: 1.5, label: '1.5x' },
  { preRaise: 40, multiplier: 1.75, label: '1.75x' },
  { preRaise: 20, multiplier: 2, label: '2x' },
];

// ── Tier Total Calculation ────────────────────────────────────────────────

export function calcTierTotal(
  addOns: AddOn[],
  selectedAddOns: Map<string, number>,
  sliderValues: Map<string, number>,
  totalDays: number,
  photoCount: number,
  tierSelections?: Map<string, 'basic' | 'premium'>,
  locationDays?: Map<string, number[]>,
) {
  let total = 0;
  let castCrewTotal = 0;
  let priorityTotal = 0;
  const items: { name: string; price: number }[] = [];

  for (const addOn of addOns) {
    if (addOn.included) continue;

    if (addOn.slider && addOn.multiSlider) {
      if (!selectedAddOns.has(addOn.id)) continue;
      const count = selectedAddOns.get(addOn.id) ?? 1;
      const allDays = Array.from({ length: totalDays }, (_, d) => d + 1);
      for (let i = 0; i < count; i++) {
        const key = `${addOn.id}:${i}`;
        const val = sliderValues.get(key) ?? addOn.slider.default;
        const days = locationDays?.get(key) ?? allDays;
        const dayCount = addOn.perDay ? days.length : 1;
        const lineTotal = val * dayCount;
        total += lineTotal;
        let label = `Location ${i + 1}`;
        if (addOn.perDay && totalDays > 1) {
          if (days.length === totalDays) {
            label += ` x${totalDays} ${totalDays === 1 ? 'day' : 'days'}`;
          } else {
            label += ` (D${days.join(',D')})`;
          }
        }
        items.push({ name: label, price: lineTotal });
      }
      continue;
    }

    if (addOn.slider) {
      if (!selectedAddOns.has(addOn.id)) continue;
      const val = sliderValues.get(addOn.id) ?? addOn.slider.default;
      const itemDays = addOn.perDay ? (sliderValues.get(`${addOn.id}:days`) ?? totalDays) : 1;
      const sliderTotal = val * itemDays;
      total += sliderTotal;
      let label = addOn.name;
      if (addOn.perDay && itemDays > 1) label += ` x${itemDays} days`;
      items.push({ name: label, price: sliderTotal });
      continue;
    }

    if (selectedAddOns.has(addOn.id)) {
      const qty = selectedAddOns.get(addOn.id) ?? 1;
      const itemDays = addOn.perDay ? (sliderValues.get(`${addOn.id}:days`) ?? totalDays) : 1;
      const unitPrice = addOn.tierToggle
        ? (tierSelections?.get(addOn.id) === 'premium' ? addOn.tierToggle.premium.price : addOn.tierToggle.basic.price)
        : addOn.price;
      let linePrice = unitPrice * qty * itemDays;

      if (addOn.photoSlider) {
        const extraPhotos = Math.max(0, photoCount - addOn.photoSlider.included);
        linePrice += extraPhotos * addOn.photoSlider.extraPrice;
      }

      total += linePrice;
      if (addOn.category === 'CAST + CREW' || addOn.discountExempt) castCrewTotal += linePrice;
      if (addOn.category === 'PRIORITY') priorityTotal += linePrice;

      let label = addOn.name;
      if (qty > 1) {
        const unit = addOn.quantity?.unit;
        if (unit && unit !== 'people') {
          label += ` x${qty} ${unit === 'hours' ? 'hrs' : unit}`;
        } else {
          label += ` x${qty}`;
        }
      }
      if (addOn.perDay && itemDays > 1) label += ` x${itemDays} days`;

      items.push({ name: label, price: linePrice });
    }
  }

  return { total, castCrewTotal, priorityTotal, items };
}

// ── Compute totals from a stored ProposalQuoteRow ────────────────────────

export interface QuoteColumnData {
  label: string;
  quoteId: string;
  buildActive: boolean;
  launchActive: boolean;
  isFundraising: boolean;
  buildBase: number;
  launchBase: number;
  fundBase: number;
  buildItems: { name: string; price: number }[];
  launchItems: { name: string; price: number }[];
  fundItems: { name: string; price: number }[];
  overhead: number;
  hasAddOns: boolean;
  friendlyDiscountPct: number;
  friendlyDiscount: number;
  crowdfundingEnabled: boolean;
  crowdDiscount: number;
  additionalDiscount: number;
  total: number;
  downAmount: number;
  deferPayment: boolean;
  downPercent: number;
  fundraisingTierIndex: number;
  fundDeliveryAmount: number;
  fundPostRaiseAmount: number;
}

export function calcTotalFromQuote(quote: ProposalQuoteRow, addOns: AddOn[]): QuoteColumnData {
  const sel = new Map(Object.entries(quote.selected_addons ?? {}));
  const sliders = new Map(Object.entries(quote.slider_values ?? {}));
  const tiers = new Map(
    Object.entries(quote.tier_selections ?? {}).map(([k, v]) => [k, v as 'basic' | 'premium'])
  );
  const locDays = new Map(
    Object.entries(quote.location_days ?? {}).map(([k, v]) => [k, v as number[]])
  );
  const totalDays = sel.get('launch-production-days') ?? 1;
  const photoCount = quote.photo_count;

  const isFundraising = quote.fundraising_enabled;
  const buildActive = ['build', 'build-launch', 'scale'].includes(quote.quote_type) && !isFundraising;
  const launchActive = ['launch', 'build-launch', 'scale'].includes(quote.quote_type) && !isFundraising;

  const buildAddOnsArr = addOns.filter((a) => a.tier === 'build');
  const launchAddOnsArr = addOns.filter((a) => a.tier === 'launch');
  const fundAddOnsArr = addOns.filter((a) => a.tier === 'fundraising');

  const buildResult = buildActive ? calcTierTotal(buildAddOnsArr, sel, sliders, 1, photoCount, tiers) : null;
  const launchResult = launchActive ? calcTierTotal(launchAddOnsArr, sel, sliders, totalDays, photoCount, tiers, locDays) : null;
  const fundResult = isFundraising ? calcTierTotal(fundAddOnsArr, sel, sliders, 1, photoCount, tiers) : null;

  const buildBase = buildActive ? 5000 : 0;
  const launchBase = launchActive ? 5000 + (totalDays * 5000) : 0;
  const fundBase = isFundraising ? 10000 : 0;

  const addOnTotal = (buildResult?.total ?? 0) + (launchResult?.total ?? 0) + (fundResult?.total ?? 0);
  const castCrewTotal = launchResult?.castCrewTotal ?? 0;
  const priorityTotal = (buildResult?.priorityTotal ?? 0) + (launchResult?.priorityTotal ?? 0) + (fundResult?.priorityTotal ?? 0);
  const baseTotal = isFundraising ? fundBase : (buildBase + launchBase);
  const subtotal = baseTotal + addOnTotal;
  const hasAddOns = addOnTotal > 0;
  // Priority Scheduling is exempt from overhead — compute on subtotal minus priority fees
  const overheadBase = subtotal - priorityTotal;
  const overhead = (hasAddOns && overheadBase > baseTotal) ? Math.round(overheadBase * 0.1) : 0;
  const subtotalWithOverhead = subtotal + overhead;

  // Priority Scheduling + Cast & Crew are exempt from all discounts
  const discountExempt = castCrewTotal + priorityTotal;
  const crowdTierDiscounts = [0, 10, 20, 30];
  const crowdDiscount = quote.crowdfunding_enabled
    ? Math.round((subtotalWithOverhead - discountExempt) * (crowdTierDiscounts[quote.crowdfunding_tier] / 100))
    : 0;

  const showFriendly = !quote.crowdfunding_enabled && !isFundraising;
  const friendlyDiscount = showFriendly && quote.friendly_discount_pct > 0
    ? Math.round((subtotalWithOverhead - discountExempt) * (quote.friendly_discount_pct / 100))
    : 0;

  const additionalDiscount = quote.additional_discount ?? 0;
  const rawTotal = subtotalWithOverhead - crowdDiscount - friendlyDiscount - additionalDiscount;
  const hasDiscount = crowdDiscount > 0 || friendlyDiscount > 0 || additionalDiscount > 0;
  const total = hasDiscount ? Math.ceil(rawTotal / 50) * 50 : rawTotal;

  const fundTierIdx = isFundraising ? (quote.fundraising_tier ?? 0) : 0;
  const downPct = isFundraising
    ? (fundTierIdx === 4 ? 0.2 : 0.4)
    : (quote.crowdfunding_enabled && quote.defer_payment) ? 0.6 : 0.4;
  const rawDown = Math.round(total * downPct);
  const downAmount = hasDiscount ? Math.ceil(rawDown / 50) * 50 : rawDown;

  const ftier = fundraisingTiers[fundTierIdx];
  const fPreRaisePct = isFundraising ? ftier.preRaise / 100 : 0;
  const fDelivery = isFundraising ? Math.round(total * Math.max(0, fPreRaisePct - downPct)) : 0;
  const fPostBase = isFundraising ? total - Math.round(total * fPreRaisePct) : 0;
  const fPostRaise = Math.round(fPostBase * (ftier?.multiplier ?? 1));

  return {
    label: quote.label,
    quoteId: quote.id,
    buildActive,
    launchActive,
    isFundraising,
    buildBase,
    launchBase,
    fundBase,
    buildItems: buildResult?.items ?? [],
    launchItems: (launchResult?.items ?? []).filter((i) => !i.name.includes('Production Days')),
    fundItems: fundResult?.items ?? [],
    overhead,
    hasAddOns,
    friendlyDiscountPct: showFriendly ? quote.friendly_discount_pct : 0,
    friendlyDiscount,
    crowdfundingEnabled: quote.crowdfunding_enabled,
    crowdDiscount,
    additionalDiscount,
    total,
    downAmount,
    downPercent: downPct,
    deferPayment: quote.defer_payment,
    fundraisingTierIndex: fundTierIdx,
    fundDeliveryAmount: fDelivery,
    fundPostRaiseAmount: fPostRaise,
  };
}
