'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { Lock, X, LogIn } from 'lucide-react';
import { logClientLoginAttempt } from '@/lib/portal/logClientLoginAttempt';

type State = 'idle' | 'submitting' | 'done';

// ── Icon reveal animation ─────────────────────────────────────────────────

const iconVariants = {
  hidden: { opacity: 0, x: -8, width: 0, marginRight: -8 },
  visible: {
    opacity: 1, x: 0, width: 'auto', marginRight: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Submit button — white bg, GSAP directional fill to black ──────────────

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
            Signing in…
          </>
        ) : (
          <>
            <motion.span variants={iconVariants} initial="hidden" animate={hovered ? 'visible' : 'hidden'} className="flex items-center">
              <LogIn size={16} strokeWidth={2} />
            </motion.span>
            Access Portal
          </>
        )}
      </span>
    </button>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────

function ClientLoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, setState] = useState<State>('idle');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (state !== 'idle') return;
    setState('submitting');
    await logClientLoginAttempt(name.trim(), email.trim(), password);
    setState('done');
  }, [state, name, email, password]);

  const inputClass =
    'w-full px-3 py-2.5 bg-black border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/65"
          style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        />
      )}
      {open && (
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4"
        >
          <div
            className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-6 pointer-events-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Client Portal Login</h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Sign in here to access your dedicated portal.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-white hover:bg-white/15 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {state === 'done' ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
                  <Lock size={20} className="text-accent" />
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">Access Requested</p>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    Your client portal is being set up. We&rsquo;ll reach out to {email || 'you'} once
                    your workspace is ready.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="mt-4 px-5 py-2.5 text-sm font-medium rounded-lg bg-muted/30 border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Your name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Art Vandelay"
                    required
                    disabled={state === 'submitting'}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="art@vandelayindustries.com"
                    required
                    disabled={state === 'submitting'}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Portal password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={state === 'submitting'}
                    className={inputClass}
                  />
                </div>

                <SubmitButton submitting={state === 'submitting'} />

                <p className="text-center text-xs text-muted-foreground/60 pt-1">
                  Portal credentials are issued per project.{' '}
                  <a href="mailto:hi@fna.wtf" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">
                    Contact us
                  </a>{' '}
                  if you need help.
                </p>
              </form>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ── Footer trigger button ─────────────────────────────────────────────────

export function ClientLoginButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
      >
        <Lock className="w-4 h-4" />
        Client Login
      </button>
      <ClientLoginModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
