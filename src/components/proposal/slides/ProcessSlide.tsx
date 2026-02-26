'use client';

import { useRef, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { Search, Film, Rocket } from 'lucide-react';
import { SlideHeader } from '@/components/proposal/SlideHeader';

const phases = [
  {
    icon: Search,
    label: 'Diagnose → Prescribe',
    stepLabel: 'You are here.',
    body: `We first want to understand you, your product, your competitors and your customers before we dive into creative.\n\nWe always start with listening and learning. We brainstorm and return to present a few concepts to workshop together — and we always arrive at our creative concepts collaboratively.`,
  },
  {
    icon: Film,
    label: 'Plan → Produce',
    stepLabel: 'This will be next.',
    body: `We write scripts. Cast the right talent. Find the right locations. We invite feedback at every step of the process, so we know everyone is happy en route to the final product.\n\nThen we bring it all together and make magic. We always welcome stakeholders on-set, or to watch remotely from a Zoom feed.`,
  },
  {
    icon: Rocket,
    label: 'Edit → Deliver',
    stepLabel: 'And then... magic!',
    body: `We edit, design graphics, layer in music, add sound effects, and find the brand's voice, combining it all to make our shared dream a reality.\n\nAnd we keep up with the release of the campaign after launch too, so we can improve how we tell stories as we grow your brand.`,
  },
];


const CIRCLE_R = 20; // half of w-10 (40px)

// ── Individual phase card ─────────────────────────────────────────────────────

function PhaseCard({ phase, isActive }: { phase: typeof phases[number]; isActive?: boolean }) {
  const Icon = phase.icon;
  return (
    <div
      data-card
      className={`p-6 sm:p-8 border rounded-lg ${
        isActive ? 'bg-purple-950 border-purple-500' : 'bg-black border-border'
      }`}
      style={{ transition: 'border-color 0.4s ease' }}
    >
      <Icon className="w-10 h-10 sm:w-12 sm:h-12 mb-5 sm:mb-6 text-purple-300" strokeWidth={1.5} data-icon />
      <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4" data-title>
        {phase.label}
      </h3>
      <p className="font-body text-muted-foreground leading-relaxed" data-desc>
        {phase.body.replace(/\n\n/g, ' ')}
      </p>
    </div>
  );
}

// ── ProcessSlide ─────────────────────────────────────────────────────────────

interface Props {
  slideRef?: React.RefObject<HTMLElement>;
}

export function ProcessSlide({ slideRef }: Props) {
  const innerRef      = useRef<HTMLDivElement>(null);
  const hasAnimated   = useRef(false);

  // Timeline refs (desktop only)
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const circleRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const bgLineRef     = useRef<HTMLDivElement>(null);
  const fgLineRef     = useRef<HTMLDivElement>(null);
  const lineStartRef  = useRef(0);
  const lineMaxRef    = useRef(0);
  const circleYsRef   = useRef<number[]>([]);

  // ── Measure circle positions and set the absolute line ──────────────────────
  useLayoutEffect(() => {
    // Walk offsetParent chain to get element's top relative to a given ancestor
    function offsetRelativeTo(el: HTMLElement, ancestor: HTMLElement): number {
      let top = 0;
      let cur: HTMLElement | null = el;
      while (cur && cur !== ancestor) {
        top += cur.offsetTop;
        cur = cur.offsetParent as HTMLElement | null;
      }
      return top;
    }

    function positionLine() {
      const container = timelineContainerRef.current;
      const bg = bgLineRef.current;
      const fg = fgLineRef.current;
      const circles = circleRefs.current.filter(Boolean) as HTMLDivElement[];
      if (!container || !bg || !fg || circles.length < 2) return;

      const ys = circles.map(c => offsetRelativeTo(c, container) + CIRCLE_R);
      circleYsRef.current = ys;

      const firstY = ys[0];
      const lastY  = ys[ys.length - 1];
      const height = lastY - firstY;

      bg.style.top    = `${firstY}px`;
      bg.style.height = `${height}px`;
      fg.style.top    = `${firstY}px`;
      // Don't reset fg height — scroll handler owns it

      lineStartRef.current = firstY;
      lineMaxRef.current   = height;
    }

    positionLine();
    const ro = new ResizeObserver(positionLine);
    if (timelineContainerRef.current) ro.observe(timelineContainerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Entrance animation ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const eyebrow   = el.querySelector('[data-eyebrow]')     as HTMLElement;
      const wordEls   = el.querySelectorAll('[data-word]');
      const accentLine= el.querySelector('[data-accent-line]') as HTMLElement;
      const descEl    = el.querySelector('[data-desc]')        as HTMLElement;
      const phaseCards= el.querySelectorAll('[data-card]');
      const circles   = el.querySelectorAll('[data-circle]');
      const labels    = el.querySelectorAll('[data-label]');
      const mobileSteps = el.querySelectorAll('[data-mobile-step]');
      const bgLine    = bgLineRef.current;

      gsap.set(eyebrow,    { opacity: 0, y: 12 });
      gsap.set(wordEls,    { y: '115%' });
      gsap.set(accentLine, { scaleX: 0, transformOrigin: 'left center' });
      gsap.set(descEl,     { opacity: 0, y: 12 });
      gsap.set(phaseCards, { opacity: 0, y: 40 });
      if (circles.length) gsap.set(circles, { opacity: 0, scale: 0, transformOrigin: 'center center' });
      if (labels.length)  gsap.set(labels,  { clipPath: 'inset(0 0 0 100%)', opacity: 1 });
      if (mobileSteps.length) gsap.set(mobileSteps, { opacity: 0, y: 10 });
      // Line: scaleY so positionLine() can freely set height without fighting the animation
      if (bgLine) gsap.set(bgLine, { scaleY: 0, transformOrigin: 'top center' });

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;

          const totalLineH = lineMaxRef.current;
          const ys = circleYsRef.current;
          const lineDur = 1.1;
          const circle2Frac = ys.length > 1 && totalLineH > 0
            ? (ys[1] - ys[0]) / totalLineH : 0.5;

          let circle2Shown = false;
          let circle3Shown = false;

          const revealLabel = (el: Element) =>
            gsap.to(el, { clipPath: 'inset(0 0 0 0%)', duration: 0.5, ease: 'power3.out' });

          const tl = gsap.timeline()
            .to(eyebrow,    { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
            .to(wordEls,    { y: '0%', duration: 1.0, ease: 'expo.out', stagger: 0.04 }, '-=0.2')
            .to(accentLine, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, '-=0.5')
            .to(descEl,     { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3')
            .to(phaseCards, { opacity: 1, y: 0, duration: 0.7, ease: 'power4.out', stagger: 0.3 }, '-=0.1');

          if (mobileSteps.length) {
            tl.to(mobileSteps, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.2 }, '<');
          }

          if (circles.length) {
            // Circle 1 scales in with first card; label 1 slides out from the right
            tl.to(circles[0], { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.7)' }, '<')
              .call(() => { revealLabel(labels[0]); }, undefined, '<0.1')
              // Grey line draws down using scaleY — circles/labels appear as tip passes them
              .to(bgLine, {
                scaleY: 1,
                duration: lineDur,
                ease: 'power2.inOut',
                onUpdate() {
                  const p = this.progress();
                  if (!circle2Shown && p >= circle2Frac) {
                    circle2Shown = true;
                    gsap.to(circles[1], { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' });
                    gsap.delayedCall(0.07, () => revealLabel(labels[1]));
                  }
                  if (!circle3Shown && p >= 0.97) {
                    circle3Shown = true;
                    gsap.to(circles[2], { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' });
                    gsap.delayedCall(0.07, () => revealLabel(labels[2]));
                  }
                },
              }, '<0.15');
          }
        }
      }, { threshold: 0.3 });

      observer.observe(el.closest('[data-slide]') ?? el);
      return () => observer.disconnect();
    }, innerRef);

    return () => ctx.revert();
  }, []);

  // ── Scroll-driven: line fill + circle/label activation ──────────────────────
  useEffect(() => {
    const section = innerRef.current?.closest('[data-slide]') as HTMLElement;
    if (!section) return;

    const purple     = 'rgb(168, 85, 247)';  // purple-500
    const purpleDark = 'rgb(59, 7, 100)';    // purple-950
    const purpleText = 'rgb(216, 180, 254)'; // purple-300

    const inactiveCircleBg     = 'rgb(23, 23, 23)';   // neutral-900
    const inactiveCircleBorder = 'rgb(64, 64, 64)';   // neutral-700
    const inactiveCircleText   = 'rgb(115, 115, 115)'; // neutral-500

    const handleScroll = () => {
      const el = innerRef.current;
      const fg = fgLineRef.current;
      if (!el || !fg) return;

      // Progressive line fill based on scroll position
      const scrollProgress = section.scrollTop / Math.max(1, section.scrollHeight - section.clientHeight);
      const lineHeight = scrollProgress * lineMaxRef.current;
      fg.style.height = `${lineHeight}px`;

      // Activate each circle only when the line has reached its Y position
      const circles = el.querySelectorAll('[data-circle]');
      const labels  = el.querySelectorAll('[data-label]');
      const circleYs = circleYsRef.current;

      circles.forEach((circleEl, i) => {
        if (i === 0) return; // always active (purple bg card)
        const circle = circleEl as HTMLElement;
        const label  = labels[i] as HTMLElement;
        // Distance from line start to this circle's center
        const distToCircle = (circleYs[i] ?? 0) - (circleYs[0] ?? 0);
        const isLit = lineHeight >= distToCircle;

        if (isLit) {
          circle.style.backgroundColor = purpleDark;
          circle.style.borderColor     = purple;
          circle.style.borderWidth     = '2px';
          circle.style.color           = purpleText;
          if (label) label.style.color = purple;
        } else {
          circle.style.backgroundColor = inactiveCircleBg;
          circle.style.borderColor     = inactiveCircleBorder;
          circle.style.borderWidth     = '1px';
          circle.style.color           = inactiveCircleText;
          if (label) label.style.color = '';
        }
      });
    };

    section.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => section.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={slideRef as React.RefObject<HTMLElement>}
      data-slide
      className="[scroll-snap-align:start] flex-shrink-0 w-screen h-screen bg-black overflow-y-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* Top gradient mask */}
      <div className="sticky top-0 z-20 pointer-events-none" style={{ height: 'var(--slide-gradient-h)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black to-transparent" />
      </div>

      <div ref={innerRef} className="max-w-4xl mx-auto px-6 sm:px-12 lg:px-20 pb-20 w-full" style={{ paddingTop: 'var(--slide-pt)', marginTop: 'calc(-1 * var(--slide-pull))' }}>
        {/* SlideHeader */}
        <SlideHeader
          eyebrow="HOW WE WORK"
          titleWords={['Our', 'Process']}
          description="From first conversation to final delivery."
          className="mb-8"
        />

        {/* ── Mobile layout: stacked cards with step label above each ── */}
        <div className="flex flex-col gap-4 md:hidden mb-10">
          {phases.map((phase, i) => (
            <div key={phase.label}>
              {/* Step badge row */}
              <div data-mobile-step className="flex items-center gap-2.5 mb-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i === 0
                    ? 'bg-purple-950 border-2 border-purple-500 text-purple-300'
                    : 'bg-neutral-900 border border-neutral-700 text-neutral-500'
                }`}>
                  {i + 1}
                </span>
                <span className={`text-sm font-mono ${i === 0 ? 'text-[var(--accent)]' : 'text-white/30'}`}>
                  {phase.stepLabel}
                </span>
              </div>
              <PhaseCard phase={phase} isActive={i === 0} />
            </div>
          ))}
        </div>

        {/* ── Desktop layout: timeline with circles and connecting line ── */}
        {/* 7rem left padding = label space. Circle center = 7rem + 20px from container left edge */}
        <div
          ref={timelineContainerRef}
          className="mb-10 relative hidden md:block"
          style={{ paddingLeft: '7rem' }}
        >
          {/* ── Absolute vertical line (background + purple fill) ── */}
          {/* left: calc(20px) positions the 2px line centered on the circle column center */}
          <div
            className="absolute pointer-events-none"
            style={{ left: 'calc(7rem + 19px)', top: 0, bottom: 0, width: 2, zIndex: 0 }}
          >
            {/* Static white/10 background track */}
            <div
              ref={bgLineRef}
              className="absolute inset-x-0 rounded-full bg-white/10"
              style={{ top: 0, height: 0 }}
            />
            {/* Purple fill — grows on scroll */}
            <div
              ref={fgLineRef}
              className="absolute inset-x-0 rounded-full bg-purple-500"
              style={{ top: 0, height: 0 }}
            />
          </div>

          {/* ── Phase rows ── */}
          <div className="flex flex-col">
            {phases.map((phase, i) => (
              <div key={phase.label} className="flex items-center gap-6 py-4 relative">
                {/* Circle */}
                <div
                  ref={el => { circleRefs.current[i] = el; }}
                  data-circle={i}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 relative z-10 ${
                    i === 0
                      ? 'bg-purple-950 border-2 border-purple-500 text-purple-300'
                      : 'bg-neutral-900 border border-neutral-700 text-neutral-500'
                  }`}
                  style={{ transition: 'background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease, border-width 0.4s ease' }}
                >
                  {i + 1}
                  {/* Label to the left */}
                  <span
                    data-label={i}
                    className={`absolute right-full mr-3 text-sm font-mono whitespace-nowrap text-right ${
                      i === 0 ? 'text-[var(--accent)]' : 'text-white/30'
                    }`}
                    style={{ transition: 'color 0.4s ease' }}
                  >
                    {phase.stepLabel}
                  </span>
                </div>

                {/* Card */}
                <div data-phase className="flex-1">
                  <PhaseCard phase={phase} isActive={i === 0} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom gradient mask */}
      <div className="sticky bottom-0 z-20 h-48 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div
          className="absolute bottom-0 left-0 right-0 h-24 backdrop-blur-[6px]"
          style={{
            maskImage: 'linear-gradient(to top, black 20%, transparent)',
            WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent)',
          }}
        />
      </div>
    </section>
  );
}
