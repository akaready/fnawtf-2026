'use client';

/**
 * Demo2 — Linear document style
 * Light default with dark toggle via PortalNav. Letter-width, top-to-bottom flow.
 * Big balance due at bottom. Print-optimized.
 */

import { useState } from 'react';
import Image from 'next/image';
import type { InvoiceData, PaymentTrigger, StageStatus } from '@/types/invoice';
import { CheckCircle2 } from 'lucide-react';
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

/* Stage colors — two sets: dark mode and light mode */
const STAGE_CFG_DARK: Record<StageStatus, { card: string; text: string }> = {
  paid:    { card: 'border-emerald-500/30 bg-emerald-500/10', text: 'text-emerald-400' },
  sent:    { card: 'border-sky-500/40 bg-sky-500/10',        text: 'text-sky-400'     },
  pending: { card: 'border-admin-border bg-admin-bg-raised', text: 'text-admin-text-muted' },
  overdue: { card: 'border-red-500/30 bg-red-500/10',        text: 'text-red-400'     },
};

const STAGE_CFG_LIGHT: Record<StageStatus, { card: string; text: string }> = {
  paid:    { card: 'border-emerald-200 bg-emerald-50',   text: 'text-emerald-700' },
  sent:    { card: 'border-sky-200 bg-sky-50',           text: 'text-sky-700'     },
  pending: { card: 'border-neutral-200 bg-neutral-50',   text: 'text-neutral-500' },
  overdue: { card: 'border-red-200 bg-red-50',           text: 'text-red-700'     },
};

/* ════════════════════════════════════════════════════════════════════ */

