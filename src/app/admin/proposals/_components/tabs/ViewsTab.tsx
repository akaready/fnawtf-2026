'use client';

import { useState, useMemo } from 'react';
import type { ProposalViewRow } from '@/app/admin/actions';
import type { ProposalQuoteRow } from '@/types/proposal';
import {
  buildAddOns,
  launchAddOns,
  fundraisingIncluded,
  fundraisingAddOns,
} from '@/app/pricing/pricing-data';
import { calcTotalFromQuote, type QuoteColumnData } from '@/lib/pricing/calc';

interface Props {
  views: ProposalViewRow[];
  quotes: ProposalQuoteRow[];
}

const allAddOns = [...buildAddOns, ...launchAddOns, ...fundraisingIncluded, ...fundraisingAddOns];

const crowdTierDiscounts = [0, 10, 20, 30];

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

/* ── Quote Breakdown (mirrors CalculatorSummary layout) ── */
function QuoteBreakdown({ data }: { data: QuoteColumnData }) {
  return (
    <div className="space-y-1">
      {/* Build section */}
      {data.buildActive && !data.isFundraising && (
        <>
          <div className="flex justify-between">
            <span className="text-admin-text-ghost">Build base</span>
            <span className="text-admin-text-secondary tabular-nums">{formatPrice(data.buildBase)}</span>
          </div>
          {data.buildItems.map((item) => (
            <div key={item.name} className="flex justify-between">
              <span className="text-admin-text-ghost leading-tight mr-2">{item.name}</span>
              <span className="text-admin-text-secondary tabular-nums flex-shrink-0">{formatPrice(item.price)}</span>
            </div>
          ))}
        </>
      )}

      {/* Divider between tiers */}
      {data.buildActive && data.launchActive && !data.isFundraising && (
        <div className="h-px bg-admin-border-subtle my-1" />
      )}

      {/* Launch section */}
      {data.launchActive && !data.isFundraising && (
        <>
          <div className="flex justify-between">
            <span className="text-admin-text-ghost">Launch base</span>
            <span className="text-admin-text-secondary tabular-nums">{formatPrice(data.launchBase)}</span>
          </div>
          {data.launchItems.map((item) => (
            <div key={item.name} className="flex justify-between">
              <span className="text-admin-text-ghost leading-tight mr-2">{item.name}</span>
              <span className="text-admin-text-secondary tabular-nums flex-shrink-0">{formatPrice(item.price)}</span>
            </div>
          ))}
        </>
      )}

      {/* Fundraising section */}
      {data.isFundraising && (
        <>
          <div className="flex justify-between">
            <span className="text-admin-text-ghost">Fundraising base</span>
            <span className="text-admin-text-secondary tabular-nums">{formatPrice(data.fundBase)}</span>
          </div>
          {data.fundItems.map((item) => (
            <div key={item.name} className="flex justify-between">
              <span className="text-admin-text-ghost leading-tight mr-2">{item.name}</span>
              <span className="text-admin-text-secondary tabular-nums flex-shrink-0">{formatPrice(item.price)}</span>
            </div>
          ))}
        </>
      )}

      {/* Overhead */}
      <div className="h-px bg-admin-border-subtle my-1" />
      <div className="flex justify-between">
        <span className="text-admin-text-ghost">Overhead (10%)</span>
        {data.hasAddOns ? (
          <span className="text-admin-text-secondary tabular-nums">{formatPrice(data.overhead)}</span>
        ) : (
          <span className="text-admin-text-ghost">Waived</span>
        )}
      </div>

      {/* Crowdfunding discount */}
      {data.crowdfundingEnabled && data.crowdDiscount > 0 && (
        <div className="flex justify-between">
          <span className="text-admin-success">Crowdfunding ({crowdTierDiscounts[data.fundraisingTierIndex] ?? 0}% off)</span>
          <span className="text-admin-success tabular-nums">-{formatPrice(data.crowdDiscount)}</span>
        </div>
      )}

      {/* Friendly discount */}
      {data.friendlyDiscountPct > 0 && data.friendlyDiscount > 0 && (
        <div className="flex justify-between">
          <span className="text-admin-success">Friendly discount ({data.friendlyDiscountPct}%)</span>
          <span className="text-admin-success tabular-nums">-{formatPrice(data.friendlyDiscount)}</span>
        </div>
      )}

      {/* Total + Payment */}
      <div className="border-t border-admin-border mt-2 pt-2 space-y-1.5">
        <div className="flex justify-between items-baseline">
          <span className="text-admin-text-primary font-semibold">Total</span>
          <span className="text-admin-text-primary font-semibold tabular-nums">{formatPrice(data.total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-admin-success">{Math.round(data.downPercent * 100)}% down</span>
          <span className="text-admin-success font-medium tabular-nums">{formatPrice(data.downAmount)}</span>
        </div>
        {data.isFundraising ? (
          <>
            {data.fundDeliveryAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-admin-text-ghost">Due on delivery</span>
                <span className="text-admin-text-secondary tabular-nums">{formatPrice(data.fundDeliveryAmount)}</span>
              </div>
            )}
            {data.fundPostRaiseAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-admin-text-ghost">After raise</span>
                <span className="text-admin-text-secondary tabular-nums">{formatPrice(data.fundPostRaiseAmount)}</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex justify-between">
            <span className="text-admin-text-ghost">Balance</span>
            <span className="text-admin-text-secondary tabular-nums">{formatPrice(data.total - data.downAmount)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ViewsTab({ views, quotes }: Props) {
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);

  // Index client quotes by viewer_email
  const quotesByEmail = useMemo(() => {
    const map = new Map<string, ProposalQuoteRow[]>();
    for (const q of quotes) {
      if (q.viewer_email && !q.is_fna_quote && !q.deleted_at) {
        const existing = map.get(q.viewer_email) ?? [];
        existing.push(q);
        map.set(q.viewer_email, existing);
      }
    }
    return map;
  }, [quotes]);

  if (views.length === 0) {
    return (
      <div className="px-8 py-12 text-center text-admin-text-faint text-sm">
        No views yet.
      </div>
    );
  }

  const selectedView = selectedViewId ? views.find(v => v.id === selectedViewId) : null;
  const selectedQuotes = selectedView?.viewer_email ? quotesByEmail.get(selectedView.viewer_email) : undefined;

  return (
    <div className="flex h-full">
      {/* Left: Views table */}
      <div className="flex-1 min-w-0 overflow-y-auto admin-scrollbar px-6 py-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-admin-text-faint text-xs uppercase tracking-wider">
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium whitespace-nowrap">Viewed</th>
              <th className="pb-3 font-medium text-right whitespace-nowrap">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border-subtle">
            {views.map((v) => {
              const viewerQuotes = v.viewer_email ? quotesByEmail.get(v.viewer_email) : undefined;
              const hasQuote = viewerQuotes && viewerQuotes.length > 0;
              const isSelected = selectedViewId === v.id;

              return (
                <tr
                  key={v.id}
                  onClick={hasQuote ? () => setSelectedViewId(isSelected ? null : v.id) : undefined}
                  className={`text-admin-text-secondary transition-colors ${
                    isSelected ? 'bg-admin-bg-active' : hasQuote ? 'hover:bg-admin-bg-hover cursor-pointer' : ''
                  }`}
                >
                  <td className="py-2.5 pr-3 font-mono text-xs truncate max-w-[200px]">
                    <span className="flex items-center gap-2">
                      {v.viewer_email ?? '—'}
                      {hasQuote && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-admin-info flex-shrink-0" title="Has adjusted quote" />
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-xs whitespace-nowrap">{formatShortDate(v.viewed_at)}</td>
                  <td className="py-2.5 text-right tabular-nums text-xs">{formatDuration(v.duration_seconds)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Right: Quote summary sidebar — always visible */}
      <div className="w-[240px] flex-shrink-0 border-l border-admin-border bg-admin-bg-wash overflow-y-auto admin-scrollbar">
        {selectedQuotes && selectedQuotes.length > 0 ? (
          <div className="px-4 py-5 space-y-5">
            {selectedQuotes.map((q) => {
              const data = calcTotalFromQuote(q, allAddOns);
              return (
                <div key={q.id} className="space-y-3">
                  <p className="text-sm font-semibold text-admin-text-primary">{q.label}</p>
                  <div className="text-xs">
                    <QuoteBreakdown data={data} />
                  </div>
                  <p className="text-[10px] text-admin-text-ghost">
                    Updated {formatShortDate(q.updated_at)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full px-4 text-center">
            <p className="text-xs text-admin-text-faint leading-relaxed">
              {selectedViewId ? 'No adjusted quote' : 'Select a viewer to see their quote'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
