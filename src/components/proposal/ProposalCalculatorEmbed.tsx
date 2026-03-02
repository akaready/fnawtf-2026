'use client';

import { useState, useCallback, useTransition, useEffect, useRef } from 'react';
import { Hammer, Rocket, Megaphone, TrendingUp, Coins, Layers, type LucideIcon } from 'lucide-react';
import {
  buildAddOns,
  launchAddOns,
  fundraisingIncluded,
  fundraisingAddOns,
} from '@/app/pricing/pricing-data';
import { CollapsibleSection, AddOnSection } from '@/components/pricing/AddOnCalculator';
import { CalculatorSummary } from '@/components/pricing/CalculatorSummary';
import { saveClientQuote, updateClientQuote } from '@/app/p/[slug]/actions';
import type { ProposalType, ProposalQuoteRow } from '@/types/proposal';

export type PricingType = 'build' | 'build-launch' | 'launch' | 'scale' | 'fundraising';

export interface CalculatorStateSnapshot {
  quote_type: string;
  selected_addons: Record<string, number>;
  slider_values: Record<string, number>;
  tier_selections: Record<string, string>;
  location_days: Record<string, number[]>;
  photo_count: number;
  crowdfunding_enabled: boolean;
  crowdfunding_tier: number;
  fundraising_enabled: boolean;
  friendly_discount_pct: number;
}

export interface ProposalCalculatorSaveHandle {
  /** Immediately persist the current calculator state to the active quote row */
  saveNow: () => Promise<void>;
  /** Get the current calculator state as a plain object */
  getState: () => CalculatorStateSnapshot;
}

interface Props {
  proposalId: string;
  proposalType: ProposalType;
  initialQuote?: ProposalQuoteRow;
  crowdfundingApproved?: boolean;
  crowdfundingDeferred?: boolean;
  isReadOnly?: boolean;
  prefillQuote?: ProposalQuoteRow;
  isLocked?: boolean;
  activeQuoteId?: string;
  saveRef?: React.MutableRefObject<ProposalCalculatorSaveHandle | null>;
  /** Called after any successful save (auto-save or manual) with the saved state */
  onQuoteUpdated?: (payload: CalculatorStateSnapshot) => void;
  /** All quotes for comparison dropdowns in the summary */
  allQuotes?: ProposalQuoteRow[];
  /** Called when user selects a different quote in the compare dropdown (syncs with tabs) */
  onActiveQuoteChange?: (quoteId: string) => void;
  /** Called when user clicks anywhere in a locked calculator that has no personal quote yet */
  onLockedInteract?: () => void;
  /** When provided, overrides the default saveClientQuote call (used in admin context to call saveProposalQuote) */
  onFnaSave?: (payload: CalculatorStateSnapshot) => Promise<string>;
  /** Controlled type override from parent (admin PricingTab). Hides the internal type bar. */
  typeOverride?: PricingType;
  /** Controlled crowdfunding override from parent (admin PricingTab). */
  crowdfundingOverride?: boolean;
  /** Called whenever the user edits any per-quote field (not on mount or quote reload) */
  onAnyChange?: () => void;
  /** Standalone mode — no server saves, emits state via onStateChange instead */
  standalone?: boolean;
  /** Called on every state change in standalone mode (debounced) */
  onStateChange?: (state: CalculatorStateSnapshot) => void;
}

function initSelectedType(proposalType: ProposalType, savedQuoteType?: string): PricingType {
  if (savedQuoteType && ['build','build-launch','launch','scale','fundraising'].includes(savedQuoteType)) {
    return savedQuoteType as PricingType;
  }
  if (proposalType === 'build-launch') return 'build-launch';
  if (proposalType === 'scale') return 'scale';
  if (proposalType === 'fundraising') return 'fundraising';
  if (proposalType === 'launch') return 'launch';
  return 'build';
}

