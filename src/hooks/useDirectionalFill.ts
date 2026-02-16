import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface DirectionalFillOptions {
  /**
   * Callback when fill animation starts (on mouse enter)
   */
  onFillStart?: () => void;

  /**
   * Callback when fill animation ends (on mouse leave)
   */
  onFillEnd?: () => void;

  /**
   * Animation duration in seconds
   * @default 0.3
   */
  duration?: number;

  /**
   * GSAP easing function
   * @default 'power2.out'
   */
  ease?: string;
}

/**
 * Custom hook for directional fill animations that follow mouse entry/exit
 *
 * Detects which side the mouse enters from (left/right) and animates a fill
 * element expanding from that direction. On exit, detects which side the mouse
 * leaves from and collapses the fill toward that side.
 *
 * @param containerRef - Ref to the container element (button, card, etc.)
 * @param fillRef - Ref to the fill element (div with scaleX animation)
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const fillRef = useRef<HTMLDivElement>(null);
 *
 * useDirectionalFill(containerRef, fillRef, {
 *   onFillStart: () => console.log('Fill started'),
 *   onFillEnd: () => console.log('Fill ended')
 * });
 *
 * return (
 *   <div ref={containerRef} className="relative">
 *     <div ref={fillRef} className="absolute inset-0 bg-white"
 *          style={{ transform: 'scaleX(0)' }} />
 *     Content here
 *   </div>
 * );
 * ```
 */
export function useDirectionalFill<
  TContainer extends HTMLElement,
  TFill extends HTMLElement
>(
  containerRef: React.RefObject<TContainer>,
  fillRef: React.RefObject<TFill>,
  options: DirectionalFillOptions = {}
) {
  const {
    onFillStart,
    onFillEnd,
    duration = 0.3,
    ease = 'power2.out'
  } = options;

  const isHoveredRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    const fill = fillRef.current;

    if (!container || !fill) return;

    const handleMouseEnter = (e: MouseEvent) => {
      if (isHoveredRef.current) return;
      isHoveredRef.current = true;

      // Detect entry direction (left or right)
      const rect = container.getBoundingClientRect();
      const x = (e.clientX || e.pageX) - rect.left;
      const entryDirection = x < rect.width / 2 ? 'left' : 'right';

      gsap.killTweensOf(fill);

      // Animate fill expanding from entry direction
      if (entryDirection === 'left') {
        gsap.fromTo(
          fill,
          { scaleX: 0, transformOrigin: '0 50%' },
          { scaleX: 1, duration, ease }
        );
      } else {
        gsap.fromTo(
          fill,
          { scaleX: 0, transformOrigin: '100% 50%' },
          { scaleX: 1, duration, ease }
        );
      }

      onFillStart?.();
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (!isHoveredRef.current) return;
      isHoveredRef.current = false;

      // Detect exit direction (left or right)
      const rect = container.getBoundingClientRect();
      const x = (e.clientX || e.pageX) - rect.left;
      const exitDirection = x < rect.width / 2 ? 'left' : 'right';

      gsap.killTweensOf(fill);

      // Animate fill collapsing toward exit direction
      if (exitDirection === 'left') {
        gsap.to(fill, {
          scaleX: 0,
          transformOrigin: '0 50%',
          duration,
          ease
        });
      } else {
        gsap.to(fill, {
          scaleX: 0,
          transformOrigin: '100% 50%',
          duration,
          ease
        });
      }

      onFillEnd?.();
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [containerRef, fillRef, duration, ease, onFillStart, onFillEnd]);
}
