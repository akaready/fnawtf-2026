'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Save, Loader2, Check, X, Plus, ChevronDown } from 'lucide-react';
import { getCalApi } from '@calcom/embed-react';
import { useDirectionalFill } from '@/hooks/useDirectionalFill';
import { AddOn } from '@/types/pricing';
import { QuoteModal } from './QuoteModal';
import type { QuoteData } from '@/lib/pdf/types';
import type { LeadData } from '@/lib/pricing/leadCookie';
import type { ProposalQuoteRow } from '@/types/proposal';

interface CalculatorSummaryProps {
  selectedAddOns: Map<string, number>;
  sliderValues: Map<string, number>;
  allAddOns: AddOn[];
  buildActive: boolean;
  launchActive: boolean;
  crowdfundingEnabled: boolean;
  onCrowdfundingToggle: () => void;
  crowdfundingTierIndex: number;
  onCrowdfundingTierChange: (i: number) => void;
  fundraisingEnabled: boolean;
  onFundraisingToggle: () => void;
  totalDays: number;
  photoCount: number;
  tierSelections?: Map<string, 'basic' | 'premium'>;
  locationDays?: Map<string, number[]>;
  prefillData?: LeadData;
  onInteraction?: () => boolean; // returns true if gate was triggered (bail out)
  onSave?: () => void | Promise<void>;
  saving?: boolean;
  saved?: boolean;
  hideGetStarted?: boolean;
  hideSaveQuote?: boolean;
  crowdfundingApproved?: boolean;
  isReadOnly?: boolean;
  isLocked?: boolean;
  initialFriendlyDiscountPct?: number;
  /** All quotes for dropdown comparison selectors (proposal context only) */
  allQuotes?: ProposalQuoteRow[];
  /** Which quote the live calculator state represents */
  activeQuoteId?: string;
  /** Called whenever the user moves the friendly discount slider */
  onFriendlyDiscountChange?: (pct: number) => void;
}

function formatPrice(amount: number): string {
  return '$' + amount.toLocaleString('en-US');
}

function calcTierTotal(
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
            label += ` x${totalDays}d`;
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
      const dayMultiplier = addOn.perDay ? totalDays : 1;
      const sliderTotal = val * dayMultiplier;
      total += sliderTotal;
      let label = addOn.name;
      if (addOn.perDay && totalDays > 1) label += ` x${totalDays}d`;
      items.push({ name: label, price: sliderTotal });
      continue;
    }

    if (selectedAddOns.has(addOn.id)) {
      const qty = selectedAddOns.get(addOn.id) ?? 1;
      const dayMultiplier = addOn.perDay ? totalDays : 1;
      // Use tier toggle price if applicable
      const unitPrice = addOn.tierToggle
        ? (tierSelections?.get(addOn.id) === 'premium' ? addOn.tierToggle.premium.price : addOn.tierToggle.basic.price)
        : addOn.price;
      let linePrice = unitPrice * qty * dayMultiplier;

      // Photographer extra photos
      if (addOn.photoSlider) {
        const extraPhotos = Math.max(0, photoCount - addOn.photoSlider.included);
        linePrice += extraPhotos * addOn.photoSlider.extraPrice;
      }

      total += linePrice;
      if (addOn.category === 'CAST + CREW') castCrewTotal += linePrice;

      let label = addOn.name;
      if (qty > 1) label += ` x${qty}`;
      if (addOn.perDay && totalDays > 1) label += ` x${totalDays}d`;

      items.push({ name: label, price: linePrice });
    }
  }

  return { total, castCrewTotal, items };
}

// ── Compute totals from a stored ProposalQuoteRow ────────────────────────

interface QuoteColumnData {
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
  total: number;
  downAmount: number;
  downPercent: number;
}

function calcTotalFromQuote(quote: ProposalQuoteRow, addOns: AddOn[]): QuoteColumnData {
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
  const buildActive = quote.quote_type === 'build' && !isFundraising;
  const launchActive = (quote.quote_type === 'launch' || quote.quote_type === 'scale') && !isFundraising;

  const buildAddOnsArr = addOns.filter((a) => a.tier === 'build');
  const launchAddOnsArr = addOns.filter((a) => a.tier === 'launch');
  const fundAddOnsArr = addOns.filter((a) => a.tier === 'fundraising');

  const buildResult = buildActive ? calcTierTotal(buildAddOnsArr, sel, sliders, 1, photoCount, tiers) : null;
  const launchResult = launchActive ? calcTierTotal(launchAddOnsArr, sel, sliders, totalDays, photoCount, tiers, locDays) : null;
  const fundResult = isFundraising ? calcTierTotal(fundAddOnsArr, sel, sliders, 1, photoCount, tiers) : null;

  const buildBase = buildActive ? 5000 : 0;
  const launchBase = launchActive ? 10000 : 0;
  const fundBase = isFundraising ? 15000 : 0;

  const addOnTotal = (buildResult?.total ?? 0) + (launchResult?.total ?? 0) + (fundResult?.total ?? 0);
  const castCrewTotal = launchResult?.castCrewTotal ?? 0;
  const baseTotal = isFundraising ? fundBase : (buildBase + launchBase);
  const subtotal = baseTotal + addOnTotal;
  const hasAddOns = addOnTotal > 0;
  const overhead = hasAddOns ? Math.round(subtotal * 0.1) : 0;
  const subtotalWithOverhead = subtotal + overhead;

  const crowdTierDiscounts = [0, 10, 20, 30];
  const crowdDiscount = quote.crowdfunding_enabled
    ? Math.round((subtotalWithOverhead - castCrewTotal) * (crowdTierDiscounts[quote.crowdfunding_tier] / 100))
    : 0;

  const showFriendly = !quote.crowdfunding_enabled && !isFundraising;
  const friendlyDiscount = showFriendly && quote.friendly_discount_pct > 0
    ? Math.round((subtotalWithOverhead - castCrewTotal) * (quote.friendly_discount_pct / 100))
    : 0;

  const rawTotal = subtotalWithOverhead - crowdDiscount - friendlyDiscount;
  const hasDiscount = crowdDiscount > 0 || friendlyDiscount > 0;
  const total = hasDiscount ? Math.ceil(rawTotal / 50) * 50 : rawTotal;

  const downPct = isFundraising ? 0.2 : 0.4;
  const rawDown = Math.round(total * downPct);
  const downAmount = hasDiscount ? Math.ceil(rawDown / 50) * 50 : rawDown;

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
    total,
    downAmount,
    downPercent: downPct,
  };
}

