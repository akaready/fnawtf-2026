'use client';

import { useEffect, useRef, useState, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  once?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: RefObject<HTMLDivElement>;
  isVisible: boolean;
}

/**
 * Hook for lazy loading and scroll-triggered animations
 * @param options - IntersectionObserver options
 * @returns ref and isVisible state
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const { threshold = 0.1, root = null, rootMargin = '0px', once = true } = options;

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        root,
        rootMargin,
      }
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, once]);

  return { ref, isVisible };
}
