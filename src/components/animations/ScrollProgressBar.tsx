'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Scroll Progress Bar
 * 
 * A fixed progress bar at the top of the viewport that shows scroll progress.
 * - Click-to-scroll functionality
 * - Purple accent color (#a14dfd)
 * - Uses GSAP ScrollTrigger for smooth animation
 * 
 * Based on: _assets/scroll-progress-bar.md
 */

export interface ScrollProgressBarProps {
  /** Color of the progress bar (default: #a14dfd - FNA purple) */
  color?: string;
  /** Height of the progress bar in pixels (default: 4) */
  height?: number;
  /** Enable click-to-scroll functionality (default: true) */
  clickToScroll?: boolean;
  /** Smoothness of the bar catching up (default: 0.5) */
  scrub?: number;
}

export function ScrollProgressBar({
  color = '#a14dfd',
  height = 4,
  clickToScroll = true,
  scrub = 0.3,
}: ScrollProgressBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !barRef.current) return;

    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Animate the progress bar as you scroll
      gsap.fromTo(
        barRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            scrub,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [mounted, scrub]);

  // Handle click-to-scroll
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!clickToScroll) return;

    const clickX = event.clientX;
    const progress = clickX / window.innerWidth;
    const scrollPosition = progress * (document.body.scrollHeight - window.innerHeight);

    gsap.to(window, {
      scrollTo: scrollPosition,
      duration: 0.725,
      ease: 'power3.out',
    });
  };

  return (
    <div
      ref={containerRef}
      className="progress-bar-wrap fixed inset-x-0 top-0 z-50 cursor-pointer"
      style={{ height: `${height}px` }}
      onClick={handleClick}
      role="progressbar"
      aria-valuenow={0}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Background track */}
      <div
        className="absolute inset-0 transition-opacity duration-200 hover:opacity-100 opacity-30"
        style={{ backgroundColor: `${color}20` }}
      />
      
      {/* Progress bar fill */}
      <div
        ref={barRef}
        className="progress-bar absolute inset-y-0 left-0 origin-left"
        style={{
          backgroundColor: color,
          height: '100%',
          width: '100%',
          transformOrigin: '0% 50%',
          transform: 'scaleX(0)',
        }}
      />
    </div>
  );
}

export default ScrollProgressBar;
