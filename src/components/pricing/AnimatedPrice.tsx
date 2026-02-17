'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useCountUpAnimation } from '@/hooks/useCountUpAnimation';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedPriceProps {
  /**
   * Numeric price value to count up to
   */
  priceNumber?: number;

  /**
   * Fallback string to display if no priceNumber
   */
  priceString: string;

  /**
   * Whether to trigger the animation
   */
  trigger: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Component that animates a price counting up from 0 to the target value,
 * then pops in a plus symbol with a bounce effect.
 *
 * Falls back to static display if no numeric price is provided.
 *
 * @example
 * ```tsx
 * <AnimatedPrice
 *   priceNumber={5000}
 *   priceString="$5,000+"
 *   trigger={isVisible}
 *   className="text-4xl font-bold"
 * />
 * ```
 */
export function AnimatedPrice({
  priceNumber,
  priceString,
  trigger,
  className,
}: AnimatedPriceProps) {
  const plusRef = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { displayValue, isComplete } = useCountUpAnimation({
    targetValue: priceNumber || 0,
    duration: 1.2,
    ease: 'power2.out',
    trigger: trigger && !!priceNumber,
  });

  // Animate "+" symbol pop-in when count completes
  useEffect(() => {
    if (!isComplete || !plusRef.current || !priceNumber) return;

    if (prefersReducedMotion) {
      // Instantly show the plus symbol
      gsap.set(plusRef.current, { scale: 1, opacity: 1 });
      return;
    }

    // Animate with bounce effect
    gsap.fromTo(
      plusRef.current,
      { scale: 0, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: 'back.out(2)',
        delay: 0.05,
      }
    );
  }, [isComplete, prefersReducedMotion, priceNumber]);

  // If no numeric price, show string directly (e.g., "Contact Us")
  if (!priceNumber) {
    return <div className={className} data-price>{priceString}</div>;
  }

  return (
    <div className={className} data-price>
      {trigger ? displayValue : '$0'}
      <span
        ref={plusRef}
        style={{
          opacity: prefersReducedMotion ? 1 : isComplete ? 1 : 0,
          display: 'inline-block',
        }}
      >
        +
      </span>
    </div>
  );
}
