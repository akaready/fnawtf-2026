'use client';

import { useState, useTransition, useEffect, useRef, useId, forwardRef, useImperativeHandle } from 'react';
import { TrendingUp, Eye, EyeOff, Plus, Trash2, Check, X, Hammer, Rocket, Coins, BadgeDollarSign, GripVertical, type LucideIcon } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { saveProposalQuote, deleteProposalQuote, reorderProposalQuotes, updateProposal } from '@/app/admin/actions';
import { ProposalCalculatorEmbed, type PricingType, type ProposalCalculatorSaveHandle, type CalculatorStateSnapshot } from '@/components/proposal/ProposalCalculatorEmbed';
import type { ProposalQuoteRow, ProposalType } from '@/types/proposal';

export interface PricingTabHandle {
  isDirty: boolean;
  save: () => Promise<void>;
}

const PHASES: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: 'build',        label: 'Build',        Icon: Hammer },
  { value: 'launch',       label: 'Launch',       Icon: Rocket },
  { value: 'scale',        label: 'Scale',        Icon: TrendingUp },
  { value: 'crowdfunding', label: 'Crowdfunding',  Icon: Coins },
  { value: 'fundraising',  label: 'Fundraising',  Icon: BadgeDollarSign },
];

// Valid phase combinations: build/launch can pair with each other and with crowdfunding. scale and fundraising are standalone.
const PHASE_RULES: Record<string, string[]> = {
  build:        ['launch', 'crowdfunding'],
  launch:       ['build', 'crowdfunding'],
  crowdfunding: ['build', 'launch'],
  scale:        [],
  fundraising:  [],
};

function initPhases(proposalType: ProposalType, quotes: ProposalQuoteRow[]): string[] {
  const phases: string[] = [];
  if (proposalType === 'build' || proposalType === 'build-launch') phases.push('build');
  if (proposalType === 'launch' || proposalType === 'build-launch') phases.push('launch');
  if (proposalType === 'scale') phases.push('scale');
  if (proposalType === 'fundraising') phases.push('fundraising');
  if (quotes.some((q) => q.crowdfunding_enabled)) phases.push('crowdfunding');
  return phases;
}

function derivePricingType(phases: string[]): PricingType | null {
  const hasBuild = phases.includes('build');
  const hasLaunch = phases.includes('launch');
  if (hasBuild && hasLaunch) return 'build-launch';
  if (hasBuild) return 'build';
  if (hasLaunch) return 'launch';
  if (phases.includes('scale')) return 'scale';
  if (phases.includes('fundraising')) return 'fundraising';
  return null;
}

interface PricingTabProps {
  proposalId: string;
  proposalType: ProposalType;
  initialQuotes: ProposalQuoteRow[];
  initialPricingNotes?: string | null;
  initialShowPricingNotes?: boolean;
  initialForceAdditionalDiscount?: boolean;
  initialForcePriorityScheduling?: boolean;
  onProposalTypeChange?: (type: ProposalType) => void;
  onDirty?: () => void;
}

// Fixed config — 5 slots: Recommended, Option A–D
const QUOTE_CONFIG = [
  { defaultLabel: 'Recommended', canHide: false },
  { defaultLabel: 'Option A',    canHide: true  },
  { defaultLabel: 'Option B',    canHide: true  },
] as const;


// ── Sortable quote tab ──────────────────────────────────────────────────

