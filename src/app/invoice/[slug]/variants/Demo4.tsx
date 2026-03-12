'use client';

/**
 * Demo4 — Definitive layout
 * Header: Demo1 (logo × logo, project + invoice#, date).
 * Main grid: line items table with integrated tfoot totals (left) | details sidebar (right).
 * Full-width payment row below grid: stage cards + big balance due.
 * Notes → Footer.
 */

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import type { InvoiceData, PaymentTrigger, StageStatus } from '@/types/invoice';
import { CheckCircle2, FileText, CreditCard, FileSignature, ExternalLink, Building2, ArrowRight } from 'lucide-react';
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

function SectionHeader({ icon, title, count }: {
  icon: React.ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-admin-text-dim">{icon}</span>
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
        {title}
      </h2>
      {count !== undefined && (
        <span className="text-base text-admin-text-dim font-medium">{count}</span>
      )}
    </div>
  );
}

/* ── Pay Now button — GSAP directional fill (matches site buttons) ── */

const payIconVariants = {
  hidden: { opacity: 0, x: -8, width: 0, marginRight: -8 },
  visible: {
    opacity: 1, x: 0, width: 'auto', marginRight: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

function PayNowButton({ href }: { href: string }) {
  const btnRef = useRef<HTMLAnchorElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const btn = btnRef.current;
    const fill = fillRef.current;
    const textEl = textRef.current;
    if (!btn || !fill || !textEl) return;

    const onEnter = (e: MouseEvent) => {
      setHovered(true);
      const rect = btn.getBoundingClientRect();
      const fromLeft = e.clientX - rect.left < rect.width / 2;
      gsap.killTweensOf([fill, textEl, btn]);
      gsap.fromTo(fill, { scaleX: 0, transformOrigin: fromLeft ? '0 50%' : '100% 50%' }, { scaleX: 1, duration: 0.3, ease: 'power2.out' });
      gsap.to(textEl, { color: '#000000', duration: 0.3, ease: 'power2.out' });
      gsap.to(btn, { borderColor: '#000000', duration: 0.3, ease: 'power2.out' });
    };
    const onLeave = () => {
      setHovered(false);
      gsap.to(fill, { scaleX: 0, duration: 0.3, ease: 'power2.out' });
      gsap.to(textEl, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
      gsap.to(btn, { borderColor: 'transparent', duration: 0.3, ease: 'power2.out' });
    };

    btn.addEventListener('mouseenter', onEnter);
    btn.addEventListener('mouseleave', onLeave);
    return () => {
      btn.removeEventListener('mouseenter', onEnter);
      btn.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <a
      ref={btnRef}
      href={href}
      className="invoice-no-print relative w-full px-6 py-3 font-medium text-white bg-black border border-transparent rounded-lg overflow-hidden flex items-center justify-center mt-5"
    >
      <div
        ref={fillRef}
        className="absolute inset-0 bg-white pointer-events-none"
        style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
      />
      <span ref={textRef} className="relative flex items-center justify-center gap-2 text-white" style={{ zIndex: 10 }}>
        <motion.span variants={payIconVariants} initial="hidden" animate={hovered ? 'visible' : 'hidden'} className="flex items-center">
          <ArrowRight size={16} strokeWidth={2} />
        </motion.span>
        Pay Now
      </span>
    </a>
  );
}

/* ════════════════════════════════════════════════════════════════════ */

export function Demo4({ data }: { data: InvoiceData }) {
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

      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 py-10 space-y-10">

        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col items-center gap-4 pb-8">
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
          <div className="text-center">
            <p className="font-[family-name:var(--font-display)] font-bold text-xl sm:text-2xl tracking-tight leading-tight">
              {data.projectTitle}
            </p>
            <p className="text-sm text-admin-text-muted leading-tight mt-0.5">
              {data.projectType}
              {data.projectType && <span className="text-admin-text-dim mx-2">&bull;</span>}
              <span className="font-[family-name:var(--font-mono)] text-admin-text-dim">{data.invoiceNumber}</span>
            </p>
          </div>
        </div>

        {/* ═══ MAIN GRID: line items left, details sidebar right ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10 items-start">

          {/* ── LEFT: SCOPE OF WORK ──────────────────────────── */}
          <div>
            <SectionHeader
              icon={<FileText className="w-6 h-6" strokeWidth={1.75} />}
              title="Scope of Work"
              count={data.lineItems.length}
            />

            {/* Line items table — open style like Demo2 */}
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

              {/* Totals — integrated tfoot, right-aligned */}
              <tfoot>
                <tr>
                  <td className="pt-5 pb-2.5 text-sm text-admin-text-muted text-right pr-6">Subtotal</td>
                  <td className="pt-5 pb-2.5 text-right font-[family-name:var(--font-mono)] text-sm tabular-nums">
                    {fmt(data.subtotal)}
                  </td>
                </tr>
                {data.discountAmount && data.discountAmount > 0 && (
                  <tr>
                    <td className="py-2 text-sm text-admin-text-muted text-right pr-6">{data.discountLabel ?? 'Discount'}</td>
                    <td className="py-2 text-right font-[family-name:var(--font-mono)] text-sm tabular-nums text-admin-success">
                      &minus;{fmt(data.discountAmount)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="pt-3 pb-2.5 text-sm font-bold text-right pr-6">Total</td>
                  <td className="pt-3 pb-2.5 text-right font-[family-name:var(--font-mono)] text-base font-bold tabular-nums">
                    {fmt(data.total)}
                  </td>
                </tr>
                {paidStages.map(s => (
                  <tr key={s.id}>
                    <td className="py-2 text-sm text-admin-text-muted text-right pr-6">
                      {s.label} received {s.paidAt ? formatDate(s.paidAt) : ''}
                    </td>
                    <td className="py-2 text-right font-[family-name:var(--font-mono)] text-sm tabular-nums text-emerald-400">
                      &minus;{fmt(s.amount)}
                    </td>
                  </tr>
                ))}
              </tfoot>
            </table>
          </div>

          {/* ── RIGHT: DETAILS SIDEBAR ───────────────────────── */}
          <div>
            <SectionHeader
              icon={<Building2 className="w-6 h-6" strokeWidth={1.75} />}
              title="Bill To"
            />

            <div className="space-y-3">
              {/* Balance due + Pay Now — inside white card */}
              <div className="rounded-xl bg-white p-7 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-neutral-400">
                  Balance Due
                </p>
                <p className="font-[family-name:var(--font-mono)] text-5xl font-bold tracking-tighter text-black mt-2 tabular-nums">
                  {fmt(balanceDue)}
                </p>
                {currentStage && (
                  <p className="text-[10px] uppercase tracking-widest text-neutral-400 mt-2 font-semibold">
                    {TRIGGER_LABEL[currentStage.trigger]}
                  </p>
                )}
                {currentStage?.stripePaymentLinkUrl && (
                  <PayNowButton href={currentStage.stripePaymentLinkUrl} />
                )}
              </div>

              {/* Bill To + Project info — merged card */}
              <div className="rounded-xl border border-admin-border bg-admin-bg-raised px-5 py-5">
                <p className="text-sm font-semibold leading-snug">{data.clientName}</p>
                {data.clientCompany && (
                  <p className="text-sm text-admin-text-muted leading-snug mt-1">{data.clientCompany}</p>
                )}
                <p className="text-sm text-admin-text-muted leading-snug mt-1">{data.clientEmail}</p>

                <div className="border-t border-admin-border mt-5 pt-4 space-y-2.5">
                  <div className="flex justify-between items-baseline gap-3 text-sm">
                    <span className="text-admin-text-muted shrink-0">Project</span>
                    <span className="font-medium text-right truncate">{data.projectTitle}</span>
                  </div>
                  {data.projectType && (
                    <div className="flex justify-between items-baseline gap-3 text-sm">
                      <span className="text-admin-text-muted shrink-0">Type</span>
                      <span className="font-medium">{data.projectType}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline gap-3 text-sm">
                    <span className="text-admin-text-muted shrink-0">Issued</span>
                    <span className="font-medium">{formatDate(data.issueDate)}</span>
                  </div>
                  {currentStage?.dueDate && (
                    <div className="flex justify-between items-baseline gap-3 text-sm">
                      <span className="text-admin-text-muted shrink-0">Due</span>
                      <span className="font-semibold text-admin-danger">{formatDate(currentStage.dueDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contract zone — purple bg, standard border */}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl border border-admin-border px-4 py-4 transition-colors hover:bg-[rgba(161,77,253,0.14)]"
                style={{ backgroundColor: 'rgba(161,77,253,0.08)' }}
              >
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--admin-accent)] mb-2.5 flex items-center gap-1.5">
                  <FileSignature className="w-3 h-3" />
                  Signed Contract
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-[family-name:var(--font-mono)] font-semibold">
                    {data.invoiceNumber}-CONTRACT
                  </p>
                  <ExternalLink className="w-3.5 h-3.5 text-admin-text-dim group-hover:text-[var(--admin-accent)] transition-colors shrink-0" />
                </div>
                <p className="text-xs text-admin-text-muted mt-1">
                  Signed {paidStages[0]?.paidAt ? formatDate(paidStages[0].paidAt) : formatDate(data.issueDate)}
                </p>
              </a>

            </div>
          </div>
        </div>

        {/* ═══ PAYMENT — full width below grid ═══ */}
        <div>
          <SectionHeader
            icon={<CreditCard className="w-6 h-6" strokeWidth={1.75} />}
            title="Payment History"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.stages.map(stage => {
              const cfg = STAGE_CFG[stage.status];
              const isCurrent = stage.id === data.currentStageId;
              return (
                <div
                  key={stage.id}
                  className={`rounded-xl border p-5 flex flex-col justify-between ${cfg.card} ${isCurrent ? 'ring-1 ring-sky-500/30' : ''}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <p className="text-sm font-bold leading-tight">{stage.label}</p>
                        <p className="text-xs text-admin-text-dim mt-0.5">{TRIGGER_LABEL[stage.trigger]}</p>
                        {stage.dueDate && stage.status !== 'paid' && (
                          <p className="text-xs text-admin-text-dim mt-0.5">by {formatDate(stage.dueDate)}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className={`font-[family-name:var(--font-mono)] text-3xl font-bold tabular-nums tracking-tight ${cfg.amount}`}>
                      {fmt(stage.amount)}
                    </p>
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
          </div>
        </div>

        {/* ═══ NOTES ═══ */}
        {data.notes && (
          <div className="rounded-xl border border-admin-border bg-admin-bg-raised px-5 py-4">
            <p className="text-xs uppercase tracking-[0.15em] font-bold text-admin-text-dim mb-2">Notes</p>
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
