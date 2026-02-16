'use client';

import React, { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ParallaxProviderProps {
  children: React.ReactNode;
}

/**
 * ParallaxProvider - Global parallax animation system
 * Uses data attributes on elements:
 * - data-parallax="trigger" - Enable parallax
 * - data-parallax-start="20" - Y offset start
 * - data-parallax-end="-20" - Y offset end
 * - data-parallax-scrub="true" - Scrub value or true
 */
export function ParallaxProvider({ children }: ParallaxProviderProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const parallaxElements = document.querySelectorAll('[data-parallax="trigger"]');

    parallaxElements.forEach((element) => {
      const start = element.getAttribute('data-parallax-start') || '0';
      const end = element.getAttribute('data-parallax-end') || '0';
      const scrub = element.getAttribute('data-parallax-scrub') === 'true' ? true : false;

      gsap.fromTo(
        element,
        { y: parseInt(start) },
        {
          y: parseInt(end),
          scrollTrigger: {
            trigger: element,
            start: 'top bottom',
            end: 'bottom top',
            scrub: scrub ? 1 : false,
            markers: false,
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return <>{children}</>;
}
