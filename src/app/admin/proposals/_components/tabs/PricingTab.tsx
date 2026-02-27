'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { saveProposalQuote, deleteProposalQuote, updateProposal } from '@/app/admin/actions';
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
  'w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-white/20';

export function PricingTab({ proposalId, proposalType, crowdfundingApproved: initialCrowdfunding, initialQuotes }: PricingTabProps) {
  const [quotes, setQuotes] = useState<ProposalQuoteRow[]>(initialQuotes.filter((q) => !q.deleted_at));
  const [crowdfundingApproved, setCrowdfundingApproved] = useState(initialCrowdfunding);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const activeQuote = quotes[activeQuoteIndex] ?? null;

  // ── Label save ──────────────────────────────────────────────────────────
  const handleLabelSave = (quote: ProposalQuoteRow, label: string) => {
    if (label === quote.label) return;
    startTransition(async () => {
      await saveProposalQuote(
        proposalId,
        {
          ...quote,
          label,
        },
        quote.id,
      );
      setQuotes((prev) => prev.map((q) => (q.id === quote.id ? { ...q, label } : q)));
    });
  };

  // ── Description save (first quote only) ────────────────────────────────
  const handleDescSave = (quote: ProposalQuoteRow, description: string) => {
    if (description === (quote.description ?? '')) return;
    const descValue = description.trim() || null;
    startTransition(async () => {
      await saveProposalQuote(
        proposalId,
        {
          ...quote,
          description: descValue,
        },
        quote.id,
      );
      setQuotes((prev) => prev.map((q) => (q.id === quote.id ? { ...q, description: descValue } : q)));
    });
  };

  // ── Add quote ───────────────────────────────────────────────────────────
  const handleAddQuote = async () => {
    if (quotes.length >= 3) return;
    const label =
      quotes.length === 0 ? 'Option 1' : quotes.length === 1 ? 'Option 2' : 'Option 3';
    const newQuoteData = {
      label,
      is_fna_quote: true,
      is_locked: true,
      quote_type:
        proposalType === 'build-launch'
          ? 'build'
          : proposalType === 'scale'
          ? 'build'
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

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-8 pt-4 pb-0 border-b border-white/[0.08]">
        {quotes.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setActiveQuoteIndex(i)}
            className={`px-5 py-2.5 text-sm transition-colors rounded-t-lg ${
              i === activeQuoteIndex
                ? 'text-white border-b-2 border-white -mb-px'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {q.label || `Option ${i + 1}`}
          </button>
        ))}

        <button
          onClick={handleAddQuote}
          disabled={quotes.length >= 3}
          title={quotes.length >= 3 ? 'Maximum 3 quotes' : 'Add a quote option'}
          className="px-4 py-2.5 text-sm text-white/30 hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          + Add Quote
        </button>

        {/* Crowdfunding toggle — right side of tab bar */}
        <label className="ml-auto flex items-center gap-2 cursor-pointer group pr-2">
          <input
            type="checkbox"
            checked={crowdfundingApproved}
            onChange={async (e) => {
              const val = e.target.checked;
              setCrowdfundingApproved(val);
              await updateProposal(proposalId, { crowdfunding_approved: val });
            }}
            className="w-3.5 h-3.5 rounded border border-white/20 bg-white/[0.04] accent-white cursor-pointer"
          />
          <span className="text-xs text-white/40 group-hover:text-white/70 transition-colors whitespace-nowrap">
            Crowdfunding
          </span>
        </label>

        {/* Delete button right-aligned */}
        {quotes.length > 1 && activeQuote && (
          <div className="ml-auto">
            {confirmDeleteId === activeQuote.id ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">Remove this quote?</span>
                <button
                  onClick={() => handleConfirmDelete(activeQuote.id)}
                  className="text-xs px-2 py-1 text-red-400 hover:text-red-300 transition-colors"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-xs px-2 py-1 text-white/30 hover:text-white/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteId(activeQuote.id)}
                className="p-2 text-red-400/40 hover:text-red-400 transition-colors"
                title="Delete this quote"
              >
                <Trash2 size={14} />
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

            {/* Description — first quote only */}
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
                  className={
                    inputCls +
                    ' resize-none leading-relaxed'
                  }
                />
              </div>
            )}

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
