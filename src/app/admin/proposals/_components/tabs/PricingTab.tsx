'use client';

import { useState, useTransition, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Star, TrendingUp, TrendingDown, Eye, EyeOff, Plus, Trash2, Check, X, Hammer, Rocket, Megaphone, Coins, Layers, type LucideIcon } from 'lucide-react';
import { saveProposalQuote, deleteProposalQuote, updateProposal } from '@/app/admin/actions';
import { ProposalCalculatorEmbed, type PricingType, type ProposalCalculatorSaveHandle, type CalculatorStateSnapshot } from '@/components/proposal/ProposalCalculatorEmbed';
import type { ProposalQuoteRow, ProposalType } from '@/types/proposal';

export interface PricingTabHandle {
  isDirty: boolean;
  save: () => Promise<void>;
}

const TYPE_BUTTONS: { type: PricingType; label: string; Icon: LucideIcon }[] = [
  { type: 'build',        label: 'Build',       Icon: Hammer },
  { type: 'build-launch', label: 'Build+Launch', Icon: Layers },
  { type: 'launch',       label: 'Launch',       Icon: Rocket },
  { type: 'scale',        label: 'Scale',        Icon: TrendingUp },
  { type: 'fundraising',  label: 'Fundraising',  Icon: Megaphone },
];

function initType(proposalType: ProposalType): PricingType {
  if (proposalType === 'build-launch') return 'build-launch';
  if (proposalType === 'scale') return 'scale';
  if (proposalType === 'fundraising') return 'fundraising';
  if (proposalType === 'launch') return 'launch';
  return 'build';
}

interface PricingTabProps {
  proposalId: string;
  proposalType: ProposalType;
  initialQuotes: ProposalQuoteRow[];
  onProposalTypeChange?: (type: ProposalType) => void;
}

// Fixed config — 5 slots: Recommended, Premium, Affordable, Option B, Option C
const QUOTE_CONFIG = [
  { defaultLabel: 'Recommended', canHide: false },
  { defaultLabel: 'Premium',     canHide: true  },
  { defaultLabel: 'Affordable',  canHide: true  },
  { defaultLabel: 'Option B',    canHide: true  },
  { defaultLabel: 'Option C',    canHide: true  },
] as const;

function QuoteIcon({ index, className }: { index: number; className?: string }) {
  if (index === 0) return <Star size={12} className={className} />;
  if (index === 1) return <TrendingUp size={12} className={className} />;
  if (index === 2) return <TrendingDown size={12} className={className} />;
  return (
    <span className={`text-[10px] font-bold leading-none select-none ${className ?? ''}`}>
      {index === 3 ? 'B' : 'C'}
    </span>
  );
}

const labelCls = 'block text-xs text-[#808080] uppercase tracking-wide mb-1';
const inputCls =
  'w-full bg-black/40 border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-[#333]';

