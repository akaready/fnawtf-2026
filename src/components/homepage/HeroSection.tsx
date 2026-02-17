'use client';

import { useEffect, useRef } from 'react';
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
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const locationsRef = useRef<HTMLParagraphElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!containerRef.current || !headlineRef.current || !subheadlineRef.current || !locationsRef.current) return;

    if (prefersReducedMotion) {
      // Show content immediately without animation
      gsap.set([headlineRef.current, subheadlineRef.current], { opacity: 1, y: 0 });
      const locationSpans = locationsRef.current.querySelectorAll('span');
      gsap.set(locationSpans, { opacity: 1, y: 0 });
      return;
    }

    const timeline = gsap.timeline({ delay: 1 });

    // Split text into words for stagger effect
    const headlineWords = headline.split(' ');
    const headlineSpans = headlineWords.map((word) => {
      const span = document.createElement('span');
      span.textContent = word;
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateY(20px)';
      span.style.marginRight = '0.25em';
      return span;
    });

    if (headlineRef.current) {
      headlineRef.current.innerHTML = '';
      headlineSpans.forEach((span) => headlineRef.current?.appendChild(span));
    }

    // Animate headline words
    timeline.fromTo(
      headlineSpans,
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
    const locationSpans = locationsRef.current.querySelectorAll('span');
    if (locationSpans.length > 0) {
      timeline.fromTo(
        locationSpans,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.08,
          ease: 'power2.out'
        },
        0.6  // Start 0.6s into timeline (after subheadline begins)
      );
    }

    return () => {
      timeline.kill();
    };
  }, []);

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
        <h1
          ref={headlineRef}
          className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight"
        >
          {headline}
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
              <span key={location} style={{ opacity: 0 }}>
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
