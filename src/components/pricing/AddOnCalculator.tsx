'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { motion, LayoutGroup } from 'framer-motion';
import {
  Hammer, Rocket, Megaphone, ChevronDown, LucideIcon, X,
} from 'lucide-react';
import {
  buildAddOns, launchAddOns,
  fundraisingIncluded, fundraisingAddOns,
} from '@/app/pricing/pricing-data';
import { AddOn } from '@/types/pricing';
import { CalculatorSummary } from './CalculatorSummary';
import { LeadCaptureModal } from './LeadCaptureModal';
import { getLeadCookie } from '@/lib/pricing/leadCookie';
import type { LeadData } from '@/lib/pricing/leadCookie';

// ── Tab types ────────────────────────────────────────────────────────────
type TabId = 'build' | 'launch' | 'build-launch' | 'fundraising';

const TABS: { id: TabId; label: string }[] = [
  { id: 'build', label: 'Build' },
  { id: 'launch', label: 'Launch' },
  { id: 'build-launch', label: 'Build + Launch' },
  { id: 'fundraising', label: 'Fundraising' },
];

// ── Collapsible Section ─────────────────────────────────────────────────

export function CollapsibleSection({
  icon: Icon,
  title,
  isOpen,
  onToggle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!contentRef.current) return;
    const content = contentRef.current;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      content.style.height = isOpen ? 'auto' : '0px';
      content.style.opacity = isOpen ? '1' : '0';
      return;
    }

    if (isOpen) {
      const height = content.scrollHeight;
      gsap.fromTo(content,
        { height: 0, opacity: 0 },
        { height, opacity: 1, duration: 0.3, ease: 'power2.out', onComplete: () => { content.style.height = 'auto'; } }
      );
    } else {
      gsap.to(content, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.out' });
    }
  }, [isOpen]);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-surface">
      <button
        data-no-intercept
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-950 flex items-center justify-center">
            <Icon className="w-5 h-5 text-purple-300" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-all duration-300 group-hover:text-purple-400 group-hover:scale-110 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div ref={contentRef} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
        <div className="px-5 pt-2 pb-5 space-y-3">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Row Components ──────────────────────────────────────────────────────

function IncludedRow({ addOn, quantity, onQuantityChange, isLocked }: { addOn: AddOn; quantity?: number; onQuantityChange?: (id: string, qty: number) => void; isLocked?: boolean }) {
  const hasQuantity = addOn.quantity && quantity !== undefined && onQuantityChange;
  return (
    <div className="w-full flex items-center justify-between p-4 border border-border/50 rounded-lg bg-[#020202] text-left">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-5 h-5 rounded border-2 border-[#6e6e74] bg-[#6e6e74] flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm font-medium text-muted-foreground">{addOn.name}</span>
        {addOn.description && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">{addOn.description}</span>
        )}
      </div>
      {hasQuantity ? (
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); if (!isLocked && quantity > addOn.quantity!.min) onQuantityChange(addOn.id, quantity - 1); }}
            className={`w-6 h-6 rounded border flex items-center justify-center text-xs ${isLocked ? 'border-white/5 text-white/10' : 'border-border text-muted-foreground hover:text-foreground hover:border-purple-500'}`}
          >-</button>
          <span className={`text-sm w-4 text-center ${isLocked ? 'text-muted-foreground/40' : 'text-foreground'}`}>{quantity}</span>
          <button
            onClick={(e) => { e.stopPropagation(); if (!isLocked && quantity < addOn.quantity!.max) onQuantityChange(addOn.id, quantity + 1); }}
            className={`w-6 h-6 rounded border flex items-center justify-center text-xs ${isLocked ? 'border-white/5 text-white/10' : 'border-border text-muted-foreground hover:text-foreground hover:border-purple-500'}`}
          >+</button>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground/60 whitespace-nowrap">Included</span>
      )}
    </div>
  );
}

