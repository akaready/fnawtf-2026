'use client';

import { useEffect, useRef } from 'react';

/**
 * ScrollProgressBar - Fixed progress bar at bottom of viewport
 * Shows scroll progress with purple (#a14dfd) color
 */
export function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!barRef.current) return;

      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / windowHeight) * 100;

      barRef.current.style.width = `${scrolled}%`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={barRef}
      className="fixed top-0 left-0 h-1 bg-accent z-50 pointer-events-none"
      style={{ width: '0%' }}
      aria-hidden="true"
    />
  );
}
