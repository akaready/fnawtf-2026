'use client';

/**
 * Demo3 — Combined best of Demo1 + Demo2
 * Dark default. Big invoice # header (Demo2). Full-width line items table.
 * Right sidebar: payment stages + big white balance card (Demo1).
 * Contract reference zone. Standalone — no site nav/footer.
 */

import { useState } from 'react';
import Image from 'next/image';
import type { InvoiceData, PaymentTrigger, StageStatus } from '@/types/invoice';
import { CheckCircle2, FileSignature, ExternalLink } from 'lucide-react';
import { PortalNav } from '../PortalNav';

/* ── Helpers ─────────────────────────────────────────────────────────── */

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const TRIGGER_LABEL: Record<PaymentTrigger, string> = {
  signing:           'Due at signing',
  delivery:          'Due on delivery',
  'campaign-launch': 'Due at campaign launch',
  'post-raise':      'Due after raise',
};

const STAGE_CFG: Record<StageStatus, {
  label: string;
  card: string;
  amount: string;
  badge: string;
}> = {
  paid:    { label: 'Paid',             card: 'border-emerald-500/30 bg-emerald-500/10', amount: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400' },
  sent:    { label: 'Awaiting payment', card: 'border-sky-500/40 bg-sky-500/10',        amount: 'text-sky-300',    badge: 'bg-sky-500/20 text-sky-400'         },
  pending: { label: 'Not yet due',      card: 'border-admin-border bg-admin-bg-raised', amount: 'text-admin-text-muted', badge: 'bg-admin-bg-hover text-admin-text-dim' },
  overdue: { label: 'Overdue',          card: 'border-red-500/30 bg-red-500/10',        amount: 'text-red-400',    badge: 'bg-red-500/20 text-red-400'         },
};

/* ════════════════════════════════════════════════════════════════════ */

export function Demo3({ data }: { data: InvoiceData }) {
  const [lightMode, setLightMode] = useState(false);

  const currentStage = data.stages.find(s => s.id === data.currentStageId);
  const balanceDue   = currentStage?.amount ?? 0;
  const paidStages   = data.stages.filter(s => s.status === 'paid');

  const groups = data.lineItems.reduce<Record<string, typeof data.lineItems>>(
    (acc, item) => {
      const cat = item.category ?? 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {},
  );

  return (
    <div className={`min-h-screen bg-admin-bg-base text-admin-text-primary ${lightMode ? 'cs-light' : ''}`}>

      <PortalNav
        projectTitle={data.projectTitle}
        clientCompany={data.clientCompany}
        invoiceNumber={data.invoiceNumber}
        lightMode={lightMode}
        onToggleMode={() => setLightMode(m => !m)}
        proposalUrl="#"
        contractUrl="#"
      />

      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-12 py-10 space-y-8">

        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-8 border-b border-admin-border">

          {/* Logos */}
          <div className="flex items-center gap-4">
            {data.clientLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.clientLogoUrl}
                alt={data.clientCompany ?? data.clientName}
                height={40}
                className="h-10 w-auto object-contain brightness-0 invert admin-logo"
              />
            )}
            <span className="text-admin-text-dim">&times;</span>
            <Image
              src="/images/logo/fna-logo.svg"
              alt="Friends 'n Allies"
              width={120}
              height={40}
              className="h-10 w-auto object-contain brightness-0 invert"
            />
          </div>

          {/* Invoice number — big, right-aligned */}
          <div className="text-left sm:text-right">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-admin-text-dim">Invoice</p>
            <p className="font-[family-name:var(--font-mono)] text-3xl font-bold tracking-tight mt-0.5">
              {data.invoiceNumber}
            </p>
            <p className="text-sm text-admin-text-muted mt-1">
              Issued {formatDate(data.issueDate)}
            </p>
          </div>
        </div>

        {/* ═══ BILL TO / DETAILS / CONTRACT ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

          {/* Bill To */}
          <div className="rounded-xl border border-admin-border bg-admin-bg-raised px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim mb-3">Bill To</p>
            <p className="text-sm font-semibold">{data.clientName}</p>
            {data.clientCompany && <p className="text-sm text-admin-text-muted">{data.clientCompany}</p>}
            <p className="text-sm text-admin-text-muted">{data.clientEmail}</p>
          </div>

          {/* Invoice Details */}
          <div className="rounded-xl border border-admin-border bg-admin-bg-raised px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim mb-3">Project</p>
            <p className="text-sm font-semibold">{data.projectTitle}</p>
            {data.projectType && <p className="text-sm text-admin-text-muted">{data.projectType}</p>}
            {currentStage?.dueDate && (
              <p className="text-sm text-admin-danger font-semibold mt-2">
                Due {formatDate(currentStage.dueDate)}
              </p>
            )}
          </div>

          {/* Contract reference zone */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-[var(--admin-accent)]/40 bg-[rgba(161,77,253,0.08)] px-5 py-4 hover:bg-[rgba(161,77,253,0.14)] transition-colors"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--admin-accent)] mb-3">
              Signed Contract
            </p>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileSignature className="w-4 h-4 text-[var(--admin-accent)] shrink-0" strokeWidth={1.75} />
                  <p className="text-sm font-semibold font-[family-name:var(--font-mono)]">
                    {data.invoiceNumber}-CONTRACT
                  </p>
                </div>
                <p className="text-xs text-admin-text-muted">
                  Signed {paidStages[0]?.paidAt ? formatDate(paidStages[0].paidAt) : formatDate(data.issueDate)}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-admin-text-dim group-hover:text-[var(--admin-accent)] transition-colors shrink-0 mt-0.5" />
            </div>
          </a>
        </div>

        {/* ═══ MAIN GRID: LINE ITEMS LEFT, PAYMENTS RIGHT ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

          {/* ── LEFT: LINE ITEMS TABLE ───────────────────────── */}
          <div className="space-y-0 rounded-xl border border-admin-border bg-admin-bg-raised overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border bg-admin-bg-inset">
                  <th className="text-left text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim px-5 py-3 w-full">
                    Description
                  </th>
                  <th className="text-right text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim px-5 py-3 whitespace-nowrap">
                    Amount
                  </th>
                </tr>
              </thead>

              {Object.entries(groups).map(([category, items]) => (
                <tbody key={category}>
                  <tr className="border-b border-admin-border-subtle bg-admin-bg-inset/50">
                    <td colSpan={2} className="px-5 py-2">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim">
                        {category}
                      </span>
                    </td>
                  </tr>
                  {items.map((item, i) => (
                    <tr
                      key={i}
                      className={`hover:bg-admin-bg-hover transition-colors ${
                        i < items.length - 1 ? 'border-b border-admin-border-subtle' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 text-sm">{item.name}</td>
                      <td className="px-5 py-3.5 text-right font-[family-name:var(--font-mono)] text-sm tabular-nums whitespace-nowrap">
                        {fmt(item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}

              {/* Totals footer */}
              <tbody>
                <tr className="border-t border-admin-border bg-admin-bg-inset/50">
                  <td className="px-5 py-3 text-sm text-admin-text-muted">Subtotal</td>
                  <td className="px-5 py-3 text-right font-[family-name:var(--font-mono)] text-sm tabular-nums">{fmt(data.subtotal)}</td>
                </tr>
                {data.discountAmount && data.discountAmount > 0 && (
                  <tr className="border-t border-admin-border-subtle">
                    <td className="px-5 py-3 text-sm text-admin-text-muted">{data.discountLabel ?? 'Discount'}</td>
                    <td className="px-5 py-3 text-right font-[family-name:var(--font-mono)] text-sm tabular-nums text-admin-success">
                      &minus;{fmt(data.discountAmount)}
                    </td>
                  </tr>
                )}
                <tr className="border-t border-admin-border">
                  <td className="px-5 py-4 text-sm font-bold">Total</td>
                  <td className="px-5 py-4 text-right font-[family-name:var(--font-mono)] text-base font-bold tabular-nums">{fmt(data.total)}</td>
                </tr>
                {paidStages.map(s => (
                  <tr key={s.id} className="border-t border-admin-border-subtle">
                    <td className="px-5 py-3 text-sm text-admin-text-muted">
                      {s.label} received {s.paidAt ? formatDate(s.paidAt) : ''}
                    </td>
                    <td className="px-5 py-3 text-right font-[family-name:var(--font-mono)] text-sm tabular-nums text-emerald-400">
                      &minus;{fmt(s.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── RIGHT: PAYMENT STAGES + BIG TOTAL ───────────── */}
          <div className="space-y-4">

            {data.stages.map(stage => {
              const cfg = STAGE_CFG[stage.status];
              const isCurrent = stage.id === data.currentStageId;
              return (
                <div
                  key={stage.id}
                  className={`rounded-xl border p-5 ${cfg.card} ${isCurrent ? 'ring-1 ring-sky-500/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-tight">{stage.label}</p>
                      <p className="text-xs text-admin-text-dim mt-0.5">{TRIGGER_LABEL[stage.trigger]}</p>
                      {stage.dueDate && stage.status !== 'paid' && (
                        <p className="text-xs text-admin-text-dim mt-0.5">by {formatDate(stage.dueDate)}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-[family-name:var(--font-mono)] text-base font-bold tabular-nums ${cfg.amount}`}>
                        {fmt(stage.amount)}
                      </p>
                      <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  {stage.paidAt && (
                    <p className="text-xs text-admin-text-dim mt-3 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Received {formatDate(stage.paidAt)}
                    </p>
                  )}
                </div>
              );
            })}

            {/* ── BIG BALANCE DUE — mirrors Demo4 call time block ── */}
            <div className="rounded-xl bg-white p-8 text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-neutral-400">
                Balance Due
              </p>
              <p className="font-[family-name:var(--font-mono)] text-5xl font-bold tracking-tighter text-black mt-2 tabular-nums">
                {fmt(balanceDue)}
              </p>
              {currentStage && (
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 mt-2.5 font-semibold">
                  {TRIGGER_LABEL[currentStage.trigger]}
                </p>
              )}
            </div>

            {/* Pay now */}
            {currentStage?.stripePaymentLinkUrl && (
              <a
                href={currentStage.stripePaymentLinkUrl}
                className="invoice-no-print block w-full text-center py-3.5 px-5 rounded-xl bg-admin-text-primary text-admin-bg-base text-sm font-bold tracking-wide hover:opacity-90 transition-opacity"
              >
                Pay Now
              </a>
            )}
          </div>
        </div>

        {/* ═══ NOTES ═══ */}
        {data.notes && (
          <div className="rounded-xl border border-admin-border bg-admin-bg-raised px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim mb-2">Notes</p>
            <p className="text-sm text-admin-text-muted leading-relaxed">{data.notes}</p>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <div className="border-t border-admin-border pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <Image
              src="/images/logo/fna-logo.svg"
              alt="Friends 'n Allies"
              width={80}
              height={24}
              className="h-5 w-auto object-contain brightness-0 invert mb-3"
            />
            <p className="text-xs text-admin-text-dim leading-relaxed">
              Friends &apos;n Allies LLC<br />
              Los Angeles, CA<br />
              hello@fna.wtf &middot; fna.wtf
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim mb-2">Payment Instructions</p>
            <p className="text-xs text-admin-text-muted leading-relaxed">
              Wire transfer, ACH, or credit card accepted.
              Checks payable to Friends &apos;n Allies LLC.
              Please reference{' '}
              <span className="font-[family-name:var(--font-mono)]">{data.invoiceNumber}</span>{' '}
              on all payments.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