// ── Checkbox button ──────────────────────────────────────────────────────

function ProgramCheckbox({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  // When enabled: grey styling. When disabled: grey (no green)
  const borderColor = enabled ? 'border-muted-foreground/40' : 'border-muted-foreground/30';
  const bgColor = enabled ? 'bg-muted/20' : 'bg-muted/10 hover:bg-muted/20';
  const checkBorder = enabled ? 'border-[#6e6e74] bg-[#6e6e74]' : 'border-muted-foreground/30';

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 text-left ${borderColor} ${bgColor}`}
    >
      <div
        className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${checkBorder}`}
      >
        {enabled && (
          <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div>
        <span className="text-base font-semibold text-foreground block">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </button>
  );
}

// ── Crowdfunding Slider ──────────────────────────────────────────────────

function CrowdfundingSlider({
  tierIndex,
  onTierChange,
}: {
  tierIndex: number;
  onTierChange: (i: number) => void;
}) {
  const tiers = [
    { discount: 0, percentage: 0, label: 'No discount' },
    { discount: 10, percentage: 2.5 },
    { discount: 20, percentage: 5 },
    { discount: 30, percentage: 10 },
  ];
  const currentTier = tiers[tierIndex];
  const isActive = tierIndex > 0;
  return (
    <div className={`mt-3 p-4 rounded-lg border transition-colors duration-200 ${
      isActive ? 'bg-green-950/30 border-green-600/40' : 'bg-muted/20 border-border'
    }`}>
      <input
        type="range"
        min={0}
        max={3}
        step={1}
        value={tierIndex}
        onChange={(e) => onTierChange(Number(e.target.value))}
        className={`w-full h-2 bg-border rounded-lg appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer ${
          isActive
            ? '[&::-webkit-slider-thumb]:bg-green-600 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(22,163,74,0.4)] [&::-moz-range-thumb]:bg-green-600'
            : '[&::-webkit-slider-thumb]:bg-muted-foreground [&::-moz-range-thumb]:bg-muted-foreground'
        }`}
      />
      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
        <span>0%</span>
        <span>10%</span>
        <span>20%</span>
        <span>30%</span>
      </div>
      <div className="text-center mt-2">
        <span className={`text-lg font-bold transition-colors duration-200 ${
          isActive ? 'text-green-600' : 'text-muted-foreground'
        }`}>{currentTier.discount}% off discount</span>
        <p className="text-xs text-muted-foreground">
          {currentTier.percentage > 0 ? `for ${currentTier.percentage}% of your campaign raise` : currentTier.label}
        </p>
      </div>
    </div>
  );
}

// ── Deferred Payment Checkbox ────────────────────────────────────────────

function DeferredPaymentCheckbox({
  deferPayment,
  onToggle,
}: {
  deferPayment: boolean;
  onToggle: () => void;
}) {
  const borderColor = deferPayment ? 'border-muted-foreground/40' : 'border-border';
  const bgColor = deferPayment ? 'bg-muted/20' : 'bg-muted/20 hover:bg-muted/30';
  const checkBorder = deferPayment ? 'border-[#6e6e74] bg-[#6e6e74]' : 'border-muted-foreground/40';

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 text-left ${borderColor} ${bgColor}`}
    >
      <div
        className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${checkBorder}`}
      >
        {deferPayment && (
          <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div>
        <span className="text-base font-semibold text-foreground block">
          Pay after the campaign
        </span>
        <span className="text-xs text-muted-foreground">
          Defer the balance owed until after you launch
        </span>
      </div>
    </button>
  );
}

// ── Get Started Button ───────────────────────────────────────────────────────

const iconVariants = {
  hidden: {
    opacity: 0,
    x: -8,
    width: 0,
    marginRight: -8,
  },
  visible: {
    opacity: 1,
    x: 0,
    width: 'auto',
    marginRight: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    }
  }
};

function GetStartedButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: 'pricing' });
      cal('ui', {
        cssVarsPerTheme: {
          light: { 'cal-brand': '#9752f4' },
          dark: { 'cal-brand': '#9752f4' },
        },
        theme: 'dark',
        hideEventTypeDetails: true,
        layout: 'month_view',
      });
    })();
  }, []);

  useEffect(() => {
    if (!buttonRef.current || !fillRef.current) return;

    const button = buttonRef.current;
    const fill = fillRef.current;
    const textSpan = button.querySelector('span');

    const handleMouseEnter = (e: MouseEvent) => {
      setIsHovered(true);
      if (!fill) return;

      const rect = button.getBoundingClientRect();
      const x = (e.clientX || e.pageX) - rect.left;
      const direction = x < rect.width / 2 ? 'left' : 'right';

      gsap.killTweensOf([fill, textSpan]);

      if (direction === 'left') {
        gsap.fromTo(
          fill,
          { scaleX: 0, transformOrigin: '0 50%' },
          { scaleX: 1, duration: 0.3, ease: 'power2.out' }
        );
      } else {
        gsap.fromTo(
          fill,
          { scaleX: 0, transformOrigin: '100% 50%' },
          { scaleX: 1, duration: 0.3, ease: 'power2.out' }
        );
      }

      if (textSpan) {
        gsap.to(textSpan, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      gsap.to(fill, { scaleX: 0, duration: 0.3, ease: 'power2.out' });

      if (textSpan) {
        gsap.to(textSpan, { color: '#000000', duration: 0.3, ease: 'power2.out' });
      }
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="flex-1">
      <motion.button
        ref={buttonRef}
        data-cal-namespace="pricing"
        data-cal-link="fnawtf/introduction"
        data-cal-config={JSON.stringify({
          layout: 'month_view',
          useSlotsViewOnSmallScreen: true,
          theme: 'dark',
        })}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full px-4 py-3 font-medium text-black bg-white border border-white rounded-lg overflow-hidden"
      >
        <div
          ref={fillRef}
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
        />
        <span className="relative flex items-center justify-center gap-2 whitespace-nowrap" style={{ zIndex: 10 }}>
          <motion.span
            variants={iconVariants}
            initial="hidden"
            animate={isHovered ? "visible" : "hidden"}
            className="flex items-center"
          >
            <Calendar size={18} strokeWidth={2} />
          </motion.span>
          Get Started
        </span>
      </motion.button>
    </div>
  );
}

function SaveQuoteButton({ onSave, saving, saved }: { onSave: () => void; saving?: boolean; saved?: boolean }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!buttonRef.current || !fillRef.current) return;

    const button = buttonRef.current;
    const fill = fillRef.current;
    const textSpan = button.querySelector('span');

    const handleMouseEnter = (e: MouseEvent) => {
      setIsHovered(true);
      if (!fill) return;

      const rect = button.getBoundingClientRect();
      const x = (e.clientX || e.pageX) - rect.left;
      const direction = x < rect.width / 2 ? 'left' : 'right';

      gsap.killTweensOf([fill, textSpan]);

      if (direction === 'left') {
        gsap.fromTo(fill, { scaleX: 0, transformOrigin: '0 50%' }, { scaleX: 1, duration: 0.3, ease: 'power2.out' });
      } else {
        gsap.fromTo(fill, { scaleX: 0, transformOrigin: '100% 50%' }, { scaleX: 1, duration: 0.3, ease: 'power2.out' });
      }

      if (textSpan) {
        gsap.to(textSpan, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      gsap.to(fill, { scaleX: 0, duration: 0.3, ease: 'power2.out' });

      if (textSpan) {
        gsap.to(textSpan, { color: '#000000', duration: 0.3, ease: 'power2.out' });
      }
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="flex-1">
      <motion.button
        ref={buttonRef}
        onClick={onSave}
        disabled={saving}
        whileHover={{ scale: saving || saved ? 1 : 1.02 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full px-4 py-3 font-medium text-black bg-white border border-white rounded-lg overflow-hidden disabled:opacity-60"
      >
        <div
          ref={fillRef}
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
        />
        <span className="relative flex items-center justify-center gap-2 whitespace-nowrap" style={{ zIndex: 10 }}>
          {saving ? (
            <Loader2 size={18} strokeWidth={2} className="animate-spin" />
          ) : saved ? (
            <Check size={18} strokeWidth={2} />
          ) : (
            <motion.span
              variants={iconVariants}
              initial="hidden"
              animate={isHovered ? "visible" : "hidden"}
              className="flex items-center"
            >
              <Save size={18} strokeWidth={2} />
            </motion.span>
          )}
          {saved ? 'Saved!' : 'Save Quote'}
        </span>
      </motion.button>
    </div>
  );
}

// ── Aligned two-column comparison renderer ──────────────────────────────

function ComparisonGrid({ left, right, rightHeader }: { left: QuoteColumnData; right: QuoteColumnData; rightHeader?: React.ReactNode }) {
  function addedItems(a: { name: string; price: number }[], b: { name: string; price: number }[]) {
    const names = new Set(a.map(i => i.name));
    return b.filter(i => !names.has(i.name));
  }

  function renderTierPair(
    label: string,
    leftBase: number,
    rightBase: number,
    leftItems: { name: string; price: number }[],
    rightItems: { name: string; price: number }[],
  ) {
    const leftItemMap = new Map(leftItems.map(i => [i.name, i]));
    const rightItemMap = new Map(rightItems.map(i => [i.name, i]));
    const leftAdded = addedItems(rightItems, leftItems);
    const rightAdded = addedItems(leftItems, rightItems);

    return { label, leftBase, rightBase, leftItems, rightItems, leftItemMap, rightItemMap, leftAdded, rightAdded };
  }

  const tiers: ReturnType<typeof renderTierPair>[] = [];
  if (left.buildActive || right.buildActive) {
    tiers.push(renderTierPair('Build', left.buildBase, right.buildBase, left.buildItems, right.buildItems));
  }
  if (left.launchActive || right.launchActive) {
    tiers.push(renderTierPair('Launch', left.launchBase, right.launchBase, left.launchItems, right.launchItems));
  }
  if (left.isFundraising || right.isFundraising) {
    tiers.push(renderTierPair('Fundraising', left.fundBase, right.fundBase, left.fundItems, right.fundItems));
  }

  const leftHasFriendly = left.friendlyDiscountPct > 0;
  const rightHasFriendly = right.friendlyDiscountPct > 0;
  const eitherHasFriendly = leftHasFriendly || rightHasFriendly;
  const leftHasCrowd = left.crowdfundingEnabled && left.crowdDiscount > 0;
  const rightHasCrowd = right.crowdfundingEnabled && right.crowdDiscount > 0;
  const eitherHasCrowd = leftHasCrowd || rightHasCrowd;

  return (
    <div className="grid grid-cols-2 gap-x-4 mb-4 font-mono text-sm">
      {/* Left column */}
      <div className="space-y-1.5">
        <div className="mb-3 pb-2 border-b border-green-900/40">
          <div className="w-full bg-green-900/20 border border-green-600/40 text-white font-semibold rounded-md px-3 text-sm flex items-center h-[34px]">
            {left.label}
          </div>
        </div>
        {tiers.map((tier, ti) => (
          <Fragment key={tier.label}>
            {ti > 0 && <div className="h-px bg-green-900/50 my-1" />}
            <div className="flex justify-between gap-1">
              <span className="text-muted-foreground truncate">{tier.label} base</span>
              <span className="text-foreground flex-shrink-0">{formatPrice(tier.leftBase)}</span>
            </div>
            {tier.leftItems.map((item) => (
              <div key={item.name} className="flex justify-between gap-1">
                <span className="text-muted-foreground truncate">{item.name}</span>
                <span className="text-foreground flex-shrink-0">{formatPrice(item.price)}</span>
              </div>
            ))}
            {/* Spacers for items only in right column */}
            {tier.rightAdded.map((item) => (
              <div key={`spacer-${item.name}`} className="flex justify-between gap-1 invisible" aria-hidden>
                <span className="truncate">{item.name}</span>
                <span className="flex-shrink-0">{formatPrice(item.price)}</span>
              </div>
            ))}
          </Fragment>
        ))}
        <div className="h-px bg-green-900/50 my-1" />
        <div className="flex justify-between gap-1">
          <span className="text-muted-foreground truncate">Overhead (10%)</span>
          <span className="text-foreground flex-shrink-0">
            {left.hasAddOns ? formatPrice(left.overhead) : <span className="text-muted-foreground/60">Waived</span>}
          </span>
        </div>
        {eitherHasFriendly && (
          leftHasFriendly ? (
            <div className="flex justify-between gap-1">
              <span className="text-green-600 truncate">Friendly discount ({left.friendlyDiscountPct}%)</span>
              <span className="text-green-600 flex-shrink-0">-{formatPrice(left.friendlyDiscount)}</span>
            </div>
          ) : (
            <div className="flex justify-between gap-1 invisible" aria-hidden>
              <span className="truncate">Friendly discount</span>
              <span className="flex-shrink-0">—</span>
            </div>
          )
        )}
        {eitherHasCrowd && (
          leftHasCrowd ? (
            <div className="flex justify-between gap-1">
              <span className="text-green-600 truncate">Crowdfunding</span>
              <span className="text-green-600 flex-shrink-0">-{formatPrice(left.crowdDiscount)}</span>
            </div>
          ) : (
            <div className="flex justify-between gap-1 invisible" aria-hidden>
              <span className="truncate">Crowdfunding</span>
              <span className="flex-shrink-0">—</span>
            </div>
          )
        )}
      </div>

      {/* Right column */}
      <div className="border-l border-green-900/50 pl-4 space-y-1.5">
        <div className="mb-3 pb-2 border-b border-green-900/40">
          {rightHeader ?? (
            <div className="w-full border border-green-600 rounded-md px-3 py-2 text-sm font-semibold text-white flex items-center">
              {right.label}
            </div>
          )}
        </div>
        {tiers.map((tier, ti) => (
          <Fragment key={tier.label}>
            {ti > 0 && <div className="h-px bg-green-900/50 my-1" />}
            <div className="flex justify-between gap-1">
              <span className="text-muted-foreground truncate">{tier.label} base</span>
              <span className="text-foreground flex-shrink-0">{formatPrice(tier.rightBase)}</span>
            </div>
            {/* Render items in left column order (matching/removed) */}
            {tier.leftItems.map((item) => {
              const rightItem = tier.rightItemMap.get(item.name);
              return (
                <div key={item.name} className="flex justify-between gap-1">
                  <span className={`truncate ${rightItem ? 'text-muted-foreground' : 'text-red-400/60'}`}>{item.name}</span>
                  <span className={`flex-shrink-0 ${rightItem ? 'text-foreground' : 'text-red-400/60'}`}>
                    {rightItem ? formatPrice(rightItem.price) : '$0'}
                  </span>
                </div>
              );
            })}
            {/* Added items (cyan) */}
            {tier.rightAdded.map((item) => (
              <div key={item.name} className="flex justify-between gap-1">
                <span className="text-cyan-400/80 truncate">{item.name}</span>
                <span className="text-cyan-400 flex-shrink-0">{formatPrice(item.price)}</span>
              </div>
            ))}
          </Fragment>
        ))}
        <div className="h-px bg-green-900/50 my-1" />
        <div className="flex justify-between gap-1">
          <span className="text-muted-foreground truncate">Overhead (10%)</span>
          <span className="text-foreground flex-shrink-0">
            {right.hasAddOns ? formatPrice(right.overhead) : <span className="text-muted-foreground/60">Waived</span>}
          </span>
        </div>
        {eitherHasFriendly && (
          rightHasFriendly ? (
            <div className="flex justify-between gap-1">
              <span className="text-green-600 truncate">Friendly discount ({right.friendlyDiscountPct}%)</span>
              <span className="text-green-600 flex-shrink-0">-{formatPrice(right.friendlyDiscount)}</span>
            </div>
          ) : (
            <div className="flex justify-between gap-1 invisible" aria-hidden>
              <span className="truncate">Friendly discount</span>
              <span className="flex-shrink-0">—</span>
            </div>
          )
        )}
        {eitherHasCrowd && (
          rightHasCrowd ? (
            <div className="flex justify-between gap-1">
              <span className="text-green-600 truncate">Crowdfunding</span>
              <span className="text-green-600 flex-shrink-0">-{formatPrice(right.crowdDiscount)}</span>
            </div>
          ) : (
            <div className="flex justify-between gap-1 invisible" aria-hidden>
              <span className="truncate">Crowdfunding</span>
              <span className="flex-shrink-0">—</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── Main Summary ─────────────────────────────────────────────────────────

export function CalculatorSummary({
  selectedAddOns,
  sliderValues,
  allAddOns,
  buildActive,
  launchActive,
  crowdfundingEnabled,
  onCrowdfundingToggle,
  crowdfundingTierIndex,
  onCrowdfundingTierChange,
  fundraisingEnabled,
  onFundraisingToggle: _onFundraisingToggle,
  totalDays,
  photoCount,
  tierSelections,
  locationDays,
  prefillData,
  onInteraction,
  onSave,
  saving,
  saved,
  hideGetStarted,
  hideSaveQuote,
  crowdfundingApproved,
  isReadOnly,
  isLocked,
  initialFriendlyDiscountPct,
  allQuotes,
  activeQuoteId,
  onFriendlyDiscountChange,
}: CalculatorSummaryProps) {
  const [deferPayment, setDeferPayment] = useState(false);
  const [friendlyDiscountPercent, setFriendlyDiscountPercent] = useState(initialFriendlyDiscountPct ?? 0);
  const [discountsOpen, setDiscountsOpen] = useState((initialFriendlyDiscountPct ?? 0) > 0);
  const [showModal, setShowModal] = useState(false);

  // Seed friendly discount whenever the active quote changes (tab switch)
  useEffect(() => {
    if (initialFriendlyDiscountPct !== undefined) {
      setFriendlyDiscountPercent(initialFriendlyDiscountPct);
      if (initialFriendlyDiscountPct > 0) setDiscountsOpen(true);
    }
  }, [initialFriendlyDiscountPct, activeQuoteId]);

  // ── Dropdown comparison state (proposal context only) ──
  const [showComparison, setShowComparison] = useState(false);
  const [compareQuoteId, setCompareQuoteId] = useState<string | null>(null);
  const [compareDropdownOpen, setCompareDropdownOpen] = useState(false);
  const compareDropdownRef = useRef<HTMLDivElement>(null);

  // Compare button directional fill
  const compareBtnRef = useRef<HTMLButtonElement>(null);
  const compareFillRef = useRef<HTMLDivElement>(null);
  const [compareHovered, setCompareHovered] = useState(false);

  useDirectionalFill(compareBtnRef, compareFillRef, {
    onFillStart: () => {
      setCompareHovered(true);
      const textSpan = compareBtnRef.current?.querySelector('span');
      if (textSpan) gsap.to(textSpan, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
    },
    onFillEnd: () => {
      setCompareHovered(false);
      const textSpan = compareBtnRef.current?.querySelector('span');
      if (textSpan) gsap.to(textSpan, { color: '#000000', duration: 0.3, ease: 'power2.out' });
    },
  });

  // Clear compare dropdown if deleted
  useEffect(() => {
    if (compareQuoteId && allQuotes && !allQuotes.some((q) => q.id === compareQuoteId)) {
      setCompareQuoteId(null);
      setShowComparison(false);
    }
  }, [allQuotes, compareQuoteId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (compareDropdownRef.current && !compareDropdownRef.current.contains(e.target as Node)) {
        setCompareDropdownOpen(false);
      }
    }
    if (compareDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [compareDropdownOpen]);

  // ── Live calculator totals (always computed from props) ──
  const buildAddOns = allAddOns.filter((a) => a.tier === 'build');
  const launchAddOnsFiltered = allAddOns.filter((a) => a.tier === 'launch');
  const fundraisingAddOnsList = allAddOns.filter((a) => a.tier === 'fundraising');

  const buildResult = buildActive ? calcTierTotal(buildAddOns, selectedAddOns, sliderValues, 1, photoCount, tierSelections) : null;
  const launchResult = launchActive ? calcTierTotal(launchAddOnsFiltered, selectedAddOns, sliderValues, totalDays, photoCount, tierSelections, locationDays) : null;
  const fundraisingResult = fundraisingEnabled ? calcTierTotal(fundraisingAddOnsList, selectedAddOns, sliderValues, 1, photoCount, tierSelections) : null;

  const buildBase = buildActive ? 5000 : 0;
  const launchBase = launchActive ? 10000 : 0;
  const fundraisingBase = fundraisingEnabled ? 15000 : 0;

  const buildAddOnTotal = buildResult?.total ?? 0;
  const launchAddOnTotal = launchResult?.total ?? 0;
  const fundraisingAddOnTotal = fundraisingResult?.total ?? 0;
  const allAddOnTotal = buildAddOnTotal + launchAddOnTotal + fundraisingAddOnTotal;
  const totalCastCrew = (launchResult?.castCrewTotal ?? 0);

  const baseTotal = fundraisingEnabled ? fundraisingBase : (buildBase + launchBase);
  const subtotal = baseTotal + allAddOnTotal;
  const hasAnyAddOns = allAddOnTotal > 0;
  const overheadAmount = Math.round(subtotal * 0.1);
  const overhead = hasAnyAddOns ? overheadAmount : 0;

  const subtotalWithOverhead = subtotal + overhead;

  // Deferred payment fee
  const deferredFeePercent = crowdfundingEnabled && deferPayment
    ? (crowdfundingTierIndex === 0 ? 10 : 5)
    : 0;
  const deferredFee = Math.round(subtotalWithOverhead * (deferredFeePercent / 100));
  const subtotalWithFee = subtotalWithOverhead + deferredFee;

  const discountableTotal = subtotalWithFee - totalCastCrew;

  const crowdfundingTierDiscounts = [0, 10, 20, 30];
  const crowdfundingDiscount = crowdfundingEnabled
    ? Math.round(discountableTotal * (crowdfundingTierDiscounts[crowdfundingTierIndex] / 100))
    : 0;

  const showFriendlyDiscount = !crowdfundingEnabled && !fundraisingEnabled;
  const friendlyDiscount = showFriendlyDiscount
    ? Math.round(discountableTotal * (friendlyDiscountPercent / 100))
    : 0;

  const rawTotal = subtotalWithFee - crowdfundingDiscount - friendlyDiscount;
  const total = (friendlyDiscount > 0 || crowdfundingDiscount > 0) ? Math.ceil(rawTotal / 50) * 50 : rawTotal;

  const downPercent = fundraisingEnabled ? 0.2 : 0.4;
  const rawDown = Math.round(total * downPercent);
  const downAmount = (friendlyDiscount > 0 || crowdfundingDiscount > 0) ? Math.ceil(rawDown / 50) * 50 : rawDown;

  // ── Build live column data (matches QuoteColumnData shape) ──
  const liveColumnData: QuoteColumnData = {
    label: allQuotes?.find((q) => q.id === activeQuoteId)?.label ?? 'Current',
    quoteId: activeQuoteId ?? '',
    buildActive,
    launchActive,
    isFundraising: fundraisingEnabled,
    buildBase,
    launchBase,
    fundBase: fundraisingBase,
    buildItems: buildResult?.items ?? [],
    launchItems: (launchResult?.items ?? []).filter((i) => !i.name.includes('Production Days')),
    fundItems: fundraisingResult?.items ?? [],
    overhead,
    hasAddOns: hasAnyAddOns,
    friendlyDiscountPct: showFriendlyDiscount ? friendlyDiscountPercent : 0,
    friendlyDiscount,
    crowdfundingEnabled,
    crowdDiscount: crowdfundingDiscount,
    total,
    downAmount,
    downPercent,
  };

  // ── Get column data for a given quote ID ──
  function getColumnData(quoteId: string): QuoteColumnData | null {
    if (quoteId === activeQuoteId) return liveColumnData;
    if (!allQuotes) return null;
    const quote = allQuotes.find((q) => q.id === quoteId);
    if (!quote) return null;
    return calcTotalFromQuote(quote, allAddOns);
  }

  const isComparing = showComparison && !!compareQuoteId;
  const compareData = compareQuoteId ? getColumnData(compareQuoteId) : null;

  return (
    <div>
    <div className="sticky top-[121px]">
      {/* Quote card */}
      <div className="border border-green-900 rounded-lg bg-green-950/25 p-6">
        {/* Receipt header with compare button */}
        <div className="border-b border-dashed border-green-900/60 py-4 mb-3 -mt-5 flex items-center justify-between">
          <h3 className="font-display text-2xl font-bold text-foreground">
            {isComparing ? 'Compare Quotes' : 'Quote'}
          </h3>
          {allQuotes && allQuotes.length > 1 && !showComparison && (
            <button
              ref={compareBtnRef}
              onClick={() => {
                const firstOther = allQuotes.find((q) => q.id !== activeQuoteId);
                if (firstOther) {
                  setCompareQuoteId(firstOther.id);
                  setShowComparison(true);
                }
              }}
              className="relative h-[32px] px-3 font-medium border border-green-500 bg-green-500 text-black rounded-lg overflow-hidden pointer-events-auto"
            >
              <div
                ref={compareFillRef}
                className="absolute inset-0 bg-black pointer-events-none"
                style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
              />
              <span className="relative flex items-center justify-center gap-1.5 whitespace-nowrap text-sm" style={{ zIndex: 10 }}>
                <motion.span
                  variants={iconVariants}
                  initial="hidden"
                  animate={compareHovered ? 'visible' : 'hidden'}
                  className="flex items-center"
                >
                  <Plus size={14} strokeWidth={2.5} />
                </motion.span>
                Compare
              </span>
            </button>
          )}
          {showComparison && (
            <button
              onClick={() => { setShowComparison(false); setCompareQuoteId(null); }}
              className="flex items-center gap-1.5 text-sm font-semibold text-white/40 hover:text-white/60 transition-colors pointer-events-auto"
            >
              <X size={16} />
              Close
            </button>
          )}
        </div>

        {isComparing && compareData ? (
          <>
            {/* Two-column comparison — dropdown is embedded in right column header */}
            <ComparisonGrid
              left={liveColumnData}
              right={compareData}
              rightHeader={
                allQuotes && allQuotes.filter((q) => q.id !== activeQuoteId).length > 1 ? (
                  <div ref={compareDropdownRef} className="relative w-full">
                    <button
                      onClick={() => setCompareDropdownOpen(!compareDropdownOpen)}
                      className="w-full border border-green-600 text-white font-semibold rounded-md pl-3 pr-10 text-sm outline-none focus:border-green-400 transition-colors cursor-pointer h-[34px] bg-green-800 text-left flex items-center justify-between"
                    >
                      <span>{allQuotes?.find((q) => q.id === compareQuoteId)?.label || 'Select quote'}</span>
                      <ChevronDown size={16} className={`transition-transform duration-200 ${compareDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {compareDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 mt-2 border border-green-600 rounded-md bg-green-900 shadow-lg z-50"
                        >
                          <div className="py-1">
                            {allQuotes?.filter((q) => q.id !== activeQuoteId).map((q) => (
                              <button
                                key={q.id}
                                onClick={() => {
                                  setCompareQuoteId(q.id);
                                  setCompareDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm font-semibold transition-colors ${
                                  compareQuoteId === q.id
                                    ? 'bg-green-700 text-white'
                                    : 'text-white/80 hover:bg-green-800 hover:text-white'
                                }`}
                              >
                                {q.label}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : undefined
              }
            />

            {/* Total + Payment - comparison mode with two columns */}
            {(() => {
              const leftTotal = liveColumnData.total;
              const rightTotal = compareData.total;
              return (
                <div className="border-t border-b border-green-900 bg-green-950/30 py-4 mb-6 -mx-6 px-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-baseline mb-2 pb-2 border-b border-dashed border-green-900/60">
                        <span className="font-display font-bold text-foreground text-base">Total</span>
                        <span className="font-display text-xl font-bold text-foreground">{formatPrice(leftTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-semibold text-green-400 block">{liveColumnData.isFundraising ? '20%' : '40%'} due at signing</span>
                          <p className="text-xs text-muted-foreground mt-0.5">Minimum to begin</p>
                        </div>
                        <span className="font-display font-bold text-2xl text-green-400">{formatPrice(liveColumnData.downAmount)}</span>
                      </div>
                    </div>
                    <div className="border-l border-green-900/50 pl-4">
                      <div className="flex justify-between items-baseline mb-2 pb-2 border-b border-dashed border-green-900/60">
                        <span className="font-display font-bold text-foreground text-base">Total</span>
                        <span className="font-display text-xl font-bold text-foreground">{formatPrice(rightTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-semibold text-green-400 block">{compareData.isFundraising ? '20%' : '40%'} due at signing</span>
                          <p className="text-xs text-muted-foreground mt-0.5">Minimum to begin</p>
                        </div>
                        <span className="font-display font-bold text-2xl text-green-400">{formatPrice(compareData.downAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        ) : (
          <>
        {/* Single column — standard line items with FNA diff colors when on user quote */}
        {(() => {
          // Always compare against the recommended (first FNA) quote, unless we ARE the recommended quote
          const recommendedQuote = allQuotes?.find((q) => q.is_fna_quote);
          const isRecommended = recommendedQuote?.id === activeQuoteId;
          const fnaRef = !isRecommended ? recommendedQuote : undefined;
          const fnaData = fnaRef ? calcTotalFromQuote(fnaRef, allAddOns) : null;
          const fnaBuildNames = new Set((fnaData?.buildItems ?? []).map(i => i.name));
          const fnaLaunchNames = new Set((fnaData?.launchItems ?? []).map(i => i.name));
          const fnaFundNames = new Set((fnaData?.fundItems ?? []).map(i => i.name));

          function itemColor(name: string, nameSet: Set<string>): string {
            if (isRecommended) return 'text-white/25';
            if (!fnaData) return 'text-foreground';
            return nameSet.has(name) ? 'text-foreground' : 'text-cyan-400';
          }

          const userBuildItems = buildResult?.items ?? [];
          const userLaunchItems = (launchResult?.items ?? []).filter(i => !i.name.includes('Production Days'));
          const userFundItems = fundraisingResult?.items ?? [];

          return (
            <div className="space-y-2 mb-4 font-mono text-sm">
              {/* Build section */}
              {buildActive && !fundraisingEnabled && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Build base</span>
                    <span className={isRecommended ? 'text-white/25' : 'text-foreground'}>{formatPrice(buildBase)}</span>
                  </div>
                  {userBuildItems.map((item) => (
                    <div key={item.name} className="flex justify-between">
                      <span className={`leading-tight mr-2 ${itemColor(item.name, fnaBuildNames) === 'text-cyan-400' ? 'text-cyan-400/80' : 'text-muted-foreground'}`}>{item.name}</span>
                      <span className={`flex-shrink-0 ${itemColor(item.name, fnaBuildNames)}`}>{formatPrice(item.price)}</span>
                    </div>
                  ))}
                </>
              )}

              {/* Divider between tiers */}
              {buildActive && launchActive && !fundraisingEnabled && (
                <div className="h-px bg-green-900/50 my-1" />
              )}

              {/* Launch section */}
              {launchActive && !fundraisingEnabled && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Launch base</span>
                    <span className={isRecommended ? 'text-white/25' : 'text-foreground'}>{formatPrice(launchBase)}</span>
                  </div>
                  {userLaunchItems.map((item) => (
                    <div key={item.name} className="flex justify-between">
                      <span className={`leading-tight mr-2 ${itemColor(item.name, fnaLaunchNames) === 'text-cyan-400' ? 'text-cyan-400/80' : 'text-muted-foreground'}`}>{item.name}</span>
                      <span className={`flex-shrink-0 ${itemColor(item.name, fnaLaunchNames)}`}>{formatPrice(item.price)}</span>
                    </div>
                  ))}
                </>
              )}

              {/* Fundraising section */}
              {fundraisingEnabled && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fundraising base</span>
                    <span className={isRecommended ? 'text-white/25' : 'text-foreground'}>{formatPrice(fundraisingBase)}</span>
                  </div>
                  {userFundItems.map((item) => (
                    <div key={item.name} className="flex justify-between">
                      <span className={`leading-tight mr-2 ${itemColor(item.name, fnaFundNames) === 'text-cyan-400' ? 'text-cyan-400/80' : 'text-muted-foreground'}`}>{item.name}</span>
                      <span className={`flex-shrink-0 ${itemColor(item.name, fnaFundNames)}`}>{formatPrice(item.price)}</span>
                    </div>
                  ))}
                </>
              )}

              {/* Overhead */}
              <div className="h-px bg-green-900/50 my-1" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Overhead (10%)</span>
                {hasAnyAddOns ? (
                  <span className={isRecommended ? 'text-white/25' : 'text-foreground'}>{formatPrice(overhead)}</span>
                ) : (
                  <span className="text-muted-foreground/60">Waived</span>
                )}
              </div>

              {/* Deferred payment fee */}
              {crowdfundingEnabled && deferPayment && deferredFeePercent > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deferred payment (+{deferredFeePercent}%)</span>
                  <span className={isRecommended ? 'text-white/25' : 'text-foreground'}>+{formatPrice(deferredFee)}</span>
                </div>
              )}

              {/* Crowdfunding discount */}
              {crowdfundingEnabled && crowdfundingTierDiscounts[crowdfundingTierIndex] > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-600">Crowdfunding ({crowdfundingTierDiscounts[crowdfundingTierIndex]}% off)</span>
                  <span className="text-green-600">-{formatPrice(crowdfundingDiscount)}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Total + Payment */}
        <div className={`border-t border-b border-green-900 bg-green-950/30 py-4 -mx-6 px-6 ${crowdfundingEnabled || fundraisingEnabled ? 'mb-6' : ''}`}>
          <div className="flex justify-between items-baseline mb-3 pb-3 border-b border-dashed border-green-900/60">
            <span className="font-display font-bold text-foreground">Total</span>
            <span className="font-display text-xl font-bold text-foreground transition-all duration-300">
              {formatPrice(total)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <span className="font-semibold text-green-400 block">{fundraisingEnabled ? '20%' : '40%'} due at signing</span>
              <span className="text-sm text-muted-foreground block mt-1">Minimum payment to begin</span>
            </div>
            <span className="font-display font-bold text-2xl text-green-400">{formatPrice(downAmount)}</span>
          </div>
        </div>
          </>
        )}

        {/* Special program checkboxes */}
        <div className="space-y-3">
          {!fundraisingEnabled && crowdfundingApproved && (
            <ProgramCheckbox
              label="Crowdfunding"
              description="Discounts and deferred payment options"
              enabled={crowdfundingEnabled}
              onToggle={onCrowdfundingToggle}
            />
          )}
        </div>

        {/* Fundraising terms */}
        {fundraisingEnabled && (
          <div className="mt-3 p-4 rounded-lg bg-muted/20 border border-border space-y-2">
            <p className="text-base font-semibold text-foreground">Pay up front, or after you raise.</p>
            <p className="text-sm text-muted-foreground">Minimum 20% due at signing, the rest due on delivery. Or, pay the rest after you raise.</p>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              <span className="font-semibold">Any amount unpaid at the time of delivery pre-raise is billed at 2x post-raise to help cover our risk.</span> Travel outside Silicon Valley billed at 2x (flights, hotel, rental car, per diem). Travel fees due on final delivery regardless of fee structure. A maximum fee of 50% of the total will be due after 1 year if no funds have yet been raised.
            </p>
          </div>
        )}

        {/* Crowdfunding slider and deferred payment (below estimate when enabled) */}
        {crowdfundingEnabled && (
          <div className="mt-3 space-y-3">
            <DeferredPaymentCheckbox
              deferPayment={deferPayment}
              onToggle={() => { if (onInteraction?.()) return; setDeferPayment(!deferPayment); }}
            />
            <CrowdfundingSlider
              tierIndex={crowdfundingTierIndex}
              onTierChange={(i) => { if (onInteraction?.()) return; onCrowdfundingTierChange(i); }}
            />
          </div>
        )}

        {!isReadOnly && !hideSaveQuote && (
          <div className="flex flex-col xl:flex-row gap-3 mt-6">
            <SaveQuoteButton
              onSave={onSave ?? (() => setShowModal(true))}
              saving={saving}
              saved={saved}
            />
            {!hideGetStarted && <GetStartedButton />}
          </div>
        )}
      </div>

      {/* Collapsible Discounts section — outside the green card */}
      {showFriendlyDiscount && (
        <div className="mt-3 rounded-lg border border-green-900 overflow-hidden">
          <button
            onClick={() => setDiscountsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-3 bg-green-950/30 text-left hover:bg-green-950/50 transition-colors"
          >
            <span className="font-display text-sm font-semibold text-foreground">
              Discounts
              {friendlyDiscountPercent > 0 && (
                <span className="ml-2 text-green-400">({friendlyDiscountPercent}% off)</span>
              )}
            </span>
            <ChevronDown
              size={16}
              className={`text-white/40 transition-transform duration-200 ${discountsOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {discountsOpen && (
            <div className="relative bg-green-950/20 px-5 pb-5 pt-3">
              {isLocked && <div className="absolute inset-0 z-10" style={{ cursor: 'not-allowed' }} />}
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={friendlyDiscountPercent}
                readOnly={!!isLocked}
                onChange={isLocked ? undefined : (e) => { if (onInteraction?.()) return; const v = Number(e.target.value); setFriendlyDiscountPercent(v); onFriendlyDiscountChange?.(v); }}
                className={`w-full h-2 bg-border rounded-lg appearance-none ${isLocked ? 'pointer-events-none' : 'cursor-pointer'}
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer ${
                  friendlyDiscountPercent > 0
                    ? '[&::-webkit-slider-thumb]:bg-green-600 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(22,163,74,0.4)] [&::-moz-range-thumb]:bg-green-600'
                    : '[&::-webkit-slider-thumb]:bg-muted-foreground [&::-moz-range-thumb]:bg-muted-foreground'
                }`}
              />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>0%</span><span>5%</span><span>10%</span><span>15%</span><span>20%</span>
              </div>
              <div className="text-center mt-2">
                <span className={`text-lg font-bold transition-colors duration-200 ${
                  friendlyDiscountPercent > 0 ? 'text-green-400' : 'text-muted-foreground'
                }`}>{friendlyDiscountPercent}% friendly discount</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quote PDF modal */}
      <AnimatePresence>
        {showModal && (
          <QuoteModal
            key="quote-modal"
            quoteData={buildQuoteData({
              buildActive, launchActive, fundraisingEnabled,
              buildBase, launchBase, fundraisingBase,
              buildResult, launchResult, fundraisingResult,
              overhead, overheadWaived: !hasAnyAddOns,
              deferredFee, deferPayment,
              crowdfundingEnabled, crowdfundingTierIndex,
              crowdfundingDiscount,
              crowdfundingTierDiscounts,
              friendlyDiscount, friendlyDiscountPercent,
              showFriendlyDiscount,
              total, downPercent, downAmount,
            })}
            prefillData={prefillData}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

// ── Quote data builder ────────────────────────────────────────────────────

function buildQuoteData(p: {
  buildActive: boolean;
  launchActive: boolean;
  fundraisingEnabled: boolean;
  buildBase: number;
  launchBase: number;
  fundraisingBase: number;
  buildResult: { items: { name: string; price: number }[] } | null;
  launchResult: { items: { name: string; price: number }[] } | null;
  fundraisingResult: { items: { name: string; price: number }[] } | null;
  overhead: number;
  overheadWaived: boolean;
  deferredFee: number;
  deferPayment: boolean;
  crowdfundingEnabled: boolean;
  crowdfundingTierIndex: number;
  crowdfundingDiscount: number;
  crowdfundingTierDiscounts: number[];
  friendlyDiscount: number;
  friendlyDiscountPercent: number;
  showFriendlyDiscount: boolean;
  total: number;
  downPercent: number;
  downAmount: number;
}): QuoteData {
  const tier = p.fundraisingEnabled
    ? 'Fundraising'
    : p.buildActive && p.launchActive
    ? 'Build + Launch'
    : p.buildActive
    ? 'Build'
    : 'Launch';

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    date,
    tier,
    buildItems: p.buildResult?.items ?? [],
    launchItems: (p.launchResult?.items ?? []).filter((i) => !i.name.includes('Production Days')),
    fundraisingItems: p.fundraisingResult?.items ?? [],
    buildBase: p.buildBase,
    launchBase: p.launchBase,
    fundraisingBase: p.fundraisingBase,
    overhead: p.overhead,
    overheadWaived: p.overheadWaived,
    deferredFee: p.deferredFee,
    crowdfundingDiscount: p.crowdfundingDiscount,
    crowdfundingPercent: p.crowdfundingEnabled
      ? p.crowdfundingTierDiscounts[p.crowdfundingTierIndex]
      : 0,
    friendlyDiscount: p.showFriendlyDiscount ? p.friendlyDiscount : 0,
    friendlyDiscountPercent: p.showFriendlyDiscount ? p.friendlyDiscountPercent : 0,
    total: p.total,
    downPercent: p.downPercent * 100,
    downAmount: p.downAmount,
    specialProgram: p.crowdfundingEnabled
      ? 'crowdfunding'
      : p.fundraisingEnabled
      ? 'fundraising'
      : null,
    deferPayment: p.deferPayment,
  };
}
