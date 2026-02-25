'use client';

import { useState, useTransition } from 'react';
import { Lock, Copy, Loader2, Check, DollarSign } from 'lucide-react';
import { saveClientQuote } from '@/app/p/[slug]/actions';
import type { ProposalQuoteRow } from '@/types/proposal';

interface Props {
  proposalId: string;
  quotes: ProposalQuoteRow[];
  viewerEmail: string;
}

export function ProposalQuoteSection({ proposalId, quotes: initialQuotes }: Props) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, startSave] = useTransition();

  const fnaQuotes = quotes.filter((q) => q.is_fna_quote);
  const clientQuotes = quotes.filter((q) => !q.is_fna_quote);

  const tabs = [
    ...fnaQuotes.map((q) => ({ quote: q, label: q.label || 'FNA Quote', isFna: true })),
    ...clientQuotes.map((q, i) => ({ quote: q, label: q.label || `My Quote ${i + 1}`, isFna: false })),
  ];

  const canClone = clientQuotes.length < 2;

  const handleClone = () => {
    if (!fnaQuotes[0] || !canClone) return;
    const source = fnaQuotes[0];

    startSave(async () => {
      await saveClientQuote(proposalId, {
        label: `My Quote ${clientQuotes.length + 1}`,
        quote_type: source.quote_type,
        selected_addons: { ...source.selected_addons },
        slider_values: { ...source.slider_values },
        tier_selections: { ...source.tier_selections },
        location_days: { ...source.location_days },
        photo_count: source.photo_count,
        crowdfunding_enabled: source.crowdfunding_enabled,
        crowdfunding_tier: source.crowdfunding_tier,
        fundraising_enabled: source.fundraising_enabled,
        defer_payment: source.defer_payment,
        friendly_discount_pct: source.friendly_discount_pct,
        total_amount: source.total_amount,
        down_amount: source.down_amount,
      });

      // Optimistic: add to local state
      const newQuote: ProposalQuoteRow = {
        ...source,
        id: crypto.randomUUID(),
        is_fna_quote: false,
        is_locked: false,
        label: `My Quote ${clientQuotes.length + 1}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setQuotes((prev) => [...prev, newQuote]);
      setActiveTab(tabs.length); // Switch to new tab
    });
  };

  if (tabs.length === 0) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-muted-foreground/50">
        <DollarSign size={24} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">No quotes have been configured for this proposal yet.</p>
      </div>
    );
  }

  const current = tabs[activeTab] ?? tabs[0];

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border bg-black/30">
        {tabs.map((tab, i) => (
          <button
            key={tab.quote.id}
            onClick={() => setActiveTab(i)}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
              i === activeTab
                ? 'text-foreground border-purple-500 bg-white/[0.03]'
                : 'text-muted-foreground/50 border-transparent hover:text-muted-foreground hover:bg-white/[0.02]'
            }`}
          >
            <span className="flex items-center gap-2">
              {tab.isFna && <Lock size={12} className="text-purple-400/60" />}
              {tab.label}
            </span>
          </button>
        ))}

        {/* Clone button */}
        {canClone && fnaQuotes.length > 0 && (
          <button
            onClick={handleClone}
            disabled={saving}
            className="ml-auto mr-3 flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
            Clone Quote
          </button>
        )}
      </div>

      {/* Quote content */}
      {current && (
        <QuoteDisplay quote={current.quote} isFna={current.isFna} />
      )}
    </div>
  );
}

function QuoteDisplay({ quote, isFna }: { quote: ProposalQuoteRow; isFna: boolean }) {
  const addons = Object.entries(quote.selected_addons).filter(([, qty]) => qty > 0);
  const [copied, setCopied] = useState(false);

  const copyTotal = () => {
    if (quote.total_amount != null) {
      navigator.clipboard.writeText(`$${quote.total_amount.toLocaleString()}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-display font-bold">{quote.label}</h3>
            {isFna && quote.is_locked && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/20 text-purple-400 border border-purple-500/20">
                Locked
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground/50 capitalize mt-1">
            {quote.quote_type.replace(/_/g, ' ')} package
          </p>
        </div>
      </div>

      {/* Add-ons list */}
      {addons.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs tracking-[0.4em] uppercase font-mono text-white/30">
            Included Services
          </h4>
          <div className="grid gap-1">
            {addons.map(([name, qty]) => (
              <div
                key={name}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-border"
              >
                <span className="text-sm text-muted-foreground">{name}</span>
                {qty > 1 && (
                  <span className="text-xs text-muted-foreground/40">×{qty}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discount info */}
      {quote.friendly_discount_pct > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/10">
          <Check size={14} className="text-green-400" />
          <span className="text-sm text-green-400/80">
            {quote.friendly_discount_pct}% friendly discount applied
          </span>
        </div>
      )}

      {quote.crowdfunding_enabled && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
          <Check size={14} className="text-cyan-400" />
          <span className="text-sm text-cyan-400/80">
            Crowdfunding program included
          </span>
        </div>
      )}

      {/* Totals */}
      <div className="pt-4 border-t border-border space-y-3">
        {quote.total_amount != null && (
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total Investment</span>
            <button
              onClick={copyTotal}
              className="flex items-center gap-2 text-2xl font-display font-bold text-foreground hover:text-purple-400 transition-colors"
              title="Copy total"
            >
              ${quote.total_amount.toLocaleString()}
              {copied ? <Check size={14} className="text-green-400" /> : null}
            </button>
          </div>
        )}
        {quote.down_amount != null && (
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Down Payment</span>
            <span className="text-lg font-display font-bold text-muted-foreground">
              ${quote.down_amount.toLocaleString()}
            </span>
          </div>
        )}
        {quote.defer_payment && (
          <p className="text-xs text-muted-foreground/40 italic">
            Deferred payment plan available
          </p>
        )}
      </div>
    </div>
  );
}
