'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Save, Loader2, Check } from 'lucide-react';
import { getCalApi } from '@calcom/embed-react';
import { AddOn } from '@/types/pricing';
import { QuoteModal } from './QuoteModal';
import type { QuoteData } from '@/lib/pdf/types';
import type { LeadData } from '@/lib/pricing/leadCookie';

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
  comparisonData?: {
    selectedAddOns: Map<string, number>;
    sliderValues: Map<string, number>;
    tierSelections: Map<string, 'basic' | 'premium'>;
    locationDays: Map<string, number[]>;
    photoCount: number;
    crowdfundingEnabled: boolean;
    crowdfundingTierIndex: number;
    fundraisingEnabled: boolean;
    friendly_discount_pct?: number;
  };
  isLocked?: boolean;
  initialFriendlyDiscountPct?: number;
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
  comparisonData,
  isLocked,
  initialFriendlyDiscountPct,
}: CalculatorSummaryProps) {
  const [deferPayment, setDeferPayment] = useState(false);
  const [friendlyDiscountPercent, setFriendlyDiscountPercent] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Seed friendly discount from the recommended quote whenever the tab switches.
  // - Locked (Recommended) tab: fires when isLocked transitions false→true (or on mount if initially locked)
  // - Compare (Adjust) tab: fires when comparisonData transitions undefined→defined
  // Both cases use the same recommended value so the user always starts from the correct baseline.
  const prevHadComparisonData = useRef(false);
  const prevWasLocked = useRef(false);
  useEffect(() => {
    if (comparisonData && !prevHadComparisonData.current) {
      setFriendlyDiscountPercent(comparisonData.friendly_discount_pct ?? 0);
    }
    prevHadComparisonData.current = !!comparisonData;
  }, [comparisonData]);
  useEffect(() => {
    if (isLocked && !prevWasLocked.current && initialFriendlyDiscountPct !== undefined) {
      setFriendlyDiscountPercent(initialFriendlyDiscountPct);
    }
    prevWasLocked.current = !!isLocked;
  }, [isLocked, initialFriendlyDiscountPct]);

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

  // Deferred payment fee: 10% for 0% tier, 5% for others (calculated on subtotal + overhead, BEFORE crowdfunding discount)
  const deferredFeePercent = crowdfundingEnabled && deferPayment
    ? (crowdfundingTierIndex === 0 ? 10 : 5)
    : 0;
  const deferredFee = Math.round(subtotalWithOverhead * (deferredFeePercent / 100));

  // Apply deferred fee to subtotal before crowdfunding discount
  const subtotalWithFee = subtotalWithOverhead + deferredFee;

  // Discountable total = everything EXCEPT Cast + Crew add-ons
  const discountableTotal = subtotalWithFee - totalCastCrew;

  // Crowdfunding tiers: 0%, 10%, 20%, 30% off — applied to everything except CAST + CREW
  const crowdfundingTierDiscounts = [0, 10, 20, 30];
  const crowdfundingDiscount = crowdfundingEnabled
    ? Math.round(discountableTotal * (crowdfundingTierDiscounts[crowdfundingTierIndex] / 100))
    : 0;

  // Friendly discount: only when NOT crowdfunding and NOT fundraising — applied to everything except CAST + CREW
  const showFriendlyDiscount = !crowdfundingEnabled && !fundraisingEnabled;
  const friendlyDiscount = showFriendlyDiscount
    ? Math.round(discountableTotal * (friendlyDiscountPercent / 100))
    : 0;

  const rawTotal = subtotalWithFee - crowdfundingDiscount - friendlyDiscount;
  const total = (friendlyDiscount > 0 || crowdfundingDiscount > 0) ? Math.ceil(rawTotal / 50) * 50 : rawTotal;

  // Payment terms: Always 40% due at signing (or 20% for fundraising), regardless of deferred payment
  const downPercent = fundraisingEnabled ? 0.2 : 0.4;
  const rawDown = Math.round(total * downPercent);
  const downAmount = (friendlyDiscount > 0 || crowdfundingDiscount > 0) ? Math.ceil(rawDown / 50) * 50 : rawDown;

  // ── Comparison / recommended totals ──────────────────────────────────────
  const recBuildResult = comparisonData
    ? (buildActive && !comparisonData.fundraisingEnabled
      ? calcTierTotal(buildAddOns, comparisonData.selectedAddOns, comparisonData.sliderValues, 1, comparisonData.photoCount, comparisonData.tierSelections)
      : null)
    : null;
  const recLaunchResult = comparisonData
    ? (launchActive && !comparisonData.fundraisingEnabled
      ? calcTierTotal(launchAddOnsFiltered, comparisonData.selectedAddOns, comparisonData.sliderValues, totalDays, comparisonData.photoCount, comparisonData.tierSelections, comparisonData.locationDays)
      : null)
    : null;
  const recFundraisingResult = comparisonData?.fundraisingEnabled
    ? calcTierTotal(fundraisingAddOnsList, comparisonData.selectedAddOns, comparisonData.sliderValues, 1, comparisonData.photoCount, comparisonData.tierSelections)
    : null;

  const recBuildAddOnTotal = recBuildResult?.total ?? 0;
  const recLaunchAddOnTotal = recLaunchResult?.total ?? 0;
  const recFundraisingAddOnTotal = recFundraisingResult?.total ?? 0;
  const recAllAddOnTotal = recBuildAddOnTotal + recLaunchAddOnTotal + recFundraisingAddOnTotal;
  const recTotalCastCrew = recLaunchResult?.castCrewTotal ?? 0;

  const recBaseTotal = comparisonData?.fundraisingEnabled ? 15000 : (buildBase + launchBase);
  const recSubtotal = recBaseTotal + recAllAddOnTotal;
  const recHasAnyAddOns = recAllAddOnTotal > 0;
  const recOverhead = recHasAnyAddOns ? Math.round(recSubtotal * 0.1) : 0;
  const recSubtotalWithOverhead = recSubtotal + recOverhead;

  const recCrowdfundingTierDiscounts = [0, 10, 20, 30];
  const recCrowdfundingDiscount = comparisonData?.crowdfundingEnabled
    ? Math.round((recSubtotalWithOverhead - recTotalCastCrew) * (recCrowdfundingTierDiscounts[comparisonData.crowdfundingTierIndex] / 100))
    : 0;

  const recFriendlyDiscountPct = comparisonData?.friendly_discount_pct ?? 0;
  const recFriendlyDiscount = recFriendlyDiscountPct > 0
    ? Math.round((recSubtotalWithOverhead - recTotalCastCrew - recCrowdfundingDiscount) * (recFriendlyDiscountPct / 100))
    : 0;

  const recRawTotal = recSubtotalWithOverhead - recCrowdfundingDiscount - recFriendlyDiscount;
  const recHasDiscount = recCrowdfundingDiscount > 0 || recFriendlyDiscount > 0;
  const recTotal = recHasDiscount ? Math.ceil(recRawTotal / 50) * 50 : recRawTotal;

  // Recommended payment terms
  const recDownPercent = comparisonData?.fundraisingEnabled ? 0.2 : 0.4;
  const recRawDown = Math.round(recTotal * recDownPercent);
  const recDownAmount = recHasDiscount ? Math.ceil(recRawDown / 50) * 50 : recRawDown;

  // Merged item lists for aligned 3-column comparison
  const recBuildItems = comparisonData ? (recBuildResult?.items ?? []) : [];
  const adjBuildItems = comparisonData ? (buildResult?.items ?? []) : [];
  const adjBuildItemMap = new Map(adjBuildItems.map(i => [i.name, i]));
  const recBuildItemNames = new Set(recBuildItems.map(i => i.name));
  const adjBuildAddedItems = adjBuildItems.filter(i => !recBuildItemNames.has(i.name));

  const recLaunchItems = comparisonData
    ? (recLaunchResult?.items ?? []).filter(i => !i.name.includes('Production Days'))
    : [];
  const adjLaunchItems = comparisonData
    ? (launchResult?.items ?? []).filter(i => !i.name.includes('Production Days'))
    : [];
  const adjLaunchItemMap = new Map(adjLaunchItems.map(i => [i.name, i]));
  const recLaunchItemNames = new Set(recLaunchItems.map(i => i.name));
  const adjLaunchAddedItems = adjLaunchItems.filter(i => !recLaunchItemNames.has(i.name));

  const recFundraisingItems = comparisonData ? (recFundraisingResult?.items ?? []) : [];
  const adjFundraisingItems = comparisonData ? (fundraisingResult?.items ?? []) : [];
  const adjFundraisingItemMap = new Map(adjFundraisingItems.map(i => [i.name, i]));
  const recFundraisingItemNames = new Set(recFundraisingItems.map(i => i.name));
  const adjFundraisingAddedItems = adjFundraisingItems.filter(i => !recFundraisingItemNames.has(i.name));

  return (
    <div className={(isReadOnly || isLocked) ? "pointer-events-none" : ""}>
    <div className="sticky top-[121px]">
      {/* Quote card */}
      <div className="border border-green-900 rounded-lg bg-green-950/25 p-6">
        {/* Receipt header */}
        <div className="border-b border-dashed border-border pb-3 mb-4">
          <h3 className="font-display text-lg font-bold text-foreground text-center">
            Quote
          </h3>
        </div>

        {comparisonData ? (
          <>
            {/* Two-column comparison: Recommended | Adjusted */}
            <div className="grid grid-cols-2 gap-x-4 mb-4 font-mono text-sm">
              {/* Recommended column */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 pb-2 border-b border-white/5">Recommended</p>
                {buildActive && !comparisonData.fundraisingEnabled && (
                  <>
                    <div className="flex justify-between gap-1">
                      <span className="text-muted-foreground truncate">Build base</span>
                      <span className="text-foreground flex-shrink-0">{formatPrice(buildBase)}</span>
                    </div>
                    {recBuildItems.map((item) => (
                      <div key={item.name} className="flex justify-between gap-1">
                        <span className="text-muted-foreground truncate">{item.name}</span>
                        <span className="text-foreground flex-shrink-0">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                    {/* Spacers for added items in Adjusted column */}
                    {adjBuildAddedItems.map((item) => (
                      <div key={`spacer-${item.name}`} className="flex justify-between gap-1 invisible" aria-hidden>
                        <span className="truncate">{item.name}</span>
                        <span className="flex-shrink-0">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </>
                )}
                {buildActive && launchActive && !comparisonData.fundraisingEnabled && (
                  <div className="h-px bg-border/30 my-1" />
                )}
                {launchActive && !comparisonData.fundraisingEnabled && (
                  <>
                    <div className="flex justify-between gap-1">
                      <span className="text-muted-foreground truncate">Launch base</span>
                      <span className="text-foreground flex-shrink-0">{formatPrice(launchBase)}</span>
                    </div>
                    {recLaunchItems.map((item) => (
                      <div key={item.name} className="flex justify-between gap-1">
                        <span className="text-muted-foreground truncate">{item.name}</span>
                        <span className="text-foreground flex-shrink-0">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                    {/* Spacers for added items in Adjusted column */}
                    {adjLaunchAddedItems.map((item) => (
                      <div key={`spacer-${item.name}`} className="flex justify-between gap-1 invisible" aria-hidden>
                        <span className="truncate">{item.name}</span>
                        <span className="flex-shrink-0">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </>
                )}
                {comparisonData.fundraisingEnabled && (
                  <>
                    <div className="flex justify-between gap-1">
                      <span className="text-muted-foreground truncate">Fundraising base</span>
                      <span className="text-foreground flex-shrink-0">{formatPrice(15000)}</span>
                    </div>
                    {recFundraisingItems.map((item) => (
                      <div key={item.name} className="flex justify-between gap-1">
                        <span className="text-muted-foreground truncate">{item.name}</span>
                        <span className="text-foreground flex-shrink-0">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                    {/* Spacers for added items in Adjusted column */}
                    {adjFundraisingAddedItems.map((item) => (
                      <div key={`spacer-${item.name}`} className="flex justify-between gap-1 invisible" aria-hidden>
                        <span className="truncate">{item.name}</span>
                        <span className="flex-shrink-0">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </>
                )}
                <div className="h-px bg-border/30 my-1" />
                <div className="flex justify-between gap-1">
                  <span className="text-muted-foreground truncate">Overhead (10%)</span>
                  <span className="text-foreground flex-shrink-0">
                    {recHasAnyAddOns ? formatPrice(recOverhead) : <span className="text-muted-foreground/60">Waived</span>}
                  </span>
                </div>
                {/* Friendly discount — always render if either column has it */}
                {(recFriendlyDiscountPct > 0 || (showFriendlyDiscount && friendlyDiscountPercent > 0)) && (
                  recFriendlyDiscountPct > 0 ? (
                    <div className="flex justify-between gap-1">
                      <span className="text-green-600 truncate">Friendly discount</span>
                      <span className="text-green-600 flex-shrink-0">-{formatPrice(recFriendlyDiscount)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between gap-1 invisible" aria-hidden>
                      <span className="truncate">Friendly discount</span>
                      <span className="flex-shrink-0">—</span>
                    </div>
                  )
                )}
                {/* Crowdfunding — always render if either column has it */}
                {(comparisonData.crowdfundingEnabled && recCrowdfundingDiscount > 0) || (crowdfundingEnabled && crowdfundingDiscount > 0) ? (
                  comparisonData.crowdfundingEnabled && recCrowdfundingDiscount > 0 ? (
                    <div className="flex justify-between gap-1">
                      <span className="text-green-600 truncate">Crowdfunding</span>
                      <span className="text-green-600 flex-shrink-0">-{formatPrice(recCrowdfundingDiscount)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between gap-1 invisible" aria-hidden>
                      <span className="truncate">Crowdfunding</span>
                      <span className="flex-shrink-0">—</span>
                    </div>
                  )
                ) : null}
              </div>

              {/* Adjusted column */}
              <div className="border-l border-white/10 pl-4 space-y-1.5">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 pb-2 border-b border-white/5">Adjusted</p>
                {buildActive && !comparisonData.fundraisingEnabled && (
                  <>
                    <div className="flex justify-between gap-1">
                      <span className="text-muted-foreground truncate">Build base</span>
                      <span className="text-foreground flex-shrink-0">{formatPrice(buildBase)}</span>
                    </div>
                    {recBuildItems.map((item) => {
                      const adjItem = adjBuildItemMap.get(item.name);
                      return (
                        <div key={item.name} className="flex justify-between gap-1">
                          <span className={`truncate ${adjItem ? 'text-muted-foreground' : 'text-red-400/60'}`}>{item.name}</span>
                          <span className={`flex-shrink-0 ${adjItem ? 'text-foreground' : 'text-red-400/60'}`}>
                            {adjItem ? formatPrice(adjItem.price) : '$0'}
                          </span>
                        </div>
                      );
                    })}
                    {adjBuildAddedItems.map((item) => (
                      <div key={item.name} className="flex justify-between gap-1">
                        <span className="text-cyan-400/80 truncate">{item.name}</span>
                        <span className="text-cyan-400 flex-shrink-0">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </>
                )}
                {buildActive && launchActive && !comparisonData.fundraisingEnabled && (
                  <div className="h-px bg-border/30 my-1" />
                )}
                {launchActive && !comparisonData.fundraisingEnabled && (
                  <>
                    <div className="flex justify-between gap-1">
                      <span className="text-muted-foreground truncate">Launch base</span>
                      <span className="text-foreground flex-shrink-0">{formatPrice(launchBase)}</span>
                    </div>
                    {recLaunchItems.map((item) => {
                      const adjItem = adjLaunchItemMap.get(item.name);
                      return (
                        <div key={item.name} className="flex justify-between gap-1">
                          <span className={`truncate ${adjItem ? 'text-muted-foreground' : 'text-red-400/60'}`}>{item.name}</span>
                          <span className={`flex-shrink-0 ${adjItem ? 'text-foreground' : 'text-red-400/60'}`}>
                            {adjItem ? formatPrice(adjItem.price) : '$0'}
                          </span>
                        </div>
                      );
                    })}
                    {adjLaunchAddedItems.map((item) => (
                      <div key={item.name} className="flex justify-between gap-1">
                        <span className="text-cyan-400/80 truncate">{item.name}</span>
                        <span className="text-cyan-400 flex-shrink-0">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </>
                )}
                {comparisonData.fundraisingEnabled && (
                  <>
                    <div className="flex justify-between gap-1">
                      <span className="text-muted-foreground truncate">Fundraising base</span>
                      <span className="text-foreground flex-shrink-0">{formatPrice(fundraisingBase)}</span>
                    </div>
                    {recFundraisingItems.map((item) => {
                      const adjItem = adjFundraisingItemMap.get(item.name);
                      return (
                        <div key={item.name} className="flex justify-between gap-1">
                          <span className={`truncate ${adjItem ? 'text-muted-foreground' : 'text-red-400/60'}`}>{item.name}</span>
                          <span className={`flex-shrink-0 ${adjItem ? 'text-foreground' : 'text-red-400/60'}`}>
                            {adjItem ? formatPrice(adjItem.price) : '$0'}
                          </span>
                        </div>
                      );
                    })}
                    {adjFundraisingAddedItems.map((item) => (
                      <div key={item.name} className="flex justify-between gap-1">
                        <span className="text-cyan-400/80 truncate">{item.name}</span>
                        <span className="text-cyan-400 flex-shrink-0">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </>
                )}
                <div className="h-px bg-border/30 my-1" />
                <div className="flex justify-between gap-1">
                  <span className="text-muted-foreground truncate">Overhead (10%)</span>
                  <span className="text-foreground flex-shrink-0">
                    {hasAnyAddOns ? formatPrice(overhead) : <span className="text-muted-foreground/60">Waived</span>}
                  </span>
                </div>
                {/* Friendly discount — always render if either column has it */}
                {(recFriendlyDiscountPct > 0 || (showFriendlyDiscount && friendlyDiscountPercent > 0)) && (
                  showFriendlyDiscount && friendlyDiscountPercent > 0 ? (
                    <div className="flex justify-between gap-1">
                      <span className="text-green-600 truncate">Friendly discount</span>
                      <span className="text-green-600 flex-shrink-0">-{formatPrice(friendlyDiscount)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between gap-1 invisible" aria-hidden>
                      <span className="truncate">Friendly discount</span>
                      <span className="flex-shrink-0">—</span>
                    </div>
                  )
                )}
                {/* Crowdfunding — always render if either column has it */}
                {(comparisonData.crowdfundingEnabled && recCrowdfundingDiscount > 0) || (crowdfundingEnabled && crowdfundingDiscount > 0) ? (
                  crowdfundingEnabled && crowdfundingDiscount > 0 ? (
                    <div className="flex justify-between gap-1">
                      <span className="text-green-600 truncate">Crowdfunding</span>
                      <span className="text-green-600 flex-shrink-0">-{formatPrice(crowdfundingDiscount)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between gap-1 invisible" aria-hidden>
                      <span className="truncate">Crowdfunding</span>
                      <span className="flex-shrink-0">—</span>
                    </div>
                  )
                ) : null}
              </div>
            </div>

            {/* Total + Payment - comparison mode with two columns */}
            <div className="border-t border-b border-green-900 bg-green-950/30 py-4 mb-6 -mx-6 px-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-baseline mb-3 pb-3 border-b border-dashed border-border/50">
                    <span className="font-display font-bold text-foreground text-base">Recommended</span>
                    <span className="font-display text-xl font-bold text-foreground transition-all duration-300">
                      {formatPrice(recTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-green-400">{comparisonData?.fundraisingEnabled ? '20%' : '40%'} due at signing</span>
                    <span className="font-display font-bold text-2xl text-green-400">{formatPrice(recDownAmount)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Minimum payment to begin</p>
                </div>
                <div className="border-l border-white/10 pl-4">
                  <div className="flex justify-between items-baseline mb-3 pb-3 border-b border-dashed border-border/50">
                    <span className="font-display font-bold text-foreground text-base">Adjusted</span>
                    <span className="font-display text-xl font-bold text-foreground transition-all duration-300">
                      {formatPrice(total)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-green-400">{fundraisingEnabled ? '20%' : '40%'} due at signing</span>
                    <span className="font-display font-bold text-2xl text-green-400">{formatPrice(downAmount)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Minimum payment to begin</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
        <div className="space-y-2 mb-4 font-mono text-sm">
          {/* Build section */}
          {buildActive && !fundraisingEnabled && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Build base</span>
                <span className={isLocked ? 'text-white/25' : 'text-foreground'}>{formatPrice(buildBase)}</span>
              </div>
              {buildResult?.items.map((item) => (
                <div key={item.name} className="flex justify-between">
                  <span className="text-muted-foreground truncate mr-2">{item.name}</span>
                  <span className={`flex-shrink-0 ${isLocked ? 'text-white/25' : 'text-foreground'}`}>{formatPrice(item.price)}</span>
                </div>
              ))}
            </>
          )}

          {/* Divider between tiers */}
          {buildActive && launchActive && !fundraisingEnabled && (
            <div className="h-px bg-border/30 my-1" />
          )}

          {/* Launch section */}
          {launchActive && !fundraisingEnabled && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Launch base</span>
                <span className={isLocked ? 'text-white/25' : 'text-foreground'}>{formatPrice(launchBase)}</span>
              </div>
              {launchResult?.items
                .filter((item) => !item.name.includes('Production Days'))
                .map((item) => (
                  <div key={item.name} className="flex justify-between">
                    <span className="text-muted-foreground truncate mr-2">{item.name}</span>
                    <span className={`flex-shrink-0 ${isLocked ? 'text-white/25' : 'text-foreground'}`}>{formatPrice(item.price)}</span>
                  </div>
                ))}
            </>
          )}

          {/* Fundraising section */}
          {fundraisingEnabled && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fundraising base</span>
                <span className={isLocked ? 'text-white/25' : 'text-foreground'}>{formatPrice(fundraisingBase)}</span>
              </div>
              {fundraisingResult?.items.map((item) => (
                <div key={item.name} className="flex justify-between">
                  <span className="text-muted-foreground truncate mr-2">{item.name}</span>
                  <span className={`flex-shrink-0 ${isLocked ? 'text-white/25' : 'text-foreground'}`}>{formatPrice(item.price)}</span>
                </div>
              ))}
            </>
          )}

          {/* Overhead */}
          <div className="h-px bg-border/30 my-1" />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Overhead (10%)</span>
            {hasAnyAddOns ? (
              <span className={isLocked ? 'text-white/25' : 'text-foreground'}>{formatPrice(overhead)}</span>
            ) : (
              <span className="text-muted-foreground/60">Waived</span>
            )}
          </div>

          {/* Deferred payment fee (shown ABOVE crowdfunding discount) - NOT green */}
          {crowdfundingEnabled && deferPayment && deferredFeePercent > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deferred payment (+{deferredFeePercent}%)</span>
              <span className={isLocked ? 'text-white/25' : 'text-foreground'}>+{formatPrice(deferredFee)}</span>
            </div>
          )}

          {/* Crowdfunding discount */}
          {crowdfundingEnabled && crowdfundingTierDiscounts[crowdfundingTierIndex] > 0 && (
            <div className="flex justify-between">
              <span className="text-green-600">Crowdfunding ({crowdfundingTierDiscounts[crowdfundingTierIndex]}% off)</span>
              <span className="text-green-600">-{formatPrice(crowdfundingDiscount)}</span>
            </div>
          )}

          {/* Friendly discount */}
          {showFriendlyDiscount && friendlyDiscountPercent > 0 && (
            <div className="flex justify-between">
              <span className="text-green-600">Friendly discount ({friendlyDiscountPercent}% off)</span>
              <span className="text-green-600">-{formatPrice(friendlyDiscount)}</span>
            </div>
          )}
        </div>

        {/* Total + Payment - green top/bottom borders, full width with green background */}
        <div className="border-t border-b border-green-900 bg-green-950/30 py-4 mb-6 -mx-6 px-6">
          {/* Total row */}
          <div className="flex justify-between items-baseline mb-3 pb-3 border-b border-dashed border-border/50">
            <span className="font-display font-bold text-foreground">Total</span>
            <span className="font-display text-xl font-bold text-foreground transition-all duration-300">
              {formatPrice(total)}
            </span>
          </div>
          {/* Payment terms row */}
          <div className="flex justify-between items-center">
            <span className="font-semibold text-green-400">{fundraisingEnabled ? '20%' : '40%'} due at signing</span>
            <span className="font-display font-bold text-2xl text-green-400">{formatPrice(downAmount)}</span>
          </div>
          <span className="text-sm text-muted-foreground block mt-1">Minimum payment to begin</span>
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

        {/* Friendly discount - per-column in comparison mode, full-width otherwise */}
        {showFriendlyDiscount && (
          comparisonData ? (
            <div className="grid grid-cols-2 gap-4 mt-3">
              {/* Recommended column — read-only slider showing FNA-set discount */}
              <div className={`p-3 rounded-lg border transition-colors duration-200 cursor-not-allowed ${
                recFriendlyDiscountPct > 0 ? 'bg-green-950/30 border-green-600/40' : 'bg-muted/20 border-border'
              }`}>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={recFriendlyDiscountPct}
                  readOnly
                  className={`w-full h-2 bg-border rounded-lg appearance-none pointer-events-none
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:border-0 ${
                    recFriendlyDiscountPct > 0
                      ? '[&::-webkit-slider-thumb]:bg-green-600 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(22,163,74,0.4)] [&::-moz-range-thumb]:bg-green-600'
                      : '[&::-webkit-slider-thumb]:bg-muted-foreground [&::-moz-range-thumb]:bg-muted-foreground'
                  }`}
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>0%</span><span>5%</span><span>10%</span><span>15%</span><span>20%</span>
                </div>
                <div className="text-center mt-1">
                  <span className={`text-sm font-bold transition-colors duration-200 ${
                    recFriendlyDiscountPct > 0 ? 'text-green-600' : 'text-muted-foreground'
                  }`}>{recFriendlyDiscountPct}% friendly discount</span>
                </div>
              </div>
              {/* Adjusted column — interactive slider */}
              <div className={`p-3 rounded-lg border transition-colors duration-200 ${
                friendlyDiscountPercent > 0 ? 'bg-green-950/30 border-green-600/40' : 'bg-muted/20 border-border'
              }`}>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={friendlyDiscountPercent}
                  onChange={(e) => { if (onInteraction?.()) return; setFriendlyDiscountPercent(Number(e.target.value)); }}
                  className={`w-full h-2 bg-border rounded-lg appearance-none cursor-pointer
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
                <div className="text-center mt-1">
                  <span className={`text-sm font-bold transition-colors duration-200 ${
                    friendlyDiscountPercent > 0 ? 'text-green-600' : 'text-muted-foreground'
                  }`}>{friendlyDiscountPercent}% friendly discount</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={`mt-3 p-4 rounded-lg border transition-colors duration-200 ${isLocked ? 'cursor-not-allowed' : ''} ${
              friendlyDiscountPercent > 0
                ? 'bg-green-950/30 border-green-600/40'
                : 'bg-muted/20 border-border'
            }`}>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={friendlyDiscountPercent}
                readOnly={!!isLocked}
                onChange={isLocked ? undefined : (e) => { if (onInteraction?.()) return; setFriendlyDiscountPercent(Number(e.target.value)); }}
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
                  friendlyDiscountPercent > 0 ? 'text-green-600' : 'text-muted-foreground'
                }`}>{friendlyDiscountPercent}% friendly discount</span>
              </div>
            </div>
          )
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
