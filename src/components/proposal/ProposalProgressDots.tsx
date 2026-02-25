'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { LogOut } from 'lucide-react';

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
  const hasBounced = useRef(false);

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

  // Bounce dot 2 on first load (3s on, 3s off pattern)
  useEffect(() => {
    if (activeIndex !== 0 || hasBounced.current) return;
    const timer = setTimeout(() => {
      const target = dotRefs.current[1];
      if (!target) return;
      hasBounced.current = true;

      const tl = gsap.timeline({ repeat: -1 });
      // Bounce for ~3 seconds (4 cycles × 0.8s per cycle)
      tl.to(target, {
        y: -8,
        duration: 0.4,
        ease: 'power2.out',
        yoyo: true,
        repeat: 3,
      }, 0);
      // Pause for 3 seconds
      tl.to(target, {}, '+=3');
    }, 3000);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  // Stop bouncing when leaving slide 0
  useEffect(() => {
    if (activeIndex === 0) return;
    const target = dotRefs.current[1];
    if (target) {
      gsap.killTweensOf(target);
      gsap.set(target, { y: 0 });
    }
  }, [activeIndex]);

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

      {/* Dots bar */}
      <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[200] hidden lg:flex flex-row items-center">
        <div className="flex flex-row items-center gap-3 bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 backdrop-blur-lg">
          {Array.from({ length: slideCount }).map((_, i) => (
            <div
              key={i}
              ref={(el) => { dotRefs.current[i] = el; }}
              className="relative flex items-center justify-center w-[30px]"
              onMouseEnter={() => {
                setHoveredIndex(i);
                if (i === 1) {
                  gsap.killTweensOf(dotRefs.current[1]);
                  gsap.set(dotRefs.current[1], { y: 0 });
                }
              }}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <button
                onClick={() => scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="flex items-center justify-center py-1"
              >
                <span
                  className="block rounded-full transition-all duration-200"
                  style={{
                    width: i === activeIndex ? 30 : hoveredIndex === i ? 18 : 9,
                    height: 9,
                    backgroundColor: i === activeIndex ? 'rgba(255,255,255,0.7)' : hoveredIndex === i ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)',
                  }}
                />
              </button>
            </div>
          ))}

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
              className="flex items-center justify-center py-1 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors duration-200"
            >
              <LogOut size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
