'use client';

import { useState, useTransition, useEffect, useRef, useId, useCallback, forwardRef, useImperativeHandle } from 'react';
import { TrendingUp, Eye, EyeOff, Plus, Trash2, Check, X, Hammer, Rocket, Coins, BadgeDollarSign, GripVertical, PenLine, Maximize2, Minimize2, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
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
import { saveProposalQuote, updateQuoteFields, deleteProposalQuote, reorderProposalQuotes, updateProposal } from '@/app/admin/actions';
import { ProposalCalculatorEmbed, type PricingType, type ProposalCalculatorSaveHandle } from '@/components/proposal/ProposalCalculatorEmbed';
import type { ProposalQuoteRow, ProposalType } from '@/types/proposal';

export interface PricingTabHandle {
  isDirty: boolean;
  save: () => Promise<void>;
}

// ── Phase definitions & compatibility rules ─────────────────────────────

const PHASES: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: 'build',        label: 'Build',        Icon: Hammer },
  { value: 'launch',       label: 'Launch',       Icon: Rocket },
  { value: 'scale',        label: 'Scale',        Icon: TrendingUp },
  { value: 'crowdfunding', label: 'Crowdfunding',  Icon: Coins },
  { value: 'fundraising',  label: 'Fundraising',  Icon: BadgeDollarSign },
];

const PHASE_RULES: Record<string, string[]> = {
  build:        ['launch', 'crowdfunding'],
  launch:       ['build', 'crowdfunding'],
  crowdfunding: ['build', 'launch'],
  scale:        [],
  fundraising:  [],
};

// ── Helpers: derive phases ↔ quote fields ───────────────────────────────

function quoteToPhasesArray(q: ProposalQuoteRow): string[] {
  const phases: string[] = [];
  const qt = q.quote_type;
  if (qt === 'build' || qt === 'build-launch') phases.push('build');
  if (qt === 'launch' || qt === 'build-launch') phases.push('launch');
  if (qt === 'scale') phases.push('scale');
  if (qt === 'fundraising') phases.push('fundraising');
  if (q.crowdfunding_enabled) phases.push('crowdfunding');
  return phases;
}

function phasesToQuoteType(phases: string[]): PricingType | null {
  const hasBuild = phases.includes('build');
  const hasLaunch = phases.includes('launch');
  if (hasBuild && hasLaunch) return 'build-launch';
  if (hasBuild) return 'build';
  if (hasLaunch) return 'launch';
  if (phases.includes('scale')) return 'scale';
  if (phases.includes('fundraising')) return 'fundraising';
  return null;
}

function proposalTypeToPhasesArray(pt: ProposalType): string[] {
  const phases: string[] = [];
  if (pt === 'build' || pt === 'build-launch') phases.push('build');
  if (pt === 'launch' || pt === 'build-launch') phases.push('launch');
  if (pt === 'scale') phases.push('scale');
  if (pt === 'fundraising') phases.push('fundraising');
  return phases;
}

