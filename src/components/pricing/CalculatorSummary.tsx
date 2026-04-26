'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Save, Loader2, Check, X, Plus, ChevronDown, Star, User, TrendingDown } from 'lucide-react';
import { useDirectionalFill } from '@/hooks/useDirectionalFill';
import { AddOn } from '@/types/pricing';
import { QuoteModal } from './QuoteModal';
import type { QuoteData } from '@/lib/pdf/types';
import type { LeadData } from '@/lib/pricing/leadCookie';
import type { ProposalQuoteRow } from '@/types/proposal';
import { calcTotalFromQuote, calcTierTotal, getFundraisingTiers, type QuoteColumnData } from '@/lib/pricing/calc';
export type { QuoteColumnData } from '@/lib/pricing/calc';
export { calcTotalFromQuote } from '@/lib/pricing/calc';

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
  fundraisingTierIndex: number;
  onFundraisingTierChange: (i: number) => void;
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
  crowdfundingDeferred?: boolean;
  hideCrowdfundingToggle?: boolean;
  isReadOnly?: boolean;
  isLocked?: boolean;
  initialFriendlyDiscountPct?: number;
  /** All quotes for dropdown comparison selectors (proposal context only) */
  allQuotes?: ProposalQuoteRow[];
  /** Which quote the live calculator state represents */
  activeQuoteId?: string;
  /** Admin-set flat dollar discount (not shown on pricing page) */
  additionalDiscount?: number;
  /** Called when admin changes the additional discount amount */
  onAdditionalDiscountChange?: (amount: number) => void;
  /** Hide the deferred payment option for crowdfunding */
  hideDeferredPayment?: boolean;
  /** Called whenever the user moves the friendly discount slider */
  onFriendlyDiscountChange?: (pct: number) => void;
  /** Called when user selects a different quote in the compare dropdown (syncs with tabs) */
  onActiveQuoteChange?: (quoteId: string) => void;
  /** Tailwind top offset class for sticky positioning (default: top-[121px] for proposal context) */
  stickyTop?: string;
}

function formatPrice(amount: number): string {
  return '$' + amount.toLocaleString('en-US');
}

// ── Balance label helper ─────────────────────────────────────────────────
function balanceLabel(opts: { crowdfunding: boolean; deferred: boolean; fundraising: boolean; remainingPercent: number }): React.ReactNode {
  const pct = `${opts.remainingPercent}%`;
  if (opts.fundraising) return <>{pct} due <u>after raise</u></>;
  if (opts.crowdfunding && opts.deferred) return <>{pct} due <u>after raise</u></>;
  if (opts.crowdfunding) return <>{pct} due <u>before launch</u></>;
  return `${pct} due upon delivery`;
}

// calcTotalFromQuote + QuoteColumnData are re-exported from '@/lib/pricing/calc' (see imports above)

// ── Crowdfunding Slider ──────────────────────────────────────────────────

