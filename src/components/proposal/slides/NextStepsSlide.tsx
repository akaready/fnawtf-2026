'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import Cal, { getCalApi } from '@calcom/embed-react';
import type { ProposalRow } from '@/types/proposal';
import { SlideHeader } from '@/components/proposal/SlideHeader';

interface Props {
  proposal?: ProposalRow;
  slideRef?: React.RefObject<HTMLElement>;
}

// ── NextStepsSlide ────────────────────────────────────────────────────────────
export function NextStepsSlide({ proposal, slideRef }: Props) {
  const innerRef    = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // Cal.com embed UI config — dark theme with accent brand color
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "proposal-review" });
      cal("ui", {
        cssVarsPerTheme: {
          light: { "cal-brand": "#a656fd" },
          dark:  { "cal-brand": "#a656fd" },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  // GSAP reveal
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const eyebrow    = el.querySelector('[data-eyebrow]')     as HTMLElement;
      const words      = el.querySelectorAll('[data-word]');
      const accentLine = el.querySelector('[data-accent-line]') as HTMLElement;
      const sub        = el.querySelector('[data-sub]')         as HTMLElement;
      const calBox     = el.querySelector('[data-cal-box]')     as HTMLElement;

      gsap.set(eyebrow,    { opacity: 0, y: 12 });
      gsap.set(words,      { y: '115%' });
      if (accentLine) gsap.set(accentLine, { scaleX: 0, transformOrigin: 'left center' });
      gsap.set(sub,        { opacity: 0, y: 16 });
      gsap.set(calBox,     { opacity: 0, y: 24 });

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          gsap.timeline()
            .to(eyebrow,    { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
            .to(words,      { y: '0%', duration: 1.1, ease: 'expo.out', stagger: 0.07 }, '-=0.2')
            .to(accentLine, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, '-=0.5')
            .to(sub,        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
            .to(calBox,     { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, '-=0.2');
        }
      }, { threshold: 0.3 });

      observer.observe(el.closest('[data-slide]') ?? el);
      return () => observer.disconnect();
    }, innerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={slideRef as React.RefObject<HTMLElement>}
      data-slide
      className="[scroll-snap-align:start] flex-shrink-0 w-screen h-screen relative bg-black"
    >
      {/* Top gradient mask */}
      <div className="absolute top-0 left-0 right-0 z-30 h-32 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-transparent" />
      </div>

      {/* Bottom gradient mask */}
      <div className="absolute bottom-0 left-0 right-0 z-30 h-48 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-24 backdrop-blur-[6px]" style={{ maskImage: 'linear-gradient(to top, black 20%, transparent)', WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent)' }} />
      </div>

      <div ref={innerRef} className="flex flex-col h-full w-full pt-20 relative z-10">

        {/* Header + subtitle — constrained width */}
        <div className="max-w-4xl mx-auto px-12 lg:px-20 w-full">
          <SlideHeader
            eyebrow="WHAT'S NEXT"
            titleWords={["Next", "Steps"]}
          />

          <p data-sub className="text-base text-white/40 max-w-lg leading-relaxed mb-6">
            Pick a time and we&rsquo;ll walk through every detail together.
          </p>
        </div>

        {/* Cal.com iframe embed */}
        <div
          data-cal-box
          className="flex-1 min-h-0 overflow-y-auto px-10 sm:px-12 md:px-16 lg:px-20 w-full proposal-deck-scroll"
        >
          <Cal
            namespace="proposal-review"
            calLink="fnawtf/proposal-review"
            style={{ width: "100%", height: "100%", overflow: "scroll" }}
            config={{
              layout: "month_view",
              ...(proposal?.contact_name ? { name: proposal.contact_name } : {}),
              ...(proposal?.contact_email ? { email: proposal.contact_email } : {}),
            }}
          />
        </div>

      </div>
    </section>
  );
}
