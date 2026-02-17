'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ServicesMarqueeProps {
  items?: string[];
  speed?: number; // pixels per second
}

const defaultItems = [
  'digital storytelling',
  'branding',
  'video production',
  'pitch videos',
  'launch pages',
  'copywriting',
  'ai integrations',
  'automations',
];

/**
 * ServicesMarquee - Infinite horizontal scroll with services
 * Uses CSS animations for smooth, uninterrupted scrolling
 */
export function ServicesMarquee({
  items = defaultItems,
  speed = 75,
}: ServicesMarqueeProps) {
  const setRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [animationDuration, setAnimationDuration] = useState(20);

  useEffect(() => {
    if (!setRef.current || prefersReducedMotion) return;

    // Calculate duration based on content width and speed
    const setWidth = setRef.current.offsetWidth;
    if (setWidth > 0) {
      const duration = setWidth / speed;
      setAnimationDuration(duration);
    }
  }, [speed, prefersReducedMotion, items]);

  const renderItems = useCallback(
    () =>
      items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex-shrink-0 text-lg md:text-xl font-body text-foreground"
        >
          <span className="text-accent mx-4">•</span>
          {item}
        </div>
      )),
    [items]
  );

  return (
    <div className="w-full overflow-hidden bg-background border-y border-border py-8">
      <div
        className="flex whitespace-nowrap w-max will-change-transform"
        style={{
          animation: prefersReducedMotion ? 'none' : `marquee ${animationDuration}s linear infinite`,
        }}
      >
        <div ref={setRef} className="flex whitespace-nowrap flex-shrink-0">
          {renderItems()}
        </div>
        <div className="flex whitespace-nowrap flex-shrink-0">
          {renderItems()}
        </div>
        <div className="flex whitespace-nowrap flex-shrink-0">
          {renderItems()}
        </div>
        <div className="flex whitespace-nowrap flex-shrink-0">
          {renderItems()}
        </div>
      </div>
    </div>
  );
}
