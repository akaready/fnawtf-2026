'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { X, Download } from 'lucide-react';
import type { QuoteData, ContactInfo } from '@/lib/pdf/types';
import { PLACEHOLDER_CONTACT } from '@/lib/pdf/types';
import { logQuoteLead } from '@/lib/pdf/logQuoteLead';

// ── Types ─────────────────────────────────────────────────────────────────

type Phase = 'waiting' | 'paused' | 'generating' | 'ready' | 'error';

interface QuoteModalProps {
  quoteData: QuoteData;
  onClose: () => void;
}

// ── Icon reveal animation (matches SaveQuoteButton / GetStartedButton) ────

const iconVariants = {
  hidden: { opacity: 0, x: -8, width: 0, marginRight: -8 },
  visible: {
    opacity: 1, x: 0, width: 'auto', marginRight: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Download button (GSAP hover + disabled state) ─────────────────────────

function DownloadButton({
  phase,
  onDownload,
  onManualGenerate,
}: {
  phase: Phase;
  onDownload: () => void;
  onManualGenerate: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const isActive = phase === 'ready' || phase === 'paused';

  useEffect(() => {
    if (!isActive || !btnRef.current || !fillRef.current) return;

    const btn = btnRef.current;
    const fill = fillRef.current;
    const textSpan = btn.querySelector('span');

    const onEnter = (e: MouseEvent) => {
      setHovered(true);
      const rect = btn.getBoundingClientRect();
      const fromLeft = e.clientX - rect.left < rect.width / 2;
      gsap.killTweensOf([fill, textSpan]);
      gsap.fromTo(
        fill,
        { scaleX: 0, transformOrigin: fromLeft ? '0 50%' : '100% 50%' },
        { scaleX: 1, duration: 0.3, ease: 'power2.out' },
      );
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
  }, [isActive]);

  const handleClick = () => {
    if (phase === 'ready') onDownload();
    else if (phase === 'paused') onManualGenerate();
  };

  const label = phase === 'paused' ? 'Generate & Download PDF' : 'Download PDF';

  return (
    <motion.button
      ref={btnRef}
      onClick={handleClick}
      disabled={!isActive}
      whileHover={isActive ? { scale: 1.02 } : {}}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`relative w-full px-4 py-3 font-medium rounded-lg overflow-hidden border transition-all duration-300 ${
        isActive
          ? 'text-black bg-white border-white cursor-pointer'
          : 'text-muted-foreground/40 bg-muted/10 border-border/40 cursor-not-allowed'
      }`}
    >
      {isActive && (
        <div
          ref={fillRef}
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
        />
      )}
      <span className="relative flex items-center justify-center gap-2" style={{ zIndex: 10 }}>
        <motion.span
          variants={iconVariants}
          initial="hidden"
          animate={hovered && isActive ? 'visible' : 'hidden'}
          className="flex items-center"
        >
          <Download size={18} strokeWidth={2} />
        </motion.span>
        {label}
      </span>
    </motion.button>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────

export function QuoteModal({ quoteData, onClose }: QuoteModalProps) {
  const [phase, setPhase] = useState<Phase>('waiting');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressObj = useRef({ value: 0 });
  const waitTween = useRef<gsap.core.Tween | null>(null);
  const hasTyped = useRef(false);

  // Start generation (used by both auto and manual paths)
  const startGeneration = useCallback(
    async (contact: ContactInfo, generatedBy: 'auto' | 'manual') => {
      // Ensure bar is visually full before generation begins.
      // Auto path: waiting tween already completed at 100% — resolves immediately.
      // Manual path: bar was paused mid-fill — animate to 100% first.
      gsap.killTweensOf(progressObj.current);
      await new Promise<void>(resolve => {
        if (progressObj.current.value >= 100) { resolve(); return; }
        gsap.to(progressObj.current, {
          value: 100,
          duration: 0.4,
          ease: 'power2.out',
          onUpdate: () => {
            if (progressBarRef.current)
              progressBarRef.current.style.width = `${progressObj.current.value}%`;
          },
          onComplete: resolve,
        });
      });

      try {
        const { generateQuotePDF } = await import('@/lib/pdf/generateQuotePDF');
        const blob = await generateQuotePDF(quoteData, contact);
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        logQuoteLead(quoteData, contact, generatedBy);
        // Bar stays at 100% — CSS transition-colors fades purple → green
        setPhase('ready');
      } catch (err) {
        console.error('PDF generation failed:', err);
        setErrorMsg('Failed to generate PDF. Please try again.');
        setPhase('error');
      }
    },
    [quoteData],
  );

  // 5-second waiting countdown on mount
  useEffect(() => {
    progressObj.current.value = 0;
    if (progressBarRef.current) progressBarRef.current.style.width = '0%';

    const tween = gsap.to(progressObj.current, {
      value: 100,
      duration: 5,
      ease: 'none',
      onUpdate: () => {
        if (progressBarRef.current)
          progressBarRef.current.style.width = `${progressObj.current.value}%`;
      },
      onComplete: () => {
        if (!hasTyped.current) {
          setPhase('generating');
          startGeneration(PLACEHOLDER_CONTACT, 'auto');
        }
      },
    });

    waitTween.current = tween;
    return () => { tween.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle any field input — pauses the countdown
  const handleInput = useCallback(() => {
    if (hasTyped.current || phase !== 'waiting') return;
    hasTyped.current = true;
    waitTween.current?.pause();
    setPhase('paused');
  }, [phase]);

  // Manual trigger from Download button while in 'paused' state
  const handleManualGenerate = useCallback(() => {
    if (phase !== 'paused') return;
    setPhase('generating');
    const contact: ContactInfo = {
      name: name.trim() || PLACEHOLDER_CONTACT.name,
      company: company.trim() || PLACEHOLDER_CONTACT.company,
      email: email.trim() || PLACEHOLDER_CONTACT.email,
    };
    startGeneration(contact, 'manual');
  }, [phase, name, company, email, startGeneration]);

  // Download when ready
  const handleDownload = useCallback(() => {
    if (!blobUrl) return;
    const link = document.createElement('a');
    link.href = blobUrl;
    const safeName = name.trim()
      ? name.trim().replace(/\s+/g, '-').toLowerCase()
      : 'quote';
    link.download = `fna-quote-${safeName}.pdf`;
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      onClose();
    }, 400);
  }, [blobUrl, name, onClose]);

  // Cleanup blob on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // Dismiss on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const statusLabel = {
    waiting: 'Waiting for info...',
    paused: 'Add your info and click Generate & Download',
    generating: 'Generating PDF...',
    ready: 'Ready to download!',
    error: 'Something went wrong.',
  }[phase];

  const statusColor = {
    waiting: 'text-muted-foreground',
    paused: 'text-muted-foreground',
    generating: 'text-accent',
    ready: 'text-green-500',
    error: 'text-red-400',
  }[phase];

  const barColor = {
    waiting: 'bg-accent/60',
    paused: 'bg-accent/60',
    generating: 'bg-accent',
    ready: 'bg-green-500',
    error: 'bg-red-500',
  }[phase];

  const content = (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/65"
        style={{
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* Modal card */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4"
      >
        <div
          className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-6 pointer-events-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Save Quote</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your PDF will generate automatically
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-5">
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                ref={progressBarRef}
                className={`h-full transition-colors duration-500 ${barColor}`}
              />
            </div>
            <p className={`text-xs mt-2 transition-colors duration-300 ${statusColor}`}>
              {statusLabel}
            </p>
          </div>

          {/* Fields */}
          <div className="space-y-3 mb-5">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); handleInput(); }}
                placeholder="Art Vandelay"
                disabled={phase === 'generating' || phase === 'ready'}
                className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => { setCompany(e.target.value); handleInput(); }}
                placeholder="Vandelay Industries"
                disabled={phase === 'generating' || phase === 'ready'}
                className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); handleInput(); }}
                placeholder="art@vandelayindustries.com"
                disabled={phase === 'generating' || phase === 'ready'}
                className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Download button */}
          <DownloadButton
            phase={phase}
            onDownload={handleDownload}
            onManualGenerate={handleManualGenerate}
          />

          {phase === 'error' && errorMsg && (
            <p className="text-xs text-red-400 mt-3 text-center">{errorMsg}</p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  // Render into body so it sits above everything
  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
