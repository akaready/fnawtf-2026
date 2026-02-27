'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, Check, X, GripVertical } from 'lucide-react';
import { saveProposalQuote, deleteProposalQuote, updateProposal, reorderProposalQuotes } from '@/app/admin/actions';
import { ProposalCalculatorEmbed } from '@/components/proposal/ProposalCalculatorEmbed';
import type { ProposalQuoteRow, ProposalType } from '@/types/proposal';

interface PricingTabProps {
  proposalId: string;
  proposalType: ProposalType;
  crowdfundingApproved: boolean;
  initialQuotes: ProposalQuoteRow[];
}

const labelCls = 'block text-xs text-white/50 uppercase tracking-wide mb-1';
const inputCls =
  'w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-white/20';

export function PricingTab({ proposalId, proposalType, crowdfundingApproved: initialCrowdfunding, initialQuotes }: PricingTabProps) {
  const [quotes, setQuotes] = useState<ProposalQuoteRow[]>(
    [...initialQuotes.filter((q) => !q.deleted_at)].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [crowdfundingApproved, setCrowdfundingApproved] = useState(initialCrowdfunding);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const activeQuote = quotes[activeQuoteIndex] ?? null;

  // ── Label save ──────────────────────────────────────────────────────────
  const handleLabelSave = (quote: ProposalQuoteRow, label: string) => {
    if (label === quote.label) return;
    startTransition(async () => {
      await saveProposalQuote(proposalId, { ...quote, label }, quote.id);
      setQuotes((prev) => prev.map((q) => (q.id === quote.id ? { ...q, label } : q)));
    });
  };

  // ── Description save (first position only) ─────────────────────────────
  const handleDescSave = (quote: ProposalQuoteRow, description: string) => {
    if (description === (quote.description ?? '')) return;
    const descValue = description.trim() || null;
    startTransition(async () => {
      await saveProposalQuote(proposalId, { ...quote, description: descValue }, quote.id);
      setQuotes((prev) => prev.map((q) => (q.id === quote.id ? { ...q, description: descValue } : q)));
    });
  };

  // ── Add quote ───────────────────────────────────────────────────────────
  const handleAddQuote = async () => {
    if (quotes.length >= 3) return;
    const label =
      quotes.length === 0 ? 'Option 1' : quotes.length === 1 ? 'Option 2' : 'Option 3';
    const sortOrder = quotes.length;
    const newQuoteData = {
      label,
      is_fna_quote: true,
      is_locked: true,
      sort_order: sortOrder,
      quote_type:
        proposalType === 'build-launch' ? 'build'
        : proposalType === 'scale' ? 'build'
        : proposalType,
      selected_addons: {} as Record<string, number>,
      slider_values: {} as Record<string, number>,
      tier_selections: {} as Record<string, string>,
      location_days: {} as Record<string, number[]>,
      photo_count: 0,
      crowdfunding_enabled: false,
      crowdfunding_tier: 0,
      fundraising_enabled: false,
      defer_payment: false,
      friendly_discount_pct: 0,
      total_amount: null,
      down_amount: null,
      description: null,
    };
    const id = await saveProposalQuote(proposalId, newQuoteData);
    const now = new Date().toISOString();
    setQuotes((prev) => [
      ...prev,
      {
        id,
        proposal_id: proposalId,
        label,
        is_locked: true,
        is_fna_quote: true,
        quote_type: proposalType,
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
        sort_order: sortOrder,
        description: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);
    setActiveQuoteIndex(quotes.length);
  };

  // ── Delete quote ────────────────────────────────────────────────────────
  const handleConfirmDelete = async (quoteId: string) => {
    await deleteProposalQuote(quoteId);
    setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
    setActiveQuoteIndex(0);
    setConfirmDeleteId(null);
  };

  // ── Drag-and-drop reorder ───────────────────────────────────────────────
  const handleDragStart = (i: number) => setDragIndex(i);
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    setQuotes((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(i, 0, moved);
      // Keep activeQuote focused on the same quote
      return next;
    });
    // Update active index to follow the active quote
    setActiveQuoteIndex((prev) => {
      if (prev === dragIndex) return i;
      if (dragIndex < i && prev > dragIndex && prev <= i) return prev - 1;
      if (dragIndex > i && prev >= i && prev < dragIndex) return prev + 1;
      return prev;
    });
    setDragIndex(i);
  };
  const handleDragEnd = () => {
    setDragIndex(null);
    startTransition(async () => {
      await reorderProposalQuotes(quotes.map((q) => q.id));
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Nav bar — quote tabs + add + delete */}
      <div className="flex items-center gap-1 px-8 py-2 border-b border-white/[0.08] bg-white/[0.02] flex-shrink-0">
        {quotes.map((q, i) => (
          <div
            key={q.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            className={`group/tab flex items-center rounded-lg transition-colors ${
              dragIndex === i ? 'opacity-50' : ''
            } ${
              i === activeQuoteIndex
                ? 'bg-white/10'
                : 'hover:bg-white/5'
            }`}
          >
            <GripVertical
              size={12}
              className="ml-3 text-white/0 group-hover/tab:text-white/25 cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors"
            />
            <button
              onClick={() => setActiveQuoteIndex(i)}
              className={`pl-1.5 pr-3 py-1.5 text-sm font-medium transition-colors ${
                i === activeQuoteIndex ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {q.label || `Option ${i + 1}`}
            </button>
          </div>
        ))}

        <button
          onClick={handleAddQuote}
          disabled={quotes.length >= 3}
          title={quotes.length >= 3 ? 'Maximum 3 quotes' : 'Add a quote option'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={13} /> Add Quote
        </button>

        {quotes.length > 1 && activeQuote && (
          <div className="ml-auto flex items-center gap-1">
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
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
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
          </div>
        )}
      </div>

      {/* Quote content */}
      <div className="flex-1 overflow-y-auto">
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
                placeholder={`Option ${activeQuoteIndex + 1}`}
                className={inputCls}
              />
            </div>

            {/* Description — first position only */}
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

            {/* Crowdfunding toggle */}
            <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-white/[0.08] bg-white/[0.02]">
              <div>
                <p className="text-sm text-white/70 font-medium">Crowdfunding</p>
                <p className="text-xs text-white/30 mt-0.5">Allow client to enable crowdfunding on this proposal</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={crowdfundingApproved}
                  onChange={async (e) => {
                    const val = e.target.checked;
                    setCrowdfundingApproved(val);
                    await updateProposal(proposalId, { crowdfunding_approved: val });
                  }}
                  className="w-4 h-4 rounded border border-white/20 bg-white/[0.04] accent-white cursor-pointer"
                />
              </label>
            </div>

            {/* Calculator */}
            <ProposalCalculatorEmbed
              proposalId={proposalId}
              proposalType={proposalType}
              initialQuote={activeQuote}
              crowdfundingApproved={crowdfundingApproved}
              isLocked={false}
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
              onQuoteUpdated={(payload) => {
                setQuotes((prev) =>
                  prev.map((q) =>
                    q.id === activeQuote.id ? { ...q, ...payload } : q,
                  ),
                );
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <button
              onClick={handleAddQuote}
              className="btn-primary px-6 py-2.5 text-sm"
            >
              + Create First Quote
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
