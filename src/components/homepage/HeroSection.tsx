'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { BackgroundVideo } from '@/components/videos/BackgroundVideo';

interface HeroSectionProps {
  headline: string;
  subheadline: string;
  backgroundVideoSrc: string;
  backgroundPosterSrc?: string;
  locations?: string[];
  children?: React.ReactNode;
}

/**
 * HeroSection - Text reveal with background video
 * Headline and subheadline animate in with stagger effect
 */
export function HeroSection({
  headline,
  subheadline,
  backgroundVideoSrc,
  backgroundPosterSrc,
  locations = ['San Francisco', 'Los Angeles', 'Austin', 'New York', 'Global'],
  children,
}: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const headlineWordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const locationsRef = useRef<HTMLParagraphElement>(null);
  const prefersReducedMotion = useReducedMotion();
  // null = not yet triggered; number = animation delay in seconds
  // null = not yet triggered; number = animate after this delay; 'skip' = show instantly
  const [animationDelay, setAnimationDelay] = useState<number | 'skip' | null>(null);

  // Effect 1: trigger animation right after loader finishes.
  // Falls back to immediate start if no active loader is found.
  useEffect(() => {
    if (sessionStorage.getItem('fna_seen')) {
      setAnimationDelay('skip');
      return;
    }

    const loaderEl = document.querySelector('[data-fna-loader-init]') as HTMLElement | null;
    const loaderIsActive = !!loaderEl && loaderEl.style.display !== 'none';

    if (!loaderIsActive) {
      setAnimationDelay(0);
      return;
    }

    const handle = () => setAnimationDelay(0);
    window.addEventListener('fna-loader-complete', handle, { once: true });
    return () => window.removeEventListener('fna-loader-complete', handle);
  }, []);

  // Effect 2: run the animation once animationDelay is set.
  // Word spans are rendered in JSX (React owns the DOM structure);
  // GSAP only animates their styles — no innerHTML manipulation needed.
  useEffect(() => {
    if (animationDelay === null) return;
    if (!containerRef.current || !headlineRef.current || !subheadlineRef.current || !locationsRef.current) return;

    // Make the h1 container visible (starts opacity-0 in JSX to prevent SSR flash)
    headlineRef.current.style.opacity = '1';

    // Skip mode: show all content instantly (repeat visit, no animation needed)
    if (animationDelay === 'skip') {
      const wordSpans = headlineWordsRef.current.filter(Boolean) as HTMLSpanElement[];
      gsap.set([...wordSpans, subheadlineRef.current], { opacity: 1, y: 0 });
      gsap.set(locationsRef.current.querySelectorAll('span'), { opacity: 1, y: 0 });
      return;
    }

    if (prefersReducedMotion) {
      const wordSpans = headlineWordsRef.current.filter(Boolean) as HTMLSpanElement[];
      gsap.set([...wordSpans, subheadlineRef.current], { opacity: 1, y: 0 });
      const locationSpans = locationsRef.current.querySelectorAll('span');
      gsap.set(locationSpans, { opacity: 1, y: 0 });
      return;
    }

    const wordSpans = headlineWordsRef.current.filter(Boolean) as HTMLSpanElement[];
    const locationSpans = locationsRef.current.querySelectorAll('span');

    const timeline = gsap.timeline({ delay: animationDelay });

    // Animate headline words
    timeline.fromTo(
      wordSpans,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
      0
    );

    // Animate subheadline
    timeline.fromTo(
      subheadlineRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6 },
      0.3
    );

    // Animate locations with stagger
    if (locationSpans.length > 0) {
      timeline.fromTo(
        locationSpans,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.08,
          ease: 'power2.out',
        },
        0.6
      );
    }

    return () => { timeline.kill(); };
  }, [animationDelay, prefersReducedMotion]);

  const headlineWords = headline.split(' ');

  return (
    <section
      ref={containerRef}
      className="relative h-[calc(100dvh+1px)] flex flex-col"
    >
      {/* Background Video with HLS Support */}
      <BackgroundVideo
        videoSrc={backgroundVideoSrc}
        posterSrc={backgroundPosterSrc}
        overlayClassName="bg-black/60"
      />

      {/* Gradient overlay - darker towards bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />

      {/* Content - positioned lower with bottom padding for marquee */}
      <div className="relative z-10 flex-1 flex items-center justify-center pb-32 pt-[30vh]">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          {/* opacity-0 on h1 prevents SSR flash; Effect 2 sets style.opacity=1 before animating */}
          <h1
            ref={headlineRef}
            className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight opacity-0"
          >
            {headlineWords.map((word, i) => (
              <span
                key={i}
                ref={(el) => { headlineWordsRef.current[i] = el; }}
                className="inline-block opacity-0"
                style={{ marginRight: '0.25em' }}
              >
                {word}
              </span>
            ))}
          </h1>

          <p
            ref={subheadlineRef}
            className="font-body text-lg md:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed opacity-0"
          >
            {subheadline}
          </p>

          <p
            ref={locationsRef}
            className="text-sm md:text-base text-muted-foreground pt-8"
          >
            {locations.map((location, index) => (
              <span key={location} className="opacity-0">
                {location}
                {index < locations.length - 1 && ' • '}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* Marquee stuck to absolute bottom with blur backdrop */}
      <div className="absolute bottom-0 left-0 right-0 z-20 w-full backdrop-blur-md">
        {children}
      </div>
    </section>
  );
}
