'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

interface Props {
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onExit?: () => void;
}

export function ProposalNavArrows({ onPrev, onNext, canGoPrev, canGoNext, isFirst, isLast, onExit }: Props) {
  const leftRef  = useRef<HTMLButtonElement>(null);
  const rightRef = useRef<HTMLButtonElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    // Slide in left button from left side
    if (leftRef.current) {
      gsap.set(leftRef.current, { opacity: 0, x: -150 });
      gsap.to(leftRef.current, {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 1.5,
      });
    }

    // Slide in right button from right side with stagger
    if (rightRef.current) {
      gsap.set(rightRef.current, { opacity: 0, x: 150 });
      gsap.to(rightRef.current, {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 1.7,
      });
    }

    if (isFirst && !animatedRef.current && rightRef.current && chevronRef.current) {
      animatedRef.current = true;
      // Chevron subtle wiggle animation
      gsap.to(chevronRef.current, {
        x: 2,
        duration: 0.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 2.8,
      });

      // Soft white glow pulse on button outline (external)
      gsap.to(rightRef.current, {
        boxShadow: '0 0 12px rgba(255,255,255,0.4), 0 0 0 1px rgba(255,255,255,0.09)',
        duration: 3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 2.8,
      });
    } else if (!isFirst && animatedRef.current) {
      // Kill animations when leaving first slide
      if (chevronRef.current) gsap.killTweensOf(chevronRef.current);
      if (rightRef.current) gsap.killTweensOf(rightRef.current);
      animatedRef.current = false;
    }
  }, [isFirst]);

  const baseClass =
    'fixed top-1/2 -translate-y-1/2 z-[150] hidden lg:flex flex-col items-center justify-center gap-1 py-3 w-12 rounded-xl bg-white/[0.03] border border-white/[0.09] backdrop-blur-2xl text-white/35 hover:text-white/80 hover:bg-white/[0.10] hover:border-white/20 transition-colors duration-200';
  const labelClass = 'text-[8px] font-mono tracking-[0.3em] uppercase';

  return (
    <>
      {!isFirst && (
        <button
          ref={leftRef}
          onClick={onPrev}
          aria-label="Previous slide"
          className={`${baseClass} left-5`}
          style={{ pointerEvents: canGoPrev ? 'auto' : 'none' }}
          disabled={!canGoPrev}
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
          <span className={labelClass}>PREV</span>
        </button>
      )}

      {!isFirst && (
        <button
          ref={rightRef}
          onClick={isLast ? onExit : onNext}
          aria-label={isLast ? 'Exit proposal' : 'Next slide'}
          className={`${baseClass} right-5`}
          style={{ pointerEvents: (isLast || canGoNext) ? 'auto' : 'none' }}
          disabled={!isLast && !canGoNext}
        >
          {isLast ? (
            <>
              <LogOut size={20} strokeWidth={1.5} />
              <span className={labelClass}>EXIT</span>
            </>
          ) : (
            <>
              <ChevronRight ref={chevronRef} size={20} strokeWidth={1.5} />
              <span className={labelClass}>NEXT</span>
            </>
          )}
        </button>
      )}
    </>
  );
}
