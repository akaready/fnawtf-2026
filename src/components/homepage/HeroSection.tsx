'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

/**
 * Props for the HeroSection component
 */
interface HeroSectionProps {
  headline: string;
  subheadline: string;
  backgroundVideoSrc: string;
}

/**
 * HeroSection component with GSAP text reveal animation and video background.
 * 
 * Features:
 * - Video background with dark overlay
 * - Text reveal animation on mount
 * - Reduced motion support
 */
export function HeroSection({
  headline,
  subheadline,
  backgroundVideoSrc,
}: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      // Show content immediately for reduced motion
      if (headlineRef.current) {
        gsap.set(headlineRef.current, { opacity: 1, y: 0 });
      }
      if (subheadlineRef.current) {
        gsap.set(subheadlineRef.current, { opacity: 1, y: 0 });
      }
      return;
    }

    const ctx = gsap.context(() => {
      // Initial state - hidden
      gsap.set(headlineRef.current, { opacity: 0, y: 60 });
      gsap.set(subheadlineRef.current, { opacity: 0, y: 40 });

      // Animate headline
      gsap.to(headlineRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        delay: 0.3,
      });

      // Animate subheadline
      gsap.to(subheadlineRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.6,
      });
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      data-hero-section
      data-parallax="trigger"
      data-parallax-start="8"
      data-parallax-end="-8"
      data-parallax-scrub="0.8"
    >
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setVideoLoaded(true)}
          poster="/images/hero-poster.jpg"
        >
          <source src={backgroundVideoSrc} type="video/mp4" />
        </video>
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-background/70" />
        
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center" data-reveal-group>
        {/* Headline */}
        <h1
          ref={headlineRef}
          className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight"
          data-reveal-group-nested
        >
          {headline}
        </h1>

        {/* Subheadline */}
        <p
          ref={subheadlineRef}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          data-reveal-group-nested
        >
          {subheadline}
        </p>

        {/* Scroll indicator */}
        <div
          className={`mt-12 flex justify-center ${videoLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
          data-reveal-group-nested
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground animate-bounce">
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <div className="w-6 h-10 border-2 border-current rounded-full flex justify-center pt-2">
              <div className="w-1 h-2 bg-current rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
