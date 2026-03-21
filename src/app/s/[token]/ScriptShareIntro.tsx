'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { Mail } from 'lucide-react';
import { useDirectionalFill } from '@/hooks/useDirectionalFill';

/**
 * Intro/start page for script share links.
 * Layout and animation lifted from TitleSlide.tsx (proposal landing page).
 */

const VERSION_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];
function versionColor(label: string): string {
  const major = parseInt(label) || 0;
  return VERSION_COLORS[major % VERSION_COLORS.length];
}

interface Props {
  scriptTitle: string;
  projectTitle: string | null;
  clientName: string | null;
  clientLogoUrl: string | null;
  versionLabel: string;
  shareNotes: string | null;
  onBegin: () => void;
}

const iconVariants = {
  hidden: { opacity: 0, x: 8, width: 0, marginLeft: -8 },
  visible: { opacity: 1, x: 0, width: 'auto', marginLeft: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

export function ScriptShareIntro({
  scriptTitle,
  clientName,
  clientLogoUrl: _clientLogoUrl,
  versionLabel,
  shareNotes,
  onBegin,
}: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const emailBtnRef = useRef<HTMLAnchorElement>(null);
  const emailFillRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isEmailHovered, setIsEmailHovered] = useState(false);

  useDirectionalFill(emailBtnRef, emailFillRef, {
    onFillStart: () => {
      setIsEmailHovered(true);
      const textSpan = emailBtnRef.current?.querySelector('span');
      if (textSpan) gsap.to(textSpan, { color: '#000000', duration: 0.3, ease: 'power2.out' });
    },
    onFillEnd: () => {
      setIsEmailHovered(false);
      const textSpan = emailBtnRef.current?.querySelector('span');
      if (textSpan) gsap.to(textSpan, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
    },
  });

  // Directional fill for main button
  useEffect(() => {
    if (!buttonRef.current || !fillRef.current) return;
    const button = buttonRef.current;
    const fill = fillRef.current;
    const textSpan = button.querySelector('span');

    const handleMouseEnter = (e: MouseEvent) => {
      setIsHovered(true);
      const rect = button.getBoundingClientRect();
      const x = (e.clientX || e.pageX) - rect.left;
      const direction = x < rect.width / 2 ? 'left' : 'right';
      gsap.killTweensOf([fill, textSpan]);
      gsap.fromTo(fill,
        { scaleX: 0, transformOrigin: direction === 'left' ? '0 50%' : '100% 50%' },
        { scaleX: 1, duration: 0.3, ease: 'power2.out' },
      );
      if (textSpan) gsap.to(textSpan, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      gsap.to(fill, { scaleX: 0, duration: 0.3, ease: 'power2.out' });
      if (textSpan) gsap.to(textSpan, { color: '#000000', duration: 0.3, ease: 'power2.out' });
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const titleWords = scriptTitle.split(' ');

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const bgOverlay = el.closest('section')?.querySelector('[data-bg-overlay]') as HTMLElement;
      const eyebrow = el.querySelector('[data-eyebrow]') as HTMLElement;
      const words = el.querySelectorAll('[data-word]');
      const version = el.querySelector('[data-version]') as HTMLElement | null;
      const notes = el.querySelector('[data-notes]') as HTMLElement | null;
      const cta = el.querySelector('[data-cta]') as HTMLElement | null;
      const email = el.querySelector('[data-email]') as HTMLElement | null;
      const instructions = el.querySelectorAll('[data-instructions]');

      gsap.set(eyebrow, { opacity: 0, y: 20 });
      gsap.set(words, { y: '115%' });
      if (version) gsap.set(version, { opacity: 0, y: 16 });
      if (notes) gsap.set(notes, { opacity: 0, y: 20 });
      if (cta) gsap.set(cta, { opacity: 0, y: 24 });
      if (email) gsap.set(email, { opacity: 0, y: 24 });
      if (instructions.length) gsap.set(instructions, { opacity: 0, y: 12 });

      const tl = gsap.timeline({ delay: 0.3 });

      if (bgOverlay) {
        tl.to(bgOverlay, { opacity: 0, duration: 0.8, ease: 'power2.out' });
      }

      // 1. Client name
      tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, bgOverlay ? '-=0.3' : '>');
      // 2. Script title words
      tl.to(words, { y: '0%', duration: 1.3, ease: 'expo.out', stagger: 0.07 }, '-=0.3');
      // 3. Version pill
      if (version) tl.to(version, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.6');
      // 4. What to look for
      if (notes) tl.to(notes, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.2');
      // 5. View Script button
      if (cta) tl.to(cta, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.2');
      // 6. Email button
      if (email) tl.to(email, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');
      // 7. Instructions
      if (instructions.length) tl.to(instructions, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
    }, el.closest('section') ?? el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className="flex-shrink-0 w-screen h-screen relative flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundColor: 'var(--surface-elevated)',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      {/* Radial edge fade */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 85% 100% at 50% 50%, transparent 35%, var(--surface-elevated) 100%)',
        }}
      />

      {/* Black overlay — fades out to reveal background dots/gradient */}
      <div
        data-bg-overlay
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{ backgroundColor: 'black' }}
      />

      <div ref={innerRef} className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 md:px-8 max-w-5xl w-full">
        {/* Eyebrow — client name */}
        <p data-eyebrow className="text-sm tracking-[0.45em] uppercase text-white/25 font-mono mb-5" style={{ opacity: 0 }}>
          {clientName || 'Script Review'}
        </p>

        {/* Clip-reveal title */}
        <h1
          className="font-display font-bold text-white leading-[0.95] mb-1"
          style={{ fontSize: 'clamp(2rem, 8vw, 10rem)' }}
        >
          {titleWords.map((word, i) => (
            <span
              key={i}
              className="inline-block overflow-hidden pb-[0.22em]"
              style={{ verticalAlign: 'top' }}
            >
              <span data-word className="inline-block" style={{ transform: 'translateY(115%)' }}>
                {word}{i < titleWords.length - 1 ? '\u00a0' : ''}
              </span>
            </span>
          ))}
        </h1>

        {/* Version pill */}
        {versionLabel && (() => {
          const color = versionColor(versionLabel);
          return (
            <div data-version className="mb-7" style={{ opacity: 0 }}>
              <span
                className="inline-block px-4 py-1.5 text-sm font-mono font-bold rounded-full"
                style={{ color, backgroundColor: color + '18', border: `1px solid ${color}40` }}
              >
                {versionLabel}
              </span>
            </div>
          );
        })()}

        {/* What to look for — same position as proposal subtitle */}
        {shareNotes && (
          <p data-notes className="text-xl text-white/40 max-w-lg leading-relaxed mb-8 whitespace-pre-wrap" style={{ opacity: 0 }}>
            {shareNotes}
          </p>
        )}

        {/* CTA Button — directional fill */}
        <div data-cta className="w-full max-w-sm mb-5" style={{ opacity: 0 }}>
          <motion.button
            ref={buttonRef}
            onClick={onBegin}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full px-6 py-3 font-medium text-black bg-white border border-white rounded-lg overflow-hidden"
          >
            <div
              ref={fillRef}
              className="absolute inset-0 bg-black pointer-events-none"
              style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
            />
            <span className="relative flex items-center justify-center gap-2 whitespace-nowrap" style={{ zIndex: 10 }}>
              View Script
              <motion.span
                variants={iconVariants}
                initial="hidden"
                animate={isHovered ? 'visible' : 'hidden'}
                className="flex items-center text-lg"
              >
                →
              </motion.span>
            </span>
          </motion.button>
        </div>

        {/* Email Button — directional fill */}
        <div data-email className="w-full max-w-[12rem] mb-5" style={{ opacity: 0 }}>
          <a
            ref={emailBtnRef}
            href="mailto:hi@fna.wtf"
            className="relative w-full px-6 py-3 font-medium text-white bg-black border border-white rounded-lg overflow-hidden flex items-center justify-center"
          >
            <div
              ref={emailFillRef}
              className="absolute inset-0 bg-white pointer-events-none"
              style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
            />
            <span className="relative flex items-center justify-center gap-2 whitespace-nowrap" style={{ zIndex: 10 }}>
              <motion.span
                variants={iconVariants}
                initial="hidden"
                animate={isEmailHovered ? 'visible' : 'hidden'}
                className="flex items-center"
              >
                <Mail size={16} strokeWidth={1.5} />
              </motion.span>
              hi@fna.wtf
            </span>
          </a>
        </div>

        {/* Instructions */}
        <p data-instructions className="text-xs text-white/40 max-w-sm" style={{ opacity: 0 }}>
          Navigate with arrow keys, the timeline, or the left/right buttons.
        </p>
      </div>
    </section>
  );
}