export const PricingTab = forwardRef<PricingTabHandle, PricingTabProps>(function PricingTab(
  { proposalId, proposalType, initialQuotes, onProposalTypeChange }: PricingTabProps,
  ref,
) {
  const [quotes, setQuotes] = useState<ProposalQuoteRow[]>(
    [...initialQuotes.filter((q) => !q.deleted_at)].sort((a, b) => a.sort_order - b.sort_order),
  );
  const [selectedType, setSelectedType] = useState<PricingType>(() => initType(proposalType));
  const [crowdfundingEnabled, setCrowdfundingEnabled] = useState(false);

  // Sync type bar when parent changes proposal_type (e.g. saved from DetailsTab)
  useEffect(() => {
    setSelectedType(initType(proposalType));
  }, [proposalType]);
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
        updateProposal(proposalId, { proposal_type: selectedType }),
      ]);
    },
  }));

  const handleTypeChange = (type: PricingType) => {
    setSelectedType(type);
    onProposalTypeChange?.(type as ProposalType);
    if (type === 'fundraising' || type === 'scale') setCrowdfundingEnabled(false);
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
        defer_payment: false,
        friendly_discount_pct: 0,
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
        crowdfunding_tier: 0, fundraising_enabled: false, defer_payment: false,
        friendly_discount_pct: 0, total_amount: null, down_amount: null,
        sort_order: 0, visible: true, description: null,
        created_at: now, updated_at: now, deleted_at: null,
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
    if (quotes.length >= 5) return;
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
        crowdfunding_tier: 0, fundraising_enabled: false, defer_payment: false,
        friendly_discount_pct: 0, total_amount: null, down_amount: null,
        sort_order: i, visible: true, description: null,
        created_at: now, updated_at: now, deleted_at: null,
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

  return (
    <div className="flex flex-col h-full">
      {/* Proposal-level type + crowdfunding bar — universal, applies to all quotes */}
      <div className="flex items-center gap-1.5 px-6 @md:px-8 h-[3rem] border-b border-[#2a2a2a] flex-shrink-0 sticky top-0 z-10 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {TYPE_BUTTONS.map(({ type, label, Icon }) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
              selectedType === type ? 'bg-white/10 text-white' : 'text-[#666] hover:text-[#999]'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
        {(selectedType === 'build' || selectedType === 'build-launch' || selectedType === 'launch') && (
          <button
            onClick={() => setCrowdfundingEnabled((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ml-1 ${
              crowdfundingEnabled ? 'bg-white/10 text-white' : 'text-[#666] hover:text-[#999]'
            }`}
          >
            <Coins size={14} />
            Crowdfunding?
          </button>
        )}
      </div>

      {/* Quote tabs nav */}
      <div className="flex items-center gap-1 px-6 @md:px-8 h-[3rem] border-b border-[#2a2a2a] flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {quotes.map((q, i) => {
          const canHide = i > 0;
          const isHidden = q.visible === false;
          return (
            <div
              key={q.id}
              onClick={() => handleQuoteSwitch(i)}
              className={`group/tab flex items-center rounded-lg cursor-pointer transition-colors ${
                i === activeQuoteIndex ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              {/* Icon → eye toggle on hover (hideable quotes only) */}
              <div className="ml-3 w-3 flex items-center justify-center flex-shrink-0">
                {canHide ? (
                  <>
                    <QuoteIcon
                      index={i}
                      className={`group-hover/tab:hidden transition-colors ${
                        isHidden
                          ? i === activeQuoteIndex ? 'text-[#4d4d4d]' : 'text-white/15'
                          : i === activeQuoteIndex ? 'text-[#999]' : 'text-[#404040]'
                      }`}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleVisibilityToggle(q); }}
                      className="hidden group-hover/tab:flex items-center justify-center text-[#4d4d4d] hover:text-[#b3b3b3] transition-colors"
                      title={isHidden ? 'Show quote' : 'Hide quote'}
                    >
                      {isHidden
                        ? <EyeOff size={12} />
                        : <Eye size={12} />
                      }
                    </button>
                  </>
                ) : (
                  <QuoteIcon
                    index={i}
                    className={i === activeQuoteIndex ? 'text-[#999]' : 'text-[#404040]'}
                  />
                )}
              </div>

              <span
                className={`pl-1.5 pr-3 py-1.5 text-sm font-medium transition-colors ${
                  isHidden
                    ? i === activeQuoteIndex ? 'text-[#666]' : 'text-[#333]'
                    : i === activeQuoteIndex ? 'text-white' : 'text-[#666] group-hover/tab:text-[#b3b3b3]'
                }`}
              >
                {q.label || QUOTE_CONFIG[i]?.defaultLabel || `Option ${i + 1}`}
              </span>
            </div>
          );
        })}

        {/* Right: Add + Delete */}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={handleAddQuote}
            disabled={quotes.length >= 5}
            title={quotes.length >= 5 ? 'Maximum 5 quotes' : 'Add a quote option'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${
              quotes.length >= 5
                ? 'border border-white/20 text-[#4d4d4d]'
                : 'bg-white text-black hover:bg-white/90'
            }`}
          >
            <Plus size={13} /> Add Quote
          </button>

          {activeQuoteIndex > 0 && activeQuote && (
            <>
              {confirmDeleteId === activeQuote.id ? (
                <>
                  <button
                    onClick={() => handleConfirmDelete(activeQuote.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    title="Confirm delete"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4d4d4d] hover:text-[#b3b3b3] hover:bg-white/5 transition-colors"
                    title="Cancel"
                  >
                    <X size={13} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(activeQuote.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete this quote"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quote content */}
      <div className="flex-1 overflow-y-auto admin-scrollbar">
        {activeQuote ? (
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

            {/* Description — Recommended only */}
            {activeQuoteIndex === 0 && (
              <div>
                <label className={labelCls}>
                  Recommended quote description (shown to client)
                </label>
                <textarea
                  key={`desc-${activeQuote.id}`}
                  defaultValue={activeQuote.description ?? ''}
                  onBlur={(e) => handleDescSave(activeQuote, e.target.value)}
                  placeholder="Describe this recommended package..."
                  rows={3}
                  className={inputCls + ' resize-none leading-relaxed'}
                />
              </div>
            )}

            {/* Calculator */}
            <ProposalCalculatorEmbed
              proposalId={proposalId}
              proposalType={proposalType}
              initialQuote={activeQuote}
              isLocked={false}
              typeOverride={selectedType}
              crowdfundingOverride={crowdfundingEnabled}
              saveRef={embedSaveRef}
              onAnyChange={() => { if (readyForDirtyRef.current) isDirtyRef.current = true; }}
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
            <p className="text-sm text-[#333]">Setting up quotes…</p>
          </div>
        )}
      </div>
    </div>
  );
});
