'use client';

import { useState, useCallback, useTransition, useEffect, useRef } from 'react';
import { Hammer, Rocket, Megaphone } from 'lucide-react';
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

type TabId = 'build' | 'launch' | 'fundraising';

function getVisibleTabs(proposalType: ProposalType): TabId[] {
  switch (proposalType) {
    case 'build':        return ['build'];
    case 'launch':       return ['launch'];
    case 'build-launch': return ['build', 'launch'];
    case 'fundraising':  return ['fundraising'];
    case 'scale':        return ['build', 'launch'];
    default:             return ['build'];
  }
}

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
  isReadOnly?: boolean;
  prefillQuote?: ProposalQuoteRow;
  isLocked?: boolean;
  activeQuoteId?: string;
  saveRef?: React.MutableRefObject<ProposalCalculatorSaveHandle | null>;
  /** Called after any successful save (auto-save or manual) with the saved state */
  onQuoteUpdated?: (payload: CalculatorStateSnapshot) => void;
  /** All quotes for comparison dropdowns in the summary */
  allQuotes?: ProposalQuoteRow[];
}

export function ProposalCalculatorEmbed({ proposalId, proposalType, initialQuote, crowdfundingApproved, isReadOnly, prefillQuote, isLocked, activeQuoteId, saveRef, onQuoteUpdated, allQuotes }: Props) {
  const visibleTabs = getVisibleTabs(proposalType);

  const [activeTab, setActiveTab] = useState<TabId>(
    (initialQuote?.quote_type as TabId) ?? visibleTabs[0]
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
  const [fundraisingEnabled, setFundraisingEnabled] = useState(initialQuote?.fundraising_enabled ?? false);
  const [friendlyDiscountPct, setFriendlyDiscountPct] = useState(initialQuote?.friendly_discount_pct ?? 0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([(initialQuote?.quote_type as TabId) ?? visibleTabs[0]])
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['ADD-ONS', 'CAST + CREW', 'RENTALS + TECHNIQUES', 'POST PRODUCTION'])
  );

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
    setFundraisingEnabled(prefillQuote.fundraising_enabled ?? false);
  }, [prefillQuote]);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevQuoteId = useRef<string | undefined>(initialQuote?.id);

  // When activeQuoteId changes (user switched to a different quote tab),
  // reload all calculator state from the new initialQuote — in place, no remount.
  useEffect(() => {
    if (!initialQuote || initialQuote.id === prevQuoteId.current) return;
    prevQuoteId.current = initialQuote.id;

    // Restore the tab the quote was saved on
    const savedTab = (initialQuote.quote_type as TabId) ?? visibleTabs[0];
    setActiveTab(savedTab);
    setExpandedSections(new Set([savedTab]));

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
    setFundraisingEnabled(initialQuote.fundraising_enabled ?? false);
    setFriendlyDiscountPct(initialQuote.friendly_discount_pct ?? 0);
  }, [initialQuote, visibleTabs]);

  // Build the current state payload (shared by auto-save and manual save)
  const buildSavePayload = useCallback(() => ({
    quote_type: activeTab,
    selected_addons: Object.fromEntries(selectedAddOns),
    slider_values: Object.fromEntries(sliderValues),
    tier_selections: Object.fromEntries(tierSelections),
    location_days: Object.fromEntries(Array.from(locationDays.entries()).map(([k, v]) => [k, v])),
    photo_count: photoCount,
    crowdfunding_enabled: crowdfundingEnabled,
    crowdfunding_tier: crowdfundingTierIndex,
    fundraising_enabled: fundraisingEnabled,
    friendly_discount_pct: friendlyDiscountPct,
  }), [activeTab, selectedAddOns, sliderValues, tierSelections, locationDays, photoCount, crowdfundingEnabled, crowdfundingTierIndex, fundraisingEnabled, friendlyDiscountPct]);

  // Expose imperative save handle so parent can trigger an immediate persist
  useEffect(() => {
    if (!saveRef) return;
    saveRef.current = {
      saveNow: async () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        const payload = buildSavePayload();
        await updateClientQuote(proposalId, payload, activeQuoteId);
        onQuoteUpdated?.(payload as CalculatorStateSnapshot);
      },
      getState: () => buildSavePayload() as CalculatorStateSnapshot,
    };
    return () => { if (saveRef) saveRef.current = null; };
  }, [saveRef, proposalId, activeQuoteId, buildSavePayload, onQuoteUpdated]);

  // Auto-save: only for unlocked (client) quotes
  useEffect(() => {
    if (isLocked) return;
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
  }, [isLocked, proposalId, buildSavePayload, activeQuoteId, onQuoteUpdated]);

  const totalDays = selectedAddOns.get('launch-production-days') ?? 1;
  const showBuild = activeTab === 'build';
  const showLaunch = activeTab === 'launch';
  const showFundraising = activeTab === 'fundraising';

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
    setSelectedAddOns((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, 1);
      }
      return next;
    });
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

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setExpandedSections(new Set([tab]));
    if (tab !== 'fundraising') {
      setFundraisingEnabled(false);
    } else {
      setFundraisingEnabled(true);
    }
  }, []);

  const handleSave = useCallback(() => {
    startSave(async () => {
      await saveClientQuote(proposalId, {
        label: 'My Quote',
        quote_type: activeTab,
        selected_addons: Object.fromEntries(selectedAddOns),
        slider_values: Object.fromEntries(sliderValues),
        tier_selections: Object.fromEntries(tierSelections),
        location_days: Object.fromEntries(locationDays),
        photo_count: photoCount,
        crowdfunding_enabled: crowdfundingEnabled,
        crowdfunding_tier: crowdfundingTierIndex,
        fundraising_enabled: fundraisingEnabled,
        defer_payment: false,
        friendly_discount_pct: 0,
        total_amount: null,
        down_amount: null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }, [
    proposalId,
    activeTab,
    selectedAddOns,
    sliderValues,
    tierSelections,
    locationDays,
    photoCount,
    crowdfundingEnabled,
    crowdfundingTierIndex,
    fundraisingEnabled,
  ]);

  const allAddOns = [...buildAddOns, ...launchAddOns, ...fundraisingIncluded, ...fundraisingAddOns];

  // Compute recommended (first FNA) quote data for comparison coloring on add-on rows
  const recommendedRef = allQuotes?.find((q) => q.is_fna_quote);
  // Only show comparison after the calculator state has synced to the current quote
  // (prevQuoteId tracks what the state currently represents)
  const stateSynced = prevQuoteId.current === initialQuote?.id;
  const isCompare = !isLocked && !!recommendedRef && stateSynced;
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
      {/* Tab selector — only when multiple tabs visible */}
      {visibleTabs.length > 1 && (
        <div className="flex mb-6 flex-shrink-0">
          <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] p-1">
            {visibleTabs.map((tabId) => {
              const label =
                tabId === 'build' ? 'Build' : tabId === 'launch' ? 'Launch' : 'Fundraising';
              return (
                <button
                  key={tabId}
                  onClick={() => handleTabChange(tabId)}
                  className={`relative px-4 py-2 rounded text-sm font-medium transition-colors duration-200 ${
                    activeTab === tabId
                      ? 'text-white bg-white/10'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Calculator body */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'none' }}>
        <div className="grid grid-cols-1 gap-8 pb-8">
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
              crowdfundingEnabled={crowdfundingEnabled}
              onCrowdfundingToggle={() => setCrowdfundingEnabled((p) => !p)}
              crowdfundingTierIndex={crowdfundingTierIndex}
              onCrowdfundingTierChange={setCrowdfundingTierIndex}
              fundraisingEnabled={fundraisingEnabled}
              onFundraisingToggle={() => setFundraisingEnabled((p) => !p)}
              totalDays={totalDays}
              photoCount={photoCount}
              tierSelections={tierSelections}
              locationDays={locationDays}
              onSave={handleSave}
              saving={saving}
              saved={saved}
              hideGetStarted
              hideSaveQuote
              initialFriendlyDiscountPct={initialQuote?.friendly_discount_pct ?? 0}
              crowdfundingApproved={crowdfundingApproved}
              isReadOnly={isReadOnly}
              isLocked={isLocked}
              allQuotes={allQuotes}
              activeQuoteId={activeQuoteId}
              onFriendlyDiscountChange={setFriendlyDiscountPct}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
