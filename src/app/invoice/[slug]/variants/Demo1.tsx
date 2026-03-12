'use client';

/**
 * Demo1 — Split layout
 * Dark default with light toggle via PortalNav.
 * Left: full line items. Right: payment stages + big balance due.
 * Aesthetic mirrors call sheet Demo4.
 */

import { useState } from 'react';
import Image from 'next/image';
import type { InvoiceData, PaymentTrigger, StageStatus } from '@/types/invoice';
import { CheckCircle2, FileText, CreditCard } from 'lucide-react';
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
  sent:    { label: 'Awaiting payment', card: 'border-sky-500/40 bg-sky-500/10',        amount: 'text-sky-300',    badge: 'bg-sky-500/20 text-sky-400' },
  pending: { label: 'Not yet due',      card: 'border-admin-border bg-admin-bg-raised', amount: 'text-admin-text-muted', badge: 'bg-admin-bg-hover text-admin-text-dim' },
  overdue: { label: 'Overdue',          card: 'border-red-500/30 bg-red-500/10',        amount: 'text-red-400',    badge: 'bg-red-500/20 text-red-400' },
};

/* ════════════════════════════════════════════════════════════════════ */

export function Demo1({ data }: { data: InvoiceData }) {
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
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between pb-8 border-b border-admin-border">

          {/* Logos + project */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
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
              <span className="text-admin-text-dim text-sm">&times;</span>
              <Image
                src="/images/logo/fna-logo.svg"
                alt="Friends 'n Allies"
                width={140}
                height={48}
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </div>

            <div className="hidden sm:block h-10 w-px bg-admin-border" />

            <div className="text-center sm:text-left">
              <p className="font-[family-name:var(--font-display)] font-bold text-xl sm:text-2xl tracking-tight leading-tight">
                {data.projectTitle}
              </p>
              <p className="text-sm sm:text-base text-admin-text-muted leading-tight mt-0.5">
                {data.projectType}
                {data.projectType && <span className="text-admin-text-dim mx-2">&bull;</span>}
                <span className="font-[family-name:var(--font-mono)] text-admin-text-dim">{data.invoiceNumber}</span>
              </p>
            </div>
          </div>

          {/* Issued date */}
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest font-bold text-admin-text-dim leading-none mb-1">Issued</p>
            <p className="text-sm font-semibold leading-none">{formatDate(data.issueDate)}</p>
          </div>
        </div>

        {/* ═══ BODY GRID ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

          {/* ── LEFT: LINE ITEMS ────────────────────────────────── */}
          <div className="space-y-6">

            <div className="flex items-center gap-3">
              <span className="text-admin-text-dim"><FileText className="w-5 h-5" strokeWidth={1.75} /></span>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
                Scope of Work
              </h2>
            </div>

            {Object.entries(groups).map(([category, items]) => (
              <div key={category}>
                <p className="text-xs uppercase tracking-[0.15em] font-bold text-admin-text-dim mb-2.5 px-1">
                  {category}
                </p>
                <div className="rounded-xl border border-admin-border bg-admin-bg-raised overflow-hidden">
                  {items.map((item, i) => (
                    <div
                      key={i}
                      className={`flex justify-between items-center px-5 py-3.5 ${
                        i < items.length - 1 ? 'border-b border-admin-border-subtle' : ''
                      }`}
                    >
                      <span className="text-sm text-admin-text-primary">{item.name}</span>
                      <span className="font-[family-name:var(--font-mono)] text-sm font-semibold tabular-nums shrink-0 ml-4">
                        {fmt(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="rounded-xl border border-admin-border bg-admin-bg-raised overflow-hidden">
              <div className="flex justify-between items-center px-5 py-3.5 border-b border-admin-border-subtle">
                <span className="text-sm text-admin-text-muted">Subtotal</span>
                <span className="font-[family-name:var(--font-mono)] text-sm tabular-nums">{fmt(data.subtotal)}</span>
              </div>
              {data.discountAmount && data.discountAmount > 0 && (
                <div className="flex justify-between items-center px-5 py-3.5 border-b border-admin-border-subtle">
                  <span className="text-sm text-admin-text-muted">{data.discountLabel ?? 'Discount'}</span>
                  <span className="font-[family-name:var(--font-mono)] text-sm tabular-nums text-admin-success">
                    &minus;{fmt(data.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center px-5 py-4 border-b border-admin-border-subtle">
                <span className="text-sm font-bold">Total</span>
                <span className="font-[family-name:var(--font-mono)] text-base font-bold tabular-nums">{fmt(data.total)}</span>
              </div>
              {paidStages.map(s => (
                <div key={s.id} className="flex justify-between items-center px-5 py-3.5 last:border-b-0 border-b border-admin-border-subtle">
                  <span className="text-sm text-admin-text-muted">
                    {s.label} received {s.paidAt ? formatDate(s.paidAt) : ''}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-sm tabular-nums text-emerald-400">
                    &minus;{fmt(s.amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bill To */}
            <div className="rounded-xl border border-admin-border bg-admin-bg-raised px-5 py-4">
              <p className="text-xs uppercase tracking-[0.15em] font-bold text-admin-text-dim mb-3">Bill To</p>
              <p className="text-sm font-semibold">{data.clientName}</p>
              {data.clientCompany && <p className="text-sm text-admin-text-muted">{data.clientCompany}</p>}
              <p className="text-sm text-admin-text-muted">{data.clientEmail}</p>
            </div>

            {/* Notes */}
            {data.notes && (
              <div className="rounded-xl border border-admin-border bg-admin-bg-raised px-5 py-4">
                <p className="text-xs uppercase tracking-[0.15em] font-bold text-admin-text-dim mb-2">Notes</p>
                <p className="text-sm text-admin-text-muted leading-relaxed">{data.notes}</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: STAGES + BIG TOTAL ───────────────────────── */}
          <div className="space-y-4">

            <div className="flex items-center gap-3 mb-2">
              <span className="text-admin-text-dim"><CreditCard className="w-5 h-5" strokeWidth={1.75} /></span>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
                Payments
              </h2>
            </div>

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
                      {stage.dueDate && (
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

            {/* ── BIG TOTAL — mirrors Demo4's call time block ── */}
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

        {/* ═══ FOOTER ═══ */}
        <div className="border-t border-admin-border pt-8 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-8">
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
            <p className="text-xs uppercase tracking-[0.15em] font-bold text-admin-text-dim mb-2">Payment Instructions</p>
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
