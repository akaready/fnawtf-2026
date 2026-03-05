'use client';

import { calcTotalFromQuote } from '@/components/pricing/CalculatorSummary';
import type { QuoteColumnData } from '@/components/pricing/CalculatorSummary';
import type { ProposalQuoteRow } from '@/types/proposal';
import { buildAddOns, launchAddOns, fundraisingIncluded, fundraisingAddOns } from '@/app/pricing/pricing-data';
import { Calculator, DollarSign } from 'lucide-react';

const allAddOns = [...buildAddOns, ...launchAddOns, ...fundraisingIncluded, ...fundraisingAddOns];

const QUOTE_TYPE_LABELS: Record<string, string> = {
  build: 'Build',
  'build-launch': 'Build + Launch',
  launch: 'Launch',
  scale: 'Scale',
  fundraising: 'Fundraising',
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function TierSection({ label, base, items }: { label: string; base: number; items: { name: string; price: number }[] }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-admin-text-primary">{label} Base</span>
        <span className="text-admin-text-secondary font-admin-mono">{fmt(base)}</span>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex justify-between text-sm pl-3">
          <span className="text-admin-text-muted">{item.name}</span>
          <span className="text-admin-text-muted font-admin-mono">{fmt(item.price)}</span>
        </div>
      ))}
    </div>
  );
}

export function QuoteSummaryCard({ quoteData, budgetInteracted }: {
  quoteData: Record<string, unknown> | null;
  budgetInteracted: boolean;
}) {
  if (!quoteData) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-xl bg-admin-bg-hover flex items-center justify-center mx-auto mb-3">
          <Calculator size={20} className="text-admin-text-dim" />
        </div>
        <p className="text-sm text-admin-text-muted">No quote configured</p>
        {!budgetInteracted && (
          <p className="text-xs text-admin-text-dim mt-1">Calculator was not used</p>
        )}
      </div>
    );
  }

  // Build a stub ProposalQuoteRow from the snapshot
  const stub: ProposalQuoteRow = {
    id: '',
    proposal_id: '',
    label: 'Intake Quote',
    is_locked: false,
    is_fna_quote: false,
    quote_type: (quoteData.quote_type as string) || 'build',
    selected_addons: (quoteData.selected_addons as Record<string, number>) || {},
    slider_values: (quoteData.slider_values as Record<string, number>) || {},
    tier_selections: (quoteData.tier_selections as Record<string, string>) || {},
    location_days: (quoteData.location_days as Record<string, number[]>) || {},
    photo_count: (quoteData.photo_count as number) || 0,
    crowdfunding_enabled: (quoteData.crowdfunding_enabled as boolean) || false,
    crowdfunding_tier: (quoteData.crowdfunding_tier as number) || 0,
    fundraising_enabled: (quoteData.fundraising_enabled as boolean) || false,
    fundraising_tier: (quoteData.fundraising_tier as number) || 0,
    defer_payment: false,
    friendly_discount_pct: (quoteData.friendly_discount_pct as number) || 0,
    total_amount: null,
    down_amount: null,
    sort_order: 0,
    visible: true,
    description: null,
    created_at: '',
    updated_at: '',
    deleted_at: null,
  };

  let computed: QuoteColumnData;
  try {
    computed = calcTotalFromQuote(stub, allAddOns);
  } catch {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-admin-text-muted">Unable to compute quote</p>
      </div>
    );
  }

  const hasContent = computed.buildActive || computed.launchActive || computed.isFundraising;

  return (
    <div className="space-y-5">
      {/* Type badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-admin-accent-bg text-accent text-xs font-medium border border-admin-accent-border">
          <DollarSign size={12} />
          {QUOTE_TYPE_LABELS[stub.quote_type] || stub.quote_type}
        </span>
        {budgetInteracted && (
          <span className="text-xs text-admin-text-dim ml-auto">Calculator used</span>
        )}
      </div>

      {hasContent && (
        <div className="rounded-xl border border-admin-border bg-admin-bg-raised p-4 space-y-4">
          {/* Tier breakdowns */}
          {computed.buildActive && (
            <TierSection label="Build" base={computed.buildBase} items={computed.buildItems} />
          )}
          {computed.launchActive && (
            <TierSection label="Launch" base={computed.launchBase} items={computed.launchItems} />
          )}
          {computed.isFundraising && (
            <TierSection label="Fundraising" base={computed.fundBase} items={computed.fundItems} />
          )}

          {/* Overhead */}
          {computed.overhead > 0 && (
            <div className="flex justify-between text-sm border-t border-admin-border-subtle pt-3">
              <span className="text-admin-text-muted">Overhead (10%)</span>
              <span className="text-admin-text-muted font-admin-mono">{fmt(computed.overhead)}</span>
            </div>
          )}

          {/* Discounts */}
          {computed.crowdDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-admin-success">Crowdfunding discount</span>
              <span className="text-admin-success font-admin-mono">-{fmt(computed.crowdDiscount)}</span>
            </div>
          )}
          {computed.friendlyDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-admin-success">Friendly discount ({computed.friendlyDiscountPct}%)</span>
              <span className="text-admin-success font-admin-mono">-{fmt(computed.friendlyDiscount)}</span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between border-t border-admin-border pt-3">
            <span className="text-sm font-semibold text-admin-text-primary">Total</span>
            <span className="text-base font-bold text-admin-text-primary font-admin-mono">{fmt(computed.total)}</span>
          </div>

          {/* Down payment */}
          <div className="flex justify-between text-sm">
            <span className="text-admin-text-muted">Down payment ({Math.round(computed.downPercent * 100)}%)</span>
            <span className="text-admin-text-secondary font-admin-mono">{fmt(computed.downAmount)}</span>
          </div>

          {/* Fundraising breakdown */}
          {computed.isFundraising && computed.fundDeliveryAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-admin-text-muted">Due at delivery</span>
              <span className="text-admin-text-secondary font-admin-mono">{fmt(computed.fundDeliveryAmount)}</span>
            </div>
          )}
          {computed.isFundraising && computed.fundPostRaiseAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-admin-text-muted">Post-raise balance</span>
              <span className="text-admin-text-secondary font-admin-mono">{fmt(computed.fundPostRaiseAmount)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
