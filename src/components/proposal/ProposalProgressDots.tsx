'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import {
  LogOut,
  Home,
  Hand,
  ClipboardList,
  GitBranch,
  Calendar,
  Play,
  DollarSign,
  Phone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  slideCount: number;
  slideRefs: React.RefObject<HTMLElement>[];
  slideNames: string[];
  proposalTitle?: string;
  onExit: () => void;
}

export function ProposalProgressDots({ slideCount, slideRefs, slideNames, proposalTitle, onExit }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [exitHovered, setExitHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const exitRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const separatorRef = useRef<HTMLDivElement | null>(null);
  const mobilBarRef = useRef<HTMLDivElement | null>(null);
  const mobileDotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const hasRevealed = useRef(false);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    slideRefs.forEach((ref, i) => {
      if (!ref.current) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveIndex(i);
        },
        { threshold: 0.5 }
      );
      observer.observe(ref.current);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, [slideRefs]);

  const scrollTo = (i: number) => {
    slideRefs[i]?.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'start',
      block: 'nearest',
    });
  };

  // Staggered reveal from below on mount
  useEffect(() => {
    if (hasRevealed.current) return;
    hasRevealed.current = true;

    const bar = barRef.current;
    const mobileBar = mobilBarRef.current;
    const items = [
      ...dotRefs.current.filter(Boolean),
      separatorRef.current,
      exitRef.current,
    ].filter(Boolean);

    // Hide everything initially
    if (bar) gsap.set(bar, { y: 40, opacity: 0 });
    if (mobileBar) gsap.set(mobileBar, { y: 40, opacity: 0 });
    gsap.set(items, { y: 12, opacity: 0 });

    const tl = gsap.timeline({ delay: 3.5 });
    // Bars slide up first
    const barsToAnimate = [bar, mobileBar].filter(Boolean);
    if (barsToAnimate.length) {
      tl.to(barsToAnimate, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    }
    // Then icons stagger in (desktop only)
    tl.to(items, {
      y: 0,
      opacity: 1,
      duration: 0.35,
      ease: 'power3.out',
      stagger: 0.06,
    }, '-=0.15');
  }, [slideCount]);

  // Compute tooltip position — always use first dot's top as the Y anchor so all tooltips align
  useEffect(() => {
    let el: HTMLDivElement | null = null;
    if (hoveredIndex !== null) {
      el = dotRefs.current[hoveredIndex] ?? null;
    } else if (exitHovered) {
      el = exitRef.current;
    }
    if (el) {
      const rect = el.getBoundingClientRect();
      const anchorY = dotRefs.current[0]?.getBoundingClientRect().top ?? rect.top;
      setTooltipPos({ x: rect.left + rect.width / 2, y: anchorY });
    } else {
      setTooltipPos(null);
    }
  }, [hoveredIndex, exitHovered]);

  // Map slide names to Lucide icons — projects keep dots
  const SLIDE_ICON_MAP: Record<string, LucideIcon> = {
    Title: Home,
    Welcome: Hand,
    Process: ClipboardList,
    Approach: GitBranch,
    Timeline: Calendar,
    Samples: Play,
    Investment: DollarSign,
    'Next Steps': Phone,
  };

  const getIcon = (i: number): LucideIcon | null => {
    const name = slideNames[i];
    if (!name) return null;
    return SLIDE_ICON_MAP[name] ?? null; // null = project slide → render dot
  };

  if (slideCount <= 1) return null;

  const tooltipLabel =
    hoveredIndex !== null
      ? (hoveredIndex === 0 && proposalTitle ? proposalTitle : (slideNames[hoveredIndex] ?? ''))
      : exitHovered
        ? 'Exit'
        : '';

  return (
    <>
      {/* Tooltip — rendered outside the backdrop-blur container */}
      {tooltipPos && tooltipLabel && (
        <div
          className="fixed z-[201] pointer-events-none px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm whitespace-nowrap"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, calc(-100% - 1.25rem))',
          }}
        >
          <span className="text-sm font-medium text-white">{tooltipLabel}</span>
        </div>
      )}

      {/* Desktop icon-based dots bar — hidden on mobile */}
      <div ref={barRef} className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[200] hidden sm:flex flex-row items-center">
        <div className="flex flex-row items-center gap-3 bg-white/[0.12] border border-white/[0.18] rounded-xl px-4 py-2.5 backdrop-blur-lg" style={{ transform: 'scale(0.9)', transformOrigin: 'center bottom' }}>
          {Array.from({ length: slideCount }).map((_, i) => {
            const Icon = getIcon(i);
            const isActive = i === activeIndex;
            const isHovered = hoveredIndex === i;

            const dockScale = isHovered ? 1.2 : 1;

            return (
              <div
                key={i}
                ref={(el) => { dotRefs.current[i] = el; }}
                className="relative flex items-center justify-center w-[30px]"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <button
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to ${slideNames[i] ?? `slide ${i + 1}`}`}
                  className="flex items-center justify-center"
                >
                  {Icon ? (
                    <span
                      className="flex items-center justify-center rounded-lg px-2 py-1.5 transition-all duration-200"
                      style={{
                        color: isActive
                          ? '#ffffff'
                          : isHovered
                            ? '#999999'
                            : '#555555',
                        backgroundColor: isActive
                          ? 'rgba(255,255,255,0.18)'
                          : isHovered
                            ? 'rgba(255,255,255,0.10)'
                            : 'transparent',
                        transform: `scale(${dockScale})`,
                      }}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                    </span>
                  ) : (
                    /* Project slides keep the dot style */
                    <span
                      className="flex items-center justify-center rounded-lg px-2 py-1.5 transition-all duration-200 w-[34px] h-[30px]"
                      style={{
                        backgroundColor: isActive
                          ? 'rgba(255,255,255,0.18)'
                          : isHovered
                            ? 'rgba(255,255,255,0.10)'
                            : 'transparent',
                        transform: `scale(${dockScale})`,
                      }}
                    >
                      <span
                        className="block rounded-full transition-all duration-200"
                        style={{
                          width: 9,
                          height: 9,
                          backgroundColor: isActive
                            ? '#ffffff'
                            : isHovered
                              ? '#999999'
                              : '#555555',
                        }}
                      />
                    </span>
                  )}
                </button>
              </div>
            );
          })}

          {/* Separator */}
          <div ref={separatorRef} className="w-px h-5 bg-white/10 mx-1" />

          {/* Exit button — same wrapper sizing as dots so tooltip aligns */}
          <div
            ref={exitRef}
            className="relative flex items-center justify-center w-[30px] ml-2"
            onMouseEnter={() => setExitHovered(true)}
            onMouseLeave={() => setExitHovered(false)}
          >
            <button
              onClick={onExit}
              aria-label="Exit proposal"
              className="flex items-center justify-center px-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-all duration-200"
              style={{ color: exitHovered ? '#999999' : '#555555' }}
            >
              <LogOut size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile plain dots bar — visible only on mobile */}
      <div
        ref={mobilBarRef}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex sm:hidden flex-row items-center"
      >
        <div className="flex flex-row items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-full px-3 py-2 backdrop-blur-lg">
          {Array.from({ length: slideCount }).map((_, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={i}
                ref={(el) => { mobileDotRefs.current[i] = el; }}
                onClick={() => scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="flex items-center justify-center p-0.5"
              >
                <span
                  className="block rounded-full transition-all duration-300"
                  style={{
                    width: isActive ? 8 : 6,
                    height: isActive ? 8 : 6,
                    backgroundColor: isActive ? '#ffffff' : '#555555',
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
