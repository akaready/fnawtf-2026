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

interface Props {
  proposalId: string;
  proposalType: ProposalType;
  initialQuote?: ProposalQuoteRow;
  crowdfundingApproved?: boolean;
  isReadOnly?: boolean;
  prefillQuote?: ProposalQuoteRow;
  isLocked?: boolean;
  isCompare?: boolean;
  recommendedQuote?: ProposalQuoteRow;
}

export function ProposalCalculatorEmbed({ proposalId, proposalType, initialQuote, crowdfundingApproved, isReadOnly, prefillQuote, isLocked, isCompare, recommendedQuote }: Props) {
  const visibleTabs = getVisibleTabs(proposalType);

  const [activeTab, setActiveTab] = useState<TabId>(visibleTabs[0]);
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([visibleTabs[0]]));
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

  const recommendedAddOnIds = new Set(
    recommendedQuote?.selected_addons ? Object.keys(recommendedQuote.selected_addons) : []
  );

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevIsCompare = useRef(false);

  // When switching INTO compare mode, sync all quantities from recommendedQuote so the
  // user starts adjusting from the same configuration as recommended.
  useEffect(() => {
    if (isCompare && !prevIsCompare.current && recommendedQuote) {
      if (recommendedQuote.selected_addons) {
        setSelectedAddOns(new Map(Object.entries(recommendedQuote.selected_addons)));
      }
      if (recommendedQuote.slider_values) {
        setSliderValues(new Map(Object.entries(recommendedQuote.slider_values)));
      }
      if (recommendedQuote.tier_selections) {
        setTierSelections(new Map(Object.entries(recommendedQuote.tier_selections).map(([k, v]) => [k, v as 'basic' | 'premium'])));
      }
      if (recommendedQuote.location_days) {
        setLocationDays(new Map(Object.entries(recommendedQuote.location_days).map(([k, v]) => [k, v as number[]])));
      }
      if (recommendedQuote.photo_count !== undefined) {
        setPhotoCount(recommendedQuote.photo_count);
      }
      setCrowdfundingEnabled(recommendedQuote.crowdfunding_enabled ?? false);
      setFundraisingEnabled(recommendedQuote.fundraising_enabled ?? false);
    }
    prevIsCompare.current = isCompare ?? false;
  }, [isCompare, recommendedQuote]);

  useEffect(() => {
    if (!isCompare) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateClientQuote(proposalId, {
        quote_type: activeTab,
        selected_addons: Object.fromEntries(selectedAddOns),
        slider_values: Object.fromEntries(sliderValues),
        tier_selections: Object.fromEntries(tierSelections),
        location_days: Object.fromEntries(Array.from(locationDays.entries()).map(([k, v]) => [k, v])),
        photo_count: photoCount,
        crowdfunding_enabled: crowdfundingEnabled,
        crowdfunding_tier: crowdfundingTierIndex,
        fundraising_enabled: fundraisingEnabled,
      }).catch(console.error);
    }, 1500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompare, proposalId, activeTab, selectedAddOns, sliderValues, tierSelections, locationDays, photoCount, crowdfundingEnabled, crowdfundingTierIndex, fundraisingEnabled]);

  // When locked, always display the FNA's recommended state — never the client's adjusted state
  const displaySelectedAddOns = isLocked && recommendedQuote?.selected_addons
    ? new Map(Object.entries(recommendedQuote.selected_addons))
    : selectedAddOns;
  const displaySliderValues = isLocked && recommendedQuote?.slider_values
    ? new Map(Object.entries(recommendedQuote.slider_values))
    : sliderValues;
  const displayTierSelections = isLocked && recommendedQuote?.tier_selections
    ? new Map(Object.entries(recommendedQuote.tier_selections).map(([k, v]) => [k, v as 'basic' | 'premium']))
    : tierSelections;
  const displayLocationDays = isLocked && recommendedQuote?.location_days
    ? new Map(Object.entries(recommendedQuote.location_days).map(([k, v]) => [k, v as number[]]))
    : locationDays;
  const displayPhotoCount = isLocked && recommendedQuote?.photo_count !== undefined
    ? recommendedQuote.photo_count
    : photoCount;

  const totalDays = displaySelectedAddOns.get('launch-production-days') ?? 1;
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

  const comparisonData = (isCompare && recommendedQuote) ? {
    selectedAddOns: new Map(Object.entries(recommendedQuote.selected_addons ?? {})),
    sliderValues: new Map(Object.entries(recommendedQuote.slider_values ?? {})),
    tierSelections: new Map(Object.entries(recommendedQuote.tier_selections ?? {}).map(([k, v]) => [k, v as 'basic' | 'premium'])),
    locationDays: new Map(Object.entries(recommendedQuote.location_days ?? {}).map(([k, v]) => [k, v as number[]])),
    photoCount: recommendedQuote.photo_count ?? 25,
    crowdfundingEnabled: recommendedQuote.crowdfunding_enabled ?? false,
    crowdfundingTierIndex: recommendedQuote.crowdfunding_tier ?? 0,
    fundraisingEnabled: recommendedQuote.fundraising_enabled ?? false,
    friendly_discount_pct: recommendedQuote.friendly_discount_pct ?? 0,
  } : undefined;

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
                  selectedAddOns={displaySelectedAddOns}
                  sliderValues={displaySliderValues}
                  onToggle={handleToggle}
                  onQuantityChange={handleQuantityChange}
                  onSliderChange={handleSliderChange}
                  expandedCategories={expandedCategories}
                  onCategoryToggle={toggleCategory}
                  isLocked={isLocked}
                  isCompare={isCompare}
                  recommendedAddOns={recommendedAddOnIds}
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
                  selectedAddOns={displaySelectedAddOns}
                  sliderValues={displaySliderValues}
                  onToggle={handleToggle}
                  onQuantityChange={handleQuantityChange}
                  onSliderChange={handleSliderChange}
                  fundraisingActive={false}
                  totalDays={totalDays}
                  photoCount={displayPhotoCount}
                  onPhotoCountChange={setPhotoCount}
                  expandedCategories={expandedCategories}
                  onCategoryToggle={toggleCategory}
                  tierSelections={displayTierSelections}
                  onTierChange={handleTierChange}
                  locationDays={displayLocationDays}
                  onDayToggle={handleLocationDayToggle}
                  isLocked={isLocked}
                  isCompare={isCompare}
                  recommendedAddOns={recommendedAddOnIds}
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
                  selectedAddOns={displaySelectedAddOns}
                  sliderValues={displaySliderValues}
                  onToggle={handleToggle}
                  onQuantityChange={handleQuantityChange}
                  onSliderChange={handleSliderChange}
                  isLocked={isLocked}
                  isCompare={isCompare}
                  recommendedAddOns={recommendedAddOnIds}
                />
              </CollapsibleSection>
            )}
          </div>

          <div>
            <CalculatorSummary
              selectedAddOns={displaySelectedAddOns}
              sliderValues={displaySliderValues}
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
              photoCount={displayPhotoCount}
              tierSelections={displayTierSelections}
              locationDays={displayLocationDays}
              onSave={handleSave}
              saving={saving}
              saved={saved}
              hideGetStarted
              hideSaveQuote
              initialFriendlyDiscountPct={recommendedQuote?.friendly_discount_pct ?? 0}
              crowdfundingApproved={crowdfundingApproved}
              isReadOnly={isReadOnly}
              comparisonData={comparisonData}
              isLocked={isLocked}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