function sectionsForType(type: PricingType): Set<string> {
  const s = new Set<string>();
  if (['build','build-launch','scale'].includes(type)) s.add('build');
  if (['launch','build-launch','scale'].includes(type)) s.add('launch');
  if (type === 'fundraising') s.add('fundraising');
  return s;
}

export function ProposalCalculatorEmbed({ proposalId, proposalType, initialQuote, crowdfundingApproved, crowdfundingDeferred, isReadOnly, prefillQuote, isLocked, activeQuoteId, saveRef, onQuoteUpdated, allQuotes, onActiveQuoteChange, onLockedInteract, onFnaSave, typeOverride, crowdfundingOverride, onAnyChange, standalone, onStateChange }: Props) {
  const [selectedType, setSelectedType] = useState<PricingType>(
    () => initSelectedType(proposalType, initialQuote?.quote_type)
  );
  const [selectedAddOns, setSelectedAddOns] = useState<Map<string, number>>(
    initialQuote?.selected_addons
      ? new Map(Object.entries(initialQuote.selected_addons))
      : new Map([['launch-production-days', 1]])
  );
  const [sliderValues, setSliderValues] = useState<Map<string, number>>(
    initialQuote?.slider_values
      ? new Map(Object.entries(initialQuote.slider_values))
      : new Map()
  );
  const [photoCount, setPhotoCount] = useState(initialQuote?.photo_count ?? 25);
  const [locationDays, setLocationDays] = useState<Map<string, number[]>>(
    initialQuote?.location_days
      ? new Map(Object.entries(initialQuote.location_days).map(([k, v]) => [k, v as number[]]))
      : new Map()
  );
  const [tierSelections, setTierSelections] = useState<Map<string, 'basic' | 'premium'>>(
    initialQuote?.tier_selections
      ? new Map(Object.entries(initialQuote.tier_selections).map(([k, v]) => [k, v as 'basic' | 'premium']))
      : new Map()
  );
  const [crowdfundingEnabled, setCrowdfundingEnabled] = useState(initialQuote?.crowdfunding_enabled ?? false);
  const [crowdfundingTierIndex, setCrowdfundingTierIndex] = useState(initialQuote?.crowdfunding_tier ?? 0);
  const [friendlyDiscountPct, setFriendlyDiscountPct] = useState(initialQuote?.friendly_discount_pct ?? 0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => sectionsForType(initSelectedType(proposalType, initialQuote?.quote_type))
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['ADD-ONS', 'CAST + CREW', 'RENTALS + TECHNIQUES', 'POST PRODUCTION'])
  );

  // When controlled from parent (admin PricingTab), override internal type/crowdfunding
  const effectiveType = typeOverride ?? selectedType;
  const effectiveCrowdfunding = crowdfundingOverride !== undefined ? crowdfundingOverride : crowdfundingEnabled;

  // Sync expandedSections when parent changes the type override
  useEffect(() => {
    if (typeOverride === undefined) return;
    setExpandedSections(sectionsForType(typeOverride));
  }, [typeOverride]);

  const [saving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);

  // Pre-populate state from prefillQuote when provided — only when no client quote exists
  useEffect(() => {
    if (!prefillQuote) return;
    if (initialQuote) return; // client's saved state takes priority
    if (prefillQuote.selected_addons) {
      setSelectedAddOns(new Map(Object.entries(prefillQuote.selected_addons)));
    }
    if (prefillQuote.slider_values) {
      setSliderValues(new Map(Object.entries(prefillQuote.slider_values)));
    }
    if (prefillQuote.tier_selections) {
      setTierSelections(new Map(Object.entries(prefillQuote.tier_selections).map(([k, v]) => [k, v as 'basic' | 'premium'])));
    }
    if (prefillQuote.location_days) {
      setLocationDays(new Map(Object.entries(prefillQuote.location_days).map(([k, v]) => [k, v as number[]])));
    }
    setCrowdfundingEnabled(prefillQuote.crowdfunding_enabled ?? false);
    if (prefillQuote.quote_type) {
      const qt = prefillQuote.quote_type;
      if (['build','build-launch','launch','scale','fundraising'].includes(qt)) {
        const t = qt as PricingType;
        setSelectedType(t);
        setExpandedSections(sectionsForType(t));
      }
    }
  }, [prefillQuote]);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevQuoteId = useRef<string | undefined>(initialQuote?.id);
  // Dirty tracking: suppress onAnyChange during initial mount and quote reloads
  const hasMountedRef = useRef(false);
  const suppressDirtyRef = useRef(false);

  // Keep a ref to the recommended quote so toggle handlers can read it without stale closures
  const recommendedDataRef = useRef<ProposalQuoteRow | undefined>(allQuotes?.find((q) => q.is_fna_quote));
  useEffect(() => {
    recommendedDataRef.current = allQuotes?.find((q) => q.is_fna_quote);
  }, [allQuotes]);
  // Also keep a ref to selectedAddOns for sync reads inside callbacks
  const selectedAddOnsRef = useRef(selectedAddOns);
  selectedAddOnsRef.current = selectedAddOns;

  // Fire onAnyChange when the user edits per-quote fields — skip initial mount and reloads
  useEffect(() => {
    if (!hasMountedRef.current) { hasMountedRef.current = true; return; }
    if (suppressDirtyRef.current) { suppressDirtyRef.current = false; return; }
    onAnyChange?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddOns, sliderValues, tierSelections, locationDays, photoCount, crowdfundingTierIndex, friendlyDiscountPct]);

  // When activeQuoteId changes (user switched to a different quote tab),
  // reload all calculator state from the new initialQuote — in place, no remount.
  useEffect(() => {
    if (!initialQuote || initialQuote.id === prevQuoteId.current) return;
    suppressDirtyRef.current = true; // prevent reload from triggering dirty
    prevQuoteId.current = initialQuote.id;

    // Restore the type the quote was saved on.
    // When typeOverride is set (e.g. public proposal slide or admin preview),
    // use it for section expansion so the locked type always wins.
    const savedType = initSelectedType(proposalType, initialQuote.quote_type);
    setSelectedType(savedType);
    setExpandedSections(sectionsForType(typeOverride ?? savedType));

    if (initialQuote.selected_addons) {
      setSelectedAddOns(new Map(Object.entries(initialQuote.selected_addons)));
    } else {
      setSelectedAddOns(new Map([['launch-production-days', 1]]));
    }
    if (initialQuote.slider_values) {
      setSliderValues(new Map(Object.entries(initialQuote.slider_values)));
    } else {
      setSliderValues(new Map());
    }
    if (initialQuote.tier_selections) {
      setTierSelections(new Map(Object.entries(initialQuote.tier_selections).map(([k, v]) => [k, v as 'basic' | 'premium'])));
    } else {
      setTierSelections(new Map());
    }
    if (initialQuote.location_days) {
      setLocationDays(new Map(Object.entries(initialQuote.location_days).map(([k, v]) => [k, v as number[]])));
    } else {
      setLocationDays(new Map());
    }
    setPhotoCount(initialQuote.photo_count ?? 25);
    setCrowdfundingEnabled(initialQuote.crowdfunding_enabled ?? false);
    setCrowdfundingTierIndex(initialQuote.crowdfunding_tier ?? 0);
    setFriendlyDiscountPct(initialQuote.friendly_discount_pct ?? 0);
  }, [initialQuote, proposalType, typeOverride]);

  // Build the current state payload (shared by auto-save and manual save)
  const buildSavePayload = useCallback(() => ({
    quote_type: effectiveType,
    selected_addons: Object.fromEntries(selectedAddOns),
    slider_values: Object.fromEntries(sliderValues),
    tier_selections: Object.fromEntries(tierSelections),
    location_days: Object.fromEntries(Array.from(locationDays.entries()).map(([k, v]) => [k, v])),
    photo_count: photoCount,
    crowdfunding_enabled: effectiveCrowdfunding,
    crowdfunding_tier: crowdfundingTierIndex,
    fundraising_enabled: effectiveType === 'fundraising',
    friendly_discount_pct: friendlyDiscountPct,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [effectiveType, selectedAddOns, sliderValues, tierSelections, locationDays, photoCount, effectiveCrowdfunding, crowdfundingTierIndex, friendlyDiscountPct]);

  // Standalone mode: emit state changes to parent instead of server saves
  const standaloneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!standalone || !onStateChange) return;
    if (!hasMountedRef.current) return; // skip initial mount
    if (standaloneTimeoutRef.current) clearTimeout(standaloneTimeoutRef.current);
    standaloneTimeoutRef.current = setTimeout(() => {
      onStateChange(buildSavePayload() as CalculatorStateSnapshot);
    }, 300);
    return () => { if (standaloneTimeoutRef.current) clearTimeout(standaloneTimeoutRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [standalone, buildSavePayload]);

  // Expose imperative save handle so parent can trigger an immediate persist
  useEffect(() => {
    if (!saveRef) return;
    saveRef.current = {
      saveNow: async () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        const payload = buildSavePayload();
        if (onFnaSave) {
          await onFnaSave(payload as CalculatorStateSnapshot);
        } else {
          await updateClientQuote(proposalId, payload, activeQuoteId);
        }
        onQuoteUpdated?.(payload as CalculatorStateSnapshot);
      },
      getState: () => buildSavePayload() as CalculatorStateSnapshot,
    };
    return () => { if (saveRef) saveRef.current = null; };
  }, [saveRef, proposalId, activeQuoteId, buildSavePayload, onQuoteUpdated, onFnaSave]);

  // Auto-save: only for unlocked (client) quotes; skipped in admin context (onFnaSave present = admin mode)
  useEffect(() => {
    if (standalone) return; // standalone mode — no server saves
    if (isLocked) return;
    if (onFnaSave) return; // admin mode — saves explicitly, not on auto-save
    if (!activeQuoteId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const payload = buildSavePayload();
      updateClientQuote(proposalId, payload, activeQuoteId)
        .then(() => onQuoteUpdated?.(payload as CalculatorStateSnapshot))
        .catch(console.error);
    }, 1500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked, onFnaSave, proposalId, buildSavePayload, activeQuoteId, onQuoteUpdated]);

  const totalDays = selectedAddOns.get('launch-production-days') ?? 1;
  const showBuild       = effectiveType === 'build' || effectiveType === 'build-launch' || effectiveType === 'scale';
  const showLaunch      = effectiveType === 'launch' || effectiveType === 'build-launch' || effectiveType === 'scale';
  const showFundraising = effectiveType === 'fundraising';
  const fundraisingEnabled = effectiveType === 'fundraising';

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handleToggle = useCallback((id: string) => {
    if (id === 'launch-production-days') return;
    const wasSelected = selectedAddOnsRef.current.has(id);
    const rec = recommendedDataRef.current;

    setSelectedAddOns((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Match recommended qty so re-enabling a removed item goes straight to purple
        const recQty = rec?.selected_addons?.[id];
        next.set(id, typeof recQty === 'number' ? recQty : 1);
      }
      return next;
    });

    // When enabling, sync slider value to recommended so it doesn't show as decreased/increased
    if (!wasSelected) {
      const recSliderVal = rec?.slider_values?.[id];
      if (typeof recSliderVal === 'number') {
        setSliderValues((prev) => {
          const next = new Map(prev);
          next.set(id, recSliderVal);
          return next;
        });
      }
    }
  }, []);

  const handleQuantityChange = useCallback((id: string, qty: number) => {
    setSelectedAddOns((prev) => {
      const n = new Map(prev);
      n.set(id, qty);
      return n;
    });
  }, []);

  const handleSliderChange = useCallback((id: string, val: number) => {
    setSliderValues((prev) => {
      const n = new Map(prev);
      n.set(id, val);
      return n;
    });
  }, []);

  const handleLocationDayToggle = useCallback((key: string, day: number) => {
    setLocationDays((prev) => {
      const next = new Map(prev);
      const current = next.get(key) ?? [];
      if (current.includes(day)) {
        if (current.length > 1) next.set(key, current.filter((d) => d !== day));
      } else {
        next.set(key, [...current, day].sort((a, b) => a - b));
      }
      return next;
    });
  }, []);

  const handleTierChange = useCallback((id: string, tier: 'basic' | 'premium') => {
    setTierSelections((prev) => {
      const n = new Map(prev);
      n.set(id, tier);
      return n;
    });
  }, []);

  const handleTypeChange = useCallback((type: PricingType) => {
    setSelectedType(type);
    setExpandedSections(sectionsForType(type));
    if (type === 'fundraising' || type === 'scale') setCrowdfundingEnabled(false);
  }, []);

  const handleSave = useCallback(() => {
    startSave(async () => {
      if (onFnaSave) {
        // Admin mode: save via onFnaSave and notify parent
        const payload = buildSavePayload() as CalculatorStateSnapshot;
        await onFnaSave(payload);
        onQuoteUpdated?.(payload);
      } else {
        await saveClientQuote(proposalId, {
          label: 'My Quote',
          quote_type: effectiveType,
          selected_addons: Object.fromEntries(selectedAddOns),
          slider_values: Object.fromEntries(sliderValues),
          tier_selections: Object.fromEntries(tierSelections),
          location_days: Object.fromEntries(locationDays),
          photo_count: photoCount,
          crowdfunding_enabled: effectiveCrowdfunding,
          crowdfunding_tier: crowdfundingTierIndex,
          fundraising_enabled: effectiveType === 'fundraising',
          defer_payment: false,
          friendly_discount_pct: 0,
          total_amount: null,
          down_amount: null,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }, [
    proposalId,
    effectiveType,
    selectedAddOns,
    sliderValues,
    tierSelections,
    locationDays,
    photoCount,
    effectiveCrowdfunding,
    crowdfundingTierIndex,
    onFnaSave,
    onQuoteUpdated,
    buildSavePayload,
  ]);

  const allAddOns = [...buildAddOns, ...launchAddOns, ...fundraisingIncluded, ...fundraisingAddOns];

  // Compute recommended (first FNA) quote data for comparison coloring on add-on rows
  const recommendedRef = standalone ? undefined : allQuotes?.find((q) => q.is_fna_quote);
  // Only show comparison after the calculator state has synced to the current quote
  // (prevQuoteId tracks what the state currently represents)
  const stateSynced = prevQuoteId.current === initialQuote?.id;
  const isCompare = !standalone && !isLocked && !!recommendedRef && stateSynced;
  const recommendedAddOnsMap = recommendedRef?.selected_addons
    ? new Map(Object.entries(recommendedRef.selected_addons).map(([k, v]) => [k, v as number]))
    : undefined;
  const recommendedSliderValuesMap = recommendedRef?.slider_values
    ? new Map(Object.entries(recommendedRef.slider_values).map(([k, v]) => [k, v as number]))
    : undefined;
  const recommendedPhotoCountVal = recommendedRef?.photo_count ?? undefined;

  return (
    <div className={
      isLocked
        ? "flex flex-col h-full min-h-0"
        : isReadOnly
          ? "flex flex-col h-full min-h-0 pointer-events-none"
          : "flex flex-col h-full min-h-0"
    }>
      {/* Type + crowdfunding action bar — only shown when not controlled by parent */}
      {typeOverride === undefined && <div className="flex flex-wrap items-center gap-1.5 mb-6 flex-shrink-0">
        {([
          { type: 'build',        label: 'Build',        Icon: Hammer },
          { type: 'build-launch', label: 'Build+Launch',  Icon: Layers },
          { type: 'launch',       label: 'Launch',        Icon: Rocket },
          { type: 'scale',        label: 'Scale',         Icon: TrendingUp },
          { type: 'fundraising',  label: 'Fundraising',   Icon: Megaphone },
        ] as { type: PricingType; label: string; Icon: LucideIcon }[]).map(({ type, label, Icon }) => (
          <button
            key={type}
            disabled={!!isLocked}
            onClick={() => handleTypeChange(type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 disabled:pointer-events-none ${
              selectedType === type ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
        {(selectedType === 'build' || selectedType === 'build-launch' || selectedType === 'launch') && (
          <button
            disabled={!!isLocked}
            onClick={() => setCrowdfundingEnabled((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ml-1 disabled:pointer-events-none ${
              crowdfundingEnabled
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Coins size={14} />
            Crowdfunding?
          </button>
        )}
      </div>}

      {/* Calculator body */}
      <div
        className={`flex-1 overflow-y-auto min-h-0${isLocked && onLockedInteract ? ' cursor-pointer [&_*]:!cursor-pointer' : ''}`}
        style={{ scrollbarWidth: 'none' }}
        onClick={isLocked && onLockedInteract ? (e) => {
          if (!(e.target as HTMLElement).closest('[data-no-intercept]')) onLockedInteract();
        } : undefined}
      >
        <div className="grid grid-cols-1 gap-4 pb-8">
          <div className="space-y-4">
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
                  isLocked={isLocked}
                  isCompare={isCompare}
                  recommendedAddOns={recommendedAddOnsMap}
                  recommendedSliderValues={recommendedSliderValuesMap}
                  recommendedPhotoCount={recommendedPhotoCountVal}
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
                  isLocked={isLocked}
                  isCompare={isCompare}
                  recommendedAddOns={recommendedAddOnsMap}
                  recommendedSliderValues={recommendedSliderValuesMap}
                  recommendedPhotoCount={recommendedPhotoCountVal}
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
                  isLocked={isLocked}
                  isCompare={isCompare}
                  recommendedAddOns={recommendedAddOnsMap}
                  recommendedSliderValues={recommendedSliderValuesMap}
                  recommendedPhotoCount={recommendedPhotoCountVal}
                />
              </CollapsibleSection>
            )}
          </div>

          <div>
            <CalculatorSummary
              selectedAddOns={selectedAddOns}
              sliderValues={sliderValues}
              allAddOns={allAddOns}
              buildActive={showBuild}
              launchActive={showLaunch}
              crowdfundingEnabled={effectiveCrowdfunding}
              onCrowdfundingToggle={() => setCrowdfundingEnabled((p) => !p)}
              crowdfundingTierIndex={crowdfundingTierIndex}
              onCrowdfundingTierChange={setCrowdfundingTierIndex}
              fundraisingEnabled={fundraisingEnabled}
              onFundraisingToggle={() => {}}
              totalDays={totalDays}
              photoCount={photoCount}
              tierSelections={tierSelections}
              locationDays={locationDays}
              onSave={handleSave}
              saving={saving}
              saved={saved}
              hideGetStarted
              hideSaveQuote={standalone || !onFnaSave}
              initialFriendlyDiscountPct={initialQuote?.friendly_discount_pct ?? 0}
              crowdfundingApproved={crowdfundingApproved || crowdfundingOverride}
              crowdfundingDeferred={crowdfundingDeferred}
              hideCrowdfundingToggle={crowdfundingOverride !== undefined}
              isReadOnly={isReadOnly}
              isLocked={isLocked}
              allQuotes={standalone ? undefined : allQuotes}
              activeQuoteId={standalone ? undefined : activeQuoteId}
              onFriendlyDiscountChange={setFriendlyDiscountPct}
              onActiveQuoteChange={standalone ? undefined : onActiveQuoteChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
