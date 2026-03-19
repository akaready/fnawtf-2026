'use client';

/**
 * Demo6 — Polished Demo5
 * Single column (760px), dark default.
 * Improvements: white balance card, aligned payment amounts, tfoot totals,
 * ghost doc buttons, footer logo, amber notes accent, stage-labeled paid rows.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import type { InvoiceData, PaymentTrigger, StageStatus } from '@/types/invoice';
import { CheckSquare, FileText, CreditCard, FileSignature, BadgeDollarSign } from 'lucide-react';
import { PortalNav } from '../PortalNav';
import { buildDemoData, type DemoStage, type DemoDiscount } from '../demoData';

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
  signing:           'Due upon signing',
  delivery:          'Due upon final delivery',
  'campaign-launch': 'Due upon campaign launch',
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

/* ── Section header ──────────────────────────────────────────────────── */

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

/* ── Pay Now button — GSAP directional fill ──────────────────────── */

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
      className="invoice-no-print relative w-full max-w-xs mx-auto px-6 py-3 font-medium text-white bg-black border border-transparent rounded-lg overflow-hidden flex items-center justify-center mt-6"
    >
      <div
        ref={fillRef}
        className="absolute inset-0 bg-white pointer-events-none"
        style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
      />
      <span ref={textRef} className="relative flex items-center justify-center gap-2 text-white" style={{ zIndex: 10 }}>
        <motion.span variants={payIconVariants} initial="hidden" animate={hovered ? 'visible' : 'hidden'} className="flex items-center">
          <BadgeDollarSign size={16} strokeWidth={2} />
        </motion.span>
        Pay Now
      </span>
    </a>
  );
}

/* ── Dev mode toolbar ────────────────────────────────────────────────── */

