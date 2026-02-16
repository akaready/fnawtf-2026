'use client';

import { useEffect, useRef } from 'react';

/**
 * ScrollProgressRight - Fixed vertical progress bar on right edge
 * Grows from top to bottom matching the horizontal ScrollProgressBar
 * Includes a 1px border on the left edge of the track
 */
export function ScrollProgressRight() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!barRef.current) return;

      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / windowHeight) * 100;

      barRef.current.style.height = `${scrolled}%`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* 1px border line at right edge */}
      <div
        className="fixed top-0 right-[7px] w-px h-full z-50 pointer-events-none"
        style={{ backgroundColor: '#262626' }}
        aria-hidden="true"
      />
      {/* Track background */}
      <div
        className="fixed top-0 right-0 w-[7px] h-full z-50 pointer-events-none"
        style={{ backgroundColor: '#0a0a0b' }}
        aria-hidden="true"
      />
      {/* Progress thumb - grows from top */}
      <div
        ref={barRef}
        className="fixed top-0 right-0 w-[7px] z-50 pointer-events-none"
        style={{ height: '0%', backgroundColor: '#a14dfd' }}
        aria-hidden="true"
      />
    </>
  );
}