export function Demo2({ data }: { data: InvoiceData }) {
  const [lightMode, setLightMode] = useState(true); // light default

  const currentStage = data.stages.find(s => s.id === data.currentStageId);
  const balanceDue   = currentStage?.amount ?? 0;
  const paidStages   = data.stages.filter(s => s.status === 'paid');

  const STAGE_CFG = lightMode ? STAGE_CFG_LIGHT : STAGE_CFG_DARK;

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

      <div className="max-w-[760px] mx-auto px-8 sm:px-12 py-14 space-y-10">

        {/* ═══ HEADER ═══ */}
        <div className="flex items-start justify-between">
          <Image
            src="/images/logo/fna-logo.svg"
            alt="Friends 'n Allies"
            width={100}
            height={30}
            className={`h-7 w-auto object-contain brightness-0 ${lightMode ? '' : 'invert'}`}
          />
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-admin-text-dim">Invoice</p>
            <p className="font-[family-name:var(--font-mono)] text-2xl font-bold tracking-tight mt-0.5">
              {data.invoiceNumber}
            </p>
          </div>
        </div>

        {/* ═══ BILL TO / DETAILS ═══ */}
        <div className="grid grid-cols-2 gap-8 py-8 border-t border-b border-admin-border">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim mb-3">Bill To</p>
            {data.clientLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.clientLogoUrl}
                alt={data.clientCompany ?? data.clientName}
                height={32}
                className={`h-8 w-auto object-contain brightness-0 mb-3 admin-logo ${lightMode ? '' : 'invert'}`}
              />
            )}
            <p className="text-sm font-semibold">{data.clientName}</p>
            {data.clientCompany && <p className="text-sm text-admin-text-muted">{data.clientCompany}</p>}
            <p className="text-sm text-admin-text-muted">{data.clientEmail}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim mb-3">Details</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-admin-text-muted">Project</span>
                <span className="font-medium">{data.projectTitle}</span>
              </div>
              {data.projectType && (
                <div className="flex justify-between text-sm">
                  <span className="text-admin-text-muted">Type</span>
                  <span className="font-medium">{data.projectType}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-admin-text-muted">Issued</span>
                <span className="font-medium">{formatDate(data.issueDate)}</span>
              </div>
              {currentStage?.dueDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-admin-text-muted">Due Date</span>
                  <span className="font-semibold text-admin-danger">{formatDate(currentStage.dueDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ LINE ITEMS ═══ */}
        <div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="text-left text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim pb-3 pr-4 w-full">
                  Description
                </th>
                <th className="text-right text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim pb-3 whitespace-nowrap">
                  Amount
                </th>
              </tr>
            </thead>

            {Object.entries(groups).map(([category, items]) => (
              <tbody key={category}>
                <tr>
                  <td colSpan={2} className="pt-6 pb-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim">
                      {category}
                    </span>
                  </td>
                </tr>
                {items.map((item, i) => (
                  <tr
                    key={i}
                    className={i < items.length - 1 ? 'border-b border-admin-border-subtle' : ''}
                  >
                    <td className="py-3 pr-6 text-sm">{item.name}</td>
                    <td className="py-3 text-right font-[family-name:var(--font-mono)] text-sm tabular-nums whitespace-nowrap">
                      {fmt(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-56 border-t border-admin-border pt-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-admin-text-muted">Subtotal</span>
                <span className="font-[family-name:var(--font-mono)] tabular-nums">{fmt(data.subtotal)}</span>
              </div>
              {data.discountAmount && data.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-admin-text-muted">{data.discountLabel ?? 'Discount'}</span>
                  <span className="font-[family-name:var(--font-mono)] tabular-nums text-admin-success">
                    &minus;{fmt(data.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-admin-border pt-2.5">
                <span>Total</span>
                <span className="font-[family-name:var(--font-mono)] tabular-nums">{fmt(data.total)}</span>
              </div>
              {paidStages.map(s => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span className="text-admin-text-muted">Deposit paid</span>
                  <span className="font-[family-name:var(--font-mono)] tabular-nums text-emerald-500">
                    &minus;{fmt(s.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ PAYMENT SCHEDULE ═══ */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim mb-4">
            Payment Schedule
          </p>
          <div className="grid grid-cols-2 gap-4">
            {data.stages.map(stage => {
              const cfg = STAGE_CFG[stage.status];
              return (
                <div key={stage.id} className={`rounded-xl border p-5 ${cfg.card}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-sm font-bold leading-tight">{stage.label}</p>
                    {stage.status === 'paid' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="font-[family-name:var(--font-mono)] text-xl font-bold tabular-nums mb-1.5">
                    {fmt(stage.amount)}
                  </p>
                  <p className={`text-[10px] uppercase tracking-widest font-bold ${cfg.text}`}>
                    {stage.status === 'paid'
                      ? `Paid ${stage.paidAt ? formatDate(stage.paidAt) : ''}`
                      : stage.status === 'sent'
                      ? 'Awaiting Payment'
                      : TRIGGER_LABEL[stage.trigger]}
                  </p>
                  {stage.dueDate && stage.status !== 'paid' && (
                    <p className="text-xs text-admin-text-dim mt-1">Due {formatDate(stage.dueDate)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ BIG BALANCE DUE ═══ */}
        <div className="rounded-2xl bg-admin-bg-raised border border-admin-border py-14 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] font-extrabold text-admin-text-dim">
            Balance Due
          </p>
          <p className="font-[family-name:var(--font-mono)] text-7xl font-bold tracking-tighter text-admin-text-primary mt-4 tabular-nums">
            {fmt(balanceDue)}
          </p>
          {currentStage && (
            <p className="text-sm text-admin-text-muted mt-4">
              {TRIGGER_LABEL[currentStage.trigger]}
              {currentStage.dueDate && ` · due ${formatDate(currentStage.dueDate)}`}
            </p>
          )}
          {currentStage?.stripePaymentLinkUrl && (
            <a
              href={currentStage.stripePaymentLinkUrl}
              className="invoice-no-print inline-flex mt-6 px-8 py-3 rounded-xl bg-admin-text-primary text-admin-bg-base text-sm font-bold tracking-wide hover:opacity-80 transition-opacity"
            >
              Pay Now
            </a>
          )}
        </div>

        {/* ═══ NOTES ═══ */}
        {data.notes && (
          <div className="rounded-xl border border-admin-border bg-admin-bg-raised px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim mb-2">Notes</p>
            <p className="text-sm text-admin-text-muted leading-relaxed">{data.notes}</p>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <div className="border-t border-admin-border pt-8 flex items-start justify-between gap-8">
          <div>
            <Image
              src="/images/logo/fna-logo.svg"
              alt="Friends 'n Allies"
              width={80}
              height={24}
              className={`h-5 w-auto object-contain brightness-0 mb-3 ${lightMode ? '' : 'invert'}`}
            />
            <p className="text-xs text-admin-text-dim leading-relaxed">
              Friends &apos;n Allies LLC &middot; Los Angeles, CA<br />
              hello@fna.wtf &middot; fna.wtf
            </p>
          </div>
          <div className="text-right max-w-xs">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim mb-2">Payment</p>
            <p className="text-xs text-admin-text-muted leading-relaxed">
              Wire, ACH, or card accepted. Reference{' '}
              <span className="font-[family-name:var(--font-mono)]">{data.invoiceNumber}</span>{' '}
              on all payments. Checks payable to Friends &apos;n Allies LLC.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
