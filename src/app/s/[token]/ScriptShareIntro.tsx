'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * Intro/start page for script share links.
 * Layout and animation lifted from TitleSlide.tsx (proposal landing page).
 */

interface Props {
  scriptTitle: string;
  projectTitle: string | null;
  clientName: string | null;
  clientLogoUrl: string | null;
  versionLabel: string;
  shareNotes: string | null;
  onBegin: () => void;
}

export function ScriptShareIntro({
  scriptTitle,
  clientName,
  shareNotes,
  onBegin,
}: Props) {
  const innerRef = useRef<HTMLDivElement>(null);

  const titleWords = scriptTitle.split(' ');

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const bgOverlay = el.closest('section')?.querySelector('[data-bg-overlay]') as HTMLElement;
      const eyebrow = el.querySelector('[data-eyebrow]') as HTMLElement;
      const words = el.querySelectorAll('[data-word]');
      const notes = el.querySelector('[data-notes]') as HTMLElement | null;
      const button = el.querySelector('[data-button]') as HTMLElement | null;
      const instructions = el.querySelectorAll('[data-instructions]');

      gsap.set(eyebrow, { opacity: 0, y: 20 });
      gsap.set(words, { y: '115%' });
      if (notes) gsap.set(notes, { opacity: 0, y: 24 });
      if (button) gsap.set(button, { opacity: 0, y: 32 });
      if (instructions.length) gsap.set(instructions, { opacity: 0, y: 12 });

      const tl = gsap.timeline({ delay: 0.3 });

      if (bgOverlay) {
        tl.to(bgOverlay, { opacity: 0, duration: 0.8, ease: 'power2.out' });
      }

      tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, bgOverlay ? '-=0.3' : '>')
        .to(words, { y: '0%', duration: 1.3, ease: 'expo.out', stagger: 0.07 }, '-=0.3');

      if (notes) {
        tl.to(notes, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5');
      }

      if (button) {
        tl.to(button, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3');
      }

      if (instructions.length) {
        tl.to(instructions, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3');
      }
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

      <div ref={innerRef} className="relative z-10 flex flex-col items-center text-center px-6 sm:px-8 max-w-5xl w-full">
        {/* Eyebrow — client name */}
        <p data-eyebrow className="text-sm tracking-[0.45em] uppercase text-white/25 font-mono mb-5" style={{ opacity: 0 }}>
          {clientName || 'Script Review'}
        </p>

        {/* Clip-reveal title */}
        <h1
          className="font-display font-bold text-white leading-[0.95] mb-6"
          style={{ fontSize: 'clamp(3.5rem, 9vw, 10rem)' }}
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

        {/* What to look for */}
        {shareNotes && (
          <p data-notes className="text-xl text-white/40 max-w-lg leading-relaxed mb-8" style={{ opacity: 0 }}>
            {shareNotes}
          </p>
        )}

        {/* CTA Button */}
        <div data-button className="w-full max-w-sm mb-5" style={{ opacity: 0 }}>
          <button
            onClick={onBegin}
            className="relative w-full px-6 py-3 font-medium text-black bg-white border border-white rounded-lg overflow-hidden hover:bg-white/90 transition-colors"
          >
            View Script
          </button>
        </div>

        {/* Instructions */}
        <p data-instructions className="text-xs text-white/40 max-w-sm leading-relaxed" style={{ opacity: 0 }}>
          Navigate with arrow keys, the timeline, or the left/right buttons.
        </p>
      </div>
    </section>
  );
}
