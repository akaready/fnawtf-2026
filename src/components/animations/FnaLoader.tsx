'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface FnaLoaderProps {
  onComplete?: () => void;
  previewImageSrc?: string;
}

/**
 * FnaLoader - Modified Willem loading animation
 * Text "fna.wtf" appears, dot expands to preview box, site reveals
 */
export function FnaLoader({ onComplete, previewImageSrc: _previewImageSrc }: FnaLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isComplete, setIsComplete] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!containerRef.current || isComplete) return;

    const text = 'fna.wtf';
    const letters = text.split('');
    let dotIndex = text.indexOf('.');

    // Create letters
    const container = containerRef.current;
    container.innerHTML = '';

    letters.forEach((letter, index) => {
      const span = document.createElement('span');
      span.textContent = letter;
      span.className = 'fna-loader__letter';
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.setAttribute('data-fna-letter', index.toString());
      container.appendChild(span);
    });

    if (prefersReducedMotion) {
      // Skip animation for reduced motion
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const timeline = gsap.timeline({
      onComplete: () => {
        setIsComplete(true);
        onComplete?.();
      },
    });

    // Phase 1: Letters appear with stagger
    const letterElements = container.querySelectorAll('.fna-loader__letter');
    timeline.fromTo(
      letterElements,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
      0
    );

    // Phase 2: Text holds for 1 second
    timeline.to({}, {}, 0.8);

    // Phase 3: Dot becomes a circle and expands
    const dotElement = letterElements[dotIndex];
    timeline.fromTo(
      dotElement,
      { scale: 1 },
      { scale: 2, duration: 0.4 },
      1
    );

    // Phase 4: Dot expands into preview box (container scales down)
    timeline.to(
      container,
      {
        scale: 0.1,
        opacity: 0,
        duration: 0.6,
      },
      1.2
    );

    return () => {
      timeline.kill();
    };
  }, [onComplete, prefersReducedMotion, isComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      data-fna-loader-init
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: '4rem',
        fontWeight: 700,
        color: 'var(--accent)',
        display: isComplete ? 'none' : 'flex',
      }}
    />
  );
}
