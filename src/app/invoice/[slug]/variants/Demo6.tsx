'use client';

/**
 * Demo6 — Polished linear invoice
 * Single column (760px), dark default, auto-light-mode print.
 * No PortalNav — standalone print button.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import type { InvoiceData, PaymentTrigger, StageStatus } from '@/types/invoice';
import { CheckSquare, FileText, CreditCard, FileSignature, BadgeDollarSign, Printer, Mail } from 'lucide-react';
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

function GsapLink({ href, onClick, children, className = '' }: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const fill = fillRef.current;
    const textEl = textRef.current;
    if (!el || !fill || !textEl) return;

    const onEnter = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const fromLeft = e.clientX - rect.left < rect.width / 2;
      gsap.killTweensOf([fill, textEl]);
      gsap.fromTo(fill, { scaleX: 0, transformOrigin: fromLeft ? '0 50%' : '100% 50%' }, { scaleX: 1, duration: 0.3, ease: 'power2.out' });
      gsap.to(textEl, { color: '#000000', duration: 0.3, ease: 'power2.out' });
    };
    const onLeave = () => {
      gsap.to(fill, { scaleX: 0, duration: 0.3, ease: 'power2.out' });
      gsap.to(textEl, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
    };

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const sharedClass = `relative px-4 py-2 font-medium text-white bg-black border border-white/20 rounded-lg overflow-hidden inline-flex items-center justify-center ${className}`;

  const inner = (
    <>
      <div
        ref={fillRef}
        className="absolute inset-0 bg-white pointer-events-none"
        style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
      />
      <span ref={textRef} className="relative flex items-center gap-2 text-white text-sm" style={{ zIndex: 10 }}>
        {children}
      </span>
    </>
  );

  if (href) {
    return <a ref={ref as React.RefObject<HTMLAnchorElement>} href={href} className={sharedClass}>{inner}</a>;
  }
  return <button ref={ref as React.RefObject<HTMLButtonElement>} onClick={onClick} className={sharedClass}>{inner}</button>;
}

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
      gsap.to(textEl, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
      gsap.to(btn, { borderColor: '#ffffff', duration: 0.3, ease: 'power2.out' });
    };
    const onLeave = () => {
      setHovered(false);
      gsap.to(fill, { scaleX: 0, duration: 0.3, ease: 'power2.out' });
      gsap.to(textEl, { color: '#000000', duration: 0.3, ease: 'power2.out' });
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
      className="invoice-no-print relative w-full max-w-xs mx-auto px-6 py-3 font-medium text-black bg-white border border-transparent rounded-lg overflow-hidden flex items-center justify-center mt-6"
    >
      <div
        ref={fillRef}
        className="absolute inset-0 bg-black pointer-events-none"
        style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
      />
      <span ref={textRef} className="relative flex items-center justify-center gap-2 text-black" style={{ zIndex: 10 }}>
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
    <div className="invoice-no-print sticky top-0 z-40 flex items-center justify-center gap-6 px-5 py-2 border-b border-admin-border bg-admin-bg-inset">
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
  const [stage, setStage] = useState<DemoStage>(2);
  const [discount, setDiscount] = useState<DemoDiscount>('none');
  const shellRef = useRef<HTMLDivElement>(null);

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

  /* Print: temporarily flip to light mode, print, flip back */
  const handlePrint = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    el.classList.add('cs-light');
    requestAnimationFrame(() => {
      window.print();
      el.classList.remove('cs-light');
    });
  }, []);

  return (
    <div ref={shellRef} className="min-h-screen bg-admin-bg-base text-admin-text-primary">

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
                className="h-14 w-auto object-contain brightness-0 invert admin-logo invoice-print-invert"
              />
            )}
            <span className="text-admin-text-dim text-4xl font-extralight leading-none">&times;</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo/fna-logo.svg"
              alt="Friends 'n Allies"
              width={160}
              height={56}
              className="h-12 w-auto object-contain brightness-0 invert invoice-print-invert"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-14 p-6">
            {/* Left: Bill To */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim mb-3">Bill To</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-1.5 text-sm">
                {data.clientCompany && <>
                  <span className="text-admin-text-muted">Company</span>
                  <span className="font-medium">{data.clientCompany}</span>
                </>}
                <span className="text-admin-text-muted">Name</span>
                <span className="font-medium">{data.clientName}</span>
                {data.clientTitle && <>
                  <span className="text-admin-text-muted">Title</span>
                  <span className="font-medium">{data.clientTitle}</span>
                </>}
                <span className="text-admin-text-muted">Email</span>
                <span className="font-medium">{data.clientEmail}</span>
                {data.clientPhone && <>
                  <span className="text-admin-text-muted">Phone</span>
                  <span className="font-medium">{data.clientPhone}</span>
                </>}
              </div>
            </div>

            {/* Right: Details — client/project context first, then dates */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-admin-text-dim mb-3">Details</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-1.5 text-sm">
                <span className="text-admin-text-muted">Project</span>
                <span className="font-medium">{data.projectTitle}</span>

                {data.projectType && <>
                  <span className="text-admin-text-muted">Type</span>
                  <span className="font-medium">{data.projectType}</span>
                </>}

                <span className="text-admin-text-muted">Invoice</span>
                <span className="font-medium font-[family-name:var(--font-mono)]">{data.invoiceNumber}</span>

                <span className="text-admin-text-muted">Issued</span>
                <span className="font-medium">{formatDate(data.issueDate)}</span>

                {currentStage?.dueDate && <>
                  <span className="text-admin-text-muted">Due</span>
                  <span className={`font-medium ${currentStage.status === 'overdue' ? 'text-admin-danger' : ''}`}>
                    {formatDate(currentStage.dueDate)}
                  </span>
                </>}
              </div>
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

          {/* Totals — right-aligned, partial-width border */}
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
                  <span className="text-admin-text-muted">{s.label} received</span>
                  <span className="font-[family-name:var(--font-mono)] tabular-nums text-emerald-400">
                    &minus;{fmt(s.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
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
                  className={`rounded-xl border px-6 py-7 flex flex-col ${cfg.card} ${isCurrent ? 'ring-1 ring-sky-500/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-6">
                    <div className="space-y-1">
                      <p className="text-sm font-bold leading-tight">{stg.label}</p>
                      <p className="text-xs text-admin-text-dim">{TRIGGER_LABEL[stg.trigger]}</p>
                      {stg.paidAt && (
                        <p className="text-xs text-admin-text-dim flex items-center gap-1">
                          {formatDate(stg.paidAt)}
                          <CheckSquare className="w-3 h-3 text-emerald-400 shrink-0" />
                        </p>
                      )}
                      {stg.dueDate && stg.status !== 'paid' && (
                        <p className="text-xs text-admin-text-dim">by {formatDate(stg.dueDate)}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  <p className={`font-[family-name:var(--font-mono)] text-3xl font-bold tabular-nums tracking-tight mt-auto ${cfg.amount}`}>
                    {fmt(stg.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ BALANCE DUE + PAY NOW ═══ */}
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
            <PayNowButton href={currentStage.stripePaymentLinkUrl} />
          )}

          {/* Related documents — ghost buttons */}
          <div className="invoice-no-print flex items-center justify-center gap-4 mt-8 pt-6 border-t border-admin-border mx-auto max-w-xs">
            <a
              href="#"
              className="inline-flex items-center gap-1.5 border border-admin-border rounded-lg px-4 py-2 text-sm font-medium text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-primary transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Proposal
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-1.5 border border-admin-border rounded-lg px-4 py-2 text-sm font-medium text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-primary transition-colors"
            >
              <FileSignature className="w-3.5 h-3.5" />
              Contract
            </a>
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
        <div className="border-t border-admin-border pt-5 flex items-center justify-between gap-8">
          <p className="text-xs text-admin-text-dim leading-relaxed">
            Friends &apos;n Allies LLC<br />
            1541 Wilcox Ave, Suite 304<br />
            Los Angeles, CA 90028
          </p>
          <div className="flex items-center gap-3">
            <GsapLink href="mailto:hi@fna.wtf">
              <Mail className="w-4 h-4" />
              hi@fna.wtf
            </GsapLink>
            <GsapLink onClick={handlePrint} className="invoice-no-print !px-2.5">
              <Printer className="w-4 h-4" />
            </GsapLink>
          </div>
        </div>

      </div>
    </div>
  );
}
