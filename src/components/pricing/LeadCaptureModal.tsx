'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ChevronDown, ArrowRight, X } from 'lucide-react';
import { logPricingLead } from '@/lib/pricing/logPricingLead';
import { setLeadCookie } from '@/lib/pricing/leadCookie';
import type { LeadData } from '@/lib/pricing/leadCookie';

// ── Timeline options ──────────────────────────────────────────────────────

const TIMELINE_OPTIONS = [
  { value: 'asap',     label: 'We need this yesterday!' },
  { value: 'soon',     label: 'Sooner the better, within the next 6 weeks!' },
  { value: 'later',    label: "We've got some time, at least two months." },
  { value: 'specific', label: 'Specific date...' },
  { value: 'unsure',   label: 'Unsure.' },
] as const;

// ── Shared input class ────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2.5 bg-black border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/50 transition-colors';

// ── Icon reveal variants ──────────────────────────────────────────────────

const iconVariants = {
  hidden: { opacity: 0, x: -8, width: 0, marginRight: -8 },
  visible: {
    opacity: 1, x: 0, width: 'auto', marginRight: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Submit button (matches ClientLoginButton pattern exactly) ─────────────

function SubmitButton({ submitting }: { submitting: boolean }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (submitting) return;
    const btn = btnRef.current;
    const fill = fillRef.current;
    if (!btn || !fill) return;
    const textSpan = btn.querySelector('span');

    const onEnter = (e: MouseEvent) => {
      setHovered(true);
      const rect = btn.getBoundingClientRect();
      const fromLeft = e.clientX - rect.left < rect.width / 2;
      gsap.killTweensOf([fill, textSpan]);
      gsap.fromTo(fill, { scaleX: 0, transformOrigin: fromLeft ? '0 50%' : '100% 50%' }, { scaleX: 1, duration: 0.3, ease: 'power2.out' });
      if (textSpan) gsap.to(textSpan, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
    };
    const onLeave = () => {
      setHovered(false);
      gsap.to(fill, { scaleX: 0, duration: 0.3, ease: 'power2.out' });
      if (textSpan) gsap.to(textSpan, { color: '#000000', duration: 0.3, ease: 'power2.out' });
    };

    btn.addEventListener('mouseenter', onEnter);
    btn.addEventListener('mouseleave', onLeave);
    return () => {
      btn.removeEventListener('mouseenter', onEnter);
      btn.removeEventListener('mouseleave', onLeave);
    };
  }, [submitting]);

  return (
    <button
      ref={btnRef}
      type="submit"
      disabled={submitting}
      className={`relative w-full px-4 py-3 font-medium rounded-lg overflow-hidden border transition-all duration-300 ${
        submitting
          ? 'text-muted-foreground/40 bg-muted/10 border-border/40 cursor-not-allowed'
          : 'text-black bg-white border-white cursor-pointer'
      }`}
    >
      {!submitting && (
        <div
          ref={fillRef}
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
        />
      )}
      <span className="relative flex items-center justify-center gap-2" style={{ zIndex: 10 }}>
        {submitting ? (
          <>
            <span className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <motion.span variants={iconVariants} initial="hidden" animate={hovered ? 'visible' : 'hidden'} className="flex items-center">
              <ArrowRight size={16} strokeWidth={2} />
            </motion.span>
            Continue
          </>
        )}
      </span>
    </button>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────

interface LeadCaptureModalProps {
  onComplete: (data: LeadData) => void;
  onDismiss?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────

const todayStr = new Date().toISOString().split('T')[0];

export function LeadCaptureModal({ onComplete, onDismiss }: LeadCaptureModalProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [timeline, setTimeline] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!email.trim()) {
      e.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = 'Please enter a valid email address.';
    }
    if (!timeline) e.timeline = 'Please select a timeline.';
    if (timeline === 'specific' && !dateStr) e.timelineDate = 'Please select a date.';
    if (!agreedToTerms) e.terms = 'You must agree to continue.';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);

    const data: LeadData = {
      name: name.trim(),
      company: company.trim() || undefined,
      email: email.trim().toLowerCase(),
      timeline,
      timelineDate: timeline === 'specific' && dateStr ? dateStr : undefined,
    };

    await logPricingLead(data, 'gate');
    setLeadCookie(data);
    onComplete(data);
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const modal = (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/65"
        style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={onDismiss}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4 py-8 overflow-y-auto"
      >
        <div
          className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-6 pointer-events-auto shadow-2xl my-auto"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Save Progress</h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                Enter your details to save your progress and get a custom quote sent to your inbox.
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-4 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-white hover:bg-white/15 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                autoFocus
                onChange={(e) => { setName(e.target.value); clearError('name'); }}
                className={`${inputClass} ${errors.name ? 'border-red-500/60' : ''}`}
              />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>

            {/* Company */}
            <div>
              <input
                type="text"
                placeholder="Company (optional)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                className={`${inputClass} ${errors.email ? 'border-red-500/60' : ''}`}
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>

            {/* Timeline dropdown */}
            <div>
              <div className="relative">
                <select
                  value={timeline}
                  onChange={(e) => { setTimeline(e.target.value); clearError('timeline'); clearError('timelineDate'); setDateStr(''); }}
                  className={`${inputClass} appearance-none pr-8 cursor-pointer ${
                    errors.timeline ? 'border-red-500/60' : ''
                  } ${!timeline ? 'text-muted-foreground/40' : ''}`}
                >
                  <option value="" disabled>Timeline</option>
                  {TIMELINE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-surface text-foreground">
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
              </div>
              {errors.timeline && <p className="text-xs text-red-400 mt-1">{errors.timeline}</p>}
            </div>

            {/* Date input — shown when 'specific' is selected */}
            {timeline === 'specific' && (
              <div>
                <input
                  type="date"
                  value={dateStr}
                  min={todayStr}
                  onChange={(e) => { setDateStr(e.target.value); clearError('timelineDate'); }}
                  className={`${inputClass} [color-scheme:dark] ${errors.timelineDate ? 'border-red-500/60' : ''}`}
                />
                {errors.timelineDate && <p className="text-xs text-red-400 mt-1">{errors.timelineDate}</p>}
              </div>
            )}

            {/* Terms checkbox */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    onClick={() => { setAgreedToTerms((v) => !v); clearError('terms'); }}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      agreedToTerms
                        ? 'bg-accent border-accent'
                        : 'border-muted-foreground/40 group-hover:border-muted-foreground/60'
                    } ${errors.terms ? 'border-red-500/60' : ''}`}
                  >
                    {agreedToTerms && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span
                  onClick={() => { setAgreedToTerms((v) => !v); clearError('terms'); }}
                  className="text-xs text-muted-foreground leading-relaxed"
                >
                  I agree to be contacted by Friends &apos;n Allies regarding this quote. We&apos;ll never share your info or spam you.
                </span>
              </label>
              {errors.terms && <p className="text-xs text-red-400 mt-1">{errors.terms}</p>}
            </div>

            <SubmitButton submitting={submitting} />
          </form>
        </div>
      </motion.div>
    </>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modal, document.body);
}