function FundraisingPaymentSlider({
  tierIndex,
  onTierChange,
  tiers,
}: {
  tierIndex: number;
  onTierChange: (i: number) => void;
  tiers: ReturnType<typeof getFundraisingTiers>;
}) {
  const currentTier = tiers[tierIndex];
  const isActive = tierIndex > 0;
  return (
    <>
      <input
        type="range"
        min={0}
        max={4}
        step={1}
        value={tierIndex}
        onChange={(e) => onTierChange(Number(e.target.value))}
        className={`w-full h-2 bg-border rounded-lg appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer ${
          isActive
            ? '[&::-webkit-slider-thumb]:bg-[rgb(var(--qa))] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(var(--qa-glow),0.4)] [&::-moz-range-thumb]:bg-[rgb(var(--qa))]'
            : '[&::-webkit-slider-thumb]:bg-muted-foreground [&::-moz-range-thumb]:bg-muted-foreground'
        }`}
      />
      <div className="flex justify-between mt-1 text-xs text-muted-foreground px-1">
        <span>100%</span>
        <span>80%</span>
        <span>60%</span>
        <span>40%</span>
        <span>20%</span>
      </div>
      <div className="text-center mt-2">
        <span className={`text-lg font-bold transition-colors duration-200 ${
          isActive ? 'text-[rgb(var(--qa-text))]' : 'text-muted-foreground'
        }`}>Pay {currentTier.preRaise}% before the raise</span>
        <p className="text-xs text-muted-foreground">
          {currentTier.multiplier > 1
            ? `${currentTier.label} multiplier on post-raise balance`
            : 'No multiplier — pay in full before raise'}
        </p>
      </div>
    </>
  );
}

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
    <>
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
            ? '[&::-webkit-slider-thumb]:bg-[rgb(var(--qa))] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(var(--qa-glow),0.4)] [&::-moz-range-thumb]:bg-[rgb(var(--qa))]'
            : '[&::-webkit-slider-thumb]:bg-muted-foreground [&::-moz-range-thumb]:bg-muted-foreground'
        }`}
      />
      <div className="flex justify-between mt-1 text-xs text-muted-foreground px-1">
        <span>0%</span>
        <span>10%</span>
        <span>20%</span>
        <span>30%</span>
      </div>
      <div className="text-center mt-2">
        <span className={`text-lg font-bold transition-colors duration-200 ${
          isActive ? 'text-[rgb(var(--qa-text))]' : 'text-muted-foreground'
        }`}>{currentTier.discount}% crowdfunding discount</span>
        <p className="text-xs text-muted-foreground">
          {currentTier.percentage > 0 ? `for ${currentTier.percentage}% of your campaign raise` : currentTier.label}
        </p>
      </div>
    </>
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
  const borderColor = deferPayment ? 'border-[rgb(var(--qa)_/_0.4)]' : 'border-border';
  const bgColor = deferPayment ? 'bg-[rgb(var(--qa-muted)_/_0.25)]' : 'bg-muted/20 hover:bg-muted/30';
  const checkBorder = deferPayment ? 'border-[rgb(var(--qa))] bg-[rgb(var(--qa))]' : 'border-muted-foreground/40';

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 text-left ${borderColor} ${bgColor}`}
    >
      <div
        className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${checkBorder}`}
      >
        {deferPayment && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div>
        <span className="text-base font-semibold text-foreground block">
          Pay after the campaign
        </span>
        <span className="text-xs text-muted-foreground">
          Defer the balance owed until after launch
        </span>
      </div>
    </button>
  );
}

// ── Crowdfunding Toggle Checkbox ─────────────────────────────────────────────

function CrowdfundingToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  const borderColor = enabled ? 'border-[rgb(var(--qa)_/_0.4)]' : 'border-border';
  const bgColor = enabled ? 'bg-[rgb(var(--qa-muted)_/_0.25)]' : 'bg-muted/20 hover:bg-muted/30';
  const checkBorder = enabled ? 'border-[rgb(var(--qa))] bg-[rgb(var(--qa))]' : 'border-muted-foreground/40';

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 text-left ${borderColor} ${bgColor}`}
    >
      <div
        className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${checkBorder}`}
      >
        {enabled && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div>
        <span className="text-base font-semibold text-foreground block">Crowdfunding Campaign</span>
        <span className="text-xs text-muted-foreground">Discounts offered in exchange for % of raise</span>
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
  const buttonRef = useRef<HTMLAnchorElement>(null);
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
      <motion.a
        ref={buttonRef}
        href="/start"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative block w-full px-4 py-3 font-medium text-black bg-white border border-white rounded-lg overflow-hidden text-center"
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
            <Rocket size={18} strokeWidth={2} />
          </motion.span>
          Get Started
        </span>
      </motion.a>
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

function ComparisonGrid({ left, right, rightHeader, rightDimmed }: { left: QuoteColumnData; right: QuoteColumnData; rightHeader?: React.ReactNode; rightDimmed?: boolean }) {
  // Strip quantity/day suffixes so "Talent x4" and "Talent x3 days" match
  // Also normalize Premium/Basic variants to match as same item
  function baseName(name: string): string {
    return name
      .replace(/ x\d+(?:\.\d+)?(?:\s*(?:hrs|hours|days|d))?$/, '')
      .replace(/ \(D[\d,]+\)$/, '')
      .replace(/^(Premium|Basic)\s+/, '');
  }

  type Item = { name: string; price: number };
  type AlignedRow = { key: string; leftItem: Item | null; rightItem: Item | null };

  function renderTierPair(
    label: string,
    leftBase: number,
    rightBase: number,
    leftItems: Item[],
    rightItems: Item[],
  ) {
    // Build maps keyed by base name
    const rightByBase = new Map<string, Item>();
    for (const item of rightItems) rightByBase.set(baseName(item.name), item);
    const leftByBase = new Map<string, Item>();
    for (const item of leftItems) leftByBase.set(baseName(item.name), item);

    // Aligned rows: left order first, then right-only appended
    const rows: AlignedRow[] = [];
    const usedBases = new Set<string>();

    for (const item of leftItems) {
      const base = baseName(item.name);
      usedBases.add(base);
      rows.push({ key: base, leftItem: item, rightItem: rightByBase.get(base) ?? null });
    }
    for (const item of rightItems) {
      const base = baseName(item.name);
      if (!usedBases.has(base)) {
        usedBases.add(base);
        rows.push({ key: base, leftItem: null, rightItem: item });
      }
    }

    return { label, leftBase, rightBase, rows };
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
  const leftHasAdditional = left.additionalDiscount > 0;
  const rightHasAdditional = right.additionalDiscount > 0;
  const eitherHasAdditional = leftHasAdditional || rightHasAdditional;
  const leftHasCrowd = left.crowdfundingEnabled && left.crowdDiscount > 0;
  const rightHasCrowd = right.crowdfundingEnabled && right.crowdDiscount > 0;
  const eitherHasCrowd = leftHasCrowd || rightHasCrowd;

  return (
    <div className="grid grid-cols-2 gap-x-4 mb-4 font-mono text-sm">
      {/* Left column */}
      <div className="space-y-1.5">
        <div className="mb-3 pb-2 border-b border-green-900/40">
          <div className="w-full bg-green-900/20 border border-green-600/40 text-white font-semibold rounded-md px-3 text-sm flex items-center gap-2 h-[34px]">
            <Star size={14} className="fill-current flex-shrink-0" />
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
            {tier.rows.map((row) => (
              row.leftItem ? (
                <div key={row.key} className="flex justify-between gap-1">
                  <span className="text-muted-foreground truncate">{row.leftItem.name}</span>
                  <span className="text-foreground flex-shrink-0">{formatPrice(row.leftItem.price)}</span>
                </div>
              ) : (
                <div key={row.key} className="flex justify-between gap-1 invisible" aria-hidden>
                  <span className="truncate">{row.rightItem!.name}</span>
                  <span className="flex-shrink-0">{formatPrice(row.rightItem!.price)}</span>
                </div>
              )
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
        {eitherHasAdditional && (
          leftHasAdditional ? (
            <div className="flex justify-between gap-1">
              <span className="text-green-600 truncate">Additional discounts</span>
              <span className="text-green-600 flex-shrink-0">-{formatPrice(left.additionalDiscount)}</span>
            </div>
          ) : (
            <div className="flex justify-between gap-1 invisible" aria-hidden>
              <span className="truncate">Additional discounts</span>
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
      <div className="border-l border-green-900/50 pl-4">
        <div className="mb-3 pb-2 border-b border-green-900/40">
          {rightHeader ?? (
            <div className="w-full bg-green-900/20 border border-green-600/40 text-white font-semibold rounded-md px-3 text-sm flex items-center gap-2 h-[34px]">
              <User size={14} className="flex-shrink-0" />
              {right.label}
            </div>
          )}
        </div>
        <div className={`space-y-1.5 transition-opacity duration-150 ${rightDimmed ? 'opacity-30' : 'opacity-100'}`}>
        {tiers.map((tier, ti) => (
          <Fragment key={tier.label}>
            {ti > 0 && <div className="h-px bg-green-900/50 my-1" />}
            <div className="flex justify-between gap-1">
              <span className="text-muted-foreground truncate">{tier.label} base</span>
              <span className="text-foreground flex-shrink-0">{formatPrice(tier.rightBase)}</span>
            </div>
            {tier.rows.map((row) => {
              const { leftItem, rightItem } = row;
              // Right-only (added)
              if (!leftItem && rightItem) {
                return (
                  <div key={row.key} className="flex justify-between gap-1">
                    <span className="text-cyan-400/80 truncate">{rightItem.name}</span>
                    <span className="text-cyan-400 flex-shrink-0">{formatPrice(rightItem.price)}</span>
                  </div>
                );
              }
              // Left-only (removed)
              if (leftItem && !rightItem) {
                return (
                  <div key={row.key} className="flex justify-between gap-1">
                    <span className="text-red-400/60 truncate">{leftItem.name}</span>
                    <span className="text-red-400/60 flex-shrink-0">$0</span>
                  </div>
                );
              }
              // Both exist — compare prices
              const rPrice = rightItem!.price;
              const lPrice = leftItem!.price;
              const color = rPrice < lPrice ? 'text-red-400/80' : rPrice > lPrice ? 'text-cyan-400' : 'text-foreground';
              const labelColor = rPrice < lPrice ? 'text-red-400/60' : rPrice > lPrice ? 'text-cyan-400/80' : 'text-muted-foreground';
              return (
                <div key={row.key} className="flex justify-between gap-1">
                  <span className={`truncate ${labelColor}`}>{rightItem!.name}</span>
                  <span className={`flex-shrink-0 ${color}`}>{formatPrice(rPrice)}</span>
                </div>
              );
            })}
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
        {eitherHasAdditional && (
          rightHasAdditional ? (
            <div className="flex justify-between gap-1">
              <span className="text-green-600 truncate">Additional discounts</span>
              <span className="text-green-600 flex-shrink-0">-{formatPrice(right.additionalDiscount)}</span>
            </div>
          ) : (
            <div className="flex justify-between gap-1 invisible" aria-hidden>
              <span className="truncate">Additional discounts</span>
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
  onCrowdfundingToggle: _onCrowdfundingToggle,
  crowdfundingTierIndex,
  onCrowdfundingTierChange,
  fundraisingEnabled,
  onFundraisingToggle: _onFundraisingToggle,
  fundraisingTierIndex,
  onFundraisingTierChange,
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
  crowdfundingDeferred,
  hideCrowdfundingToggle,
  isReadOnly,
  isLocked,
  initialFriendlyDiscountPct,
  additionalDiscount: additionalDiscountProp,
  onAdditionalDiscountChange,
  hideDeferredPayment,
  allQuotes,
  activeQuoteId,
  onFriendlyDiscountChange,
  onActiveQuoteChange,
  stickyTop = 'top-[121px]',
}: CalculatorSummaryProps) {
  const [deferPayment, setDeferPayment] = useState(false);
  const [friendlyDiscountPercent, setFriendlyDiscountPercent] = useState(initialFriendlyDiscountPct ?? 0);
  const [offerOpen, setOfferOpen] = useState(true);
  const [discountsOpen, setDiscountsOpen] = useState(
    (initialFriendlyDiscountPct ?? 0) > 0 || !!crowdfundingApproved || !!crowdfundingDeferred
  );
  const [showModal, setShowModal] = useState(false);

  // Seed friendly discount whenever the active quote changes (tab switch)
  useEffect(() => {
    if (initialFriendlyDiscountPct !== undefined) {
      setFriendlyDiscountPercent(initialFriendlyDiscountPct);
      if (initialFriendlyDiscountPct > 0 || crowdfundingApproved || crowdfundingDeferred) setDiscountsOpen(true);
    }
  }, [initialFriendlyDiscountPct, activeQuoteId, crowdfundingApproved, crowdfundingDeferred]);

  // ── Discount card GSAP animation ──
  const discountContentRef = useRef<HTMLDivElement>(null);
  const discountFirstRender = useRef(true);
  useEffect(() => {
    if (!discountContentRef.current) return;
    const el = discountContentRef.current;
    if (discountFirstRender.current) {
      discountFirstRender.current = false;
      el.style.height = discountsOpen ? 'auto' : '0px';
      el.style.opacity = discountsOpen ? '1' : '0';
      return;
    }
    if (discountsOpen) {
      const h = el.scrollHeight;
      gsap.fromTo(el, { height: 0, opacity: 0 }, { height: h, opacity: 1, duration: 0.3, ease: 'power2.out', onComplete: () => { el.style.height = 'auto'; } });
    } else {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.out' });
    }
  }, [discountsOpen]);

  // ── Offer card GSAP animation ──
  const offerContentRef = useRef<HTMLDivElement>(null);
  const offerFirstRender = useRef(true);
  useEffect(() => {
    if (!offerContentRef.current) return;
    const el = offerContentRef.current;
    if (offerFirstRender.current) {
      offerFirstRender.current = false;
      el.style.height = offerOpen ? 'auto' : '0px';
      el.style.opacity = offerOpen ? '1' : '0';
      return;
    }
    if (offerOpen) {
      const h = el.scrollHeight;
      gsap.fromTo(el, { height: 0, opacity: 0 }, { height: h, opacity: 1, duration: 0.3, ease: 'power2.out', onComplete: () => { el.style.height = 'auto'; } });
    } else {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.out' });
    }
  }, [offerOpen]);

  // ── Dropdown comparison state (proposal context only) ──
  const [showComparison, setShowComparison] = useState(false);
  const [compareDropdownOpen, setCompareDropdownOpen] = useState(false);

  // Auto-toggle compare: show when on a non-FNA quote, hide when on the FNA recommended one
  useEffect(() => {
    if (!activeQuoteId || !fnaQuote) return;
    setShowComparison(activeQuoteId !== fnaQuote.id);
  }, [activeQuoteId]);
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

  const buildPrepMultiplier = selectedAddOns.get('build-branding') ?? 1;
  const launchPostMultiplier = selectedAddOns.get('launch-post-production') ?? 1;
  const buildBase = buildActive ? 5000 * buildPrepMultiplier : 0;
  const launchBase = launchActive ? (5000 * launchPostMultiplier) + (totalDays * 5000) : 0;
  const fundraisingBase = fundraisingEnabled ? 10000 : 0;

  const buildAddOnTotal = buildResult?.total ?? 0;
  const launchAddOnTotal = launchResult?.total ?? 0;
  const fundraisingAddOnTotal = fundraisingResult?.total ?? 0;
  const allAddOnTotal = buildAddOnTotal + launchAddOnTotal + fundraisingAddOnTotal;
  const totalCastCrew = (launchResult?.castCrewTotal ?? 0);
  const totalPriority = (buildResult?.priorityTotal ?? 0) + (launchResult?.priorityTotal ?? 0) + (fundraisingResult?.priorityTotal ?? 0);
  const totalDueAtSigning = (buildResult?.dueAtSigningTotal ?? 0) + (launchResult?.dueAtSigningTotal ?? 0) + (fundraisingResult?.dueAtSigningTotal ?? 0);
  const hasFundAddOns = (fundraisingResult?.total ?? 0) > 0;
  const effectiveFundTiers = getFundraisingTiers(hasFundAddOns);

  const baseTotal = fundraisingEnabled ? fundraisingBase : (buildBase + launchBase);
  const subtotal = baseTotal + allAddOnTotal;
  const hasAnyAddOns = allAddOnTotal > 0;
  // Priority Scheduling + due-at-signing items are exempt from overhead
  const overheadBase = subtotal - totalPriority - totalDueAtSigning;
  const overheadAmount = Math.round(overheadBase * 0.1);
  const overhead = (hasAnyAddOns && overheadBase > baseTotal) ? overheadAmount : 0;

  const subtotalWithOverhead = subtotal + overhead;

  // When crowdfundingApproved is true at proposal level, force crowdfunding mode on
  const effectiveCrowdfundingEnabled = crowdfundingEnabled || !!crowdfundingApproved;

  // Deferred payment fee
  const deferredFeePercent = effectiveCrowdfundingEnabled && deferPayment
    ? (crowdfundingTierIndex === 0 ? 10 : 5)
    : 0;
  const deferredFee = Math.round(subtotalWithOverhead * (deferredFeePercent / 100));
  const subtotalWithFee = subtotalWithOverhead + deferredFee;

  const discountableTotal = subtotalWithFee - totalCastCrew - totalPriority;

  const crowdfundingTierDiscounts = [0, 10, 20, 30];
  const crowdfundingDiscount = effectiveCrowdfundingEnabled
    ? Math.round(discountableTotal * (crowdfundingTierDiscounts[crowdfundingTierIndex] / 100))
    : 0;

  const showFriendlyDiscount = !crowdfundingApproved && !crowdfundingEnabled && !fundraisingEnabled;
  const friendlyDiscount = showFriendlyDiscount
    ? Math.round(discountableTotal * (friendlyDiscountPercent / 100))
    : 0;

  const additionalDiscountAmount = additionalDiscountProp ?? 0;
  const rawTotal = subtotalWithFee - crowdfundingDiscount - friendlyDiscount - additionalDiscountAmount;
  const hasAnyDiscount = friendlyDiscount > 0 || crowdfundingDiscount > 0 || additionalDiscountAmount > 0;
  const total = hasAnyDiscount ? Math.ceil(rawTotal / 50) * 50 : rawTotal;

  const downPercent = fundraisingEnabled
    ? (fundraisingTierIndex === 4 ? 0.2 : 0.4)
    : (effectiveCrowdfundingEnabled && deferPayment) ? 0.6 : 0.4;
  // Due-at-signing items bypass the percentage split — added entirely to the down payment
  const splittableTotal = total - totalDueAtSigning;
  const rawDown = Math.round(splittableTotal * downPercent) + totalDueAtSigning;
  const downAmount = hasAnyDiscount ? Math.ceil(rawDown / 50) * 50 : rawDown;

  // ── Fundraising balance breakdown ──
  const fundTier = effectiveFundTiers[fundraisingTierIndex];
  const fundPreRaisePct = fundraisingEnabled ? fundTier.preRaise / 100 : 0;
  const fundDeliveryAmount = fundraisingEnabled ? Math.round(splittableTotal * Math.max(0, fundPreRaisePct - downPercent)) : 0;
  const fundPostRaiseBase = fundraisingEnabled ? splittableTotal - Math.round(splittableTotal * fundPreRaisePct) : 0;
  const fundPostRaiseAmount = Math.round(fundPostRaiseBase * (fundTier?.multiplier ?? 1));

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
    additionalDiscount: additionalDiscountAmount,
    total,
    downAmount,
    downPercent,
    deferPayment,
    fundraisingTierIndex,
    dueAtSigningTotal: totalDueAtSigning,
    fundDeliveryAmount,
    fundPostRaiseAmount,
  };

  // ── FNA (left) column — always locked to the first/recommended FNA quote ──
  const fnaQuote = allQuotes?.find((q) => q.is_fna_quote);
  const fnaColumnData = fnaQuote ? calcTotalFromQuote(fnaQuote, allAddOns) : null;
  // Dropdown lists all quotes except the locked-left FNA recommended one
  const otherQuotes = allQuotes?.filter((q) => q.id !== fnaQuote?.id && q.is_fna_quote) ?? [];

  const isComparing = showComparison && !!fnaColumnData;

  return (
    <div className="h-full">
    <div className={`sticky ${stickyTop}`}>
      {/* Collapsible Offer section — shown when fundraising enabled */}
      {fundraisingEnabled && (
        <div className="mb-4 rounded-lg border border-[rgb(var(--qa-muted))] overflow-hidden bg-[rgb(var(--qa-muted)_/_0.2)]">
          <button
            data-no-intercept
            onClick={() => setOfferOpen((o) => !o)}
            className="w-full flex items-center justify-between p-5 group"
            aria-expanded={offerOpen}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[rgb(var(--qa-muted))] flex items-center justify-center">
                <Star className="w-5 h-5 text-[rgb(var(--qa-text))]" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Offer</h3>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground transition-all duration-300 group-hover:text-[rgb(var(--qa-text))] group-hover:scale-110 ${offerOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <div ref={offerContentRef} className="overflow-hidden">
            <div className="relative px-5 pt-2 pb-5">
              {isLocked && <div className="absolute inset-0 z-10" style={{ cursor: 'not-allowed' }} />}
              <FundraisingPaymentSlider
                tierIndex={fundraisingTierIndex}
                onTierChange={(i) => { if (onInteraction?.()) return; onFundraisingTierChange(i); }}
                tiers={effectiveFundTiers}
              />
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Discounts section — above the quote card */}
      {!fundraisingEnabled && (
        <div className="mb-4 rounded-lg border border-[rgb(var(--qa-muted))] overflow-hidden bg-[rgb(var(--qa-muted)_/_0.2)]">
          <button
            data-no-intercept
            onClick={() => setDiscountsOpen((o) => !o)}
            className="w-full flex items-center justify-between p-5 group"
            aria-expanded={discountsOpen}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[rgb(var(--qa-muted))] flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-[rgb(var(--qa-text))]" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Discounts</h3>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground transition-all duration-300 group-hover:text-[rgb(var(--qa-text))] group-hover:scale-110 ${discountsOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <div ref={discountContentRef} className="overflow-hidden">
            <div className="relative px-5 pt-2 pb-5 space-y-4 touch-none">
              {isLocked && <div className="absolute inset-0 z-10" style={{ cursor: 'not-allowed' }} />}

              {/* Friendly discount slider — hidden when crowdfunding is active */}
              {!effectiveCrowdfundingEnabled && (
                <>
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
                        ? '[&::-webkit-slider-thumb]:bg-[rgb(var(--qa))] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(var(--qa-glow),0.4)] [&::-moz-range-thumb]:bg-[rgb(var(--qa))]'
                        : '[&::-webkit-slider-thumb]:bg-muted-foreground [&::-moz-range-thumb]:bg-muted-foreground'
                    }`}
                  />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground px-1">
                    <span>0%</span><span>5%</span><span>10%</span><span>15%</span><span>20%</span>
                  </div>
                  <div className="text-center mt-2">
                    <span className={`text-lg font-bold transition-colors duration-200 ${
                      friendlyDiscountPercent > 0 ? 'text-[rgb(var(--qa-text))]' : 'text-muted-foreground'
                    }`}>{friendlyDiscountPercent}% friendly discount</span>
                  </div>
                </>
              )}

              {/* Crowdfunding slider — shown when crowdfunding is active */}
              {effectiveCrowdfundingEnabled && (
                <CrowdfundingSlider
                  tierIndex={crowdfundingTierIndex}
                  onTierChange={(i) => { if (onInteraction?.()) return; onCrowdfundingTierChange(i); }}
                />
              )}

              {/* Crowdfunding toggle checkbox — hidden on start form and proposals */}
              {!crowdfundingApproved && !hideCrowdfundingToggle && (
                <CrowdfundingToggle
                  enabled={crowdfundingEnabled}
                  onToggle={() => { if (onInteraction?.()) return; _onCrowdfundingToggle(); }}
                />
              )}

              {/* Deferred payment — shown when crowdfunding is active and not hidden */}
              {effectiveCrowdfundingEnabled && !hideDeferredPayment && (
                <DeferredPaymentCheckbox
                  deferPayment={deferPayment}
                  onToggle={() => { if (onInteraction?.()) return; setDeferPayment(!deferPayment); }}
                />
              )}

              {/* Additional discount — admin-only flat $ amount */}
              {onAdditionalDiscountChange && (
                <div className="pt-2 border-t border-[rgb(var(--qa-muted))]/40">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Additional Discount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">$</span>
                    <input
                      type="number"
                      key={`addl-discount-${activeQuoteId}`}
                      defaultValue={additionalDiscountAmount || ''}
                      onBlur={(e) => { const v = parseInt(e.target.value) || 0; onAdditionalDiscountChange(v); }}
                      placeholder="0"
                      min={0}
                      step={50}
                      className="w-full pl-7 pr-3 py-2 bg-muted/20 border border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:border-[rgb(var(--qa))] transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quote card */}
      <div data-no-intercept className="border border-green-900 rounded-lg bg-green-950/25 px-6 pt-6 pb-0">
        {/* Receipt header with compare button */}
        <div className="border-b border-dashed border-green-900/60 py-4 mb-3 -mt-5 flex items-center justify-between">
          <h3 className="font-display text-2xl font-bold text-foreground">
            {isComparing ? 'Compare Quotes' : 'Quote'}
          </h3>
          {otherQuotes.length > 0 && fnaColumnData && !showComparison && (
            <button
              ref={compareBtnRef}
              onClick={() => {
                // If currently on the FNA recommended quote, auto-switch to the first other quote
                if (activeQuoteId === fnaQuote?.id && otherQuotes.length > 0) {
                  onActiveQuoteChange?.(otherQuotes[0].id);
                }
                setShowComparison(true);
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
              onClick={() => { if (fnaQuote) onActiveQuoteChange?.(fnaQuote.id); }}
              className="flex items-center gap-1.5 text-sm font-semibold text-white/40 hover:text-white/60 transition-colors pointer-events-auto"
            >
              <X size={16} />
              Close
            </button>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
        {isComparing && fnaColumnData ? (
          <motion.div key="compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
            {/* Backdrop when dropdown is open */}
            <AnimatePresence>
              {compareDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-40"
                  onClick={() => setCompareDropdownOpen(false)}
                />
              )}
            </AnimatePresence>

            {/* Two-column comparison: left=FNA (locked), right=active quote (synced with tabs) */}
            <div className="relative">
              <ComparisonGrid
                left={fnaColumnData}
                right={liveColumnData}
                rightDimmed={compareDropdownOpen}
                rightHeader={
                otherQuotes.length > 0 ? (
                  <div ref={compareDropdownRef} className="relative w-full">
                    <button
                      onClick={() => setCompareDropdownOpen(!compareDropdownOpen)}
                      className="w-full border border-green-600 text-white font-semibold rounded-md pl-3 pr-3 text-sm outline-none focus:border-green-400 transition-colors cursor-pointer h-[34px] bg-green-800 text-left flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        {allQuotes?.find((q) => q.id === activeQuoteId)?.is_fna_quote
                          ? <Star size={14} className="flex-shrink-0" />
                          : <User size={14} className="flex-shrink-0" />
                        }
                        {allQuotes?.find((q) => q.id === activeQuoteId)?.label ?? 'Current'}
                      </span>
                      <ChevronDown size={16} className={`transition-transform duration-200 flex-shrink-0 ${compareDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {compareDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 mt-1 border border-green-600 rounded-md bg-green-950 shadow-lg z-50 overflow-hidden"
                        >
                          {otherQuotes.map((q, idx) => (
                            <button
                              key={q.id}
                              onClick={() => {
                                onActiveQuoteChange?.(q.id);
                                setCompareDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-1.5 text-left text-sm font-semibold transition-colors flex items-center gap-2 ${
                                idx === 0 ? '' : 'border-t border-green-900/50'
                              } ${
                                activeQuoteId === q.id
                                  ? 'bg-green-800 text-white'
                                  : 'text-white/70 hover:bg-green-800/50 hover:text-white'
                              }`}
                            >
                              {q.is_fna_quote
                                ? <Star size={14} className="flex-shrink-0" />
                                : <User size={14} className="flex-shrink-0" />
                              }
                              {q.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : undefined
              }
            />

            {/* Total + Payment - comparison mode: left=FNA, right=active */}
            <div className={`py-4 -mx-6 px-6 ${fundraisingEnabled ? 'border-t border-green-900 bg-green-900/20' : 'border-t border-border'}`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={`flex justify-between items-baseline mb-2 pb-2 border-b border-dashed ${fundraisingEnabled ? 'border-green-900/60' : 'border-border'}`}>
                    <span className="font-display font-bold text-foreground text-base">Total</span>
                    <span className="font-display text-xl font-bold text-foreground">{formatPrice(fnaColumnData.total)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-semibold text-green-400 block">{Math.round(fnaColumnData.downPercent * 100)}% due at signing</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Minimum to begin</p>
                    </div>
                    <span className="font-display font-bold text-2xl text-green-400">{formatPrice(fnaColumnData.downAmount)}</span>
                  </div>
                  {fnaColumnData.isFundraising ? (
                    <>
                      {fnaColumnData.fundDeliveryAmount > 0 && (
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-sm font-semibold text-muted-foreground">Due on delivery</span>
                          <span className="font-display font-bold text-base text-muted-foreground">{formatPrice(fnaColumnData.fundDeliveryAmount)}</span>
                        </div>
                      )}
                      {fnaColumnData.fundPostRaiseAmount > 0 && (
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-sm font-semibold text-muted-foreground">{Math.round((1 - fnaColumnData.downPercent) * 100)}% due <u>after raise</u></span>
                          <span className="font-display font-bold text-base text-muted-foreground">{formatPrice(fnaColumnData.fundPostRaiseAmount)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {balanceLabel({ crowdfunding: fnaColumnData.crowdfundingEnabled, deferred: fnaColumnData.deferPayment, fundraising: false, remainingPercent: Math.round((1 - fnaColumnData.downPercent) * 100) })}
                      </span>
                      <span className="font-display font-bold text-base text-muted-foreground">{formatPrice(fnaColumnData.total - fnaColumnData.downAmount)}</span>
                    </div>
                  )}
                </div>
                <div className={`pl-4 ${fundraisingEnabled ? 'border-l border-green-900/50' : 'border-l border-border'}`}>
                  <div className={`flex justify-between items-baseline mb-2 pb-2 border-b border-dashed ${fundraisingEnabled ? 'border-green-900/60' : 'border-border'}`}>
                    <span className="font-display font-bold text-foreground text-base">Total</span>
                    <span className="font-display text-xl font-bold text-foreground">{formatPrice(liveColumnData.total)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-semibold text-green-400 block">{Math.round(liveColumnData.downPercent * 100)}% due at signing</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Minimum to begin</p>
                    </div>
                    <span className="font-display font-bold text-2xl text-green-400">{formatPrice(liveColumnData.downAmount)}</span>
                  </div>
                  {liveColumnData.isFundraising ? (
                    <>
                      {liveColumnData.fundDeliveryAmount > 0 && (
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-sm font-semibold text-muted-foreground">Due on delivery</span>
                          <span className="font-display font-bold text-base text-muted-foreground">{formatPrice(liveColumnData.fundDeliveryAmount)}</span>
                        </div>
                      )}
                      {liveColumnData.fundPostRaiseAmount > 0 && (
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-sm font-semibold text-muted-foreground">{Math.round((1 - liveColumnData.downPercent) * 100)}% due <u>after raise</u></span>
                          <span className="font-display font-bold text-base text-muted-foreground">{formatPrice(liveColumnData.fundPostRaiseAmount)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {balanceLabel({ crowdfunding: liveColumnData.crowdfundingEnabled, deferred: liveColumnData.deferPayment, fundraising: false, remainingPercent: Math.round((1 - liveColumnData.downPercent) * 100) })}
                      </span>
                      <span className="font-display font-bold text-base text-muted-foreground">{formatPrice(liveColumnData.total - liveColumnData.downAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="single" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
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

          const userBuildItems = (buildResult?.items ?? []).filter(i => i.name !== 'Priority Scheduling');
          const userLaunchItems = (launchResult?.items ?? []).filter(i => !i.name.includes('Production Days') && i.name !== 'Priority Scheduling');
          const userFundItems = (fundraisingResult?.items ?? []).filter(i => i.name !== 'Priority Scheduling');

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

              {/* Priority Scheduling (combined across tiers) */}
              {totalPriority > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority Scheduling</span>
                  <span className={isRecommended ? 'text-white/25' : 'text-foreground'}>{formatPrice(totalPriority)}</span>
                </div>
              )}

              {/* Deferred payment fee */}
              {effectiveCrowdfundingEnabled && deferPayment && deferredFeePercent > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deferred payment (+{deferredFeePercent}%)</span>
                  <span className="text-muted-foreground">+{formatPrice(deferredFee)}</span>
                </div>
              )}

              {/* Crowdfunding discount */}
              {effectiveCrowdfundingEnabled && crowdfundingTierDiscounts[crowdfundingTierIndex] > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-600">Crowdfunding ({crowdfundingTierDiscounts[crowdfundingTierIndex]}% off)</span>
                  <span className="text-green-600">-{formatPrice(crowdfundingDiscount)}</span>
                </div>
              )}

              {/* Friendly discount */}
              {showFriendlyDiscount && friendlyDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-600">Friendly discount ({friendlyDiscountPercent}%)</span>
                  <span className="text-green-600">-{formatPrice(friendlyDiscount)}</span>
                </div>
              )}

              {/* Additional discount (admin-set flat $) */}
              {additionalDiscountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-600">Additional discounts</span>
                  <span className="text-green-600">-{formatPrice(additionalDiscountAmount)}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Total + Payment */}
        <div className={`py-4 -mx-6 px-6 ${fundraisingEnabled ? 'border-t border-b border-green-900 bg-green-900/20 mb-6' : 'border-t border-border'}`}>
          <div className={`flex justify-between items-baseline mb-3 pb-3 border-b border-dashed ${fundraisingEnabled ? 'border-green-900/60' : 'border-border'}`}>
            <span className="font-display font-bold text-foreground">Total</span>
            <span className="font-display text-xl font-bold text-foreground transition-all duration-300">
              {formatPrice(total)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <span className="font-semibold text-green-400 block">{Math.round(downPercent * 100)}% due at signing</span>
              <span className="text-sm text-muted-foreground block mt-1">Minimum payment to begin</span>
            </div>
            <span className="font-display font-bold text-2xl text-green-400">{formatPrice(downAmount)}</span>
          </div>
          {fundraisingEnabled ? (
            <>
              {fundDeliveryAmount > 0 && (
                <div className="flex justify-between items-center mt-2">
                  <span className="font-semibold text-muted-foreground">Due on delivery</span>
                  <span className="font-display font-bold text-lg text-muted-foreground">{formatPrice(fundDeliveryAmount)}</span>
                </div>
              )}
              {fundPostRaiseAmount > 0 && (
                <div className="flex justify-between items-center mt-2">
                  <span className="font-semibold text-muted-foreground">{Math.round((1 - downPercent) * 100)}% due <u>after raise</u></span>
                  <span className="font-display font-bold text-lg text-muted-foreground">{formatPrice(fundPostRaiseAmount)}</span>
                </div>
              )}
              {fundTier.multiplier > 1 && fundPostRaiseAmount > 0 && (
                <p className="text-xs text-muted-foreground/50 mt-1">{fundTier.label} multiplier applied to post-raise balance</p>
              )}
            </>
          ) : (
            <div className="flex justify-between items-center mt-2">
              <span className="font-semibold text-muted-foreground">
                {balanceLabel({ crowdfunding: effectiveCrowdfundingEnabled, deferred: deferPayment, fundraising: false, remainingPercent: Math.round((1 - downPercent) * 100) })}
              </span>
              <span className="font-display font-bold text-lg text-muted-foreground">{formatPrice(total - downAmount)}</span>
            </div>
          )}
        </div>
          </motion.div>
        )}
        </AnimatePresence>


        {/* Fundraising terms */}
        {fundraisingEnabled && (
          <div className="mt-3 p-4 rounded-lg bg-muted/20 border border-green-900 space-y-2 mb-6">
            <p className="text-base font-semibold text-foreground">Pay up front, or after you raise.</p>
            <p className="text-sm text-muted-foreground">Choose how much to pay before your raise using the slider above. Unpaid balances after delivery are subject to a multiplier.</p>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              Post-raise multipliers range from 1.25x to 2.5x depending on how much is deferred and scope of work. Any amount unpaid at the time of delivery pre-raise is billed at the rates above post-raise to help cover our risk. A fee of up to 50% the balance due after delivery (not including any risk-adjusted rates) will be due after 1 year if no funds have been raised yet.
            </p>
          </div>
        )}


        {!isReadOnly && !hideSaveQuote && (
          <div className="flex flex-col xl:flex-row gap-3 mt-6 pb-6">
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
              fundraisingTierIndex, hasFundAddOns, totalDueAtSigning,
              fundDeliveryAmount, fundPostRaiseAmount,
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
  fundraisingTierIndex: number;
  hasFundAddOns: boolean;
  totalDueAtSigning: number;
  fundDeliveryAmount: number;
  fundPostRaiseAmount: number;
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
    fundraisingTierIndex: p.fundraisingTierIndex,
    fundraisingMultiplier: getFundraisingTiers(p.hasFundAddOns)[p.fundraisingTierIndex]?.multiplier ?? 1,
    fundraisingDeliveryAmount: p.fundDeliveryAmount,
    fundraisingPostRaiseAmount: p.fundPostRaiseAmount,
    dueAtSigningTotal: p.totalDueAtSigning ?? 0,
  };
}
