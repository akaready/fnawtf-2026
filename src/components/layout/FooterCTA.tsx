'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';

/**
 * Props for the FooterCTA component
 */
interface FooterCTAProps {
  headline: string;
  calcomUsername?: string;
}

/**
 * FooterCTA component displaying a call-to-action with Cal.com booking integration.
 * Features large typography and scroll reveal animation.
 */
export function FooterCTA({ headline, calcomUsername = 'fna' }: FooterCTAProps) {
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Build Cal.com booking URL
  const bookingUrl = `https://cal.com/${calcomUsername}`;

  return (
    <section className="py-24 md:py-32 bg-background text-foreground border-t border-border" data-reveal-group>
      <div
        ref={containerRef}
        className="max-w-4xl mx-auto px-6 text-center"
      >
        {/* Headline */}
        <h2
          className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
          data-reveal-group-nested
          style={{
            opacity: prefersReducedMotion ? 1 : 0,
            transform: prefersReducedMotion ? 'none' : 'translateY(2em)',
          }}
        >
          {headline}
        </h2>

        {/* CTA Button */}
        <div
          className="mt-8 md:mt-12"
          data-reveal-group-nested
          style={{
            opacity: prefersReducedMotion ? 1 : 0,
            transform: prefersReducedMotion ? 'none' : 'translateY(2em)',
            transition: prefersReducedMotion ? 'none' : 'opacity 0.6s 0.2s, transform 0.6s 0.2s',
          }}
        >
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-accent text-accent-foreground font-display font-semibold text-lg rounded-full hover:bg-purple-500 transition-colors duration-300"
          >
            <Calendar className="w-5 h-5" />
            Schedule a call
          </a>
        </div>

        {/* Subtext */}
        <p
          className="mt-6 text-sm opacity-70"
          data-reveal-group-nested
          style={{
            opacity: prefersReducedMotion ? 0.7 : 0,
            transition: prefersReducedMotion ? 'none' : 'opacity 0.6s 0.4s',
          }}
        >
          No commitment required. We'll chat about your project and see if we're a good fit.
        </p>
      </div>
    </section>
  );
}
