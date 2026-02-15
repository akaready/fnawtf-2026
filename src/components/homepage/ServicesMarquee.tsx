'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Props for the ServicesMarquee component
 */
interface ServicesMarqueeProps {
  items: string[];
  speed?: number; // pixels per second, default 40 (slower for elegance)
}

/**
 * ServicesMarquee component with proper CSS infinite horizontal scroll.
 * Uses the CSS marquee pattern from _assets/css-marquee.md
 * - Renders duplicated content for seamless loop
 * - Uses translateX(-100%) for seamless animation
 * - Pauses when off-screen for performance
 */
export function ServicesMarquee({
  items,
  speed = 40,
}: ServicesMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current || !segmentRef.current || !trackRef.current) return;

    const segment = segmentRef.current;

    // Calculate animation duration based on width and speed
    const segmentWidth = segment.offsetWidth;
    const duration = segmentWidth / speed;

    trackRef.current.style.animationDuration = `${duration}s`;

    // Create IntersectionObserver to pause when off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isPaused = !entry.isIntersecting;
          if (trackRef.current) {
            trackRef.current.style.animationPlayState = isPaused ? 'paused' : 'running';
          }
        });
      },
      { threshold: 0 }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [prefersReducedMotion, speed]);

  // Create a single item with bullet
  const renderItem = (keyPrefix: string, index: number) => (
    <span
      key={`${keyPrefix}-${index}`}
      className="marquee-css__item whitespace-nowrap font-display text-2xl md:text-3xl text-muted-foreground uppercase tracking-wider"
    >
      {items[index]}
    </span>
  );

  // Create all items for one list
  const renderList = (keyPrefix: string) =>
    items.map((_, index) => (
      <div
        key={`${keyPrefix}-${index}`}
        className={`marquee-css__item-wrapper flex items-center ${index > 0 ? 'gap-6' : ''}`}
      >
        {index > 0 && <span className="marquee-css__bullet text-accent text-xl">•</span>}
        {renderItem(keyPrefix, index)}
      </div>
    ));

  return (
    <section
      className="py-16 overflow-hidden bg-background"
      data-css-marquee
    >
      <div
        ref={containerRef}
        className="marquee-css"
      >
        <div
          ref={trackRef}
          className="marquee-css__track"
          style={{
            animationPlayState: prefersReducedMotion ? 'paused' : 'running',
          }}
        >
          <div ref={segmentRef} className="marquee-css__list" data-css-marquee-list>
            {renderList('original')}
          </div>
          <div className="marquee-css__list" aria-hidden="true">
            {renderList('duplicate')}
          </div>
        </div>
      </div>
    </section>
  );
}