function DevToolbar({
  stage, setStage,
  discount, setDiscount,
}: {
  stage: DemoStage;
  setStage: (s: DemoStage) => void;
  discount: DemoDiscount;
  setDiscount: (d: DemoDiscount) => void;
}) {
  const pill = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
      active
        ? 'bg-admin-text-primary text-admin-bg-base'
        : 'text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover'
    }`;

  return (
    <div className="invoice-no-print sticky top-12 z-40 flex items-center justify-center gap-6 px-5 py-2 border-b border-admin-border bg-admin-bg-inset">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest font-bold text-admin-text-dim mr-1">Stage</span>
        <div className="flex items-center gap-0.5 bg-admin-bg-base border border-admin-border rounded-lg p-0.5">
          <button className={pill(stage === 1)} onClick={() => setStage(1)}>Deposit</button>
          <button className={pill(stage === 2)} onClick={() => setStage(2)}>Final</button>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest font-bold text-admin-text-dim mr-1">Discount</span>
        <div className="flex items-center gap-0.5 bg-admin-bg-base border border-admin-border rounded-lg p-0.5">
          <button className={pill(discount === 'none')} onClick={() => setDiscount('none')}>None</button>
          <button className={pill(discount === 'friendly')} onClick={() => setDiscount('friendly')}>5%</button>
          <button className={pill(discount === 'loyalty')} onClick={() => setDiscount('loyalty')}>10%</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Demo6({ data: _initialData }: { data: InvoiceData }) {
  const [lightMode, setLightMode] = useState(false);
  const [stage, setStage] = useState<DemoStage>(2);
  const [discount, setDiscount] = useState<DemoDiscount>('none');

  const data = useMemo(() => buildDemoData(stage, discount), [stage, discount]);

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
        showDocTabs={false}
      />

      <DevToolbar
        stage={stage} setStage={setStage}
        discount={discount} setDiscount={setDiscount}
      />

      <div className="max-w-[760px] mx-auto px-8 sm:px-12 py-14 space-y-10">

        {/* ═══ HEADER — centered, balanced ═══ */}
        <div className="flex flex-col items-center gap-8 pb-4">
          <div className="flex items-center gap-6">
            {data.clientLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.clientLogoUrl}
                alt={data.clientCompany ?? data.clientName}
                height={56}
                className="h-14 w-auto object-contain brightness-0 invert admin-logo"
              />
            )}
            <span className="text-admin-text-dim text-4xl font-extralight leading-none">&times;</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo/fna-logo.svg"
              alt="Friends 'n Allies"
              width={160}
              height={56}
              className="h-12 w-auto object-contain brightness-0 invert"
            />
          </div>
          <div className="text-center">
            <p className="font-[family-name:var(--font-display)] font-bold text-3xl tracking-tight leading-tight">
              {data.projectTitle}
            </p>
            <p className="text-sm text-admin-text-muted leading-tight mt-1.5">
              {data.projectType}
              {data.projectType && <span className="text-admin-text-dim mx-2">&bull;</span>}
              <span className="font-[family-name:var(--font-mono)] text-admin-text-dim">{data.invoiceNumber}</span>
            </p>
          </div>
        </div>

        {/* ═══ BILL TO + DETAILS — single card, two columns ═══ */}
        <div className="rounded-xl border border-admin-border bg-admin-bg-raised">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-6">
            {/* Left: Bill To */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim mb-3">Bill To</p>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold">{data.clientName}</p>
                {data.clientCompany && <p className="text-sm text-admin-text-muted">{data.clientCompany}</p>}
                <p className="text-sm text-admin-text-muted">{data.clientEmail}</p>
              </div>
            </div>

            {/* Right: Details */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim mb-3">Details</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-1.5 text-sm">
                <span className="text-admin-text-muted">Invoice</span>
                <span className="font-[family-name:var(--font-mono)] font-medium">{data.invoiceNumber}</span>

                <span className="text-admin-text-muted">Issued</span>
                <span className="font-medium">{formatDate(data.issueDate)}</span>

                {currentStage?.dueDate && <>
                  <span className="text-admin-text-muted">Due</span>
                  <span className="font-semibold text-admin-danger">{formatDate(currentStage.dueDate)}</span>
                </>}

                <span className="text-admin-text-muted">Project</span>
                <span className="font-medium">{data.projectTitle}</span>

                {data.projectType && <>
                  <span className="text-admin-text-muted">Type</span>
                  <span className="font-medium">{data.projectType}</span>
                </>}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SCOPE OF WORK ═══ */}
        <div>
          <SectionHeader
            icon={<FileText className="w-6 h-6" strokeWidth={1.75} />}
            title="Scope of Work"
            count={data.lineItems.length}
          />

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

            {/* ── Totals in tfoot ── */}
            <tfoot>
              <tr>
                <td className="pt-6 pb-2.5 text-sm text-admin-text-muted text-right pr-6">Subtotal</td>
                <td className="pt-6 pb-2.5 text-right font-[family-name:var(--font-mono)] text-sm tabular-nums">
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
              <tr className="border-t border-admin-border">
                <td className="pt-3 pb-2.5 text-sm font-bold text-right pr-6">Total</td>
                <td className="pt-3 pb-2.5 text-right font-[family-name:var(--font-mono)] text-base font-bold tabular-nums">
                  {fmt(data.total)}
                </td>
              </tr>
              {paidStages.map(s => (
                <tr key={s.id}>
                  <td className="py-2 text-sm text-admin-text-muted text-right pr-6">
                    {s.label} received
                  </td>
                  <td className="py-2 text-right font-[family-name:var(--font-mono)] text-sm tabular-nums text-emerald-400">
                    &minus;{fmt(s.amount)}
                  </td>
                </tr>
              ))}
            </tfoot>
          </table>
        </div>

        {/* ═══ PAYMENTS ═══ */}
        <div>
          <SectionHeader
            icon={<CreditCard className="w-6 h-6" strokeWidth={1.75} />}
            title="Payments"
          />

          <div className="grid grid-cols-2 gap-4">
            {data.stages.map(stg => {
              const cfg = STAGE_CFG[stg.status];
              const isCurrent = stg.id === data.currentStageId;
              return (
                <div
                  key={stg.id}
                  className={`rounded-xl border p-5 flex flex-col ${cfg.card} ${isCurrent ? 'ring-1 ring-sky-500/30' : ''}`}
                >
                  {/* Header: label + trigger + due/received date */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-sm font-bold leading-tight">{stg.label}</p>
                      <p className="text-xs text-admin-text-dim mt-0.5">{TRIGGER_LABEL[stg.trigger]}</p>
                      {stg.dueDate && stg.status !== 'paid' && (
                        <p className="text-xs text-admin-text-dim mt-0.5">by {formatDate(stg.dueDate)}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  {/* Amount — always at bottom, aligned across cards */}
                  <p className={`font-[family-name:var(--font-mono)] text-3xl font-bold tabular-nums tracking-tight mt-auto ${cfg.amount}`}>
                    {fmt(stg.amount)}
                  </p>
                  {/* Received date below amount */}
                  {stg.paidAt ? (
                    <p className="text-xs text-admin-text-dim mt-2 flex items-center gap-1">
                      {formatDate(stg.paidAt)}
                      <CheckSquare className="w-3 h-3 text-emerald-400 shrink-0" />
                    </p>
                  ) : (
                    <div className="h-5 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ BALANCE DUE + PAY NOW — white card ═══ */}
        <div className="rounded-2xl bg-white py-14 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] font-extrabold text-neutral-400">
            Balance Due
          </p>
          <p className="font-[family-name:var(--font-mono)] text-7xl font-bold tracking-tighter text-black mt-4 tabular-nums">
            {fmt(balanceDue)}
          </p>
          {currentStage && (
            <p className="text-sm text-neutral-400 mt-4">
              {TRIGGER_LABEL[currentStage.trigger]}
              {currentStage.dueDate && ` · due ${formatDate(currentStage.dueDate)}`}
            </p>
          )}
          {currentStage?.stripePaymentLinkUrl && (
            <PayNowButton href={currentStage.stripePaymentLinkUrl} />
          )}

          {/* Related documents — ghost buttons */}
          <div className="invoice-no-print flex items-center justify-center gap-4 mt-8 pt-6 border-t border-neutral-200 mx-auto max-w-xs">
            <a
              href="#"
              className="inline-flex items-center gap-1.5 border border-neutral-300 rounded-lg px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Proposal
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-1.5 border border-neutral-300 rounded-lg px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors"
            >
              <FileSignature className="w-3.5 h-3.5" />
              Contract
            </a>
          </div>
        </div>

        {/* ═══ NOTES — amber left accent ═══ */}
        {data.notes && (
          <div className="rounded-xl border border-admin-border bg-admin-bg-raised px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim mb-2">Notes</p>
            <p className="text-sm text-admin-text-muted leading-relaxed">{data.notes}</p>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <div className="border-t border-admin-border pt-8 flex items-start justify-between gap-8">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo/fna-logo.svg"
              alt="Friends 'n Allies"
              width={80}
              height={24}
              className="h-5 w-auto object-contain brightness-0 invert mb-3"
            />
            <p className="text-xs text-admin-text-dim leading-relaxed">
              Friends &apos;n Allies LLC<br />
              1541 Wilcox Ave, Suite 304<br />
              Los Angeles, CA 90028<br />
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