function FreebieRow({ addOn }: { addOn: AddOn }) {
  return (
    <div className="w-full flex items-center justify-between p-4 border border-border/50 rounded-lg bg-[#020202] text-left">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-5 h-5 rounded border-2 border-[#6e6e74] bg-[#6e6e74] flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm font-medium text-muted-foreground">{addOn.name}</span>
      </div>
      <span className="text-sm text-muted-foreground/60 whitespace-nowrap">Included</span>
    </div>
  );
}

function SliderRow({
  addOn,
  value,
  enabled,
  onToggle,
  onValueChange,
  isLocked,
  isCompare,
  isRecommended,
  recommendedValue,
}: {
  addOn: AddOn;
  value: number;
  enabled: boolean;
  onToggle: (id: string) => void;
  onValueChange: (id: string, val: number) => void;
  isLocked?: boolean;
  isCompare?: boolean;
  isRecommended?: boolean;
  recommendedValue?: number;
}) {
  const slider = addOn.slider!;

  const lockedNotIncluded = isLocked && !enabled;
  const compareAdded = isCompare && !isLocked && enabled && !isRecommended;
  const compareRemoved = isCompare && !isLocked && !enabled && isRecommended;
  const compareIncreased = isCompare && !isLocked && enabled && isRecommended && recommendedValue !== undefined && value > recommendedValue;
  const compareDecreased = isCompare && !isLocked && enabled && isRecommended && recommendedValue !== undefined && value < recommendedValue;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={isLocked ? undefined : () => onToggle(addOn.id)}
      onKeyDown={isLocked ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(addOn.id); } }}
      className={`w-full p-4 border rounded-lg transition-all duration-200 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} ${
        lockedNotIncluded
          ? 'border-border/50 bg-[#020202]'
          : isLocked
            ? 'border-purple-500 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
            : (compareAdded || compareIncreased)
              ? 'border-cyan-600 bg-cyan-950/20'
              : (compareRemoved || compareDecreased)
                ? 'border-red-900/50 bg-red-950/10'
                : enabled
                  ? 'border-purple-500 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                  : 'border-border bg-[#020202] hover:border-purple-500/50'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {lockedNotIncluded ? (
            <div className="w-5 h-5 rounded border-2 border-red-950 bg-red-950 flex items-center justify-center">
              <X className="w-3 h-3 text-background" strokeWidth={3} />
            </div>
          ) : compareRemoved ? (
            <div className="w-5 h-5 rounded border-2 border-red-900/50 bg-transparent flex items-center justify-center" />
          ) : (
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                isLocked
                  ? 'border-purple-400 bg-purple-400'
                  : (compareAdded || compareIncreased) ? 'border-cyan-500 bg-cyan-500'
                  : compareDecreased ? 'border-red-800 bg-red-800'
                  : enabled ? 'border-purple-400 bg-purple-400' : 'border-muted-foreground/40'
              }`}
            >
              {(enabled || isLocked) && (
                <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          )}
        </div>
        <span className={`text-sm font-medium ${lockedNotIncluded ? 'text-white/20' : compareRemoved ? 'text-red-900' : 'text-foreground'}`}>{addOn.name}</span>
        {enabled && !isLocked && (
          <div className="flex-1 flex items-center gap-2 min-w-0" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs text-muted-foreground">${slider.min.toLocaleString()}</span>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={value}
              onChange={(e) => onValueChange(addOn.id, Number(e.target.value))}
              className={`flex-1 h-1.5 bg-border rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                ${(compareAdded || compareIncreased)
                  ? '[&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                  : compareDecreased
                    ? '[&::-webkit-slider-thumb]:bg-red-800 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(127,29,29,0.4)]'
                    : '[&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                }`}
            />
            <span className="text-xs text-muted-foreground">${slider.max.toLocaleString()}</span>
          </div>
        )}
        <span className={`text-sm font-semibold whitespace-nowrap ml-auto ${lockedNotIncluded ? 'text-white/20' : isLocked ? 'text-purple-400/60' : (compareAdded || compareIncreased) ? 'text-cyan-400' : (compareRemoved || compareDecreased) ? 'text-red-900' : (isCompare && isRecommended) ? 'text-purple-400/60' : isCompare ? 'text-white/50' : 'text-accent'}`}>
          {enabled ? `$${value.toLocaleString('en-US')}${addOn.perDay ? '/day' : ''}` : addOn.priceDisplay}
        </span>
      </div>
    </div>
  );
}

