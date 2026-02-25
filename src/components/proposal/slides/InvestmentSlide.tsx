'use client';

import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { Lock, SlidersHorizontal } from 'lucide-react';
import { ProposalCalculatorEmbed } from '@/components/proposal/ProposalCalculatorEmbed';
import { SlideHeader } from '@/components/proposal/SlideHeader';
import type { ProposalQuoteRow, ProposalType } from '@/types/proposal';

// ── Helpers ──────────────────────────────────────────────────────────────────

// ── InvestmentSlide ──────────────────────────────────────────────────────────

interface Props {
  proposalId: string;
  proposalType: ProposalType;
  quotes: ProposalQuoteRow[];
  crowdfundingApproved?: boolean;
  slideRef?: React.RefObject<HTMLElement>;
}

export function InvestmentSlide({
  proposalId,
  proposalType,
  quotes: initialQuotes,
  crowdfundingApproved,
  slideRef,
}: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const [quotes] = useState(initialQuotes);
  const [activeQuoteTab, setActiveQuoteTab] = useState(0);

  const fnaQuote = quotes.find((q) => q.is_fna_quote) ?? null;
  const clientQuotes = quotes.filter((q) => !q.is_fna_quote);

  // ── GSAP entrance animation ──
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const eyebrow    = el.querySelector('[data-eyebrow]')     as HTMLElement;
      const wordEls    = el.querySelectorAll('[data-word]');
      const accentLine = el.querySelector('[data-accent-line]') as HTMLElement;
      const descEl     = el.querySelector('[data-desc]')        as HTMLElement;
      const content    = el.querySelector('[data-content]')     as HTMLElement;

      gsap.set(eyebrow,    { opacity: 0, y: 12 });
      gsap.set(wordEls,    { y: '115%' });
      gsap.set(accentLine, { scaleX: 0, transformOrigin: 'left center' });
      if (descEl)  gsap.set(descEl,   { opacity: 0, y: 16 });
      if (content) gsap.set(content,  { opacity: 0, y: 20 });

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            gsap
              .timeline()
              .to(eyebrow,    { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
              .to(wordEls,    { y: '0%', duration: 1.0, ease: 'expo.out', stagger: 0.04 }, '-=0.2')
              .to(accentLine, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, '-=0.5')
              .to(descEl,     { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3')
              .to(content,    { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' }, '-=0.2');
          }
        },
        { threshold: 0.35 }
      );

      const section = el.closest('[data-slide]') ?? el;
      observer.observe(section);
      return () => observer.disconnect();
    }, innerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={slideRef as React.RefObject<HTMLElement>}
      data-slide
      className="[scroll-snap-align:start] flex-shrink-0 w-screen h-screen bg-black overflow-y-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* Top gradient mask */}
      <div className="sticky top-0 z-20 h-32 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-transparent" />
      </div>

      <div ref={innerRef} className="flex flex-col px-12 lg:px-20 pt-20 pb-40 -mt-16 max-w-4xl mx-auto w-full">
        {/* SlideHeader */}
        <SlideHeader
          eyebrow="INVESTMENT"
          titleWords={['Pricing']}
          description="Choose the package that works for your budget."
          className="mb-6 flex-shrink-0"
        />

        {/* Quote tabs + content */}
        <div data-content>
          {/* Tab row */}
          <div className="flex items-center gap-2 mb-6 flex-shrink-0">
            <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] p-1">
              <button
                onClick={() => setActiveQuoteTab(0)}
                className={`relative px-4 py-2 rounded text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
                  activeQuoteTab === 0
                    ? 'text-white bg-[var(--accent)]'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <Lock size={14} />
                Recommended
              </button>
              <button
                onClick={() => setActiveQuoteTab(1)}
                className={`relative px-4 py-2 rounded text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
                  activeQuoteTab === 1
                    ? 'text-white bg-[var(--accent)]'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <SlidersHorizontal size={14} />
                Adjust &amp; Compare
              </button>
            </div>
          </div>

          {/* Content area — single instance, tab toggles isLocked/isCompare reactively (no remount) */}
          <div className="mt-6">
            {fnaQuote && (
              <ProposalCalculatorEmbed
                isLocked={activeQuoteTab === 0}
                isCompare={activeQuoteTab === 1}
                proposalId={proposalId}
                proposalType={proposalType}
                initialQuote={clientQuotes[0] ?? undefined}
                prefillQuote={fnaQuote}
                recommendedQuote={fnaQuote}
                crowdfundingApproved={crowdfundingApproved}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom gradient mask */}
      <div className="sticky bottom-0 z-20 h-48 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-24 backdrop-blur-[6px]" style={{ maskImage: 'linear-gradient(to top, black 20%, transparent)', WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent)' }} />
      </div>
    </section>
  );
}