function SortableQuoteTab({
  quote,
  index,
  isActive,
  onSelect,
}: {
  quote: ProposalQuoteRow;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: quote.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isHidden = quote.visible === false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group/tab flex items-center gap-1 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-admin-bg-active' : 'hover:bg-admin-bg-hover'
      }`}
    >
      {/* Number badge → drag handle on hover */}
      <span
        {...attributes}
        {...listeners}
        className="w-6 h-6 flex items-center justify-center ml-1.5 cursor-grab"
      >
        <span className="group-hover/tab:hidden text-xs font-mono font-bold text-admin-text-ghost">
          {index + 1}
        </span>
        <GripVertical
          size={13}
          className="hidden group-hover/tab:block text-admin-text-muted hover:text-admin-text-primary"
        />
      </span>
      <span
        className={`pr-3 py-1.5 text-sm font-medium transition-colors ${
          isHidden
            ? isActive ? 'text-admin-text-dim' : 'text-admin-text-ghost'
            : isActive ? 'text-admin-text-primary' : 'text-admin-text-dim hover:text-admin-text-secondary'
        }`}
      >
        {quote.label || QUOTE_CONFIG[index]?.defaultLabel || `Option ${index + 1}`}
      </span>
    </div>
  );
}

const labelCls = 'admin-label';
const inputCls = 'admin-input w-full';

export const PricingTab = forwardRef<PricingTabHandle, PricingTabProps>(function PricingTab(
  { proposalId, proposalType, initialQuotes, initialPricingNotes, initialShowPricingNotes, initialForceAdditionalDiscount, initialForcePriorityScheduling, onProposalTypeChange, onDirty }: PricingTabProps,
  ref,
) {
  const [quotes, setQuotes] = useState<ProposalQuoteRow[]>(
    [...initialQuotes.filter((q) => !q.deleted_at && q.is_fna_quote)].sort((a, b) => a.sort_order - b.sort_order),
  );
  const [selectedPhases, setSelectedPhases] = useState<string[]>(() =>
    initPhases(proposalType, initialQuotes),
  );
  const crowdfundingEnabled = selectedPhases.includes('crowdfunding');
  const selectedType = derivePricingType(selectedPhases);

  // Sync parent whenever derived type changes
  const prevDerivedRef = useRef(selectedType);
  useEffect(() => {
    if (selectedType && selectedType !== prevDerivedRef.current) {
      onProposalTypeChange?.(selectedType as ProposalType);
    }
    prevDerivedRef.current = selectedType;
  }, [selectedType, onProposalTypeChange]);

  // Sync type bar when parent changes proposal_type (e.g. saved from DetailsTab)
  useEffect(() => {
    setSelectedPhases(initPhases(proposalType, initialQuotes));
  }, [proposalType]); // eslint-disable-line react-hooks/exhaustive-deps
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  const isDirtyRef = useRef(false);
  const readyForDirtyRef = useRef(false);
  const embedSaveRef = useRef<ProposalCalculatorSaveHandle | null>(null);

  // Only accept dirty signals after mount settles (avoids StrictMode double-fire)
  useEffect(() => {
    const id = requestAnimationFrame(() => { readyForDirtyRef.current = true; });
    return () => cancelAnimationFrame(id);
  }, []);

  useImperativeHandle(ref, () => ({
    get isDirty() { return isDirtyRef.current; },
    save: async () => {
      await Promise.all([
        embedSaveRef.current?.saveNow(),
        selectedType ? updateProposal(proposalId, { proposal_type: selectedType }) : Promise.resolve(),
      ]);
    },
  }));

  const handlePhaseToggle = (phase: string) => {
    setSelectedPhases((prev) => {
      const active = prev.includes(phase);
      if (active) return prev.filter((p) => p !== phase);
      if (phase === 'crowdfunding' && prev.length === 0) return ['build', 'crowdfunding'];
      return [...prev, phase];
    });
  };

  const isPhaseDisabled = (phase: string): boolean => {
    if (selectedPhases.includes(phase)) return false;
    if (selectedPhases.length === 0) return false;
    return !selectedPhases.every((p) => PHASE_RULES[p]?.includes(phase) ?? false);
  };

  const handleQuoteSwitch = (i: number) => {
    if (isDirtyRef.current) {
      if (!window.confirm('Discard unsaved changes to this quote?')) return;
    }
    isDirtyRef.current = false;
    setActiveQuoteIndex(i);
  };

  const handleQuoteUpdated = (payload: CalculatorStateSnapshot) => {
    isDirtyRef.current = false;
    setQuotes((prev) => prev.map((q) => (q.id === activeQuote?.id ? { ...q, ...payload } : q)));
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const initRef = useRef(false);

  const activeQuote = quotes[activeQuoteIndex] ?? null;

  // ── Pricing notes (common across all quotes) ──────────────────────────
  const [showPricingNotes, setShowPricingNotes] = useState(initialShowPricingNotes ?? false);

  const handlePricingNotesSave = (notes: string) => {
    startTransition(async () => {
      await updateProposal(proposalId, { pricing_notes: notes.trim() || null });
    });
  };

  const handlePricingNotesToggle = (show: boolean) => {
    setShowPricingNotes(show);
    startTransition(async () => {
      await updateProposal(proposalId, { show_pricing_notes: show });
    });
  };

  // ── Force toggles (proposal-level) ─────────────────────────────────────
  const [forceAdditionalDiscount, setForceAdditionalDiscount] = useState(initialForceAdditionalDiscount ?? false);
  const [forcePriorityScheduling, setForcePriorityScheduling] = useState(initialForcePriorityScheduling ?? false);

  const handleForceAdditionalDiscountChange = (force: boolean) => {
    setForceAdditionalDiscount(force);
    startTransition(async () => {
      await updateProposal(proposalId, { force_additional_discount: force });
    });
  };

  const handleForcePrioritySchedulingChange = (force: boolean) => {
    setForcePriorityScheduling(force);
    startTransition(async () => {
      await updateProposal(proposalId, { force_priority_scheduling: force });
    });
  };

  // ── Auto-create Recommended on first open if empty ──────────────────────
  useEffect(() => {
    if (initRef.current || quotes.length > 0) return;
    initRef.current = true;

    (async () => {
      const id = await saveProposalQuote(proposalId, {
        label: 'Recommended',
        is_fna_quote: true,
        is_locked: true,
        sort_order: 0,
        visible: true,
        quote_type:
          proposalType === 'build-launch' ? 'build'
          : proposalType === 'scale' ? 'build'
          : proposalType,
        selected_addons: {},
        slider_values: {},
        tier_selections: {},
        location_days: {},
        photo_count: 0,
        crowdfunding_enabled: false,
        crowdfunding_tier: 0,
        fundraising_enabled: false,
        fundraising_tier: 0,
        defer_payment: false,
        friendly_discount_pct: 0,
        additional_discount: 0,
        total_amount: null,
        down_amount: null,
        description: null,
      });
      const now = new Date().toISOString();
      setQuotes([{
        id, proposal_id: proposalId, label: 'Recommended',
        is_locked: true, is_fna_quote: true, quote_type: proposalType,
        selected_addons: {}, slider_values: {}, tier_selections: {},
        location_days: {}, photo_count: 0, crowdfunding_enabled: false,
        crowdfunding_tier: 0, fundraising_enabled: false, fundraising_tier: 0, defer_payment: false,
        friendly_discount_pct: 0, additional_discount: 0, total_amount: null, down_amount: null,
        sort_order: 0, visible: true, description: null,
        created_at: now, updated_at: now, deleted_at: null, viewer_email: null,
      }]);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Label save ──────────────────────────────────────────────────────────
  const handleLabelSave = (quote: ProposalQuoteRow, label: string) => {
    if (label === quote.label) return;
    startTransition(async () => {
      await saveProposalQuote(proposalId, { ...quote, label }, quote.id);
      setQuotes((prev) => prev.map((q) => (q.id === quote.id ? { ...q, label } : q)));
    });
  };

  // ── Description save ────────────────────────────────────────────────────
  const handleDescSave = (quote: ProposalQuoteRow, description: string) => {
    if (description === (quote.description ?? '')) return;
    const descValue = description.trim() || null;
    startTransition(async () => {
      await saveProposalQuote(proposalId, { ...quote, description: descValue }, quote.id);
      setQuotes((prev) => prev.map((q) => (q.id === quote.id ? { ...q, description: descValue } : q)));
    });
  };

  // ── Additional discount save ─────────────────────────────────────────────
  const handleAdditionalDiscountSave = (quote: ProposalQuoteRow, amount: number) => {
    if (amount === (quote.additional_discount ?? 0)) return;
    startTransition(async () => {
      await saveProposalQuote(proposalId, { ...quote, additional_discount: amount }, quote.id);
      setQuotes((prev) => prev.map((q) => (q.id === quote.id ? { ...q, additional_discount: amount } : q)));
    });
  };

  // ── Visibility toggle (not for Recommended) ─────────────────────────────
  const handleVisibilityToggle = (quote: ProposalQuoteRow) => {
    const visible = !quote.visible;
    setQuotes((prev) => prev.map((q) => (q.id === quote.id ? { ...q, visible } : q)));
    startTransition(async () => {
      await saveProposalQuote(proposalId, { ...quote, visible }, quote.id);
    });
  };

  // ── Add quote ───────────────────────────────────────────────────────────
  const handleAddQuote = async () => {
    if (quotes.length >= 3) return;
    const i = quotes.length;
    const config = QUOTE_CONFIG[i];
    const id = await saveProposalQuote(proposalId, {
      label: config.defaultLabel,
      is_fna_quote: true,
      is_locked: true,
      sort_order: i,
      visible: true,
      quote_type:
        proposalType === 'build-launch' ? 'build'
        : proposalType === 'scale' ? 'build'
        : proposalType,
      selected_addons: {},
      slider_values: {},
      tier_selections: {},
      location_days: {},
      photo_count: 0,
      crowdfunding_enabled: false,
      crowdfunding_tier: 0,
      fundraising_enabled: false,
      fundraising_tier: 0,
      defer_payment: false,
      friendly_discount_pct: 0,
      total_amount: null,
      down_amount: null,
      description: null,
    });
    const now = new Date().toISOString();
    setQuotes((prev) => [
      ...prev,
      {
        id, proposal_id: proposalId, label: config.defaultLabel,
        is_locked: true, is_fna_quote: true, quote_type: proposalType,
        selected_addons: {}, slider_values: {}, tier_selections: {},
        location_days: {}, photo_count: 0, crowdfunding_enabled: false,
        crowdfunding_tier: 0, fundraising_enabled: false, fundraising_tier: 0, defer_payment: false,
        friendly_discount_pct: 0, additional_discount: 0, total_amount: null, down_amount: null,
        sort_order: i, visible: true, description: null,
        created_at: now, updated_at: now, deleted_at: null, viewer_email: null,
      },
    ]);
    setActiveQuoteIndex(i);
  };

  // ── Delete quote (not Recommended) ─────────────────────────────────────
  const handleConfirmDelete = async (quoteId: string) => {
    await deleteProposalQuote(quoteId);
    setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
    setActiveQuoteIndex(0);
    setConfirmDeleteId(null);
  };

  // ── Drag-reorder quotes ────────────────────────────────────────────────
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const dndId = useId();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = quotes.findIndex((q) => q.id === active.id);
    const newIndex = quotes.findIndex((q) => q.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(quotes, oldIndex, newIndex);
    setQuotes(reordered);

    // Follow the active quote to its new position
    if (activeQuoteIndex === oldIndex) {
      setActiveQuoteIndex(newIndex);
    } else if (oldIndex < activeQuoteIndex && newIndex >= activeQuoteIndex) {
      setActiveQuoteIndex(activeQuoteIndex - 1);
    } else if (oldIndex > activeQuoteIndex && newIndex <= activeQuoteIndex) {
      setActiveQuoteIndex(activeQuoteIndex + 1);
    }

    startTransition(async () => {
      await reorderProposalQuotes(reordered.map((q) => q.id));
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Phase selector — multi-select with compatibility rules */}
      <div className="flex items-center gap-1.5 px-6 @md:px-8 h-[3rem] border-b border-admin-border flex-shrink-0 sticky top-0 z-10 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {PHASES.map(({ value, label, Icon }) => {
          const active = selectedPhases.includes(value);
          const disabled = isPhaseDisabled(value);
          return (
            <button
              key={value}
              onClick={() => handlePhaseToggle(value)}
              disabled={disabled}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                active
                  ? 'bg-admin-bg-active text-admin-text-primary'
                  : disabled
                    ? 'text-admin-text-ghost cursor-not-allowed'
                    : 'text-admin-text-dim hover:text-admin-text-secondary'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Pricing notes + proposal-level toggles */}
      <div className="px-6 @md:px-8 py-3 border-b border-admin-border flex-shrink-0">
        <label className={labelCls}>Notes</label>
        <div className="flex gap-4 mt-1">
          <textarea
            defaultValue={initialPricingNotes ?? ''}
            onBlur={(e) => handlePricingNotesSave(e.target.value)}
            placeholder="Common notes shown above all quote options..."
            rows={3}
            className={inputCls + ' resize-none leading-relaxed flex-1'}
          />
          <div className="space-y-1.5 flex-shrink-0 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPricingNotes}
                onChange={(e) => handlePricingNotesToggle(e.target.checked)}
                className="accent-admin-accent"
              />
              <span className="text-admin-sm text-admin-text-muted">Show notes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={forceAdditionalDiscount}
                onChange={(e) => handleForceAdditionalDiscountChange(e.target.checked)}
                className="accent-admin-accent"
              />
              <span className="text-admin-sm text-admin-text-muted">Force additional discount</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={forcePriorityScheduling}
                onChange={(e) => handleForcePrioritySchedulingChange(e.target.checked)}
                className="accent-admin-accent"
              />
              <span className="text-admin-sm text-admin-text-muted">Force priority scheduling</span>
            </label>
          </div>
        </div>
      </div>

      {/* Quote tabs nav — hidden for Scale (custom quotes) */}
      {selectedType === 'scale' ? null : <div className="flex items-center gap-1 px-6 @md:px-8 h-[3rem] border-b border-admin-border flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        <DndContext id={dndId} sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={quotes.map((q) => q.id)} strategy={horizontalListSortingStrategy}>
            {quotes.map((q, i) => (
              <SortableQuoteTab
                key={q.id}
                quote={q}
                index={i}
                isActive={i === activeQuoteIndex}
                onSelect={() => handleQuoteSwitch(i)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Right: Eye + Delete + Add */}
        <div className="ml-auto flex items-center gap-1">
          {/* Eye toggle */}
          {activeQuote && quotes.length > 1 && (
            <button
              onClick={() => handleVisibilityToggle(activeQuote)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-secondary hover:bg-admin-bg-hover transition-colors"
              title={activeQuote.visible === false ? 'Show quote to client' : 'Hide quote from client'}
            >
              {activeQuote.visible === false ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          )}

          {/* Delete — available when more than 1 quote */}
          {activeQuote && quotes.length > 1 && (
            <>
              {confirmDeleteId === activeQuote.id ? (
                <>
                  <button
                    onClick={() => handleConfirmDelete(activeQuote.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-danger hover:text-admin-danger-hover hover:bg-admin-danger-bg transition-colors"
                    title="Confirm delete"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-secondary hover:bg-admin-bg-hover transition-colors"
                    title="Cancel"
                  >
                    <X size={13} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(activeQuote.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-danger/40 hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
                  title="Delete this quote"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </>
          )}

          <button
            onClick={handleAddQuote}
            disabled={quotes.length >= 3}
            title={quotes.length >= 3 ? 'Maximum 3 quotes' : 'Add a quote option'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${
              quotes.length >= 3
                ? 'border border-admin-border-emphasis text-admin-text-faint'
                : 'bg-white text-black hover:bg-white/90'
            }`}
          >
            <Plus size={13} /> Add Quote
          </button>
        </div>
      </div>}

      {/* Quote content */}
      <div className="flex-1 overflow-y-auto admin-scrollbar">
        {!selectedType ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-admin-text-ghost">Select a project phase above to configure pricing.</p>
          </div>
        ) : selectedType === 'scale' ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-admin-text-ghost">Scale proposals use custom quotes — configure pricing directly with the client.</p>
          </div>
        ) : activeQuote ? (
          <div className="p-8 space-y-6">

            {/* Label */}
            <div>
              <label className={labelCls}>Quote label</label>
              <input
                type="text"
                defaultValue={activeQuote.label}
                key={`label-${activeQuote.id}`}
                onBlur={(e) => handleLabelSave(activeQuote, e.target.value)}
                placeholder={QUOTE_CONFIG[activeQuoteIndex]?.defaultLabel ?? `Option ${activeQuoteIndex + 1}`}
                className={inputCls}
              />
            </div>

            {/* Description — all FNA quotes */}
            <div>
              <label className={labelCls}>
                Quote description
              </label>
              <textarea
                key={`desc-${activeQuote.id}`}
                defaultValue={activeQuote.description ?? ''}
                onBlur={(e) => handleDescSave(activeQuote, e.target.value)}
                placeholder="Describe this package..."
                rows={3}
                className={inputCls + ' resize-none leading-relaxed'}
              />
            </div>

            {/* Calculator */}
            <ProposalCalculatorEmbed
              proposalId={proposalId}
              proposalType={proposalType}
              initialQuote={activeQuote}
              isLocked={false}
              typeOverride={selectedType}
              crowdfundingOverride={crowdfundingEnabled}
              saveRef={embedSaveRef}
              onAnyChange={() => { if (readyForDirtyRef.current) { isDirtyRef.current = true; onDirty?.(); } }}
              onAdditionalDiscountChange={(amount) => handleAdditionalDiscountSave(activeQuote, amount)}
              activeQuoteId={activeQuote.id}
              onFnaSave={async (payload) => {
                const id = await saveProposalQuote(
                  proposalId,
                  {
                    ...payload,
                    label: activeQuote.label,
                    description: activeQuote.description,
                    is_fna_quote: true,
                    is_locked: true,
                    defer_payment: false,
                    total_amount: null,
                    down_amount: null,
                  },
                  activeQuote.id,
                );
                return id;
              }}
              onQuoteUpdated={handleQuoteUpdated}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-admin-text-ghost">Setting up quotes…</p>
          </div>
        )}
      </div>
    </div>
  );
});