function MultiSliderRow({
  addOn,
  enabled,
  count,
  sliderValues,
  totalDays,
  locationDays,
  onToggle,
  onCountChange,
  onValueChange,
  onDayToggle,
  isLocked,
  isCompare,
  isRecommended,
  recommendedQuantity,
}: {
  addOn: AddOn;
  enabled: boolean;
  count: number;
  sliderValues: Map<string, number>;
  totalDays: number;
  locationDays: Map<string, number[]>;
  onToggle: (id: string) => void;
  onCountChange: (id: string, count: number) => void;
  onValueChange: (id: string, val: number) => void;
  onDayToggle: (key: string, day: number) => void;
  isLocked?: boolean;
  isCompare?: boolean;
  isRecommended?: boolean;
  recommendedQuantity?: number;
}) {
  const slider = addOn.slider!;
  const maxCount = addOn.multiSlider!;

  // Total across all location sliders
  const perDayTotal = Array.from({ length: count }, (_, i) =>
    sliderValues.get(`${addOn.id}:${i}`) ?? slider.default
  ).reduce((sum, v) => sum + v, 0);

  const lockedNotIncluded = isLocked && !enabled;
  const compareAdded = isCompare && !isLocked && enabled && !isRecommended;
  const compareRemoved = isCompare && !isLocked && !enabled && isRecommended;
  const compareIncreased = isCompare && !isLocked && enabled && isRecommended && recommendedQuantity !== undefined && count > recommendedQuantity;
  const compareDecreased = isCompare && !isLocked && enabled && isRecommended && recommendedQuantity !== undefined && count < recommendedQuantity;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={isLocked ? undefined : () => onToggle(addOn.id)}
      onKeyDown={isLocked ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(addOn.id); } }}
      className={`w-full p-4 border rounded-lg transition-all duration-200 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} ${
        lockedNotIncluded
          ? 'border-border/50 bg-[#020202]'
          : isLocked
            ? 'border-purple-500 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
            : (compareAdded || compareIncreased)
              ? 'border-cyan-600 bg-cyan-950/20'
              : (compareRemoved || compareDecreased)
                ? 'border-red-900/50 bg-red-950/10'
                : enabled
                  ? 'border-purple-500 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                  : 'border-border bg-[#020202] hover:border-purple-500/50'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {lockedNotIncluded ? (
            <div className="w-5 h-5 rounded border-2 border-red-950 bg-red-950 flex items-center justify-center">
              <X className="w-3 h-3 text-background" strokeWidth={3} />
            </div>
          ) : compareRemoved ? (
            <div className="w-5 h-5 rounded border-2 border-red-900/50 bg-transparent flex items-center justify-center" />
          ) : (
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                isLocked
                  ? 'border-purple-400 bg-purple-400'
                  : (compareAdded || compareIncreased) ? 'border-cyan-500 bg-cyan-500'
                  : compareDecreased ? 'border-red-800 bg-red-800'
                  : enabled ? 'border-purple-400 bg-purple-400' : 'border-muted-foreground/40'
              }`}
            >
              {(enabled || isLocked) && (
                <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          )}
        </div>
        <span className={`text-sm font-medium ${lockedNotIncluded ? 'text-white/20' : compareRemoved ? 'text-red-900' : 'text-foreground'} flex-1`}>{addOn.name}</span>
        <div className="flex items-center gap-3 flex-shrink-0">
          {enabled && !isLocked && (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => { e.stopPropagation(); if (isLocked) return; if (count > 1) onCountChange(addOn.id, count - 1); else onToggle(addOn.id); }}
                className="w-6 h-6 rounded border border-border text-muted-foreground hover:text-foreground hover:border-purple-500 flex items-center justify-center text-xs"
              >-</button>
              <span className="text-sm text-foreground w-4 text-center">{count}</span>
              <button
                onClick={(e) => { e.stopPropagation(); if (count < maxCount) onCountChange(addOn.id, count + 1); }}
                className="w-6 h-6 rounded border border-border text-muted-foreground hover:text-foreground hover:border-purple-500 flex items-center justify-center text-xs"
              >+</button>
            </div>
          )}
          <span className={`text-sm font-semibold whitespace-nowrap ${lockedNotIncluded ? 'text-white/20' : isLocked ? 'text-purple-400/60' : (compareAdded || compareIncreased) ? 'text-cyan-400' : (compareRemoved || compareDecreased) ? 'text-red-900' : (isCompare && isRecommended) ? 'text-purple-400/60' : isCompare ? 'text-white/50' : 'text-accent'}`}>
            {enabled ? `$${perDayTotal.toLocaleString('en-US')}/day` : addOn.priceDisplay}
          </span>
        </div>
      </div>

      {/* Individual location sliders */}
      {enabled && !isLocked && (
        <div className="mt-3 space-y-3 pl-9" onClick={(e) => e.stopPropagation()}>
          {Array.from({ length: count }, (_, i) => {
            const key = `${addOn.id}:${i}`;
            const val = sliderValues.get(key) ?? slider.default;
            const allDays = Array.from({ length: totalDays }, (_, d) => d + 1);
            const selectedDays = locationDays.get(key) ?? allDays;
            return (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap w-20">Location {i + 1}</span>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={val}
                    onChange={(e) => onValueChange(key, Number(e.target.value))}
                    className={`flex-1 h-1.5 bg-border rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                      ${(compareAdded || compareIncreased)
                        ? '[&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                        : compareDecreased
                          ? '[&::-webkit-slider-thumb]:bg-red-800 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(127,29,29,0.4)]'
                          : '[&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                      }`}
                  />
                  <span className="text-xs font-medium text-foreground w-16 text-right">${val.toLocaleString()}/day</span>
                </div>
                {/* Day toggles inline — only show when multiple production days */}
                {totalDays > 1 && (
                  <div className="flex items-center gap-1.5 pl-20">
                    {allDays.map((day) => {
                      const active = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          onClick={() => onDayToggle(key, day)}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors duration-150 ${
                            active
                              ? (compareAdded || compareIncreased)
                                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300'
                                : (compareRemoved || compareDecreased)
                                  ? 'border-red-900/40 bg-red-950/20 text-red-900'
                                  : 'border-purple-400 bg-purple-400/20 text-purple-300'
                              : 'border-border text-muted-foreground/50 hover:border-muted-foreground/50'
                          }`}
                        >
                          Day {day}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PhotoSliderRow({
  addOn,
  photoCount,
  enabled,
  onToggle,
  onPhotoCountChange,
  totalDays,
  isLocked,
  isCompare,
  isRecommended,
  recommendedPhotoCount,
}: {
  addOn: AddOn;
  photoCount: number;
  enabled: boolean;
  onToggle: (id: string) => void;
  onPhotoCountChange: (count: number) => void;
  totalDays: number;
  isLocked?: boolean;
  isCompare?: boolean;
  isRecommended?: boolean;
  recommendedPhotoCount?: number;
}) {
  const ps = addOn.photoSlider!;
  const extraPhotos = Math.max(0, photoCount - ps.included);
  const extraCost = extraPhotos * ps.extraPrice;
  const baseCost = addOn.price * totalDays;
  const totalCost = baseCost + extraCost;

  const lockedNotIncluded = isLocked && !enabled;
  const compareAdded = isCompare && !isLocked && enabled && !isRecommended;
  const compareRemoved = isCompare && !isLocked && !enabled && isRecommended;
  const compareIncreased = isCompare && !isLocked && enabled && isRecommended && recommendedPhotoCount !== undefined && photoCount > recommendedPhotoCount;
  const compareDecreased = isCompare && !isLocked && enabled && isRecommended && recommendedPhotoCount !== undefined && photoCount < recommendedPhotoCount;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={isLocked ? undefined : () => onToggle(addOn.id)}
      onKeyDown={isLocked ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(addOn.id); } }}
      className={`w-full p-4 border rounded-lg transition-all duration-200 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} ${
        lockedNotIncluded
          ? 'border-border/50 bg-[#020202]'
          : isLocked
            ? 'border-purple-500 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
            : (compareAdded || compareIncreased)
              ? 'border-cyan-600 bg-cyan-950/20'
              : (compareRemoved || compareDecreased)
                ? 'border-red-900/50 bg-red-950/10'
                : enabled
                  ? 'border-purple-500 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                  : 'border-border bg-[#020202] hover:border-purple-500/50'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {lockedNotIncluded ? (
            <div className="w-5 h-5 rounded border-2 border-red-950 bg-red-950 flex items-center justify-center">
              <X className="w-3 h-3 text-background" strokeWidth={3} />
            </div>
          ) : compareRemoved ? (
            <div className="w-5 h-5 rounded border-2 border-red-900/50 bg-transparent flex items-center justify-center" />
          ) : (
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                isLocked
                  ? 'border-purple-400 bg-purple-400'
                  : (compareAdded || compareIncreased) ? 'border-cyan-500 bg-cyan-500'
                  : compareDecreased ? 'border-red-800 bg-red-800'
                  : enabled ? 'border-purple-400 bg-purple-400' : 'border-muted-foreground/40'
              }`}
            >
              {(enabled || isLocked) && (
                <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          )}
        </div>
        <span className={`text-sm font-medium ${lockedNotIncluded ? 'text-white/20' : compareRemoved ? 'text-red-900' : 'text-foreground'} whitespace-nowrap`}>{addOn.name}</span>
        {!enabled && !isLocked && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">includes {ps.included} photos, add&apos;l at ${ps.extraPrice}/ea</span>
        )}
        {enabled && !isLocked && (
          <div className="flex-1 flex items-center gap-2 min-w-0" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs text-muted-foreground">{ps.included}</span>
            <input
              type="range"
              min={ps.included}
              max={ps.max}
              step={5}
              value={photoCount}
              onChange={(e) => onPhotoCountChange(Number(e.target.value))}
              className={`flex-1 h-1.5 bg-border rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                ${(compareAdded || compareIncreased)
                  ? '[&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                  : compareDecreased
                    ? '[&::-webkit-slider-thumb]:bg-red-800 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(127,29,29,0.4)]'
                    : '[&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                }`}
            />
            <span className="text-xs text-muted-foreground">{ps.max}</span>
          </div>
        )}
        <span className={`text-sm font-semibold whitespace-nowrap ml-auto ${lockedNotIncluded ? 'text-white/20' : isLocked ? 'text-purple-400/60' : (compareAdded || compareIncreased) ? 'text-cyan-400' : (compareRemoved || compareDecreased) ? 'text-red-900' : (isCompare && isRecommended) ? 'text-purple-400/60' : isCompare ? 'text-white/50' : 'text-accent'}`}>
          {enabled
            ? `$${totalCost.toLocaleString('en-US')} (${photoCount} photos)`
            : addOn.priceDisplay}
        </span>
      </div>
    </div>
  );
}

function AddOnRow({
  addOn,
  selected,
  quantity,
  onToggle,
  onQuantityChange,
  totalDays,
  isLocked,
  isCompare,
  isRecommended,
  recommendedQuantity,
}: {
  addOn: AddOn;
  selected: boolean;
  quantity: number;
  onToggle: (id: string) => void;
  onQuantityChange: (id: string, qty: number) => void;
  totalDays: number;
  isLocked?: boolean;
  isCompare?: boolean;
  isRecommended?: boolean;
  recommendedQuantity?: number;
}) {
  const perDayDisplay = addOn.perDay && totalDays > 1
    ? ` (x${totalDays} days)`
    : '';

  const lockedNotIncluded = isLocked && !selected;
  const compareAdded = isCompare && !isLocked && selected && !isRecommended;
  const compareRemoved = isCompare && !isLocked && !selected && isRecommended;
  const compareIncreased = isCompare && !isLocked && selected && isRecommended && recommendedQuantity !== undefined && quantity > recommendedQuantity;
  const compareDecreased = isCompare && !isLocked && selected && isRecommended && recommendedQuantity !== undefined && quantity < recommendedQuantity;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={isLocked ? undefined : () => onToggle(addOn.id)}
      onKeyDown={isLocked ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(addOn.id); } }}
      className={`w-full flex flex-nowrap items-center justify-between p-4 border rounded-lg transition-all duration-200 text-left ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} ${
        lockedNotIncluded
          ? 'border-border/50 bg-[#020202]'
          : isLocked
            ? 'border-purple-500 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
            : (compareAdded || compareIncreased)
              ? 'border-cyan-600 bg-cyan-950/20'
              : (compareRemoved || compareDecreased)
                ? 'border-red-900/50 bg-red-950/10'
                : selected
                  ? 'border-purple-500 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                  : 'border-border bg-[#020202] hover:border-purple-500/50'
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {lockedNotIncluded ? (
          <div className="w-5 h-5 rounded border-2 border-red-950 bg-red-950 flex items-center justify-center flex-shrink-0">
            <X className="w-3 h-3 text-background" strokeWidth={3} />
          </div>
        ) : compareRemoved ? (
          <div className="w-5 h-5 rounded border-2 border-red-900/50 bg-transparent flex items-center justify-center flex-shrink-0" />
        ) : (
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
              isLocked
                ? 'border-purple-400 bg-purple-400'
                : (compareAdded || compareIncreased) ? 'border-cyan-500 bg-cyan-500'
                : compareDecreased ? 'border-red-800 bg-red-800'
                : selected ? 'border-purple-400 bg-purple-400' : 'border-muted-foreground/40'
            }`}
          >
            {(selected || isLocked) && (
              <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
        <span className={`text-sm font-medium ${lockedNotIncluded ? 'text-white/20' : compareRemoved ? 'text-red-900' : 'text-foreground'}`}>
          {addOn.name}
          {selected && perDayDisplay && (
            <span className="text-muted-foreground font-normal">{perDayDisplay}</span>
          )}
        </span>
        {addOn.description && (
          <span className={`text-xs whitespace-nowrap ${lockedNotIncluded ? 'text-white/10' : 'text-muted-foreground'}`}>{addOn.description}</span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {addOn.quantity && (
          <div className={`flex items-center gap-2 ${selected && !isLocked ? 'visible' : 'invisible'}`} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); if (isLocked) return; if (quantity > addOn.quantity!.min) onQuantityChange(addOn.id, quantity - 1); else onToggle(addOn.id); }}
              className="w-6 h-6 rounded border border-border text-muted-foreground hover:text-foreground hover:border-purple-500 flex items-center justify-center text-xs"
            >-</button>
            <span className="text-sm text-foreground w-4 text-center">{quantity}</span>
            <button
              onClick={(e) => { e.stopPropagation(); if (!isLocked && quantity < addOn.quantity!.max) onQuantityChange(addOn.id, quantity + 1); }}
              className="w-6 h-6 rounded border border-border text-muted-foreground hover:text-foreground hover:border-purple-500 flex items-center justify-center text-xs"
            >+</button>
          </div>
        )}
        <span className={`text-sm font-semibold whitespace-nowrap ${lockedNotIncluded ? 'text-white/20' : isLocked ? 'text-purple-400/60' : (compareAdded || compareIncreased) ? 'text-cyan-400' : (compareRemoved || compareDecreased) ? 'text-red-900' : (isCompare && isRecommended) ? 'text-purple-400/60' : isCompare ? 'text-white/50' : 'text-accent'}`}>{addOn.priceDisplay}</span>
      </div>
    </div>
  );
}

// ── Tier Toggle Row (e.g. Lighting Kit Basic/Premium) ────────────────────

function TierToggleRow({
  addOn,
  selected,
  tierSelection,
  onToggle,
  onTierChange,
  totalDays,
  isLocked,
  isCompare,
  isRecommended,
}: {
  addOn: AddOn;
  selected: boolean;
  tierSelection: 'basic' | 'premium';
  onToggle: (id: string) => void;
  onTierChange: (id: string, tier: 'basic' | 'premium') => void;
  totalDays: number;
  isLocked?: boolean;
  isCompare?: boolean;
  isRecommended?: boolean;
}) {
  const toggle = addOn.tierToggle!;
  const perDayDisplay = addOn.perDay && totalDays > 1 ? ` (x${totalDays} days)` : '';
  const activePrice = tierSelection === 'premium' ? toggle.premium.price : toggle.basic.price;

  const lockedNotIncluded = isLocked && !selected;
  const compareAdded = isCompare && !isLocked && selected && !isRecommended;
  const compareRemoved = isCompare && !isLocked && !selected && isRecommended;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={isLocked ? undefined : () => onToggle(addOn.id)}
      onKeyDown={isLocked ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(addOn.id); } }}
      className={`w-full p-4 border rounded-lg transition-all duration-200 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} ${
        lockedNotIncluded
          ? 'border-border/50 bg-[#020202]'
          : isLocked
            ? 'border-purple-500 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
            : compareAdded
              ? 'border-cyan-600 bg-cyan-950/20'
              : compareRemoved
                ? 'border-red-900/50 bg-red-950/10'
                : selected
                  ? 'border-purple-500 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                  : 'border-border bg-[#020202] hover:border-purple-500/50'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {lockedNotIncluded ? (
            <div className="w-5 h-5 rounded border-2 border-red-950 bg-red-950 flex items-center justify-center">
              <X className="w-3 h-3 text-background" strokeWidth={3} />
            </div>
          ) : compareRemoved ? (
            <div className="w-5 h-5 rounded border-2 border-red-900/50 bg-transparent flex items-center justify-center" />
          ) : (
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                isLocked
                  ? 'border-purple-400 bg-purple-400'
                  : compareAdded ? 'border-cyan-500 bg-cyan-500'
                  : selected ? 'border-purple-400 bg-purple-400' : 'border-muted-foreground/40'
              }`}
            >
              {(selected || isLocked) && (
                <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          )}
        </div>
        <span className={`text-sm font-medium ${lockedNotIncluded ? 'text-white/20' : compareRemoved ? 'text-red-900' : 'text-foreground'}`}>
          {addOn.name}
          {selected && perDayDisplay && (
            <span className="text-muted-foreground font-normal">{perDayDisplay}</span>
          )}
        </span>
        {selected && (
          <div className={`flex items-center gap-1 ml-auto mr-2 ${isLocked ? 'invisible' : ''}`} onClick={(e) => e.stopPropagation()}>
            {(['basic', 'premium'] as const).map((tier) => (
              <button
                key={tier}
                onClick={(e) => { e.stopPropagation(); if (!isLocked) onTierChange(addOn.id, tier); }}
                className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${
                  tierSelection === tier
                    ? 'bg-purple-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {toggle[tier].label}
              </button>
            ))}
          </div>
        )}
        <span className={`text-sm font-semibold whitespace-nowrap ml-auto ${lockedNotIncluded ? 'text-white/20' : isLocked ? 'text-purple-400/60' : compareAdded ? 'text-cyan-400' : compareRemoved ? 'text-red-900' : (isCompare && isRecommended) ? 'text-purple-400/60' : isCompare ? 'text-white/50' : 'text-accent'}`}>
          {selected ? `$${activePrice.toLocaleString()}/day` : addOn.priceDisplay}
        </span>
      </div>
    </div>
  );
}

// ── Category Sub-Header ──────────────────────────────────────────────────

function CategoryHeader({
  label,
  isOpen,
  onToggle,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="w-full flex items-center gap-4 pt-2 pb-2">
      {/* Left line extending from edge to align with row text */}
      <div className="w-[2.35rem] flex items-center flex-shrink-0">
        <div className="h-px w-full bg-border/50" />
      </div>
      <span className="text-[11px] font-semibold tracking-[0.15em] text-muted-foreground/60 uppercase whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-border/50" />
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="p-1 group"
      >
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground/40 transition-all duration-300 group-hover:text-purple-400 group-hover:scale-110 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  );
}

// ── Add-On Section (renders rows for a list of add-ons) ─────────────────


export function AddOnSection({
  addOns,
  selectedAddOns,
  sliderValues,
  onToggle,
  onQuantityChange,
  onSliderChange,
  fundraisingActive,
  totalDays,
  photoCount,
  onPhotoCountChange,
  expandedCategories,
  onCategoryToggle,
  tierSelections,
  onTierChange,
  locationDays,
  onDayToggle,
  isLocked,
  isCompare,
  recommendedAddOns,
  recommendedSliderValues,
  recommendedPhotoCount,
}: {
  addOns: AddOn[];
  selectedAddOns: Map<string, number>;
  sliderValues: Map<string, number>;
  onToggle: (id: string) => void;
  onQuantityChange: (id: string, qty: number) => void;
  onSliderChange: (id: string, val: number) => void;
  fundraisingActive?: boolean;
  totalDays?: number;
  photoCount?: number;
  onPhotoCountChange?: (count: number) => void;
  expandedCategories?: Set<string>;
  onCategoryToggle?: (cat: string) => void;
  tierSelections?: Map<string, 'basic' | 'premium'>;
  onTierChange?: (id: string, tier: 'basic' | 'premium') => void;
  locationDays?: Map<string, number[]>;
  onDayToggle?: (key: string, day: number) => void;
  isLocked?: boolean;
  isCompare?: boolean;
  recommendedAddOns?: Map<string, number>;
  recommendedSliderValues?: Map<string, number>;
  recommendedPhotoCount?: number;
}) {
  const days = totalDays ?? 1;

  // Always show all items (no filtering in locked mode — greyed-out items shown instead)
  const displayAddOns = addOns;

  const includedItems = displayAddOns.filter((a) => a.included);
  const toggleableItems = displayAddOns.filter((a) => !a.included);

  // Group by category if categories exist
  const categories: string[] = [];
  const byCategory = new Map<string, AddOn[]>();
  const uncategorized: AddOn[] = [];

  for (const addOn of toggleableItems) {
    if (addOn.category) {
      if (!byCategory.has(addOn.category)) {
        categories.push(addOn.category);
        byCategory.set(addOn.category, []);
      }
      byCategory.get(addOn.category)!.push(addOn);
    } else {
      uncategorized.push(addOn);
    }
  }

  const hasCategories = categories.length > 0;

  function renderToggleableRow(addOn: AddOn) {
    const addonIsRecommended = recommendedAddOns?.has(addOn.id) ?? false;
    const recQty = recommendedAddOns?.get(addOn.id);

    if (fundraisingActive && addOn.fundraisingFreebie) {
      return <FreebieRow key={addOn.id} addOn={addOn} />;
    }

    if (addOn.tierToggle && onTierChange) {
      return (
        <TierToggleRow
          key={addOn.id}
          addOn={addOn}
          selected={selectedAddOns.has(addOn.id)}
          tierSelection={tierSelections?.get(addOn.id) ?? 'basic'}
          onToggle={onToggle}
          onTierChange={onTierChange}
          totalDays={days}
          isLocked={isLocked}
          isCompare={isCompare}
          isRecommended={addonIsRecommended}
        />
      );
    }

    if (addOn.slider && addOn.multiSlider) {
      return (
        <MultiSliderRow
          key={addOn.id}
          addOn={addOn}
          enabled={selectedAddOns.has(addOn.id)}
          count={selectedAddOns.get(addOn.id) ?? 1}
          sliderValues={sliderValues}
          totalDays={days}
          locationDays={locationDays ?? new Map()}
          onToggle={onToggle}
          onCountChange={onQuantityChange}
          onValueChange={onSliderChange}
          onDayToggle={onDayToggle ?? (() => {})}
          isLocked={isLocked}
          isCompare={isCompare}
          isRecommended={addonIsRecommended}
          recommendedQuantity={recQty}
        />
      );
    }

    if (addOn.slider) {
      return (
        <SliderRow
          key={addOn.id}
          addOn={addOn}
          value={sliderValues.get(addOn.id) ?? addOn.slider.default}
          enabled={selectedAddOns.has(addOn.id)}
          onToggle={onToggle}
          onValueChange={onSliderChange}
          isLocked={isLocked}
          isCompare={isCompare}
          isRecommended={addonIsRecommended}
          recommendedValue={recommendedSliderValues?.get(addOn.id)}
        />
      );
    }

    if (addOn.photoSlider && onPhotoCountChange) {
      return (
        <PhotoSliderRow
          key={addOn.id}
          addOn={addOn}
          photoCount={photoCount ?? addOn.photoSlider.included}
          enabled={selectedAddOns.has(addOn.id)}
          onToggle={onToggle}
          onPhotoCountChange={onPhotoCountChange}
          totalDays={days}
          isLocked={isLocked}
          isCompare={isCompare}
          isRecommended={addonIsRecommended}
          recommendedPhotoCount={recommendedPhotoCount}
        />
      );
    }

    return (
      <AddOnRow
        key={addOn.id}
        addOn={addOn}
        selected={selectedAddOns.has(addOn.id)}
        quantity={selectedAddOns.get(addOn.id) ?? addOn.quantity?.default ?? 1}
        onToggle={onToggle}
        onQuantityChange={onQuantityChange}
        totalDays={days}
        isLocked={isLocked}
        isCompare={isCompare}
        isRecommended={addonIsRecommended}
        recommendedQuantity={recQty}
      />
    );
  }

  return (
    <>
      {includedItems.map((addOn) => {
        if (addOn.fundraisingFreebie) {
          return <FreebieRow key={addOn.id} addOn={addOn} />;
        }
        if (addOn.quantity) {
          const qty = selectedAddOns.get(addOn.id) ?? addOn.quantity.default;
          return <IncludedRow key={addOn.id} addOn={addOn} quantity={qty} onQuantityChange={onQuantityChange} isLocked={isLocked} />;
        }
        return <IncludedRow key={addOn.id} addOn={addOn} isLocked={isLocked} />;
      })}
      {/* Uncategorized items first */}
      {uncategorized.map(renderToggleableRow)}
      {/* Categorized items with collapsible sub-headers */}
      {hasCategories && categories.map((cat) => {
        const isOpen = expandedCategories?.has(cat) ?? true;
        const items = byCategory.get(cat)!;
        return (
          <div key={cat}>
            <CategoryHeader
              label={cat}
              isOpen={isOpen}
              onToggle={() => onCategoryToggle?.(cat)}
            />
            {isOpen && (
              <div className="space-y-3 mt-3">
                {items.map(renderToggleableRow)}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ── Main Calculator ─────────────────────────────────────────────────────

export function AddOnCalculator() {
  const [selectedAddOns, setSelectedAddOns] = useState<Map<string, number>>(() => {
    const defaults = new Map<string, number>();
    // Always include Production Days
    defaults.set('launch-production-days', 1);
    return defaults;
  });
  const [sliderValues, setSliderValues] = useState<Map<string, number>>(() => {
    const defaults = new Map<string, number>();
    [...buildAddOns, ...launchAddOns].forEach((a) => {
      if (a.slider && a.multiSlider) {
        for (let i = 0; i < a.multiSlider; i++) {
          defaults.set(`${a.id}:${i}`, a.slider.default);
        }
      } else if (a.slider) {
        defaults.set(a.id, a.slider.default);
      }
    });
    return defaults;
  });
  const [photoCount, setPhotoCount] = useState(25);
  const [locationDays, setLocationDays] = useState<Map<string, number[]>>(
    () => new Map()
  );

  // Lead gate state — persist count in sessionStorage so navigating away remembers
  const GATE_KEY = 'fna_gate_count';
  const interactionCount = useRef(0);
  const [showGate, setShowGate] = useState(false);
  const [gateCleared, setGateCleared] = useState(false);
  const [leadData, setLeadData] = useState<LeadData | null>(null);

  // Check for existing cookie on mount — skip gate if already captured
  // Also restore interaction count from sessionStorage
  useEffect(() => {
    const cookie = getLeadCookie();
    if (cookie) {
      setLeadData(cookie);
      setGateCleared(true);
      return;
    }
    const stored = sessionStorage.getItem(GATE_KEY);
    if (stored) {
      const count = parseInt(stored, 10);
      if (!isNaN(count)) {
        interactionCount.current = count;
        // If they left while the gate was showing, show it again immediately
        if (count >= 10) {
          setShowGate(true);
        }
      }
    }
  }, []);

  const persistCount = (count: number) => {
    interactionCount.current = count;
    sessionStorage.setItem(GATE_KEY, String(count));
  };

  const handleGateComplete = useCallback((data: LeadData) => {
    setLeadData(data);
    setGateCleared(true);
    setShowGate(false);
    sessionStorage.removeItem(GATE_KEY);
  }, []);

  const handleGateDismiss = useCallback(() => {
    persistCount(9); // next interaction immediately re-triggers gate
    setShowGate(false);
  }, []);

  // Returns true if the gate was triggered (caller should bail out)
  const checkGate = useCallback((): boolean => {
    persistCount(interactionCount.current + 1);
    if (interactionCount.current >= 10 && !gateCleared) {
      setShowGate(true);
      return true;
    }
    return false;
  }, [gateCleared]);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('build');
  const prevTabRef = useRef<TabId>('build');

  // Collapsible state within a tab
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['build'])
  );

  // Category collapse state (for sub-headers within Launch)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['ADD-ONS', 'CAST + CREW', 'RENTALS + TECHNIQUES', 'POST PRODUCTION'])
  );
  // Tier toggle state (e.g. lighting kit basic/premium)
  const [tierSelections, setTierSelections] = useState<Map<string, 'basic' | 'premium'>>(
    () => new Map()
  );

  // Special programs
  const [crowdfundingEnabled, setCrowdfundingEnabled] = useState(false);
  const [crowdfundingTierIndex, setCrowdfundingTierIndex] = useState(0);
  const [fundraisingEnabled, setFundraisingEnabled] = useState(false);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  const handleToggle = useCallback((id: string) => {
    // Prevent toggling off Production Days
    if (id === 'launch-production-days') return;

    if (checkGate()) return;

    setSelectedAddOns((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        const addOn = [...buildAddOns, ...launchAddOns, ...fundraisingAddOns].find((a) => a.id === id);
        next.set(id, addOn?.quantity?.default ?? 1);
        // Mutual exclusion: basic/premium lighting kit
        if (id === 'launch-lighting-kit-basic') next.delete('launch-lighting-kit-premium');
        if (id === 'launch-lighting-kit-premium') next.delete('launch-lighting-kit-basic');
      }
      return next;
    });
  }, [checkGate]);

  const handleQuantityChange = useCallback((id: string, qty: number) => {
    if (checkGate()) return;
    setSelectedAddOns((prev) => {
      const next = new Map(prev);
      next.set(id, qty);
      return next;
    });
  }, [checkGate]);

  const handleSliderChange = useCallback((id: string, val: number) => {
    if (checkGate()) return;
    setSliderValues((prev) => {
      const next = new Map(prev);
      next.set(id, val);
      return next;
    });
  }, [checkGate]);

  const handleLocationDayToggle = useCallback((key: string, day: number) => {
    setLocationDays((prev) => {
      const next = new Map(prev);
      const current = next.get(key);
      if (!current) {
        // First toggle — all days were implicitly selected, so remove this one
        const allDays = Array.from({ length: selectedAddOns.get('launch-production-days') ?? 1 }, (_, d) => d + 1);
        next.set(key, allDays.filter((d) => d !== day));
      } else if (current.includes(day)) {
        // Don't allow deselecting the last day
        if (current.length > 1) {
          next.set(key, current.filter((d) => d !== day));
        }
      } else {
        next.set(key, [...current, day].sort((a, b) => a - b));
      }
      return next;
    });
  }, [selectedAddOns]);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handleTierChange = useCallback((id: string, tier: 'basic' | 'premium') => {
    setTierSelections((prev) => {
      const next = new Map(prev);
      next.set(id, tier);
      return next;
    });
  }, []);

  const handleCrowdfundingToggle = useCallback(() => {
    if (checkGate()) return;
    setCrowdfundingEnabled((prev) => {
      const next = !prev;
      // Mutual exclusivity: turning on crowdfunding turns off fundraising
      if (next && fundraisingEnabled) {
        setFundraisingEnabled(false);
        // Restore previous tab
        setActiveTab(prevTabRef.current);
        setExpandedSections(new Set(['build', 'launch']));
        // Clean up fundraising add-ons
        setSelectedAddOns((m) => {
          const nm = new Map(m);
          for (const addOn of fundraisingAddOns) nm.delete(addOn.id);
          return nm;
        });
      }
      // Default to 20% off (tier index 2) when enabling crowdfunding
      if (next) {
        setCrowdfundingTierIndex(2);
      }
      return next;
    });
  }, [fundraisingEnabled, checkGate]);

  const handleFundraisingToggle = useCallback(() => {
    setFundraisingEnabled((prev) => {
      const next = !prev;
      if (next) {
        // Mutual exclusivity: turning on fundraising turns off crowdfunding
        setCrowdfundingEnabled(false);
        // Save current tab and switch to fundraising
        prevTabRef.current = activeTab;
        setActiveTab('fundraising');
        setExpandedSections(new Set(['fundraising']));
      } else {
        // Restore previous tab and keep Build+Launch visible
        setActiveTab(prevTabRef.current);
        setExpandedSections(new Set(['build', 'launch']));
        // Clean up fundraising add-ons
        setSelectedAddOns((m) => {
          const nm = new Map(m);
          for (const addOn of fundraisingAddOns) nm.delete(addOn.id);
          return nm;
        });
      }
      return next;
    });
  }, [activeTab]);

  // Handle tab selection
  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    // Switching away from fundraising — turn it off and clean up
    if (tab !== 'fundraising') {
      setFundraisingEnabled(false);
      setSelectedAddOns((m) => {
        const nm = new Map(m);
        for (const addOn of fundraisingAddOns) nm.delete(addOn.id);
        return nm;
      });
    }
    if (tab === 'build') {
      setExpandedSections(new Set(['build']));
    } else if (tab === 'launch') {
      setExpandedSections(new Set(['launch']));
    } else if (tab === 'build-launch') {
      setExpandedSections(new Set(['build', 'launch']));
    } else if (tab === 'fundraising') {
      setExpandedSections(new Set(['fundraising']));
    }
  }, []);

  // Listen for tab changes from pricing cards
  useEffect(() => {
    const handleTabChangeEvent = (e: CustomEvent<{ tab: string }>) => {
      const tab = e.detail.tab as TabId;
      if (tab === 'build' || tab === 'launch') {
        handleTabChange(tab);
      }
    };

    window.addEventListener('tabChange', handleTabChangeEvent as EventListener);
    return () => window.removeEventListener('tabChange', handleTabChangeEvent as EventListener);
  }, [handleTabChange]);

  // Read URL parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'build' || tabParam === 'launch') {
      handleTabChange(tabParam as TabId);
    }
  }, [handleTabChange]);

  // Derive which sections are visible based on active tab
  const showBuild = activeTab === 'build' || activeTab === 'build-launch';
  const showLaunch = activeTab === 'launch' || activeTab === 'build-launch';
  const showFundraising = activeTab === 'fundraising';

  // Production days: from the Production Days selector
  const totalDays = selectedAddOns.get('launch-production-days') ?? 1;

  const allAddOns = [...buildAddOns, ...launchAddOns, ...fundraisingAddOns];

  return (
    <section id="calculator" className="relative py-20 px-6 bg-background scroll-mt-24">
      {/* Lead capture gate — blurs content after 5 interactions */}
      {showGate && <LeadCaptureModal onComplete={handleGateComplete} onDismiss={handleGateDismiss} />}
      <div className={`max-w-7xl mx-auto${showGate ? ' pointer-events-none select-none' : ''}`}>
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center text-white font-display">
            Create a Custom Quote
          </h2>
          <p className="text-center text-white/50 mb-12 max-w-xl mx-auto">
            Customize from our engagement offerings to build your ideal package.
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex justify-center mb-8">
          <LayoutGroup>
            <div className="grid grid-cols-2 sm:inline-flex w-full sm:w-auto rounded-lg border border-border bg-muted/30 p-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    tab.id === 'fundraising'
                      ? handleFundraisingToggle()
                      : handleTabChange(tab.id)
                  }
                  className={`relative whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="active-tab"
                      className="absolute inset-0 bg-purple-600 rounded-md shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: collapsible sections */}
          <div className="lg:col-span-2 space-y-4">
            {showBuild && (
              <CollapsibleSection
                icon={Hammer}
                title="Build"
                isOpen={expandedSections.has('build')}
                onToggle={() => toggleSection('build')}
              >
                <AddOnSection
                  addOns={buildAddOns}
                  selectedAddOns={selectedAddOns}
                  sliderValues={sliderValues}
                  onToggle={handleToggle}
                  onQuantityChange={handleQuantityChange}
                  onSliderChange={handleSliderChange}
                  expandedCategories={expandedCategories}
                  onCategoryToggle={toggleCategory}
                />
              </CollapsibleSection>
            )}

            {showLaunch && (
              <CollapsibleSection
                icon={Rocket}
                title="Launch"
                isOpen={expandedSections.has('launch')}
                onToggle={() => toggleSection('launch')}
              >
                <AddOnSection
                  addOns={launchAddOns}
                  selectedAddOns={selectedAddOns}
                  sliderValues={sliderValues}
                  onToggle={handleToggle}
                  onQuantityChange={handleQuantityChange}
                  onSliderChange={handleSliderChange}
                  fundraisingActive={false}
                  totalDays={totalDays}
                  photoCount={photoCount}
                  onPhotoCountChange={setPhotoCount}
                  expandedCategories={expandedCategories}
                  onCategoryToggle={toggleCategory}
                  tierSelections={tierSelections}
                  onTierChange={handleTierChange}
                  locationDays={locationDays}
                  onDayToggle={handleLocationDayToggle}
                />
              </CollapsibleSection>
            )}

            {showFundraising && (
              <CollapsibleSection
                icon={Megaphone}
                title="Fundraising"
                isOpen={expandedSections.has('fundraising')}
                onToggle={() => toggleSection('fundraising')}
              >
                <AddOnSection
                  addOns={[...fundraisingIncluded, ...fundraisingAddOns]}
                  selectedAddOns={selectedAddOns}
                  sliderValues={sliderValues}
                  onToggle={handleToggle}
                  onQuantityChange={handleQuantityChange}
                  onSliderChange={handleSliderChange}
                />
              </CollapsibleSection>
            )}
          </div>

          {/* Right column: sticky estimate sidebar */}
          <div>
            <CalculatorSummary
              selectedAddOns={selectedAddOns}
              sliderValues={sliderValues}
              allAddOns={allAddOns}
              buildActive={showBuild}
              launchActive={showLaunch}
              crowdfundingEnabled={crowdfundingEnabled}
              onCrowdfundingToggle={handleCrowdfundingToggle}
              crowdfundingTierIndex={crowdfundingTierIndex}
              onCrowdfundingTierChange={setCrowdfundingTierIndex}
              fundraisingEnabled={fundraisingEnabled}
              onFundraisingToggle={handleFundraisingToggle}
              totalDays={totalDays}
              photoCount={photoCount}
              tierSelections={tierSelections}
              locationDays={locationDays}
              prefillData={leadData ?? undefined}
              onInteraction={checkGate}
              crowdfundingApproved
            />
          </div>
        </div>
      </div>
    </section>
  );
}
