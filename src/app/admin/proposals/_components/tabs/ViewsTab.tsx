'use client';

import { useState } from 'react';
import { DollarSign, X } from 'lucide-react';
import type { ProposalViewRow } from '@/app/admin/actions';
import type { ProposalQuoteRow } from '@/types/proposal';

interface Props {
  views: ProposalViewRow[];
  quotes: ProposalQuoteRow[];
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatViewedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export function ViewsTab({ views, quotes }: Props) {
  const [expandedViewId, setExpandedViewId] = useState<string | null>(null);

  if (views.length === 0) {
    return (
      <div className="px-8 py-12 text-center text-admin-text-faint text-sm">
        No views yet.
      </div>
    );
  }

  // Index client quotes by viewer_email for quick lookup
  const quotesByEmail = new Map<string, ProposalQuoteRow[]>();
  for (const q of quotes) {
    if (q.viewer_email && !q.is_fna_quote && !q.deleted_at) {
      const existing = quotesByEmail.get(q.viewer_email) ?? [];
      existing.push(q);
      quotesByEmail.set(q.viewer_email, existing);
    }
  }

  return (
    <div className="px-8 py-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-admin-text-faint text-xs uppercase tracking-wider">
            <th className="pb-3 font-medium">Email</th>
            <th className="pb-3 font-medium">Viewed</th>
            <th className="pb-3 font-medium text-right">Duration</th>
            <th className="pb-3 font-medium text-right w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border-subtle">
          {views.map((v) => {
            const viewerQuotes = v.viewer_email ? quotesByEmail.get(v.viewer_email) : undefined;
            const hasQuote = viewerQuotes && viewerQuotes.length > 0;
            const isExpanded = expandedViewId === v.id;

            return (
              <tr key={v.id} className="text-admin-text-secondary relative">
                <td className="py-2.5 pr-4 font-mono text-xs">{v.viewer_email ?? '—'}</td>
                <td className="py-2.5 pr-4">{formatViewedAt(v.viewed_at)}</td>
                <td className="py-2.5 text-right tabular-nums">{formatDuration(v.duration_seconds)}</td>
                <td className="py-2.5 text-right">
                  {hasQuote && (
                    <div className="relative inline-block">
                      <button
                        onClick={() => setExpandedViewId(isExpanded ? null : v.id)}
                        className={`w-7 h-7 inline-flex items-center justify-center rounded-lg transition-colors ${
                          isExpanded
                            ? 'bg-admin-bg-active text-admin-text-primary'
                            : 'text-admin-text-faint hover:text-admin-text-secondary hover:bg-admin-bg-hover'
                        }`}
                        title="View quote"
                      >
                        <DollarSign size={13} />
                      </button>

                      {isExpanded && viewerQuotes && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setExpandedViewId(null)} />
                          <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-admin-bg-overlay border border-admin-border rounded-lg shadow-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-mono text-admin-text-ghost uppercase tracking-wider">Quote Summary</p>
                              <button
                                onClick={() => setExpandedViewId(null)}
                                className="w-5 h-5 flex items-center justify-center rounded text-admin-text-faint hover:text-admin-text-secondary transition-colors"
                              >
                                <X size={11} />
                              </button>
                            </div>
                            {viewerQuotes.map((q) => (
                              <div key={q.id} className="space-y-2">
                                <p className="text-sm font-medium text-admin-text-primary">{q.label}</p>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                  <span className="text-admin-text-ghost">Type</span>
                                  <span className="text-admin-text-secondary capitalize">{q.quote_type}</span>

                                  {q.total_amount != null && (
                                    <>
                                      <span className="text-admin-text-ghost">Total</span>
                                      <span className="text-admin-text-primary font-medium">{formatCurrency(q.total_amount)}</span>
                                    </>
                                  )}

                                  {q.down_amount != null && (
                                    <>
                                      <span className="text-admin-text-ghost">Down</span>
                                      <span className="text-admin-text-secondary">{formatCurrency(q.down_amount)}</span>
                                    </>
                                  )}

                                  {Object.keys(q.selected_addons).length > 0 && (
                                    <>
                                      <span className="text-admin-text-ghost">Add-ons</span>
                                      <span className="text-admin-text-secondary">{Object.keys(q.selected_addons).length} selected</span>
                                    </>
                                  )}

                                  {q.crowdfunding_enabled && (
                                    <>
                                      <span className="text-admin-text-ghost">Crowdfunding</span>
                                      <span className="text-admin-text-secondary">Tier {q.crowdfunding_tier + 1}</span>
                                    </>
                                  )}

                                  {q.defer_payment && (
                                    <>
                                      <span className="text-admin-text-ghost">Deferred</span>
                                      <span className="text-admin-text-secondary">Yes</span>
                                    </>
                                  )}
                                </div>
                                <p className="text-[10px] text-admin-text-ghost">
                                  Updated {formatViewedAt(q.updated_at)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
