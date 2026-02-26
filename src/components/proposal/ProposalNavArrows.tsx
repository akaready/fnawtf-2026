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
  isHighlighted?: boolean; // true on first slide they land on — bright intro, then permanently dim
  onExit?: () => void;
}

const BRIGHT = { backgroundColor: '#ffffff',               color: '#000000',              borderColor: 'rgba(255,255,255,0)' };
const DIM    = { backgroundColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.18)' };

export function ProposalNavArrows({ onPrev, onNext, canGoPrev, canGoNext, isFirst, isLast, isHighlighted = false, onExit }: Props) {
  const leftRef    = useRef<HTMLButtonElement>(null);
  const rightRef   = useRef<HTMLButtonElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);
  const hasEnteredRef = useRef(false);

  // Set initial state off-screen on mount
  useEffect(() => {
    if (leftRef.current)  gsap.set(leftRef.current,  { x: -150, opacity: 0, ...BRIGHT, borderColor: BRIGHT.borderColor });
    if (rightRef.current) gsap.set(rightRef.current, { x:  150, opacity: 0, ...BRIGHT, borderColor: BRIGHT.borderColor });
  }, []);

  // Animate in/out based on isFirst
  useEffect(() => {
    if (isFirst) {
      if (!hasEnteredRef.current) return; // Initial load on title — already off-screen
      // Animate back off the edges
      if (leftRef.current)  gsap.to(leftRef.current,  { x: -150, opacity: 0, duration: 0.45, ease: 'power3.in' });
      if (rightRef.current) gsap.to(rightRef.current, { x:  150, opacity: 0, duration: 0.45, ease: 'power3.in' });
    } else {
      const isFirstEntry = !hasEnteredRef.current;
      hasEnteredRef.current = true;
      const delay = isFirstEntry ? 1.5 : 0.05;
      if (leftRef.current) {
        gsap.set(leftRef.current, { x: -150, opacity: 0 });
        gsap.to(leftRef.current, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay });
      }
      if (rightRef.current) {
        gsap.set(rightRef.current, { x: 150, opacity: 0 });
        gsap.to(rightRef.current, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: delay + 0.2 });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirst]);

  // Animate color/background on highlight change
  useEffect(() => {
    const targets = [leftRef.current, rightRef.current].filter(Boolean);
    if (!targets.length) return;
    gsap.to(targets, { ...(isHighlighted ? BRIGHT : DIM), duration: 0.45, ease: 'power2.out' });
  }, [isHighlighted]);

  const handleEnter = (ref: React.RefObject<HTMLButtonElement>) => {
    if (!ref.current) return;
    if (isHighlighted) {
      gsap.to(ref.current, { backgroundColor: 'rgba(255,255,255,0.72)', duration: 0.18 });
    } else {
      gsap.to(ref.current, { backgroundColor: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.85)', duration: 0.18 });
    }
  };

  const handleLeave = (ref: React.RefObject<HTMLButtonElement>) => {
    if (!ref.current) return;
    gsap.to(ref.current, { ...(isHighlighted ? BRIGHT : DIM), duration: 0.2 });
  };

  const baseClass =
    'fixed top-1/2 -translate-y-1/2 z-[150] hidden lg:flex flex-col items-center justify-center gap-1 py-3 w-12 rounded-xl border backdrop-blur-lg';
  const labelClass = 'text-[8px] font-mono tracking-[0.3em] uppercase';

  return (
    <>
      <button
        ref={leftRef}
        onClick={onPrev}
        aria-label="Previous slide"
        className={`${baseClass} left-5`}
        style={{ pointerEvents: (!isFirst && canGoPrev) ? 'auto' : 'none' }}
        disabled={!!isFirst || !canGoPrev}
        onMouseEnter={() => handleEnter(leftRef)}
        onMouseLeave={() => handleLeave(leftRef)}
      >
        <ChevronLeft size={20} strokeWidth={1.5} />
        <span className={labelClass}>PREV</span>
      </button>

      <button
        ref={rightRef}
        onClick={isLast ? onExit : onNext}
        aria-label={isLast ? 'Exit proposal' : 'Next slide'}
        className={`${baseClass} right-5`}
        style={{ pointerEvents: (!isFirst && (isLast || canGoNext)) ? 'auto' : 'none' }}
        disabled={!!isFirst || (!isLast && !canGoNext)}
        onMouseEnter={() => handleEnter(rightRef)}
        onMouseLeave={() => handleLeave(rightRef)}
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
    </>
  );
}
