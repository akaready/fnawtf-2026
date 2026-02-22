'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Custom hook for GSAP animations with automatic cleanup
 * @param callback - Animation callback that receives gsap instance
 * @param dependencies - useEffect dependency array
 */
export function useGsap(
  callback: (gsapInstance: any) => void | (() => void),
  dependencies: React.DependencyList = []
) {
  useEffect(() => {
    const cleanup = callback(gsap);

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
      if (typeof window !== 'undefined') {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      }
    };
  }, dependencies);
}
