'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { saveProposalQuote, deleteProposalQuote } from '../../actions';
import type { ProposalQuoteRow } from '@/types/proposal';

const QUOTE_TYPES = [
  { value: 'build', label: 'Build' },
  { value: 'launch', label: 'Launch' },
  { value: 'scale', label: 'Scale' },
  { value: 'fundraising', label: 'Fundraising' },
] as const;

interface Props {
  proposalId: string;
  existingQuotes: ProposalQuoteRow[];
}

function QuoteForm({
  proposalId,
  quote,
  defaultOpen,
  onSaved,
  onDeleted,
}: {
  proposalId: string;
  quote?: ProposalQuoteRow;
  defaultOpen?: boolean;
  onSaved: () => void;
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [label, setLabel] = useState(quote?.label ?? 'FNA Quote');
  const [quoteType, setQuoteType] = useState<string>(quote?.quote_type ?? 'build');
  const [totalAmount, setTotalAmount] = useState(quote?.total_amount?.toString() ?? '');
  const [downAmount, setDownAmount] = useState(quote?.down_amount?.toString() ?? '');
  const [discountPct, setDiscountPct] = useState(quote?.friendly_discount_pct?.toString() ?? '0');
  const [deferPayment, setDeferPayment] = useState(quote?.defer_payment ?? false);
  const [description, setDescription] = useState(quote?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveProposalQuote(proposalId, {
        label: label.trim() || 'FNA Quote',
        quote_type: quoteType,
        total_amount: totalAmount ? parseFloat(totalAmount) : null,
        down_amount: downAmount ? parseFloat(downAmount) : null,
        friendly_discount_pct: parseFloat(discountPct) || 0,
        defer_payment: deferPayment,
        description: description.trim() || null,
        selected_addons: quote?.selected_addons ?? {},
        slider_values: quote?.slider_values ?? {},
        tier_selections: quote?.tier_selections ?? {},
        location_days: quote?.location_days ?? {},
        photo_count: quote?.photo_count ?? 0,
        crowdfunding_enabled: quote?.crowdfunding_enabled ?? false,
        crowdfunding_tier: quote?.crowdfunding_tier ?? 0,
        fundraising_enabled: quoteType === 'fundraising',
        is_locked: false,
        is_fna_quote: true,
      }, quote?.id);
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quote');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!quote?.id) return;
    setDeleting(true);
    try {
      await deleteProposalQuote(quote.id);
      onDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quote');
      setDeleting(false);
    }
  };

  return (
    <div className="border border-[#2a2a2a] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="text-left">
          <p className="text-sm font-medium text-white/70">
            {quote ? label || 'FNA Quote' : 'New FNA Quote'}
          </p>
          {quote && !open && (
            <p className="text-xs text-white/30 font-mono mt-0.5">
              {quote.quote_type} · ${quote.total_amount?.toLocaleString() ?? '—'}
            </p>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-5 border-t border-[#2a2a2a]">
          {/* Label */}
          <div className="pt-5">
            <label className="block text-xs font-mono tracking-wider uppercase text-white/25 mb-2">
              Quote Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Recommended, Budget Option"
              className="w-full bg-black/40 border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/15 outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono tracking-wider uppercase text-white/25 mb-2">
              Description (visible to client)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the choices in this quote..."
              rows={3}
              className="w-full bg-white/[0.04] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/15 outline-none focus:border-white/20 transition-colors resize-none"
            />
          </div>

          {/* Quote type */}
          <div>
            <p className="text-xs font-mono tracking-wider uppercase text-white/25 mb-3">Quote Type</p>
            <div className="flex gap-2 flex-wrap">
              {QUOTE_TYPES.map((qt) => (
                <button
                  key={qt.value}
                  onClick={() => setQuoteType(qt.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    quoteType === qt.value
                      ? 'bg-accent text-white'
                      : 'bg-white/[0.04] border border-[#2a2a2a] text-white/40 hover:text-white/70'
                  }`}
                >
                  {qt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Total + Down payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-white/25 mb-2">
                Total ($)
              </label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-black/40 border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/15 outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-white/25 mb-2">
                Down Payment ($)
              </label>
              <input
                type="number"
                value={downAmount}
                onChange={(e) => setDownAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-black/40 border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/15 outline-none focus:border-white/20 transition-colors"
              />
            </div>
          </div>

          {/* Discount */}
          <div>
            <label className="block text-xs font-mono tracking-wider uppercase text-white/25 mb-2">
              Discount (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
              className="w-32 bg-black/40 border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Defer payment toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-white/60">Defer Payment</p>
              <p className="text-xs text-white/25">Client pays after delivery</p>
            </div>
            <button
              onClick={() => setDeferPayment(!deferPayment)}
              className={`relative w-10 h-5.5 rounded-full transition-colors ${
                deferPayment ? 'bg-accent' : 'bg-white/10'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  deferPayment ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Saving...' : 'Save Quote'}
            </button>
            {quote && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function QuoteBuilder({ proposalId, existingQuotes }: Props) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);

  const refresh = useCallback(() => {
    router.refresh();
    setShowNew(false);
  }, [router]);

  return (
    <div className="space-y-3">
      <p className="text-xs font-mono tracking-wider uppercase text-white/25 mb-2">FNA Quotes</p>
      {existingQuotes.map((q) => (
        <QuoteForm
          key={q.id}
          proposalId={proposalId}
          quote={q}
          onSaved={refresh}
          onDeleted={refresh}
        />
      ))}
      {showNew ? (
        <QuoteForm
          proposalId={proposalId}
          defaultOpen
          onSaved={refresh}
        />
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-white/10 rounded-xl text-sm text-white/40 hover:text-white/60 hover:border-white/20 transition-colors"
        >
          <Plus size={14} />
          New FNA Quote
        </button>
      )}
    </div>
  );
}