// ── Config ──────────────────────────────────────────────────────────────

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
  isConfirmingDelete,
  onSelect,
  onRename,
  onVisibilityToggle,
  onDeleteClick,
  onConfirmDelete,
  onCancelDelete,
}: {
  quote: ProposalQuoteRow;
  index: number;
  isActive: boolean;
  isConfirmingDelete: boolean;
  onSelect: () => void;
  onRename: () => void;
  onVisibilityToggle: () => void;
  onDeleteClick: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
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
  const showIcons = hovered || isConfirmingDelete;

  const iconBtnCls = 'w-5 h-5 flex items-center justify-center rounded transition-colors';

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex items-center gap-1 pl-1.5 pr-1.5 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-admin-bg-active' : 'hover:bg-admin-bg-hover'
      }`}
    >
      <span {...attributes} {...listeners} className="w-4 flex items-center justify-center cursor-grab flex-shrink-0">
        {hovered ? (
          <GripVertical size={12} className="text-admin-text-muted hover:text-admin-text-primary" />
        ) : (
          <span className="text-xs font-mono font-bold text-admin-text-ghost">{index + 1}</span>
        )}
      </span>
      <span
        className={`py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
          isHidden
            ? isActive ? 'text-admin-text-dim' : 'text-admin-text-ghost'
            : isActive ? 'text-admin-text-primary' : 'text-admin-text-dim hover:text-admin-text-secondary'
        }`}
      >
        {quote.label || QUOTE_CONFIG[index]?.defaultLabel || `Option ${index + 1}`}
      </span>
      <motion.span
        animate={{ width: showIcons ? 'auto' : 0, opacity: showIcons ? 1 : 0 }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
        className="flex items-center gap-0.5 overflow-hidden flex-shrink-0"
      >
        {isConfirmingDelete ? (
          <>
            <button onClick={(e) => { e.stopPropagation(); onConfirmDelete(); }} className={`${iconBtnCls} text-admin-danger hover:text-admin-danger-hover`} title="Confirm delete"><Check size={13} /></button>
            <button onClick={(e) => { e.stopPropagation(); onCancelDelete(); }} className={`${iconBtnCls} text-admin-text-faint hover:text-admin-text-secondary`} title="Cancel"><X size={13} /></button>
          </>
        ) : (
          <>
            <button onClick={(e) => { e.stopPropagation(); onRename(); }} className={`${iconBtnCls} text-admin-text-faint hover:text-admin-text-secondary`} title="Rename"><PenLine size={13} /></button>
            <button onClick={(e) => { e.stopPropagation(); onVisibilityToggle(); }} className={`${iconBtnCls} text-admin-text-faint hover:text-admin-text-secondary`} title={isHidden ? 'Show' : 'Hide'}>{isHidden ? <EyeOff size={13} /> : <Eye size={13} />}</button>
            <button onClick={(e) => { e.stopPropagation(); onDeleteClick(); }} className={`${iconBtnCls} text-admin-text-faint hover:text-admin-danger`} title="Delete"><Trash2 size={13} /></button>
          </>
        )}
      </motion.span>
    </div>
  );
}

const labelCls = 'admin-label';
const inputCls = 'admin-input w-full';

// ── PricingTab ──────────────────────────────────────────────────────────

interface PricingTabProps {
  proposalId: string;
  proposalType: ProposalType;
  initialQuotes: ProposalQuoteRow[];
  initialPricingNotes?: string | null;
  initialForcePriorityScheduling?: boolean;
  initialForceAdditionalDiscount?: boolean;
  initialClientAdditionalDiscount?: number;
  initialAllowPayAfterRaise?: boolean;
  initialAllowBuild?: boolean;
  initialAllowLaunch?: boolean;
  initialAllowCrowdfunding?: boolean;
  initialAllowFundraising?: boolean;
  initialForceBuildWithLaunch?: boolean;
  initialForceCrowdfunding?: boolean;
  onDirty?: () => void;
}

export const PricingTab = forwardRef<PricingTabHandle, PricingTabProps>(function PricingTab(
  { proposalId, proposalType, initialQuotes, initialPricingNotes, initialForcePriorityScheduling, initialForceAdditionalDiscount, initialClientAdditionalDiscount, initialAllowPayAfterRaise, initialAllowBuild, initialAllowLaunch, initialAllowCrowdfunding, initialAllowFundraising, initialForceBuildWithLaunch, initialForceCrowdfunding, onDirty }: PricingTabProps,
  ref,
) {
  // ── Quote list state ────────────────────────────────────────────────
  const [quotes, setQuotesRaw] = useState<ProposalQuoteRow[]>(
    [...initialQuotes.filter((q) => !q.deleted_at && q.is_fna_quote)].sort((a, b) => a.sort_order - b.sort_order),
  );
  const quotesRef = useRef(quotes);
  const setQuotes = useCallback((updater: ProposalQuoteRow[] | ((prev: ProposalQuoteRow[]) => ProposalQuoteRow[])) => {
    setQuotesRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      quotesRef.current = next;
      return next;
    });
  }, []);

  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const activeQuote = quotes[activeQuoteIndex] ?? null;
  const activeQuoteId = activeQuote?.id;

  // ── Fullscreen toggle — collapses everything above the quote tabs ───
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Per-quote phase state (derived from active quote) ───────────────
  const activePhases = activeQuote ? quoteToPhasesArray(activeQuote) : [];
  const activePricingType = phasesToQuoteType(activePhases);
  const activeCrowdfunding = activePhases.includes('crowdfunding');

  // ── Controlled description + label state ────────────────────────────
  const [editDesc, setEditDesc] = useState('');
  const editDescRef = useRef('');
  const editLabelRef = useRef('');
  const addlDiscountRef = useRef(0);

  useEffect(() => {
    if (!activeQuote) return;
    const d = activeQuote.description ?? '';
    setEditDesc(d);
    editDescRef.current = d;
    editLabelRef.current = activeQuote.label;
    addlDiscountRef.current = activeQuote.additional_discount ?? 0;
  }, [activeQuoteId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Refs ─────────────────────────────────────────────────────────────
  const isDirtyRef = useRef(false);
  const readyForDirtyRef = useRef(false);
  const embedSaveRef = useRef<ProposalCalculatorSaveHandle | null>(null);
  const activeQuoteIdRef = useRef(quotes[activeQuoteIndex]?.id);
  activeQuoteIdRef.current = quotes[activeQuoteIndex]?.id;

  // ── Unified save — single path for all quote fields ─────────────────
  const saveDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const flushSave = useCallback(async () => {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    const q = quotesRef.current.find((r) => r.id === activeQuoteIdRef.current);
    if (!q || !embedSaveRef.current) return;
    const snapshot = embedSaveRef.current.getState();
    const description = editDescRef.current.trim() || null;
    const label = editLabelRef.current;
    const additional_discount = addlDiscountRef.current;
    await saveProposalQuote(proposalId, {
      ...snapshot,
      label,
      description,
      additional_discount,
      is_fna_quote: true,
      is_locked: true,
      defer_payment: false,
      total_amount: null,
      down_amount: null,
    }, q.id);
    isDirtyRef.current = false;
    setQuotes((prev) => prev.map((r) => r.id === q.id
      ? { ...r, ...snapshot, description, label, additional_discount }
      : r));
  }, [proposalId]); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleSave = useCallback(() => {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => { void flushSave(); }, 1500);
  }, [flushSave]);

  // Only accept dirty signals after mount settles
  useEffect(() => {
    const id = requestAnimationFrame(() => { readyForDirtyRef.current = true; });
    return () => cancelAnimationFrame(id);
  }, []);

  useImperativeHandle(ref, () => ({
    get isDirty() { return isDirtyRef.current; },
    save: async () => { await flushSave(); },
  }));

  // ── Per-quote phase toggle ──────────────────────────────────────────
  // Standalone phases (scale, fundraising) replace everything.
  // Combinable phases (build, launch, crowdfunding) toggle on/off.
  const handlePhaseToggle = (phase: string) => {
    if (!activeQuote) return;
    const current = quoteToPhasesArray(activeQuote);
    const active = current.includes(phase);
    let next: string[];

    const isStandalone = PHASE_RULES[phase]?.length === 0; // scale, fundraising

    if (active) {
      // Deselect — remove this phase
      next = current.filter((p) => p !== phase);
    } else if (isStandalone) {
      // Standalone replaces all existing phases
      next = [phase];
    } else if (phase === 'crowdfunding' && current.length === 0) {
      next = ['build', 'crowdfunding'];
    } else {
      // Adding a combinable phase — drop any standalone phases first
      const withoutStandalone = current.filter((p) => (PHASE_RULES[p]?.length ?? 0) > 0);
      next = [...withoutStandalone, phase];
    }

    const newType = phasesToQuoteType(next) ?? 'build';
    const newCrowdfunding = next.includes('crowdfunding');

    setQuotes((prev) => prev.map((q) => q.id === activeQuote.id
      ? { ...q, quote_type: next.length === 0 ? '' : newType, crowdfunding_enabled: newCrowdfunding }
      : q));
    void updateQuoteFields(activeQuote.id, {
      quote_type: next.length === 0 ? '' : newType,
      crowdfunding_enabled: newCrowdfunding,
    });
  };

  const isPhaseDisabled = (phase: string): boolean => {
    if (phase === 'scale') return true; // Scale is a placeholder — not yet available
    if (activePhases.includes(phase)) return false; // can always deselect
    if (activePhases.length === 0) return false; // can select anything when empty
    const isStandalone = PHASE_RULES[phase]?.length === 0;
    if (isStandalone) return false; // standalone phases can always be clicked (they replace)
    // For combinable phases, check compatibility with all current non-standalone phases
    const combinableActive = activePhases.filter((p) => (PHASE_RULES[p]?.length ?? 0) > 0);
    if (combinableActive.length === 0) return false;
    return !combinableActive.every((p) => PHASE_RULES[p]?.includes(phase) ?? false);
  };

  const handleAdditionalDiscountSave = (quote: ProposalQuoteRow, amount: number) => {
    if (amount === (quote.additional_discount ?? 0)) return;
    addlDiscountRef.current = amount;
    setQuotes((prev) => prev.map((q) => (q.id === quote.id ? { ...q, additional_discount: amount } : q)));
    scheduleSave();
  };

  // ── Quote switching — flush pending save, then switch ───────────────
  const handleQuoteSwitch = (i: number) => {
    if (isDirtyRef.current) {
      void flushSave();
    }
    isDirtyRef.current = false;
    setActiveQuoteIndex(i);
  };

  // ── Rename state ─────────────────────────────────────────────────────
  const [renamingQuoteId, setRenamingQuoteId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleStartRename = (quote: ProposalQuoteRow) => {
    setRenamingQuoteId(quote.id);
    setRenameValue(quote.label);
    setTimeout(() => renameInputRef.current?.select(), 0);
  };

  const handleFinishRename = () => {
    if (!renamingQuoteId) return;
    const trimmed = renameValue.trim();
    if (trimmed) {
      setQuotes((prev) => prev.map((q) => q.id === renamingQuoteId ? { ...q, label: trimmed } : q));
      void updateQuoteFields(renamingQuoteId, { label: trimmed });
      // Sync label ref if renaming the active quote
      if (renamingQuoteId === activeQuoteId) {
        editLabelRef.current = trimmed;
      }
    }
    setRenamingQuoteId(null);
  };

  // ── Pricing notes (universal) ───────────────────────────────────────
  const DEFAULT_PRICING_NOTES = 'Choose the package that works for your budget.';
  const [pricingNotes, setPricingNotes] = useState(initialPricingNotes || DEFAULT_PRICING_NOTES);

  const handlePricingNotesSave = () => {
    void updateProposal(proposalId, { pricing_notes: pricingNotes.trim() || null });
  };

  // ── Force priority scheduling (proposal-level, applies to client quotes) ─
  const [forcePriorityScheduling, setForcePriorityScheduling] = useState(initialForcePriorityScheduling ?? false);

  const handleForcePrioritySchedulingChange = (force: boolean) => {
    setForcePriorityScheduling(force);
    void updateProposal(proposalId, { force_priority_scheduling: force });
  };

  // ── Force additional discount (proposal-level, applies to client quotes) ─
  const [forceAdditionalDiscount, setForceAdditionalDiscount] = useState(initialForceAdditionalDiscount ?? false);
  const [clientAdditionalDiscount, setClientAdditionalDiscount] = useState(initialClientAdditionalDiscount ?? 0);

  const handleForceAdditionalDiscountChange = (force: boolean) => {
    setForceAdditionalDiscount(force);
    void updateProposal(proposalId, { force_additional_discount: force });
  };

  const handleClientAdditionalDiscountChange = (amount: number) => {
    setClientAdditionalDiscount(amount);
    void updateProposal(proposalId, { client_additional_discount: amount });
  };

  // ── User quote permissions (proposal-level) ────────────────────────
  const [allowPayAfterRaise, setAllowPayAfterRaise] = useState(initialAllowPayAfterRaise ?? false);
  const [allowBuild, setAllowBuild] = useState(initialAllowBuild ?? true);
  const [allowLaunch, setAllowLaunch] = useState(initialAllowLaunch ?? true);
  const [allowCrowdfunding, setAllowCrowdfunding] = useState(initialAllowCrowdfunding ?? false);
  const [allowFundraising, setAllowFundraising] = useState(initialAllowFundraising ?? false);
  const [forceBuildWithLaunch, setForceBuildWithLaunch] = useState(initialForceBuildWithLaunch ?? true);
  const [forceCrowdfunding, setForceCrowdfunding] = useState(initialForceCrowdfunding ?? false);

  const handleUserQuoteToggle = (field: string, value: boolean) => {
    switch (field) {
      case 'allow_pay_after_raise': setAllowPayAfterRaise(value); break;
      case 'allow_build': setAllowBuild(value); break;
      case 'allow_launch': setAllowLaunch(value); break;
      case 'allow_crowdfunding': setAllowCrowdfunding(value); break;
      case 'allow_fundraising': setAllowFundraising(value); break;
      case 'force_build_with_launch': setForceBuildWithLaunch(value); break;
      case 'force_crowdfunding': setForceCrowdfunding(value); break;
    }
    void updateProposal(proposalId, { [field]: value });
  };

  // ── Visibility toggle ──────────────────────────────────────────────
  const handleVisibilityToggle = (quote: ProposalQuoteRow) => {
    const visible = !quote.visible;
    setQuotes((prev) => prev.map((q) => (q.id === quote.id ? { ...q, visible } : q)));
    void updateQuoteFields(quote.id, { visible });
  };

  // ── Auto-create Recommended on first open ──────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current || quotes.length > 0) return;
    initRef.current = true;

    const defaultPhases = proposalTypeToPhasesArray(proposalType);
    const defaultType = phasesToQuoteType(defaultPhases) ?? proposalType;
    const defaultCrowdfunding = defaultPhases.includes('crowdfunding');

    (async () => {
      const id = await saveProposalQuote(proposalId, {
        label: 'Recommended',
        is_fna_quote: true,
        is_locked: true,
        sort_order: 0,
        visible: true,
        quote_type: defaultType,
        selected_addons: {},
        slider_values: {},
        tier_selections: {},
        location_days: {},
        photo_count: 0,
        crowdfunding_enabled: defaultCrowdfunding,
        crowdfunding_tier: 0,
        fundraising_enabled: defaultType === 'fundraising',
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
        is_locked: true, is_fna_quote: true, quote_type: defaultType,
        selected_addons: {}, slider_values: {}, tier_selections: {},
        location_days: {}, photo_count: 0, crowdfunding_enabled: defaultCrowdfunding,
        crowdfunding_tier: 0, fundraising_enabled: defaultType === 'fundraising',
        fundraising_tier: 0, defer_payment: false,
        friendly_discount_pct: 0, additional_discount: 0, total_amount: null, down_amount: null,
        sort_order: 0, visible: true, description: null,
        created_at: now, updated_at: now, deleted_at: null, viewer_email: null,
        hide_deferred_payment: false, force_priority_scheduling: false,
      }]);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Add quote ─────────────────────────────────────────────────────
  const handleAddQuote = async () => {
    if (quotes.length >= 3) return;
    const i = quotes.length;
    const config = QUOTE_CONFIG[i];
    const defaultPhases = proposalTypeToPhasesArray(proposalType);
    const defaultType = phasesToQuoteType(defaultPhases) ?? proposalType;
    const defaultCrowdfunding = defaultPhases.includes('crowdfunding');

    const id = await saveProposalQuote(proposalId, {
      label: config.defaultLabel,
      is_fna_quote: true,
      is_locked: true,
      sort_order: i,
      visible: true,
      quote_type: defaultType,
      selected_addons: {},
      slider_values: {},
      tier_selections: {},
      location_days: {},
      photo_count: 0,
      crowdfunding_enabled: defaultCrowdfunding,
      crowdfunding_tier: 0,
      fundraising_enabled: defaultType === 'fundraising',
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
        is_locked: true, is_fna_quote: true, quote_type: defaultType,
        selected_addons: {}, slider_values: {}, tier_selections: {},
        location_days: {}, photo_count: 0, crowdfunding_enabled: defaultCrowdfunding,
        crowdfunding_tier: 0, fundraising_enabled: defaultType === 'fundraising',
        fundraising_tier: 0, defer_payment: false,
        friendly_discount_pct: 0, additional_discount: 0, total_amount: null, down_amount: null,
        sort_order: i, visible: true, description: null,
        created_at: now, updated_at: now, deleted_at: null, viewer_email: null,
        hide_deferred_payment: false, force_priority_scheduling: false,
      },
    ]);
    setActiveQuoteIndex(i);
  };

  // ── Delete quote ──────────────────────────────────────────────────
  const handleConfirmDelete = async (quoteId: string) => {
    await deleteProposalQuote(quoteId);
    setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
    setActiveQuoteIndex(0);
    setConfirmDeleteId(null);
  };

  // ── Drag-reorder quotes ───────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Pricing notes + user quote options */}
      <div className={`flex gap-6 px-8 pt-5 pb-3 border-b border-admin-border flex-shrink-0 ${isFullscreen ? 'hidden' : ''}`}>
        <div className="flex-1 min-w-0 flex flex-col">
          <label className={labelCls}>Slide description</label>
          <textarea
            value={pricingNotes}
            onChange={(e) => setPricingNotes(e.target.value)}
            onBlur={handlePricingNotesSave}
            placeholder="Choose the package that works for your budget."
            className={inputCls + ' resize-none leading-relaxed flex-1'}
          />
        </div>
        <div className="flex-shrink-0">
          <label className={labelCls}>User Quotes</label>
          <div className="mt-1 flex flex-col gap-1.5">
            <div className="flex items-center gap-3 h-6">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={allowBuild} onChange={(e) => handleUserQuoteToggle('allow_build', e.target.checked)} className="accent-admin-accent" />
                <span className="text-admin-sm text-admin-text-muted">Build</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={allowLaunch} onChange={(e) => handleUserQuoteToggle('allow_launch', e.target.checked)} className="accent-admin-accent" />
                <span className="text-admin-sm text-admin-text-muted">Launch</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={allowCrowdfunding} onChange={(e) => handleUserQuoteToggle('allow_crowdfunding', e.target.checked)} className="accent-admin-accent" />
                <span className="text-admin-sm text-admin-text-muted">Crowdfunding</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={allowFundraising} onChange={(e) => handleUserQuoteToggle('allow_fundraising', e.target.checked)} className="accent-admin-accent" />
                <span className="text-admin-sm text-admin-text-muted">Fundraising</span>
              </label>
            </div>
            <label className="flex items-center gap-2 h-6 cursor-pointer">
              <input type="checkbox" checked={forceBuildWithLaunch} onChange={(e) => handleUserQuoteToggle('force_build_with_launch', e.target.checked)} className="accent-admin-accent" />
              <span className="text-admin-sm text-admin-text-muted">Force Build with Launch</span>
            </label>
            <label className="flex items-center gap-2 h-6 cursor-pointer">
              <input type="checkbox" checked={forceCrowdfunding} onChange={(e) => handleUserQuoteToggle('force_crowdfunding', e.target.checked)} className="accent-admin-accent" />
              <span className="text-admin-sm text-admin-text-muted">Force Crowdfunding</span>
            </label>
            <label className="flex items-center gap-2 h-6 cursor-pointer">
              <input type="checkbox" checked={allowPayAfterRaise} onChange={(e) => handleUserQuoteToggle('allow_pay_after_raise', e.target.checked)} className="accent-admin-accent" />
              <span className="text-admin-sm text-admin-text-muted">Allow pay after campaign toggle</span>
            </label>
            <label className="flex items-center gap-2 h-6 cursor-pointer">
              <input type="checkbox" checked={forcePriorityScheduling} onChange={(e) => handleForcePrioritySchedulingChange(e.target.checked)} className="accent-admin-accent" />
              <span className="text-admin-sm text-admin-text-muted">Force priority scheduling</span>
            </label>
            <label className="flex items-center gap-2 h-6 cursor-pointer">
              <input type="checkbox" checked={forceAdditionalDiscount} onChange={(e) => handleForceAdditionalDiscountChange(e.target.checked)} className="accent-admin-accent" />
              <span className="text-admin-sm text-admin-text-muted">Add&apos;l discount</span>
              <div className="relative" onClick={(e) => e.preventDefault()}>
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-admin-text-muted font-mono text-xs">$</span>
                <input
                  type="number"
                  defaultValue={clientAdditionalDiscount || ''}
                  onBlur={(e) => handleClientAdditionalDiscountChange(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min={0}
                  step={50}
                  disabled={!forceAdditionalDiscount}
                  className="w-20 h-6 pl-5 pr-2 bg-admin-bg-base border border-admin-border rounded-admin-sm text-admin-text-primary font-mono text-admin-sm disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Quote tabs nav — always visible */}
      <div className="flex items-center gap-1 px-6 @md:px-8 h-[3rem] border-b border-admin-border flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setIsFullscreen((v) => !v)}
          title={isFullscreen ? 'Exit fullscreen' : 'Expand quote area'}
          className="flex items-center justify-center w-8 h-8 mr-1 rounded-admin-sm text-admin-text-dim hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0"
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <DndContext id={dndId} sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={quotes.map((q) => q.id)} strategy={horizontalListSortingStrategy}>
            {quotes.map((q, i) => (
              renamingQuoteId === q.id ? (
                <div key={q.id} className="flex items-center gap-1 bg-admin-bg-active rounded-lg px-2 py-1">
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleFinishRename}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleFinishRename(); if (e.key === 'Escape') setRenamingQuoteId(null); }}
                    className="w-32 h-6 px-2 bg-admin-bg-base border border-admin-border rounded-admin-sm text-admin-text-primary text-sm"
                    autoFocus
                  />
                </div>
              ) : (
                <SortableQuoteTab
                  key={q.id}
                  quote={q}
                  index={i}
                  isActive={i === activeQuoteIndex}
                  isConfirmingDelete={confirmDeleteId === q.id}
                  onSelect={() => handleQuoteSwitch(i)}
                  onRename={() => handleStartRename(q)}
                  onVisibilityToggle={() => handleVisibilityToggle(q)}
                  onDeleteClick={() => setConfirmDeleteId(q.id)}
                  onConfirmDelete={() => handleConfirmDelete(q.id)}
                  onCancelDelete={() => setConfirmDeleteId(null)}
                />
              )
            ))}
          </SortableContext>
        </DndContext>

        <div className="ml-auto flex items-center gap-1">
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
      </div>

      {/* Quote content */}
      <div className="flex-1 overflow-y-auto admin-scrollbar">
        {activeQuote ? (
          <div className="px-6 @md:px-8 py-5 space-y-5">

            {/* Description */}
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => { setEditDesc(e.target.value); editDescRef.current = e.target.value; scheduleSave(); }}
                placeholder="Describe this package..."
                rows={3}
                className={inputCls + ' resize-none leading-relaxed'}
              />
            </div>

            {/* Per-quote phase buttons */}
            <div className="flex items-center gap-1.5 flex-wrap -mb-[3px]">
              {PHASES.map(({ value, label, Icon }) => {
                const active = activePhases.includes(value);
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

            {/* Calculator */}
            {activePricingType ? (
              <ProposalCalculatorEmbed
                proposalId={proposalId}
                proposalType={proposalType}
                initialQuote={activeQuote}
                isLocked={false}
                typeOverride={activePricingType}
                crowdfundingOverride={activeCrowdfunding}
                saveRef={embedSaveRef}
                standalone
                hideDeferredPayment={activeQuote.hide_deferred_payment}
                onAnyChange={() => {
                  scheduleSave();
                  if (readyForDirtyRef.current) { isDirtyRef.current = true; onDirty?.(); }
                }}
                onAdditionalDiscountChange={(amount) => handleAdditionalDiscountSave(activeQuote, amount)}
                activeQuoteId={activeQuote.id}
              />
            ) : (
              <p className="text-sm text-admin-text-ghost py-8 text-center">Select a project phase above to configure pricing.</p>
            )}
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
